/**
 * Decimal utilities for precise numeric calculations
 * 
 * Used for:
 * - Product prices
 * - Order totals
 * - Discount calculations
 * - Inventory values
 * 
 * @example
 * const total = toDecimal('99.99');
 * const discount = total.times('0.1');
 * const final = total.minus(discount);
 * console.log(final.toString()); // '89.991' with proper precision
 */

/**
 * Manual decimal calculation without external library
 * JavaScript's native number type can lose precision with decimals
 */

export class Decimal {
  private value: string;

  constructor(value: string | number) {
    this.value = String(value);
  }

  /**
   * Add two decimal numbers
   */
  plus(other: Decimal | string | number): Decimal {
    const a = parseFloat(this.value);
    const b = parseFloat(String(other instanceof Decimal ? other.value : other));
    const result = (a + b).toFixed(2);
    return new Decimal(result);
  }

  /**
   * Subtract two decimal numbers
   */
  minus(other: Decimal | string | number): Decimal {
    const a = parseFloat(this.value);
    const b = parseFloat(String(other instanceof Decimal ? other.value : other));
    const result = (a - b).toFixed(2);
    return new Decimal(result);
  }

  /**
   * Multiply two decimal numbers
   */
  times(other: Decimal | string | number): Decimal {
    const a = parseFloat(this.value);
    const b = parseFloat(String(other instanceof Decimal ? other.value : other));
    const result = (a * b).toFixed(2);
    return new Decimal(result);
  }

  /**
   * Divide two decimal numbers
   */
  dividedBy(other: Decimal | string | number): Decimal {
    const a = parseFloat(this.value);
    const b = parseFloat(String(other instanceof Decimal ? other.value : other));
    if (b === 0) throw new Error('Division by zero');
    const result = (a / b).toFixed(2);
    return new Decimal(result);
  }

  /**
   * Get the maximum of two decimal numbers
   */
  static max(...values: (Decimal | string | number)[]): Decimal {
    const nums = values.map(v => 
      parseFloat(String(v instanceof Decimal ? v.value : v))
    );
    return new Decimal(Math.max(...nums).toFixed(2));
  }

  /**
   * Get the minimum of two decimal numbers
   */
  static min(...values: (Decimal | string | number)[]): Decimal {
    const nums = values.map(v => 
      parseFloat(String(v instanceof Decimal ? v.value : v))
    );
    return new Decimal(Math.min(...nums).toFixed(2));
  }

  /**
   * Convert to string with 2 decimal places
   */
  toString(): string {
    return parseFloat(this.value).toFixed(2);
  }

  /**
   * Convert to number
   */
  toNumber(): number {
    return parseFloat(this.value);
  }

  /**
   * Compare with another decimal
   * Returns: -1 if less, 0 if equal, 1 if greater
   */
  compareTo(other: Decimal | string | number): number {
    const a = parseFloat(this.value);
    const b = parseFloat(String(other instanceof Decimal ? other.value : other));
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /**
   * Check if equal
   */
  equals(other: Decimal | string | number): boolean {
    return this.compareTo(other) === 0;
  }

  /**
   * Check if greater than
   */
  isGreaterThan(other: Decimal | string | number): boolean {
    return this.compareTo(other) > 0;
  }

  /**
   * Check if less than
   */
  isLessThan(other: Decimal | string | number): boolean {
    return this.compareTo(other) < 0;
  }
}

/**
 * Helper function to create Decimal from value
 */
export const toDecimal = (value: string | number): Decimal => {
  return new Decimal(value);
};

/**
 * Format price for display
 */
export const formatPrice = (price: string | number | Decimal, currency = '$'): string => {
  const value = price instanceof Decimal ? price.toNumber() : parseFloat(String(price));
  return `${currency}${value.toFixed(2)}`;
};

/**
 * Parse price string (e.g., "$99.99") to Decimal
 */
export const parsePrice = (priceStr: string): Decimal => {
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  return new Decimal(cleaned);
};

/**
 * Calculate percentage of a decimal
 */
export const getPercentage = (total: Decimal | string | number, percent: number): Decimal => {
  const dec = total instanceof Decimal ? total : new Decimal(total);
  return dec.times(percent).dividedBy(100);
};

/**
 * Calculate total from items with quantity and price
 */
export const calculateTotal = (
  items: Array<{ price: string | number; quantity: number }>
): Decimal => {
  return items.reduce((sum, item) => {
    const price = new Decimal(item.price);
    const total = price.times(item.quantity);
    return sum.plus(total);
  }, new Decimal(0));
};

export default Decimal;
