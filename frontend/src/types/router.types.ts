export interface Route {
    route: string;
    title?: string;
    filePathTemplate?: string;
    useLayout?: string | boolean;
    requiresAuth: boolean;
    load?: () => void;
    unload?: () => void;
    styles?: string[];
}

export type OpenNewRouteCallback = (url: string) => Promise<void>;

export interface User {
    name?: string;
    fullName?: string;

    [key: string]: unknown;
}

export interface BalanceFetchResponse {
    balance?: number;

    [key: string]: unknown;
}