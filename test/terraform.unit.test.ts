// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf"; // adjust if your structure differs
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  test("tap_stack.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("provider.tf exists and defines required providers", () => {
    const exists = fs.existsSync(providerPath);
    expect(exists).toBe(true);
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/required_providers\s*{[\s\S]*aws\s*=\s*{[\s\S]*source\s*=\s*"hashicorp\/aws"/);
    expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*region\s*=\s*"us-east-1"/);
    expect(content).toMatch(/provider\s+"aws"\s*{[\s\S]*alias\s*=\s*"eu_west_1"[\s\S]*region\s*=\s*"eu-west-1"/);
  });
});
