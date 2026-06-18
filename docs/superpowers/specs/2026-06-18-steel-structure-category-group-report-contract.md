# Steel Structure Category And Group Report Contract

Date: 2026-06-18
Calculator: `steel-structure-category-group`
Status: Agreed source of truth for report text and formulas

This file contains the agreed Ukrainian UI labels, atomic table A.1 catalog,
table 5.1 mappings, display conditions, report captions, item text, formula
strings, notes, warnings, errors, and catalog placement. Implementation plans,
tests, and code must treat this file as canonical. If any wording, mapping, or
formula changes during implementation, update this file first and get approval
before changing tests or code.

## Source Evidence

Primary source:

```text
C:/Users/Xtyna/Downloads/document.pdf
ДБН В.2.6-198:2014 зі Зміною № 1.
```

Visually checked source locations:

- PDF pages 143-145, printed pages 137-139: Додаток А, таблиця А.1 and notes 1-2.
- PDF pages 146-147, printed pages 140-141: таблиця А.2 and clauses А.1-А.2.
- PDF pages 22-23, printed pages 16-17: clause 5.4.1, table 5.1 and notes 1-5.
- PDF pages 27-28, printed pages 21-22: clauses 7.1-7.2 and tables 7.1-7.2.
- PDF pages 151-154, printed pages 145-148: tables Г.1 and Г.5 with notes.

Agreed correction to the provided table A.1 text:

```text
In position 1в, manual hoists and manual crane beams belong to Б/II.
The overlapping occurrence in the Б/I wording is treated as a table error.
```

## Agreed Product Decisions

- The calculator covers clauses А.1 and А.2, not only the initial group.
- Table A.1 is decomposed into 18 first-list sections and 155 atomic second-list options.
- The second list contains only the atomic label and categories; it does not repeat the section name.
- Unlisted structures are not supported through an analogy mode. Note 2 to table A.1 is shown as a limitation.
- Table 5.1 is explicitly mapped to every atomic option. Code must not infer a mapping from label text.
- Candidate table 5.1 rows use guided conditional fields and reuse already entered data.
- If no special table 5.1 row applies, `gamma_c = 1.0` under note 5.
- Clause А.2 is always active. The UI shows both the initial and refined group.
- Steel input uses strength class plus product type and grade/standard. Tube grades are out of scope.
- Steel compatibility under mandatory table Г.1 is checked after the refined group is known.
- A table Г.1 incompatibility is an error with `valid = false`, but calculated categories, groups, values, and report steps remain visible.
- Add the future category `Сталеві конструкції` under `Конструкції`, slug `stalevi-konstruktsiyi`, with the calculator also listed under normative checks.

## Table 5.1 Profile Codes

Every atomic entry below has one or more explicit candidate profile codes or `default`.
All conditional profiles fall back to `default` when their conditions are not met.

```text
default = gamma_c = 1.0 under table 5.1 note 5
p1 = table 5.1 position 1, gamma_c = 0.90
p2 = table 5.1 position 2, gamma_c = 0.95
p3 = table 5.1 position 3, gamma_c = 1.05
p4 = table 5.1 position 4, gamma_c = 0.80
p5 = table 5.1 position 5, gamma_c = 0.90
p6a = table 5.1 position 6, solid beams and columns, gamma_c = 1.10
p6b = table 5.1 position 6, bar structures of roofs and floors, gamma_c = 1.05
p7 = table 5.1 position 7, gamma_c = 0.90 / 0.80 / 0.75 by subrow
p8 = table 5.1 position 8, gamma_c = 0.75
p9 = table 5.1 position 9, gamma_c = 1.20 / 1.15 / 1.10 by thickness
```

Allowed products under table 5.1 notes:

```text
note 2: p6a/p6b with p1, p2, or p5 when the relevant structural case matches
note 3: p9 with p2 or p3
```

Coefficients below 1.0 are not multiplied except where notes 2-3 expressly
permit joint use. If several non-combinable alternatives apply, use the lowest
`gamma_c` and explain the selection in the report.

## Atomic Table A.1 Catalog And Explicit Mapping

The first selector uses the 18 section headings. The second selector is filtered
by the selected section and displays the `label` plus `category` from the tables below.

### 1. Конструкції кранових колій

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-01-01 | Підкранові балки (крім ребер жорсткості) | А/I | default |
| a1-01-02 | Пояси ферм | А/I | p8 |
| a1-01-03 | Елементи решіток ферм | А/I | p7, p8 |
| a1-01-04 | Фасонки ферм | А/I | default |
| a1-01-05 | Гальмові балки | А/II | default |
| a1-01-06 | Гальмові ферми | А/II | p7, p8; require calculated truss-element subtype |
| a1-01-07 | Деталі кріплення до колон | А/II | default |
| a1-01-08 | Ребра жорсткості | А/II | default |
| a1-01-09 | Зварні балки колій підвісного транспорту | А/I | default |
| a1-01-10 | Прокатні балки під технологічні електричні талі | Б/I | default |
| a1-01-11 | Прокатні балки під технологічні кран-балки | Б/I | default |
| a1-01-12 | Прокатні балки під ремонтні талі | Б/II | default |
| a1-01-13 | Прокатні балки під ремонтні кран-балки | Б/II | default |
| a1-01-14 | Прокатні балки під ручні талі | Б/II | default |
| a1-01-15 | Прокатні балки під ручні кран-балки | Б/II | default |
| a1-01-16 | Допоміжні горизонтальні ферми | Б/II | p7, p8; require calculated truss-element subtype |
| a1-01-17 | Вертикальні ферми | Б/II | p7, p8; require calculated truss-element subtype |
| a1-01-18 | Тупикові упори | Б/II | default |
| a1-01-19 | Деталі кріплення рейок | В/III | default |

### 2. Робочі площадки при наявності рухомого транспорту

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-02-01 | Балки при залізничному рухомому складі | А/I | default |
| a1-02-02 | Балки при автонавантажувачах | А/II | default |
| a1-02-03 | Балки при іншому транспорті | А/II | default |
| a1-02-04 | Металевий настил, включений у сумісну роботу з балками настилу | Б/I | default |
| a1-02-05 | Ребра жорсткості балок | Б/I | default |
| a1-02-06 | Металевий настил, не включений до сумісної роботи з балками настилу | Б/II | default |
| a1-02-07 | Ребра жорсткості настилу | Б/II | default |

### 3. Конструкції технологічних площадок і покриттів

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-03-01 | Головні балки при динамічному навантаженні | А/I | default |
| a1-03-02 | Ригелі рам при динамічному навантаженні | А/I | default |
| a1-03-03 | Головні балки при статичному навантаженні | А/III | p6a |
| a1-03-04 | Другорядні балки при динамічному навантаженні | А/II | default |
| a1-03-05 | Другорядні балки при статичному навантаженні | А/III | p6a |
| a1-03-06 | Металевий настил, включений до сумісної роботи з балками настилу при динамічному навантаженні | Б/I | default |
| a1-03-07 | Металевий настил, окрім зазначеного в позиції 3д | Б/II | default |
| a1-03-08 | Ребра жорсткості балок | В/III | default |

### 4. Колони виробничих споруд і відкритих кранових естакад, стояки робочих і технологічних площадок

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-04-01 | Основні елементи поперечного перерізу | А/III | p3, p6a, p8 |
| a1-04-02 | Пояси при наскрізному перерізі | А/III | p8 |
| a1-04-03 | Решітки при наскрізному перерізі | А/III | p7, p8 |
| a1-04-04 | Опорні плити | А/III | p9, p3; combination allowed by note 3 |
| a1-04-05 | Підкранові траверси колон | А/III | default |
| a1-04-06 | Вертикальні в’язі між колонами | А/III | p8 |
| a1-04-07 | Ребра жорсткості колон | В/III | default |
| a1-04-08 | Діафрагми колон | В/III | default |
| a1-04-09 | Елементи решіток двоплощинних в’язей | В/III | p7, p8 |
| a1-04-10 | В’язі з напруженням меншим за 0,4Ry | В/III | p8 |

### 5. Конструкції покриття

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-05-01 | Ферми покриття, що підлягають безпосередній дії динамічних навантажень від технологічного чи транспортного устаткування | А/I | p4, p7, p8; require calculated truss-element subtype |
| a1-05-02 | Ригелі покриття, що підлягають безпосередній дії динамічних навантажень від технологічного чи транспортного устаткування | А/I | default |
| a1-05-03 | Інші елементи покриття, що підлягають безпосередній дії динамічних навантажень від технологічного чи транспортного устаткування | А/I | p4, p7, p8 when the selected subtype matches |
| a1-05-04 | Ферми покриття при статичному навантаженні | А/II | p4, p6b, p7, p8; require calculated truss-element subtype |
| a1-05-05 | Ригелі покриття при статичному навантаженні | А/II | p6a |
| a1-05-06 | Інші елементи покриття при статичному навантаженні | А/II | p4, p6b, p7, p8 when the selected subtype matches |
| a1-05-07 | Вузлові фасонки елементів покрівлі | А/II | default |
| a1-05-08 | Ліхтарні панелі | Б/II | default |
| a1-05-09 | Панелі покрівлі | Б/II | default |
| a1-05-10 | Прогони покрівлі | Б/II | p6a |
| a1-05-11 | Горизонтальні торцеві в’язі в рівні покрівлі | Б/II | p8 |
| a1-05-12 | Поздовжні в’язі при кроці колон, більшому за крок кроквяних ферм | Б/II | p8 |
| a1-05-13 | Інші в’язі покрівлі | В/III | p8 |

### 6. Конструкції фахверка

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-06-01 | Ригелі під цегляні стіни | А/III | p6a |
| a1-06-02 | Ригелі над воротами | А/III | p6a |
| a1-06-03 | Стояки | Б/II | p6a, p8 |
| a1-06-04 | Торцеві ферми | Б/II | p7, p8; require calculated truss-element subtype |
| a1-06-05 | Вітрові ферми | Б/II | p7, p8; require calculated truss-element subtype |
| a1-06-06 | Ригелі, крім зазначених у позиції 6а | В/III | p6a |
| a1-06-07 | Інші елементи фахверка | В/III | p8 |

### 7. Допоміжні конструкції виробничих споруд

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-07-01 | Косоури сходів | А/III | p6a |
| a1-07-02 | Сходи виробничих споруд | В/III | default |
| a1-07-03 | Перехідні площадки виробничих споруд | В/III | default |
| a1-07-04 | Огородження виробничих споруд | В/III | default |
| a1-07-05 | Площадки світильників | В/III | default |
| a1-07-06 | Посадкові площадки на крани | В/III | default |
| a1-07-07 | Балки підвісних стель | В/III | p6a |
| a1-07-08 | Імпости | В/III | default |
| a1-07-09 | Віконні рами | В/III | default |
| a1-07-10 | Ліхтарні рами | В/III | default |

### 8. Транспортерні галереї

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-08-01 | Прогінні споруди транспортерних галерей | А/I | p6b, p7, p8; require calculated element subtype |
| a1-08-02 | Несучі балки під конвеєри | А/I | p6a when load is static |
| a1-08-03 | Фасонки ферм транспортерних галерей | А/I | default |
| a1-08-04 | Опори транспортерних галерей | А/II | p6a, p8 |
| a1-08-05 | В’язі між колонами транспортерних галерей | А/II | p8 |
| a1-08-06 | Опорні ребра балок транспортерних галерей | А/II | default |
| a1-08-07 | Елементи фахверка прогінних споруд | Б/II | p8 |
| a1-08-08 | В’язі прогінних споруд | Б/II | p8 |
| a1-08-09 | Прогони покриттів прогінних споруд | Б/II | p6a |
| a1-08-10 | Балки покриттів прогінних споруд | Б/II | p6a |
| a1-08-11 | Ребра жорсткості балок прогінних споруд | Б/II | default |

### 9. Опори повітряних ліній електропередавання, конструкцій відкритих розподільних пристроїв

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-09-01 | Зварні спеціальні опори великих переходів заввишки понад 60 м | А/I | p7, p8 |
| a1-09-02 | Опори повітряних ліній електропередавання, крім спеціальних опор великих переходів заввишки понад 60 м | А/III | p7, p8 |
| a1-09-03 | Опори під вимикачі відкритих розподільних пристроїв | А/III | p6a, p7, p8 |
| a1-09-04 | Портали під ошинування відкритих розподільних пристроїв | А/III | p6a, p7, p8 |
| a1-09-05 | Опори під устаткування відкритих розподільних пристроїв, крім зазначених у позиціях 9а і 9б | В/II | p6a, p7, p8 |

### 10. Антенні споруди зв’язку заввишки до 500 м

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-10-01 | Стовбури щогл | А/II | p7, p8; require calculated element subtype |
| a1-10-02 | Стовбури башт | А/II | p7, p8; require calculated element subtype |
| a1-10-03 | Решітки антенних споруд | А/II | p7, p8 |
| a1-10-04 | Елементи обпирання антенних споруд на фундаменти | А/II | p9 when the element is a support plate |
| a1-10-05 | Механічні деталі відтяжок щогл | А/I | default |
| a1-10-06 | Механічні деталі антенних полотен | А/I | default |
| a1-10-07 | Деталі кріплення відтяжок до фундаментів | А/I | default |
| a1-10-08 | Деталі кріплення відтяжок до стовбурів сталевих опор | А/I | default |
| a1-10-09 | Діафрагми баштових опор | Б/III | default |
| a1-10-10 | Хідники антенних споруд | Б/III | default |
| a1-10-11 | Перехідні площадки антенних споруд | Б/III | default |

### 11. Витяжні башти

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-11-01 | Пояси витяжних башт | А/II | p8 |
| a1-11-02 | Вузлові фасонки витяжних башт | А/II | default |
| a1-11-03 | Газовідвідний стовбур | Б/II | default |
| a1-11-04 | Елементи решітки витяжних башт | Б/II | p7, p8 |
| a1-11-05 | Балки діафрагм, що безпосередньо сприймають вагу стовбура | Б/II | p6a |
| a1-11-06 | Площадки діафрагм, що безпосередньо сприймають вагу стовбура | Б/II | default |
| a1-11-07 | Опорні плити витяжних башт | В/III | p9 |
| a1-11-08 | Хідники витяжних башт | В/III | default |
| a1-11-09 | Огородження витяжних башт | В/III | default |
| a1-11-10 | Настил площадок витяжних башт | В/III | default |
| a1-11-11 | Балки діафрагм, що не сприймають вагу стовбура | В/III | p6a |
| a1-11-12 | Площадки діафрагм, що не сприймають вагу стовбура | В/III | default |

### 12. Димові труби

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-12-01 | Сталева оболонка димової труби | А/II | default |
| a1-12-02 | Ребра жорсткості димової труби | А/II | default |
| a1-12-03 | Площадки димової труби | Б/III | default |
| a1-12-04 | Опорні кільця димової труби | Б/III | default |
| a1-12-05 | Хідники димової труби | Б/III | default |
| a1-12-06 | Огородження димової труби | Б/III | default |

### 13. Градирні баштові і вентиляторні, водонапірні башти

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-13-01 | Пояси решітчастих башт | А/III | p2 when part of a water-tower support, p8 |
| a1-13-02 | Кільця жорсткості башт | А/III | p2 when part of a water-tower support |
| a1-13-03 | Решітки башт | А/III | p2 when part of a water-tower support, p7, p8 |
| a1-13-04 | Вузлові фасонки башт | А/II | p2 when part of a water-tower support |
| a1-13-05 | Фахверк градирень і водонапірних башт | В/III | p8 |
| a1-13-06 | Допоміжні площадки градирень і водонапірних башт | В/III | default |
| a1-13-07 | Обшивки градирень | В/III | default |

### 14. Бункери

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-14-01 | Бункерні балки | А/I | p6a when load is static |
| a1-14-02 | Оболонки параболічних бункерів | А/I | default |
| a1-14-03 | Стінки інших бункерів | А/III | default |
| a1-14-04 | Ребра жорсткості бункерів | А/III | default |

### 15. Резервуари і газгольдери

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-15-01 | Стінки резервуарів місткістю 10 тис. м³ і більше | А/I | default |
| a1-15-02 | Кромки днищ резервуарів місткістю 10 тис. м³ і більше | А/I | default |
| a1-15-03 | Фасонки покриттів резервуарів місткістю 10 тис. м³ і більше | А/I | default |
| a1-15-04 | Стінки резервуарів місткістю менше ніж 10 тис. м³ | А/II | default |
| a1-15-05 | Кромки днищ резервуарів місткістю менше ніж 10 тис. м³ | А/II | default |
| a1-15-06 | Центральні частини днищ резервуарів | А/III | default |
| a1-15-07 | Опорні кільця покриття резервуарів | А/III | default |
| a1-15-08 | Кільця жорсткості резервуарів | А/III | default |
| a1-15-09 | Плавучі покрівлі резервуарів | А/III | default |
| a1-15-10 | Понтони покриття резервуарів | А/III | default |
| a1-15-11 | Внутрішні корпуси ізотермічних резервуарів при температурі зберігання не вище −50 °C | А/I | default |

### 16. Конструкції контактної мережі транспорту

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-16-01 | Тяги, пов’язані з натягом проводів | А/II | p5 |
| a1-16-02 | Штанги, пов’язані з натягом проводів | А/II | default |
| a1-16-03 | Хомути, пов’язані з натягом проводів | А/II | default |
| a1-16-04 | Опори несучих, підтримувальних і фіксувальних пристроїв | Б/II | p6a, p7, p8 |
| a1-16-05 | Ригелі жорстких поперечин | Б/II | p6a |
| a1-16-06 | Прожекторні щогли | Б/II | p7, p8; require calculated element subtype |
| a1-16-07 | Фіксатори контактної мережі | Б/II | default |
| a1-16-08 | Допоміжні конструкції контактної мережі | В/III | default |

### 17. Силоси

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-17-01 | Оболонки силосів | А/III | default |
| a1-17-02 | Ребра жорсткості силосів | А/III | default |

### 18. Громадські споруди та споруди заввишки понад 75 м

| structureId | label | category | table 5.1 candidates |
|---|---|---|---|
| a1-18-01 | Перекриття | А/II | p1 after element subtype and load checks |
| a1-18-02 | Покриття | А/II | p4, p6b, p7, p8 after calculated element subtype |
| a1-18-03 | Косоури сходів | А/II | p6a |
| a1-18-04 | Колони | А/II | p2 for a public building, p6a |

## UI Inputs

Every normative field description must cite its source as precisely as the
source structure permits: document, clause, table position/subrow, note, and
paragraph. Tests must assert the important references below.

Every `?` description must also answer three user questions in plain language:

```text
1. What must be selected or entered, and where can the user obtain it?
2. Which score, category, coefficient, validation, or formula uses the value?
3. What exact DBN clause, table, row, note, or figure is the source?
```

Descriptions that contain only a normative citation are not acceptable. The
schema test must enumerate all 155 A.1 entries and every gamma-c mode and assert
that each resulting field has a practical instruction and cites
`ДБН В.2.6-198:2014`.

### Base Fields

```text
Розділ таблиці А.1: a1_section
Конструкція або елемент: structure_id
Клас відповідальності: responsibility_class
Характер навантаження: load_type
Є розтягувальні напруження від розрахункового навантаження?: has_tensile_stress
Є несприятливий вплив зварних з’єднань?: has_adverse_weld_effect
Умови експлуатації: service_condition
Вид прокату: product_type
Клас міцності сталі: steel_class
Марка сталі та нормативний документ: steel_grade_standard
Товщина прокату: thickness
Найбільше нормальне розтягувальне напруження від динамічних навантажень: sigma_dyn
Найбільше сумарне нормальне розтягувальне напруження від усіх навантажень: sigma_sum
Нормальне напруження стиску з урахуванням φ, φe, φb: sigma_c
Є кромки після гільйотинного різання?: has_guillotine_edges
Є неврахований у розрахунку наклеп від деформування в холодному стані?: has_unaccounted_cold_work
Є високі початкові напруження, у тому числі зварювальні?: has_high_initial_stress
```

Exact description for `steel_grade_standard`:

```text
Оберіть фактичну марку сталі та стандарт, за яким виготовлено прокат. Ці дані беруть із сертифіката якості на метал або зі специфікації проєкту. Калькулятор перевіряє, чи відповідає вибрана марка заданому класу міцності, виду та товщині прокату за таблицею Г.5 ДБН В.2.6-198:2014, а також визначає коефіцієнт надійності за матеріалом γm для розрахунку Ry = Ryn / γm за таблицею 7.2.
```

Base options:

```text
responsibility_class:
СС1
СС2
СС3

load_type:
Статичне
Динамічне

has_tensile_stress, has_adverse_weld_effect,
has_guillotine_edges, has_unaccounted_cold_work,
has_high_initial_stress:
Так
Ні

service_condition:
Опалювана споруда
Неопалювана споруда
Конструкція на відкритому повітрі

product_type:
Фасонний
Сортовий
Листовий
Широкосмуговий універсальний
Холодногнутий профіль

steel_class:
С235
С245
С255
С275
С295
С325
С345
С345К
С355
С375
С390
С390К
С420
С440
С460
С500
С550
С590
С620
С690
```

Display rules:

- `a1_section` filters the 155 `structure_id` options to one section.
- A table A.1 option that explicitly states static or dynamic load sets `load_type`; other options allow user selection.
- Show `sigma_dyn` only for `load_type = Динамічне` and `has_tensile_stress = Так`.
- Show `sigma_sum` only for `has_tensile_stress = Так`.
- Show `sigma_c` only for `load_type = Статичне`.
- Show only the table 5.1 fields required by the selected entry's explicit candidate profiles.
- Changing section, structure, steel class, product type, or another controlling value resets dependent values to a valid option.

Units and notation:

```text
thickness: prefix t; quantity thickness; baseUnit mm; display units mm, cm, m; default mm
sigma_dyn: prefix σdyn; quantity pressure; baseUnit kPa; default display unit MPa
sigma_sum: prefix σsum; quantity pressure; baseUnit kPa; default display unit MPa
sigma_c: prefix σc; quantity pressure; baseUnit kPa; default display unit MPa
all dimensionless numbers: quantity coefficient
```

Add central `thickness` quantity to the input-unit registry with base `mm` and
display units `mm`, `cm`, and `m`. Each dimensional field has its own unit
selector under the input inspector rules.

Normative descriptions:

- `responsibility_class`, `has_tensile_stress`, and `has_adverse_weld_effect` cite table А.2 and the exact factor `S1`, `S4`, or `S5`.
- `has_adverse_weld_effect` quotes the applicability meaning without exceeding the source: significant tensile stress `sigma > 0.3 Ry` or `sigma > 0.3 Rwz`, or weld strength governing fitness for service; cite the note to table А.2.
- `thickness`, `has_guillotine_edges`, `has_unaccounted_cold_work`, and `has_high_initial_stress` cite clause А.2, second paragraph.
- `sigma_dyn` and `sigma_sum` cite clause А.2, first paragraph and identify numerator/denominator of `alpha`.
- `sigma_c` cites clause А.2, third paragraph and states that the entered non-negative magnitude already includes `phi`, `phi_e`, and `phi_b`.
- Steel class, grade/standard, and product fields cite clauses 7.1-7.2, tables 7.1-7.2, and table Г.5.
- `service_condition` cites table Г.1 footnotes `a`, `b`, and note 3.

### Agreed Defaults

```text
a1_section = 3. Конструкції технологічних площадок і покриттів
structure_id = a1-03-03
responsibility_class = СС2
load_type = Статичне
has_tensile_stress = Так
has_adverse_weld_effect = Ні
product_type = Фасонний
steel_class = С245
steel_grade_standard = С245 — ДСТУ 8539
thickness = 10 mm
sigma_sum = 100 MPa
sigma_c = 100 MPa
has_guillotine_edges = Ні
has_unaccounted_cold_work = Ні
has_high_initial_stress = Ні
section weakened by bolt holes = Ні
```

Use `Опалювана споруда` as the default `service_condition` so the default
example is complete and editable.

### Steel Grade And Standard Source

`steel_grade_standard` options are filtered by `steel_class` and `product_type`.
Labels reproduce table Г.5, including its thickness qualifications. Supported
strength-class groups and source rows are:

```text
С235: С235 — ДСТУ 8539; Ст3кп2 — ДСТУ 2651/ГОСТ 380, ДСТУ 4484/ГОСТ 535, ДСТУ 8803;
      S235JR/S235J0/S235J2 — ДСТУ EN 10025-2; S235JRH — ДСТУ EN 10219-1
С245: С245 — ДСТУ 8539; Ст3пс5 — listed DSTU/GOST sources with sheet <= 20 mm and section <= 40 mm
С255: С255 — ДСТУ 8539; Ст3сп5, Ст3Гпс5, Ст3Гсп5 — listed DSTU/GOST sources and table Г.5 thickness limits
С275: S275JR/J0/J2; S275N/NL; S275M/ML; S275 hollow-section classes — respective EN standards in Г.5
С295: 09Г2; 09Г2С — ДСТУ 8541, sheet and section <= 32 mm
С325: 09Г2С; 14Г2; 15ХСНД — ДСТУ 8541 with the exact table Г.5 product/thickness limits
С345: С345 — ДСТУ 8539; 09Г2С; 15ХСНД — ДСТУ 8541 with the exact table Г.5 limits
С345К: С345К — ДСТУ 8539; 10ХНДП — ДСТУ 8541
С355: S355 classes — ДСТУ EN 10025-2/-3/-4 and ДСТУ EN 10219-1 as listed in Г.5
С375: С375 — ДСТУ 8539
С390: С390/С390-1 — ДСТУ 8539; 14Г2АФ, 15Г2СФ, 10ХСНД — ДСТУ 8541 with listed limits
С390К: 15Г2АФДпс (С390К) — ДСТУ 8541
С420: S420 classes — ДСТУ EN 10025-3/-4 and ДСТУ EN 10219-1
С440: С440 — ДСТУ 8539
С460: S460 classes — ДСТУ EN 10025-3/-4 and ДСТУ EN 10219-1
С500: S500Q/S500QL — ДСТУ EN 10025-6
С550: С550 — ДСТУ 8539; S550Q/S550QL/S550QL1 — ДСТУ EN 10025-6
С590: С590 — ДСТУ 8539
С620: S620Q/S620QL — ДСТУ EN 10025-6
С690: S690Q/S690QL/S690QL1 — ДСТУ EN 10025-6
```

Canonical `steel_grade_standard` option labels by class:

```text
С235:
С235 — ДСТУ 8539
Ст3кп2 — ДСТУ 2651/ГОСТ 380; ДСТУ 4484/ГОСТ 535; ДСТУ 8803
S235JR, S235J0, S235J2 — ДСТУ EN 10025-2:2007
S235JRH — ДСТУ EN 10219-1

С245:
С245 — ДСТУ 8539
Ст3пс5 (листовий — до 20 мм; фасонний — до 40 мм) — ДСТУ 2651/ГОСТ 380; ДСТУ 4484/ГОСТ 535; ДСТУ 8803

С255:
С255 — ДСТУ 8539
Ст3сп5 (листовий — понад 4 мм; фасонний — до 10 мм) — ДСТУ 2651/ГОСТ 380; ДСТУ 4484/ГОСТ 535; ДСТУ 8803
Ст3Гпс5 (листовий — понад 4 мм) — ДСТУ 2651/ГОСТ 380; ДСТУ 4484/ГОСТ 535; ДСТУ 8803
Ст3Гсп5 (листовий — до 40 мм) — ДСТУ 2651/ГОСТ 380; ДСТУ 4484/ГОСТ 535; ДСТУ 8803

С275:
S275JR, S275J0, S275J2 — ДСТУ EN 10025-2
S275N, S275NL — ДСТУ EN 10025-3
S275M, S275ML — ДСТУ EN 10025-4
S275J0H, S275J2H, S275NH, S275NLH, S275MH, S275MLH — ДСТУ EN 10219-1

С295:
09Г2 (листовий та фасонний — до 32 мм) — ДСТУ 8541
09Г2С (листовий та фасонний — до 32 мм) — ДСТУ 8541

С325:
09Г2С (листовий та фасонний — понад 10 мм до 20 мм включно) — ДСТУ 8541
14Г2 (листовий та фасонний — до 32 мм включно) — ДСТУ 8541
15ХСНД (фасонний — понад 20 мм до 32 мм) — ДСТУ 8541

С345:
С345 — ДСТУ 8539
09Г2С (листовий та фасонний — до 10 мм включно) — ДСТУ 8541
15ХСНД (листовий — до 32 мм; фасонний — до 20 мм включно) — ДСТУ 8541

С345К:
С345К — ДСТУ 8539
10ХНДП — ДСТУ 8541

С355:
S355J2, S355K2 — ДСТУ EN 10025-2
S355N, S355NL — ДСТУ EN 10025-3
S355M, S355ML — ДСТУ EN 10025-4
S355J0H, S355J2H, S355K2H, S355NH, S355NLH, S355MH, S355MLH — ДСТУ EN 10219-1

С375:
С375 — ДСТУ 8539

С390:
С390, С390-1 — ДСТУ 8539
14Г2АФ — ДСТУ 8541
15Г2СФ — ДСТУ 8541
10ХСНД (листовий — до 40 мм; фасонний — без обмежень) — ДСТУ 8541

С390К:
15Г2АФДпс (С390К) — ДСТУ 8541

С420:
S420N, S420NL — ДСТУ EN 10025-3
S420M, S420ML — ДСТУ EN 10025-4
S420MH, S420MLH — ДСТУ EN 10219-1

С440:
С440 — ДСТУ 8539

С460:
S460N, S460NL — ДСТУ EN 10025-3
S460M, S460ML — ДСТУ EN 10025-4
S460NH, S460NLH, S460MH, S460MLH — ДСТУ EN 10219-1

С500:
S500Q, S500QL — ДСТУ EN 10025-6

С550:
С550 — ДСТУ 8539
S550Q, S550QL, S550QL1 — ДСТУ EN 10025-6

С590:
С590 — ДСТУ 8539

С620:
S620Q, S620QL — ДСТУ EN 10025-6

С690:
S690Q, S690QL, S690QL1 — ДСТУ EN 10025-6
```

Tube-grade rows of table Г.1 are not UI options. Reject a grade/product/thickness
combination that does not match table Г.5.

For calculation:

```text
Ryn = numeric strength value in the selected class name
Ry = Ryn / gamma_m
```

Determine `gamma_m` from table 7.2 using selected grade/standard and product:

- `1.025` for applicable table Г.5 steels whose property-control procedure meets ДСТУ 8539, excluding С590/С590К and the exclusions stated in table 7.2.
- `1.100` for С590/С590К, qualifying long products above 380 MPa under ДСТУ 8541, and other cases expressly placed in that row.
- `1.050` for the remaining compliant rolled products.

### Conditional Table 5.1 Fields

The `Умови γc` group starts with:

```text
Режим визначення γc: gamma_c_mode
Автоматично за вибраною конструкцією
Напівавтоматично — вибір позиції таблиці 5.1
Вручну
Default: Автоматично за вибраною конструкцією
```

Automatic mode shows the conditional fields below and uses the A.1-to-5.1
candidate matrix.

Semi-automatic mode hides the automatic qualifiers and shows:

```text
Позиція таблиці 5.1: gamma_c_table_option
1 — Балки та стиснуті елементи ферм перекриттів — γc = 0,90
2 — Колони громадських споруд і опор водонапірних башт — γc = 0,95
3 — Колони одноповерхових виробничих споруд із мостовими кранами — γc = 1,05
4 — Стиснуті основні елементи решітки зварних ферм — γc = 0,80
5 — Затяжки, тяги, відтяжки та підвіски — γc = 0,90
6а — Суцільні балки і колони, переріз послаблений отворами — γc = 1,10
6б — Стрижневі конструкції покриттів та перекриттів, переріз послаблений отворами — γc = 1,05
7а — Розкоси за рисунком 13.3а — γc = 0,90
7а — Розпірки за рисунками 13.3б, 13.3в або 13.3е — γc = 0,90
7а — Розкоси за рисунками 13.3в, 13.3г, 13.3д або 13.3е — γc = 0,80
7б — Кріплення одним болтом або через фасонку — γc = 0,75
8 — Елементи плоских ферм і стиснуті елементи з одиночних кутиків — γc = 0,75
9а — Опорні плити до 40 мм включно — γc = 1,20
9б — Опорні плити понад 40 до 60 мм включно — γc = 1,15
9в — Опорні плити понад 60 до 80 мм включно — γc = 1,10
Примітка 5 — випадок не обумовлений нормами — γc = 1,00
Default: Примітка 5 — випадок не обумовлений нормами — γc = 1,00
```

Manual mode hides automatic qualifiers and shows:

```text
Значення γc: gamma_c_manual_preset
0,75
0,80
0,90
0,95
1,00
1,05
1,10
1,15
1,20
Інше значення
Default: 1,00

Коефіцієнт умов роботи: gamma_c_manual
Symbol: γc
Unit: none
Default: 1,00
Display condition: gamma_c_manual_preset = Інше значення
Validation: finite value greater than 0
```

Every field below includes a description citing `ДБН В.2.6-198:2014,
таблиця 5.1, позиція <number>` and any relevant note or figure.

The canonical description pattern for ordinary table 5.1 qualifiers is:

```text
Звірте цю ознаку з розрахунковою схемою, перерізом і способом закріплення елемента. Відповідь визначає, чи застосовується коефіцієнт умов роботи γc за позицією <number> таблиці 5.1 ДБН В.2.6-198:2014.
```

Fields for slenderness, figure 13.3, support plates, gamma-c modes, material
selection, and A.2 stresses must replace the generic pattern with a specific
instruction that names the input source and the exact downstream formula or
decision.

#### Position 1

```text
Розташування перекриття: floor_location
Під залом театру, клубу або кінотеатру
Під трибунами
Під приміщенням магазину
Під книгосховищем
Під архівом
Інший аналогічний випадок
Інший випадок

Тип елемента перекриття: floor_element_type
Балка суцільного перерізу
Стиснутий елемент ферми перекриття
Інший елемент

Тимчасове навантаження не перевищує вагу перекриття?: temporary_load_not_above_floor_weight
```

All three conditions must match position 1.

#### Position 2

For A.1 section 13:

```text
Тип споруди: tower_facility_type
Баштова градирня
Вентиляторна градирня
Водонапірна башта

Елемент належить опорі водонапірної башти?: is_water_tower_support_element
```

For A.1 section 18:

```text
Тип споруди: tall_or_public_facility_type
Громадська споруда
Інша споруда заввишки понад 75 м
```

#### Position 3

```text
Це колона одноповерхової виробничої споруди з мостовими кранами?: is_single_storey_industrial_crane_column
Опорна плита належить колоні одноповерхової виробничої споруди з мостовими кранами?: is_plate_for_single_storey_industrial_crane_column
```

Show the first or second question according to the selected atomic element.

#### Position 4

```text
Елемент є стиснутим основним елементом решітки, крім опорного?: is_compressed_main_lattice_element
Елемент належить зварній фермі покриття або перекриття?: is_welded_roof_or_floor_truss
Переріз елемента — складений тавр із двох кутиків?: is_built_up_tee_from_two_angles
Розрахунок виконується на стійкість?: is_stability_check
Гнучкість елемента: slenderness_lambda
```

All booleans must be true and `lambda >= 60`.

#### Position 5

```text
Розрахунок виконується на міцність?: is_strength_check
Розрахунковий переріз не має послаблень?: is_unweakened_section
```

Both conditions must be true.

#### Position 6

```text
Тип несучого елемента: position_6_member_type
Суцільна балка
Суцільна колона
Стрижнева конструкція покриття
Стрижнева конструкція перекриття
Інший елемент

Розрахунок виконується на міцність?: is_strength_check
Переріз послаблений отворами для болтів?: has_bolt_holes
З’єднання є фрикційним?: is_friction_connection
```

An unambiguous atomic mapping supplies `position_6_member_type`. Position 6
also requires `load_type = Статичне`, `Ryn <= 440 MPa`, strength check, bolt
holes, and a non-friction connection.

#### Position 7

```text
Елемент є стиснутим елементом решітки просторової решітчастої конструкції?: is_compressed_space_lattice_member

Профіль елемента: position_7_profile
Одиночний рівнополичковий кутик
Одиночний нерівнополичковий кутик
Інший профіль

Нерівнополичковий кутик прикріплений більшою полицею?: unequal_angle_attached_by_larger_leg

Спосіб кріплення: position_7_connection
Безпосередньо до пояса зварними швами
Безпосередньо до пояса двома або більше болтами вздовж кутика
Безпосередньо до пояса одним болтом
Через фасонку
Інший спосіб

Схема елемента за рисунком 13.3: position_7_figure_case
Розкіс — рисунок 13.3а
Розпірка — рисунок 13.3б, 13.3в або 13.3е
Розкіс — рисунок 13.3в, 13.3г, 13.3д або 13.3е
```

Show the figure field only for welded attachment or two-plus bolts.

#### Position 8

```text
Випадок позиції 8 таблиці 5.1: position_8_case
Елемент плоскої ферми з одиночного кутика
Інший стиснутий елемент з одиночного кутика
Не застосовується

Кутик прикріплений однією полицею?: angle_attached_by_one_leg
Нерівнополичковий кутик прикріплений меншою полицею?: unequal_angle_attached_by_smaller_leg
```

Position 8 applies only when position 7 does not govern.

#### Position 9

```text
Елемент є опорною плитою?: is_support_plate
```

Ask this only for generalized support elements. Atomic support-plate entries
set it automatically. Position 9 also requires static load and `Ryn <= 390 MPa`.
Use thickness subrows:

```text
t <= 40 mm => gamma_c,9 = 1.20
40 mm < t <= 60 mm => gamma_c,9 = 1.15
60 mm < t <= 80 mm => gamma_c,9 = 1.10
t > 80 mm => position 9 value is undefined; warn and use other applicable profiles or note 5
```

## Calculation Contract

### Table A.2 Scores

```text
S1: СС3 = 4; СС2 = 0; СС1 = 0
S2: А = 11; Б = 4; В = 1
S3: I = 8; II = 5; III = 1
S4: tensile stress exists = 7; does not exist = 2
S5: adverse weld effect exists = 6; does not exist = 2
```

```text
Stot,base = S1 + S2 + S3,base + S4 + S5
```

Groups:

```text
group 1: Stot > 26
group 2: 23 <= Stot <= 26
group 3: 19 <= Stot <= 22
group 4: Stot <= 18
```

### Clause A.2 Refinement

If tensile stress exists:

```text
alpha = abs(sigma_dyn) / abs(sigma_sum)
static load => sigma_dyn = 0 => alpha = 0
I: alpha >= 0.5
II: 0.2 < alpha < 0.5
III: alpha <= 0.2
```

If tensile stress does not exist, alpha is undefined and `S3,A2 = S3,base`.

Positive corrections are additive before the total clamp:

```text
t <= 20 mm => delta_St = 0
20 mm < t <= 40 mm => delta_St = +1
t > 40 mm => delta_St = +2
guillotine edges => +1
unaccounted cold work => +1
high initial stress => +1
```

Static compression reduction:

```text
sigma_limit = 0.4 * Ry * gamma_c
static load and sigma_c <= sigma_limit => delta_Scompression = -4
otherwise => delta_Scompression = 0
```

Final refinement:

```text
delta_S3 = S3,A2 - S3,base
delta_Sraw = delta_S3 + delta_Spositive + delta_Scompression
delta_S = clamp(delta_Sraw, -4, +4)
Stot,A2 = Stot,base + delta_S
```

### Table G.1 Compatibility

Supported rolled-product matrix by refined group 1/2/3/4:

```text
С235: - / - / +a / +
С245: - / +b / + / -
С255: + / + / + / -
С275: - / +b / + / -
С295: + / + / + / -
С325: + / + / + / -
С345: + / + / + / -
С345К: no plus / no plus / + / no plus
С355: + / + / + / -
С375: + / + / + / -
С390: + / + / + / -
С390К: + / + / + / -
С420: + / + / + / -
С440: + / + / + / -
С460: + / + / + / -
С500: + / + / + / -
С550: + / + / + / +
С590: - / + / + / -
С620: + / + / + / -
С690: + / + / + / +
```

Footnotes and overrides:

- Footnote `a`: the С235 group-3 plus excludes unheated/open-air structures and PL/VRP/contact-network structures.
- Footnote `b`: for С245/С275 in unheated or open-air group-2 structures, thickness must not exceed 10 mm.
- Note 3: С235 with `t <= 5 mm` is allowed for all groups except PL/VRP/contact-network structures.
- Note 3: С245 with `t <= 8 mm` is allowed for group 1.
- A minus or absence of a plus means not allowed.
- Compatibility does not alter the calculated group.

## Report Steps

The report always preserves stable steps and finite values. Conditional items
and formulas follow the display rules below.

### 1. Вихідні дані

Caption:

```text
Вихідні дані для визначення категорій і групи конструкції (ДБН В.2.6-198:2014, таблиця 5.1, таблиці 7.1 і 7.2, Додаток А, таблиці А.1 і А.2, Додаток Г, таблиці Г.1 і Г.5):
```

Items in order:

```text
Розділ таблиці А.1: <section_label>
Конструкція або елемент: <structure_label>
Клас відповідальності: <СС1/СС2/СС3>
Характер навантаження: <Статичне/Динамічне>
Наявність розтягувальних напружень: <Так/Ні>
Несприятливий вплив зварних з’єднань: <Так/Ні>
Умови експлуатації: <service_condition>
Вид прокату: <product_type>
Клас міцності сталі: <steel_class>
Марка сталі та нормативний документ: <steel_grade_and_standard>
Товщина прокату t: <value unit>
σdyn: <value unit>
σsum: <value unit>
σc: <value unit>
Кромки після гільйотинного різання: <Так/Ні>
Неврахований наклеп від деформування в холодному стані: <Так/Ні>
Високі початкові напруження, у тому числі зварювальні: <Так/Ні>
```

Rules:

- Show `sigma_dyn`, `sigma_sum`, and `sigma_c` only under their UI display rules.
- Append only the conditional table 5.1 fields actually shown to the user.
- This step has no formula.

### 2. Категорії за таблицею А.1

Caption:

```text
Визначення категорій конструкції за призначенням і за напруженим станом (ДБН В.2.6-198:2014, Додаток А, таблиця А.1, позиція <a1_source_position>):
```

Items:

```text
Розділ таблиці А.1: <section_label>
Вибрана конструкція або елемент: <structure_label>
Вихідний рядок таблиці: <a1_source_text>
```

Formula:

```text
<structure_label> => категорія за призначенням = <А/Б/В>; категорія за напруженим станом = <I/II/III>
```

Notes:

```text
Додаток А має довідковий статус.
Вимоги таблиці А.1 не поширюються на сталеві конструкції спеціальних споруд, перелічених у примітці 1 до таблиці А.1.
Калькулятор охоплює тільки конструкції та елементи, прямо наведені в декомпільованому переліку таблиці А.1; аналогія за приміткою 2 не автоматизується.
```

Conditional note for manual hoists and manual crane beams:

```text
У наданому тексті позиції 1в ручні талі і кран-балки перетинаються у рядках Б/I та Б/II. За погодженим виправленням їх віднесено до категорій Б/II.
```

### 3. Показники S1-S5

Caption:

```text
Визначення показників окремих чинників S1–S5 (ДБН В.2.6-198:2014, Додаток А, таблиця А.2):
```

Formulas:

```text
S1 = f(клас відповідальності = <СС1/СС2/СС3>) = <0/4> балів
S2 = f(категорія за призначенням = <А/Б/В>) = <11/4/1> балів
S3,base = f(категорія за напруженим станом = <I/II/III>) = <8/5/1> балів
S4 = f(розтягувальні напруження = <є/немає>) = <7/2> балів
S5 = f(несприятливий вплив зварних з’єднань = <є/немає>) = <6/2> балів
```

Note:

```text
Несприятливий вплив зварних з’єднань враховується, якщо вони розташовані у місцях дії значних розрахункових розтягувальних напружень (σ > 0,3Ry; σ > 0,3Rwz), або в місцях, де міцність зварного з’єднання визначає придатність до експлуатації конструкції в цілому (примітка до таблиці А.2).
```

### 4. Початкова група

Caption:

```text
Визначення початкового показника та групи конструкції (ДБН В.2.6-198:2014, Додаток А, пункт А.1):
```

Formulas:

```text
Stot,base = S1 + S2 + S3,base + S4 + S5 = <S1> + <S2> + <S3,base> + <S4> + <S5> = <Stot,base> балів
Stot,base = <Stot,base> => група <1/2/3/4>
```

Note:

```text
Група 1 — Stot > 26; група 2 — 23 ≤ Stot ≤ 26; група 3 — 19 ≤ Stot ≤ 22; група 4 — Stot ≤ 18.
```

### 5. Розрахунковий опір сталі Ry

Caption:

```text
Визначення розрахункового опору сталі Ry за границею текучості (ДБН В.2.6-198:2014, пункт 7.1, таблиці 7.1 і 7.2, Додаток Г, таблиця Г.5):
```

Items:

```text
Клас міцності сталі: <steel_class>
Марка сталі та нормативний документ: <steel_grade_and_standard>
Вид і товщина прокату: <product_type>, t = <value unit>
Характеристичний опір за класом міцності: Ryn = <value> МПа
Коефіцієнт надійності за матеріалом за відповідним рядком таблиці 7.2: γm = <1,025/1,050/1,100>
```

Formula:

```text
Ry = Ryn / γm = <Ryn> / <γm> = <Ry> МПа
```

If the selected stress display unit is not MPa, append:

```text
= <Ry_display> <selected_unit>
```

Error:

```text
Вибрана марка сталі не відповідає класу міцності, виду або товщині прокату за таблицею Г.5 ДБН В.2.6-198:2014.
```

### 6. Коефіцієнт умов роботи gamma_c

Caption:

```text
Визначення коефіцієнта умов роботи γc (ДБН В.2.6-198:2014, пункт 5.4.1, таблиця 5.1 та примітки 1–5):
```

Items:

```text
Вибрана конструкція або елемент: <structure_label>
Режим визначення γc: <Автоматично за вибраною конструкцією / Напівавтоматично — вибір позиції таблиці 5.1 / Вручну>
```

Automatic-mode items:

```text
Кандидатні позиції таблиці 5.1 за погодженою матрицею: <candidate_rows або немає>
Застосовні позиції таблиці 5.1: <applicable_rows або немає>
```

Semi-automatic-mode item:

```text
Вибрана позиція таблиці 5.1: <option_label>
```

Manual-mode item:

```text
Значення γc прийняте користувачем: <manual_value>
```

For each applicable position:

```text
γc,<row> = <value> (таблиця 5.1, позиція <row/subrow>)
```

Final formula, single value:

```text
γc = <single_value>
```

Allowed combination:

```text
γc = γc,<row1> * γc,<row2> = <value1> * <value2> = <result>
```

No applicable position:

```text
γc = 1,0 (таблиця 5.1, примітка 5)
```

Semi-automatic final formula:

```text
γc = <selected_value> (таблиця 5.1, позиція <selected_position>)
```

Manual final formula:

```text
γc = <manual_value> (прийнято користувачем)
```

Manual-mode error:

```text
Коефіцієнт умов роботи γc у ручному режимі має бути більше 0.
```

Notes:

```text
Коефіцієнти γc < 1,0 не враховуються сумісно, крім випадків приміток 2 і 3 до таблиці 5.1.
Дозволені сполучення за приміткою 2: позиції 6 і 1; 6 і 2; 6 і 5.
Дозволені сполучення за приміткою 3: позиції 9 і 2; 9 і 3.
Якщо одночасно застосовні кілька альтернативних коефіцієнтів, сумісне врахування яких не дозволене, приймається найменше значення γc.
```

Warning:

```text
Для опорної плити завтовшки понад 80 мм таблиця 5.1 не встановлює значення γc у позиції 9; застосовність коефіцієнта потрібно обґрунтувати окремо.
```

### 7. Уточнення категорії за напруженим станом

Caption:

```text
Уточнення категорії конструкції за напруженим станом після підбору перерізу (ДБН В.2.6-198:2014, Додаток А, пункт А.2, перший абзац):
```

Dynamic load with tensile stress:

```text
α = |σdyn| / |σsum| = <σdyn> / <σsum> = <alpha>
α = <alpha> => категорія за напруженим станом = <I/II/III>
S3,A2 = f(<I/II/III>) = <8/5/1> балів
```

Static load with tensile stress:

```text
α = |σdyn| / |σsum| = 0 / <σsum> = 0
α = 0 => категорія за напруженим станом = III
S3,A2 = f(III) = 1 бал
```

No tensile stress:

```text
α = не визначається, оскільки розтягувальні напруження відсутні
S3,A2 = S3,base = <value> балів
```

Note:

```text
Категорія I рекомендується при α ≥ 0,5; категорія II — при 0,2 < α < 0,5; категорія III — при α ≤ 0,2.
```

Errors:

```text
Для визначення α найбільше сумарне розтягувальне напруження σsum має бути більшим за нуль.
Напруження σdyn не може перевищувати σsum, оскільки динамічна складова входить до сумарного розтягувального напруження від усіх навантажень.
```

### 8. Додатні поправки А.2

Caption:

```text
Визначення додатних поправок до показника групи після підбору перерізу (ДБН В.2.6-198:2014, Додаток А, пункт А.2, другий абзац):
```

Formulas:

```text
ΔSt = f(t = <t_mm> мм) = <0/+1/+2> балів
ΔSguillotine = f(кромки після гільйотинного різання = <є/немає>) = <+1/0> балів
ΔScold = f(неврахований наклеп = <є/немає>) = <+1/0> балів
ΔSinitial = f(високі початкові напруження = <є/немає>) = <+1/0> балів
ΔS+ = ΔSt + ΔSguillotine + ΔScold + ΔSinitial = <numeric substitution> = <result> балів
```

Rule:

```text
t ≤ 20 мм => 0; 20 мм < t ≤ 40 мм => +1; t > 40 мм => +2.
```

Note:

```text
Кожен наявний технологічний чинник враховується окремо; загальне обмеження коригування ±4 бали застосовується на наступному кроці до суми всіх складових А.2.
```

### 9. Поправка за статичний стиск

Caption:

```text
Перевірка умови зменшення показника групи при статичному стиску (ДБН В.2.6-198:2014, Додаток А, пункт А.2, третій абзац):
```

Static load formulas:

```text
σlimit = 0,4 * Ry * γc = 0,4 * <Ry_display> * <γc> = <σlimit_display> <selected_unit>
σc = <σc_display> <selected_unit> ≤ σlimit = <σlimit_display> <selected_unit> => <виконується/не виконується>
ΔScompression = <-4/0> балів
```

Dynamic load formula:

```text
ΔScompression = 0 балів (умова пункту А.2 застосовується при статичному навантаженні)
```

Note:

```text
σc вводиться як невід’ємний модуль нормального напруження стиску, обчисленого з урахуванням коефіцієнтів φ, φe і φb.
```

Error:

```text
Нормальне напруження стиску σc має бути невід’ємним значенням.
```

### 10. Уточнений показник і група

Caption:

```text
Уточнення показника та групи конструкції після підбору перерізу (ДБН В.2.6-198:2014, Додаток А, пункт А.2):
```

Formulas:

```text
ΔS3 = S3,A2 - S3,base = <S3,A2> - <S3,base> = <result> балів
ΔSraw = ΔS3 + ΔS+ + ΔScompression = <numeric substitution> = <result> балів
ΔS = clamp(ΔSraw; -4; +4) = <result> балів
Stot,A2 = Stot,base + ΔS = <Stot,base> + <ΔS> = <Stot,A2> балів
Stot,A2 = <Stot,A2> => уточнена група <1/2/3/4>
```

Notes:

```text
Загальне коригування показника Stot після підбору перерізу обмежується діапазоном від −4 до +4 балів.
Показники чинників при експлуатації, транспортуванні та монтажі можуть відрізнятися; за потреби ці стани перевіряються окремими розрахунками.
```

### 11. Сумісність сталі з групою

Caption:

```text
Перевірка застосування вибраної сталі для уточненої групи конструкцій (ДБН В.2.6-198:2014, Додаток Г, таблиця Г.1 та примітки 1–6):
```

Items:

```text
Клас міцності сталі: <steel_class>
Уточнена група конструкції: <group>
Умови експлуатації: <service_condition>
Товщина прокату: <t_display>
Належність до ПЛ, ВРП або контактної мережі: <Так/Ні>
Комірка таблиці Г.1: <sign/footnote>
Застосована примітка: <note_number або не застосовується>
```

Formula:

```text
допустимість сталі = G.1(<steel_class>; група <group>; <conditions>) = <дозволено/не дозволено>
```

Success text:

```text
Вибраний клас сталі <steel_class> допускається для групи <group> за таблицею Г.1 з урахуванням <умови/примітки>.
```

Error:

```text
Вибраний клас сталі <steel_class> не допускається для групи <group> за таблицею Г.1 ДБН В.2.6-198:2014 з урахуванням заданих умов експлуатації та товщини прокату.
```

On error, set `valid = false` but preserve all calculated values and steps.

### 12. Висновок

Caption:

```text
Висновок щодо категорій, групи конструкції та застосовності сталі (ДБН В.2.6-198:2014, Додаток А, пункти А.1 і А.2; Додаток Г, таблиця Г.1):
```

Formula:

```text
<structure_label> => категорії <purpose_category>/<stress_category_base> => Stot,base = <value>, група <base_group> => Stot,A2 = <value>, уточнена група <refined_group>; сталь <steel_class> — <дозволено/не дозволено>
```

UI result:

```text
Категорія за призначенням: <А/Б/В>
Категорія за напруженим станом за таблицею А.1: <I/II/III>
Уточнена категорія за напруженим станом за пунктом А.2: <I/II/III або не змінювалась>
Початкова група: <1/2/3/4>, Stot,base = <value>
Уточнена група: <1/2/3/4>, Stot,A2 = <value>
Коефіцієнт умов роботи: γc = <value>
Розрахунковий опір сталі: Ry = <value unit>
Застосовність сталі за таблицею Г.1: <дозволено/не дозволено>
```

## Validation And Stable Failure Behavior

- All numeric values must be finite.
- `thickness > 0`.
- Stress inputs are non-negative magnitudes.
- For tensile stress, `sigma_sum > 0`.
- For dynamic tensile stress, `0 <= sigma_dyn <= sigma_sum`.
- `slenderness_lambda >= 0` when shown.
- A grade/product/thickness mismatch under table Г.5 is an error.
- A steel/group incompatibility under table Г.1 is an error.
- Missing or invalid table 5.1 qualifiers make the candidate inapplicable; they do not create `NaN`.
- Invalid reports retain selected input, stable steps, errors, and any values that can still be safely calculated.

## Normative References UI

Title:

```text
Нормативні посилання
```

Items:

```text
ДБН В.2.6-198:2014, Додаток А, таблиця А.1
Категорії конструкцій за призначенням і за напруженим станом; декомпільований перелік із 155 атомарних конструкцій та елементів.

ДБН В.2.6-198:2014, Додаток А, таблиця А.2, пункти А.1 і А.2
Показники S1–S5, початкова група та уточнення показника групи після підбору перерізу.

ДБН В.2.6-198:2014, пункт 5.4.1, таблиця 5.1
Коефіцієнти умов роботи γc та правила їх сумісного врахування за примітками 1–5.

ДБН В.2.6-198:2014, пункти 7.1–7.2, таблиці 7.1–7.2
Визначення Ry = Ryn / γm і коефіцієнта надійності за матеріалом γm.

ДБН В.2.6-198:2014, Додаток Г, таблиці Г.1 і Г.5
Відповідність марок класам міцності та перевірка застосування сталі для уточненої групи конструкцій.
```

Each applicable normative-reference article contains a collapsed `Скан
фрагмента ДБН` block with local PNG assets. Include scans of table А.1, table
А.2, table 5.1 with notes 1–5, table Г.1, and table Г.5.

## Catalog Registration Requirement

Future implementation must add:

```text
Category title: Сталеві конструкції
Category slug: stalevi-konstruktsiyi
Parent: Конструкції (konstruktsiyi)
Suggested existing icon: Hammer
Calculator title: Категорії та групи сталевих конструкцій
Calculator slug: steel-structure-category-group
Main category: stalevi-konstruktsiyi
Extra categories: normy-perevirky, dovidkovi-tablytsi
Display mode: native
Standard: ДБН В.2.6-198:2014
```

## Export And Testing Requirements

- Use the existing native report model and DOCX export path.
- Keep the plain-text formulas above canonical for UI, accessibility, tests, and DOCX.
- Test all 155 catalog entries for unique IDs, section membership, category, and explicit table 5.1 profile/fallback.
- Test all table A.2 score values and all group boundaries.
- Test alpha boundaries `0.2` and `0.5` exactly.
- Test all thickness boundaries: 5, 8, 10, 20, 40, 60, and 80 mm where relevant.
- Test every table 5.1 subrow and allowed/non-allowed coefficient combination.
- Test table Г.1 for every steel class and group, including footnotes `a`, `b`, and note 3.
- Test the exact 12-step order and every canonical formula template.
- Test inspector metadata, units, conditional visibility, and dependency resets.
- Test a `CalculatorShell` smoke render and DOCX report creation.

## Contract Self-Review Checklist

- 18 first-list sections are present.
- 155 atomic second-list options are present.
- Every atomic option has a stable `structureId`, A.1 category, and explicit table 5.1 profile or `default`.
- The manual-hoist/manual-crane-beam correction is recorded as Б/II.
- All base and conditional field labels, options, defaults, display rules, units, and normative descriptions are fixed.
- All 12 captions, formulas, notes, warnings, and errors are fixed.
- The category `Сталеві конструкції` is recorded as a future implementation requirement.
- No design specification, implementation plan, or calculator code is created by this contract step.
