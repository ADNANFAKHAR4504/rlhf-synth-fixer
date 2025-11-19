// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("provider declared in provider.tf (separate file)", () => {
    const providerPath = path.resolve(__dirname, "../lib/provider.tf");
    const providerExists = fs.existsSync(providerPath);

    if (providerExists) {
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/\bprovider\s+"aws"\s*{/);
    } else {
      // If provider.tf doesn't exist, check tap_stack.tf
      const content = fs.readFileSync(stackPath, "utf8");
      expect(content).toMatch(/\bprovider\s+"aws"\s*{/);
    }
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

});
