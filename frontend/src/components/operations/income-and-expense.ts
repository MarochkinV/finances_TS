import {HttpUtils} from "../../utils/http-utils";
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {
    CategoryObject,
    DateInterval,
    Operation,
    PeriodFilter
} from '../../types/main.types';
import {buildOperationsUrl} from "../../utils/url-utils";

export class IncomeAndExpense {
    readonly openNewRoute: OpenNewRouteCallback;
    private currentFilter: PeriodFilter;
    private interval: DateInterval;
    private hiddenDateInput: HTMLInputElement | null;
    readonly modalElement: HTMLElement | null;
    readonly modalConfirmBtn: HTMLElement | null;
    private operationIdToDelete: string | number | null;
    private recordsTableBody: HTMLElement | null;
    private addIncomeBtn: HTMLElement | null;
    private addExpenseBtn: HTMLElement | null;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;
        this.currentFilter = 'today';
        this.interval = {from: null, to: null};
        this.hiddenDateInput = null;
        this.modalElement = document.getElementById('myModal');
        this.modalConfirmBtn = this.modalElement ? this.modalElement.querySelector('.btn-success') : null;
        this.operationIdToDelete = null;
        this.recordsTableBody = null;
        this.addIncomeBtn = null;
        this.addExpenseBtn = null;

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
            void this.getOperations('interval', this.interval.from, this.interval.to);
        } else if (this.currentFilter && this.currentFilter !== 'today') {
            void this.getOperations(this.currentFilter);
        } else {
            void this.getOperations('today');
        }
        this.initEventListeners();
    }

    // Метод для запроса всех операций
    async getOperations(filter: PeriodFilter | null = null, dateFrom: string | null = null, dateTo: string | null = null): Promise<void> {
        const url: string = buildOperationsUrl(filter, dateFrom, dateTo);
        try {
            const result: HttpUtilsResult<Operation[]> = await HttpUtils.request<Operation[]>(url);

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error || !result.response) {
                alert('Ошибка при запросе операций');
                return;
            }

            this.showRecords(result.response);
        } catch (error: unknown) {
            console.error("Произошла ошибка при получении операций:", error);
            alert('Ошибка при запросе операций');
        }
    }

    // Обработчик кнопок с периодами года
    initEventListeners(): void {
        const periodsButtonsConst = {
            'btn-today': 'today',
            'btn-week': 'week',
            'btn-month': 'month',
            'btn-year': 'year',
            'btn-all-periods-calendar': 'all',
            'btn-interval': 'interval'
        } as const;

        (Object.entries(periodsButtonsConst) as [keyof typeof periodsButtonsConst, PeriodFilter][])
            .forEach(([buttonId, filterValue]): void => {
                const button: HTMLElement | null = document.getElementById(buttonId);
                if (button) {
                    button.addEventListener('click', (): void => {
                        this.setActiveFilter(buttonId);
                        this.currentFilter = filterValue;
                        this.persistFilterToStorage();
                        if (buttonId === 'btn-interval') {
                            return;
                        }
                        this.resetIntervalDates();
                        this.persistIntervalToStorage();
                        void this.getOperations(this.currentFilter);
                    });
                }
            });

        const toolbar = document.querySelector('.d-flex.align-items-center.pl-5.pb-5');
        let dateAnchors: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a.text-secondary');
        if (toolbar) {
            dateAnchors = toolbar.querySelectorAll<HTMLAnchorElement>('a.text-secondary');
        }
        const fromAnchor: HTMLAnchorElement | null = dateAnchors && dateAnchors[0] ? dateAnchors[0] : null;
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
                            const errorMessage: string | null = this.validateDates(this.interval.from, this.interval.to);
                            if (errorMessage) {
                                alert(errorMessage);
                                return;
                            }
                            await this.getOperations('interval', this.interval.from, this.interval.to);
                        }
                    }, this.interval.to);
                }
            });
        }

        // Инициализация событий для создания операций
        this.addIncomeBtn = document.getElementById('btn-add-income');
        this.addExpenseBtn = document.getElementById('btn-add-expense');
        if (this.addIncomeBtn) {
            this.addIncomeBtn.addEventListener('click', (e: MouseEvent): void => {
                e.preventDefault();
                void this.openNewRoute('/income-and-expense-creation?type=income');
            });
        }
        if (this.addExpenseBtn) {
            this.addExpenseBtn.addEventListener('click', (e: MouseEvent): void => {
                e.preventDefault();
                void this.openNewRoute('/income-and-expense-creation?type=expense');
            });
        }

        this.recordsTableBody = document.getElementById('records');
        if (this.recordsTableBody) {
            this.recordsTableBody.addEventListener('click', (e: MouseEvent): void => {
                const delBtn: Element | null = e.target instanceof Element ? e.target.closest('button.delete') : null;

                if (!delBtn) return;

                e.preventDefault();
                const opId: string | null = delBtn.getAttribute('data-operation-id');
                if (opId) {
                    this.askDelete(opId);
                }
            });
        }

        // Подтверждение удаления в модальном окне
        if (this.modalConfirmBtn) {
            this.modalConfirmBtn.addEventListener('click', async (): Promise<void> => {
                if (!this.operationIdToDelete) return;
                await this.deleteOperation(this.operationIdToDelete);
                this.operationIdToDelete = null;
                const closeBtn = this.modalElement?.querySelector('[data-dismiss="modal"]') as HTMLElement | null;

                if (closeBtn) closeBtn.click();

                if (this.currentFilter === 'interval' && this.interval.from && this.interval.to) {
                    await this.getOperations('interval', this.interval.from, this.interval.to);
                } else {
                    await this.getOperations(this.currentFilter);
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
            this.hiddenDateInput.style.top = '38%';
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

    // Сброс интервала
    resetIntervalDates(): void {
        this.interval = {from: null, to: null};
        const toolbar: Element | null = document.querySelector('.d-flex.align-items-center.pl-5.pb-5');
        if (!toolbar) {
            return;
        }
        const dateAnchors: NodeListOf<Element> = toolbar.querySelectorAll('a.text-secondary');
        if (dateAnchors && dateAnchors[0]) {
            dateAnchors[0].textContent = 'Дата';
        }
        if (dateAnchors && dateAnchors[1]) {
            dateAnchors[1].textContent = 'Дата';
        }
    }

    validateDates(dateFrom: string | null, dateTo: string | null): string | null {
        if (!dateFrom || !dateTo) {
            return 'Укажите обе даты: с и по.';
        }
        if (dateFrom > dateTo) {
            return 'Дата "с" не может быть позже даты "по".';
        }
        return null;
    }

    // Нужный формат даты
    formatDateForDisplay(value: string): string {
        const [y, m, d] = value.split('-');
        if (!y || !m || !d) {
            return 'Дата';
        }
        return `${d}.${m}.${y}`;
    }

    // Установка активной кнопки с периодом
    setActiveFilter(activeButtonId: string): void {
        const periodsButtonsConst = {
            'btn-today': 'today',
            'btn-week': 'week',
            'btn-month': 'month',
            'btn-year': 'year',
            'btn-all-periods-calendar': 'all',
            'btn-interval': 'interval'
        } as const;

        if (!(activeButtonId in periodsButtonsConst)) {
            console.warn(`Неизвестный идентификатор кнопки фильтра: ${activeButtonId}`);
            return;
        }

        const allButtons: NodeListOf<Element> = document.querySelectorAll('.btn-outline-secondary');
        allButtons.forEach(btn => btn.classList.remove('active'));

        const activeButton: HTMLElement | null = document.getElementById(activeButtonId);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

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


    showRecords(operations: Operation[]): void {
        const recordsElement: HTMLElement | null = document.getElementById("records");
        if (!recordsElement) {
            console.error("Элемент с id 'records' не найден.");
            return;
        }
        recordsElement.innerHTML = '';

        // Создание таблицы с операцией
        let i: number = 0;
        for (const op of operations) {
            // Строка
            const trElement: HTMLTableRowElement = document.createElement("tr");

            // Порядковый номер
            trElement.insertCell().innerText = String(i + 1);

            // Тип операции
            let typeCell: HTMLTableCellElement = trElement.insertCell();

            switch (op.type) {
                case "income":
                    typeCell.innerHTML = '<span class="text-success">Доход</span>';
                    break;
                case "expense":
                    typeCell.innerHTML = '<span class="text-danger">Расход</span>';
                    break;
                default:
                    typeCell.innerText = op.type;
            }

            // Категория
            const cat: string | CategoryObject | undefined = op.category;
            trElement.insertCell().innerText = (cat && typeof cat === 'object' ? (cat.title || cat.name) : null)
                || op.category_title
                || op.categoryTitle
                || op.category_name
                || op.categoryName
                || (typeof cat === 'string' || false ? String(cat) : '')
                || '';

            // Сумма
            trElement.insertCell().innerText = Number(op.amount).toFixed(2) + '$';

            // Дата
            trElement.insertCell().innerText = op.date ? this.formatDateForDisplay(op.date) : '';

            // Комментарий
            trElement.insertCell().innerText = <string>op.comment || '';

            // Кнопки действий
            const actionsCell: HTMLTableCellElement = trElement.insertCell();
            actionsCell.className = 'text-right';

            const operationId = op.id !== undefined ? String(op.id) : 'unknown';

            actionsCell.innerHTML = `
            <button class="delete btn" type="button" data-toggle="modal" data-target="#myModal" data-operation-id="${encodeURIComponent(operationId)}"> 
                <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.5 5.5C4.77614 5.5 5 5.72386 5 6V12C5 12.2761 4.77614 12.5 4.5 12.5C4.22386 12.5 4 12.2761 4 12V6C4 5.72386 4.22386 5.5 4.5 5.5Z" fill="black"/>
                    <path d="M7 5.5C7.27614 5.5 7.5 5.72386 7.5 6V12C7.5 12.2761 7.27614 12.5 7 12.5C6.72386 12.5 6.5 12.2761 6.5 12V6C6.5 5.72386 6.72386 5.5 7 5.5Z" fill="black"/>
                    <path d="M10 6C10 5.72386 9.77614 5.5 9.5 5.5C9.22386 5.5 9 5.72386 9 6V12C9 12.2761 9.22386 12.5 9.5 12.5C9.77614 12.5 10 12.2761 10 12V6Z" fill="black"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5 3C13.5 3.55228 13.0523 4 12.5 4H12V13C12 14.1046 11.1046 15 10 15H4C2.89543 15 2 14.1046 2 13V4H1.5C0.947715 4 0.5 3.55228 0.5 3V2C0.5 1.44772 0.947715 1 1.5 1H5C5 0.447715 5.44772 0 6 0H8C8.55229 0 9 0.447715 9 1H12.5C13.0523 1 13.5 1.44772 13.5 2V3ZM3.11803 4L3 4.05902V13C3 13.5523 3.44772 14 4 14H10C10.5523 14 11 13.5523 11 13V4.05902L10.882 4H3.11803ZM1.5 3V2H12.5V3H1.5Z" fill="black"/>
                </svg>
            </button>
            <a href="/income-and-expense-edit?id=${encodeURIComponent(operationId)}" class="btn" style="padding:0;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.1465 0.146447C12.3417 -0.0488155 12.6583 -0.0488155 12.8536 0.146447L15.8536 3.14645C16.0488 3.34171 16.0488 3.65829 15.8536 3.85355L5.85357 13.8536C5.80569 13.9014 5.74858 13.9391 5.68571 13.9642L0.68571 15.9642C0.500001 16.0385 0.287892 15.995 0.146461 15.8536C0.00502989 15.7121 -0.0385071 15.5 0.0357762 15.3143L2.03578 10.3143C2.06092 10.2514 2.09858 10.1943 2.14646 10.1464L12.1465 0.146447ZM11.2071 2.5L13.5 4.79289L14.7929 3.5L12.5 1.20711L11.2071 2.5ZM12.7929 5.5L10.5 3.20711L4.00001 9.70711V10H4.50001C4.77616 10 5.00001 10.2239 5.00001 10.5V11H5.50001C5.77616 11 6.00001 11.2239 6.00001 11.5V12H6.29291L12.7929 5.5ZM3.03167 10.6755L2.92614 10.781L1.39754 14.6025L5.21903 13.0739L5.32456 12.9683C5.13496 12.8973 5.00001 12.7144 5.00001 12.5V12H4.50001C4.22387 12 4.00001 11.7761 4.00001 11.5V11H3.50001C3.28561 11 3.10272 10.865 3.03167 10.6755Z" fill="black"/>
                </svg>
            </a>
        `;
            recordsElement.appendChild(trElement);
            i++;
        }
    }

    askDelete(id: string | number): void {
        this.operationIdToDelete = id;
    }

    async deleteOperation(id: string | number): Promise<void> {
        try {
            const result: HttpUtilsResult = await HttpUtils.request<unknown>(`/operations/${id}`, 'DELETE');

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error) {
                alert('Не удалось удалить операцию');
                return;
            }

        } catch (error: unknown) {
            console.error("Произошла ошибка при удалении операции:", error);
            alert('Не удалось удалить операцию');
        }
    }
}