import {HttpUtils} from "./http-utils";
import type {RefreshTokenResponse, UserInfo} from '../types/auth-utils.types';
import type {HttpUtilsResult} from "../types/http-utils.types";

export class AuthUtils {
    static accessTokenKey: string = 'accessToken';
    static refreshTokenKey: string = 'refreshToken';
    static userInfoTokenKey: string = 'userInfo';

    private static refreshPromise: Promise<boolean> | null = null;

    static setAuthInfo(accessToken: string, refreshToken: string, userInfo: UserInfo | null = null): void {
        localStorage.setItem(this.accessTokenKey, accessToken);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        if (userInfo) {
            localStorage.setItem(this.userInfoTokenKey, JSON.stringify(userInfo));
        }
    }

    static removeAuthInfo(): void {
        localStorage.removeItem(this.accessTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userInfoTokenKey);
    }

    static getAuthInfo(key: string): string | null;
    static getAuthInfo(key: string | null = null): string | null | Record<string, string | null> {
        if (key && [this.accessTokenKey, this.refreshTokenKey, this.userInfoTokenKey].includes(key)) {
            return localStorage.getItem(key);
        } else {
            return {
                [this.accessTokenKey]: localStorage.getItem(this.accessTokenKey),
                [this.refreshTokenKey]: localStorage.getItem(this.refreshTokenKey),
                [this.userInfoTokenKey]: localStorage.getItem(this.userInfoTokenKey),
            };
        }
    }


    static async updateRefreshToken(): Promise<boolean> {
        if (this.refreshPromise) {
            return await this.refreshPromise;
        }

        const refreshToken: string | null = this.getAuthInfo(this.refreshTokenKey);
        if (!refreshToken) {
            this.removeAuthInfo();
            return false;
        }

        this.refreshPromise = this._performTokenRefresh(refreshToken);

        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    private static async _performTokenRefresh(refreshToken: string): Promise<boolean> {
        const result: HttpUtilsResult<RefreshTokenResponse> = await HttpUtils.request<RefreshTokenResponse>('/refresh', 'POST', false, {
            refreshToken: refreshToken,
            rememberMe: false
        });

        if (
            result.error ||
            !result.response?.tokens?.accessToken ||
            !result.response?.tokens?.refreshToken
        ) {
            this.removeAuthInfo();
            return false;
        }

        this.setAuthInfo(
            result.response.tokens.accessToken,
            result.response.tokens.refreshToken
        );
        return true;
    }
}