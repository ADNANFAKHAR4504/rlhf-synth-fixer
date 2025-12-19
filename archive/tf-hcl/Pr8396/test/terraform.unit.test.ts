// tests/unit/unit-tests.ts
// Simple presence + sanity checks for ../lib/main.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/main.tf"; // Path to the single-file Terraform stack
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: main.tf", () => {
  test("main.tf exists", () => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      console.error(`[unit] Expected stack at: ${stackPath}`);
    }
    expect(exists).toBe(true);
  });

  // --- Optional sanity checks (keep lightweight) ---

  test("does NOT declare provider in main.tf (provider.tf owns providers)", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable in main.tf", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("contains expected resources", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check for key resources
    expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"app_table"/);
    expect(content).toMatch(/resource\s+"aws_lambda_function"\s+"app_function"/);
    expect(content).toMatch(/resource\s+"aws_api_gateway_rest_api"\s+"app_api"/);
    expect(content).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
    expect(content).toMatch(/resource\s+"random_id"\s+"suffix"/);
  });

  test("has proper outputs section", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check for outputs
    expect(content).toMatch(/output\s+"api_gateway_url"/);
    expect(content).toMatch(/output\s+"lambda_function_name"/);
    expect(content).toMatch(/output\s+"dynamodb_table_name"/);
    expect(content).toMatch(/output\s+"aws_region"/);
  });

  test("follows security best practices", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check for IAM policies and proper permissions
    expect(content).toMatch(/aws_iam_role/);
    expect(content).toMatch(/aws_iam_policy/);
    expect(content).toMatch(/aws_iam_role_policy_attachment/);
    
    // Check for DynamoDB permissions
    expect(content).toMatch(/dynamodb:GetItem/);
    expect(content).toMatch(/dynamodb:PutItem/);
    expect(content).toMatch(/dynamodb:UpdateItem/);
    expect(content).toMatch(/dynamodb:DeleteItem/);
    
    // Check for CloudWatch Logs permissions
    expect(content).toMatch(/logs:CreateLogGroup/);
    expect(content).toMatch(/logs:CreateLogStream/);
    expect(content).toMatch(/logs:PutLogEvents/);
  });

  test("uses proper resource naming with suffix", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check for suffix-based naming patterns
    expect(content).toMatch(/\$\{local\.name_prefix\}/);
    expect(content).toMatch(/\$\{local\.suffix_hex\}/);
    
    // Check for variables needed for naming
    expect(content).toMatch(/variable\s+"project"/);
    expect(content).toMatch(/variable\s+"environment"/);
    expect(content).toMatch(/variable\s+"suffix"/);
  });

  test("includes proper tagging", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check for common tags usage
    expect(content).toMatch(/merge\(local\.common_tags/);
    expect(content).toMatch(/common_tags\s*=/);
    
    // Check for required tag fields
    expect(content).toMatch(/Project/);
    expect(content).toMatch(/Environment/);
    expect(content).toMatch(/ManagedBy/);
    expect(content).toMatch(/Owner/);
  });

  test("has lambda memory_size configured", () => {
    const content = fs.readFileSync(stackPath, "utf8");
    
    // Check that Lambda function has memory_size specified
    expect(content).toMatch(/memory_size\s*=\s*256/);
  });

});
