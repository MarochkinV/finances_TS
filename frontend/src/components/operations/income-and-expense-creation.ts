import {HttpUtils} from "../../utils/http-utils";
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {SaveOperationRequestData, CategoryObject, Operation} from '../../types/main.types';

export class IncomeAndExpenseCreation {
    readonly openNewRoute: OpenNewRouteCallback;
    readonly formEl: HTMLFormElement | null;
    readonly typeSelect: HTMLSelectElement | null;
    readonly categorySelect: HTMLSelectElement | null;
    readonly amountInput: HTMLInputElement | null;
    readonly dateInput: HTMLInputElement | null;
    readonly commentTextarea: HTMLTextAreaElement | null;
    readonly saveBtn: HTMLButtonElement | null;
    readonly cancelBtn: HTMLButtonElement | null;

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

        void this.init();
    }

    async init(): Promise<void> {
        this.initCancel();
        this.initValidationReset();
        this.initTypeFromQuery();
        await this.loadCategories();
        this.initTypeChange();
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

    // Сброс ошибок в полях
    initValidationReset(): void {
        const inputs: (HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement | null)[] =
            [this.typeSelect, this.categorySelect, this.amountInput, this.dateInput, this.commentTextarea];
        inputs.filter((el: HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement | null): el is HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement => el !== null)
            .forEach((el): void => {
                el.addEventListener('input', (): void => this.resetError(el));
                el.addEventListener('change', (): void => this.resetError(el));
            });
    }

    initTypeFromQuery(): void {
        const params = new URLSearchParams(window.location.search);
        const qsType: string | null = params.get('type');
        if (this.typeSelect && (qsType === 'income' || qsType === 'expense')) {
            this.typeSelect.value = qsType;
        }
    }

    initTypeChange(): void {
        if (!this.typeSelect) return;
        this.typeSelect.addEventListener('change', async (): Promise<void> => {
            await this.loadCategories();
        });
    }

    // Сброс ошибки
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

    async loadCategories(): Promise<void> {
        if (!this.categorySelect || !this.typeSelect) return;
        const type = this.typeSelect.value as 'income' | 'expense';
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
            this.categorySelect.innerHTML = '<option value="" class="placeholder-option">Категория...</option>';
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

    // Валидация
    validate(): boolean {
        let valid: boolean = true;
        const required = [
            {el: this.typeSelect, msg: 'Выберите тип'},
            {el: this.categorySelect, msg: 'Выберите категорию'},
            {el: this.amountInput, msg: 'Сумма обязательна'},
            {el: this.dateInput, msg: 'Дата обязательна'},
        ];

        required.forEach(({el, msg}): void => {
            if (!el) return;
            if ('value' in el && 'placeholder' in el) {
                const val: string = (el.value || '').toString().trim();
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
        if (!this.saveBtn) return;
        this.saveBtn.addEventListener('click', async (e: MouseEvent): Promise<void> => {
            e.preventDefault();
            if (!this.validate()) return;

            // Данные для отправки
            const body: SaveOperationRequestData = {
                type: this.typeSelect!.value as 'income' | 'expense',
                category_id: Number(this.categorySelect!.value),
                amount: Number(this.amountInput!.value),
                date: this.dateInput!.value,
                comment: this.commentTextarea!.value.trim() || " ",
            };

            try {
                const result: HttpUtilsResult<Operation> = await HttpUtils.request<Operation>('/operations', 'POST', true, body);

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
                console.log("Произошла ошибка при сохранении операции:", error);
            }
        });
    }
}