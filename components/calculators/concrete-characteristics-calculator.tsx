"use client";

import { useMemo, useState } from "react";

import {
  CONCRETE_CHARACTERISTICS,
  DEFAULT_CONCRETE_DESIGN_FACTORS,
  getConcreteByClass,
  getConcreteClasses,
  getConcreteDesignValues,
  type ConcreteClassName,
  type ConcreteCharacteristics,
} from "@/lib/materials/concrete";

import { MathNotation } from "./math-notation";

const DEFAULT_CONCRETE_CLASS: ConcreteClassName = "C30/37";

type CharacteristicLabel = {
  ariaLabel: string;
  symbol: {
    base: string;
    subscript?: string;
  };
  unit?: string;
};

function formatCompact(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function formatDesignValue(value: number): string {
  return value.toFixed(2);
}

function getDesignValuesFor(concrete: ConcreteCharacteristics) {
  return (
    getConcreteDesignValues(concrete.className, DEFAULT_CONCRETE_DESIGN_FACTORS) ?? {
      fcdMPa: 0,
      fctdMPa: 0,
    }
  );
}

function CharacteristicNotation({ label }: { label: CharacteristicLabel }) {
  return (
    <>
      <MathNotation
        base={label.symbol.base}
        subscript={label.symbol.subscript}
        ariaLabel={`${label.symbol.base}${label.symbol.subscript ?? ""}`}
      />
      {label.unit ? <span className="math-notation__unit">, {label.unit}</span> : null}
    </>
  );
}

function getConcreteRows() {
  return [
    {
      key: "fck",
      label: {
        ariaLabel: "fck, МПа",
        symbol: { base: "f", subscript: "ck" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.fckMPa,
    },
    {
      key: "fckCube",
      label: {
        ariaLabel: "fck,cube, МПа",
        symbol: { base: "f", subscript: "ck,cube" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.fckCubeMPa,
    },
    {
      key: "fcm",
      label: {
        ariaLabel: "fcm, МПа",
        symbol: { base: "f", subscript: "cm" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.fcmMPa,
    },
    {
      key: "fctm",
      label: {
        ariaLabel: "fctm, МПа",
        symbol: { base: "f", subscript: "ctm" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.fctmMPa,
    },
    {
      key: "fctk005",
      label: {
        ariaLabel: "fctk,0.05, МПа",
        symbol: { base: "f", subscript: "ctk,0.05" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.fctk005MPa,
    },
    {
      key: "fctk095",
      label: {
        ariaLabel: "fctk,0.95, МПа",
        symbol: { base: "f", subscript: "ctk,0.95" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.fctk095MPa,
    },
    {
      key: "ecm",
      label: {
        ariaLabel: "Ecm, ГПа",
        symbol: { base: "E", subscript: "cm" },
        unit: "ГПа",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.ecmGPa,
    },
    {
      key: "epsilonC1",
      label: {
        ariaLabel: "εc1, ‰",
        symbol: { base: "ε", subscript: "c1" },
        unit: "‰",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonC1PerMille,
    },
    {
      key: "epsilonCu1",
      label: {
        ariaLabel: "εcu1, ‰",
        symbol: { base: "ε", subscript: "cu1" },
        unit: "‰",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonCu1PerMille,
    },
    {
      key: "epsilonC2",
      label: {
        ariaLabel: "εc2, ‰",
        symbol: { base: "ε", subscript: "c2" },
        unit: "‰",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonC2PerMille,
    },
    {
      key: "epsilonCu2",
      label: {
        ariaLabel: "εcu2, ‰",
        symbol: { base: "ε", subscript: "cu2" },
        unit: "‰",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonCu2PerMille,
    },
    {
      key: "n",
      label: {
        ariaLabel: "n",
        symbol: { base: "n" },
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.n,
    },
    {
      key: "epsilonC3",
      label: {
        ariaLabel: "εc3, ‰",
        symbol: { base: "ε", subscript: "c3" },
        unit: "‰",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonC3PerMille,
    },
    {
      key: "epsilonCu3",
      label: {
        ariaLabel: "εcu3, ‰",
        symbol: { base: "ε", subscript: "cu3" },
        unit: "‰",
      },
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonCu3PerMille,
    },
    {
      key: "fcd",
      label: {
        ariaLabel: "fcd, МПа",
        symbol: { base: "f", subscript: "cd" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) =>
        formatDesignValue(getDesignValuesFor(concrete).fcdMPa),
    },
    {
      key: "fctd",
      label: {
        ariaLabel: "fctd, МПа",
        symbol: { base: "f", subscript: "ctd" },
        unit: "МПа",
      },
      getValue: (concrete: ConcreteCharacteristics) =>
        formatDesignValue(getDesignValuesFor(concrete).fctdMPa),
    },
  ];
}

export function ConcreteCharacteristicsCalculator() {
  const concreteClasses = useMemo(() => getConcreteClasses(), []);
  const concreteRows = useMemo(() => getConcreteRows(), []);
  const [selectedClass, setSelectedClass] =
    useState<ConcreteClassName>(DEFAULT_CONCRETE_CLASS);

  const selectedConcrete =
    getConcreteByClass(selectedClass) ?? getConcreteByClass(DEFAULT_CONCRETE_CLASS);
  const selectedDesignValues = selectedConcrete
    ? getDesignValuesFor(selectedConcrete)
    : null;

  return (
    <div className="concrete-calculator" aria-label="Калькулятор характеристик бетону">
      <div className="concrete-calculator__controls">
        <label className="concrete-field">
          <span>Клас бетону</span>
          <select
            value={selectedClass}
            onChange={(event) =>
              setSelectedClass(event.target.value as ConcreteClassName)
            }
            aria-label="Клас бетону"
          >
            {concreteClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedConcrete && selectedDesignValues ? (
        <div className="concrete-summary" aria-live="polite">
          <p>
            {selectedConcrete.className}:{" "}
            <MathNotation base="f" subscript="ck" ariaLabel="fck" /> ={" "}
            {selectedConcrete.fckMPa} МПа,{" "}
            <MathNotation base="f" subscript="cd" ariaLabel="fcd" /> ={" "}
            {formatDesignValue(selectedDesignValues.fcdMPa)} МПа,{" "}
            <MathNotation base="f" subscript="ctd" ariaLabel="fctd" /> ={" "}
            {formatDesignValue(selectedDesignValues.fctdMPa)} МПа,{" "}
            <MathNotation base="E" subscript="cm" ariaLabel="Ecm" /> ={" "}
            {selectedConcrete.ecmGPa} ГПа.
          </p>
        </div>
      ) : null}

      <div className="concrete-table-wrap">
        <table
          className="concrete-table"
          aria-label="Характеристики бетону за ДБН В.2.6-98:2009 та ДСТУ Б В.2.6-156:2010"
        >
          <caption>
            Характеристики бетону за ДБН В.2.6-98:2009 та ДСТУ Б В.2.6-156:2010
          </caption>
          <thead>
            <tr>
              <th scope="col">Характеристика</th>
              {CONCRETE_CHARACTERISTICS.map((concrete) => (
                <th
                  key={concrete.className}
                  scope="col"
                  data-selected={
                    concrete.className === selectedClass ? "true" : undefined
                  }
                >
                  {concrete.className}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {concreteRows.map((row) => (
              <tr key={row.key}>
                <th scope="row" aria-label={row.label.ariaLabel}>
                  <CharacteristicNotation label={row.label} />
                </th>
                {CONCRETE_CHARACTERISTICS.map((concrete) => (
                  <td
                    key={`${row.key}:${concrete.className}`}
                    data-selected={
                      concrete.className === selectedClass ? "true" : undefined
                    }
                  >
                    {typeof row.getValue(concrete) === "number"
                      ? formatCompact(row.getValue(concrete) as number)
                      : row.getValue(concrete)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
