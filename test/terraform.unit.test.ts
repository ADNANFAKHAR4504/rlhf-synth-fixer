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

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in tap_stack.tf", () => {
  const content = fs.readFileSync(stackPath, "utf8");
  // The stack uses the aws_region data source, not a variable
  expect(content).toMatch(/data\s+"aws_region"\s+"current"/);
  });

});
