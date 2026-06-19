"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
  formatResidentialYardAreaNumber,
  getResidentialYardAreasReport,
  type ResidentialYardAreaResult,
  type ResidentialYardAreasInput,
  type ResidentialYardAreasReport,
  type ResidentialYardAreaUnit,
  type ResidentialYardGoverningBasis,
} from "@/lib/residential-yard-areas";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValidationErrors,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm } from "./input-schema-form";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport, type NativeReportStep } from "./native-report";
import {
  buildNativeDocxReport,
  formatDocxFileDate,
} from "./native-report-docx";
import { ReportDocxButton } from "./report-docx-button";

const SITE_AREA_UNITS = [
  { value: "m2", label: "м²", factorToBase: 1 },
  { value: "a", label: "ар", factorToBase: 100 },
  { value: "ha", label: "га", factorToBase: 10000 },
];

const SITE_AREA_PER_PERSON_UNITS = [
  { value: "m2", label: "м²/особу", factorToBase: 1 },
  { value: "a", label: "ар/особу", factorToBase: 100 },
  { value: "ha", label: "га/особу", factorToBase: 10000 },
];

const SITE_AREA_PER_APARTMENT_UNITS = [
  { value: "m2", label: "м²/квартиру", factorToBase: 1 },
  { value: "a", label: "ар/квартиру", factorToBase: 100 },
  { value: "ha", label: "га/квартиру", factorToBase: 10000 },
];

const INITIAL_DISPLAY_UNITS: Record<string, string> = {
  manualVacuumAreaM2: "m2",
  householdAreaPerPersonM2: "m2",
  householdAreaPerApartmentM2: "m2",
};

export const RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "residential-yard-building-data",
      title: "Дані будинку",
      fields: [
        {
          id: "residents",
          kind: "number",
          prefix: { text: "N", subscript: "осіб", ariaLabel: "N_осіб" },
          name: "Кількість мешканців",
          defaultValue: String(DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT.residents),
          min: 1,
          step: "1",
          required: true,
          description:
            "Введіть розрахункову кількість мешканців будинку за завданням на проєктування, демографічним розрахунком або статистичними даними. Значення використовується для обчислення площ кожного майданчика за питомими показниками на одну особу; отримана площа порівнюється з розрахунком за кількістю квартир, після чого приймається більший результат. Джерело: примітка 2 до таблиці 6.3 та таблиця 6.4 ДБН Б.2.2-12:2019.",
        },
        {
          id: "oneRoomApartments",
          kind: "number",
          prefix: { text: "N", subscript: "1", ariaLabel: "N_1" },
          name: "Кількість однокімнатних квартир",
          defaultValue: String(
            DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT.oneRoomApartments,
          ),
          min: 0,
          step: "1",
          required: true,
          description:
            "Введіть кількість однокімнатних квартир за експлікацією квартир або завданням на проєктування. Значення входить до загальної кількості квартир для розрахунку площ майданчиків, а під час визначення гостьових машиномісць враховується з коефіцієнтом 0,5. Джерело: таблиця 6.4 та примітка 1 до таблиці 10.5 ДБН Б.2.2-12:2019.",
        },
        {
          id: "twoOrMoreRoomApartments",
          kind: "number",
          prefix: { text: "N", subscript: "2+", ariaLabel: "N_2+" },
          name: "Кількість дво- та більше кімнатних квартир",
          defaultValue: String(
            DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT.twoOrMoreRoomApartments,
          ),
          min: 0,
          step: "1",
          required: true,
          description:
            "Введіть сумарну кількість дво-, три- та багатокімнатних квартир за експлікацією квартир або завданням на проєктування. Значення входить до загальної кількості квартир для розрахунку площ майданчиків і враховується без понижувального коефіцієнта під час визначення гостьових машиномісць. Джерело: таблиця 6.4 та таблиця 10.5 ДБН Б.2.2-12:2019.",
        },
      ],
    },
    {
      id: "residential-yard-physical-culture",
      title: "Фізкультурні майданчики",
      fields: [
        {
          id: "physicalCultureMode",
          kind: "select",
          name: "Норматив площі фізкультурних майданчиків",
          defaultValue:
            DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT.physicalCultureMode,
          options: [
            {
              value: "full",
              label: "Повний норматив — 2,0 м²/особу або 5,0 м²/квартиру",
            },
            {
              value: "reduced",
              label: "Зменшений норматив — 0,2 м²/особу або 0,5 м²/квартиру",
            },
          ],
          description:
            "Оберіть повний норматив, якщо фізкультурні майданчики забезпечуються в межах розрахованої території. Зменшений норматив можна обрати лише за наявності окремої озелененої фізкультурної зони рівня мікрорайону або групи кварталів і забезпечення не менше 6 м² зелених насаджень обмеженого користування на одну особу. Вибір визначає питомі коефіцієнти у формулах площі. Джерело: таблиця 6.4 та примітка * ДБН Б.2.2-12:2019.",
        },
        {
          id: "hasSeparateLandscapedPhysicalCultureZone",
          kind: "checkbox",
          name: "Передбачена окрема озеленена фізкультурна зона",
          defaultValue: false,
          showWhen: { fieldId: "physicalCultureMode", equals: "reduced" },
          description:
            "Оберіть «Так», якщо проєктом передбачена окрема озеленена зона з фізкультурними майданчиками, яка обслуговує мікрорайон або групу житлових кварталів. Без такого підтвердження зменшення питомої площі з 2,0 до 0,2 м²/особу та з 5,0 до 0,5 м²/квартиру не допускається. Джерело: примітка * до таблиці 6.4 ДБН Б.2.2-12:2019.",
        },
        {
          id: "hasRequiredLimitedUseGreenery",
          kind: "checkbox",
          name: "Забезпечено 6 м² зелених насаджень на одну особу",
          defaultValue: false,
          showWhen: { fieldId: "physicalCultureMode", equals: "reduced" },
          description:
            "Оберіть «Так», якщо розрахунком озеленення підтверджено не менше 6 м² зелених насаджень обмеженого користування на кожного мешканця. Checkbox підтверджує умову застосування зменшеного нормативу фізкультурних майданчиків; сам калькулятор площу озеленення не перевіряє. Джерело: примітка * до таблиці 6.4 ДБН Б.2.2-12:2019.",
        },
      ],
    },
    {
      id: "residential-yard-waste",
      title: "Збирання побутових відходів",
      fields: [
        {
          id: "wasteCollectionMethod",
          kind: "select",
          name: "Спосіб збирання побутових відходів",
          defaultValue:
            DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT.wasteCollectionMethod,
          options: [
            { value: "above_ground", label: "Наземний" },
            { value: "underground", label: "Підземний" },
            { value: "vacuum", label: "Вакуумний" },
          ],
          description:
            "Оберіть передбачений проєктом спосіб збирання побутових відходів. Для наземного способу площа розраховується за 0,07 м²/особу та 0,18 м²/квартиру, для підземного — за 0,03 м²/особу та 0,08 м²/квартиру. Для вакуумного способу питомий показник таблицею 6.4 не встановлений, тому площу потрібно ввести за технічними умовами. Джерело: таблиця 6.4, примітка **, п. 6.1.22 і таблиця 6.5 ДБН Б.2.2-12:2019.",
        },
        {
          id: "manualVacuumAreaM2",
          kind: "number",
          prefix: { text: "S", subscript: "відх,руч", ariaLabel: "S_відх,руч" },
          name: "Площа майданчика за технічними умовами",
          defaultValue: "",
          min: 0,
          step: "0.01",
          required: true,
          defaultDisplayUnit: "m2",
          displayUnits: SITE_AREA_UNITS,
          showWhen: { fieldId: "wasteCollectionMethod", equals: "vacuum" },
          description:
            "Введіть площу майданчика або технологічної зони вакуумної системи, прийняту в проєкті за містобудівними та технічними умовами. Значення безпосередньо включається в підсумок замість автоматичного розрахунку за кількістю осіб і квартир. Калькулятор не перевіряє достатність площі, компонування обладнання, під’їзди та нормативні відстані; відповідальність за обґрунтування значення залишається за користувачем. Джерело: п. 6.1.22 і таблиця 6.5 ДБН Б.2.2-12:2019.",
        },
      ],
    },
    {
      id: "residential-yard-household",
      title: "Господарські майданчики",
      fields: [
        {
          id: "hasHouseholdPurposeAreas",
          kind: "checkbox",
          name: "Передбачити господарські майданчики",
          defaultValue: false,
          description:
            "Оберіть «Так», якщо проєктом передбачені майданчики для господарських цілей, зокрема для сушіння білизни або чищення килимів. Після вибору калькулятор покаже два питомі значення, розрахує площу за кількістю осіб і квартир та включить більший результат у підсумок. Примітка 2 дозволяє облаштовувати такі майданчики, але не встановлює їх безумовної обов’язковості. Джерело: примітка 2 до таблиці 6.4 ДБН Б.2.2-12:2019.",
        },
        {
          id: "householdAreaPerPersonM2",
          kind: "number",
          prefix: { text: "q", subscript: "госп,ос", ariaLabel: "q_госп,ос" },
          name: "Площа господарських майданчиків на одну особу",
          defaultValue: "0.1",
          min: 0.1,
          max: 0.3,
          step: "0.01",
          defaultDisplayUnit: "m2",
          displayUnits: SITE_AREA_PER_PERSON_UNITS,
          showWhen: { fieldId: "hasHouseholdPurposeAreas", equals: true },
          description:
            "Введіть прийнятий у проєкті питомий розмір господарських майданчиків на одного мешканця в межах нормативного діапазону 0,1–0,3 м²/особу. Значення множиться на кількість мешканців, а отримана площа порівнюється з розрахунком за кількістю квартир. Джерело: примітка 2 до таблиці 6.4 ДБН Б.2.2-12:2019.",
        },
        {
          id: "householdAreaPerApartmentM2",
          kind: "number",
          prefix: { text: "q", subscript: "госп,кв", ariaLabel: "q_госп,кв" },
          name: "Площа господарських майданчиків на одну квартиру",
          defaultValue: "0.25",
          min: 0.25,
          max: 0.75,
          step: "0.01",
          defaultDisplayUnit: "m2",
          displayUnits: SITE_AREA_PER_APARTMENT_UNITS,
          showWhen: { fieldId: "hasHouseholdPurposeAreas", equals: true },
          description:
            "Введіть прийнятий у проєкті питомий розмір господарських майданчиків на одну квартиру в межах нормативного діапазону 0,25–0,75 м²/квартиру. Значення множиться на загальну кількість квартир, а отримана площа порівнюється з розрахунком за кількістю мешканців. Джерело: примітка 2 до таблиці 6.4 ДБН Б.2.2-12:2019.",
        },
      ],
    },
  ],
};

function parseNumber(value: unknown): number {
  if (typeof value !== "string") return Number.NaN;
  return Number.parseFloat(value.replace(",", "."));
}

function readUnit(
  displayUnits: Record<string, string>,
  fieldId: string,
): ResidentialYardAreaUnit {
  const value = displayUnits[fieldId];
  return value === "a" || value === "ha" ? value : "m2";
}

function inputFromValues(
  values: CalculatorInputValues,
  displayUnits: Record<string, string>,
): ResidentialYardAreasInput {
  const manualVacuumArea = parseNumber(values.manualVacuumAreaM2);
  return {
    residents: parseNumber(values.residents),
    oneRoomApartments: parseNumber(values.oneRoomApartments),
    twoOrMoreRoomApartments: parseNumber(values.twoOrMoreRoomApartments),
    physicalCultureMode:
      values.physicalCultureMode === "reduced" ? "reduced" : "full",
    hasSeparateLandscapedPhysicalCultureZone:
      values.hasSeparateLandscapedPhysicalCultureZone === true,
    hasRequiredLimitedUseGreenery:
      values.hasRequiredLimitedUseGreenery === true,
    wasteCollectionMethod:
      values.wasteCollectionMethod === "underground" ||
      values.wasteCollectionMethod === "vacuum"
        ? values.wasteCollectionMethod
        : "above_ground",
    manualVacuumAreaM2: Number.isFinite(manualVacuumArea)
      ? manualVacuumArea
      : null,
    manualVacuumAreaUnit: readUnit(
      displayUnits,
      "manualVacuumAreaM2",
    ),
    hasHouseholdPurposeAreas: values.hasHouseholdPurposeAreas === true,
    householdAreaPerPersonM2: parseNumber(values.householdAreaPerPersonM2),
    householdAreaPerApartmentM2: parseNumber(
      values.householdAreaPerApartmentM2,
    ),
    householdAreaPerPersonUnit: readUnit(
      displayUnits,
      "householdAreaPerPersonM2",
    ),
    householdAreaPerApartmentUnit: readUnit(
      displayUnits,
      "householdAreaPerApartmentM2",
    ),
  };
}

function normalizeDependentValues(
  values: CalculatorInputValues,
): CalculatorInputValues {
  const next = { ...values };
  if (next.physicalCultureMode !== "reduced") {
    next.hasSeparateLandscapedPhysicalCultureZone = false;
    next.hasRequiredLimitedUseGreenery = false;
  }
  if (next.wasteCollectionMethod !== "vacuum") {
    next.manualVacuumAreaM2 = "";
  }
  if (next.hasHouseholdPurposeAreas !== true) {
    next.householdAreaPerPersonM2 = "0.1";
    next.householdAreaPerApartmentM2 = "0.25";
  }
  return next;
}

function getFieldValidationErrors(
  report: ResidentialYardAreasReport,
): CalculatorInputValidationErrors {
  const result: CalculatorInputValidationErrors = {};
  const mappings: Array<[string, string]> = [
    ["Кількість мешканців", "residents"],
    ["Кількість однокімнатних квартир", "oneRoomApartments"],
    ["Кількість дво- та більше кімнатних квартир", "twoOrMoreRoomApartments"],
    ["Загальна кількість квартир", "twoOrMoreRoomApartments"],
    ["Зменшений норматив", "physicalCultureMode"],
    ["Для вакуумного способу", "manualVacuumAreaM2"],
    ["на одну особу", "householdAreaPerPersonM2"],
    ["на одну квартиру", "householdAreaPerApartmentM2"],
  ];
  for (const error of report.errors) {
    const mapping = mappings.find(([start]) => error.startsWith(start));
    if (!mapping) continue;
    const fieldId = mapping[1];
    result[fieldId] = [...(result[fieldId] ?? []), error];
  }
  return result;
}

function basisLabel(basis: ResidentialYardGoverningBasis): string {
  switch (basis) {
    case "residents":
      return "За мешканцями";
    case "apartments":
      return "За квартирами";
    case "equal":
      return "Обидва значення однакові";
    case "manual":
      return "Ручне значення";
    case "disabled":
      return "Не передбачено";
  }
}

function AreaResultCard({
  title,
  symbol,
  result,
  className = "",
  note,
}: {
  title: string;
  symbol: string;
  result: ResidentialYardAreaResult;
  className?: string;
  note?: string;
}) {
  return (
    <article className={`residential-yard-result ${className}`.trim()}>
      <h4>{title}</h4>
      <strong>
        {symbol} = {formatResidentialYardAreaNumber(result.adoptedM2)} м²
      </strong>
      <span>{basisLabel(result.basis)}</span>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

function TotalResultCard({
  title,
  symbol,
  value,
}: {
  title: string;
  symbol: string;
  value: number;
}) {
  return (
    <article className="residential-yard-result residential-yard-result--total">
      <h4>{title}</h4>
      <strong>
        {symbol} = {formatResidentialYardAreaNumber(value)} м²
      </strong>
    </article>
  );
}

export function buildResidentialYardAreasDocxReport(
  report: ResidentialYardAreasReport,
  date = new Date(),
) {
  return buildNativeDocxReport({
    title: "Покроковий звіт",
    fileBaseName: `ploshchi-prybudynkovykh-maidanchykiv-${formatDocxFileDate(
      date,
    )}`,
    steps: report.steps as NativeReportStep[],
  });
}

export function ResidentialYardAreasCalculator() {
  const [values, setValues] = useState<CalculatorInputValues>(() =>
    getDefaultInputSchemaValues(RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA),
  );
  const [displayUnits, setDisplayUnits] = useState<Record<string, string>>(
    INITIAL_DISPLAY_UNITS,
  );
  const report = useMemo(
    () => getResidentialYardAreasReport(inputFromValues(values, displayUnits)),
    [displayUnits, values],
  );
  const fieldErrors = useMemo(() => getFieldValidationErrors(report), [report]);
  const result = report.values;
  const navLinks = [
    { href: "#residential-yard-building-data", label: "Будинок" },
    { href: "#residential-yard-physical-culture", label: "Фізкультура" },
    { href: "#residential-yard-waste", label: "Відходи" },
    { href: "#residential-yard-household", label: "Господарські" },
  ];

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор площ прибудинкових майданчиків"
      navLinks={navLinks}
      summary={
        result ? (
          <p>
            Sприбуд = {formatResidentialYardAreaNumber(result.insideBoundaryAreaM2)} м²
          </p>
        ) : null
      }
      controls={
        <InputSchemaForm
          schema={RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA}
          values={values}
          onValuesChange={(next) => setValues(normalizeDependentValues(next))}
          validationErrors={fieldErrors}
          displayUnits={displayUnits}
          onDisplayUnitsChange={setDisplayUnits}
        />
      }
      errors={report.errors}
      warnings={report.warnings}
    >
      {result ? (
        <section
          className="residential-yard-results"
          aria-label="Результати розрахунку площ майданчиків"
        >
          <AreaResultCard title="Дитячі майданчики" symbol="Sдіт" result={result.children} />
          <AreaResultCard
            title="Відпочинок дорослих"
            symbol="Sвідп"
            result={result.adultRecreation}
          />
          <AreaResultCard
            title="Фізкультурні майданчики"
            symbol="Sфіз"
            result={result.physicalCulture}
          />
          <article className="residential-yard-result">
            <h4>Гостьова стоянка</h4>
            <strong>
              Nгост = {result.guestParkingSpaces}; Sгост ={` `}
              {formatResidentialYardAreaNumber(result.guestParkingAreaM2)} м²
            </strong>
            <span>За складом квартир</span>
          </article>
          <AreaResultCard
            title="Стоянка велосипедів"
            symbol="Sвел"
            result={result.bicycleParking}
          />
          <AreaResultCard
            title="Збирання відходів"
            symbol="Sвідх"
            result={result.wasteCollection}
          />
          <AreaResultCard
            title="Господарські майданчики"
            symbol="Sгосп"
            result={result.householdPurpose}
          />
          <AreaResultCard
            title="Вигул домашніх тварин"
            symbol="Sтвар"
            result={result.petWalking}
            className="residential-yard-result--outside"
            note="Поза межами прибудинкової території"
          />
          <TotalResultCard
            title="У межах прибудинкової території"
            symbol="Sприбуд"
            value={result.insideBoundaryAreaM2}
          />
          <TotalResultCard
            title="Загальна територіальна потреба"
            symbol="Sтер"
            value={result.territorialNeedAreaM2}
          />
        </section>
      ) : null}

      <NativeReport
        titleId="residential-yard-report-title"
        title="Покроковий звіт"
        steps={report.steps}
        actions={
          <ReportDocxButton report={buildResidentialYardAreasDocxReport(report)} />
        }
      />
    </NativeCalculatorLayout>
  );
}
