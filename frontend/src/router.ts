import {Login} from "./components/auth/login";
import {SignUp} from "./components/auth/sign-up";
import {Main} from "./components/main";
import {Logout} from "./components/auth/logout";
import {IncomeAndExpense} from "./components/operations/income-and-expense";
import {IncomeAndExpenseCreation} from "./components/operations/income-and-expense-creation";
import {IncomeAndExpenseEdit} from "./components/operations/income-and-expense-edit";
import {IncomeCategory} from "./components/category-income/income-category";
import {IncomeCategoryCreation} from "./components/category-income/income-category-creation";
import {IncomeCategoryEdit} from "./components/category-income/income-category-edit";
import {ExpenseCategory} from "./components/categiry-expense/expense-category";
import {ExpenseCategoryCreation} from "./components/categiry-expense/expense-category-creation";
import {ExpenseCategoryEdit} from "./components/categiry-expense/expense-category-edit";
import {HttpUtils} from "./utils/http-utils";
import type {Route, User, BalanceFetchResponse} from './types/router.types';
import type {HttpUtilsResult} from "./types/http-utils.types";

export class Router {
    readonly titlePageElement: HTMLElement | null;
    readonly contentPageElement: HTMLElement | null;
    readonly adminLteStyleElement: HTMLElement | null;
    private routes!: Route[];

    constructor() {
        this.titlePageElement = document.getElementById('title');
        this.contentPageElement = document.getElementById('content');
        this.adminLteStyleElement = document.getElementById('adminlte_style');

        if (!this.contentPageElement) {
            console.error("Элемент с id 'content' не найден в DOM.");
            return;
        }

        this.initEvents();

        this.initMenuActiveState();

        this.updateUserName();

        this.getBalanceInfo().catch(error => {
            console.error("Ошибка при получении баланса при инициализации:", error);
        });

        // Массив, который отвечает за наши страницы
        this.routes = [
            {
                route: '/',
                title: 'Главная',
                filePathTemplate: '/templates/pages/main.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    new Main();
                },
            },
            {
                route: '/404',
                title: 'Страница не найдена',
                filePathTemplate: '/templates/pages/404.html',
                useLayout: false,
                requiresAuth: false,
            },
            {
                route: '/login',
                title: 'Авторизация',
                filePathTemplate: '/templates/auth/login.html',
                useLayout: false,
                requiresAuth: false,
                load: (): void => {
                    const body: HTMLElement = document.body;
                    if (body) {
                        body.classList.add('login-page');
                        body.style.height = '100vh';
                    }
                    new Login(this.openNewRoute.bind(this));
                },
                unload: (): void => {
                    const body: HTMLElement = document.body;
                    if (body) {
                        body.classList.remove('login-page');
                        body.style.height = 'auto';
                    }
                },
            },
            {
                route: '/sign-up',
                title: 'Регистрация',
                filePathTemplate: '/templates/auth/sign-up.html',
                useLayout: false,
                requiresAuth: false,
                load: (): void => {
                    const body: HTMLElement = document.body;
                    if (body) {
                        body.classList.add('register-page');
                        body.style.height = '100vh';
                    }
                    new SignUp(this.openNewRoute.bind(this));
                },
                unload: (): void => {
                    const body: HTMLElement = document.body;
                    if (body) {
                        body.classList.remove('register-page');
                        body.style.height = 'auto';
                    }
                },
            },
            {
                route: '/logout',
                requiresAuth: true,
                load: (): void => {
                    new Logout(this.openNewRoute.bind(this));
                },
            },
            {
                route: '/income-and-expense',
                title: 'Доходы & Расходы',
                filePathTemplate: '/templates/pages/operations/income-and-expense.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    new IncomeAndExpense(this.openNewRoute.bind(this));
                },
            },
            {
                route: '/income-and-expense-creation',
                title: 'Создание дохода/расхода',
                filePathTemplate: '/templates/pages/operations/income-and-expense-creation.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    new IncomeAndExpenseCreation(this.openNewRoute.bind(this));
                },
            },
            {
                route: '/income-and-expense-edit',
                title: 'Создание дохода/расхода',
                filePathTemplate: '/templates/pages/operations/income-and-expense-edit.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    new IncomeAndExpenseEdit(this.openNewRoute.bind(this));
                },
            },
            {
                route: '/income-category',
                title: 'Доходы & Расходы',
                filePathTemplate: '/templates/pages/category-income/income-category.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.add('menu-open');
                    new IncomeCategory(this.openNewRoute.bind(this));
                },
                unload: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.remove('menu-open');
                },
            },
            {
                route: '/income-category-creation',
                title: 'Создание категории доходов',
                filePathTemplate: '/templates/pages/category-income/income-category-creation.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.add('menu-open');
                    new IncomeCategoryCreation(this.openNewRoute.bind(this));
                },
                unload: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.remove('menu-open');
                },
            },
            {
                route: '/income-category-edit',
                title: 'Создание категории доходов',
                filePathTemplate: '/templates/pages/category-income/income-category-edit.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.add('menu-open');
                    new IncomeCategoryEdit(this.openNewRoute.bind(this));
                },
                unload: () => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.remove('menu-open');
                },
            },
            {
                route: '/expense-category',
                title: 'Доходы & Расходы',
                filePathTemplate: '/templates/pages/category-expense/expense-category.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.add('menu-open');
                    new ExpenseCategory(this.openNewRoute.bind(this));
                },
                unload: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.remove('menu-open');
                },
            },
            {
                route: '/expense-category-creation',
                title: 'Создание категории расходов',
                filePathTemplate: '/templates/pages/category-expense/expense-category-creation.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.add('menu-open');
                    new ExpenseCategoryCreation(this.openNewRoute.bind(this));
                },
                unload: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.remove('menu-open');
                },
            },
            {
                route: '/expense-category-edit',
                title: 'Редактирование категории расходов',
                filePathTemplate: '/templates/pages/category-expense/expense-category-edit.html',
                useLayout: '/templates/layout.html',
                requiresAuth: true,
                load: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.add('menu-open');
                    new ExpenseCategoryEdit(this.openNewRoute.bind(this));
                },
                unload: (): void => {
                    const menuElement: HTMLElement | null = document.getElementById('income-expense-category');
                    if (menuElement) menuElement.classList.remove('menu-open');
                },
            },
        ];
    }

    // Метод для проверки авторизации пользователя
    isAuthenticated(): boolean {
        const userData: string | null = localStorage.getItem('userData');
        return userData !== null && userData !== undefined && userData !== 'null' && userData !== 'undefined';
    }

    // Метод для перенаправления неавторизованных пользователей
    redirectToLogin(): void {
        if (window.location.pathname !== '/login') {
            history.replaceState({}, '', '/login');
            this.activateRoute();
        }
    }

    // Метод для инициализации активного состояния меню
    initMenuActiveState(): void {
        const savedActiveItem: string | null = sessionStorage.getItem('activeMenuItem');
        if (savedActiveItem) {
            // Устанавливаем с небольшой задержкой чтобы DOM успел полностью загрузиться
            setTimeout((): void => {
                this.setActiveMenuItem(savedActiveItem);
            }, 100);
        }
    }

    // Метод для установки активного пункта меню
    setActiveMenuItem(currentRoute: string): void {
        // Удаляем активный класс у всех пунктов меню
        const allNavLinks: NodeListOf<Element> = document.querySelectorAll('.nav-sidebar .nav-link');
        allNavLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Определяем, какой маршрут должен быть активным в меню
        let activeRoute: string = currentRoute;

        // Если текущий маршрут — это подстраница категории доходов, используем родительский маршрут
        if (currentRoute.startsWith('/income-category-')) {
            activeRoute = '/income-category';
        } else if (currentRoute.startsWith('/expense-category-')) {
            activeRoute = '/expense-category';
        } else if (currentRoute.startsWith('/income-and-expense-')) {
            activeRoute = '/income-and-expense';
        }

        // Находим и активируем соответствующий пункт меню по href
        const targetLink = document.querySelector(`.nav-sidebar .nav-link[href="${activeRoute}"]`) as HTMLAnchorElement | null;

        if (targetLink) {
            targetLink.classList.add('active');

            // Активируем родительский пункт, если это подменю
            const parentItem: Element | null = targetLink.closest('.nav-treeview');
            if (parentItem) {
                const parentLink = parentItem.previousElementSibling as HTMLAnchorElement | null;
                if (parentLink && parentLink.classList.contains('nav-link')) {
                    parentLink.classList.add('active');
                }
            }
            sessionStorage.setItem('activeMenuItem', currentRoute);
        }
    }

    // Метод для обновления имени пользователя в user panel
    updateUserName(): void {
        const userNameElement: HTMLElement | null = document.getElementById('user-name');
        if (userNameElement) {
            const userData: string | null = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user: User = JSON.parse(userData);

                    userNameElement.textContent = user.fullName || user.name || 'Пользователь';
                } catch (e: unknown) {
                    console.error('Ошибка парсинга userData:', e);
                    userNameElement.textContent = 'Пользователь';
                }
            }
        }
    }


    // Метод для отображения баланса
    async getBalanceInfo(): Promise<void> {
        try {
            const result: HttpUtilsResult<BalanceFetchResponse> = await HttpUtils.request<BalanceFetchResponse>('/balance', 'GET');

            if (result.error || result.redirect) {

                if (result.redirect) {
                    return this.openNewRoute(result.redirect);
                }
                return;
            }

            const balanceElement: HTMLElement | null = document.getElementById('balance');
            if (balanceElement && result?.response?.balance !== undefined) {
                balanceElement.innerText = result.response.balance + '$';
            }

        } catch (error) {
            const balanceElement: HTMLElement | null = document.getElementById('balance');
            if (balanceElement) {
                balanceElement.innerText = 'Ошибка';
            }
        }
    }

    initEvents(): void {
        window.addEventListener('DOMContentLoaded', this.activateRoute.bind(this));
        window.addEventListener('popstate', this.activateRoute.bind(this));
        // Событие п клику на любй элемент
        document.addEventListener('click', this.clickHandler.bind(this));
    }

    // Функция для навигации между маршрутами routers
    async openNewRoute(url: string): Promise<void> {
        const currentRoute = window.location.pathname;
        history.pushState({}, '', url);

        await this.activateRoute(undefined, currentRoute);
    }

    // Функция для загрузки новых страниц (newRoute), после нажатия click
    async clickHandler(e: MouseEvent): Promise<void> {

        let element: HTMLAnchorElement | null = null;
        if (e.target instanceof HTMLAnchorElement) {
            element = e.target;
        } else if (e.target instanceof Element && e.target.parentElement instanceof HTMLAnchorElement) {
            element = e.target.parentElement;
        }

        if (element) {
            e.preventDefault();
            // Находим в ссылке строки с доменным именем и заменяем на пустую
            const url: string = element.href.replace(window.location.origin, '');
            // Проверка на то что в ссылке # или ничего нет, нужно завершить функционал
            if (!url || url === '/#' || url.startsWith('javascript:void(0)')) {
                return;
            }

            await this.openNewRoute(url);

        }
    }

    // Функция для активации страницы
    async activateRoute(e?: Event, oldRoute: string | null = null): Promise<void> {
        // Удаление стилей и вызов unload для старого маршрута
        if (oldRoute) {
            const currentRoute: Route | undefined = this.routes.find(item => item.route === oldRoute);

            if (currentRoute) {
                // Удаляем стили
                if (currentRoute.styles && Array.isArray(currentRoute.styles)) {
                    currentRoute.styles.forEach(style => {
                        const link = document.querySelector(`link[href='/css/${style}']`) as HTMLLinkElement | null;
                        if (link) {
                            link.remove();
                        }
                    });
                }
                // Вызываем unload
                if (currentRoute.unload && typeof currentRoute.unload === 'function') {
                    currentRoute.unload();
                }
            } else {
                console.warn(`Не удалось найти маршрут для очистки: ${oldRoute}`);
            }
        }

        // Определяем на какой мы странице
        const urlRoute: string = window.location.pathname;
        const newRoute: Route | undefined = this.routes.find(item => item.route === urlRoute);

        // Проверка авторизации для защищенных маршрутов
        if (newRoute && newRoute.requiresAuth && !this.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }


        if (this.isAuthenticated() && (urlRoute === '/login' || urlRoute === '/sign-up')) {
            history.replaceState({}, '', '/');
            await this.activateRoute();
            return;
        }

        if (newRoute) {
            // Проверка, имеются ли определенные стили которые нужно загрузить на страницу, в случае чего устанавливаем их
            if (newRoute.styles && newRoute.styles.length > 0) {
                newRoute.styles.forEach(style => {
                    const link: HTMLLinkElement = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = '/css/' + style;
                    if (this.adminLteStyleElement) {
                        document.head.insertBefore(link, this.adminLteStyleElement);
                    } else {
                        document.head.appendChild(link);
                    }
                });
            }
            // Проверка, что title у routes существует
            if (newRoute.title && this.titlePageElement) {
                this.titlePageElement.innerText = newRoute.title + ' | Lumincoin Finance';
            }

            // Вставляем шаблон (template)
            if (newRoute.filePathTemplate) {

                let contentBlock: HTMLElement | null = this.contentPageElement;

                if (newRoute.useLayout) {

                    try {
                        // Инициализация Treeview
                        setTimeout((): void => {
                            $('[data-widget="treeview"]').Treeview('init');
                        }, 100);

                        const layoutContentElement: HTMLElement | null = document.getElementById('content-layout');
                        if (layoutContentElement) {
                            contentBlock = layoutContentElement;
                        }
                        const body: HTMLElement = document.body;
                        if (body) {
                            body.classList.add('sidebar-mini', 'layout-fixed');
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки layout:', error);
                    }

                    if (this.contentPageElement) {
                        this.contentPageElement.innerHTML = await fetch(newRoute.useLayout as string).then(response => response.text());
                        const layoutContentElement: HTMLElement | null = document.getElementById('content-layout');
                        if (layoutContentElement) {
                            contentBlock = layoutContentElement;
                        }
                        // Добавляем классы для сайдбара
                        const body: HTMLElement = document.body;
                        if (body) {
                            body.classList.add('sidebar-mini');
                            body.classList.add('layout-fixed');
                        }
                    }
                } else {
                    // И удаляем если не требуются классы сайдбара
                    const body: HTMLElement = document.body;
                    if (body) {
                        body.classList.remove('sidebar-mini');
                        body.classList.remove('layout-fixed');
                    }
                }
                if (contentBlock) {
                    contentBlock.innerHTML = await fetch(newRoute.filePathTemplate).then(response => response.text());
                }

                // Обновляем имя пользователя после загрузки контента
                this.updateUserName();
                // Устанавливаем активное состояние меню после загрузки контента
                setTimeout((): void => {
                    this.setActiveMenuItem(newRoute.route);
                }, 100);

                // Отображение баланса
                if (this.isAuthenticated() && (newRoute.route !== '/login' && newRoute.route !== '/logout')) {
                    const balanceElement: HTMLElement | null = document.getElementById('balance');
                    if (balanceElement) {
                        this.getBalanceInfo().catch(error => {
                            console.error("Ошибка при обновлении баланса после загрузки страницы:", error);
                        });
                    }
                }
            }

            // Проверяем есть ли в newRoute функция Load и вызываем ее
            if (newRoute.load && typeof newRoute.load === 'function') {
                newRoute.load();
            }
        } else {
            // Если route не найден, переводим на 404
            console.log('Маршрут не найден:', urlRoute);
            history.pushState({}, '', '/404');
            await this.activateRoute(undefined, urlRoute);
        }
    }
}