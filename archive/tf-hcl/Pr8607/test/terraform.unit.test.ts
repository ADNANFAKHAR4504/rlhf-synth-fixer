// tests/unit/unit-tests.ts
// Unit tests for Terraform HCL infrastructure files
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");
const stackPath = path.join(libPath, "tap_stack.tf");
const variablesPath = path.join(libPath, "variables.tf");
const providerPath = path.join(libPath, "provider.tf");
const outputsPath = path.join(libPath, "outputs.tf");
const lambdaPath = path.join(libPath, "lambda_function.py");

describe("Terraform Infrastructure Files", () => {
  describe("Core Files Existence", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(variablesPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("lambda_function.py exists", () => {
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });
  });

  describe("tap_stack.tf Structure", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(stackPath, "utf8");
    });

    test("defines Lambda function resource", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"serverless_function"/);
    });

    test("defines API Gateway REST API resource", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"serverless_api"/);
    });

    test("defines Lambda execution role", () => {
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_execution_role"/);
    });

    test("defines API Gateway deployment", () => {
      expect(content).toMatch(/resource\s+"aws_api_gateway_deployment"\s+"api_deployment"/);
    });

    test("defines Lambda permission for API Gateway", () => {
      expect(content).toMatch(/resource\s+"aws_lambda_permission"\s+"api_gateway_invoke"/);
    });

    test("uses environment suffix in naming", () => {
      expect(content).toMatch(/local\.env_suffix/);
    });
  });

  describe("variables.tf Structure", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(variablesPath, "utf8");
    });

    test("declares aws_region variable", () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares lambda_function_name variable", () => {
      expect(content).toMatch(/variable\s+"lambda_function_name"\s*{/);
    });

    test("declares api_gateway_name variable", () => {
      expect(content).toMatch(/variable\s+"api_gateway_name"\s*{/);
    });

    test("declares lambda_runtime variable", () => {
      expect(content).toMatch(/variable\s+"lambda_runtime"\s*{/);
    });

    test("sets default region to us-west-2", () => {
      expect(content).toMatch(/default\s*=\s*"us-west-2"/);
    });
  });

  describe("provider.tf Structure", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(providerPath, "utf8");
    });

    test("declares AWS provider", () => {
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test("uses aws_region variable for provider region", () => {
      expect(content).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("requires Terraform version >= 1.4.0", () => {
      expect(content).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });

    test("declares archive provider for Lambda ZIP", () => {
      expect(content).toMatch(/archive\s*=\s*{/);
    });
  });

  describe("outputs.tf Structure", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(outputsPath, "utf8");
    });

    test("outputs API Gateway URL", () => {
      expect(content).toMatch(/output\s+"api_gateway_url"/);
    });

    test("outputs Lambda function name", () => {
      expect(content).toMatch(/output\s+"lambda_function_name"/);
    });

    test("outputs Lambda function ARN", () => {
      expect(content).toMatch(/output\s+"lambda_function_arn"/);
    });

    test("outputs environment suffix", () => {
      expect(content).toMatch(/output\s+"environment_suffix"/);
    });
  });

  describe("Lambda Function Python Code", () => {
    let content: string;

    beforeAll(() => {
      content = fs.readFileSync(lambdaPath, "utf8");
    });

    test("defines lambda_handler function", () => {
      expect(content).toMatch(/def\s+lambda_handler\s*\(/);
    });

    test("imports required modules", () => {
      expect(content).toMatch(/import\s+json/);
      expect(content).toMatch(/import\s+os/);
      expect(content).toMatch(/import\s+logging/);
    });

    test("returns proper API Gateway response format", () => {
      expect(content).toMatch(/'statusCode':\s*200/);
      expect(content).toMatch(/'headers'/);
      expect(content).toMatch(/'body'/);
    });

    test("includes CORS headers", () => {
      expect(content).toMatch(/'Access-Control-Allow-Origin'/);
    });
  });

  describe("Security Best Practices", () => {
    let stackContent: string;
    let variablesContent: string;

    beforeAll(() => {
      stackContent = fs.readFileSync(stackPath, "utf8");
      variablesContent = fs.readFileSync(variablesPath, "utf8");
    });

    test("Lambda role uses least privilege principle", () => {
      expect(stackContent).toMatch(/AWSLambdaBasicExecutionRole/);
    });

    test("CloudWatch logs permission is scoped to specific log group", () => {
      expect(stackContent).toMatch(/log-group:\$\{local\.log_group_name\}/);
    });

    test("Resources are tagged", () => {
      expect(stackContent).toMatch(/tags\s*=\s*var\.tags/);
    });

    test("No hardcoded credentials in variables", () => {
      expect(variablesContent).not.toMatch(/aws_access_key/);
      expect(variablesContent).not.toMatch(/aws_secret_key/);
    });

    test("Lambda function has timeout configured", () => {
      expect(stackContent).toMatch(/timeout\s*=\s*\d+/);
    });

    test("CloudWatch log retention is configured", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });
  });
});
