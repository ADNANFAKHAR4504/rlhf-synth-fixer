// tests/unit/unit-tests.ts
// Simple presence + sanity checks for Terraform configuration files
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const mainTfPath = path.join(LIB_DIR, "main.tf");
const variablesTfPath = path.join(LIB_DIR, "variables.tf");

describe("Terraform multi-file configuration", () => {
  test("main.tf exists", () => {
    const exists = fs.existsSync(mainTfPath);
    if (!exists) {
      console.error(`[unit] Expected main.tf at: ${mainTfPath}`);
    }
    expect(exists).toBe(true);
  });

  test("variables.tf exists", () => {
    const exists = fs.existsSync(variablesTfPath);
    if (!exists) {
      console.error(`[unit] Expected variables.tf at: ${variablesTfPath}`);
    }
    expect(exists).toBe(true);
  });

  test("provider is declared in main.tf", () => {
    const content = fs.readFileSync(mainTfPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("aws_region variable is declared in variables.tf", () => {
    const content = fs.readFileSync(variablesTfPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

});
