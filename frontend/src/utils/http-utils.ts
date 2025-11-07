import config from "../config/config";
import {AuthUtils} from "./auth-utils";
import type {HttpUtilsResult, RequestHeaders, RequestParams} from '../types/http-utils.types';

export class HttpUtils {

    static async request<T = unknown>(
        url: string,
        method: string = "GET",
        useAuth: boolean = true,
        body: unknown = null
    ): Promise<HttpUtilsResult<T>> {
        const result: HttpUtilsResult<T> = {
            error: false,
            response: null,
            redirect: null
        };

        const params: RequestParams = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            } as RequestHeaders
        };

        if (useAuth) {
            const accessToken: string | null = AuthUtils.getAuthInfo(AuthUtils.accessTokenKey);
            const refreshToken: string | null = AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey);

            if (!accessToken) {
                if (!refreshToken) {
                    result.error = true;
                    result.redirect = "/login";
                    return result;
                } else {
                    const updated: boolean = await AuthUtils.updateRefreshToken();
                    if (!updated) {
                        result.error = true;
                        result.redirect = "/login";
                        return result;
                    }

                    const newAccessToken: string | null = AuthUtils.getAuthInfo(AuthUtils.accessTokenKey);
                    if (newAccessToken) {
                        params.headers['x-auth-token'] = newAccessToken;
                    } else {
                        result.error = true;
                        result.redirect = "/login";
                        return result;
                    }
                }
            } else {
                params.headers['x-auth-token'] = accessToken;
            }
        }

        if (body) {
            params.body = JSON.stringify(body);
        }

        let response: Response | null = null;
        try {
            response = await fetch(config.api + url, params);
            result.response = await response.json() as T;
        } catch (e: unknown) {
            console.error("Ошибка при выполнении запроса:", e);
            result.error = true;
            return result;
        }

        // Обработка ошибок
        if (response.status < 200 || response.status >= 300) {
            result.error = true;

            if (useAuth && response.status === 401) {
                const refreshToken: string | null = AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey);

                if (refreshToken) {
                    const updated: boolean = await AuthUtils.updateRefreshToken();

                    if (updated) {
                        const newAccessToken: string | null = AuthUtils.getAuthInfo(AuthUtils.accessTokenKey);

                        if (newAccessToken) {
                            params.headers['x-auth-token'] = newAccessToken;

                            try {
                                response = await fetch(config.api + url, params);
                                result.response = await response.json() as T;

                                if (response.status >= 200 && response.status < 300) {
                                    result.error = false;
                                }
                            } catch (retryError: unknown) {
                                console.error("Ошибка при повторной попытке запроса:", retryError);
                                result.error = true;
                            }
                        } else {
                            AuthUtils.removeAuthInfo();
                            localStorage.removeItem('userData');
                            result.redirect = "/login";
                        }
                    } else {
                        AuthUtils.removeAuthInfo();
                        localStorage.removeItem('userData');
                        result.redirect = "/login";
                    }
                } else {
                    AuthUtils.removeAuthInfo();
                    localStorage.removeItem('userData');
                    result.redirect = "/login";
                }
            }
        }
        return result;
    }
}