import {AuthUtils} from "../../utils/auth-utils";
import {HttpUtils} from "../../utils/http-utils";
import type {
    FormInputElementForSignUp,
    ErrorDisplayElement,
    SignUpRequestData,
    SignUpResponseData
} from '../../types/login-signup-logout.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {LoginResponseData} from '../../types/login-signup-logout.types';

export class SignUp {
    readonly openNewRoute: OpenNewRouteCallback;
    readonly nameElement!: FormInputElementForSignUp | null;
    readonly lastNameElement!: FormInputElementForSignUp | null;
    readonly emailElement!: FormInputElementForSignUp | null;
    readonly passwordElement!: FormInputElementForSignUp | null;
    readonly passwordRepeatElement!: FormInputElementForSignUp | null;
    readonly commonErrorElement!: ErrorDisplayElement | null;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;

        // Проверка, если пользователь уже залогинен, то отправляем его на главную страницу
        if (AuthUtils.getAuthInfo(AuthUtils.accessTokenKey)) {
            void this.openNewRoute('/');
            return;
        }

        this.nameElement = document.getElementById("name") as FormInputElementForSignUp | null;
        this.lastNameElement = document.getElementById("last-name") as FormInputElementForSignUp | null;
        this.emailElement = document.getElementById("email") as FormInputElementForSignUp | null;
        this.passwordElement = document.getElementById("password") as FormInputElementForSignUp | null;
        this.passwordRepeatElement = document.getElementById("password-repeat") as FormInputElementForSignUp | null;
        this.commonErrorElement = document.getElementById("common-error");

        const processButtonElement: HTMLElement | null = document.getElementById("process-button");
        if (processButtonElement) {
            processButtonElement.addEventListener("click", this.signUp.bind(this));
        } else {
            console.error("Элемент с id 'process-button' не найден.");
        }
    }

    // Валидация
    validateForm(): boolean {
        let isValid: boolean = true;

        if (this.nameElement && this.nameElement.value) {
            this.nameElement.classList.remove("is-invalid");
        } else if (this.nameElement) {
            this.nameElement.classList.add("is-invalid");
            isValid = false;
        } else {
            console.warn("Элемент name не найден при валидации.");
            isValid = false;
        }

        if (this.lastNameElement && this.lastNameElement.value) {
            this.lastNameElement.classList.remove("is-invalid");
        } else if (this.lastNameElement) {
            this.lastNameElement.classList.add("is-invalid");
            isValid = false;
        } else {
            console.warn("Элемент lastName не найден при валидации.");
            isValid = false;
        }

        if (this.emailElement && this.emailElement.value && this.emailElement.value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            this.emailElement.classList.remove("is-invalid");
        } else if (this.emailElement) {
            this.emailElement.classList.add("is-invalid");
            isValid = false;
        } else {
            console.warn("Элемент email не найден при валидации.");
            isValid = false;
        }

        if (this.passwordElement && this.passwordElement.value && this.passwordElement.value.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/)) {
            this.passwordElement.classList.remove("is-invalid");
        } else if (this.passwordElement) {
            this.passwordElement.classList.add("is-invalid");
            isValid = false;
        } else {
            console.warn("Элемент password не найден при валидации.");
            isValid = false;
        }

        if (this.passwordRepeatElement && this.passwordRepeatElement.value && this.passwordRepeatElement.value === this.passwordElement?.value) {
            this.passwordRepeatElement.classList.remove("is-invalid");
        } else if (this.passwordRepeatElement) {
            this.passwordRepeatElement.classList.add("is-invalid");
            isValid = false;
        } else {
            console.warn("Элемент password-repeat не найден при валидации.");
            isValid = false;
        }

        return isValid;
    }

    async signUp(): Promise<void> {
        if (this.commonErrorElement) {
            this.commonErrorElement.style.display = "none";
        } else {
            console.error("Элемент общей ошибки не найден.");
            return;
        }

        if (this.validateForm()) {
            const requestData: SignUpRequestData = {
                name: this.nameElement?.value || '',
                lastName: this.lastNameElement?.value || '',
                email: this.emailElement?.value || '',
                password: this.passwordElement?.value || '',
                passwordRepeat: this.passwordRepeatElement?.value || ''
            };

            try {
                const result: HttpUtilsResult<SignUpResponseData> = await HttpUtils.request<SignUpResponseData>('/signup', 'POST', false, requestData);

                if (result.redirect) {
                    window.location.href = result.redirect;
                    return;
                }

                if (result.error || !result.response || !result.response.user || !result.response.user.id || !result.response.user.name) {
                    this.commonErrorElement.style.display = "block";
                    return;
                }

                const loginRequestData = {
                    email: this.emailElement!.value,
                    password: this.passwordElement!.value,
                    rememberMe: false
                };

                const resultLogin: HttpUtilsResult<LoginResponseData> = await HttpUtils.request<LoginResponseData>('/login', 'POST', false, loginRequestData);

                if (resultLogin.error || !resultLogin.response || !resultLogin.response.tokens || !resultLogin.response.tokens.accessToken || !resultLogin.response.tokens.refreshToken || !resultLogin.response.user || !resultLogin.response.user.id || !resultLogin.response.user.name) {
                    this.commonErrorElement.style.display = "block";
                    return;
                }

                AuthUtils.setAuthInfo(
                    resultLogin.response.tokens.accessToken,
                    resultLogin.response.tokens.refreshToken,
                    {
                        id: resultLogin.response.user.id,
                        name: resultLogin.response.user.name
                    }
                );

                const userData = {
                    name: resultLogin.response.user.name + ' ' + (resultLogin.response.user.lastName || ''),
                    email: resultLogin.response.user.email,
                    id: resultLogin.response.user.id
                };

                localStorage.setItem('userData', JSON.stringify(userData));

                await this.openNewRoute('/');
            } catch (error: unknown) {
                console.error("Произошла ошибка при попытке регистрации:", error);
                if (this.commonErrorElement) {
                    this.commonErrorElement.style.display = "block";
                }
            }
        }
    }
}