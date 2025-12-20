// tests/unit/unit-tests.ts
// Simple presence + sanity checks for Terraform project
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const VARIABLES_REL = "../lib/variables.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);

describe("Terraform modular stack structure", () => {
  test("tap_stack.tf exists as entry point marker", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in variables.tf", () => {
    const exists = fs.existsSync(variablesPath);
    expect(exists).toBe(true);
    
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });
});
