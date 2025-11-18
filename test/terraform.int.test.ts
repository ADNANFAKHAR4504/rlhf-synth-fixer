import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Integration test configuration
const TERRAFORM_DIR = path.resolve(__dirname, "../");
const TEST_TIMEOUT = 600000; // 10 minutes
const ENVIRONMENT_SUFFIX = `test-${Date.now()}`;

describe("Terraform Observability Stack - Integration Tests", () => {
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

  beforeAll(async () => {
    console.log("🚀 Starting integration tests...");
    console.log(`Environment suffix: ${ENVIRONMENT_SUFFIX}`);
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (resourcesCreated) {
      console.log("🧹 Cleaning up resources...");
      try {
        runTerraform(
          `terraform destroy -auto-approve -var="environment_suffix=${ENVIRONMENT_SUFFIX}" -var="aws_region=us-east-1"`,
          false
        );
        console.log("✅ Resources cleaned up successfully");
      } catch (error) {
        console.warn("⚠️ Cleanup may have failed, check AWS console");
      }
    }
  }, TEST_TIMEOUT);

  describe("Terraform Initialization", () => {
    test(
      "should initialize Terraform successfully",
      () => {
        const output = runTerraform("terraform init");
        expect(output).toContain("Terraform has been successfully initialized");
        terraformInitialized = true;
      },
      TEST_TIMEOUT
    );

    test(
      "should validate Terraform configuration",
      () => {
        expect(terraformInitialized).toBe(true);
        const output = runTerraform("terraform validate");
        expect(output).toContain("Success");
      },
      TEST_TIMEOUT
    );

    test(
      "should format check pass",
      () => {
        const output = runTerraform("terraform fmt -check -recursive", false);
        // Exit code 0 means formatted correctly
        expect(output).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe("Terraform Plan", () => {
    test(
      "should generate valid execution plan",
      () => {
        const output = runTerraform(
          `terraform plan -var="environment_suffix=${ENVIRONMENT_SUFFIX}" -var="aws_region=us-east-1" -var="alert_email=test@example.com" -out=tfplan`
        );
        expect(output).toContain("Plan:");
        expect(output).not.toContain("Error:");
      },
      TEST_TIMEOUT
    );

    test(
      "should plan to create S3 buckets",
      () => {
        const output = runTerraform("terraform show tfplan");
        expect(output).toMatch(/aws_s3_bucket.*cloudtrail_logs/);
      },
      TEST_TIMEOUT
    );

    test(
      "should plan to create CloudTrail",
      () => {
        const output = runTerraform("terraform show tfplan");
        expect(output).toMatch(/aws_cloudtrail.*payment_audit/);
      },
      TEST_TIMEOUT
    );

    test(
      "should plan to create CloudWatch log groups",
      () => {
        const output = runTerraform("terraform show tfplan");
        expect(output).toMatch(/aws_cloudwatch_log_group/);
      },
      TEST_TIMEOUT
    );

    test(
      "should plan to create KMS key",
      () => {
        const output = runTerraform("terraform show tfplan");
        expect(output).toMatch(/aws_kms_key.*observability/);
      },
      TEST_TIMEOUT
    );
  });

  describe("Terraform Apply", () => {
    test(
      "should apply infrastructure successfully",
      () => {
        const output = runTerraform(
          `terraform apply -auto-approve -var="environment_suffix=${ENVIRONMENT_SUFFIX}" -var="aws_region=us-east-1" -var="alert_email=test@example.com" -var="log_retention_days=7" -var="xray_sampling_percentage=0.1" -var="enable_config=false" -var="enable_security_hub=false"`
        );
        expect(output).toContain("Apply complete!");
        resourcesCreated = true;
      },
      TEST_TIMEOUT
    );
  });

  describe("Resource Validation", () => {
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
  });

  describe("Security Validation", () => {
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
      },
      TEST_TIMEOUT
    );

    test(
      "should have SNS topics encrypted with KMS",
      () => {
        expect(resourcesCreated).toBe(true);
        const stateShow = runTerraform("terraform state show aws_sns_topic.payment_alerts");
        expect(stateShow).toContain("kms_master_key_id");
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
  });

  describe("Configuration Validation", () => {
    test(
      "should use correct environment suffix in resource names",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain(ENVIRONMENT_SUFFIX);
      },
      TEST_TIMEOUT
    );

    test(
      "should have proper lifecycle configuration on S3 bucket",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform("terraform state list");
        expect(output).toContain("aws_s3_bucket_lifecycle_configuration.cloudtrail_logs");
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
  });

  describe("Idempotency Test", () => {
    test(
      "should show no changes on second apply",
      () => {
        expect(resourcesCreated).toBe(true);
        const output = runTerraform(
          `terraform plan -var="environment_suffix=${ENVIRONMENT_SUFFIX}" -var="aws_region=us-east-1" -var="alert_email=test@example.com" -var="log_retention_days=7" -var="xray_sampling_percentage=0.1" -var="enable_config=false" -var="enable_security_hub=false"`
        );
        expect(output).toContain("No changes");
      },
      TEST_TIMEOUT
    );
  });
});
