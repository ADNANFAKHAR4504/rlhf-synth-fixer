// tests/unit/unit-tests.ts
// Simple presence + sanity checks for Terraform multi-file structure
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const mainPath = path.join(LIB_DIR, "main.tf");
const providerPath = path.join(LIB_DIR, "provider.tf");
const variablesPath = path.join(LIB_DIR, "variables.tf");
const outputsPath = path.join(LIB_DIR, "outputs.tf");

describe("Terraform multi-file structure", () => {
  test("main.tf exists", () => {
    const exists = fs.existsSync(mainPath);
    if (!exists) {
      console.error(`[unit] Expected main.tf at: ${mainPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf exists", () => {
    const exists = fs.existsSync(providerPath);
    if (!exists) {
      console.error(`[unit] Expected provider.tf at: ${providerPath}`);
    }
    expect(exists).toBe(true);
  });

  test("variables.tf exists", () => {
    const exists = fs.existsSync(variablesPath);
    if (!exists) {
      console.error(`[unit] Expected variables.tf at: ${variablesPath}`);
    }
    expect(exists).toBe(true);
  });

  test("outputs.tf exists", () => {
    const exists = fs.existsSync(outputsPath);
    if (!exists) {
      console.error(`[unit] Expected outputs.tf at: ${outputsPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("provider is declared in provider.tf", () => {
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("aws_region variable is declared in variables.tf", () => {
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("main.tf does NOT declare provider (provider.tf owns providers)", () => {
    const content = fs.readFileSync(mainPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });
});
