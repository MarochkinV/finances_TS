// All types
export interface DateInterval {
    from: string | null;
    to: string | null;
}

export type PeriodFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'interval';

// Category
export interface CategoryObject {
    id: number | string;
    title: string;
    name?: string;

    [key: string]: unknown;
}

// Operation income and expense
export interface Operation {
    id?: number | string;
    type: 'income' | 'expense';
    amount: number | string;
    category?: CategoryObject | string;
    category_title?: string;
    categoryTitle?: string;
    category_name?: string;
    categoryName?: string;
    date?: string;
    comment?: string;

    [key: string]: unknown;
}

// Chart
export interface ChartData {
    labels: string[];
    values: number[];
}

export interface ChartDataResult {
    incomeData: ChartData;
    expenseData: ChartData;
}

export type ChartInstance = import('chart.js').Chart;

export type ChartCanvasElement = HTMLCanvasElement;

// Request data
export interface SaveOperationRequestData {
    type: 'income' | 'expense';
    category_id: number;
    amount: number;
    date: string;
    comment: string;
}

export interface UpdateOperationRequestData {
    type: 'income' | 'expense';
    category_id: number;
    amount: number;
    date: string;
    comment: string;
}

export interface CreateCategoryRequestData {
    title: string;
}

export interface UpdateCategoryRequestData {
    title: string;
}

export interface CreateCategoryResponseData {
    id: number | string;
    message?: string;
}