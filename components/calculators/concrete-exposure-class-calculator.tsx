"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
  getConcreteExposureClassReport,
  getConcreteExposureClassReturnUrl,
  type CarbonationMoistureCondition,
  type ChemicalAttackRisk,
  type ChlorideMoistureCondition,
  type ChlorideSource,
  type ConcreteExposureClassInput,
  type ConcreteExposureElementType,
  type CoverExposureClass,
  type ExposureClass,
  type FreezeThawRisk,
  type ReinforcementPresence,
} from "@/lib/concrete-exposure-class";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm } from "./input-schema-form";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";

type ReturnParams = {
  returnTo?: string;
  returnField?: string;
  returnLabel?: string;
};

export const CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "concrete-exposure-element",
      title: "Елемент",
      fields: [
        {
          id: "elementName",
          kind: "text",
          name: "Назва елемента",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.elementName,
          description: "Назва елемента для звіту та передачі між калькуляторами.",
        },
        {
          id: "elementType",
          kind: "select",
          name: "Тип елемента",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.elementType,
          options: [
            { value: "slab", label: "Плита" },
            { value: "beam", label: "Балка" },
            { value: "column", label: "Колона" },
            { value: "wall", label: "Стіна" },
            { value: "foundation", label: "Фундамент" },
            { value: "retaining_wall", label: "Підпірна стіна" },
            { value: "tank", label: "Резервуар" },
            { value: "other", label: "Інший елемент" },
          ],
        },
      ],
    },
    {
      id: "concrete-exposure-corrosion",
      title: "Корозія арматури",
      fields: [
        {
          id: "reinforcementPresence",
          kind: "select",
          name: "Армування або металеві закладні",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.reinforcementPresence,
          options: [
            {
              value: "reinforced_or_embedded_metal",
              label: "Залізобетон або бетон з металевими закладними",
            },
            {
              value: "plain_concrete_without_metal",
              label: "Бетон без арматури і металевих закладних",
            },
          ],
        },
        {
          id: "carbonationMoistureCondition",
          kind: "select",
          name: "Вологісний режим для карбонізації",
          defaultValue:
            DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.carbonationMoistureCondition,
          options: [
            { value: "dry_or_permanently_wet", label: "Сухо або постійно мокро" },
            { value: "wet_rarely_dry", label: "Волого, рідко сухо" },
            {
              value: "moderate_or_high_humidity",
              label: "Помірна або висока вологість",
            },
            {
              value: "cyclic_wet_dry",
              label: "Циклічне зволоження і висихання",
            },
          ],
        },
      ],
    },
    {
      id: "concrete-exposure-chlorides",
      title: "Хлориди",
      fields: [
        {
          id: "chlorideSource",
          kind: "select",
          name: "Джерело хлоридів",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chlorideSource,
          options: [
            { value: "none", label: "Немає" },
            { value: "deicing_salts", label: "Протиожеледні солі" },
            { value: "airborne_sea_salts", label: "Морські солі в повітрі" },
            { value: "sea_water", label: "Морська вода" },
          ],
        },
        {
          id: "chlorideMoistureCondition",
          kind: "select",
          name: "Вологісний режим для хлоридів",
          defaultValue:
            DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chlorideMoistureCondition,
          showWhen: { fieldId: "chlorideSource", notEquals: "none" },
          options: [
            { value: "moderate_humidity", label: "Помірна вологість" },
            { value: "wet_rarely_dry", label: "Волого, рідко сухо" },
            { value: "permanently_submerged", label: "Постійне занурення" },
            {
              value: "cyclic_wet_dry",
              label: "Циклічне зволоження і висихання",
            },
            { value: "splash_or_spray", label: "Бризки або розпилення" },
          ],
        },
      ],
    },
    {
      id: "concrete-exposure-freeze-chemical",
      title: "Мороз і хімічна агресія",
      fields: [
        {
          id: "freezeThawRisk",
          kind: "select",
          name: "Морозний вплив",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.freezeThawRisk,
          options: [
            { value: "none", label: "Немає" },
            {
              value: "moderate_water_saturation_without_deicing",
              label: "Помірне водонасичення без солей",
            },
            {
              value: "moderate_water_saturation_with_deicing",
              label: "Помірне водонасичення з солями",
            },
            {
              value: "high_water_saturation_without_deicing",
              label: "Високе водонасичення без солей",
            },
            {
              value: "high_water_saturation_with_deicing_or_sea_water",
              label: "Високе водонасичення з солями або морською водою",
            },
          ],
        },
        {
          id: "chemicalAttackRisk",
          kind: "select",
          name: "Хімічна агресія",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chemicalAttackRisk,
          options: [
            { value: "none", label: "Немає ознак хімічної агресії" },
            { value: "XA1", label: "XA1 — слабка хімічна агресія" },
            { value: "XA2", label: "XA2 — помірна хімічна агресія" },
            { value: "XA3", label: "XA3 — сильна хімічна агресія" },
            {
              value: "unknown_requires_analysis",
              label: "Невідомо — потрібен аналіз ґрунту або води",
            },
          ],
        },
        {
          id: "hasSoilOrGroundwaterAnalysis",
          kind: "checkbox",
          name: "Є аналіз ґрунту або води",
          defaultValue:
            DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.hasSoilOrGroundwaterAnalysis,
          showWhen: { fieldId: "chemicalAttackRisk", notEquals: "none" },
        },
      ],
    },
  ],
};

function isCoverExposureClass(value: string | null): value is CoverExposureClass {
  return [
    "X0",
    "XC1",
    "XC2",
    "XC3",
    "XC4",
    "XD1",
    "XD2",
    "XD3",
    "XS1",
    "XS2",
    "XS3",
  ].includes(value ?? "");
}

function getSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function getReturnParams(): ReturnParams {
  const returnTo = getSearchParam("returnTo");
  const returnField = getSearchParam("returnField");
  const returnLabel = getSearchParam("returnLabel");

  return {
    ...(returnTo?.startsWith("/calculator/") ? { returnTo } : {}),
    ...(returnField ? { returnField } : {}),
    ...(returnLabel ? { returnLabel } : {}),
  };
}

export function getConcreteExposureClassInitialValues(): CalculatorInputValues {
  const values = getDefaultInputSchemaValues(
    CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA,
  );
  const elementName = getSearchParam("elementName");
  const elementType = getSearchParam("elementType");
  const reinforcementPresence = getSearchParam("reinforcementPresence");
  const currentExposureClass = getSearchParam("currentExposureClass");

  if (elementName) values.elementName = elementName;
  if (
    [
      "slab",
      "beam",
      "column",
      "wall",
      "foundation",
      "retaining_wall",
      "tank",
      "other",
    ].includes(elementType ?? "")
  ) {
    values.elementType = elementType as ConcreteExposureElementType;
  }
  if (
    [
      "reinforced_or_embedded_metal",
      "plain_concrete_without_metal",
    ].includes(reinforcementPresence ?? "")
  ) {
    values.reinforcementPresence = reinforcementPresence as ReinforcementPresence;
  }
  if (isCoverExposureClass(currentExposureClass)) {
    values.currentExposureClass = currentExposureClass;
  }

  return values;
}

function getStringValue(
  values: CalculatorInputValues,
  key: string,
  fallback: string,
): string {
  const value = values[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function inputFromValues(values: CalculatorInputValues): ConcreteExposureClassInput {
  return {
    elementName: getStringValue(
      values,
      "elementName",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.elementName,
    ),
    elementType: getStringValue(
      values,
      "elementType",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.elementType,
    ) as ConcreteExposureElementType,
    reinforcementPresence: getStringValue(
      values,
      "reinforcementPresence",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.reinforcementPresence,
    ) as ReinforcementPresence,
    carbonationMoistureCondition: getStringValue(
      values,
      "carbonationMoistureCondition",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.carbonationMoistureCondition,
    ) as CarbonationMoistureCondition,
    chlorideSource: getStringValue(
      values,
      "chlorideSource",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chlorideSource,
    ) as ChlorideSource,
    chlorideMoistureCondition: getStringValue(
      values,
      "chlorideMoistureCondition",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chlorideMoistureCondition,
    ) as ChlorideMoistureCondition,
    freezeThawRisk: getStringValue(
      values,
      "freezeThawRisk",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.freezeThawRisk,
    ) as FreezeThawRisk,
    chemicalAttackRisk: getStringValue(
      values,
      "chemicalAttackRisk",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chemicalAttackRisk,
    ) as ChemicalAttackRisk,
    hasSoilOrGroundwaterAnalysis:
      values.hasSoilOrGroundwaterAnalysis === true,
    ...(isCoverExposureClass(String(values.currentExposureClass ?? ""))
      ? { currentExposureClass: values.currentExposureClass as CoverExposureClass }
      : {}),
  };
}

function getClassesSummary(classes: ExposureClass[]): string {
  return classes.join(", ");
}

function ConcreteExposureClassSummary({
  report,
  returnParams,
}: {
  report: ReturnType<typeof getConcreteExposureClassReport>;
  returnParams: ReturnParams;
}) {
  if (!report.values) return null;

  const classesText = getClassesSummary(report.values.exposureClasses);
  const returnHref = getConcreteExposureClassReturnUrl({
    returnTo: returnParams.returnTo,
    returnField: returnParams.returnField,
    governingCoverExposureClass: report.values.governingCoverExposureClass,
    exposureClasses: report.values.exposureClasses,
  });
  const hasReturnTarget = Boolean(returnParams.returnTo);
  const linkText = hasReturnTarget
    ? `Повернути клас ${report.values.governingCoverExposureClass} у розрахунок захисного шару`
    : "Використати в розрахунку захисного шару";

  return (
    <div className="concrete-exposure-class-summary" aria-live="polite">
      <p>Повний набір класів: {classesText}</p>
      <p>
        Для розрахунку захисного шару прийнято:{" "}
        {report.values.governingCoverExposureClass}
      </p>
      <div className="concrete-exposure-class-actions">
        <Link className="cta-button cta-button--ghost" href={returnHref}>
          {linkText}
        </Link>
      </div>
    </div>
  );
}

export function ConcreteExposureClassCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(() =>
    getConcreteExposureClassInitialValues(),
  );
  const returnParams = useMemo(() => getReturnParams(), []);
  const input = useMemo(() => inputFromValues(inputValues), [inputValues]);
  const report = useMemo(() => getConcreteExposureClassReport(input), [input]);
  const summary = (
    <ConcreteExposureClassSummary report={report} returnParams={returnParams} />
  );

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор класу впливу середовища для бетону"
      navLinks={[
        { href: "#concrete-exposure-element", label: "Елемент" },
        { href: "#concrete-exposure-corrosion", label: "Корозія" },
        { href: "#concrete-exposure-chlorides", label: "Хлориди" },
        { href: "#concrete-exposure-freeze-chemical", label: "Мороз / XA" },
        { href: "#concrete-exposure-class-report-title", label: "Звіт" },
      ]}
      summary={summary}
      controls={
        <InputSchemaForm
          schema={CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA}
          values={inputValues}
          onValuesChange={setInputValues}
        />
      }
      errors={report.errors}
      warnings={report.warnings}
    >
      <NativeReport
        titleId="concrete-exposure-class-report-title"
        title="Покроковий звіт"
        steps={report.steps}
      />
    </NativeCalculatorLayout>
  );
}
