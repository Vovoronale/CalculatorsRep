import type { CalculatorInputQuantity } from "./calculator-units";

export type CalculatorInputPrimitiveValue = string | boolean;

export type CalculatorInputValues = Record<string, CalculatorInputPrimitiveValue>;

export type CalculatorInputOption = {
  value: string;
  label: string;
};

export type CalculatorInputNotation =
  | string
  | {
      text: string;
      subscript?: string;
      superscript?: string;
      ariaLabel: string;
    };

export type CalculatorInputDisplayUnit = {
  value: string;
  label: string;
  factorToBase: number;
};

export type CalculatorInputCondition =
  | {
      fieldId: string;
      equals: CalculatorInputPrimitiveValue;
    }
  | {
      fieldId: string;
      notEquals: CalculatorInputPrimitiveValue;
    }
  | {
      fieldId: string;
      in: CalculatorInputPrimitiveValue[];
    };

type BaseCalculatorInputField = {
  id: string;
  name: string;
  prefix?: CalculatorInputNotation;
  description?: string;
  required?: boolean;
  showWhen?: CalculatorInputCondition | CalculatorInputCondition[];
  hidden?: boolean;
};

export type CalculatorNumberInputField = BaseCalculatorInputField & {
  kind: "number";
  defaultValue: string;
  min?: number;
  max?: number;
  step?: string;
  quantity?: CalculatorInputQuantity;
  baseUnit?: string;
  defaultDisplayUnit?: string;
  displayUnits?: CalculatorInputDisplayUnit[];
};

export type CalculatorTextInputField = BaseCalculatorInputField & {
  kind: "text";
  defaultValue: string;
};

export type CalculatorSelectInputField = BaseCalculatorInputField & {
  kind: "select";
  defaultValue: string;
  options: CalculatorInputOption[];
};

export type CalculatorCheckboxInputField = BaseCalculatorInputField & {
  kind: "checkbox";
  defaultValue: boolean;
};

export type CalculatorRadioInputField = BaseCalculatorInputField & {
  kind: "radio";
  defaultValue: string;
  options: CalculatorInputOption[];
};

export type CalculatorDerivedInputField = BaseCalculatorInputField & {
  kind: "derived";
  getValue: (values: CalculatorInputValues) => string;
};

export type CalculatorInputField =
  | CalculatorNumberInputField
  | CalculatorTextInputField
  | CalculatorSelectInputField
  | CalculatorCheckboxInputField
  | CalculatorRadioInputField
  | CalculatorDerivedInputField;

export type CalculatorInputGroup = {
  id: string;
  title: string;
  fields: CalculatorInputField[];
};

export type CalculatorInputSchema = {
  groups: CalculatorInputGroup[];
};

export type CalculatorInputValidationErrors = Record<string, string[]>;

function conditionMatches(
  condition: CalculatorInputCondition | CalculatorInputCondition[] | undefined,
  values: CalculatorInputValues,
): boolean {
  if (!condition) return true;
  if (Array.isArray(condition)) {
    return condition.every((item) => conditionMatches(item, values));
  }

  const value = values[condition.fieldId];

  if ("equals" in condition) {
    return value === condition.equals;
  }

  if ("notEquals" in condition) {
    return value !== condition.notEquals;
  }

  return condition.in.includes(value);
}

export function getVisibleInputSchemaGroups(
  schema: CalculatorInputSchema,
  values: CalculatorInputValues,
): CalculatorInputGroup[] {
  return schema.groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter(
        (field) => !field.hidden && conditionMatches(field.showWhen, values),
      ),
    }))
    .filter((group) => group.fields.length > 0);
}

export function parseCalculatorDecimal(value: CalculatorInputPrimitiveValue): number {
  if (typeof value === "boolean") return Number.NaN;
  const normalized = value.trim().replace(",", ".");
  if (normalized === "" || normalized.endsWith(".")) return Number.NaN;
  return Number(normalized);
}

function formatCalculatorDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number.parseFloat(value.toFixed(12)));
}

export function convertDisplayNumberToBase(
  value: string,
  unit: CalculatorInputDisplayUnit,
): string {
  const numericValue = parseCalculatorDecimal(value);
  if (!Number.isFinite(numericValue)) return value;
  return formatCalculatorDecimal(numericValue * unit.factorToBase);
}

export function convertBaseNumberToDisplay(
  value: CalculatorInputPrimitiveValue,
  unit: CalculatorInputDisplayUnit,
): string {
  const numericValue = parseCalculatorDecimal(value);
  if (!Number.isFinite(numericValue)) return String(value ?? "");
  return formatCalculatorDecimal(numericValue / unit.factorToBase);
}

function validateNumberField(
  field: CalculatorNumberInputField,
  values: CalculatorInputValues,
): string[] {
  const value = values[field.id];
  const messages: string[] = [];
  const isEmpty = value === undefined || value === "";

  if (field.required && isEmpty) {
    messages.push("Заповніть поле.");
    return messages;
  }

  if (isEmpty) return messages;

  const numericValue = parseCalculatorDecimal(value);

  if (!Number.isFinite(numericValue)) {
    messages.push("Введіть числове значення.");
    return messages;
  }

  if (field.min !== undefined && numericValue < field.min) {
    messages.push(`Значення має бути не менше ${field.min}.`);
  }

  if (field.max !== undefined && numericValue > field.max) {
    messages.push(`Значення має бути не більше ${field.max}.`);
  }

  return messages;
}

function validateTextField(
  field: CalculatorTextInputField,
  values: CalculatorInputValues,
): string[] {
  const value = values[field.id];
  const isEmpty = value === undefined || value === "";
  return field.required && isEmpty ? ["Заповніть поле."] : [];
}

function validateOptionField(
  field: CalculatorSelectInputField | CalculatorRadioInputField,
  values: CalculatorInputValues,
): string[] {
  const value = values[field.id];
  const isEmpty = value === undefined || value === "";

  if (field.required && isEmpty) {
    return ["Заповніть поле."];
  }

  if (isEmpty) return [];

  return field.options.some((option) => option.value === value)
    ? []
    : ["Оберіть значення зі списку."];
}

export function validateInputSchemaValues(
  schema: CalculatorInputSchema,
  values: CalculatorInputValues,
): CalculatorInputValidationErrors {
  const errors: CalculatorInputValidationErrors = {};

  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (!conditionMatches(field.showWhen, values)) continue;

      const fieldErrors =
        field.kind === "number"
          ? validateNumberField(field, values)
          : field.kind === "select" || field.kind === "radio"
            ? validateOptionField(field, values)
            : field.kind === "text"
              ? validateTextField(field, values)
              : [];

      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors;
      }
    }
  }

  return errors;
}

export function getDefaultInputSchemaValues(
  schema: CalculatorInputSchema,
): CalculatorInputValues {
  const values: CalculatorInputValues = {};

  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.kind !== "derived") {
        values[field.id] = field.defaultValue;
      }
    }
  }

  return values;
}
