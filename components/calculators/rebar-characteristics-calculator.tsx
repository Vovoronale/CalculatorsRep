"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_REBAR_DESIGN_FACTORS,
  getRebarByClass,
  getRebarClasses,
  getRebarDesignValues,
  type RebarClassCharacteristics,
  type RebarClassName,
} from "@/lib/materials/rebar";

import { MathNotation } from "./math-notation";

const DEFAULT_REBAR_CLASS: RebarClassName = "A500C";

type CharacteristicLabel = {
  ariaLabel: string;
  symbol?: {
    base: string;
    subscript?: string;
  };
  text?: string;
  unit?: string;
};

function formatValue(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return Number.isInteger(value) ? String(value) : String(value);
}

function formatDesignValue(value: number): string {
  return value.toFixed(2);
}

function getDesignValuesFor(rebarClass: RebarClassCharacteristics) {
  return (
    getRebarDesignValues(rebarClass.className, DEFAULT_REBAR_DESIGN_FACTORS) ?? {
      fydMPa: 0,
    }
  );
}

function CharacteristicNotation({ label }: { label: CharacteristicLabel }) {
  return (
    <>
      {label.symbol ? (
        <MathNotation
          base={label.symbol.base}
          subscript={label.symbol.subscript}
          ariaLabel={`${label.symbol.base}${label.symbol.subscript ?? ""}`}
        />
      ) : (
        label.text
      )}
      {label.unit ? <span className="math-notation__unit">, {label.unit}</span> : null}
    </>
  );
}

function getRebarRows() {
  return [
    {
      key: "temperature",
      label: {
        ariaLabel: "t, °C",
        symbol: { base: "t" },
        unit: "°C",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.electroHeatingTemperatureC,
    },
    {
      key: "fyk",
      label: {
        ariaLabel: "fyk, МПа",
        symbol: { base: "f", subscript: "yk" },
        unit: "МПа",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.yieldStrengthMPa,
    },
    {
      key: "ftk",
      label: {
        ariaLabel: "ftk, МПа",
        symbol: { base: "f", subscript: "tk" },
        unit: "МПа",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.tensileStrengthMPa,
    },
    {
      key: "elongation",
      label: {
        ariaLabel: "A, %",
        symbol: { base: "A" },
        unit: "%",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.elongationAfterRupturePercent,
    },
    {
      key: "uniformElongation",
      label: {
        ariaLabel: "Ag, %",
        symbol: { base: "A", subscript: "g" },
        unit: "%",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.uniformElongationPercent,
    },
    {
      key: "totalElongation",
      label: {
        ariaLabel: "Agt, %",
        symbol: { base: "A", subscript: "gt" },
        unit: "%",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.totalElongationAtMaximumLoadPercent,
    },
    {
      key: "bend",
      label: {
        ariaLabel: "Згин, °",
        text: "Згин",
        unit: "°",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.bendAngleDegrees,
    },
    {
      key: "mandrel",
      label: {
        ariaLabel: "Оправка",
        text: "Оправка",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.mandrelDiameterFactor === null ? (
          "-"
        ) : (
          <>
            {formatValue(rebarClass.mandrelDiameterFactor)}
            <MathNotation base="d" subscript="н" ariaLabel="dн" />
          </>
        ),
    },
    {
      key: "elasticModulus",
      label: {
        ariaLabel: "Es, ГПа",
        symbol: { base: "E", subscript: "s" },
        unit: "ГПа",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.elasticModulusGPa,
    },
    {
      key: "fyd",
      label: {
        ariaLabel: "fyd, МПа",
        symbol: { base: "f", subscript: "yd" },
        unit: "МПа",
      },
      getValue: (rebarClass: RebarClassCharacteristics) =>
        formatDesignValue(getDesignValuesFor(rebarClass).fydMPa),
    },
  ];
}

export function RebarCharacteristicsCalculator() {
  const rebarClasses = useMemo(() => getRebarClasses(), []);
  const rebarRows = useMemo(() => getRebarRows(), []);
  const [selectedClass, setSelectedClass] =
    useState<RebarClassName>(DEFAULT_REBAR_CLASS);

  const selectedRebar =
    getRebarByClass(selectedClass) ?? getRebarByClass(DEFAULT_REBAR_CLASS);
  const selectedDesignValues = selectedRebar ? getDesignValuesFor(selectedRebar) : null;

  return (
    <div
      className="rebar-characteristics-calculator"
      aria-label="Калькулятор характеристик арматури"
    >
      <div className="rebar-characteristics-calculator__controls">
        <label className="rebar-characteristics-field">
          <span>Клас арматури</span>
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value as RebarClassName)}
            aria-label="Клас арматури"
          >
            {rebarClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedRebar && selectedDesignValues ? (
        <div className="rebar-characteristics-summary" aria-live="polite">
          <p>
            {selectedRebar.className}:{" "}
            <MathNotation base="f" subscript="yk" ariaLabel="fyk" /> ={" "}
            {selectedRebar.yieldStrengthMPa} МПа,{" "}
            <MathNotation base="f" subscript="tk" ariaLabel="ftk" /> ={" "}
            {selectedRebar.tensileStrengthMPa} МПа,{" "}
            <MathNotation base="f" subscript="yd" ariaLabel="fyd" /> ={" "}
            {formatDesignValue(selectedDesignValues.fydMPa)} МПа,{" "}
            <MathNotation base="E" subscript="s" ariaLabel="Es" /> ={" "}
            {selectedRebar.elasticModulusGPa} ГПа.
          </p>
        </div>
      ) : null}

      <div className="rebar-characteristics-table-wrap">
        <table
          className="rebar-characteristics-table"
          aria-label="Характеристики арматури за ДСТУ 3760:2006"
        >
          <caption>Характеристики арматури за ДСТУ 3760:2006</caption>
          <thead>
            <tr>
              <th scope="col">Характеристика</th>
              {rebarClasses.map((className) => (
                <th
                  key={className}
                  scope="col"
                  data-selected={className === selectedClass ? "true" : undefined}
                >
                  {className}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rebarRows.map((row) => (
              <tr key={row.key}>
                <th scope="row" aria-label={row.label.ariaLabel}>
                  <CharacteristicNotation label={row.label} />
                </th>
                {rebarClasses.map((className) => {
                  const rebarClass = getRebarByClass(className);
                  const value = rebarClass ? row.getValue(rebarClass) : null;

                  return (
                    <td
                      key={`${row.key}:${className}`}
                      data-selected={className === selectedClass ? "true" : undefined}
                    >
                      {typeof value === "number" || value === null
                        ? formatValue(value)
                        : value}
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
