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

import { MathNotation } from "./math-notation";

const SOIL_TYPES = Object.keys(SOIL_TYPE_LABELS) as SoilType[];

const SYMBOLS = {
  "γc1": { base: "γ", subscript: "c1", ariaLabel: "γc1" },
  "γc2": { base: "γ", subscript: "c2", ariaLabel: "γc2" },
  "γ11": { base: "γ", subscript: "11", ariaLabel: "γ11" },
  "γ′11": { base: "γ′", subscript: "11", ariaLabel: "γ′11" },
  "γcf": { base: "γ", subscript: "cf", ariaLabel: "γcf" },
  "Mγ": { base: "M", subscript: "γ", ariaLabel: "Mγ" },
  "Mq": { base: "M", subscript: "q", ariaLabel: "Mq" },
  "Mc": { base: "M", subscript: "c", ariaLabel: "Mc" },
  "φ11": { base: "φ", subscript: "11", ariaLabel: "φ11" },
  "c11": { base: "c", subscript: "11", ariaLabel: "c11" },
  "kz": { base: "k", subscript: "z", ariaLabel: "kz" },
  "z0": { base: "z", subscript: "0", ariaLabel: "z0" },
  "db,input": { base: "d", subscript: "b,input", ariaLabel: "db,input" },
  "db": { base: "d", subscript: "b", ariaLabel: "db" },
  "d1": { base: "d", subscript: "1", ariaLabel: "d1" },
  "hs": { base: "h", subscript: "s", ariaLabel: "hs" },
  "hcf": { base: "h", subscript: "cf", ariaLabel: "hcf" },
  "IL": { base: "I", subscript: "L", ariaLabel: "IL" },
  "L/H": { base: "L/H", ariaLabel: "L/H" },
  R: { base: "R", ariaLabel: "R" },
  L: { base: "L", ariaLabel: "L" },
  H: { base: "H", ariaLabel: "H" },
  b: { base: "b", ariaLabel: "b" },
  d: { base: "d", ariaLabel: "d" },
  k: { base: "k", ariaLabel: "k" },
} as const;

const SYMBOL_PATTERN = new RegExp(
  Object.keys(SYMBOLS)
    .sort((left, right) => right.length - left.length)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

const NORM_LINKS = [
  { text: "формула (Е.1)", id: "soil-norm-e1" },
  { text: "формулою (Е.2)", id: "soil-norm-e2" },
  { text: "табл. Е.7", id: "soil-norm-table-e7" },
  { text: "табл. Е.8", id: "soil-norm-table-e8" },
  { text: "п. Е.4", id: "soil-norm-e4" },
  { text: "приміткою 1", id: "soil-norm-table-e7-note-1" },
] as const;

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function isFormulaBoundary(value: string | undefined): boolean {
  return !value || !/[A-Za-zА-Яа-яІіЇїЄєҐґ0-9_,.′]/.test(value);
}

function renderFormulaText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SYMBOL_PATTERN)) {
    if (match.index === undefined) continue;

    if (
      !isFormulaBoundary(text[match.index - 1]) ||
      !isFormulaBoundary(text[match.index + match[0].length])
    ) {
      continue;
    }

    if (match.index > lastIndex) {
      nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const symbol = SYMBOLS[match[0] as keyof typeof SYMBOLS];
    nodes.push(
      <MathNotation
        key={`${match[0]}:${match.index}`}
        base={symbol.base}
        subscript={"subscript" in symbol ? symbol.subscript : undefined}
        ariaLabel={symbol.ariaLabel}
      />,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes;
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
      nodes.push(
        <span key={`text:${lastIndex}`}>
          {renderFormulaText(text.slice(lastIndex, match.index))}
        </span>,
      );
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
    nodes.push(<span key={`text:${lastIndex}`}>{renderFormulaText(text.slice(lastIndex))}</span>);
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
        <div key={formula} className="soil-resistance-equation" aria-label={formula} title={formula}>
          <RichText text={formula} />
        </div>
      ))}
    </>
  );
}

function NumberField({
  label,
  value,
  onChange,
  description,
  step = "0.01",
  min,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  step?: string;
  min?: string;
}) {
  const plainLabel =
    typeof label === "string" ? label : undefined;

  return (
    <label className="soil-resistance-field soil-resistance-field--number">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={plainLabel}
      />
      {description ? (
        <span className="soil-resistance-field__description">{description}</span>
      ) : null}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  children,
  wide = false,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={
        wide ? "soil-resistance-field soil-resistance-field--wide" : "soil-resistance-field"
      }
    >
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        aria-label={label}
      >
        {children}
      </select>
    </label>
  );
}

function FieldLabel({
  symbol,
  unit,
}: {
  symbol: keyof typeof SYMBOLS;
  unit?: string;
}) {
  const notation = SYMBOLS[symbol];

  return (
    <>
      <MathNotation
        base={notation.base}
        subscript={"subscript" in notation ? notation.subscript : undefined}
        ariaLabel={notation.ariaLabel}
      />
      {unit ? <span className="math-notation__unit">, {unit}</span> : null}
    </>
  );
}

function usesLiquidityIndex(soilType: SoilType): boolean {
  return soilType === "coarse-with-clayey-fill" || soilType === "clayey-soil";
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
  const [calculationMode, setCalculationMode] =
    useState<SoilCalculationMode>("manual-e7");
  const [structuralScheme, setStructuralScheme] =
    useState<SoilStructuralScheme>("rigid");
  const [buildingLengthM, setBuildingLengthM] = useState("8.25");
  const [buildingHeightM, setBuildingHeightM] = useState("3");
  const [soilType, setSoilType] = useState<SoilType>("medium-sand");
  const [liquidityIndex, setLiquidityIndex] = useState("0.3");
  const [gammaC1Manual, setGammaC1Manual] = useState("1");
  const [gammaC2Manual, setGammaC2Manual] = useState("1");
  const [phi11Deg, setPhi11Deg] = useState("30");
  const [gamma11KnM3, setGamma11KnM3] = useState("17.1");
  const [gammaPrime11KnM3, setGammaPrime11KnM3] = useState("16.6");
  const [c11KPa, setC11KPa] = useState("4");
  const [strengthSource, setStrengthSource] =
    useState<SoilStrengthSource>("direct-testing");
  const [foundationWidthM, setFoundationWidthM] = useState("1");
  const [foundationDepthM, setFoundationDepthM] = useState("1.2");
  const [hasBasement, setHasBasement] = useState(false);
  const [embedmentDepthD1M, setEmbedmentDepthD1M] = useState("1.2");
  const [basementDepthInputM, setBasementDepthInputM] = useState("0");
  const [soilLayerAboveFootingHsM, setSoilLayerAboveFootingHsM] = useState("0.4");
  const [basementFloorThicknessHcfM, setBasementFloorThicknessHcfM] = useState("0.2");
  const [basementFloorUnitWeightGammaCfKnM3, setBasementFloorUnitWeightGammaCfKnM3] =
    useState("22");

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
        <fieldset id="soil-resistance-working" className="soil-resistance-group">
          <legend>Умови роботи</legend>
          <SelectField<SoilCalculationMode>
            label="Спосіб розрахунку"
            value={calculationMode}
            onChange={setCalculationMode}
            wide
          >
            <option value="automatic">Автоматично за характеристиками ґрунту</option>
            <option value="manual-e7">Вручну за табл. Е.7</option>
          </SelectField>

          {calculationMode === "manual-e7" ? (
            <>
              <NumberField
                label={<FieldLabel symbol="γc1" />}
                value={gammaC1Manual}
                onChange={setGammaC1Manual}
                min="0"
              />
              <NumberField
                label={<FieldLabel symbol="γc2" />}
                value={gammaC2Manual}
                onChange={setGammaC2Manual}
                min="0"
              />
            </>
          ) : (
            <>
              <SelectField<SoilStructuralScheme>
                label="Конструктивна схема споруди"
                value={structuralScheme}
                onChange={setStructuralScheme}
              >
                <option value="rigid">Жорстка</option>
                <option value="flexible">Гнучка</option>
              </SelectField>
              <NumberField
                label="L, м"
                value={buildingLengthM}
                onChange={setBuildingLengthM}
                min="0"
                description="Довжина споруди або її відсіку для визначення L/H."
              />
              <NumberField
                label="H, м"
                value={buildingHeightM}
                onChange={setBuildingHeightM}
                min="0"
                description="Висота споруди або її відсіку для визначення L/H."
              />
              <label className="soil-resistance-field soil-resistance-field--wide">
                <span>Тип ґрунту</span>
                <select
                  value={soilType}
                  onChange={(event) => setSoilType(event.target.value as SoilType)}
                  aria-label="Тип ґрунту"
                >
                  {SOIL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SOIL_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
              {usesLiquidityIndex(soilType) ? (
                <NumberField
                  label={<FieldLabel symbol="IL" />}
                  value={liquidityIndex}
                  onChange={setLiquidityIndex}
                  step="0.01"
                />
              ) : null}
              <p className="soil-resistance-group__help">
                Конструктивна схема споруди приймається згідно з{" "}
                <a href="#soil-norm-table-e7-note-1">приміткою 1</a> до табл. Е.7.
              </p>
            </>
          )}
        </fieldset>

        <fieldset id="soil-resistance-strength" className="soil-resistance-group">
          <legend>Характеристики ґрунту</legend>
          <NumberField
            label={<FieldLabel symbol="φ11" unit="°" />}
            value={phi11Deg}
            onChange={setPhi11Deg}
            min="0"
          />
          <NumberField
            label={<FieldLabel symbol="γ11" unit="кН/м³" />}
            value={gamma11KnM3}
            onChange={setGamma11KnM3}
            min="0"
          />
          <NumberField
            label={<FieldLabel symbol="γ′11" unit="кН/м³" />}
            value={gammaPrime11KnM3}
            onChange={setGammaPrime11KnM3}
            min="0"
          />
          <NumberField
            label={<FieldLabel symbol="c11" unit="кПа" />}
            value={c11KPa}
            onChange={setC11KPa}
            min="0"
          />
          <SelectField<SoilStrengthSource>
            label="Спосіб визначення φ11 і c11"
            value={strengthSource}
            onChange={setStrengthSource}
            wide
          >
            <option value="direct-testing">Визначені безпосередніми випробуваннями</option>
            <option value="appendix-b-tables">Прийняті за таблицями В.1-В.2</option>
          </SelectField>
        </fieldset>

        <fieldset id="soil-resistance-geometry" className="soil-resistance-group">
          <legend>Геометрія фундаменту</legend>
          <NumberField
            label={<FieldLabel symbol="b" unit="м" />}
            value={foundationWidthM}
            onChange={setFoundationWidthM}
            min="0"
          />
          <NumberField
            label={<FieldLabel symbol="d" unit="м" />}
            value={foundationDepthM}
            onChange={setFoundationDepthM}
            min="0"
          />
        </fieldset>

        <fieldset id="soil-resistance-basement" className="soil-resistance-group">
          <legend>Підвал і глибина закладання</legend>
          <label className="soil-resistance-toggle">
            <input
              type="checkbox"
              checked={hasBasement}
              onChange={(event) => setHasBasement(event.target.checked)}
            />
            <span>Є підвал</span>
          </label>

          {hasBasement ? (
            <>
              <NumberField
                label={<FieldLabel symbol="db,input" unit="м" />}
                value={basementDepthInputM}
                onChange={setBasementDepthInputM}
                min="0"
              />
              <NumberField
                label={<FieldLabel symbol="hs" unit="м" />}
                value={soilLayerAboveFootingHsM}
                onChange={setSoilLayerAboveFootingHsM}
                min="0"
              />
              <NumberField
                label={<FieldLabel symbol="hcf" unit="м" />}
                value={basementFloorThicknessHcfM}
                onChange={setBasementFloorThicknessHcfM}
                min="0"
              />
              <NumberField
                label={<FieldLabel symbol="γcf" unit="кН/м³" />}
                value={basementFloorUnitWeightGammaCfKnM3}
                onChange={setBasementFloorUnitWeightGammaCfKnM3}
                min="0"
              />
            </>
          ) : (
            <NumberField
              label={<FieldLabel symbol="d1" unit="м" />}
              value={embedmentDepthD1M}
              onChange={setEmbedmentDepthD1M}
              min="0"
            />
          )}
        </fieldset>
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
