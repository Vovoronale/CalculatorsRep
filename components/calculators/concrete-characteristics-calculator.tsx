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

const DEFAULT_CONCRETE_CLASS: ConcreteClassName = "C30/37";

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

function getConcreteRows() {
  return [
    {
      key: "fck",
      label: "fck, МПа",
      getValue: (concrete: ConcreteCharacteristics) => concrete.fckMPa,
    },
    {
      key: "fckCube",
      label: "fck,cube, МПа",
      getValue: (concrete: ConcreteCharacteristics) => concrete.fckCubeMPa,
    },
    {
      key: "fcm",
      label: "fcm, МПа",
      getValue: (concrete: ConcreteCharacteristics) => concrete.fcmMPa,
    },
    {
      key: "fctm",
      label: "fctm, МПа",
      getValue: (concrete: ConcreteCharacteristics) => concrete.fctmMPa,
    },
    {
      key: "fctk005",
      label: "fctk,0.05, МПа",
      getValue: (concrete: ConcreteCharacteristics) => concrete.fctk005MPa,
    },
    {
      key: "fctk095",
      label: "fctk,0.95, МПа",
      getValue: (concrete: ConcreteCharacteristics) => concrete.fctk095MPa,
    },
    {
      key: "ecm",
      label: "Ecm, ГПа",
      getValue: (concrete: ConcreteCharacteristics) => concrete.ecmGPa,
    },
    {
      key: "epsilonC1",
      label: "εc1, ‰",
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonC1PerMille,
    },
    {
      key: "epsilonCu1",
      label: "εcu1, ‰",
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonCu1PerMille,
    },
    {
      key: "epsilonC2",
      label: "εc2, ‰",
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonC2PerMille,
    },
    {
      key: "epsilonCu2",
      label: "εcu2, ‰",
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonCu2PerMille,
    },
    {
      key: "n",
      label: "n",
      getValue: (concrete: ConcreteCharacteristics) => concrete.n,
    },
    {
      key: "epsilonC3",
      label: "εc3, ‰",
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonC3PerMille,
    },
    {
      key: "epsilonCu3",
      label: "εcu3, ‰",
      getValue: (concrete: ConcreteCharacteristics) => concrete.epsilonCu3PerMille,
    },
    {
      key: "fcd",
      label: "fcd, МПа",
      getValue: (concrete: ConcreteCharacteristics) =>
        formatDesignValue(getDesignValuesFor(concrete).fcdMPa),
    },
    {
      key: "fctd",
      label: "fctd, МПа",
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
            {selectedConcrete.className}: fck = {selectedConcrete.fckMPa} МПа,
            fcd = {formatDesignValue(selectedDesignValues.fcdMPa)} МПа, fctd ={" "}
            {formatDesignValue(selectedDesignValues.fctdMPa)} МПа, Ecm ={" "}
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
                <th scope="row">{row.label}</th>
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
