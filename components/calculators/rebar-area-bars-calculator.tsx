"use client";

import { useMemo, useState } from "react";

import {
  REBAR_AREA_UNITS,
  REBAR_DIAMETERS,
  clampRebarCount,
  convertAreaToSquareMillimeters,
  formatRebarArea,
  formatRebarUtilization,
  getRebarAreaSquareMillimeters,
  getRebarBarCounts,
  getRebarCombinationKey,
  getRebarSelection,
  type RebarAreaUnit,
} from "@/lib/rebar-area-bars";

const UNIT_OPTIONS = Object.entries(REBAR_AREA_UNITS) as Array<
  [RebarAreaUnit, (typeof REBAR_AREA_UNITS)[RebarAreaUnit]]
>;

export function RebarAreaBarsCalculator() {
  const [minimumAreaInput, setMinimumAreaInput] = useState("5");
  const [unit, setUnit] = useState<RebarAreaUnit>("cm2");
  const [customCountInput, setCustomCountInput] = useState("10");

  const minimumArea = Number.parseFloat(minimumAreaInput.replace(",", "."));
  const customCount = clampRebarCount(Number.parseFloat(customCountInput));
  const requiredAreaSquareMillimeters =
    Number.isFinite(minimumArea) && minimumArea > 0
      ? convertAreaToSquareMillimeters(minimumArea, unit)
      : 0;

  const barCounts = useMemo(() => getRebarBarCounts(customCount), [customCount]);
  const selection = useMemo(
    () =>
      getRebarSelection({
        requiredAreaSquareMillimeters,
        customCount,
      }),
    [customCount, requiredAreaSquareMillimeters],
  );
  const hasSelectionTarget = requiredAreaSquareMillimeters > 0;
  const hasNoMatch = hasSelectionTarget && !selection.bestMatch;

  return (
    <div className="rebar-calculator" aria-label="Калькулятор підбору арматури">
      <div className="rebar-calculator__controls">
        <label className="rebar-field">
          <span>Мінімальна площа</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.001"
            value={minimumAreaInput}
            onChange={(event) => setMinimumAreaInput(event.target.value)}
            aria-label="Мінімальна площа арматури"
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
          <span>n</span>
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
            Найменший варіант у діапазоні: Ø{selection.bestMatch.diameter}, n ={" "}
            {selection.bestMatch.count}, A ={" "}
            {formatRebarArea(selection.bestMatch.areaSquareMillimeters, unit)}{" "}
            {REBAR_AREA_UNITS[unit].label}, використання{" "}
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
          <p>Введіть діапазон площі, щоб підсвітити придатні комбінації.</p>
        )}
      </div>

      <div className="rebar-table-wrap">
        <table className="rebar-table">
          <caption>
            Площа арматури для діаметра стержня та кількості стержнів,{" "}
            {REBAR_AREA_UNITS[unit].label}
          </caption>
          <thead>
            <tr>
              <th scope="col">Діаметр</th>
              {barCounts.map((count, index) => (
                <th key={`${index}:${count}`} scope="col">
                  {index === barCounts.length - 1 ? `n = ${count}` : count}
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
    </div>
  );
}
