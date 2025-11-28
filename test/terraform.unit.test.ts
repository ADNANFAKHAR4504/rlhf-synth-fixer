// tests/unit/unit-tests.ts
// Simple presence + sanity checks for modular Terraform structure
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");
const mainTfPath = path.join(libPath, "main.tf");
const providerTfPath = path.join(libPath, "provider.tf");
const variablesTfPath = path.join(libPath, "variables.tf");
const outputsTfPath = path.join(libPath, "outputs.tf");

describe("Terraform modular stack structure", () => {
  test("main.tf exists", () => {
    const exists = fs.existsSync(mainTfPath);
    if (!exists) {
      console.error(`[unit] Expected main.tf at: ${mainTfPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider.tf exists and declares AWS provider", () => {
    const exists = fs.existsSync(providerTfPath);
    expect(exists).toBe(true);
    const content = fs.readFileSync(providerTfPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("variables.tf exists and declares required variables", () => {
    const exists = fs.existsSync(variablesTfPath);
    expect(exists).toBe(true);
    const content = fs.readFileSync(variablesTfPath, "utf8");
    // Check for environment_suffix variable (required for uniqueness)
    expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("outputs.tf exists", () => {
    const exists = fs.existsSync(outputsTfPath);
    expect(exists).toBe(true);
  });

  test("modules directory exists", () => {
    const modulesPath = path.join(libPath, "modules");
    const exists = fs.existsSync(modulesPath);
    expect(exists).toBe(true);
  });

  test("main.tf does NOT declare provider (provider.tf owns providers)", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).not.toMatch(/provider\s+"aws"\s*{/);
  });

  test("main.tf references modules correctly", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    // Check for module declarations
    expect(content).toMatch(/module\s+"/);
  });
});
