"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  SOIL_TYPE_LABELS,
  formatSoilDesignResistanceNumber,
  getSoilDesignResistanceReport,
  type SoilCalculationMode,
  type SoilDesignResistanceInput,
  type SoilDesignResistanceReportStep,
  type SoilStrengthSource,
  type SoilStructuralScheme,
  type SoilType,
} from "@/lib/soil-design-resistance";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm } from "./input-schema-form";
import { MathNotation } from "./math-notation";
import { ReportFormula } from "./report-formula";

const SOIL_TYPES = Object.keys(SOIL_TYPE_LABELS) as SoilType[];
const CLAYEY_SOIL_TYPES: SoilType[] = ["coarse-with-clayey-fill", "clayey-soil"];

const NORM_LINKS = [
  { text: "формула (Е.1)", id: "soil-norm-e1" },
  { text: "формулою (Е.2)", id: "soil-norm-e2" },
  { text: "табл. Е.7", id: "soil-norm-table-e7" },
  { text: "табл. Е.8", id: "soil-norm-table-e8" },
  { text: "п. Е.4", id: "soil-norm-e4" },
  { text: "приміткою 1", id: "soil-norm-table-e7-note-1" },
] as const;

const SOIL_TYPE_OPTIONS = SOIL_TYPES.map((type) => ({
  value: type,
  label: SOIL_TYPE_LABELS[type],
}));

const SOIL_LENGTH_DISPLAY_UNITS = [{ value: "m", label: "м", factorToBase: 1 }];
const SOIL_ANGLE_DISPLAY_UNITS = [{ value: "deg", label: "°", factorToBase: 1 }];
const SOIL_UNIT_WEIGHT_DISPLAY_UNITS = [
  { value: "kn-m3", label: "кН/м³", factorToBase: 1 },
];
const SOIL_PRESSURE_DISPLAY_UNITS = [{ value: "kpa", label: "кПа", factorToBase: 1 }];

const SOIL_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "soil-resistance-working",
      title: "Умови роботи",
      fields: [
        {
          id: "calculationMode",
          kind: "select",
          name: "Спосіб розрахунку",
          defaultValue: "manual-e7",
          description:
            "В автоматичному режимі γc1 і γc2 підбираються за табл. Е.7 ДБН В.2.1-10 залежно від типу ґрунту, конструктивної схеми та L/H. У ручному режимі користувач задає ці коефіцієнти самостійно.",
          options: [
            { value: "automatic", label: "Автоматично за характеристиками ґрунту" },
            { value: "manual-e7", label: "Вручну за табл. Е.7" },
          ],
        },
        {
          id: "gammaC1Manual",
          kind: "number",
          prefix: { text: "γ", subscript: "c1", ariaLabel: "γc1" },
          name: "Коефіцієнт умов роботи 1",
          defaultValue: "1",
          min: 0,
          step: "0.01",
          description:
            "Коефіцієнт умов роботи ґрунту γc1 для формули (Е.1) ДБН В.2.1-10. У ручному режимі приймається користувачем за табл. Е.7; значення має бути додатним.",
          showWhen: { fieldId: "calculationMode", equals: "manual-e7" },
        },
        {
          id: "gammaC2Manual",
          kind: "number",
          prefix: { text: "γ", subscript: "c2", ariaLabel: "γc2" },
          name: "Коефіцієнт умов роботи 2",
          defaultValue: "1",
          min: 0,
          step: "0.01",
          description:
            "Коефіцієнт умов роботи споруди з основою γc2 для формули (Е.1) ДБН В.2.1-10. У ручному режимі приймається користувачем за табл. Е.7; значення має бути додатним.",
          showWhen: { fieldId: "calculationMode", equals: "manual-e7" },
        },
        {
          id: "structuralScheme",
          kind: "select",
          name: "Конструктивна схема споруди",
          defaultValue: "rigid",
          description:
            "Ознака для вибору γc2 за табл. Е.7 ДБН В.2.1-10 в автоматичному режимі. Жорстка схема обмежує взаємні деформації основи й споруди, гнучка допускає їх більшу нерівномірність.",
          options: [
            { value: "rigid", label: "Жорстка" },
            { value: "flexible", label: "Гнучка" },
          ],
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "buildingLengthM",
          kind: "number",
          prefix: { text: "L", ariaLabel: "L" },
          name: "Довжина споруди",
          defaultValue: "8.25",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Довжина споруди або її відсіку L для відношення L/H у табл. Е.7 ДБН В.2.1-10. Значення задається в метрах і має бути більше 0.",
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "buildingHeightM",
          kind: "number",
          prefix: { text: "H", ariaLabel: "H" },
          name: "Висота споруди",
          defaultValue: "3",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Висота споруди або її відсіку H для відношення L/H у табл. Е.7 ДБН В.2.1-10. Значення задається в метрах і має бути більше 0.",
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "soilType",
          kind: "select",
          name: "Тип ґрунту",
          defaultValue: "medium-sand",
          description:
            "Тип ґрунту використовується для вибору рядка табл. Е.7 та коефіцієнтів Mγ, Mq, Mc за табл. Е.8 ДБН В.2.1-10.",
          options: SOIL_TYPE_OPTIONS,
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "liquidityIndex",
          kind: "number",
          prefix: { text: "I", subscript: "L", ariaLabel: "IL" },
          name: "Показник текучості",
          defaultValue: "0.3",
          step: "0.01",
          description:
            "Показник текучості IL потрібен для глинистих ґрунтів або глинистого заповнювача при виборі табличних значень ДБН В.2.1-10. Додаток Е використовує його як класифікаційну ознаку.",
          showWhen: [
            { fieldId: "calculationMode", equals: "automatic" },
            { fieldId: "soilType", in: CLAYEY_SOIL_TYPES },
          ],
        },
      ],
    },
    {
      id: "soil-resistance-strength",
      title: "Характеристики ґрунту",
      fields: [
        {
          id: "phi11Deg",
          kind: "number",
          prefix: { text: "φ", subscript: "11", ariaLabel: "φ11" },
          name: "Кут внутрішнього тертя",
          defaultValue: "30",
          min: 0,
          step: "0.01",
          baseUnit: "deg",
          defaultDisplayUnit: "deg",
          displayUnits: SOIL_ANGLE_DISPLAY_UNITS,
          description:
            "Розрахунковий кут внутрішнього тертя φ11 ґрунту нижче підошви фундаменту. Використовується у формулі (Е.1) і для вибору Mγ, Mq, Mc за табл. Е.8 ДБН В.2.1-10.",
        },
        {
          id: "gamma11KnM3",
          kind: "number",
          prefix: { text: "γ", subscript: "11", ariaLabel: "γ11" },
          name: "Питома вага ґрунту нижче підошви",
          defaultValue: "17.1",
          min: 0,
          step: "0.01",
          baseUnit: "kn-m3",
          defaultDisplayUnit: "kn-m3",
          displayUnits: SOIL_UNIT_WEIGHT_DISPLAY_UNITS,
          description:
            "Розрахункова питома вага ґрунту γ11 нижче підошви фундаменту. Входить у член із шириною b у формулі (Е.1) ДБН В.2.1-10; значення має бути більше 0.",
        },
        {
          id: "gammaPrime11KnM3",
          kind: "number",
          prefix: { text: "γ′", subscript: "11", ariaLabel: "γ′11" },
          name: "Осереднена питома вага вище підошви",
          defaultValue: "16.6",
          min: 0,
          step: "0.01",
          baseUnit: "kn-m3",
          defaultDisplayUnit: "kn-m3",
          displayUnits: SOIL_UNIT_WEIGHT_DISPLAY_UNITS,
          description:
            "Осереднена розрахункова питома вага γ′11 ґрунтів вище підошви фундаменту. Використовується в члені з глибиною d1 у формулі (Е.1) ДБН В.2.1-10.",
        },
        {
          id: "c11KPa",
          kind: "number",
          prefix: { text: "c", subscript: "11", ariaLabel: "c11" },
          name: "Питоме зчеплення",
          defaultValue: "4",
          min: 0,
          step: "0.01",
          baseUnit: "kpa",
          defaultDisplayUnit: "kpa",
          displayUnits: SOIL_PRESSURE_DISPLAY_UNITS,
          description:
            "Розрахункове питоме зчеплення c11 ґрунту нижче підошви фундаменту. Входить у формулу (Е.1) ДБН В.2.1-10 через коефіцієнт Mc; значення не повинно бути від'ємним.",
        },
        {
          id: "strengthSource",
          kind: "select",
          name: "Спосіб визначення φ11 і c11",
          defaultValue: "direct-testing",
          description:
            "Фіксує походження φ11 і c11 у звіті: безпосередні випробування або прийняття за таблицями В.1-В.2 ДБН В.2.1-10. Впливає на пояснювальний warning, але не змінює саму формулу.",
          options: [
            {
              value: "direct-testing",
              label: "Визначені безпосередніми випробуваннями",
            },
            {
              value: "appendix-b-tables",
              label: "Прийняті за таблицями В.1-В.2",
            },
          ],
        },
      ],
    },
    {
      id: "soil-resistance-geometry",
      title: "Геометрія фундаменту",
      fields: [
        {
          id: "foundationWidthM",
          kind: "number",
          prefix: { text: "b", ariaLabel: "b" },
          name: "Ширина підошви",
          defaultValue: "1",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Ширина підошви фундаменту b у метрах. Використовується у формулі (Е.1) ДБН В.2.1-10 та для коефіцієнта kz; значення має бути більше 0.",
        },
        {
          id: "foundationDepthM",
          kind: "number",
          prefix: { text: "d", ariaLabel: "d" },
          name: "Глибина закладання",
          defaultValue: "1.2",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Глибина закладання фундаменту d від планувальної поверхні до підошви. Використовується для перевірки примітки до додатка Е та має бути більше 0.",
        },
      ],
    },
    {
      id: "soil-resistance-basement",
      title: "Підвал і глибина закладання",
      fields: [
        {
          id: "hasBasement",
          kind: "checkbox",
          name: "Є підвал?",
          defaultValue: false,
          description:
            "Вмикає розрахунок приведеної глибини закладання за формулою (Е.2) ДБН В.2.1-10 для будівель із підвалом.",
        },
        {
          id: "embedmentDepthD1M",
          kind: "number",
          prefix: { text: "d", subscript: "1", ariaLabel: "d1" },
          name: "Приведена глибина закладання",
          defaultValue: "1.2",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Приведена глибина закладання d1 для формули (Е.1), коли підвалу немає. Значення задається користувачем у метрах і має бути більше 0.",
          showWhen: { fieldId: "hasBasement", equals: false },
        },
        {
          id: "basementDepthInputM",
          kind: "number",
          prefix: { text: "d", subscript: "b,input", ariaLabel: "db,input" },
          name: "Глибина підвалу",
          defaultValue: "0",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Глибина підвалу db,input від рівня планування до підлоги підвалу. Використовується для визначення d1 за формулою (Е.2) ДБН В.2.1-10.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
        {
          id: "soilLayerAboveFootingHsM",
          kind: "number",
          prefix: { text: "h", subscript: "s", ariaLabel: "hs" },
          name: "Шар ґрунту над підошвою",
          defaultValue: "0.4",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Товщина шару ґрунту hs над підошвою в межах підвалу. Разом із γ′11 входить у формулу (Е.2) для приведеної глибини d1.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
        {
          id: "basementFloorThicknessHcfM",
          kind: "number",
          prefix: { text: "h", subscript: "cf", ariaLabel: "hcf" },
          name: "Товщина підлоги підвалу",
          defaultValue: "0.2",
          min: 0,
          step: "0.01",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: SOIL_LENGTH_DISPLAY_UNITS,
          description:
            "Товщина підлоги підвалу hcf. Разом із питомою вагою γcf враховується у формулі (Е.2) ДБН В.2.1-10.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
        {
          id: "basementFloorUnitWeightGammaCfKnM3",
          kind: "number",
          prefix: { text: "γ", subscript: "cf", ariaLabel: "γcf" },
          name: "Питома вага підлоги підвалу",
          defaultValue: "22",
          min: 0,
          step: "0.01",
          baseUnit: "kn-m3",
          defaultDisplayUnit: "kn-m3",
          displayUnits: SOIL_UNIT_WEIGHT_DISPLAY_UNITS,
          description:
            "Питома вага конструкції підлоги підвалу γcf. Використовується у формулі (Е.2) для приведеної глибини d1; значення має бути більше 0.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
      ],
    },
  ],
};

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function RichText({ text }: { text: string }) {
  const linkPattern = new RegExp(
    NORM_LINKS.map((link) => link.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(linkPattern)) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const link = NORM_LINKS.find((item) => item.text === match[0]);
    if (link) {
      nodes.push(
        <a key={`${link.id}:${match.index}`} href={`#${link.id}`}>
          {link.text}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{nodes}</>;
}

function ReportStepFormulas({ step }: { step: SoilDesignResistanceReportStep }) {
  const formulas = [
    ...(step.formula ? [step.formula] : []),
    ...(step.formulas ?? []),
  ];

  if (formulas.length === 0) return null;

  return (
    <>
      {formulas.map((formula) => (
        <ReportFormula key={formula} formula={formula} className="soil-resistance-equation" />
      ))}
    </>
  );
}

function NormScan({ alt, src }: { alt: string; src: string }) {
  return (
    <figure className="soil-resistance-norm__scan">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}

export function SoilDesignResistanceCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(
    () => getDefaultInputSchemaValues(SOIL_INPUT_SCHEMA),
  );
  const calculationMode = String(
    inputValues.calculationMode ?? "manual-e7",
  ) as SoilCalculationMode;
  const structuralScheme = String(
    inputValues.structuralScheme ?? "rigid",
  ) as SoilStructuralScheme;
  const buildingLengthM = String(inputValues.buildingLengthM ?? "8.25");
  const buildingHeightM = String(inputValues.buildingHeightM ?? "3");
  const soilType = String(inputValues.soilType ?? "medium-sand") as SoilType;
  const liquidityIndex = String(inputValues.liquidityIndex ?? "0.3");
  const gammaC1Manual = String(inputValues.gammaC1Manual ?? "1");
  const gammaC2Manual = String(inputValues.gammaC2Manual ?? "1");
  const phi11Deg = String(inputValues.phi11Deg ?? "30");
  const gamma11KnM3 = String(inputValues.gamma11KnM3 ?? "17.1");
  const gammaPrime11KnM3 = String(inputValues.gammaPrime11KnM3 ?? "16.6");
  const c11KPa = String(inputValues.c11KPa ?? "4");
  const strengthSource = String(
    inputValues.strengthSource ?? "direct-testing",
  ) as SoilStrengthSource;
  const foundationWidthM = String(inputValues.foundationWidthM ?? "1");
  const foundationDepthM = String(inputValues.foundationDepthM ?? "1.2");
  const hasBasement = Boolean(inputValues.hasBasement);
  const embedmentDepthD1M = String(inputValues.embedmentDepthD1M ?? "1.2");
  const basementDepthInputM = String(inputValues.basementDepthInputM ?? "0");
  const soilLayerAboveFootingHsM = String(inputValues.soilLayerAboveFootingHsM ?? "0.4");
  const basementFloorThicknessHcfM = String(
    inputValues.basementFloorThicknessHcfM ?? "0.2",
  );
  const basementFloorUnitWeightGammaCfKnM3 = String(
    inputValues.basementFloorUnitWeightGammaCfKnM3 ?? "22",
  );

  const input = useMemo<SoilDesignResistanceInput>(
    () => ({
      calculationMode,
      structuralScheme,
      buildingLengthM: parseNumberInput(buildingLengthM),
      buildingHeightM: parseNumberInput(buildingHeightM),
      soilType,
      liquidityIndex: parseNumberInput(liquidityIndex),
      gammaC1Manual: parseNumberInput(gammaC1Manual),
      gammaC2Manual: parseNumberInput(gammaC2Manual),
      phi11Deg: parseNumberInput(phi11Deg),
      gamma11KnM3: parseNumberInput(gamma11KnM3),
      gammaPrime11KnM3: parseNumberInput(gammaPrime11KnM3),
      c11KPa: parseNumberInput(c11KPa),
      strengthSource,
      foundationWidthM: parseNumberInput(foundationWidthM),
      foundationDepthM: parseNumberInput(foundationDepthM),
      hasBasement,
      embedmentDepthD1M: parseNumberInput(embedmentDepthD1M),
      basementDepthInputM: parseNumberInput(basementDepthInputM),
      soilLayerAboveFootingHsM: parseNumberInput(soilLayerAboveFootingHsM),
      basementFloorThicknessHcfM: parseNumberInput(basementFloorThicknessHcfM),
      basementFloorUnitWeightGammaCfKnM3: parseNumberInput(
        basementFloorUnitWeightGammaCfKnM3,
      ),
    }),
    [
      basementDepthInputM,
      basementFloorThicknessHcfM,
      basementFloorUnitWeightGammaCfKnM3,
      buildingHeightM,
      buildingLengthM,
      c11KPa,
      calculationMode,
      embedmentDepthD1M,
      foundationDepthM,
      foundationWidthM,
      gamma11KnM3,
      gammaC1Manual,
      gammaC2Manual,
      gammaPrime11KnM3,
      hasBasement,
      liquidityIndex,
      phi11Deg,
      soilLayerAboveFootingHsM,
      soilType,
      strengthSource,
      structuralScheme,
    ],
  );

  const report = useMemo(() => getSoilDesignResistanceReport(input), [input]);
  const resultSummary =
    report.valid && report.values ? (
      <div className="soil-resistance-summary" aria-live="polite">
        <p>
          <MathNotation base="R" ariaLabel="R" /> ={" "}
          {formatSoilDesignResistanceNumber(
            report.values.soilDesignResistanceKPa,
            2,
          )}{" "}
          кПа ={" "}
          {formatSoilDesignResistanceNumber(
            report.values.soilDesignResistanceTonM2,
            1,
          )}{" "}
          т/м² ={" "}
          {formatSoilDesignResistanceNumber(
            report.values.soilDesignResistanceKgCm2,
            1,
          )}{" "}
          кг/см²
        </p>
      </div>
    ) : null;

  return (
    <div
      className="soil-resistance-calculator"
      aria-label="Калькулятор розрахункового опору ґрунту основи"
    >
      <div className="soil-resistance-input-shell">
        <aside className="soil-resistance-input-menu" aria-label="Меню вводу">
          <p className="soil-resistance-input-menu__label">Ввід</p>
          <nav className="soil-resistance-input-menu__links" aria-label="Розділи вводу">
            <a href="#soil-resistance-working">Умови</a>
            <a href="#soil-resistance-strength">Ґрунт</a>
            <a href="#soil-resistance-geometry">Геометрія</a>
            <a href="#soil-resistance-basement">Підвал</a>
            <a href="#soil-resistance-report-title">Звіт</a>
          </nav>
          {resultSummary}
        </aside>

        <div className="soil-resistance-controls">
          <InputSchemaForm
            schema={SOIL_INPUT_SCHEMA}
            values={inputValues}
            onValuesChange={setInputValues}
          />
        </div>
      </div>

      {report.errors.length > 0 ? (
        <div className="soil-resistance-errors" role="alert">
          <ul>
            {report.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.warnings.length > 0 ? (
        <div className="soil-resistance-warning" role="status">
          {report.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="soil-resistance-report" aria-labelledby="soil-resistance-report-title">
        <div className="soil-resistance-report__head">
          <h3 id="soil-resistance-report-title">Покроковий звіт</h3>
        </div>

        <ol className="soil-resistance-report__steps">
          {report.steps.map((step) => (
            <li key={step.key} className="soil-resistance-report__step">
              <p className="soil-resistance-report__caption">
                <RichText text={step.caption} />
              </p>
              {step.items ? (
                <ul className="soil-resistance-report__items">
                  {step.items.map((item) => (
                    <li key={item}>
                      <RichText text={item} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {step.notes ? (
                <div className="soil-resistance-report__notes">
                  {step.notes.map((note) => (
                    <p key={note}>
                      <RichText text={note} />
                    </p>
                  ))}
                </div>
              ) : null}
              <ReportStepFormulas step={step} />
            </li>
          ))}
        </ol>
      </section>

      <section className="soil-resistance-norms" aria-labelledby="soil-resistance-norms-title">
        <div className="soil-resistance-report__head">
          <h3 id="soil-resistance-norms-title">Нормативні посилання</h3>
        </div>
        <div className="soil-resistance-norms__list">
          <article id="soil-norm-e4" className="soil-resistance-norm">
            <h4>п. Е.4 ДБН В.2.1-10-2009</h4>
            <p>Основний пункт для визначення розрахункового опору R за додатком Е.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-e4-e1.png"
              alt="Скан п. Е.4 і формули Е.1 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-e1" className="soil-resistance-norm">
            <h4>формула (Е.1)</h4>
            <p>Формула визначення розрахункового опору ґрунту основи R.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-e4-e1.png"
              alt="Скан формули Е.1 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-e2" className="soil-resistance-norm">
            <h4>формула (Е.2)</h4>
            <p>Формула приведеної глибини закладання d1 для споруди з підвалом.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-e2.png"
              alt="Скан формули Е.2 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-table-e7" className="soil-resistance-norm">
            <h4>табл. Е.7</h4>
            <p>Коефіцієнти умов роботи γc1 і γc2 для різних ґрунтів та схем споруд.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-table-e7.png"
              alt="Скан табл. Е.7 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-table-e7-note-1" className="soil-resistance-norm">
            <h4>примітка 1 до табл. Е.7</h4>
            <p>Ознака жорсткої конструктивної схеми споруди для прийняття γc2.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-table-e7-note-1.png"
              alt="Скан примітки 1 до табл. Е.7 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-table-e8" className="soil-resistance-norm">
            <h4>табл. Е.8</h4>
            <p>Коефіцієнти Mγ, Mq і Mc залежно від φ11.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-table-e8.png"
              alt="Скан табл. Е.8 з ДБН В.2.1-10-2009"
            />
          </article>
        </div>
      </section>
    </div>
  );
}
