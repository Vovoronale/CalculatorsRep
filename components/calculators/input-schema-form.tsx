"use client";

import { Calculator } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import {
  convertBaseNumberToDisplay,
  convertDisplayNumberToBase,
  getVisibleInputSchemaGroups,
  validateInputSchemaValues,
  type CalculatorInputDisplayUnit,
  type CalculatorInputField,
  type CalculatorInputNotation,
  type CalculatorInputSchema,
  type CalculatorInputValidationErrors,
  type CalculatorInputValues,
  type CalculatorNumberInputField,
} from "@/lib/calculator-input-schema";
import { resolveCalculatorInputUnits } from "@/lib/calculator-units";

import { MathNotation } from "./math-notation";

export type InputSchemaFieldCalculatorActionEvent = {
  fieldId: string;
  field: CalculatorInputField;
  values: CalculatorInputValues;
};

type InputSchemaFormProps = {
  schema: CalculatorInputSchema;
  values: CalculatorInputValues;
  onValuesChange: (values: CalculatorInputValues) => void;
  validationErrors?: CalculatorInputValidationErrors;
  onFieldCalculatorAction?: (event: InputSchemaFieldCalculatorActionEvent) => void;
  displayUnits?: Record<string, string>;
  onDisplayUnitsChange?: (displayUnits: Record<string, string>) => void;
  renderDescription?: (description: string) => ReactNode;
};

function getNotationText(prefix: CalculatorInputNotation): string {
  return typeof prefix === "string" ? prefix : prefix.ariaLabel;
}

function FieldPrefix({ prefix }: { prefix?: CalculatorInputNotation }) {
  if (!prefix) return null;
  if (typeof prefix === "string") return <>{prefix}</>;

  return (
    <MathNotation
      base={prefix.text}
      subscript={prefix.subscript}
      superscript={prefix.superscript}
      ariaLabel={prefix.ariaLabel}
    />
  );
}

function getInitialDisplayUnits(schema: CalculatorInputSchema): Record<string, string> {
  const units: Record<string, string> = {};

  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.kind === "number") {
        const resolvedUnits = getFieldDisplayUnits(field);
        if (resolvedUnits?.length) {
          units[field.id] = field.defaultDisplayUnit ?? resolvedUnits[0].value;
        }
      }
    }
  }

  return units;
}

function getFieldDisplayUnits(
  field: CalculatorNumberInputField,
): CalculatorInputDisplayUnit[] | undefined {
  return resolveCalculatorInputUnits(field);
}

function getSelectedDisplayUnit(
  field: CalculatorNumberInputField,
  displayUnits: Record<string, string>,
): CalculatorInputDisplayUnit | undefined {
  const units = getFieldDisplayUnits(field);
  if (!units?.length) return undefined;
  const selectedUnit = displayUnits[field.id] ?? field.defaultDisplayUnit ?? units[0].value;
  return units.find((unit) => unit.value === selectedUnit) ?? units[0];
}

export function InputSchemaForm({
  schema,
  values,
  onValuesChange,
  validationErrors,
  onFieldCalculatorAction,
  displayUnits: controlledDisplayUnits,
  onDisplayUnitsChange,
  renderDescription = (description) => description,
}: InputSchemaFormProps) {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, "help" | "error">>({});
  const [numberDrafts, setNumberDrafts] = useState<
    Record<string, { displayValue: string; baseValue: string; unitValue?: string }>
  >({});
  const [internalDisplayUnits, setInternalDisplayUnits] = useState<Record<string, string>>(() =>
    getInitialDisplayUnits(schema),
  );
  const displayUnits = controlledDisplayUnits ?? internalDisplayUnits;
  const schemaErrors = useMemo(
    () => validateInputSchemaValues(schema, values),
    [schema, values],
  );
  const combinedErrors = {
    ...schemaErrors,
    ...validationErrors,
  };
  const groups = getVisibleInputSchemaGroups(schema, values);

  const setValue = (id: string, value: string | boolean) => {
    onValuesChange({
      ...values,
      [id]: value,
    });
  };

  const toggleDetails = (fieldId: string, mode: "help" | "error") => {
    setExpandedDetails((current) => {
      if (current[fieldId] !== mode) {
        return {
          ...current,
          [fieldId]: mode,
        };
      }

      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  };

  const renderFieldControl = (field: CalculatorInputField) => {
    const fieldId = `input-schema-${field.id}`;

    if (field.kind === "number") {
      const resolvedUnits = getFieldDisplayUnits(field);
      const selectedUnit = getSelectedDisplayUnit(field, displayUnits);
      const value = values[field.id] ?? field.defaultValue;
      const draft = numberDrafts[field.id];
      const displayValue =
        draft &&
        draft.baseValue === String(value) &&
        draft.unitValue === selectedUnit?.value
          ? draft.displayValue
          : selectedUnit
            ? convertBaseNumberToDisplay(value, selectedUnit)
            : String(value);

      return (
        <>
          <input
            id={fieldId}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={(event) => {
              const nextDisplayValue = event.target.value;
              const nextBaseValue = selectedUnit
                ? convertDisplayNumberToBase(nextDisplayValue, selectedUnit)
                : nextDisplayValue;
              setNumberDrafts((current) => ({
                ...current,
                [field.id]: {
                  displayValue: nextDisplayValue,
                  baseValue: nextBaseValue,
                  unitValue: selectedUnit?.value,
                },
              }));
              setValue(field.id, nextBaseValue);
            }}
            onBlur={() =>
              setNumberDrafts((current) => {
                const next = { ...current };
                delete next[field.id];
                return next;
              })
            }
            aria-label={field.name}
          />
          {resolvedUnits?.length ? (
            <select
              className="input-schema-field__unit"
              disabled={resolvedUnits.length === 1}
              aria-readonly={resolvedUnits.length === 1 ? "true" : undefined}
              value={selectedUnit?.value ?? resolvedUnits[0].value}
              onChange={(event) => {
                setNumberDrafts((current) => {
                  const next = { ...current };
                  delete next[field.id];
                  return next;
                });
                const nextDisplayUnits = {
                  ...displayUnits,
                  [field.id]: event.target.value,
                };
                if (controlledDisplayUnits) {
                  onDisplayUnitsChange?.(nextDisplayUnits);
                } else {
                  setInternalDisplayUnits(nextDisplayUnits);
                }
              }}
              aria-label={`Одиниця ${field.name}`}
            >
              {resolvedUnits.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          ) : null}
        </>
      );
    }

    if (field.kind === "text") {
      return (
        <input
          id={fieldId}
          type="text"
          value={String(values[field.id] ?? field.defaultValue)}
          onChange={(event) => setValue(field.id, event.target.value)}
          aria-label={field.name}
        />
      );
    }

    if (field.kind === "select") {
      return (
        <select
          id={fieldId}
          value={String(values[field.id] ?? field.defaultValue)}
          onChange={(event) => setValue(field.id, event.target.value)}
          aria-label={field.name}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.kind === "checkbox") {
      return (
        <label className="input-schema-field__checkbox">
          <input
            id={fieldId}
            type="checkbox"
            checked={Boolean(values[field.id] ?? field.defaultValue)}
            onChange={(event) => setValue(field.id, event.target.checked)}
            aria-label={field.name}
          />
        </label>
      );
    }

    if (field.kind === "radio") {
      return (
        <span className="input-schema-field__radio-group">
          {field.options.map((option) => (
            <label key={option.value} className="input-schema-field__radio">
              <input
                type="radio"
                name={`input-schema-${field.id}`}
                value={option.value}
                checked={(values[field.id] ?? field.defaultValue) === option.value}
                onChange={() => setValue(field.id, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </span>
      );
    }

    return <output>{field.getValue(values)}</output>;
  };

  return (
    <div className="input-schema-form">
      {groups.map((group) => (
        <fieldset className="input-schema-group" id={group.id} key={group.id}>
          <legend>{group.title}</legend>
          <div className="input-schema-group__rows">
            {group.fields.map((field) => {
              const errors = combinedErrors[field.id] ?? [];
              const detailsMode = expandedDetails[field.id];
              const detailsId = `input-schema-${field.id}-details`;

              return (
                <div
                  className="input-schema-field"
                  data-kind={field.kind}
                  data-invalid={errors.length > 0 ? "true" : undefined}
                  key={field.id}
                >
                  <div className="input-schema-field__actions">
                    {errors.length > 0 ? (
                      <button
                        type="button"
                        className="input-schema-field__icon input-schema-field__icon--error"
                        aria-controls={detailsId}
                        aria-expanded={detailsMode === "error"}
                        aria-label={`Показати помилку поля ${field.name}`}
                        onClick={() => toggleDetails(field.id, "error")}
                      >
                        !
                      </button>
                    ) : field.description ? (
                      <button
                        type="button"
                        className="input-schema-field__icon"
                        aria-controls={detailsId}
                        aria-expanded={detailsMode === "help"}
                        aria-label={`Показати опис поля ${field.name}`}
                        onClick={() => toggleDetails(field.id, "help")}
                      >
                        ?
                      </button>
                    ) : null}
                  </div>
                  <div
                    className="input-schema-field__prefix"
                    data-empty={field.prefix ? undefined : "true"}
                    aria-label={
                      field.prefix ? `Позначення ${getNotationText(field.prefix)}` : undefined
                    }
                  >
                    <FieldPrefix prefix={field.prefix} />
                  </div>
                  {field.kind === "checkbox" ? (
                    <div className="input-schema-field__name">{field.name}</div>
                  ) : (
                    <label className="input-schema-field__name" htmlFor={`input-schema-${field.id}`}>
                      {field.name}
                    </label>
                  )}
                  <div className="input-schema-field__control">{renderFieldControl(field)}</div>
                  <div className="input-schema-field__calculator-action">
                    {field.calculatorAction && onFieldCalculatorAction ? (
                      <button
                        type="button"
                        className="input-schema-field__icon input-schema-field__icon--calculator"
                        aria-label={field.calculatorAction.label}
                        title={field.calculatorAction.label}
                        onClick={() =>
                          onFieldCalculatorAction({
                            fieldId: field.id,
                            field,
                            values,
                          })
                        }
                      >
                        <Calculator size={13} aria-hidden="true" strokeWidth={2.25} />
                      </button>
                    ) : null}
                  </div>
                  {detailsMode ? (
                    <div className="input-schema-field__details" id={detailsId}>
                      {field.description ? <p>{renderDescription(field.description)}</p> : null}
                      {detailsMode === "error" && errors.length > 0 ? (
                        <ul>
                          {errors.map((error) => (
                            <li key={error}>{error}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
