import {HttpUtils} from "../../utils/http-utils";
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {Operation, CategoryObject, UpdateOperationRequestData} from '../../types/main.types';

export class IncomeAndExpenseEdit {
    readonly openNewRoute: OpenNewRouteCallback;
    readonly formEl: HTMLFormElement | null;
    readonly typeSelect: HTMLSelectElement | null;
    readonly categorySelect: HTMLSelectElement | null;
    readonly amountInput: HTMLInputElement | null;
    readonly dateInput: HTMLInputElement | null;
    readonly commentTextarea: HTMLTextAreaElement | null;
    readonly saveBtn: HTMLButtonElement | null;
    readonly cancelBtn: HTMLButtonElement | null;
    readonly operationId: string | null;
    private operationData: Operation | null;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;

        this.formEl = document.querySelector('form');
        this.typeSelect = this.formEl ? this.formEl.querySelector('select[name="type"]') : null;
        this.categorySelect = this.formEl ? this.formEl.querySelector('select[name="category"]') : null;
        this.amountInput = this.formEl ? this.formEl.querySelector('input[name="amount"]') : null;
        this.dateInput = this.formEl ? this.formEl.querySelector('input[name="date"]') : null;
        this.commentTextarea = this.formEl ? this.formEl.querySelector('textarea[name="comment"]') : null;
        this.saveBtn = this.formEl ? this.formEl.querySelector('.btn-success') : null;
        this.cancelBtn = this.formEl ? this.formEl.querySelector('.btn-danger') : null;

        this.operationId = this.getIdFromQuery();
        this.operationData = null;
        void this.init();
    }

    getIdFromQuery(): string | null {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Инициализация
    async init(): Promise<void> {
        if (!this.operationId) {
            await this.openNewRoute('/income-and-expense');
            return;
        }

        this.initCancel();
        this.initValidationReset();

        await this.loadOperation();
        if (!this.operationData) return;

        await this.loadCategories(this.operationData.type);
        this.fillForm(this.operationData);
        this.initSave();
    }

    // Кнопка отмена
    initCancel(): void {
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', (e: MouseEvent): void => {
                e.preventDefault();
                void this.openNewRoute('/income-and-expense');
            });
        }
    }

    // Сброс ошибок
    initValidationReset(): void {
        const inputs: (HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement | null)[] =
            [this.categorySelect, this.amountInput, this.dateInput, this.commentTextarea];
        inputs.filter((el): el is HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement =>
            el !== null).forEach((el): void => {
            el.addEventListener('input', (): void => this.resetError(el));
            el.addEventListener('change', (): void => this.resetError(el));
        });
    }

    resetError(el: HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement): void {
        el.classList.remove('border-danger', 'is-invalid');
        if (el.name === 'amount') {
            if ("placeholder" in el) {
                el.placeholder = 'Сумма в $...';
            }
        } else if (el.name === 'date') {
            if ("placeholder" in el) {
                el.placeholder = '';
            }
        } else if (el.name === 'comment') {
            if ("placeholder" in el) {
                el.placeholder = 'Комментарий...';
            }
        }
    }

    // Данные операции
    async loadOperation(): Promise<void> {
        if (!this.operationId) return;

        try {
            const result: HttpUtilsResult<Operation> = await HttpUtils.request<Operation>(`/operations/${this.operationId}`, 'GET');

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error || !result.response) {
                await this.openNewRoute('/income-and-expense');
                return;
            }
            this.operationData = result.response;
        } catch (error: unknown) {
            console.error("Произошла ошибка при загрузке операции:", error);
            await this.openNewRoute('/income-and-expense');
        }
    }

    // Загрузка категории
    async loadCategories(type: 'income' | 'expense'): Promise<void> {
        if (!this.categorySelect) return;
        const url = type === 'income' ? '/categories/income' : '/categories/expense';
        try {
            const result: HttpUtilsResult<CategoryObject[]> = await HttpUtils.request<CategoryObject[]>(url, 'GET');

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error) {
                console.error("Ошибка при загрузке категорий:", result.response);
                return;
            }

            const categories: CategoryObject[] = Array.isArray(result.response) ? result.response : [];
            this.categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
            categories.forEach((cat: CategoryObject): void => {
                const opt: HTMLOptionElement = document.createElement('option');
                opt.value = String(cat.id);
                opt.textContent = cat.title || 'Без названия';
                this.categorySelect!.appendChild(opt);
            });
        } catch (error: unknown) {
            console.error("Произошла ошибка при загрузке категорий:", error);
        }
    }

    // Заполнение формы данными об операции
    fillForm(op: Operation): void {
        if (this.typeSelect && op.type) {
            this.typeSelect.value = op.type;
        }
        if (this.categorySelect && op.category) {
            let categoryName: string | undefined;

            if (typeof op.category === 'object') {
                categoryName = op.category.title || op.category.name;
            } else {
                categoryName = op.category;
            }

            if (categoryName && this.categorySelect.options) {
                let found: boolean = false;
                for (let i: number = 0; i < this.categorySelect.options.length; i++) {
                    const opt: HTMLOptionElement | undefined = this.categorySelect.options[i];

                    if (opt && opt.textContent === categoryName) {
                        this.categorySelect.value = opt.value;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.categorySelect.value = '';
                }
            }
        }
        if (this.amountInput && op.amount !== undefined) {
            this.amountInput.value = String(op.amount);
        }
        if (this.dateInput && op.date) {
            this.dateInput.value = op.date;
        }
        if (this.commentTextarea) {
            this.commentTextarea.value = op.comment || '';
        }
    }

    // Валидация
    validate(): boolean {
        let valid: boolean = true;
        const required = [
            {el: this.categorySelect, msg: 'Выберите категорию'},
            {el: this.amountInput, msg: 'Сумма обязательна'},
            {el: this.dateInput, msg: 'Дата обязательна'},
        ];

        required.forEach(({el, msg}): void => {
            if (!el) return;

            if ('value' in el && 'placeholder' in el) {
                const val = (el.value || '').toString().trim();
                if (!val) {
                    el.classList.add('border-danger', 'is-invalid');
                    if ('placeholder' in el && typeof el.placeholder !== 'undefined') el.placeholder = msg;
                    valid = false;
                }
            }
        });

        if (valid && this.amountInput) {
            const amount: number = Number(this.amountInput.value);
            if (!Number.isFinite(amount) || amount <= 0) {
                this.amountInput.classList.add('border-danger', 'is-invalid');
                this.amountInput.placeholder = 'Введите положительное число';
                valid = false;
            }
        }
        return valid;
    }

    // Сохранение
    initSave(): void {
        if (!this.saveBtn || !this.operationData) return;
        this.saveBtn.addEventListener('click', async (e: MouseEvent): Promise<void> => {
            e.preventDefault();
            if (!this.validate()) return;

            if (!this.operationData) {
                console.error("Данные операции не доступны при сохранении.");
                return;
            }

            // Данные для отправки
            const body: UpdateOperationRequestData = {
                type: this.operationData.type!,
                category_id: Number(this.categorySelect!.value),
                amount: Number(this.amountInput!.value),
                date: this.dateInput!.value,
                comment: this.commentTextarea!.value.trim(),
            };

            try {
                const result: HttpUtilsResult<Operation> = await HttpUtils.request<Operation>(`/operations/${this.operationId}`, 'PUT', true, body);

                if (result.redirect) {
                    await this.openNewRoute(result.redirect);
                    return;
                }

                if (result.error) {
                    console.error("Ошибка при сохранении операции:", result.response);
                    return;
                }
                await this.openNewRoute('/income-and-expense');
            } catch (error: unknown) {
                console.error("Произошла ошибка при сохранении операции:", error);
            }
        });
    }
}