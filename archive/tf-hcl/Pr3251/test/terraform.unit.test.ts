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

  test("contains SQS queue resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_sqs_queue"/);
  });

  test("contains Lambda function resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lambda_function"/);
  });

  test("contains DynamoDB table resource", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"/);
  });

  test("has environment_suffix variable for resource naming", () => {
    const variablesPath = path.join(libPath, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"environment_suffix"/);
  });

  test("outputs.tf exists and has outputs", () => {
    const outputsPath = path.join(libPath, "outputs.tf");
    const exists = fs.existsSync(outputsPath);
    expect(exists).toBe(true);
    
    if (exists) {
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"/);
    }
  });

  test("Lambda function files exist", () => {
    const healthCheckPath = path.join(libPath, "health_check.py");
    const quizProcessorPath = path.join(libPath, "quiz_processor.py");
    
    expect(fs.existsSync(healthCheckPath)).toBe(true);
    expect(fs.existsSync(quizProcessorPath)).toBe(true);
  });

  test("Lambda functions have proper AWS imports", () => {
    const healthCheckPath = path.join(libPath, "health_check.py");
    const quizProcessorPath = path.join(libPath, "quiz_processor.py");
    
    const healthCheckContent = fs.readFileSync(healthCheckPath, "utf8");
    const quizProcessorContent = fs.readFileSync(quizProcessorPath, "utf8");
    
    expect(healthCheckContent).toMatch(/import boto3/);
    expect(quizProcessorContent).toMatch(/import boto3/);
  });
});
