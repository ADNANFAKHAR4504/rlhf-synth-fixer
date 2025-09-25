/**
 * Live validation tests for tap_stack.tf
 * Expanded to cover resource existence, naming, tags, and IAM policy structure.
 */

import fs from "fs";

const tfFile = fs.readFileSync("tap_stack.tf", "utf8");

describe("Terraform tap_stack.tf validation", () => {
  //
  // VPC
  //
  test("should define a VPC named main", () => {
    expect(tfFile).toMatch(/resource\s+"aws_vpc"\s+"main"/);
  });

  //
  // CloudWatch Log Group
  //
  test("should define a CloudWatch log group for VPC flow logs", () => {
    expect(tfFile).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"/);
  });

  test("CloudWatch log group should set retention_in_days", () => {
    expect(tfFile).toMatch(/retention_in_days\s*=\s*\d+/);
  });

  //
  // IAM Role & Policy
  //
  test("should define an IAM role for flow logs", () => {
    expect(tfFile).toMatch(/resource\s+"aws_iam_role"\s+"vpc_flow_logs"/);
  });

  test("IAM role should allow vpc-flow-logs.amazonaws.com service to assume it", () => {
    expect(tfFile).toMatch(/"Service"\s*:\s*\["vpc-flow-logs.amazonaws.com"\]/);
  });

  test("should define an IAM role policy for flow logs", () => {
    expect(tfFile).toMatch(/resource\s+"aws_iam_role_policy"\s+"vpc_flow_logs"/);
  });

  test("IAM role policy should include logs:CreateLogStream", () => {
    expect(tfFile).toMatch(/"logs:CreateLogStream"/);
  });

  test("IAM role policy should include logs:PutLogEvents", () => {
    expect(tfFile).toMatch(/"logs:PutLogEvents"/);
  });

  //
  // Flow Logs
  //
  test("should define a VPC flow log resource", () => {
    expect(tfFile).toMatch(/resource\s+"aws_flow_log"\s+"main"/);
  });

  test("VPC flow log should capture ALL traffic", () => {
    expect(tfFile).toMatch(/traffic_type\s*=\s*"ALL"/);
  });

  test("VPC flow log should use log_destination set to CloudWatch log group ARN", () => {
    expect(tfFile).toMatch(/log_destination\s*=\s*aws_cloudwatch_log_group\.vpc_flow_logs\.arn/);
  });

  test("VPC flow log should reference IAM role", () => {
    expect(tfFile).toMatch(/iam_role_arn\s*=\s*aws_iam_role\.vpc_flow_logs\.arn/);
  });

  //
  // Tags
  //
  test("resources should apply common_tags merge", () => {
    expect(tfFile).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
  });
});
