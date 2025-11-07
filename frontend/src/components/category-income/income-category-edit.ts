import {HttpUtils} from "../../utils/http-utils";
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {UpdateCategoryRequestData} from '../../types/main.types';
import type {CategoryObject} from '../../types/main.types';

export class IncomeCategoryEdit {
    readonly openNewRoute: OpenNewRouteCallback;
    readonly formElement: HTMLFormElement | null;
    readonly inputElement: HTMLInputElement | null;
    readonly saveButton: HTMLButtonElement | null;
    readonly cancelLink: HTMLAnchorElement | null;
    readonly id: string | null;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;
        this.formElement = document.querySelector('form');
        this.inputElement = this.formElement ? this.formElement.querySelector('input[type="text"]') : null;
        this.saveButton = this.formElement ? this.formElement.querySelector('.btn-success') : null;
        this.cancelLink = this.formElement ? this.formElement.querySelector('.btn-danger') as HTMLAnchorElement | null : null;
        this.id = this.getIdFromUrl();

        this.initActions();
        void this.load();
    }

    // Метод для получения ID
    getIdFromUrl(): string | null {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    initActions(): void {
        if (this.saveButton) {
            this.saveButton.addEventListener('click', this.save.bind(this));
        }
        if (this.cancelLink) {
            this.cancelLink.addEventListener('click', (e: MouseEvent): void => {
                e.preventDefault();
                void this.openNewRoute('/income-category');
            });
        }

        // При вводе, скидываем ошибку
        if (this.inputElement) {
            this.inputElement.addEventListener('input', this.resetError.bind(this));
        }
    }

    // Загрузка данных из категории
    async load(): Promise<void> {
        if (!this.id) {
            console.error("ID категории не найден в URL.");
            await this.openNewRoute('/income-category');
            return;
        }

        try {
            const result: HttpUtilsResult<CategoryObject> = await HttpUtils.request<CategoryObject>(`/categories/income/${this.id}`, 'GET');

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error) {
                console.error("Ошибка при загрузке категории:", result.response);
                await this.openNewRoute('/income-category');
                return;
            }

            if (this.inputElement && result.response) {
                this.inputElement.value = result.response.title;
            } else if (!result.response) {
                console.warn("Категория не найдена или пустой ответ от сервера.");
                await this.openNewRoute('/income-category');
            }
        } catch (error: unknown) {
            console.error("Произошла ошибка при загрузке категории:", error);
            await this.openNewRoute('/income-category');
        }
    }

    // Метод сброса ошибки
    resetError(): void {
        if (this.inputElement) {
            this.inputElement.classList.remove('border-danger', 'is-invalid');
            this.inputElement.placeholder = 'Название...';
        }
    }

    // Сохранение изменений
    async save(e: MouseEvent): Promise<void> {
        e.preventDefault();
        if (!this.inputElement) {
            console.error("Элемент ввода названия категории не найден.");
            return;
        }

        const title: string = (this.inputElement.value || '').trim();

        this.resetError();

        if (!title) {
            // Добавляем классы Bootstrap для ошибки
            this.inputElement.classList.add('border-danger', 'is-invalid');
            this.inputElement.placeholder = 'Название категории не может быть пустым';
            return;
        }

        if (!this.id) {
            console.error("ID категории не найден для сохранения.");
            return;
        }

        // Данные для отправки
        const requestData: UpdateCategoryRequestData = {
            title: title
        };

        try {
            const result: HttpUtilsResult<{ message?: string }> = await HttpUtils.request<{ message?: string }>
            (`/categories/income/${this.id}`, 'PUT', true, requestData);

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error) {
                alert(result.response?.message || 'Не удалось редактировать категорию');
                return;
            }
            await this.openNewRoute('/income-category');
        } catch (error: unknown) {
            console.error("Произошла ошибка при сохранении категории:", error);
            alert('Не удалось редактировать категорию');
        }
    }
}