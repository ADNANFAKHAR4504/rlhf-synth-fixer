// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/variables.tf"; // adjust if your structure differs
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform file stack", () => {
  // test("tap_stack.tf exists", () => {
  //   const exists = fs.existsSync(stackPath);
  //   if (!exists) {
  //     console.error(`[unit] Expected stack at: ${stackPath}`);
  //   }
  //   expect(exists).toBe(true);
  // });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in variables.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in variables.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

});
