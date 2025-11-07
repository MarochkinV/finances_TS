import {AuthUtils} from "../../utils/auth-utils";
import {HttpUtils} from "../../utils/http-utils";
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';

export class Logout {
    readonly openNewRoute: OpenNewRouteCallback;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;

        // Проверка, на то если пользователь уже залогинен, если нет, то отправляем его на страницу login
        if (!AuthUtils.getAuthInfo(AuthUtils.accessTokenKey) || !AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey)) {
            void this.openNewRoute('/login');
            return;
        }

        AuthUtils.removeAuthInfo();

        // Удаляем данные пользователя из localStorage при выходе из системы
        localStorage.removeItem('userData');

        void this.logout();

    }

    // Функция для разлогинивания пользователя
    async logout(): Promise<void> {

        // Данные для запроса
        const refreshToken: string | null = AuthUtils.getAuthInfo(AuthUtils.refreshTokenKey);

        try {
            if (!refreshToken) {
                console.warn("Refresh token отсутствует при попытке logout. Выполняем локальный logout.");
            } else {
                const result: HttpUtilsResult<unknown> = await HttpUtils.request<unknown>('/logout', 'POST', false, {
                    refreshToken: refreshToken,
                });

                if (result.error) {
                    console.error("Ошибка при logout на сервере:", result.response);

                }

                if (result.redirect) {
                    await this.openNewRoute(result.redirect);
                    return;
                }
            }

            AuthUtils.removeAuthInfo();

            // Удаляем данные пользователя из localStorage при выходе из системы
            localStorage.removeItem('userData');

            // Перевод пользователя на страницу /login
            await this.openNewRoute('/login');
        } catch (error: unknown) {
            console.error("Произошла ошибка при попытке logout:", error);

            AuthUtils.removeAuthInfo();
            localStorage.removeItem('userData');

            await this.openNewRoute('/login');
        }
    }
}