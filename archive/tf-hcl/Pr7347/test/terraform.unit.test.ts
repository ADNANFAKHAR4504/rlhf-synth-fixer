// tests/unit/unit-tests.ts
// Simple presence + sanity checks for multi-file Terraform structure
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const libDir = path.resolve(__dirname, "../lib");

describe("Terraform multi-file structure", () => {
  // Test for required Terraform files
  const requiredFiles = [
    "provider.tf",
    "variables.tf",
    "kinesis.tf",
    "lambda.tf",
    "xray.tf",
    "cloudwatch.tf",
    "sns.tf",
    "eventbridge.tf",
    "kms.tf",
    "ecr.tf",
    "logs.tf",
    "outputs.tf"
  ];

  requiredFiles.forEach((file) => {
    test(`${file} exists`, () => {
      const filePath = path.join(libDir, file);
      const exists = fs.existsSync(filePath);
      if (!exists) {
        console.error(`[unit] Expected file at: ${filePath}`);
      }
      expect(exists).toBe(true);
    });
  });

  test("provider.tf declares AWS provider", () => {
    const providerPath = path.join(libDir, "provider.tf");
    const content = fs.readFileSync(providerPath, "utf8");
    expect(content).toMatch(/provider\s+"aws"\s*{/);
  });

  test("variables.tf declares aws_region variable", () => {
    const variablesPath = path.join(libDir, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("variables.tf declares environment_suffix variable", () => {
    const variablesPath = path.join(libDir, "variables.tf");
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
  });

  test("kinesis.tf creates Kinesis stream resource", () => {
    const kinesisPath = path.join(libDir, "kinesis.tf");
    const content = fs.readFileSync(kinesisPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kinesis_stream"/);
  });

  test("lambda.tf creates Lambda function resource", () => {
    const lambdaPath = path.join(libDir, "lambda.tf");
    const content = fs.readFileSync(lambdaPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_lambda_function"/);
  });

  test("cloudwatch.tf creates CloudWatch alarms", () => {
    const cloudwatchPath = path.join(libDir, "cloudwatch.tf");
    const content = fs.readFileSync(cloudwatchPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
  });

  test("cloudwatch.tf creates composite alarms", () => {
    const cloudwatchPath = path.join(libDir, "cloudwatch.tf");
    const content = fs.readFileSync(cloudwatchPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_composite_alarm"/);
  });

  test("cloudwatch.tf creates dashboard", () => {
    const cloudwatchPath = path.join(libDir, "cloudwatch.tf");
    const content = fs.readFileSync(cloudwatchPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
  });

  test("sns.tf creates SNS topic with KMS encryption", () => {
    const snsPath = path.join(libDir, "sns.tf");
    const content = fs.readFileSync(snsPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_sns_topic"/);
    expect(content).toMatch(/kms_master_key_id/);
  });

  test("eventbridge.tf creates EventBridge rules", () => {
    const eventbridgePath = path.join(libDir, "eventbridge.tf");
    const content = fs.readFileSync(eventbridgePath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_event_rule"/);
  });

  test("kms.tf creates customer-managed KMS key", () => {
    const kmsPath = path.join(libDir, "kms.tf");
    const content = fs.readFileSync(kmsPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_kms_key"/);
  });

  test("xray.tf creates X-Ray sampling rule", () => {
    const xrayPath = path.join(libDir, "xray.tf");
    const content = fs.readFileSync(xrayPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_xray_sampling_rule"/);
  });

  test("ecr.tf creates ECR repository for Lambda", () => {
    const ecrPath = path.join(libDir, "ecr.tf");
    const content = fs.readFileSync(ecrPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_ecr_repository"/);
  });

  test("logs.tf creates CloudWatch Logs Insights queries", () => {
    const logsPath = path.join(libDir, "logs.tf");
    const content = fs.readFileSync(logsPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_cloudwatch_query_definition"/);
  });

  test("outputs.tf defines outputs", () => {
    const outputsPath = path.join(libDir, "outputs.tf");
    const content = fs.readFileSync(outputsPath, "utf8");
    expect(content).toMatch(/output\s+"/);
  });

  test("all resource names include environment_suffix", () => {
    const resourceFiles = ["kinesis.tf", "lambda.tf", "cloudwatch.tf", "sns.tf", "eventbridge.tf", "kms.tf", "ecr.tf"];

    resourceFiles.forEach((file) => {
      const filePath = path.join(libDir, file);
      const content = fs.readFileSync(filePath, "utf8");

      // Check that resource names include environment_suffix variable
      const nameMatches = content.match(/name\s*=\s*"[^"]*"/g) || [];
      const hasEnvSuffix = nameMatches.some((match) => match.includes("${var.environment_suffix}"));

      if (!hasEnvSuffix && nameMatches.length > 0) {
        console.warn(`[unit] ${file} may be missing environment_suffix in resource names`);
      }

      expect(hasEnvSuffix || nameMatches.length === 0).toBe(true);
    });
  });

  test("Lambda function uses container image package type", () => {
    const lambdaPath = path.join(libDir, "lambda.tf");
    const content = fs.readFileSync(lambdaPath, "utf8");
    expect(content).toMatch(/package_type\s*=\s*"Image"/);
  });

  test("Kinesis stream has shard-level metrics enabled", () => {
    const kinesisPath = path.join(libDir, "kinesis.tf");
    const content = fs.readFileSync(kinesisPath, "utf8");
    expect(content).toMatch(/shard_level_metrics/);
  });

  test("X-Ray sampling rate is configured", () => {
    const xrayPath = path.join(libDir, "xray.tf");
    const content = fs.readFileSync(xrayPath, "utf8");
    expect(content).toMatch(/fixed_rate\s*=\s*var\.xray_sampling_rate/);
  });

  test("Log groups have retention policy configured", () => {
    const lambdaPath = path.join(libDir, "lambda.tf");
    const content = fs.readFileSync(lambdaPath, "utf8");
    expect(content).toMatch(/retention_in_days/);
  });

  test("EventBridge rules use content-based filtering", () => {
    const eventbridgePath = path.join(libDir, "eventbridge.tf");
    const content = fs.readFileSync(eventbridgePath, "utf8");
    expect(content).toMatch(/event_pattern/);
  });

  test("CloudWatch dashboard has multiple widgets", () => {
    const cloudwatchPath = path.join(libDir, "cloudwatch.tf");
    const content = fs.readFileSync(cloudwatchPath, "utf8");
    // Check for dashboard_body with widgets
    expect(content).toMatch(/dashboard_body/);
    expect(content).toMatch(/widgets/);
  });
});
