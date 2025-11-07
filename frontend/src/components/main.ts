import Chart from 'chart.js/auto';
import {HttpUtils} from "../utils/http-utils";
import type {
    DateInterval,
    PeriodFilter,
    ChartDataResult,
    ChartData,
    ChartInstance,
    ChartCanvasElement, Operation
} from '../types/main.types';
import {buildOperationsUrl} from "../utils/url-utils";
import type {HttpUtilsResult} from '../types/http-utils.types';

export class Main {
    private currentFilter: PeriodFilter;
    private interval: DateInterval;
    private hiddenDateInput: HTMLInputElement | null;
    private incomeChart: ChartInstance | null;
    private expenseChart: ChartInstance | null;

    constructor() {
        this.currentFilter = "today";
        this.interval = {from: null, to: null};
        this.hiddenDateInput = null;
        this.incomeChart = null;
        this.expenseChart = null;

        this.initEventListeners();

        this.restoreFilterFromStorage();
        window.addEventListener('beforeunload', (): void => {
            try {
                localStorage.removeItem('app_period_filter');
                localStorage.removeItem('app_period_from');
                localStorage.removeItem('app_period_to');
            } catch (_) {

            }
        });

        // Загрузка данных при инициализации
        const currentFilterIsInterval: boolean = (this.currentFilter as PeriodFilter) === 'interval';
        if (currentFilterIsInterval && this.interval.from && this.interval.to) {
            void this.getOperations('interval', this.interval.from, this.interval.to).then((ops: Operation[] | null): void => {
                if (ops) {
                    const {incomeData, expenseData} = this.buildChartData(ops);
                    this.renderCharts(incomeData, expenseData);
                }
            });
        } else if (this.currentFilter && this.currentFilter !== 'today') {
            void this.getOperations(this.currentFilter).then((ops: Operation[] | null): void => {
                if (ops) {
                    const {incomeData, expenseData} = this.buildChartData(ops);
                    this.renderCharts(incomeData, expenseData);
                }
            });
        } else {
            void this.getOperations('today').then((ops: Operation[] | null): void => {
                if (ops) {
                    const {incomeData, expenseData} = this.buildChartData(ops);
                    this.renderCharts(incomeData, expenseData);
                }
            });
        }
    }

    // Обработчик событий
    initEventListeners(): void {
        const periodsButtons: Record<string, PeriodFilter> = {
            'btn-today': 'today',
            'btn-week': 'week',
            'btn-month': 'month',
            'btn-year': 'year',
            'btn-all-periods-calendar': 'all',
            'btn-interval': 'interval'
        };

        Object.keys(periodsButtons).forEach(buttonId => {
            const button: HTMLElement | null = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', (): void => {
                    this.setActiveFilter(buttonId);
                    this.currentFilter = periodsButtons[buttonId]!;
                    this.persistFilterToStorage();
                    if (buttonId === 'btn-interval') {
                        return;
                    }
                    this.interval = {from: null, to: null};
                    const toolbar: Element | null = document.querySelector('.d-flex.align-items-center.pl-5.pb-5');
                    if (toolbar) {
                        const dateAnchors: NodeListOf<Element> = toolbar.querySelectorAll('a.text-secondary');
                        if (dateAnchors && dateAnchors[0]) dateAnchors[0].textContent = 'Дата';
                        if (dateAnchors && dateAnchors[1]) dateAnchors[1].textContent = 'Дата';
                    }
                    this.persistIntervalToStorage();
                    void this.getOperations(this.currentFilter).then((ops: Operation[] | null): void => {
                        if (ops) {
                            const {incomeData, expenseData} = this.buildChartData(ops);
                            this.renderCharts(incomeData, expenseData);
                        }
                    });
                });
            }
        });

        const toolbar: Element | null = document.querySelector('.d-flex.align-items-center.pl-5.pb-5');
        let dateAnchors: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a.text-secondary');
        if (toolbar) {
            dateAnchors = toolbar.querySelectorAll<HTMLAnchorElement>('a.text-secondary');
        }
        const fromAnchor: HTMLElement | null = dateAnchors && dateAnchors[0] ? dateAnchors[0] : null;
        const toAnchor: HTMLAnchorElement | null = dateAnchors && dateAnchors[1] ? dateAnchors[1] : null;

        this.hiddenDateInput = document.createElement('input');
        this.hiddenDateInput.type = 'date';
        this.hiddenDateInput.style.position = 'absolute';
        this.hiddenDateInput.style.left = '-9999px';
        document.body.appendChild(this.hiddenDateInput);

        if (fromAnchor) {
            fromAnchor.addEventListener('click', (e: MouseEvent): void => {
                e.preventDefault();
                e.stopPropagation();
                if (this.currentFilter === 'interval') {
                    this.openHiddenDatePicker((value: string | null): void => {
                        this.interval.from = value || null;
                        fromAnchor.textContent = value ? this.formatDateForDisplay(value) : 'Дата';
                        this.persistIntervalToStorage();
                    }, this.interval.from);
                }
            });
        }

        if (toAnchor) {
            toAnchor.addEventListener('click', (e: MouseEvent): void => {
                e.preventDefault();
                e.stopPropagation();
                if (this.currentFilter === 'interval') {
                    this.openHiddenDatePicker(async (value: string | null): Promise<void> => {
                        this.interval.to = value || null;
                        toAnchor.textContent = value ? this.formatDateForDisplay(value) : 'Дата';
                        this.persistIntervalToStorage();
                        if (this.interval.from && this.interval.to) {
                            const ops: Operation[] | null = await this.getOperations('interval', this.interval.from, this.interval.to);
                            if (ops) {
                                const {incomeData, expenseData} = this.buildChartData(ops);
                                this.renderCharts(incomeData, expenseData);
                            }
                        }
                    }, this.interval.to);
                }
            });
        }
    }

    // Обработчик открытия календаря
    openHiddenDatePicker(onChange: (value: string | null) => void, initialValue: string | null): void {
        if (!this.hiddenDateInput) return;

        this.hiddenDateInput.onchange = null;
        this.hiddenDateInput.value = initialValue || '';

        this.hiddenDateInput.onchange = (): void => {
            onChange && onChange(this.hiddenDateInput?.value || null);
            if (this.hiddenDateInput) {
                this.hiddenDateInput.style.left = '-9999px';
                this.hiddenDateInput.style.top = '0px';
                this.hiddenDateInput.style.width = '';
                this.hiddenDateInput.style.height = '';
                this.hiddenDateInput.style.opacity = '1';
                this.hiddenDateInput.style.position = 'absolute';
            }
        };

        if (this.hiddenDateInput) {
            this.hiddenDateInput.style.position = 'fixed';
            this.hiddenDateInput.style.left = '50%';
            this.hiddenDateInput.style.top = '29%';
            this.hiddenDateInput.style.width = '1px';
            this.hiddenDateInput.style.height = '1px';
            this.hiddenDateInput.style.opacity = '0';
        }

        try {
            if (this.hiddenDateInput) {
                this.hiddenDateInput.focus({preventScroll: true});
            }
        } catch (e) {
            try {
                if (this.hiddenDateInput) {
                    this.hiddenDateInput.focus();
                }
            } catch (_) {

            }
        }

        if (typeof this.hiddenDateInput?.showPicker === 'function') {
            try {
                if (this.hiddenDateInput) {
                    this.hiddenDateInput.showPicker();
                }
                return;
            } catch (e) {

            }
        }

        if (this.hiddenDateInput) {
            this.hiddenDateInput.click();
        }
    }

    setActiveFilter(activeButtonId: string): void {
        const allButtons: NodeListOf<Element> = document.querySelectorAll('.btn-outline-secondary');
        allButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton: HTMLElement | null = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Сохраняем в сторадж
    persistFilterToStorage(): void {
        try {
            localStorage.setItem('app_period_filter', this.currentFilter || 'today');
        } catch (_) {

        }
    }

    persistIntervalToStorage(): void {
        try {
            if (this.currentFilter === 'interval') {
                localStorage.setItem('app_period_from', this.interval.from || '');
                localStorage.setItem('app_period_to', this.interval.to || '');
            } else {
                localStorage.removeItem('app_period_from');
                localStorage.removeItem('app_period_to');
            }
        } catch (_) {

        }
    }

    restoreFilterFromStorage(): void {
        try {
            const saved: string | null = localStorage.getItem('app_period_filter');
            const filter: PeriodFilter = (saved as PeriodFilter) || 'today';
            this.currentFilter = filter;
            const buttonId: string | null = this.buttonIdByFilter(filter);
            if (buttonId) this.setActiveFilter(buttonId);
            if (filter === 'interval') {
                const from: string = localStorage.getItem('app_period_from') || '';
                const to: string = localStorage.getItem('app_period_to') || '';
                this.interval = {from: from || null, to: to || null};
                this.updateDateAnchors(from, to);
            } else {
                this.updateDateAnchors(null, null);
            }
        } catch (_) {
        }
    }

    buttonIdByFilter(filter: PeriodFilter): string | null {
        switch (filter) {
            case 'today':
                return 'btn-today';
            case 'week':
                return 'btn-week';
            case 'month':
                return 'btn-month';
            case 'year':
                return 'btn-year';
            case 'all':
                return 'btn-all-periods-calendar';
            case 'interval':
                return 'btn-interval';
            default:
                return 'btn-today';
        }
    }

    updateDateAnchors(from: string | null, to: string | null): void {
        const toolbar: Element | null = document.querySelector('.d-flex.align-items-center.pl-5.pb-5');
        if (!toolbar) return;
        const dateAnchors: NodeListOf<Element> = toolbar.querySelectorAll('a.text-secondary');
        if (dateAnchors && dateAnchors[0]) dateAnchors[0].textContent = from ? this.formatDateForDisplay(from) : 'Дата';
        if (dateAnchors && dateAnchors[1]) dateAnchors[1].textContent = to ? this.formatDateForDisplay(to) : 'Дата';
    }

    // Данные
    async getOperations(filter: PeriodFilter | null = null, dateFrom: string | null = null, dateTo: string | null = null): Promise<Operation[] | null> {
        const url: string = buildOperationsUrl(filter, dateFrom, dateTo);
        try {
            const result: HttpUtilsResult<Operation[]> = await HttpUtils.request<Operation[]>(url);

            if (result.redirect) return null;
            if (result.error || !result.response) return null;

            return result.response;
        } catch (error) {
            console.error("Ошибка при получении операций:", error);
            return null;
        }
    }

    formatDateForDisplay(value: string): string {
        const [y, m, d] = value.split('-');
        if (!y || !m || !d) return 'Дата';
        return `${d}.${m}.${y}`;
    }

    // Данные для диаграммы
    buildChartData(operations: Operation[]): ChartDataResult {
        const incomeMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        for (const op of operations) {
            let title: string | null = null;

            if (op.category && typeof op.category === 'object') {
                title = op.category.title || op.category.name || null;
            } else if (op.category) {
                title = op.category;
            } else {
                title = op.category_title || op.categoryTitle || op.category_name || op.categoryName || 'Без категории';
            }

            if (!title) {
                title = 'Без категории';
            }

            const sum: number = Number(op.amount) || 0;
            if (op.type === 'income') {
                incomeMap.set(title, (incomeMap.get(title) || 0) + sum);
            } else if (op.type === 'expense') {
                expenseMap.set(title, (expenseMap.get(title) || 0) + sum);
            }
        }

        const incomeLabels: string[] = Array.from(incomeMap.keys());
        const incomeValues: number[] = Array.from(incomeMap.values());
        const expenseLabels: string[] = Array.from(expenseMap.keys());
        const expenseValues: number[] = Array.from(expenseMap.values());

        return {
            incomeData: {labels: incomeLabels, values: incomeValues},
            expenseData: {labels: expenseLabels, values: expenseValues}
        };
    }

    // Внешний вид диаграммы
    renderCharts(incomeData: ChartData, expenseData: ChartData): void {
        const palette: string[] = [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)'
        ];


        const incomeCtx = document.getElementById('income_pie') as ChartCanvasElement | null;
        const expenseCtx = document.getElementById('expense_pie') as ChartCanvasElement | null;

        const makeDataset = (labels: string[], values: number[]) => ({
            labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map((_: string, i: number): string | undefined => palette[i % palette.length])
            }]
        });

        const incomeChartData: {
            labels: string[];
            datasets: { data: number[]; backgroundColor: (string | undefined)[] }[]
        } = makeDataset(incomeData.labels, incomeData.values);
        const expenseChartData: {
            labels: string[];
            datasets: { data: number[]; backgroundColor: (string | undefined)[] }[]
        } = makeDataset(expenseData.labels, expenseData.values);

        if (this.incomeChart) {
            this.incomeChart.data = incomeChartData;
            this.incomeChart.update();
        } else if (incomeCtx) {
            this.incomeChart = new Chart(incomeCtx, {type: 'pie', data: incomeChartData, options: {responsive: true}});
        }

        if (this.expenseChart) {
            this.expenseChart.data = expenseChartData;
            this.expenseChart.update();
        } else if (expenseCtx) {
            this.expenseChart = new Chart(expenseCtx, {
                type: 'pie',
                data: expenseChartData,
                options: {responsive: true}
            });
        }
    }
}