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

const DEFAULT_REBAR_CLASS: RebarClassName = "A500C";

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

function getRebarRows() {
  return [
    {
      key: "temperature",
      label: "t, °C",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.electroHeatingTemperatureC,
    },
    {
      key: "fyk",
      label: "fyk, МПа",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.yieldStrengthMPa,
    },
    {
      key: "ftk",
      label: "ftk, МПа",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.tensileStrengthMPa,
    },
    {
      key: "elongation",
      label: "A, %",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.elongationAfterRupturePercent,
    },
    {
      key: "uniformElongation",
      label: "Ag, %",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.uniformElongationPercent,
    },
    {
      key: "totalElongation",
      label: "Agt, %",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.totalElongationAtMaximumLoadPercent,
    },
    {
      key: "bend",
      label: "Згин, °",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.bendAngleDegrees,
    },
    {
      key: "mandrel",
      label: "Оправка",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        `${formatValue(rebarClass.mandrelDiameterFactor)}dн`,
    },
    {
      key: "elasticModulus",
      label: "Es, ГПа",
      getValue: (rebarClass: RebarClassCharacteristics) =>
        rebarClass.elasticModulusGPa,
    },
    {
      key: "fyd",
      label: "fyd, МПа",
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
            {selectedRebar.className}: fyk = {selectedRebar.yieldStrengthMPa} МПа,
            ftk = {selectedRebar.tensileStrengthMPa} МПа, fyd ={" "}
            {formatDesignValue(selectedDesignValues.fydMPa)} МПа, Es ={" "}
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
                <th scope="row">{row.label}</th>
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
