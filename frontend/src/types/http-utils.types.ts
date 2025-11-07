export interface HttpUtilsResult<T = unknown> {
    error: boolean;
    response: T | null;
    redirect: string | null;
}

export interface RequestHeaders {
    'Content-Type': string;
    'Accept': string;
    'x-auth-token'?: string;
    [key: string]: string;
}

export interface RequestParams {
    method: string;
    headers: RequestHeaders;
    body?: string;
}