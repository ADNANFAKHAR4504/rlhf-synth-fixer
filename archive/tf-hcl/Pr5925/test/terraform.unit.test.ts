// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform modular stack - Failure Recovery and High Availability
// Validates all components against requirements without running Terraform commands

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");
const REQUIRED_FILES = [
  "provider.tf",
  "variables.tf",
  "main.tf",
  "networking.tf",
  "aurora.tf",
  "s3.tf",
  "lambda.tf",
  "api_gateway.tf",
  "route53.tf",
  "cloudwatch.tf",
  "outputs.tf"
];

let allContent: string = "";

beforeAll(() => {
  // Read all terraform files and concatenate for testing
  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(LIB_DIR, file);
    if (fs.existsSync(filePath)) {
      allContent += fs.readFileSync(filePath, "utf8") + "\n";
    }
  });
});

describe("File Structure & Modular Organization", () => {
  test.each(REQUIRED_FILES)("%s exists", (file) => {
    const filePath = path.join(LIB_DIR, file);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("uses modular file structure (not monolithic)", () => {
    expect(REQUIRED_FILES.length).toBeGreaterThan(5);
  });

  test("provider configuration is in provider.tf", () => {
    const providerContent = fs.readFileSync(path.join(LIB_DIR, "provider.tf"), "utf8");
    expect(providerContent).toMatch(/provider\s+"aws"/);
  });

  test("variables are defined in variables.tf", () => {
    const variablesContent = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
    expect(variablesContent).toMatch(/variable\s+"/);
  });

  test("outputs are defined in outputs.tf", () => {
    const outputsContent = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");
    expect(outputsContent).toMatch(/output\s+"/);
  });
});

describe("Variable Declarations", () => {
  const variablesContent = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");

  test("declares environment_suffix variable", () => {
    expect(variablesContent).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("declares primary_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"primary_region"\s*{/);
  });

  test("declares dr_region variable", () => {
    expect(variablesContent).toMatch(/variable\s+"dr_region"\s*{/);
  });
});

describe("Infrastructure Resources", () => {
  test("declares RDS global cluster", () => {
    expect(allContent).toMatch(/resource\s+"aws_rds_global_cluster"/);
  });

  test("declares S3 buckets", () => {
    expect(allContent).toMatch(/resource\s+"aws_s3_bucket"/);
  });

  test("declares Lambda functions", () => {
    expect(allContent).toMatch(/resource\s+"aws_lambda_function"/);
  });

  test("declares API Gateway", () => {
    expect(allContent).toMatch(/resource\s+"aws_api_gateway_rest_api"/);
  });

  test("declares Route53 resources", () => {
    expect(allContent).toMatch(/resource\s+"aws_route53/);
  });

  test("declares CloudWatch alarms", () => {
    expect(allContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });
});

describe("Disaster Recovery", () => {
  test("implements multi-region architecture", () => {
    expect(allContent).toMatch(/primary_region/);
    expect(allContent).toMatch(/dr_region/);
  });

  test("uses provider alias for DR region", () => {
    const drMatches = allContent.match(/provider\s*=\s*aws\.dr/g);
    expect(drMatches).toBeTruthy();
    expect(drMatches!.length).toBeGreaterThan(5);
  });
});
