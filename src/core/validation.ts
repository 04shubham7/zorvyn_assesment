import { FieldError } from './types';
import { Errors } from './errors';

/**
 * Input validation utilities
 */

interface ValidationRule {
  validate(value: any): boolean;
  message: string;
}

export class Validator {
  private errors: FieldError[] = [];

  reset() {
    this.errors = [];
    return this;
  }

  /**
   * Validate a single field
   */
  validateField(fieldName: string, value: any, rules: ValidationRule[]) {
    for (const rule of rules) {
      if (!rule.validate(value)) {
        this.errors.push({ field: fieldName, issue: rule.message });
        break; // Stop after first error per field
      }
    }
    return this;
  }

  /**
   * Check if validation passed
   */
  isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Throw validation error if any errors exist
   */
  throwIfInvalid(message: string = 'Invalid request payload') {
    if (!this.isValid()) {
      throw Errors.validationError(message, this.errors);
    }
  }

  /**
   * Get errors
   */
  getErrors(): FieldError[] {
    return this.errors;
  }
}

/**
 * Reusable validation rules
 */
export const Rules = {
  required: (): ValidationRule => ({
    validate: (value: any) => value !== undefined && value !== null && value !== '',
    message: 'This field is required',
  }),

  isEmail: (): ValidationRule => ({
    validate: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    message: 'Must be a valid email address',
  }),

  isUUID: (): ValidationRule => ({
    validate: (uuid: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid),
    message: 'Must be a valid UUID',
  }),

  isPositive: (): ValidationRule => ({
    validate: (value: number) => value > 0,
    message: 'Must be greater than 0',
  }),

  isEnum: (allowedValues: string[]): ValidationRule => ({
    validate: (value: string) => allowedValues.includes(value),
    message: `Must be one of: ${allowedValues.join(', ')}`,
  }),

  isISO8601: (): ValidationRule => ({
    validate: (date: string) => !isNaN(Date.parse(date)),
    message: 'Must be a valid ISO 8601 date',
  }),

  minLength: (length: number): ValidationRule => ({
    validate: (value: string) => !!(value && value.length >= length),
    message: `Must be at least ${length} characters`,
  }),

  maxLength: (length: number): ValidationRule => ({
    validate: (value: string) => !value || value.length <= length,
    message: `Must not exceed ${length} characters`,
  }),

  minValue: (min: number): ValidationRule => ({
    validate: (value: number) => value >= min,
    message: `Must be at least ${min}`,
  }),

  maxValue: (max: number): ValidationRule => ({
    validate: (value: number) => value <= max,
    message: `Must not exceed ${max}`,
  }),
};
