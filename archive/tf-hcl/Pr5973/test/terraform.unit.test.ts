// tests/unit/terraform.unit.test.ts
// Unit tests for Terraform infrastructure files
// No Terraform or AWS commands are executed.

import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

describe("Terraform Infrastructure Files", () => {
  // Base infrastructure files
  test("provider.tf exists", () => {
    const providerPath = path.join(LIB_DIR, "provider.tf");
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test("variables.tf exists", () => {
    const variablesPath = path.join(LIB_DIR, "variables.tf");
    expect(fs.existsSync(variablesPath)).toBe(true);
  });

  test("outputs.tf exists", () => {
    const outputsPath = path.join(LIB_DIR, "outputs.tf");
    expect(fs.existsSync(outputsPath)).toBe(true);
  });

  test("sqs.tf exists", () => {
    const sqsPath = path.join(LIB_DIR, "sqs.tf");
    expect(fs.existsSync(sqsPath)).toBe(true);
  });

  test("lambda.tf exists", () => {
    const lambdaPath = path.join(LIB_DIR, "lambda.tf");
    expect(fs.existsSync(lambdaPath)).toBe(true);
  });

  test("api_gateway.tf exists", () => {
    const apiPath = path.join(LIB_DIR, "api_gateway.tf");
    expect(fs.existsSync(apiPath)).toBe(true);
  });

  test("iam.tf exists", () => {
    const iamPath = path.join(LIB_DIR, "iam.tf");
    expect(fs.existsSync(iamPath)).toBe(true);
  });

  // Iteration 1: Monitoring file
  test("monitoring.tf exists", () => {
    const monitoringPath = path.join(LIB_DIR, "monitoring.tf");
    expect(fs.existsSync(monitoringPath)).toBe(true);
  });
});

describe("Lambda Function Configuration", () => {
  const lambdaPath = path.join(LIB_DIR, "lambda.tf");

  test("Lambda functions have X-Ray tracing configuration", () => {
    const content = fs.readFileSync(lambdaPath, "utf8");
    expect(content).toMatch(/tracing_config\s*{/);
    expect(content).toMatch(/mode\s*=\s*var\.enable_xray\s*\?\s*"Active"\s*:\s*"PassThrough"/);
  });

  test("Lambda functions use environment_suffix in naming", () => {
    const content = fs.readFileSync(lambdaPath, "utf8");
    expect(content).toMatch(/webhook-validator-\$\{var\.environment_suffix\}/);
    expect(content).toMatch(/webhook-processor-\$\{var\.environment_suffix\}/);
    expect(content).toMatch(/webhook-notifier-\$\{var\.environment_suffix\}/);
  });
});

describe("API Gateway Configuration", () => {
  const apiPath = path.join(LIB_DIR, "api_gateway.tf");

  test("API Gateway has X-Ray tracing enabled", () => {
    const content = fs.readFileSync(apiPath, "utf8");
    expect(content).toMatch(/xray_tracing_enabled\s*=\s*var\.enable_xray/);
  });
});

describe("CloudWatch Alarms Configuration", () => {
  const monitoringPath = path.join(LIB_DIR, "monitoring.tf");

  test("monitoring.tf declares SNS topic", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"alarms"/);
  });

  test("monitoring.tf contains Lambda error alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*validator_errors/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*processor_errors/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*notifier_errors/);
  });

  test("monitoring.tf contains Lambda throttle alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*validator_throttles/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*processor_throttles/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*notifier_throttles/);
  });

  test("monitoring.tf contains Lambda duration alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*validator_duration/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*processor_duration/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*notifier_duration/);
  });

  test("monitoring.tf contains Lambda concurrent execution alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*validator_concurrent/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*processor_concurrent/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*notifier_concurrent/);
  });

  test("monitoring.tf contains SQS queue age alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*validation_queue_age/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*processing_queue_age/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*notification_queue_age/);
  });

  test("monitoring.tf contains SQS queue depth alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*validation_queue_depth/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*processing_queue_depth/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*notification_queue_depth/);
  });

  test("monitoring.tf contains DLQ message alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*validation_dlq_messages/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*processing_dlq_messages/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*notification_dlq_messages/);
  });

  test("monitoring.tf contains API Gateway alarms", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*api_gateway_4xx_errors/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*api_gateway_5xx_errors/);
    expect(content).toMatch(/aws_cloudwatch_metric_alarm.*api_gateway_latency/);
  });

  test("all alarms use environment_suffix in naming", () => {
    const content = fs.readFileSync(monitoringPath, "utf8");
    const alarmMatches = content.match(/alarm_name\s*=\s*"[^"]+"/g) || [];
    expect(alarmMatches.length).toBeGreaterThan(15); // At least 18 alarms
    alarmMatches.forEach((match) => {
      expect(match).toMatch(/\$\{var\.environment_suffix\}/);
    });
  });
});

describe("Variables Configuration", () => {
  const variablesPath = path.join(LIB_DIR, "variables.tf");

  test("variables.tf declares enable_alarms variable", () => {
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"enable_alarms"\s*{/);
  });

  test("variables.tf declares enable_xray variable", () => {
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"enable_xray"\s*{/);
  });

  test("variables.tf declares alarm_email variable", () => {
    const content = fs.readFileSync(variablesPath, "utf8");
    expect(content).toMatch(/variable\s+"alarm_email"\s*{/);
  });
});
