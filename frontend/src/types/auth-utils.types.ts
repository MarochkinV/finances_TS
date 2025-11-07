export interface UserInfo {
    id: number | string;
    name: string;
    [key: string]: unknown;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    [key: string]: unknown;
}

export interface RefreshTokenResponse {
    tokens: AuthTokens;
    [key: string]: unknown;
}

