import { describe, it, expect } from "vitest";
import { computeDeliveryFee, INDIAN_STATES } from "./delivery.js";
import type { DeliveryConfigData } from "./delivery.js";

const defaultConfig: DeliveryConfigData = {
  defaultFee: 120,
  stateFees: [{ state: "Uttar Pradesh", fee: 80 }],
  freeDeliveryThreshold: 2499,
};

describe("computeDeliveryFee", () => {
  it("returns 0 for subtotal >= freeDeliveryThreshold", () => {
    expect(computeDeliveryFee(defaultConfig, 2499)).toBe(0);
    expect(computeDeliveryFee(defaultConfig, 3000)).toBe(0);
  });

  it("returns 0 for subtotal <= 0", () => {
    expect(computeDeliveryFee(defaultConfig, 0)).toBe(0);
    expect(computeDeliveryFee(defaultConfig, -100)).toBe(0);
  });

  it("returns state fee when state matches", () => {
    expect(computeDeliveryFee(defaultConfig, 500, "Uttar Pradesh")).toBe(80);
  });

  it("state match is case-insensitive", () => {
    expect(computeDeliveryFee(defaultConfig, 500, "uttar pradesh")).toBe(80);
    expect(computeDeliveryFee(defaultConfig, 500, "UTTAR PRADESH")).toBe(80);
  });

  it("returns defaultFee for non-matching state", () => {
    expect(computeDeliveryFee(defaultConfig, 500, "Maharashtra")).toBe(120);
  });

  it("returns defaultFee when no state provided", () => {
    expect(computeDeliveryFee(defaultConfig, 500)).toBe(120);
  });

  it("returns defaultFee for empty string state", () => {
    expect(computeDeliveryFee(defaultConfig, 500, "")).toBe(120);
  });

  it("INDIAN_STATES has 36 entries", () => {
    expect(INDIAN_STATES.length).toBe(36);
  });
});
