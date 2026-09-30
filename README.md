# Hypecheck — игра о вирусных роликах и pm-AMM devnet

**Игра:** https://predictionmartket.vercel.app/  
**Рынок pm-AMM:** https://predictionmartket.vercel.app/market.html

Главная страница — игра по мотивам сравнения двух вирусных роликов: просмотрите видео, выберите ролик с большим числом просмотров, поставьте виртуальные монеты и узнайте результат. Пять раундов, баланс и рекорд сохраняются в браузере. Числа просмотров в игре иллюстративные и не являются живой статистикой YouTube. Реальная devnet-интеграция с pm-AMM сохранена на отдельной странице рынка.

Сайт опубликован в Vercel. Репозиторий также публикуется в GitHub Pages. Автоматическое подключение GitHub к Vercel требует Login Connection в настройках Vercel; текущий релиз загружен через CLI.

Приложение для хакатона: посетитель открывает страницу, автоматически получает burner wallet и тестовые mUSDC/SOL, выбирает YES или NO, видит котировку и совершает подписанную сделку в Solana devnet без Phantom. После подтверждения обновляются вероятность, баланс и обе позиции. Сделки содержат ссылки на Solana Explorer.

**Публичное демо:** https://arlmango.github.io/predictionmartket/

## Локальный запуск

Node.js 22+. Из корня репозитория:

```bash
npm ci && npm run dev
```

Откройте http://127.0.0.1:5173/predictionmartket/ .

```bash
npm test
npm run build
npm run preview
```

## Сценарий для жюри — 60 секунд

- **0–15 с:** открыть публичную ссылку; показать вопрос и срок. Burner wallet создаётся автоматически, faucet выдаёт 1 000 mUSDC и 0,02 devnet SOL. Phantom не нужен.
- **15–25 с:** выбрать YES, оставить 5 mUSDC. Показать ожидаемое количество YES, минимальный выход, комиссию 2% и slippage 1%.
- **25–45 с:** нажать «Купить YES», дождаться подтверждения. Показать изменение вероятности, уменьшение баланса и появление YES в позиции.
- **45–60 с:** открыть подтверждённую сделку в Explorer либо выбрать NO и показать вторую котировку. Пояснить: только тестовые токены, результат рынка разрешает создатель вручную.

Подготовьте вкладку заранее: скорость devnet и faucet зависит от сети. При ошибке приложение показывает причину и кнопку повторного подключения. Не повторяйте транзакцию с неизвестным статусом до проверки позиции.

## Рынок и данные

Рынок `262434752332042`, PDA `7iKKVbKhjGouL8a9QCTtHVEq18prp28gt5nxqt9giRoh`:

**Will our hackathon demo reach 10 unique traders?** YES, если до конца недельного периода торговать будут минимум 10 уникальных кошельков. Создатель вручную проверяет сделки и разрешает рынок после закрытия 7 октября 2026 года. Приложение читает точный срок из on-chain account и запрещает сделки после него. Рынок создан с 100 mUSDC ликвидности, стартовая вероятность 50%.

`src/config.json` содержит только публичный market ID и signature создания. Чтобы создать следующий рынок, укажите путь к существующему **devnet** кошельку вне репозитория:

```bash
WALLET=/absolute/path/to/devnet-wallet.json npm run market:create
```

Кошелёк должен иметь 100 тестовых mUSDC и devnet SOL для создания рынка. Команда создаёт новый недельный рынок и обновляет публичную конфигурацию. Затем пересоберите/опубликуйте приложение. Секретный ключ не копируется и не печатается.

## Интеграция

- Официальный `@pm-amm/sdk@0.2.0`; `client.send.swap` создаёт необходимые token accounts, подписывает burner wallet и подтверждает транзакцию.
- Официальный [burner wallet kit](https://github.com/sparkfun-labs/pm-amm/tree/main/examples/burner-wallet) скопирован в `src/vendor` с MIT license и закреплённым источником.
- Helper котировок адаптирован из `clientSideQuote` официального приложения; использует исключительно `@pm-amm/sdk/math`, учитывает 2% комиссии и приведение резервов к текущему времени. `minOutput` задаёт 1% slippage и проверяется программой. Отдельный файл `examples/helpers/pm-amm-helpers.ts`, упомянутый devnet llms.txt, отсутствовал в опубликованных исходниках на момент разработки; собственный AMM не реализован.
- Только RPC `https://api.devnet.solana.com`, программа `GV1FMGHRYBjQLaghE5fnGuYCuCcpdt3GD5xEX3TwN16y`, mUSDC mint `3WQ8hCqTNwjrh8WzE2XyoZoUrd1miPcwWfMkmFPUMEWZ`.
- Ключ burner хранится в localStorage браузера. Используйте только тестовые средства. Другой браузер/домен создаёт новый кошелёк; очистка данных сайта удаляет доступ к нему.
- Вероятность и позиции читаются из Solana. История приложения локальная и относится к этому браузеру; Explorer подтверждает on-chain результат.

## Публикация

GitHub Actions `.github/workflows/pages.yml` запускает тесты и сборку на push в `main`, затем публикует `dist` через GitHub Pages. Pages настроен на GitHub Actions. Секреты для сборки/публикации не нужны. Vite base настроен на `/predictionmartket/`.

## Проверено 30 сентября 2026

Локальный браузер автоматически получил 1 000 mUSDC / 0,02 SOL. Покупка YES за 5 mUSDC: вероятность 50% → 51,5%, баланс 1 000 → 995, позиция 9,6517 YES. Затем покупка NO за 5 mUSDC: баланс 990, позиция 9,9481 NO, вероятность YES вернулась примерно к 50%.

- [Подтверждённая сделка YES](https://explorer.solana.com/tx/3vTiaeSYLS36c1fSMQRHebQNsGjhyt4q3G7HjvKaprR6S84M5M5NBYzerKQh7STfVRaJFNB1H5vkiR3GLdnNYaaT?cluster=devnet)
- [Подтверждённая сделка NO](https://explorer.solana.com/tx/2NNzcuVZBHg9xLxN5ghkY96JBuH987hMEpzexCDLEANHsnbjt4gJRCzZ8PZwvpD2EMTLhTJn7BbQJHog1MEVWjpG?cluster=devnet)

`npm test` и `npm run build` проходят. Секретный `devnet-wallet.json` не копировался в репозиторий.

Публичная GitHub Pages страница также проверена с новым burner wallet: faucet выдал тестовые средства; [покупка YES за 5 mUSDC подтверждена](https://explorer.solana.com/tx/VjYyt5KSxan75JaUDry6GRZw7rt56eax4FrfHfbuCviACnz4EEaj85TDeoP4fEDFHG3aSoQ7FdiFtYubSr18Vmn?cluster=devnet), баланс стал 995 mUSDC, позиция 9,6606 YES, вероятность 51,5%.
