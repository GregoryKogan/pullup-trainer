# Глубокий ресёрч: приложения для тренировки подтягиваний — 2026-08-15

## Вопрос

Собрать всю доступную информацию о приложениях для тренировки подтягиваний, устроенных по модели «список тренировок с нарастающей сложностью; каждая тренировка — список повторений по подходам; встроенный календарь и таймер отдыха», и о деталях их функционала. Глубина — Exhaustive: 12 тредов, 2 раунда + критический проход.

## Executive summary

Ниша делится на три пласта: массовые калистеника-приложения (Freeletics — 10 млн+ установок, Thenx, Madbarz, Calisteniapp, Thenics, Caliverse, Calistree), узкоспециализированные «турниковые» челленджи с прогрессией (20 Pull Ups от Fitness22 и Zen Labs, 50 Pull-ups BeStronger, 100 Подтягиваний c нуля, PullUps 20) и бесплатные веб/PDF-программы без приложений (Armstrong, Recon Ron, Russian Fighter Pullup, 50pullups.com), которые сообщество считает «эталоном». Ключевая находка: **все знаменитые схемы «список повторений по подходам» публичны и точно документированы** (таблицы Russian Fighter 3RM/5RM/15RM/25RM, 30-недельная таблица Recon Ron, циклы 50pullups.com) — их можно реализовать в коде напрямую. Специализированного веб-приложения/PWA для подтягиваний на рынке нет — ниша нативная, и это свободная ниша для проекта на Vue/PWA. Главные боли пользователей сквозные: принудительные подписки, реклама, сбои с потерей прогресса и «тренер», который не подстраивается под уровень. Полноценный календарь с плановыми днями — редкая фича (по сути только Madbarz Premium), у большинства конкурентов — лишь история. Научная база по таймеру отдыха есть и она противоречит классике: для гипертрофии нужен отдых ≥90 с, а не 30–90 с, для силы — 3–5 мин.

## Ключевые выводы

### 1. Карта рынка

| Приложение | Разработчик | Платформы | Масштаб (данные сторов) | Рейтинг | Ядро продукта |
|---|---|---|---|---|---|
| Freeletics | Freeletics GmbH | iOS/Android | 10M+ (GP), ~260 тыс. отзывов [13] | 4.1–4.6 | AI-тренер, HIIT, бодивейт |
| Thenx | Calisthenics Online LLC | iOS/Android | 1M+ (GP), ~16,1 тыс. отзывов [19] | GP 4.3 / iOS 4.77 | Видео-тренировки, скиллы (muscle-up, planche) |
| Madbarz | Madbarz | iOS/Android | 1M+ (GP), ~19 тыс. отзывов [20] | 4.7 | Street workout, круги, сообщество |
| Calisteniapp | Iñaki Tajes | iOS/Android | 1M+ (GP), ~37 тыс. отзывов; ~3,1 млн (оценка AppBrain) [21] | GP 4.6 / iOS 4.79 | Прогрессии на турнике, фронт-левер |
| Thenics | Abad | iOS/Android | ~36 тыс. отзывов (GP) [22] | 4.5–4.6 | Обучение скиллам калистеники |
| Caliverse | Caliverse SIA | iOS/Android | iOS ~1 тыс. оценок, GP ~2,9 тыс. [23][24] | iOS 4.8 / GP 4.5 | Дерево навыков, Smart Coach |
| Calistree | Calistree LLC | iOS/Android | ~529 тыс. GP (оценка chrome-stats), iOS 4,4 тыс. оценок [25] | GP 4.76 / iOS 4.4 | Адаптивные программы, 1500+ упражнений |
| Alpha Progression | Alpha Progression | iOS/Android | 40 тыс.+ оценок, ~1,9 млн GP (оценка) [26] | 4.8–4.9 | Научно обоснованные планы, RIR |
| 20 Pull Ups (Fitness22) | FITNESS22 LTD | iOS/Android | iOS 7 984 оценки [9] | 4.4 | 0→20 подтягиваний за 20 недель |
| 20 Pull Ups Trainer Challenge | Zen Labs | iOS/Android | iOS 887 оценок [10] | 4.6 | 0→20 за 6–8 недель, голосовой коуч |
| 50 Pull-ups BeStronger | ShvagerFM | iOS/Android | н/д (GP) [27] | н/д | Тест → программа, таймер, медали |
| 100 Подтягиваний c нуля | Power Ups (Dmytro Dolotov) | iOS/Android/RuStore | 1M+ (GP), 22,8 тыс. отзывов [15][16] | 4.5 | 20 планов от «с нуля» до muscle-up |
| Just 6 Weeks («100 отжиманий») | Aleksandr Lomakin / Antireverse | iOS/Android | 1M+ (GP), 25,1 тыс. отзывов [11][12] | 4.6–4.7 | 11 программ-челленджей, вкл. «20 подтягиваний» |
| SOTKA: 100-дневный воркаут | 100.workout.su | iOS/Android | 8,5 тыс. отзывов (GP) [28] | 4.5 | Бесплатная 100-дневная программа с турником |
| Подтягивания 30 | Bevik | RuStore | 3 тыс.+ скачиваний [29] | 4.1 | Русскоязычный челлендж |
| Хват: Тренировка подтягиваний | Варфоломеев Олег | RuStore | «до 1 тыс.» скачиваний, вышла 02.03.2026 [30][31] | 5.0 (4 оценки) | Схема 10×10, офлайн, без регистрации |

Примечания: Pull Ups PRO (Runtastic) закрыт — Runtastic свернул линейку «lit apps» (источник-агрегатор, одиночный); точные числа загрузок Google Play публикуются диапазонами, поэтому «3,1 млн» и «529 тыс.» — оценки статистических сервисов, а не официальные цифры [21][25].

### 2. Схемы прогрессии — точные таблицы «список подходов»

**Russian Fighter Pullup Program (Павел Цацулин / StrongFirst)** — «придумана неизвестным русским автором, я лишь популяризовал её» [1][2][3]. Правило: 5 подходов в день, каждый следующий подход — минус 1 повтор; на следующий день +1 повтор к последнему подходу, затем к предпоследнему и т.д.; 4 недели, затем 2–3 дня отдыха и тест максимума; заявленный типичный рост в 2,5–3 раза. Правило входа: если максимум 6–12 повт., начинай с того дня таблицы, где появляется твой рекорд (макс 6 → день 7, макс 8 → день 19); застрял — откатись на неделю [1][3].

Таблица 5RM (для максимума 5 повт., 30 дней) [2][3]:
Д1 5,4,3,2,1 · Д2 5,4,3,2,2 · Д3 5,4,3,3,2 · Д4 5,4,4,3,2 · Д5 5,5,4,3,2 · Д6 отдых · Д7 6,5,4,3,2 · Д8 6,5,4,3,3 · Д9 6,5,4,4,3 · Д10 6,5,5,4,3 · Д11 6,6,5,4,3 · Д12 отдых · Д13 7,6,5,4,3 · … · Д19 8,7,6,5,4 · … · Д25 9,8,7,6,5 · … · Д29 9,9,8,7,6 · Д30 отдых.

Таблица 3RM (12 дней, для максимума 3 или «на чистую силу» с отягощением) [3]: Д1 3,2,1,1 · Д2 3,2,1,1 · Д3 3,2,2,1 · Д4 3,3,2,1 · Д5 4,3,2,1 · Д6 отдых · Д7 4,3,2,1,1 · Д8 4,3,2,2,1 · Д9 4,3,3,2,1 · Д10 4,4,3,2,1 · Д11 5,4,3,2,1 · Д12 отдых → переход на 5RM. Есть также таблицы 15RM (старт 12,10,8,6,4) и 25RM (старт 20,16,12,8,4) [3]. Отдых — «сколько хочешь» (4–8 мин при высоких RM), можно распределять подходы в течение дня [1].

**Armstrong Pull-up Program (майор Чарльз Льюис Армстронг, USMC)** [4]: цель — один подход в 20 повт. за 6–8 недель; 5 тренировочных дней подряд (Пн–Пт), Сб–Вс отдых. Утром — 3 максимальных подхода отжиманий; подтягивания через 3–4 часа. День 1: 5 максимальных подходов, отдых 90 с. День 2 (пирамида): 1, 2, 3… до провала + 1 максимальный подход; отдых = 10 с × повторы предыдущего подхода. День 3: 9 тренировочных подходов (3 обычным хватом + 3 ладони к себе + 3 широким), отдых 60 с. День 4: максимум тренировочных подходов до отказа, отдых 60 с. День 5: повторить самый тяжёлый день недели. Прогрессия: если на Дне 4 сделано ≥9 подходов — со следующей недели +1 повтор в тренировочный подход [4].

**Recon Ron Pull-up Program** [5][6]: 5 подходов в день, воскресенье — выходной; вход — 6 чистых подтягиваний. Неделя 1: 6,5,5,4,3; … Неделя 21: 20,12,11,11,10; … Неделя 30: 26,15,14,14,13. Цель — 20 «мёртвых» подтягиваний; ретеста нет, прибавка распределена по неделям [5][6].

**50pullups.com (веб-программа)** [7][8]: сначала тест максимума → 14 «корзин» уровня (<4, 4–5, 6–8, … >40) → цикл 6 тренировочных дней × 5 подходов, последний подход «Max (мин. N)», отдых ≥120 с; после цикла — повторный тест. Пример корзины «6–8»: Д1 2,3,2,2,Max(3); Д2 2,3,2,2,Max(4); Д3 3,4,2,2,Max(4); Д4 3,4,3,3,Max(4); Д5 3,5,3,3,Max(5); Д6 4,5,4,4,Max(6) [8].

**20 Pull Ups (Fitness22)** [9]: 0→20 подтягиваний за 20 недель: 3 уровня («0–8 за 8 недель; 8–14 за 6 недель; 14–20 за 6 недель»), 20 минут × 3 раза в неделю, аудио-тренер диктует повторы и отдых. Посуточные таблицы публикуются только внутри приложения (в сторе их нет) [9].

**Zen Labs 20 Pull Ups Trainer** [10]: 0→20 за 6 недель; есть программа для тех, кто не может сделать ни одного подтягивания (начинается с удержания на перекладине и негативов); голосовые подсказки, автоподсчёт повторений через распознавание движений (v4.0/4.1, июнь 2026) [10].

**Just 6 Weeks (Lomakin/Antireverse)** [11][12]: 11 программ в одном приложении (100 Push Ups, 200 Sit Ups, 200 Squats, 20 Pull Ups, 10 Minute Plank, 150 Bench Dips, 100 Dips, 150 Leg Raises, 150 Lunges, 50 Burpees, 5 Minute Jump Rope). Механика: тест → уровень → 3 тренировки в неделю по 10–15 мин → 6 недель; если день не выполнен — приложение его повторяет, а не продвигает (по отзывам, в официальном описании не сформулировано) [11]. Первоисточник идеи — сайт hundredpushups.com Стива Спайрса (с 2008) и его книжная серия «7 Weeks» [33]. Приложение существовало уже в 2016 г. — обзор в British Journal of Sports Medicine (Sagarra Romero & Monroy Antón, BJSM 50(19):1226) [34]. Важно: Zen Labs — НЕ разработчик Just 6 Weeks, это конкурирующее семейство challenge-приложений (0-100 Pushups, 0-200 Situps, 0-200 Squats, 20 Pull Ups) [10][11].

**Grease the Groove (GTG, Цацулин)** [14]: несколько субмаксимальных подходов (~40–50% от максимума) в течение дня, никогда до отказа, идеальная техника; пример из первоисточника: 5 повт. при каждом проходе в подвал (25–100 повт./день) → 20 повт. подряд через несколько недель [14].

**«100 Подтягиваний c нуля»** [15][16]: 20 планов (классические, широкий/обратный/смешанный хват, за голову, лучник, на одной руке, с прыжком, слоумо, выход силы и др.), «15 минут в день, 3 раза в неделю», адаптивная нагрузка, таймер отдыха ~30 с (по отзывам — не настраивается, это частая жалоба), графики, напоминания, турнирная таблица ТОП-100 [15][16].

### 3. Функционал по блокам (кто и как реализует)

**Календарь тренировок** — слабое место ниши: полноценный календарь с плановыми днями есть только у Madbarz Premium (добавлен в v6.4.0, 17.03.2022) и у общих трекеров (Strong, Hevy, StrengthLog) [20][36]. У «турниковых» специалистов (BeStronger, Fitness22, 100 Pull Ups, PullUps 20) — только история тренировок; отзыв на BeStronger от 08.12.2020 прямо требует «calendar view» [27][9][15].

**Таймер отдыха**: BeStronger — настраиваемый таймер после каждого подхода [27]; Fitness22 — аудио-коуч командует, когда отдыхать и продолжать [9]; «Хват» — авто-таймер 3 мин со звуком, с опцией «−10 с отдыха за каждую успешную тренировку» [30]; Hevy (эталон реализации в трекерах) — авто-таймер 5 с–5 мин со стартом после отметки сета, уведомлением и кнопками ±15 с [37]; у «100 Подтягиваний» отдых фиксирован ~30 с и не настраивается — одна из главных жалоб [16]. Автостарт после подхода и вибрация как явные фичи у pull-up-приложений не документированы (есть звук/уведомление) [37][30][23].

**Журнал и история**: BeStronger — журнал + облачный бэкап/восстановление [27]; Fitness22 — история общая с линейкой приложений [9]; экспорт CSV заявлен только у Just 6 Weeks (добавлен в v4.1.5, окт. 2021) [11].

**Статистика**: графики прогресса — 100 Pull Ups [16], Pull Ups Personal Trainer [38], Hang King (рекорды, дневные итоги, «beautiful charts») [39]; у BeStronger — «quick stats» (среднее, статус программы, медали) [27].

**Напоминания**: BeStronger [27], 100 Pull Ups [16], Madbarz (v6.7.0, 20.12.2022) [20]; у Fitness22 не заявлены [9].

**Интеграции**: почти всё «яблочное». Apple Health/HealthKit: Madbarz (v6.1.0), Fitness22, Freeletics [20][9][13]. Apple Watch: Fitness22 (с v6.0, 2015), Just 6 Weeks, Caliverse (v4.1.3) [9][11][24]. Google Fit — только Freeletics; Wear OS и Google Fit у pull-up-специалистов отсутствуют [13][27].

**Геймификация**: медали/бейджи — BeStronger, Fitness22, PullUps 20, Freeletics [27][9][40][13]; уровни — PullUps 20 (Novice/Challenger/Champion) [40], 100 Pull Ups (еженедельные цели → уровень) [16]; лидерборды — 100 Pull Ups (ТОП-100, друзья и мир) [16], Madbarz (глобальный/локальный рейтинг по очкам, еженедельные челленджи) [20].

### 4. Русскоязычный сегмент

Флагманы: **«100 Подтягиваний c нуля»** (Power Ups, Киев: GP 4.5/22,8 тыс. отзывов/1M+; RuStore 4.4/9 тыс.+; App Store RU 4.5/811, покупки «1 неделя 49 ₽», «Доступ навсегда 449–899 ₽») [15][16][17] и **Just 6 Weeks** (Ломакин/Antireverse, Астана: полная RU-локализация, 4.6–4.7, Premium 99–2490 ₽) [11][12]. Российские по происхождению — бесплатная **SOTKA** (100.workout.su, 300 000+ участников, урок «Как научиться подтягиваться» — день 13) [28], трекер **Pull-ups** с vc.ru [41], **«Подтягивания 30»** (RuStore, 4.1; жалобы: старт слишком тяжёлый для новичков — «первая тренировка: подтянитесь 6 раз, а я всего 4 раза могу», нет дней отдыха, нет корректировки повторов; разработчик отвечает и обещает облегчить первый уровень) [29] и **«Хват»** (RuStore, март 2026, схема 10×10, полностью офлайн, без регистрации, локальное хранение, экспорт/импорт данных; единственный отзыв: «за 3 месяца с 6 до 20 подтягиваний») [30][31]. На 4PDA есть треды: «Курс подтягиваний „От 0 до 30“», «Runtastic Pull-Ups PRO», ArmEx (программа Армстронга), «100 отжиманий», «Спортсмен PRO. Тренировка» [42]. Madbarz в Play-сторе имеет русифицированную страницу, но интерфейс приложения англоязычный [20].

### 5. Монетизация и жалобы пользователей

| Приложение | Модель (цены, App Store US, авг. 2026) | Главные жалобы |
|---|---|---|
| 20 Pull Ups (Zen Labs) | Freemium: 2 недели бесплатно → $4.99/мес, $74.99/год, плейлист $29.99/3 мес [10] | Переход разовой покупки на подписку («Paid Customer Ignored and Asked to Subscribe Again», 15.06.2026) |
| Thenx | $9.99–19.99/мес, $89.99–119.99/год [18] | Краши при сворачивании, сброс тренировки |
| Madbarz | Premium $12.49/мес, $36.99/3 мес, $88.99/год [35] | Краши, потеря записи тренировки, резкий скачок сложности |
| Freeletics | Бесплатно 34 тренировки; Coach $34.99–89.99 [13] | Нельзя сохранить прогресс при прерывании, долгие паузы |
| Caliverse | PRO $4.49–9.49/мес, $44.99–96.99/год [24] | Ручной «next» на каждом упражнении, выходы из аккаунта |
| Calistree | Без рекламы; $5.99/мес, $44.99/год, Lifetime $179 [25] | Хвалят именно разовый «lifetime» против «хищнических подписок» |
| 100 Pull Ups | 1 нед $0.99, Lifetime $4.99–9.99 (RU: 49–899 ₽) [16][17] | «After week you are forced to pay» (13.07.2025); оплата из РФ в RuStore не работает [17] |
| Just 6 Weeks | Premium 99–2490 ₽ [11] | Переход с разовой покупки Pro на подписку («разработчик решил кинуть всех, кто покупал премиум раньше»), сброс прогресса после обновлений, баг таймера |
| SOTKA | Полностью бесплатно [28] | Жалоб на монетизацию нет |

Сквозной вывод по Reddit: главное недовольство — не функциональность, а принудительная подписка и реклама: «либо берут странную плату, либо заваливают рекламой»; «разовая плата $5–6 лучше подписки» [43][44].

### 6. UX экрана тренировки и адаптивность

Экран тренировки — пошаговый список подходов с ручным подтверждением: тап/галочка (Hevy, Fitloop), свайп «slide to record reps» (Madbarz) [20][36][37]. Автопереход к следующему шагу — у Fitloop; в Caliverse нужно жать «далее» — это раздражает пользователей («flow into the rest time… without having to swipe») [36][24]. Во время отдыха Madbarz показывает только обратный отсчёт без следующего упражнения — тоже жалоба [20]. Hevy выводит в Live Activity «текущее упражнение, какой сет следующий» [37].

Адаптивность — главный тренд: Caliverse Smart Coach пересчитывает план еженедельно, с v4.0.14 — контроль регрессии упражнений и сокращения сетов/повторов [23][24]; BeStronger повторяет тот же день, если повторы не выполнены [27]; «Хват» сокращает отдых на 10 с за успешную тренировку [30]. Флагманский ИИ-кейс — Freeletics Coach+ на генеративном ИИ с диалогами до/во время/после тренировки (запуск 15.07.2024) [47]. Камерный автоподсчёт повторений — нишевые приложения: RepUp (AI posture detection, голосовой гид) [45], Elxis (on-device computer vision, обновл. 13.06.2026) [46], Hang King (AI-детекция позы, офлайн) [39]. Видеодемонстрации: Caliverse — 600+ упражнений с HD-видео [23][24], Madbarz — видео + «Muscle Preview» [20]. Регрессии в виде негативных подтягиваний и резиновых петель — у Caliverse и Zen Labs 20 Pull Ups [32][10]. Отдельной фичи «планка между подходами» нет ни у кого [46].

### 7. Веб, PWA и open-source (важно для вашего проекта)

**Специализированного веб-приложения/PWA для подтягиваний на рынке нет — все лидеры нативные** [48]. Fitloop (fitloop.app) — нативное iOS/Android-приложение с бесплатной веб-витриной программ; PWA/offline не заявлен; Fitloop+ $5.99/мес, $39.99/год, $149.99 lifetime [48][49]. Интерактивные веб-программы «список подходов» существуют только как статические сайты: 50pullups.com (тест → 14 таблиц, 30+ языков вкл. русский, без offline/PWA) [7][8] и hundredpushups.com [33]. Отдельных генераторов таблиц Armstrong/Recon Ron в вебе нет — только PDF/блоги [50][5]. Из open-source ближайшие аналоги: wger (Django, 6 654★, self-hosted трекер, AGPL-3.0) [51], workout-cool (Next.js/React, 8 369★, MIT) [52], Ballast (privacy-first PWA с калистеника-скиллами, офлайн, MIT) [53], Forge (self-hosted PWA-трекер силовых) [54], FastNFitness (Android) и OpenWorkoutTracker (iOS/watchOS) [55][56]. Трекеры конкретных программ на GitHub — мелкие проекты по 0–15★: Armstrong — GMSoudersJr/armstrong-pullup-trainer (Svelte) и др., Russian Fighter — R-Lok/simple-rpp-tracker (TypeScript), 50 pullups — velibkolay/50-Pullups (SwiftUI), mavills/100-days-workouts (Flutter); реализации Recon Ron нет вовсе [57][58]. Готовой библиотеки схем повторений нет — ближайшие референсы по стеку React/Next.js, Svelte, Flutter; под Vue референсов не найдено [51][52][57][58].

### 8. Научная база (что класть в механики)

**Отдых между подходами**: для силы/мощности — 3–5 мин (обзор de Salles, Sports Med, 2009) [59]; РКИ Schoenfeld (JSCR, 2016): 3 мин дали больший прирост и силы, и гипертрофии, чем 1 мин [60]; байесовский мета-анализ Singer et al. (Front Sports Act Living, 2024): преимущество гипертрофии при отдыхе >60 с, плато после ~90 с — рекомендация «30–90 с для гипертрофии» устарела [61].

**Схемы повторений**: мета-анализ Tsartsapakis et al. (2026): продвинутые системы (rest-pause, drop sets, кластеры) дают малый выигрыш по гипертрофии (g=0.046) и умеренный по силе (g=0.351); кластерные сеты лучше традиционных только в первые 4–8 недель (Cui et al., Front Physiol, 2025) [62][63]. По лесенкам, пирамидам и AMRAP отдельных мета-анализов нет [62].

**GTG**: прямых peer-reviewed РКИ нет — метод из книги Цацулина «The Naked Warrior» (2003); косвенная поддержка — нейральный характер ранних силовых приростов и мета-анализ Grgic (Sports Med, 2018) о значимом эффекте частоты на силу у тренированных [64][65]. В приложении GTG стоит маркировать как методику без прямой научной проверки.

**Прогрессия и частота**: для новичков тип периодизации (линейная vs волновая) неважен — главное прогрессивная перегрузка (Moesgaard, Sports Med, 2022; Grgic, PeerJ, 2017) [66][67]; ориентир — 2–3 тренировки в неделю на мышечную группу [65].

**Объём**: каждый дополнительный недельный сет даёт +0.37% прироста мышц (Schoenfeld, J Sports Sci, 2017); новичку хватает ~5–9 сетов/нед, тренированным 10+ [68][69]. Рандомизированных испытаний именно схем прогрессии в подтягиваниях не найдено — ближайшая интервенция по калистенике дала +39.2% в тесте подтягиваний, но это не РКИ программы [69].

### 9. Мнения сообщества (Reddit, форумы)

«Эталоном» сообщество считает бесплатные программы, а не приложения: Armstrong («It works but has serious shoulder-wrecking potential» [72]), Russian Fighter («Took me from about a max set of 7 pull ups to 14 in 30 days», 613 апвотов [69]), GTG («3x my max pull-ups in a span of 100 days», 868 апвотов [70]), Recon Ron («went from 3-20 in 8 months» [78]; свежий кейс на форуме StrongFirst: шаги 11→18 за 16 недель, тест 20 чистых, 18.08.2025 [71]). Плато на Armstrong: «Armstrong stopped yielding results about a month ago. I have 14 pull ups reliably» [80]. Из приложений в свежих тредах упоминаются Caliber [77], Alpha Progression [73], Thenx и Caliverse [79]; Madbarz из тредов 2023–2026 практически исчез [79]. Главная причина отказов — «умный» тренер, который не подстраивается: Freeletics «I told the app I'm extremely out of shape… day 2 was even harder» [74], «this shit "AI" doesn't even care what you tell it» [75]; Thenx после крупного обновления: «progress disappeared and… loads of bugs which makes this deal not worth money» [76]. Узкие приложения (20 Pull Ups, Pull Ups Pro, Just 6 Weeks) содержательной дискуссии на Reddit не имеют — подтверждённый отрицательный результат поисков по r/bodyweightfitness и r/calisthenics (см. Ограничения).

## Разногласия и открытые вопросы

- **Рейтинг Madbarz** — в кэше Google Play встречается 3.5, свежие страницы дают 4.7 (~19 тыс. оценок); принято 4.7 по свежим первичным данным [20].
- **«Хват» в RuStore** — на главной странице «рейтинг 0,0», на странице отзывов «5,0, 4 оценки» при одном видимом отзыве; данные стора расходятся [30][31].
- **Цены BeStronger (50 Pull-ups)** — публично не отображаются; подтвердить не удалось.
- **Посуточные таблицы Fitness22 20 Pull Ups** — публикуются только внутри приложения; в открытых источниках их нет [9].
- **fiftypullups.com** — домен не отвечает; канонический сайт — 50pullups.com [7].
- **«Russian Special Forces program»** — отдельной схемы не существует: это и есть Russian Fighter Pullup Program (3RM/5RM/15RM/25RM) [1][3].

## Уверенность и ограничения

- **Подтверждено ≥2 независимыми источниками**: схемы Fighter/Russian (2 первоисточника с совпадающими таблицами), Armstrong, Recon Ron, 50pullups.com, механика Just 6 Weeks, набор функций BeStronger/Fitness22/Madbarz/Caliverse, сквозные жалобы на подписки/рекламу (сторы + Reddit), научные данные по отдыху (3 мета-анализа).
- **Одиночные источники (осторожно)**: закрытие Runtastic Pull Ups PRO (агрегатор), наличие Apple Watch у Caliverse (страница стора), повтор дня в Just 6 Weeks (отзывы, не описание), точные числа загрузок (оценки AppBrain/chrome-stats).
- Глубина: Exhaustive, 12 тредов, 2 раунда. Критический проход не выявил материальных пробелов; остановка по сходимости покрытия, а не по лимиту раундов.
- Ограничения: 4PDA-треды прочитаны только по сниппетам; страницы сторов частично по сниппетам; цены Google Play публично не отображаются (взяты из App Store).

## Что это значит для проекта pullup-trainer (наши выводы, не факты из источников)

1. **Ниша PWA свободна**: специализированных веб-приложений для подтягиваний нет, все конкуренты нативные — local-first PWA на Vue с офлайном и без регистрации — валидное позиционирование (аналог успеха Ballast и «Хвата»).
2. **Готовые публичные схемы**: Fighter (3RM/5RM), Armstrong, Recon Ron, 50pullups — можно реализовать в коде; универсальный флоу конкурентов: тест максимума → выбор корзины/уровня → последовательность дней с повторами → повтор дня при недовыполнении.
3. **Таймер отдыха** — ключевая фича: научно обоснованный дефолт 3 мин для силы, обязательная настройка (фиксированные 30 с у «100 Подтягиваний» — частая жалоба), автостарт после отметки сета, звук.
4. **Календарь с плановыми днями** — слабое место почти всех конкурентов (есть только у Madbarz Premium): готовый дифференциатор.
5. **Монетизация**: пользователи ненавидят подписки и рекламу; разовая покупка/lifetime — сильный маркетинговый ход (кейсы Calistree, «Хват», отзывы Reddit). Для RU-рынка важна оплата, работающая в РФ (у «100 Подтягиваний» покупки из РФ не работают — жалобы в RuStore).

## Источники

1. [The Fighter Pullup Program Revisited — StrongFirst](https://www.strongfirst.com/the-fighter-pullup-program-revisited/) — правила программы, версия 2.0 (PDF за подпиской) · обновл. окт. 2025 · тред «Методики»
2. [The Program That Nearly Doubled My Max Pullups — StrongFirst](https://www.strongfirst.com/who-says-women-cant-do-pullups/) — полная таблица 5RM и правило входа · 2013 · тред «Методики»
3. [The Fighter Pullup By Pavel — kbnj.com](http://www.kbnj.com/FighterPullupByPavel.htm) — HTML-копия оригинала (© 2004, 2007): полные таблицы 3RM/5RM/15RM/25RM · тред «Методики»
4. [The Armstrong Workout — armstrongpullupprogram.com](https://armstrongpullupprogram.com/) — канонический текст программы USMC · live 2026 · тред «Методики»
5. [[Recon Ron] Pullup/Chinup Workout Program — jdhodges.com](https://www.jdhodges.com/blog/pullupchinup-workout-program/) — таблица 30 недель · 17.07.2009 · треды «Методики», «Web/PWA»
6. [Recon Ron 2.0 — wholelifechallenge.com](https://www.wholelifechallenge.com/recon-ron-2-0-how-to-get-in-shape-with-little-time-or-equipment/) — правила входа и цель · 07.03.2017 · тред «Методики»
7. [50 Pullups — Test](https://www.50pullups.com/50-pullups-programme/test) — тест максимума и 14 корзин · live 2026 · треды «Методики», «Web/PWA»
8. [50 Pullups — 6–8 Pullups plan](https://www.50pullups.com/50-pullups-programme/6-8-pullups) — пример цикла 6 дней × 5 подходов · live 2026 · тред «Методики»
9. [Pull ups: 20 pull-ups trainer — App Store (Fitness22)](https://apps.apple.com/us/app/pull-ups-20-pull-ups-trainer/id612904272) — 0→20 за 20 недель, 3 уровня, Apple Health/Watch · v8.004, 05.09.2018 · треды «Методики», «Фичи»
10. [20 Pull Ups Trainer Challenge — App Store (Zen Labs)](https://apps.apple.com/us/app/20-pull-ups-trainer-challenge/id848897098) — 0→20 за 6 недель, цены, голосовой коуч · треды «Монетизация», «Смежные»
11. [100 Push Ups: Just 6 Weeks — App Store (Aleksandr Lomakin)](https://apps.apple.com/us/app/100-push-ups-just-6-weeks/id586139454) — 11 программ, тест уровня, CSV-экспорт, Apple Watch, цены 99–2490 ₽ · v4.3.2, 28.07.2026 · треды «Смежные», «RU»
12. [Push Up Counter: Just 6 Weeks — Google Play (Antireverse)](https://play.google.com/store/apps/details?id=alexcrusher.just6weeks.pushups) — 1M+, 4.6, обновл. 23.07.2026 · тред «RU»
13. [Freeletics: Workouts & Fitness — App Store](https://apps.apple.com/us/app/freeletics-fitness/id654810212) — Coach IAP $34.99–89.99, бесплатно 34 тренировки · треды «Рынок», «Монетизация»
14. [Get Stronger By Greasing the Groove — Art of Manliness](https://www.artofmanliness.com/strength/fitness/get-stronger-by-greasing-the-groove/) — метод GTG, ~40–50% макс. · фев 2022 · тред «Методики»
15. [100 Подтягиваний c нуля — Google Play](https://play.google.com/store/apps/details?id=com.powerups.pullups&hl=ru) — 20 планов, 4.5/22,8 тыс./1M+, обновл. 13.12.2025 · треды «RU», «Детали 100»
16. [100 Pull Ups Workout — App Store](https://apps.apple.com/us/app/100-pull-ups-workout/id1537775518) — IAP $0.99/$4.99/$9.99, история версий 2024–2026 · тред «Детали 100»
17. [100 Подтягиваний c нуля — отзывы RuStore](https://www.rustore.ru/catalog/app/com.powerups.pullups/reviews) — 4.4/9 тыс.+, жалобы на оплату из РФ · тред «RU»
18. [Thenx: Calisthenics Training — App Store](https://apps.apple.com/us/app/thenx/id1192413645) — IAP $9.99–119.99, 4.8/12K · тред «Монетизация»
19. [Thenx — Google Play](https://play.google.com/store/apps/details?id=com.sysops.thenx) — 4.3, ~16,1 тыс., 1M+ · тред «Рынок»
20. [Madbarz: Bodyweight Workouts — Google Play](https://play.google.com/store/apps/details?id=com.madbarz.madbarzApp) — 4.7, ~19 тыс., свайп-счётчик, напоминания · обновл. 21.04.2026 · треды «Рынок», «Фичи»
21. [Calisteniapp — Google Play](https://play.google.com/store/apps/details?id=me.inakitajes.calisteniapp) — 4.6, ~37 тыс., 1M+ · тред «Рынок»
22. [Thenics — Google Play](https://play.google.com/store/apps/details?id=com.abad.thenics) — 4.5–4.6, ~36 тыс. · тред «Рынок»
23. [Caliverse — официальный сайт](https://www.caliverse.app/) — Smart Coach, 600+ видео · © 2026 · тред «Тренды»
24. [Caliverse — App Store](https://apps.apple.com/us/app/caliverse-bodyweight-fitness/id1472004214) — PRO $4.49–9.49, changelog (регрессии 4.0.14, Apple Watch 4.1.3) · треды «Монетизация», «UX»
25. [Calistree — App Store](https://apps.apple.com/us/app/calistree-bodyweight-fitness/id1558561315) — 1500+ упражнений, Lifetime $179, без рекламы · тред «Монетизация»
26. [Alpha Progression — официальный сайт](https://alphaprogression.com/en) — 4.8–4.9, 40 тыс.+ оценок, per-set рекомендации · треды «Рынок», «Тренды»
27. [50 Pull-ups workout BeStronger — Google Play](https://play.google.com/store/apps/details?id=com.shvagerfm.Pullupspro) — таймер отдыха, журнал, облачный бэкап, медали, повтор дня · обновл. 10.08.2026 · тред «Фичи»
28. [SOTKA — 100.workout.su](https://100.workout.su/) — бесплатная 100-дневная программа, 300 000+ участников · тред «RU»
29. [Подтягивания 30 — отзывы RuStore](https://www.rustore.ru/catalog/app/com.bevik.pullupschallenge/reviews) — 4.1/3 тыс.+, жалобы на тяжёлый старт · тред «RU»
30. [Хват: Тренировка подтягиваний — RuStore](https://www.rustore.ru/catalog/app/com.grid.pulluptrainer) — 10×10, таймер 3 мин, офлайн · v1.0.1, 14.03.2026 · тред «Хват»
31. [Хват — отзывы RuStore](https://www.rustore.ru/catalog/app/com.grid.pulluptrainer/reviews) — отзыв «с 6 до 20 за 3 месяца», 29.03.2026 · тред «Хват»
32. [Exercise progressions and regressions — Caliverse blog](https://blog.caliverse.app/exercise-progressions-and-regressions/) — негативные подтягивания и петли как регрессии · 06.06.2021 · тред «Тренды»
33. [Hundred Pushups Training Program](https://hundredpushups.com/) — первоисточник механики «тест → недели» · © 2008– · тред «Смежные»
34. [Improve your health and fitness in 'Just 6 weeks' — BJSM 50(19):1226](https://bjsm.bmj.com/content/50/19/1226) — подтверждение продукта в 2016 г. · 23.05.2016 · тред «Смежные»
35. [Madbarz — App Store](https://apps.apple.com/us/app/madbarz-bodyweight-workouts/id969057083) — Premium $12.49/$36.99/$88.99, календарь (премиум) · v6.8.6 · тред «Монетизация»
36. [10 Best Workout Apps 2026 — Fitloop (блог)](https://fitloop.app/blog/best-workout-apps) — сравнение механик Hevy/Fitbod/Freeletics/JEFIT · апр. 2026 · тред «UX»
37. [Hevy — Automatic Rest Timer](https://www.hevyapp.com/features/workout-rest-timer/) — авто-таймер 5 с–5 мин, уведомление, Live Activity · © 2026 · треды «Фичи», «UX»
38. [Pull Ups Personal Trainer — App Store](https://apps.apple.com/us/app/pull-ups-personal-trainer/id6477778991) — 12 уровней, графический прогресс · 2026 · тред «Фичи»
39. [Hang King — App Store](https://apps.apple.com/nz/app/hang-king/id6760583400) — AI-подсчёт повторов, графики · © 2026 · тред «Фичи»
40. [PullUps 20: Pull-Up Challenge — App Store](https://apps.apple.com/gh/app/pullups-20-pull-up-challenge/id6478711483) — уровни Novice/Challenger/Champion · v1.2.1, 04.09.2025 · тред «Фичи»
41. [vc.ru: Pull-ups — трекер подтягиваний](https://vc.ru/tribuna/290439-pull-ups-mobilnoe-prilozhenie-dlya-trekinga-podtyagivanii-na-turnike) — русскоязычный iOS-трекер · тред «RU»
42. [4PDA: Курс подтягиваний «От 0 до 30»](https://4pda.to/forum/index.php?showtopic=492233) — русскоязычный курс с таймером и статистикой · тред «RU»
43. [Reddit: What is the worst thing about push-up tracking apps?](https://www.reddit.com/r/bodyweightfitness/comments/1k5rc18/what_is_the_worst_thing_about_pushup_tracking_apps/) — жалобы на плату и рекламу · тред «Монетизация»
44. [Reddit: Looking for free/one time purchase (NO SUBSCRIPTIONS…)](https://www.reddit.com/r/bodyweightfitness/comments/9h86hf/looking_for_freeone_time_purchase_no/) — «подписки не вариант» · тред «Монетизация»
45. [RepUp: Push-ups Pull-ups — Google Play](https://play.google.com/store/apps/details?id=com.allsoft.aipullup) — камера-AI подсчёт, голосовой гид · обновл. 24.01.2025 · тред «UX»
46. [Elxis — AI Rep Counter — Google Play](https://play.google.com/store/apps/details?id=com.thomaspap.pullupfitnessbuddycamera) — on-device computer vision · обновл. 13.06.2026 · тред «Тренды»
47. [Freeletics Unveils Coach+ — Fitt Insider](https://insider.fitt.co/press-release/freeletics-unveils-a-new-era-in-digital-fitness-with-the-launch-of-coach/) — генеративный ИИ-коуч · 15.07.2024 · тред «Тренды»
48. [Fitloop — сайт](https://fitloop.app/) — нативное приложение, веб-витрина, PWA не заявлен · © 2026 · тред «Web/PWA»
49. [Fitloop Pricing](https://fitloop.app/pricing) — Free Forever / $5.99 / $39.99 / $149.99 lifetime · © 2026 · тред «Web/PWA»
50. [ARMSTRONG Pull-up Program (PDF) — Propane Fitness](https://propanefitness.com/wp-content/uploads/2013/01/Armstrong-Pullup.pdf) — первоисточник PDF · 2013 · тред «Web/PWA»
51. [wger-project/wger — GitHub](https://github.com/wger-project/wger) — 6 654★, self-hosted, AGPL-3.0 · push 2026-08-14 · тред «Open-source»
52. [Snouzy/workout-cool — GitHub](https://github.com/Snouzy/workout-cool) — 8 369★, Next.js/React, MIT · push 2026-07-31 · тред «Open-source»
53. [N-O-P-E/Ballast — GitHub](https://github.com/N-O-P-E/Ballast) — offline-PWA, калистеника-скиллы, MIT · тред «Open-source»
54. [bndct-devops/forge — GitHub](https://github.com/bndct-devops/forge) — self-hosted PWA-трекер · тред «Open-source»
55. [brodeurlv/fastnfitness — GitHub](https://github.com/brodeurlv/fastnfitness) — Android-трекер, 314★ · push 2026-01-15 · тред «Open-source»
56. [msimms/OpenWorkoutTracker — GitHub](https://github.com/msimms/OpenWorkoutTracker) — iOS/watchOS, 84★ · push 2026-08-06 · тред «Open-source»
57. [GMSoudersJr/armstrong-pullup-trainer — GitHub](https://github.com/GMSoudersJr/armstrong-pullup-trainer) — Svelte-трекер программы · push 2025-09 · тред «Open-source»
58. [R-Lok/simple-rpp-tracker — GitHub](https://github.com/R-Lok/simple-rpp-tracker) — TypeScript-трекер Russian Fighter · push 2026-04 · тред «Open-source»
59. [de Salles et al., Sports Med, 2009 — PubMed](https://pubmed.ncbi.nlm.nih.gov/19691365/) — отдых 3–5 мин для силы · тред «Наука»
60. [Schoenfeld et al., JSCR, 2016 — PubMed](https://pubmed.ncbi.nlm.nih.gov/26605807/) — 3 мин > 1 мин для силы и гипертрофии · тред «Наука»
61. [Singer et al., Front Sports Act Living, 2024](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/full) — плато гипертрофии после ~90 с отдыха · тред «Наука»
62. [Tsartsapakis et al., J Funct Morphol Kinesiol, 2026 — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12922048/) — мета-анализ продвинутых систем · тред «Наука»
63. [Cui et al., Front Physiol, 2025 — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11996837/) — кластерные сеты лучше лишь в первые 4–8 недель · тред «Наука»
64. [Grgic et al., Sports Med, 2018 — PubMed](https://pubmed.ncbi.nlm.nih.gov/29470825/) — частота и сила · тред «Наука»
65. [Moesgaard et al., Sports Med, 2022](https://link.springer.com/article/10.1007/s40279-021-01636-1) — линейная vs волновая периодизация · тред «Наука»
66. [Grgic et al., PeerJ, 2017 — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5571788/) — LP vs DUP по гипертрофии без разницы · тред «Наука»
67. [Schoenfeld et al., J Sports Sci, 2017 — PubMed](https://pubmed.ncbi.nlm.nih.gov/27433992/) — доза-ответ: +0.37% на сет в неделю · тред «Наука»
68. [Baz-Valle et al., 2022 — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8884877/) — объём и гипертрофия · тред «Наука»
69. [Reddit: Russian Fighter результаты](https://www.reddit.com/r/bodyweightfitness/comments/6yfvuu/most_effective_pull_up_program_i_have_personally/) — 7→14 за 30 дней, 613 апвотов · сент. 2017 · тред «Сообщество»
70. [Reddit: GTG 100 дней](https://www.reddit.com/r/bodyweightfitness/comments/x0j3xb/grease_the_groove_pullups_100_days_results/) — 4.5→14 за 100 дней, 868 апвотов · авг. 2022 · тред «Сообщество»
71. [StrongFirst Forum: Recon Ron success](https://www.strongfirst.com/community/threads/recon-ron-success.28070/) — шаги 11→18 за 16 недель, тест 20 · 18.08.2025 · тред «Сообщество»
72. [Reddit: Armstrong completed](https://www.reddit.com/r/bodyweightfitness/comments/18kncq/armstrong_routine_completed_it_works/) — эффективность + риск плеч · фев 2013 · тред «Сообщество»
73. [Reddit: What's the best automated workout app?](https://www.reddit.com/r/bodyweightfitness/comments/14g1zcj/whats_the_best_automated_workout_app/) — уход в Alpha Progression · июнь 2023 · тред «Сообщество»
74. [Reddit: Day 2 and I already gave up (Freeletics)](https://www.reddit.com/r/freeletics/comments/opxu9x/day_2_and_i_already_gave_up/) — тренер слишком тяжёлый · июль 2021 · тред «Сообщество»
75. [Reddit: 0 progression from the coach (Freeletics)](https://www.reddit.com/r/freeletics/comments/pmbfyp/0_progression_from_the_coach/) — «AI doesn't even care» · сент. 2021 · тред «Сообщество»
76. [Reddit: Thenx после обновления](https://www.reddit.com/r/bodyweightfitness/comments/c63006/calisthenics_workout_app_which_one_you_would/) — прогресс исчез, баги · июнь 2019 · тред «Сообщество»
77. [Reddit: Can anyone recommend a Calisthenics app (недорого)](https://www.reddit.com/r/bodyweightfitness/comments/13msjt1/can_anyone_recommend_a_calisthenics_app_or/) — рекомендация Caliber · май 2023 · тред «Сообщество»
78. [Reddit: Increasing Pull Ups (r/tacticalbarbell)](https://www.reddit.com/r/tacticalbarbell/comments/9ou00o/increasing_pull_ups/) — Recon Ron 3→20 за 8 мес, Armstrong 12→20 за 2 мес · тред «Сообщество»
79. [Reddit: A Review Of 7 Different Calisthenics Programs and Apps](https://www.reddit.com/r/bodyweightfitness/comments/e6dlgo/a_review_of_7_different_calisthenics_programs_and/) — сравнение Thenx/Caliverse/RR и др., 235 апвотов · дек. 2019 · тред «Сообщество»
80. [Reddit: Can anyone give me a better breakdown on the Recon Ron (r/USMCocs)](https://www.reddit.com/r/USMCocs/comments/1ovs4ah/can_anyone_give_me_a_better_breakdown_on_the/) — плато на Armstrong · 2025 · тред «Сообщество»

## Suggested next steps

- Достать таблицы дней внутри приложения Fitness22 20 Pull Ups (не публичны) — через скачивание приложения.
- Если нужны точные схемы для реализации: взять таблицы Russian Fighter из первоисточника [3] и 30-недельную таблицу Recon Ron из [5] — это полные данные для кодирования.
- Для дизайна экрана тренировки — разобрать механики Hevy [37] и Fitloop [48] на живых приложениях.
