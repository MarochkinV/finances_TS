import {AuthUtils} from "../../utils/auth-utils";
import {HttpUtils} from "../../utils/http-utils";
import type {
    FormInputElementForLogin,
    ErrorDisplayElement,
    LoginRequestData,
    LoginResponseData
} from '../../types/login-signup-logout.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {OpenNewRouteCallback} from '../../types/router.types';

export class Login {
    readonly openNewRoute: OpenNewRouteCallback;
    readonly emailElement!: FormInputElementForLogin | null;
    readonly passwordElement!: FormInputElementForLogin | null;
    readonly rememberMeElement!: HTMLInputElement | null;
    readonly commonErrorElement!: ErrorDisplayElement | null;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;

        if (AuthUtils.getAuthInfo(AuthUtils.accessTokenKey)) {
            void this.openNewRoute('/');
            return;
        }

        this.emailElement = document.getElementById("email") as FormInputElementForLogin | null;
        this.passwordElement = document.getElementById("password") as FormInputElementForLogin | null;
        this.rememberMeElement = document.getElementById("remember-me") as HTMLInputElement | null;
        this.commonErrorElement = document.getElementById("common-error");

        const processButtonElement: HTMLElement | null = document.getElementById("process-button");
        if (processButtonElement) {
            processButtonElement.addEventListener("click", this.login.bind(this));
        } else {
            console.error("Элемент с id 'process-button' не найден.");
        }
    }

    validateForm(): boolean {
        let isValid: boolean = true;

        if (this.emailElement && this.emailElement.value && this.emailElement.value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            this.emailElement.classList.remove("is-invalid");
        } else if (this.emailElement) {
            this.emailElement.classList.add("is-invalid");
            isValid = false;
        } else {
            console.warn("Элемент email не найден при валидации.");
            isValid = false;
        }

        if (this.passwordElement && this.passwordElement.value) {
            this.passwordElement.classList.remove("is-invalid");
        } else if (this.passwordElement) {
            this.passwordElement.classList.add("is-invalid");
            isValid = false;
        } else {
            console.warn("Элемент password не найден при валидации.");
            isValid = false;
        }

        return isValid;
    }

    async login(): Promise<void> {
        if (this.commonErrorElement) {
            this.commonErrorElement.style.display = "none";
        } else {
            console.error("Элемент общей ошибки не найден.");
            return;
        }

        if (this.validateForm()) {
            const requestData: LoginRequestData = {
                email: this.emailElement?.value || '',
                password: this.passwordElement?.value || '',
                rememberMe: this.rememberMeElement ? this.rememberMeElement.checked : false
            };

            try {
                const result: HttpUtilsResult<LoginResponseData> = await HttpUtils.request<LoginResponseData>('/login', 'POST', false, requestData);

                if (result.error || !result.response || !result.response.tokens || !result.response.tokens.accessToken ||
                    !result.response.tokens.refreshToken || !result.response.user ||
                    !result.response.user.id || !result.response.user.name) {
                    this.commonErrorElement.style.display = "block";
                    return;
                }

                AuthUtils.setAuthInfo(result.response.tokens.accessToken, result.response.tokens.refreshToken, {
                    id: result.response.user.id,
                    name: result.response.user.name
                });

                const userData = {
                    name: result.response.user.name,
                    email: result.response.user.email,
                    id: result.response.user.id,
                    ...(result.response.user.lastName && {lastName: result.response.user.lastName}),
                    ...(result.response.user.lastName && {fullName: `${result.response.user.name} ${result.response.user.lastName}`})
                };

                localStorage.setItem('userData', JSON.stringify(userData));

                await this.openNewRoute('/');
            } catch (error: unknown) {
                console.error("Произошла ошибка при попытке входа:", error);
                if (this.commonErrorElement) {
                    this.commonErrorElement.style.display = "block";
                }
            }
        }
    }
}