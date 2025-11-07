// login
export interface LoginUserResponse {
    id: number | string;
    name: string;
    email: string;
    lastName?: string;

    [key: string]: unknown;
}

export interface LoginTokensResponse {
    accessToken: string;
    refreshToken: string;
    [key: string]: unknown;
}

export interface LoginResponseData {
    tokens: LoginTokensResponse;
    user: LoginUserResponse;
    [key: string]: unknown;
}

export interface LoginRequestData {
    email: string;
    password: string;
    rememberMe: boolean;
}

// SignUp
export interface SignUpRequestData {
    name: string;
    lastName: string;
    email: string;
    password: string;
    passwordRepeat: string;
}

export interface SignUpUserResponse {
    id: number | string;
    name: string;
    email: string;
    lastName: string;
    [key: string]: unknown;
}

export interface SignUpResponseData {
    user: SignUpUserResponse;
    [key: string]: unknown;
}

// Form
export type FormInputElementForLogin = HTMLInputElement;
export type FormInputElementForSignUp = HTMLInputElement;
export type ErrorDisplayElement = HTMLElement;
