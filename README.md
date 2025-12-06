# Digital Text Store (Vue + Vite)

Простой SPA магазин цифрового контента (тексты). Проект:
- Vue 3 + Vite
- SASS
- Лёгкий fetch-based API клиент, реализующий только нужные endpoints из `openapi.json` (который вы загрузили).
- Поддерживается регистрация, вход, корзина, оформление заказа и симуляция оплаты (вызов `/api/store/orders/{order_id}/pay`).

## Быстрый старт

1. Распакуйте этот архив.
2. Установите зависимости:
```bash
cd digital-store-vue
npm install
```
3. Укажите URL вашего бэкенда (где доступен openapi-совместимый API) в `VITE_API_BASE` (см. пример ниже) или используйте умолчание `http://localhost:8000`.

Пример `.env`:
```
VITE_API_BASE=http://localhost:8000
```

4. Запустите:
```
npm run dev
```

## Что реализовано

- Основные страницы: каталог, страница продукта, корзина, оформление (создаёт order и вызывает pay), вход/регистрация, просмотр покупок и доступа к текстам.
- Клиент опирается на структуру вашего `openapi.json` и вызывает маршруты:
  - `GET /api/store/products`
  - `GET /api/store/products/{product_id}`
  - `GET/POST/DELETE /api/store/cart`
  - `POST /api/store/orders`
  - `POST /api/store/orders/{order_id}/pay`
  - `GET /api/store/purchases` and `GET /api/store/purchases/{order_id}/content`
  - `POST /api/users/register`
  - `POST /api/users/login` (form-url-encoded)

## Примечания

- Форма оплаты — симулированная: клиент вызывает endpoint оплаты. Реальной платёжной интеграции нет.
- Для работы с авторизацией ожидается, что `POST /api/users/login` вернёт JSON с `access_token` (если нет — хранилище всё равно попытается работать).
- Вы можете расширить `src/services/api.js`, опираясь на полный `openapi.json`.
