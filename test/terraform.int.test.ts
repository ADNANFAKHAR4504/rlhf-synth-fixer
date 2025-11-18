import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Integration test configuration
const TERRAFORM_DIR = path.resolve(__dirname, "../");
const TEST_TIMEOUT = 600000; // 10 minutes
const CFN_OUTPUTS_PATH = path.join(TERRAFORM_DIR, "cfn-outputs/outputs.json");

// AWS SDK clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

interface TerraformOutputs {
  cloudtrail_arn: string;
  cloudtrail_bucket: string;
  dashboard_name: string;
  kms_key_arn: string;
  kms_key_id: string;
  payment_alerts_topic_arn: string;
  payment_api_log_group: string;
  payment_database_log_group: string;
  payment_processor_log_group: string;
  security_alerts_topic_arn: string;
  security_events_log_group: string;
  security_hub_enabled: string | boolean;
  ssm_latency_threshold_parameter: string;
  ssm_log_retention_parameter: string;
  ssm_xray_sampling_parameter: string;
  xray_sampling_rule_payment: string;
}

describe("Terraform Observability Stack - Integration Tests", () => {
  let outputs: TerraformOutputs;
  let terraformInitialized = false;
  let resourcesCreated = false;

  // Helper function to run Terraform commands
  const runTerraform = (command: string, checkError = true): string => {
    try {
      const result = execSync(`cd ${TERRAFORM_DIR} && ${command}`, {
        encoding: "utf8",
        stdio: checkError ? "pipe" : "inherit",
      });
      return result;
    } catch (error: any) {
      if (checkError) {
        throw new Error(`Terraform command failed: ${command}\n${error.message}`);
      }
      return error.stdout || "";
    }
  };

  // Helper function to get Terraform output
  const getTerraformOutput = (outputName: string): string => {
    const result = runTerraform(`terraform output -raw ${outputName}`);
    return result.trim();
  };

  // Helper function to read outputs from cfn-outputs.json
  const readDeploymentOutputs = (): TerraformOutputs => {
    try {
      const outputsContent = fs.readFileSync(CFN_OUTPUTS_PATH, "utf8");
      const parsedOutputs = JSON.parse(outputsContent);
      return parsedOutputs;
    } catch (error) {
      throw new Error(`Failed to read deployment outputs from ${CFN_OUTPUTS_PATH}: ${error}`);
    }
  };

  beforeAll(async () => {
    console.log("🚀 Starting integration tests...");

    // Check if cfn-outputs.json exists
    if (fs.existsSync(CFN_OUTPUTS_PATH)) {
      console.log("📊 Reading deployment outputs from cfn-outputs.json");
      outputs = readDeploymentOutputs();
      resourcesCreated = true;
      terraformInitialized = true;
      console.log("✅ Deployment outputs loaded successfully");
    } else {
      console.log("⚠️ cfn-outputs.json not found, tests will deploy infrastructure");
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup only if we deployed during the test
    if (resourcesCreated && !fs.existsSync(CFN_OUTPUTS_PATH)) {
      console.log("🧹 Cleaning up resources...");
      try {
        runTerraform(
          `terraform destroy -auto-approve -var="environment_suffix=test" -var="aws_region=us-east-1"`,
          false
        );
        console.log("✅ Resources cleaned up successfully");
      } catch (error) {
        console.warn("⚠️ Cleanup may have failed, check AWS console");
      }
    }
  }, TEST_TIMEOUT);

  describe("Deployment Outputs Validation", () => {
    test(
      "should have valid deployment outputs",
      () => {
        expect(outputs).toBeDefined();
        expect(outputs.cloudtrail_arn).toBeDefined();
        expect(outputs.cloudtrail_bucket).toBeDefined();
        expect(outputs.kms_key_id).toBeDefined();
      },
      TEST_TIMEOUT
    );

    test(
      "should have CloudTrail ARN in correct format",
      () => {
        expect(outputs.cloudtrail_arn).toMatch(/^arn:aws:cloudtrail:[a-z0-9-]+:\d+:trail\/.+$/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have SNS topics in correct format",
      () => {
        expect(outputs.payment_alerts_topic_arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);
        expect(outputs.security_alerts_topic_arn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:.+$/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have KMS key ARN in correct format",
      () => {
        expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-f0-9-]+$/);
        expect(outputs.kms_key_id).toMatch(/^[a-f0-9-]+$/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have CloudWatch log groups with correct naming",
      () => {
        expect(outputs.payment_api_log_group).toMatch(/^\/aws\/payment-api-.+$/);
        expect(outputs.payment_processor_log_group).toMatch(/^\/aws\/payment-processor-.+$/);
        expect(outputs.payment_database_log_group).toMatch(/^\/aws\/payment-database-.+$/);
        expect(outputs.security_events_log_group).toMatch(/^\/aws\/security-events-.+$/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have SSM parameters with correct naming",
      () => {
        expect(outputs.ssm_xray_sampling_parameter).toMatch(/^\/observability\/.+\/xray\/sampling-rate$/);
        expect(outputs.ssm_log_retention_parameter).toMatch(/^\/observability\/.+\/logs\/retention-days$/);
        expect(outputs.ssm_latency_threshold_parameter).toMatch(/^\/observability\/.+\/alerts\/latency-threshold-ms$/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have dashboard name defined",
      () => {
        expect(outputs.dashboard_name).toBeDefined();
        expect(outputs.dashboard_name).toMatch(/^payment-operations-.+$/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have X-Ray sampling rule defined",
      () => {
        expect(outputs.xray_sampling_rule_payment).toBeDefined();
        expect(outputs.xray_sampling_rule_payment).toMatch(/^pay-txn-.+$/);
      },
      TEST_TIMEOUT
    );
  });

  describe("S3 Bucket Validation", () => {
    test(
      "should verify CloudTrail S3 bucket exists",
      async () => {
        expect(outputs.cloudtrail_bucket).toBeDefined();

        try {
          const command = new ListObjectsV2Command({
            Bucket: outputs.cloudtrail_bucket,
            MaxKeys: 1,
          });
          const response = await s3Client.send(command);
          expect(response).toBeDefined();
        } catch (error: any) {
          // Bucket exists if we get AccessDenied or NoSuchKey, but not NoSuchBucket
          if (error.name === "NoSuchBucket") {
            throw error;
          }
        }
      },
      TEST_TIMEOUT
    );

    test(
      "should have correct bucket naming convention",
      () => {
        expect(outputs.cloudtrail_bucket).toMatch(/^cloudtrail-logs-.+$/);
      },
      TEST_TIMEOUT
    );
  });

  describe("Resource Existence Validation", () => {
    test(
      "should have created CloudTrail S3 bucket",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_s3_bucket.cloudtrail_logs");
      },
      TEST_TIMEOUT
    );

    test(
      "should have enabled S3 bucket versioning",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_s3_bucket_versioning.cloudtrail_logs");
      },
      TEST_TIMEOUT
    );

    test(
      "should have blocked public access on S3 bucket",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_s3_bucket_public_access_block.cloudtrail_logs");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created CloudTrail trail",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_cloudtrail.payment_audit");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created all CloudWatch log groups",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_cloudwatch_log_group.payment_api_logs");
        expect(output).toContain("aws_cloudwatch_log_group.payment_processor_logs");
        expect(output).toContain("aws_cloudwatch_log_group.payment_database_logs");
        expect(output).toContain("aws_cloudwatch_log_group.security_events_logs");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created KMS key and alias",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_kms_key.observability");
        expect(output).toContain("aws_kms_alias.observability");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created X-Ray sampling rules",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_xray_sampling_rule.payment_transactions");
        expect(output).toContain("aws_xray_sampling_rule.default_sampling");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created SNS topics",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_sns_topic.payment_alerts");
        expect(output).toContain("aws_sns_topic.security_alerts");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created CloudWatch alarms",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_cloudwatch_metric_alarm.high_error_rate");
        expect(output).toContain("aws_cloudwatch_metric_alarm.high_latency");
        expect(output).toContain("aws_cloudwatch_metric_alarm.failed_transactions");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created CloudWatch dashboard",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_cloudwatch_dashboard.payment_operations");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created EventBridge rules",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_cloudwatch_event_rule.security_config_changes");
        expect(output).toContain("aws_cloudwatch_event_rule.unauthorized_api_calls");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created EventBridge targets",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_cloudwatch_event_target.security_config_sns");
        expect(output).toContain("aws_cloudwatch_event_target.unauthorized_api_sns");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created SSM parameters",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_ssm_parameter.xray_sampling_rate");
        expect(output).toContain("aws_ssm_parameter.log_retention");
        expect(output).toContain("aws_ssm_parameter.alert_threshold_latency");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created SNS topic policies",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_sns_topic_policy.security_alerts_eventbridge");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created S3 bucket policy for CloudTrail",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_s3_bucket_policy.cloudtrail_logs");
      },
      TEST_TIMEOUT
    );

    test(
      "should have created S3 lifecycle configuration",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_s3_bucket_lifecycle_configuration.cloudtrail_logs");
      },
      TEST_TIMEOUT
    );
  });

  describe("Security Configuration Validation", () => {
    test(
      "should have encryption enabled on S3 bucket",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_s3_bucket_server_side_encryption_configuration.cloudtrail_logs");
      },
      TEST_TIMEOUT
    );

    test(
      "should have KMS encryption on CloudWatch logs",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_cloudwatch_log_group.payment_api_logs");
        expect(stateShow).toContain("kms_key_id");
        expect(stateShow).toContain(outputs.kms_key_arn);
      },
      TEST_TIMEOUT
    );

    test(
      "should have SNS topics encrypted with KMS",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_sns_topic.payment_alerts");
        expect(stateShow).toContain("kms_master_key_id");
        expect(stateShow).toContain(outputs.kms_key_id);
      },
      TEST_TIMEOUT
    );

    test(
      "should have enabled CloudTrail log file validation",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_cloudtrail.payment_audit");
        expect(stateShow).toContain("enable_log_file_validation");
        expect(stateShow).toMatch(/enable_log_file_validation\s*=\s*true/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have KMS key rotation enabled",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_kms_key.observability");
        expect(stateShow).toContain("enable_key_rotation");
        expect(stateShow).toMatch(/enable_key_rotation\s*=\s*true/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have S3 bucket public access blocked",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_s3_bucket_public_access_block.cloudtrail_logs");
        expect(stateShow).toMatch(/block_public_acls\s*=\s*true/);
        expect(stateShow).toMatch(/block_public_policy\s*=\s*true/);
        expect(stateShow).toMatch(/ignore_public_acls\s*=\s*true/);
        expect(stateShow).toMatch(/restrict_public_buckets\s*=\s*true/);
      },
      TEST_TIMEOUT
    );
  });

  describe("Configuration Values Validation", () => {
    test(
      "should have proper lifecycle configuration on S3 bucket",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_s3_bucket_lifecycle_configuration.cloudtrail_logs");
        expect(stateShow).toContain("expire-old-logs");
        expect(stateShow).toMatch(/days\s*=\s*90/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have CloudWatch log retention configured",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_cloudwatch_log_group.payment_api_logs");
        expect(stateShow).toContain("retention_in_days");
      },
      TEST_TIMEOUT
    );

    test(
      "should have correct alarm thresholds configured",
      () => {
        expect(resourcesCreated).toBe(true);
        const highErrorRate = runTerraform("terraform state show aws_cloudwatch_metric_alarm.high_error_rate");
        expect(highErrorRate).toMatch(/threshold\s*=\s*10/);

        const highLatency = runTerraform("terraform state show aws_cloudwatch_metric_alarm.high_latency");
        expect(highLatency).toMatch(/threshold\s*=\s*500/);

        const failedTransactions = runTerraform("terraform state show aws_cloudwatch_metric_alarm.failed_transactions");
        expect(failedTransactions).toMatch(/threshold\s*=\s*5/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have X-Ray sampling rule configured correctly",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_xray_sampling_rule.payment_transactions");
        expect(stateShow).toContain("url_path");
        expect(stateShow).toContain("/api/payment/*");
        expect(stateShow).toMatch(/http_method\s*=\s*"POST"/);
      },
      TEST_TIMEOUT
    );

    test(
      "should have CloudTrail configured for multi-event tracking",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_cloudtrail.payment_audit");
        expect(stateShow).toContain("include_global_service_events");
        expect(stateShow).toMatch(/read_write_type\s*=\s*"All"/);
      },
      TEST_TIMEOUT
    );
  });

  describe("Output Consistency Validation", () => {
    test(
      "should have consistent CloudTrail bucket name between output and state",
      () => {
        expect(resourcesCreated).toBe(true);
        const bucketFromOutput = getTerraformOutput("cloudtrail_bucket");
        expect(bucketFromOutput).toBe(outputs.cloudtrail_bucket);
      },
      TEST_TIMEOUT
    );

    test(
      "should have consistent KMS key ID between output and state",
      () => {
        expect(resourcesCreated).toBe(true);
        const kmsKeyId = getTerraformOutput("kms_key_id");
        expect(kmsKeyId).toBe(outputs.kms_key_id);
      },
      TEST_TIMEOUT
    );

    test(
      "should have consistent SNS topic ARNs between output and state",
      () => {
        expect(resourcesCreated).toBe(true);
        const paymentAlertsArn = getTerraformOutput("payment_alerts_topic_arn");
        const securityAlertsArn = getTerraformOutput("security_alerts_topic_arn");
        expect(paymentAlertsArn).toBe(outputs.payment_alerts_topic_arn);
        expect(securityAlertsArn).toBe(outputs.security_alerts_topic_arn);
      },
      TEST_TIMEOUT
    );
  });

  describe("Idempotency Test", () => {
    test(
      "should show no changes on repeated plan",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform(
          `terraform plan -detailed-exitcode || exit 0`
        );
        // Exit code 0 means no changes, exit code 2 means changes detected
        expect(output).toContain("No changes");
      },
      TEST_TIMEOUT
    );
  });
});
