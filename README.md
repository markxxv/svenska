# Svenska

Статический тренажёр шведского. Vanilla JavaScript ES modules, Tailwind v4, Web Speech API. Уроки, словари и фразы — **три независимых типа материалов**, доступные из нижнего меню.

## Навигация и файлы

- **Главная** (`#/`): уроки по темам с теорией, примерами, карточками и тестами.
- **Словари** (`#/dictionaries`): независимые коллекции слов, например «50 базовых слов», «В магазине».
- **Фразы** (`#/phrases`): независимые коллекции разговорных фраз с озвучкой, переводом и разбором слов.

```text
data/
├── index.json                   # каталог уроков, автоматически
├── order-food/                  # один из уроков
│   ├── meta.json
│   ├── theory.json
│   ├── examples.json
│   ├── cards.json
│   └── quiz.json
├── dictionaries/
│   ├── index.json               # каталог словарей, автоматически
│   ├── essentials/
│   │   ├── meta.json
│   │   └── items.json
│   └── shop/
│       ├── meta.json
│       └── items.json
└── phrases/
    ├── index.json               # каталог фраз, автоматически
    ├── basics/
    │   ├── meta.json
    │   └── items.json
    └── around-town/
        ├── meta.json
        └── items.json
```

Старые `dictionary.json` и `phrases.json` внутри папок уроков оставлены как архивные исходники, но больше не выводятся в уроках. Отдельные коллекции читают **только свои JSON**.

## Добавить коллекцию

1. Создать папку `data/dictionaries/<slug>/` или `data/phrases/<slug>/`.
2. Положить `meta.json` и `items.json`.
3. Запустить `npm run content:sync`; при добавлении в `main` GitHub Actions обновит каталоги автоматически.

Пример `meta.json`:

```json
{"slug":"restaurant","title":"В ресторане","description":"Заказ и оплата","emoji":"🍽️","order":5}
```

Формат `items.json` словаря:

```json
[{"sv":"en nota","ru":"счёт","category":"Оплата","example":"Kan jag få notan?"}]
```

Формат `items.json` фраз:

```json
[{"id":"restaurant-1","text":"Kan jag få notan?","translation":"Можно счёт?","words":[["Kan","kunna","можно"],["jag","jag","я"],["få","få","получить"],["notan","nota","счёт"]]}]
```

Каждый объект внутри `words` может содержать дополнительно пояснение, устойчивое выражение и его перевод — как в исходной демке.

## Разработка

Запуск без сборки: `python3 -m http.server 8000` → http://localhost:8000/

```bash
npm run content:sync  # обновить три index.json
npm run content:check # проверить актуальность
npm test              # тесты структуры и рендеринга
```

Обычный браузер не умеет самостоятельно перечислять папки на сервере, поэтому приложение загружает автоматически сгенерированные каталоги. Изменять JS при добавлении новой коллекции не нужно.

Прогресс, избранное и текущая фраза сохраняются в `localStorage` конкретного браузера.
