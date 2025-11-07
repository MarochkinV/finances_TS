import type { PeriodFilter } from '../types/main.types';

export function buildOperationsUrl(filter: PeriodFilter | null, dateFrom: string | null, dateTo: string | null): string {
    let url:string = '/operations';
    if (filter) {
        const params = new URLSearchParams();
        params.set('period', filter);
        if (filter === 'interval' && dateFrom && dateTo) {
            params.set('dateFrom', dateFrom);
            params.set('dateTo', dateTo);
        }
        url = `/operations?${params.toString()}`;
    }
    return url;
}


