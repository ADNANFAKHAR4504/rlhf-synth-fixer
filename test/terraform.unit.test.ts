// tests/unit/unit-tests.ts
// Simple presence + sanity checks for Terraform modular structure
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const libDir = path.resolve(__dirname, "../lib");
const providerPath = path.join(libDir, "provider.tf");
const variablesPath = path.join(libDir, "variables.tf");

describe("Terraform modular infrastructure", () => {
  test("lib directory exists with Terraform files", () => {
    const exists = fs.existsSync(libDir);
    if (!exists) {
      console.error(`[unit] Expected lib directory at: ${libDir}`);
    }
    expect(exists).toBe(true);

    // Check for required files
    const requiredFiles = ['provider.tf', 'variables.tf', 'vpc.tf', 'outputs.tf'];
    requiredFiles.forEach(file => {
      const filePath = path.join(libDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("provider configuration is in provider.tf", () => {
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in variables.tf", () => {
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

});
