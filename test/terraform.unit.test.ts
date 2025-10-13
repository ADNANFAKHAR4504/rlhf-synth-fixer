// Simple presence + sanity checks for ../lib/tap_stack.tf
// No Terraform commands are executed.

import fs from "fs";
import path from "path";
import { readTextFileSync, validateRequiredStackShapes } from "../lib/terraformValidators";

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
    const content = readTextFileSync(stackPath);
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares key services and outputs", () => {
    const content = readTextFileSync(stackPath);
    const summary = validateRequiredStackShapes(content);
    // Services presence
    expect(summary.resources.s3_raw).toBe(true);
    expect(summary.resources.s3_processed).toBe(true);
    expect(summary.resources.s3_artifacts).toBe(true);
    expect(summary.resources.lambda_pre).toBe(true);
    expect(summary.resources.sfn).toBe(true);
    expect(summary.resources.ddb).toBe(true);
    expect(summary.resources.sagemaker_ep).toBe(true);
    // Outputs presence
    expect(summary.outputs.s3_buckets).toBe(true);
    expect(summary.outputs.lambda_function).toBe(true);
    expect(summary.outputs.step_functions_state_machine).toBe(true);
    expect(summary.outputs.sagemaker_endpoint).toBe(true);
    expect(summary.outputs.dynamodb_table).toBe(true);
    expect(summary.outputs.kms_keys).toBe(true);
  });

});
