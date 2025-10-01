// tests/unit/unit-tests.ts
// Simple presence + sanity checks for lib/main.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const libPath = path.resolve(process.cwd(), "lib");
const stackPath = path.join(libPath, "main.tf");

describe("Terraform main stack: main.tf", () => {
  test("main.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("declares provider in main.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in variables.tf", () => {
    const variablesPath = path.join(libPath, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

});
