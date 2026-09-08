import { describe, it, expect } from "vitest";
import { computeGst } from "./tax.js";
import type { TaxConfigData } from "./tax.js";

describe("computeGst", () => {
  const config18: TaxConfigData = { gstRate: 18, gstFreeAbove: 0 };
  const configWithCap: TaxConfigData = { gstRate: 18, gstFreeAbove: 5000 };

  it("returns 0 when subtotal <= 0", () => {
    expect(computeGst(config18, 0)).toBe(0);
    expect(computeGst(config18, -100)).toBe(0);
  });

  it("returns 0 when gstRate <= 0", () => {
    expect(computeGst({ gstRate: 0, gstFreeAbove: 0 }, 1000)).toBe(0);
    expect(computeGst({ gstRate: -5, gstFreeAbove: 0 }, 1000)).toBe(0);
  });

  it("computes 18% GST correctly", () => {
    expect(computeGst(config18, 1000)).toBe(180);
    expect(computeGst(config18, 2500)).toBe(450);
  });

  it("rounds GST to nearest integer", () => {
    expect(computeGst(config18, 999)).toBe(180); // 179.82
  });

  it("skips GST when subtotal >= gstFreeAbove", () => {
    expect(computeGst(configWithCap, 5000)).toBe(0);
    expect(computeGst(configWithCap, 10000)).toBe(0);
  });

  it("charges GST when subtotal < gstFreeAbove", () => {
    expect(computeGst(configWithCap, 4999)).toBe(900); // 4999 * 0.18 = 899.82
  });

  it("gstFreeAbove = 0 disables the waiver", () => {
    expect(computeGst({ gstRate: 18, gstFreeAbove: 0 }, 10000)).toBe(1800);
  });
});
