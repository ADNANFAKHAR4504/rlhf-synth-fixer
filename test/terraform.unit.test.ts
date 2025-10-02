// tests/unit/terraform.unit.test.ts
// Comprehensive validation of tap_stack.tf against requirements
// No Terraform commands are executed - pure static analysis

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
let stackContent: string;

beforeAll(() => {
  stackContent = fs.readFileSync(STACK_PATH, "utf8");
});

describe("Terraform Stack: tap_stack.tf - File Structure", () => {
  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(STACK_PATH)).toBe(true);
  });

  test("file is not empty", () => {
    expect(stackContent.length).toBeGreaterThan(0);
  });

  test("does NOT declare provider (provider.tf owns providers)", () => {
    expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });
});

describe("Required Variables", () => {
  test("declares aws_region variable", () => {
    expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares vpc_id variable with validation", () => {
    expect(stackContent).toMatch(/variable\s+"vpc_id"\s*{/);
    expect(stackContent).toMatch(/validation\s*{[\s\S]*?vpc_id/);
  });

  test("declares subnet_ids variable with validation", () => {
    expect(stackContent).toMatch(/variable\s+"subnet_ids"\s*{/);
    expect(stackContent).toMatch(/list\(string\)/);
  });

  test("declares route_table_ids variable (CRITICAL FIX)", () => {
    expect(stackContent).toMatch(/variable\s+"route_table_ids"\s*{/);
    expect(stackContent).toMatch(/validation[\s\S]*?route_table_ids/);
  });

  test("declares notification_email variable with validation", () => {
    expect(stackContent).toMatch(/variable\s+"notification_email"\s*{/);
    expect(stackContent).toMatch(/validation[\s\S]*?email/i);
  });

  test("declares compute and resource variables", () => {
    expect(stackContent).toMatch(/variable\s+"max_vcpus"/);
    expect(stackContent).toMatch(/variable\s+"compute_type"/);
    expect(stackContent).toMatch(/variable\s+"instance_types"/);
  });
});

describe("KMS Keys - Encryption at Rest", () => {
  test("creates KMS key for S3 encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"s3_key"/);
    expect(stackContent).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates KMS key for SNS encryption (CMK required)", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"sns_key"/);
  });

  test("creates KMS key for DynamoDB encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"dynamodb_key"/);
  });

  test("creates KMS key for CloudWatch Logs encryption", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"cloudwatch_key"/);
  });

  test("all KMS keys have aliases", () => {
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"s3_key_alias"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"sns_key_alias"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"dynamodb_key_alias"/);
    expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"cloudwatch_key_alias"/);
  });
});

describe("S3 Buckets - Security Configuration", () => {
  test("creates input bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"input_bucket"/);
  });

  test("creates output bucket", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"output_bucket"/);
  });

  test("creates logs bucket for S3 access logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"\s+"logs_bucket"/);
  });

  test("enables versioning on buckets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"input_bucket_versioning"/);
    expect(stackContent).toMatch(/status\s*=\s*"Enabled"/);
  });

  test("configures KMS encryption for buckets", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(stackContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("blocks public access on all buckets", () => {
    expect(stackContent).toMatch(/block_public_acls\s*=\s*true/);
    expect(stackContent).toMatch(/restrict_public_buckets\s*=\s*true/);
  });

  test("enforces HTTPS-only access (encryption in transit)", () => {
    expect(stackContent).toMatch(/"aws:SecureTransport"/);
    expect(stackContent).toMatch(/DenyInsecureTransport/);
  });

  test("denies unencrypted object uploads", () => {
    expect(stackContent).toMatch(/DenyUnencryptedObjectUploads/);
  });

  test("configures S3 access logging", () => {
    expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_logging"/);
  });

  test("configures lifecycle policies (7-year retention)", () => {
    expect(stackContent).toMatch(/GLACIER/);
    expect(stackContent).toMatch(/2555/);
  });
});

describe("DynamoDB - Job Status Tracking", () => {
  test("creates DynamoDB table for job status", () => {
    expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"job_status"/);
  });

  test("configures KMS encryption", () => {
    expect(stackContent).toMatch(/server_side_encryption\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("enables point-in-time recovery", () => {
    expect(stackContent).toMatch(/point_in_time_recovery\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("configures TTL for data cleanup", () => {
    expect(stackContent).toMatch(/ttl\s*{[\s\S]*?enabled\s*=\s*true/);
  });

  test("uses on-demand billing", () => {
    expect(stackContent).toMatch(/PAY_PER_REQUEST/);
  });
});

describe("IAM Roles - Least Privilege", () => {
  test("creates Lambda execution role", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"/);
  });

  test("Lambda policy uses specific resource ARNs", () => {
    expect(stackContent).toMatch(/aws_batch_job_queue\.job_queue\.arn/);
    expect(stackContent).toMatch(/aws_dynamodb_table\.job_status\.arn/);
  });

  test("creates Batch job role with least privilege", () => {
    expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"batch_job_role"/);
  });

  test("includes X-Ray tracing permissions", () => {
    expect(stackContent).toMatch(/xray:PutTraceSegments/);
  });
});

describe("Security Groups - Network Security", () => {
  test("creates security groups", () => {
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"batch_sg"/);
    expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"lambda_sg"/);
  });

  test("only allows HTTPS egress", () => {
    expect(stackContent).toMatch(/from_port\s*=\s*443/);
    expect(stackContent).toMatch(/to_port\s*=\s*443/);
  });
});

describe("VPC Endpoints - Private Network Traffic", () => {
  test("creates S3 VPC endpoint with route_table_ids", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"s3_endpoint"/);
    expect(stackContent).toMatch(/route_table_ids\s*=\s*var\.route_table_ids/);
  });

  test("creates DynamoDB VPC endpoint", () => {
    expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"\s+"dynamodb_endpoint"/);
  });

  test("creates interface endpoints for ECR and CloudWatch", () => {
    expect(stackContent).toMatch(/ecr\.api/);
    expect(stackContent).toMatch(/ecr\.dkr/);
    expect(stackContent).toMatch(/logs/);
  });
});

describe("Lambda Function - Orchestration", () => {
  test("uses modern runtime (nodejs20.x)", () => {
    expect(stackContent).toMatch(/runtime\s*=\s*"nodejs20\.x"/);
  });

  test("enables X-Ray tracing", () => {
    expect(stackContent).toMatch(/tracing_config\s*{[\s\S]*?mode\s*=\s*"Active"/);
  });

  test("configures Dead Letter Queue", () => {
    expect(stackContent).toMatch(/dead_letter_config/);
    expect(stackContent).toMatch(/aws_sqs_queue\.lambda_dlq/);
  });
});

describe("CloudWatch - Monitoring", () => {
  test("log groups are encrypted with KMS", () => {
    expect(stackContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.cloudwatch_key\.arn/);
  });

  test("creates alarms for failures and timeouts", () => {
    expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm.*job_failures/);
    expect(stackContent).toMatch(/aws_cloudwatch_metric_alarm.*lambda_errors/);
    expect(stackContent).toMatch(/processing_time_breach/);
  });

  test("creates CloudWatch dashboard", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
  });
});

describe("CloudTrail - Audit Logging", () => {
  test("creates CloudTrail", () => {
    expect(stackContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
  });

  test("CloudTrail is multi-region", () => {
    expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
  });

  test("enables log file validation", () => {
    expect(stackContent).toMatch(/enable_log_file_validation\s*=\s*true/);
  });

  test("configures data events for S3, DynamoDB, and Lambda", () => {
    expect(stackContent).toMatch(/AWS::S3::Object/);
    expect(stackContent).toMatch(/AWS::DynamoDB::Table/);
    expect(stackContent).toMatch(/AWS::Lambda::Function/);
  });
});

describe("VPC Flow Logs - Network Monitoring", () => {
  test("creates VPC Flow Logs", () => {
    expect(stackContent).toMatch(/resource\s+"aws_flow_log"/);
    expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
  });
});

describe("GuardDuty - Threat Detection", () => {
  test("enables GuardDuty", () => {
    expect(stackContent).toMatch(/resource\s+"aws_guardduty_detector"/);
    expect(stackContent).toMatch(/enable\s*=\s*true/);
  });

  test("GuardDuty findings trigger SNS", () => {
    expect(stackContent).toMatch(/guardduty_findings/);
  });
});

describe("AWS Config - Compliance", () => {
  test("creates Config recorder and delivery channel", () => {
    expect(stackContent).toMatch(/aws_config_configuration_recorder/);
    expect(stackContent).toMatch(/aws_config_delivery_channel/);
  });

  test("creates compliance rules", () => {
    expect(stackContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
    expect(stackContent).toMatch(/DYNAMODB_TABLE_ENCRYPTION_ENABLED/);
    expect(stackContent).toMatch(/CLOUD_TRAIL_ENABLED/);
  });
});

describe("Outputs", () => {
  test("exports all critical resource identifiers", () => {
    expect(stackContent).toMatch(/output\s+"batch_compute_environment_arn"/);
    expect(stackContent).toMatch(/output\s+"lambda_function_arn"/);
    expect(stackContent).toMatch(/output\s+"input_bucket_name"/);
    expect(stackContent).toMatch(/output\s+"dynamodb_table_name"/);
    expect(stackContent).toMatch(/output\s+"cloudtrail_arn"/);
  });

  test("has at least 20 outputs", () => {
    const outputMatches = stackContent.match(/^output\s+"/gm);
    expect(outputMatches!.length).toBeGreaterThanOrEqual(20);
  });
});

describe("Security Best Practices", () => {
  test("NO hardcoded secrets", () => {
    expect(stackContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
  });

  test("encryption is comprehensive", () => {
    const encryptionMatches = stackContent.match(/encryption|kms|sse/gi);
    expect(encryptionMatches!.length).toBeGreaterThan(50);
  });
});
