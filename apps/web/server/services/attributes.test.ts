import { describe, it, expect } from "vitest";
import { attributeKey } from "./attributes.js";

describe("attributeKey", () => {
  it("lowercases and replaces spaces with underscores", () => {
    expect(attributeKey("Sole Type")).toBe("sole_type");
  });

  it("handles multiple spaces", () => {
    expect(attributeKey("  Height  In CM  ")).toBe("height_in_cm");
  });

  it("removes special characters", () => {
    expect(attributeKey("Color!@#$%")).toBe("color");
  });

  it("collapses multiple underscores", () => {
    expect(attributeKey("a___b")).toBe("a_b");
  });

  it("trims leading/trailing underscores", () => {
    expect(attributeKey("_hello_")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(attributeKey("")).toBe("");
    expect(attributeKey("   ")).toBe("");
  });

  it("handles numbers", () => {
    expect(attributeKey("Size 8 UK")).toBe("size_8_uk");
  });

  it("unicode is stripped to underscores", () => {
    expect(attributeKey("farsh‌khāna")).toBe("farsh_kh_na");
  });
});
