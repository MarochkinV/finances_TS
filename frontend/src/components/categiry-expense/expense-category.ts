import {HttpUtils} from "../../utils/http-utils";
import type {OpenNewRouteCallback} from '../../types/router.types';
import type {HttpUtilsResult} from '../../types/http-utils.types';
import type {CategoryObject} from '../../types/main.types';

export class ExpenseCategory {
    readonly openNewRoute: OpenNewRouteCallback;
    readonly categoriesContainer: HTMLElement | null;
    readonly modalElement: HTMLElement | null;
    readonly modalConfirmBtn: HTMLElement | null;
    private categoryIdToDelete: string | number | null;

    constructor(openNewRoute: OpenNewRouteCallback) {
        this.openNewRoute = openNewRoute;
        this.categoriesContainer = document.querySelector('.row');
        this.modalElement = document.getElementById('myModal');
        this.modalConfirmBtn = this.modalElement ? this.modalElement.querySelector('.btn-success') : null;
        this.categoryIdToDelete = null;

        this.actionsButtons();
        void this.loadCategories();
    }

    actionsButtons(): void {
        if (!this.categoriesContainer) {
            return;
        }

        this.categoriesContainer.addEventListener('click', (e: MouseEvent): void => {

            const target: Element | null = e.target instanceof Element ? e.target.closest('a,button') : null;
            if (!target) return;

            if (target.id === 'add-category') {
                e.preventDefault();
                void this.openNewRoute('/expense-category-creation');
                return;
            }

            if (target.classList.contains('edit')) {
                e.preventDefault();
                const id: string | null = target.getAttribute('data-id');
                if (id) {
                    void this.openNewRoute(`/expense-category-edit?id=${encodeURIComponent(id)}`);
                }
                return;
            }

            if (target.classList.contains('delete')) {
                e.preventDefault();
                const id: string | null = target.getAttribute('data-id');
                if (id) {
                    this.askDelete(id);
                }
            }
        });

        if (this.modalConfirmBtn) {
            this.modalConfirmBtn.addEventListener('click', async (): Promise<void> => {
                if (!this.categoryIdToDelete) return;
                await this.deleteCategory(this.categoryIdToDelete);
                this.categoryIdToDelete = null;
                const closeBtn = this.modalElement?.querySelector('[data-dismiss="modal"]') as HTMLElement | null;
                if (closeBtn) closeBtn.click();
                await this.loadCategories();
            });
        }
    }

    async loadCategories(): Promise<void> {
        try {
            const result: HttpUtilsResult<CategoryObject[]> = await HttpUtils.request<CategoryObject[]>('/categories/expense', 'GET');

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error) {
                console.error("Ошибка при загрузке расходных категорий:", result.response);
                return;
            }

            this.displayCategories(result.response || []);
        } catch (error: unknown) {
            console.error("Произошла ошибка при загрузке расходных категорий:", error);
        }
    }

    displayCategories(categories: CategoryObject[]): void {
        if (!this.categoriesContainer) return;
        this.categoriesContainer.innerHTML = '';

        categories.forEach((cat: CategoryObject): void => {
            const col: HTMLDivElement = document.createElement('div');
            col.className = 'col';

            col.innerHTML = `
                <div class="card card-outline shadow-none border border-gray-300 d-flex flex-column justify-content-center p-3 rounded-12">
                    <div>
                        <h3 class="text-info">${cat.title || 'Без названия'}</h3> 
                    </div>
                    <div>
                        <a href="/expense-category-edit?id=${encodeURIComponent(cat.id)}" data-id="${cat.id}" class="edit btn btn-primary pt-2 pb-2 pl-3 pr-3 rounded font-weight-medium">Редактировать</a>
                        <button type="button" class="delete btn btn-danger ml-2 pt-2 pb-2 pl-3 pr-3 rounded font-weight-medium" data-toggle="modal" data-target="#myModal" data-id="${cat.id}">Удалить</button>
                    </div>
                </div>`;

            if (this.categoriesContainer) {
                this.categoriesContainer.appendChild(col);
            }
        });

        const addCol: HTMLDivElement = document.createElement('div');
        addCol.className = 'col';
        addCol.innerHTML = `
            <div class="card card-outline shadow-none border border-gray-300 d-flex flex-column justify-content-center p-4 rounded-12">
                <a href="/expense-category-creation" class="btn p-3 mb-2" id="add-category">
                    <i class="fas fa-plus text-secondary"></i>
                </a>
            </div>`;

        if (this.categoriesContainer) {
            this.categoriesContainer.appendChild(addCol);
        }
    }

    askDelete(id: string | number): void {
        this.categoryIdToDelete = id;
    }

    async deleteCategory(id: string | number): Promise<void> {
        try {
            const result: HttpUtilsResult = await HttpUtils.request<unknown>(`/categories/expense/${id}`, 'DELETE');

            if (result.redirect) {
                await this.openNewRoute(result.redirect);
                return;
            }

            if (result.error) {
                alert('Не удалось удалить расходную категорию');
                return;
            }

        } catch (error: unknown) {
            console.error("Произошла ошибка при удалении расходной категории:", error);
            alert('Не удалось удалить расходную категорию');
        }
    }
}