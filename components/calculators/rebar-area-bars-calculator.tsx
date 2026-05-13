"use client";

import { useMemo, useState } from "react";

import {
  REBAR_AREA_UNITS,
  REBAR_DIAMETERS,
  clampRebarCount,
  clampRebarSpacing,
  convertAreaToSquareMillimeters,
  formatRebarArea,
  formatRebarUtilization,
  getRebarAreaPerMeterSquareMillimeters,
  getRebarAreaSquareMillimeters,
  getRebarBarCounts,
  getRebarCombinationKey,
  getRebarSelection,
  getRebarSpacingColumns,
  getRebarSpacingCombinationKey,
  getRebarSpacingSelection,
  type RebarAreaUnit,
} from "@/lib/rebar-area-bars";

import { MathNotation } from "./math-notation";

const UNIT_OPTIONS = Object.entries(REBAR_AREA_UNITS) as Array<
  [RebarAreaUnit, (typeof REBAR_AREA_UNITS)[RebarAreaUnit]]
>;

export function RebarAreaBarsCalculator() {
  const [minimumAreaInput, setMinimumAreaInput] = useState("5");
  const [unit, setUnit] = useState<RebarAreaUnit>("cm2");
  const [customCountInput, setCustomCountInput] = useState("10");
  const [customSpacingInput, setCustomSpacingInput] = useState("400");

  const minimumArea = Number.parseFloat(minimumAreaInput.replace(",", "."));
  const customCount = clampRebarCount(Number.parseFloat(customCountInput));
  const customSpacing = clampRebarSpacing(Number.parseFloat(customSpacingInput));
  const requiredAreaSquareMillimeters =
    Number.isFinite(minimumArea) && minimumArea > 0
      ? convertAreaToSquareMillimeters(minimumArea, unit)
      : 0;

  const barCounts = useMemo(() => getRebarBarCounts(customCount), [customCount]);
  const spacingColumns = useMemo(
    () => getRebarSpacingColumns(customSpacing),
    [customSpacing],
  );
  const selection = useMemo(
    () =>
      getRebarSelection({
        requiredAreaSquareMillimeters,
        customCount,
      }),
    [customCount, requiredAreaSquareMillimeters],
  );
  const spacingSelection = useMemo(
    () =>
      getRebarSpacingSelection({
        requiredAreaSquareMillimeters,
        customSpacingMillimeters: customSpacing,
      }),
    [customSpacing, requiredAreaSquareMillimeters],
  );
  const hasSelectionTarget = requiredAreaSquareMillimeters > 0;
  const hasNoMatch = hasSelectionTarget && !selection.bestMatch;
  const hasNoSpacingMatch = hasSelectionTarget && !spacingSelection.bestMatch;
  const unitLabel = REBAR_AREA_UNITS[unit].label;
  const perMeterUnitLabel = `${unitLabel}/м.п.`;

  return (
    <div className="rebar-calculator" aria-label="Калькулятор підбору арматури">
      <div className="rebar-calculator__controls">
        <label className="rebar-field">
          <span>
            Мінімальна площа, <MathNotation base="A" ariaLabel="A" />,{" "}
            <span className="math-notation__unit">{unitLabel}</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.001"
            value={minimumAreaInput}
            onChange={(event) => setMinimumAreaInput(event.target.value)}
            aria-label={`Мінімальна площа, ${unitLabel}`}
          />
        </label>

        <fieldset className="rebar-units">
          <legend>Одиниці</legend>
          {UNIT_OPTIONS.map(([value, config]) => (
            <label key={value} className="rebar-unit">
              <input
                type="radio"
                name="rebar-area-unit"
                value={value}
                checked={unit === value}
                onChange={() => setUnit(value)}
              />
              <span>{config.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="rebar-field rebar-field--count">
          <span>
            <MathNotation base="n" ariaLabel="n" />
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={customCountInput}
            onChange={(event) => setCustomCountInput(event.target.value)}
            onBlur={() => setCustomCountInput(String(customCount))}
            aria-label="n"
          />
        </label>
      </div>

      <div className="rebar-calculator__status" aria-live="polite">
        {selection.bestMatch ? (
          <p>
            Найменший варіант у діапазоні: Ø{selection.bestMatch.diameter},{" "}
            <MathNotation base="n" ariaLabel="n" /> = {selection.bestMatch.count},{" "}
            <MathNotation base="A" ariaLabel="A" /> ={" "}
            {formatRebarArea(selection.bestMatch.areaSquareMillimeters, unit)}{" "}
            {unitLabel}, забезпечення{" "}
            {formatRebarUtilization(
              requiredAreaSquareMillimeters,
              selection.bestMatch.areaSquareMillimeters,
            )}
            .
          </p>
        ) : hasNoMatch ? (
          <p>
            У межах таблиці немає комбінації в заданому діапазоні площі.
          </p>
        ) : (
          <p>Введіть мінімальну площу, щоб підсвітити придатні комбінації.</p>
        )}
      </div>

      <div className="rebar-table-wrap" data-table-kind="bars">
        <table className="rebar-table">
          <caption>
            Площа арматури для діаметра стержня та кількості стержнів,{" "}
            {unitLabel}
          </caption>
          <thead>
            <tr>
              <th scope="col">Діаметр</th>
              {barCounts.map((count, index) => (
                <th
                  key={`${index}:${count}`}
                  scope="col"
                  aria-label={index === barCounts.length - 1 ? `n = ${count}` : String(count)}
                >
                  {index === barCounts.length - 1 ? (
                    <>
                      <MathNotation base="n" ariaLabel="n" /> = {count}
                    </>
                  ) : (
                    count
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REBAR_DIAMETERS.map((diameter) => (
              <tr key={diameter}>
                <th scope="row">ø{diameter}</th>
                {barCounts.map((count, index) => {
                  const areaSquareMillimeters = getRebarAreaSquareMillimeters(
                    diameter,
                    count,
                  );
                  const key = getRebarCombinationKey(diameter, count);
                  const isInRange = selection.eligibleKeys.has(key);
                  const isBestMatch =
                    selection.bestMatch?.diameter === diameter &&
                    selection.bestMatch.count === count;

                  return (
                    <td
                      key={`${index}:${count}`}
                      data-eligible={isInRange ? "true" : undefined}
                      data-in-range={isInRange ? "true" : undefined}
                      data-best-match={isBestMatch ? "true" : undefined}
                    >
                      <span className="rebar-table__area">
                        {formatRebarArea(areaSquareMillimeters, unit)}
                      </span>
                      {isInRange ? (
                        <span className="rebar-table__utilization">
                          {formatRebarUtilization(
                            requiredAreaSquareMillimeters,
                            areaSquareMillimeters,
                          )}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rebar-calculator__subsection" aria-labelledby="rebar-meter-title">
        <div className="rebar-calculator__section-head">
          <h3 id="rebar-meter-title">Підбір на 1 м.п.</h3>
          <p>Площа одного стержня, приведена до погонного метра за кроком.</p>
        </div>

        <div className="rebar-calculator__controls rebar-calculator__controls--compact">
          <label className="rebar-field rebar-field--count">
            <span>
              <MathNotation base="s" ariaLabel="s" />,{" "}
              <span className="math-notation__unit">мм</span>
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={customSpacingInput}
              onChange={(event) => setCustomSpacingInput(event.target.value)}
              onBlur={() => setCustomSpacingInput(String(customSpacing))}
              aria-label="s, мм"
            />
          </label>
        </div>

        <div className="rebar-calculator__status" aria-live="polite">
          {spacingSelection.bestMatch ? (
            <p>
              Найменший варіант у діапазоні: Ø{spacingSelection.bestMatch.diameter},
              крок {spacingSelection.bestMatch.spacingMillimeters} мм,{" "}
              <MathNotation base="A" ariaLabel="A" /> ={" "}
              {formatRebarArea(spacingSelection.bestMatch.areaSquareMillimeters, unit)}{" "}
              {perMeterUnitLabel}, забезпечення{" "}
              {formatRebarUtilization(
                requiredAreaSquareMillimeters,
                spacingSelection.bestMatch.areaSquareMillimeters,
              )}
              .
            </p>
          ) : hasNoSpacingMatch ? (
            <p>У межах таблиці немає кроку стержнів у заданому діапазоні площі.</p>
          ) : (
            <p>Введіть мінімальну площу, щоб підсвітити придатні кроки.</p>
          )}
        </div>

        <div className="rebar-table-wrap" data-table-kind="meter">
          <table className="rebar-table">
            <caption>
              Площа арматури на 1 м.п. за діаметром і кроком стержнів,{" "}
              {perMeterUnitLabel}
            </caption>
            <thead>
              <tr>
                <th scope="col">Діаметр</th>
                {spacingColumns.map((spacing, index) => (
                  <th
                    key={`${index}:${spacing}`}
                    scope="col"
                    aria-label={
                      index === spacingColumns.length - 1
                        ? `s = ${spacing} мм`
                        : `${spacing} мм`
                    }
                  >
                    {index === spacingColumns.length - 1 ? (
                      <>
                        <MathNotation base="s" ariaLabel="s" /> = {spacing} мм
                      </>
                    ) : (
                      `${spacing} мм`
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REBAR_DIAMETERS.map((diameter) => (
                <tr key={diameter}>
                  <th scope="row">ø{diameter}</th>
                  {spacingColumns.map((spacing, index) => {
                    const areaSquareMillimeters = getRebarAreaPerMeterSquareMillimeters(
                      diameter,
                      spacing,
                    );
                    const key = getRebarSpacingCombinationKey(diameter, spacing);
                    const isInRange = spacingSelection.eligibleKeys.has(key);
                    const isBestMatch =
                      spacingSelection.bestMatch?.diameter === diameter &&
                      spacingSelection.bestMatch.spacingMillimeters === spacing;

                    return (
                      <td
                        key={`${index}:${spacing}`}
                        data-eligible={isInRange ? "true" : undefined}
                        data-in-range={isInRange ? "true" : undefined}
                        data-best-match={isBestMatch ? "true" : undefined}
                      >
                        <span className="rebar-table__area">
                          {formatRebarArea(areaSquareMillimeters, unit)}
                        </span>
                        {isInRange ? (
                          <span className="rebar-table__utilization">
                            {formatRebarUtilization(
                              requiredAreaSquareMillimeters,
                              areaSquareMillimeters,
                            )}
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
