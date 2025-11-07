import {HttpUtils} from "../../utils/http-utils";
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {CreateCategoryRequestData, CreateCategoryResponseData} from '../../types/main.types';

export class ExpenseCategoryCreation {
    readonly openNewRoute: OpenNewRouteCallback;
    readonly formElement: HTMLFormElement | null;
    readonly inputElement: HTMLInputElement | null;
    readonly saveButton: HTMLButtonElement | null;
    readonly cancelLink: HTMLAnchorElement | null;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;
        this.formElement = document.querySelector('form');
        this.inputElement = this.formElement ? this.formElement.querySelector('input[type="text"]') : null;
        this.saveButton = this.formElement ? this.formElement.querySelector('.btn-success') : null;
        this.cancelLink = this.formElement ? this.formElement.querySelector('.btn-danger') as HTMLAnchorElement | null : null;

        this.initActions();
    }

    initActions(): void {
        if (this.saveButton) {
            this.saveButton.addEventListener('click', this.create.bind(this));
        }
        if (this.cancelLink) {
            this.cancelLink.addEventListener('click', (e: MouseEvent): void => {
                e.preventDefault();
                void this.openNewRoute('/expense-category');
            });
        }

        if (this.inputElement) {
            this.inputElement.addEventListener('input', this.resetError.bind(this));
        }
    }

    resetError(): void {
        if (this.inputElement) {
            this.inputElement.classList.remove('border-danger', 'is-invalid');
            this.inputElement.placeholder = 'Название...';
        }
    }

    async create(e: MouseEvent): Promise<void> {
        e.preventDefault();
        if (!this.inputElement) {
            console.error("Элемент ввода названия категории не найден.");
            return;
        }

        const title: string = (this.inputElement.value || '').trim();

        this.resetError();

        if (!title) {
            this.inputElement.classList.add('border-danger', 'is-invalid');
            this.inputElement.placeholder = 'Название категории не может быть пустым';
            return;
        }

        const requestData: CreateCategoryRequestData = {
            title: title
        };

        try {
            const result: HttpUtilsResult<CreateCategoryResponseData> =
                await HttpUtils.request<CreateCategoryResponseData>('/categories/expense', 'POST', true, requestData);

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error || !result.response?.id) {
                alert(result.response?.message || 'Не удалось создать расходную категорию');
                return;
            }
            await this.openNewRoute('/expense-category');
        } catch (error: unknown) {
            console.error("Произошла ошибка при создании расходной категории:", error);
            alert('Не удалось создать расходную категорию');
        }
    }
}