"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
  getConcreteExposureClassReport,
  getConcreteExposureClassReturnUrl,
  type CarbonationExposureRow,
  type ConcreteExposureClassInput,
  type ConcreteExposureElementType,
  type CoverExposureClass,
  type ExposureClass,
  type ReinforcementPresence,
  type XaExposureRow,
  type XdExposureRow,
  type XfExposureRow,
  type XsExposureRow,
} from "@/lib/concrete-exposure-class";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm } from "./input-schema-form";
import {
  buildNativeDocxReport,
  formatDocxFileDate,
} from "./native-report-docx";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport, type NativeReportStep } from "./native-report";
import { ReportDocxButton } from "./report-docx-button";

type ReturnParams = {
  returnTo?: string;
  returnField?: string;
  returnLabel?: string;
};

export function buildConcreteExposureClassDocxReport({
  date = new Date(),
  steps,
}: {
  date?: Date;
  steps: NativeReportStep[];
}) {
  return buildNativeDocxReport({
    title: "Покроковий звіт",
    fileBaseName: `klas-vplyvu-seredovyshcha-${formatDocxFileDate(date)}`,
    steps,
  });
}

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
          description:
            "Службова назва для звіту та передачі між калькуляторами; не використовується для вибору рядка таблиць ДБН.",
        },
        {
          id: "elementType",
          kind: "select",
          name: "Тип елемента",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.elementType,
          description:
            "Тип елемента потрібен для аудиту прийнятої схеми та передачі між калькуляторами; сам по собі не визначає рядок таблиці 4.1 ДБН В.2.6-98:2009.",
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
      id: "concrete-exposure-x0-xc",
      title: "X0/XC за таблицею 4.1",
      fields: [
        {
          id: "reinforcementPresence",
          kind: "select",
          name: "Армування або металеві закладні",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.reinforcementPresence,
          description:
            "Наявність арматури визначає, чи можна прийняти X0 для бетону без металу або потрібно визначати XC для захисту арматури; використовуються рядки X0, XC1-XC4 табл. 4.1 ДБН В.2.6-98:2009.",
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
          id: "carbonationExposureRow",
          kind: "select",
          name: "Рядок X0/XC таблиці 4.1",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.carbonationExposureRow,
          description:
            "Формальний вибір рядка ДБН В.2.6-98:2009, таблиця 4.1, рядки X0, XC1-XC4. Використовуйте наведені в ДБН повітряно-вологісні режими та межі RH.",
          options: [
            {
              value: "X0",
              label:
                "X0 — дуже сухий повітряно-вологісний режим (RH <= 30 %)",
            },
            {
              value: "XC1",
              label:
                "XC1 — сухий режим (30 % < RH <= 60 %) або постійно вологонасичений стан",
            },
            {
              value: "XC2",
              label:
                "XC2 — водонасичений стан при епізодичному висушуванні",
            },
            {
              value: "XC3",
              label:
                "XC3 — помірний режим (60 % < RH <= 75 %) або епізодичне вологонасичення",
            },
            {
              value: "XC4",
              label: "XC4 — поперемінне зволоження та висушування",
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
          id: "xdExposureRow",
          kind: "select",
          name: "Рядок XD таблиці 4.1",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xdExposureRow,
          description:
            "Формальний вибір рядка ДБН В.2.6-98:2009, таблиця 4.1, рядки XD1-XD3 для хлоридів не з морської води.",
          options: [
            { value: "none", label: "Не застосовується" },
            {
              value: "XD1",
              label:
                "XD1 — вологий повітряно-вологісний стан (RH > 75 %)",
            },
            { value: "XD2", label: "XD2 — водонасичений стан" },
            {
              value: "XD3",
              label: "XD3 — поперемінне зволоження і висушування",
            },
          ],
        },
        {
          id: "xsExposureRow",
          kind: "select",
          name: "Клас XS за ДСТУ ENV/EN 206",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xsExposureRow,
          description:
            "Окремий вибір класів XS1-XS3 за ДСТУ ENV/EN 206. У наданому PDF ДБН В.2.6-98:2009 класи XS1-XS3 не наведені як рядки таблиці 4.1, але таблиці 4.3 і 4.4 враховують XD/XS разом.",
          options: [
            { value: "none", label: "Не застосовується" },
            {
              value: "XS1",
              label:
                "XS1 — повітря з морськими солями без прямого контакту з морською водою",
            },
            { value: "XS2", label: "XS2 — постійне занурення у морську воду" },
            {
              value: "XS3",
              label: "XS3 — зона припливу, бризок або розпилення",
            },
          ],
        },
      ],
    },
    {
      id: "concrete-exposure-freeze-chemical",
      title: "XF та XA за таблицею 4.1",
      fields: [
        {
          id: "xfExposureRow",
          kind: "select",
          name: "Рядок XF таблиці 4.1",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xfExposureRow,
          description:
            "Формальний вибір рядка ДБН В.2.6-98:2009, таблиця 4.1, рядки XF1-XF4 для поперемінного заморожування-відтавання.",
          options: [
            { value: "none", label: "Не застосовується" },
            {
              value: "XF1",
              label:
                "XF1 — епізодичне водонасичення без антиобморожувачів",
            },
            {
              value: "XF2",
              label:
                "XF2 — епізодичне водонасичення з антиобморожувачами",
            },
            {
              value: "XF3",
              label: "XF3 — водонасичений стан без антиобморожувачів",
            },
            {
              value: "XF4",
              label: "XF4 — водонасичений стан з антиобморожувачами",
            },
          ],
        },
        {
          id: "xaExposureRow",
          kind: "select",
          name: "Рядок XA таблиці 4.1",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xaExposureRow,
          description:
            "Формальний вибір рядка ДБН В.2.6-98:2009, таблиця 4.1, рядки XA1-XA3. Класифікацію агресивності середовища потрібно підтвердити за ДСТУ Б В.2.6-145.",
          options: [
            { value: "none", label: "Не застосовується" },
            { value: "XA1", label: "XA1 — слабоагресивне середовище" },
            { value: "XA2", label: "XA2 — середньоагресивне середовище" },
            { value: "XA3", label: "XA3 — сильноагресивне середовище" },
            {
              value: "unknown_requires_classification",
              label:
                "Невідомо — потрібна класифікація за ДСТУ Б В.2.6-145",
            },
          ],
        },
        {
          id: "hasChemicalAggressivenessConfirmation",
          kind: "checkbox",
          name: "Класифікацію агресивності підтверджено за ДСТУ Б В.2.6-145",
          defaultValue:
            DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.hasChemicalAggressivenessConfirmation,
          description:
            "Підтверджує, що вибір XA1-XA3 або потребу в XA-класифікації звірено з ДСТУ Б В.2.6-145.",
          showWhen: { fieldId: "xaExposureRow", notEquals: "none" },
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
    carbonationExposureRow: getStringValue(
      values,
      "carbonationExposureRow",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.carbonationExposureRow,
    ) as CarbonationExposureRow,
    xdExposureRow: getStringValue(
      values,
      "xdExposureRow",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xdExposureRow,
    ) as XdExposureRow,
    xsExposureRow: getStringValue(
      values,
      "xsExposureRow",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xsExposureRow,
    ) as XsExposureRow,
    xfExposureRow: getStringValue(
      values,
      "xfExposureRow",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xfExposureRow,
    ) as XfExposureRow,
    xaExposureRow: getStringValue(
      values,
      "xaExposureRow",
      DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.xaExposureRow,
    ) as XaExposureRow,
    hasChemicalAggressivenessConfirmation:
      values.hasChemicalAggressivenessConfirmation === true,
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

function ConcreteExposureClassNorms() {
  return (
    <section className="native-report concrete-exposure-class-norms" aria-labelledby="concrete-exposure-class-norms-title">
      <div className="native-report__head">
        <h3 id="concrete-exposure-class-norms-title">Нормативні посилання</h3>
      </div>
      <div className="native-report__items">
        <article id="concrete-exposure-norm-table-4-1">
          <h4>таблиця 4.1 ДБН В.2.6-98:2009</h4>
          <p>Рядки X0, XC1-XC4, XD1-XD3, XF1-XF4 та XA1-XA3 для визначення класів впливу середовища.</p>
        </article>
        <article id="concrete-exposure-norm-xs">
          <h4>ДСТУ ENV/EN 206</h4>
          <p>Класи XS1-XS3 для хлоридів морського походження; у ДБН таблиці 4.3 і 4.4 вони враховані разом із XD.</p>
        </article>
        <article id="concrete-exposure-norm-dstu-145">
          <h4>ДСТУ Б В.2.6-145</h4>
          <p>Класифікація агресивності середовища для підтвердження класів XA1-XA3.</p>
        </article>
      </div>
    </section>
  );
}

export function ConcreteExposureClassCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(() =>
    getConcreteExposureClassInitialValues(),
  );
  const returnParams = useMemo(() => getReturnParams(), []);
  const input = useMemo(() => inputFromValues(inputValues), [inputValues]);
  const report = useMemo(() => getConcreteExposureClassReport(input), [input]);
  const docxReport = useMemo(
    () => buildConcreteExposureClassDocxReport({ steps: report.steps }),
    [report.steps],
  );
  const summary = (
    <ConcreteExposureClassSummary report={report} returnParams={returnParams} />
  );

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор класу впливу середовища для бетону"
      navLinks={[
        { href: "#concrete-exposure-element", label: "Елемент" },
        { href: "#concrete-exposure-x0-xc", label: "X0/XC" },
        { href: "#concrete-exposure-chlorides", label: "Хлориди" },
        { href: "#concrete-exposure-freeze-chemical", label: "XF / XA" },
        { href: "#concrete-exposure-class-report-title", label: "Звіт" },
        { href: "#concrete-exposure-class-norms-title", label: "Норми" },
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
        actions={<ReportDocxButton report={docxReport} />}
      />
      <ConcreteExposureClassNorms />
    </NativeCalculatorLayout>
  );
}
