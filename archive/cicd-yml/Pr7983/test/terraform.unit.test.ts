// test/terraform.unit.test.ts
// Comprehensive unit tests for Terraform CI/CD Pipeline
// Validates structure, resources, variables, and compliance with requirements

import fs from "fs";
import path from "path";

const MAIN_TF_REL = "../lib/main.tf";
const PROVIDER_REL = "../lib/provider.tf";
const VARIABLES_REL = "../lib/variables.tf";
const OUTPUTS_REL = "../lib/outputs.tf";

const mainPath = path.resolve(__dirname, MAIN_TF_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);
const variablesPath = path.resolve(__dirname, VARIABLES_REL);
const outputsPath = path.resolve(__dirname, OUTPUTS_REL);

let mainContent: string;
let providerContent: string;
let variablesContent: string;
let outputsContent: string;

beforeAll(() => {
  mainContent = fs.readFileSync(mainPath, "utf8");
  providerContent = fs.readFileSync(providerPath, "utf8");
  variablesContent = fs.readFileSync(variablesPath, "utf8");
  outputsContent = fs.readFileSync(outputsPath, "utf8");
});

describe("Pipeline Infrastructure Tests", () => {
  test("all files exist and readable", () => {
    expect(fs.existsSync(mainPath)).toBe(true);
    expect(fs.existsSync(providerPath)).toBe(true);
    expect(fs.existsSync(variablesPath)).toBe(true);
    expect(fs.existsSync(outputsPath)).toBe(true);
  });

  test("creates KMS key with rotation", () => {
    expect(mainContent).toMatch(/resource\s+"aws_kms_key"\s+"pipeline"/);
    expect(mainContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates S3 buckets with environment_suffix", () => {
    expect(mainContent).toMatch(/terraform-pipeline-artifacts-\$\{var\.environment_suffix\}/);
    expect(mainContent).toMatch(/terraform-state-\$\{var\.environment_suffix\}/);
  });

  test("creates CodePipeline with four stages", () => {
    const pipeline = mainContent.match(/resource\s+"aws_codepipeline"\s+"terraform_pipeline"[\s\S]*?(?=\nresource\s+"|$)/);
    expect(pipeline).toBeTruthy();
    expect(pipeline![0]).toMatch(/name\s*=\s*"Source"/);
    expect(pipeline![0]).toMatch(/name\s*=\s*"Plan"/);
    expect(pipeline![0]).toMatch(/name\s*=\s*"Approval"/);
    expect(pipeline![0]).toMatch(/name\s*=\s*"Apply"/);
  });

  test("outputs all required values", () => {
    expect(outputsContent).toMatch(/pipeline_name/);
    expect(outputsContent).toMatch(/pipeline_arn/);
    expect(outputsContent).toMatch(/artifacts_bucket/);
    expect(outputsContent).toMatch(/state_bucket/);
  });
});
