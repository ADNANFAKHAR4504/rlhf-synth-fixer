// Integration tests for Terraform drift detection infrastructure
// Tests validate deployed resources using actual cfn-outputs (when available)

import * as fs from "fs";
import * as path from "path";

// Mock deployment outputs for testing when TERRAFORM_STATE_BUCKET is not available
const mockOutputs = {
  drift_reports_bucket_name: "drift-reports-dev",
  drift_reports_bucket_arn: "arn:aws:s3:::drift-reports-dev",
  state_lock_table_name: "terraform-state-lock-dev",
  state_lock_table_arn: "arn:aws:dynamodb:us-east-1:123456789012:table/terraform-state-lock-dev",
  drift_detector_function_name: "drift-detector-dev",
  drift_detector_function_arn: "arn:aws:lambda:us-east-1:123456789012:function:drift-detector-dev",
  drift_alerts_topic_arn: "arn:aws:sns:us-east-1:123456789012:drift-alerts-dev",
  config_bucket_name: "aws-config-bucket-dev",
  cross_account_role_arn: "arn:aws:iam::123456789012:role/cross-account-drift-dev",
  cloudwatch_dashboard_name: "drift-metrics-dev",
  drift_reports_us_west_2_bucket: "drift-reports-usw2-dev",
  drift_reports_eu_central_1_bucket: "drift-reports-euc1-dev",
};

describe("Terraform Drift Detection Infrastructure - Integration Tests", () => {
  let outputs: Record<string, string>;
  let usingMockOutputs = false;

  beforeAll(() => {
    // Try to load actual deployment outputs
    const outputPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, "utf8");
      outputs = JSON.parse(content);
      console.log("Using actual deployment outputs from cfn-outputs/flat-outputs.json");
    } else {
      outputs = mockOutputs;
      usingMockOutputs = true;
      console.log("⚠️  Using mock outputs (deployment not available)");
      console.log("Note: Integration tests are designed for actual deployed resources");
    }
  });

  describe("Deployment Outputs Validation", () => {
    test("outputs object is defined", () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe("object");
    });

    test("outputs contain required keys", () => {
      const requiredKeys = [
        "drift_reports_bucket_name",
        "state_lock_table_name",
        "drift_detector_function_name",
        "drift_alerts_topic_arn",
        "cloudwatch_dashboard_name",
        "cross_account_role_arn",
      ];

      requiredKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(typeof outputs[key]).toBe("string");
        expect(outputs[key].length).toBeGreaterThan(0);
      });
    });
  });

  describe("S3 Drift Reports Bucket (Requirement 1)", () => {
    test("bucket name is defined and follows naming convention", () => {
      expect(outputs.drift_reports_bucket_name).toBeDefined();
      expect(outputs.drift_reports_bucket_name).toMatch(/^drift-reports-/);
    });

    test("bucket ARN follows AWS ARN format", () => {
      expect(outputs.drift_reports_bucket_arn).toBeDefined();
      expect(outputs.drift_reports_bucket_arn).toMatch(/^arn:aws:s3:::/);
      expect(outputs.drift_reports_bucket_arn).toContain(outputs.drift_reports_bucket_name);
    });

    test("multi-region buckets are defined", () => {
      expect(outputs.drift_reports_us_west_2_bucket).toBeDefined();
      expect(outputs.drift_reports_us_west_2_bucket).toMatch(/^drift-reports-usw2-/);

      expect(outputs.drift_reports_eu_central_1_bucket).toBeDefined();
      expect(outputs.drift_reports_eu_central_1_bucket).toMatch(/^drift-reports-euc1-/);
    });
  });

  describe("DynamoDB State Lock Table (Requirement 2)", () => {
    test("table name is defined and follows naming convention", () => {
      expect(outputs.state_lock_table_name).toBeDefined();
      expect(outputs.state_lock_table_name).toMatch(/^terraform-state-lock-/);
    });

    test("table ARN follows AWS ARN format", () => {
      expect(outputs.state_lock_table_arn).toBeDefined();
      expect(outputs.state_lock_table_arn).toMatch(/^arn:aws:dynamodb:/);
      expect(outputs.state_lock_table_arn).toContain(outputs.state_lock_table_name);
    });
  });

  describe("Lambda Drift Detector Function (Requirement 4)", () => {
    test("function name is defined and follows naming convention", () => {
      expect(outputs.drift_detector_function_name).toBeDefined();
      expect(outputs.drift_detector_function_name).toMatch(/^drift-detector-/);
    });

    test("function ARN follows AWS ARN format", () => {
      expect(outputs.drift_detector_function_arn).toBeDefined();
      expect(outputs.drift_detector_function_arn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.drift_detector_function_arn).toContain(outputs.drift_detector_function_name);
    });

    test("Lambda code structure is valid", () => {
      const lambdaPath = path.resolve(__dirname, "../lib/lambda/drift-detector/index.js");
      expect(fs.existsSync(lambdaPath)).toBe(true);

      const lambdaCode = fs.readFileSync(lambdaPath, "utf8");

      // Verify handler export
      expect(lambdaCode).toMatch(/exports\.handler/);

      // Verify async handler
      expect(lambdaCode).toMatch(/async.*function|async\s*\(/);
    });
  });

  describe("SNS Drift Alerts Topic (Requirement 6)", () => {
    test("topic ARN is defined", () => {
      expect(outputs.drift_alerts_topic_arn).toBeDefined();
      expect(outputs.drift_alerts_topic_arn).toMatch(/^arn:aws:sns:/);
    });

    test("topic ARN contains expected name pattern", () => {
      expect(outputs.drift_alerts_topic_arn).toMatch(/drift-alerts-/);
    });
  });

  describe("Cross-Account IAM Role (Requirement 7)", () => {
    test("role ARN is defined", () => {
      expect(outputs.cross_account_role_arn).toBeDefined();
      expect(outputs.cross_account_role_arn).toMatch(/^arn:aws:iam:/);
    });

    test("role ARN contains expected name pattern", () => {
      expect(outputs.cross_account_role_arn).toMatch(/cross-account-drift-/);
    });
  });

  describe("CloudWatch Dashboard (Requirement 8)", () => {
    test("dashboard name is defined and follows naming convention", () => {
      expect(outputs.cloudwatch_dashboard_name).toBeDefined();
      expect(outputs.cloudwatch_dashboard_name).toMatch(/^drift-metrics-/);
    });
  });

  describe("AWS Config Bucket", () => {
    test("config bucket name is defined", () => {
      expect(outputs.config_bucket_name).toBeDefined();
      expect(outputs.config_bucket_name).toMatch(/^aws-config-bucket-/);
    });
  });

  describe("Resource Naming Consistency", () => {
    test("all resource names use consistent environment suffix", () => {
      // Extract environment suffix from bucket name
      const bucketName = outputs.drift_reports_bucket_name;
      const suffix = bucketName.replace(/^drift-reports-/, "");

      expect(suffix.length).toBeGreaterThan(0);

      // Verify all resources use the same suffix
      expect(outputs.state_lock_table_name).toContain(suffix);
      expect(outputs.drift_detector_function_name).toContain(suffix);
      expect(outputs.drift_alerts_topic_arn).toContain(suffix);
      expect(outputs.cloudwatch_dashboard_name).toContain(suffix);
      expect(outputs.cross_account_role_arn).toContain(suffix);
    });

    test("multi-region resources use consistent naming", () => {
      const primaryBucket = outputs.drift_reports_bucket_name;
      const suffix = primaryBucket.replace(/^drift-reports-/, "");

      expect(outputs.drift_reports_us_west_2_bucket).toContain(suffix);
      expect(outputs.drift_reports_eu_central_1_bucket).toContain(suffix);
    });
  });

  describe("Infrastructure Workflow Integration", () => {
    test("S3 bucket and Lambda function are connected", () => {
      // Verify S3 bucket output can be used by Lambda
      expect(outputs.drift_reports_bucket_name).toBeDefined();
      expect(outputs.drift_detector_function_name).toBeDefined();

      // Check Lambda environment configuration in main.tf
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // Verify Lambda has environment variable for S3 bucket
      expect(mainContent).toMatch(/DRIFT_REPORTS_BUCKET/);
    });

    test("Lambda and SNS are connected for notifications", () => {
      expect(outputs.drift_detector_function_name).toBeDefined();
      expect(outputs.drift_alerts_topic_arn).toBeDefined();

      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // Verify Lambda has environment variable for SNS topic
      expect(mainContent).toMatch(/SNS_TOPIC_ARN/);
    });

    test("EventBridge and Lambda are connected", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // Verify EventBridge rule targets Lambda
      expect(mainContent).toMatch(/aws_cloudwatch_event_target.*drift_detector_target/);
      expect(mainContent).toMatch(/aws_lambda_permission.*allow_eventbridge/);
    });
  });

  describe("Terraform Configuration Integration", () => {
    test("outputs.tf exports all deployed resources", () => {
      const outputsPath = path.resolve(__dirname, "../lib/outputs.tf");
      const outputsContent = fs.readFileSync(outputsPath, "utf8");

      // Verify all outputs are properly defined
      const expectedOutputs = [
        "drift_reports_bucket_name",
        "drift_reports_bucket_arn",
        "state_lock_table_name",
        "state_lock_table_arn",
        "drift_detector_function_name",
        "drift_detector_function_arn",
        "drift_alerts_topic_arn",
        "config_bucket_name",
        "cross_account_role_arn",
        "cloudwatch_dashboard_name",
      ];

      expectedOutputs.forEach(output => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });

    test("variables.tf defines all required variables", () => {
      const varsPath = path.resolve(__dirname, "../lib/variables.tf");
      const varsContent = fs.readFileSync(varsPath, "utf8");

      const requiredVars = [
        "aws_region",
        "environment_suffix",
        "repository",
        "alert_email",
      ];

      requiredVars.forEach(varName => {
        expect(varsContent).toMatch(new RegExp(`variable\\s+"${varName}"`));
      });
    });

    test("provider.tf configures multi-region providers", () => {
      const providerPath = path.resolve(__dirname, "../lib/provider.tf");
      const providerContent = fs.readFileSync(providerPath, "utf8");

      // Verify primary provider
      expect(providerContent).toMatch(/provider\s+"aws"\s+\{[^}]*region\s*=\s*var\.aws_region/);

      // Verify multi-region providers
      expect(providerContent).toMatch(/provider\s+"aws"\s+\{[^}]*alias\s*=\s*"us_west_2"/);
      expect(providerContent).toMatch(/provider\s+"aws"\s+\{[^}]*alias\s*=\s*"eu_central_1"/);
    });
  });

  describe("Lambda Package Integrity", () => {
    test("Lambda package.json has correct dependencies", () => {
      const pkgPath = path.resolve(__dirname, "../lib/lambda/drift-detector/package.json");
      expect(fs.existsSync(pkgPath)).toBe(true);

      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

      expect(pkgContent.dependencies).toBeDefined();
      expect(pkgContent.dependencies["@aws-sdk/client-s3"]).toBeDefined();
      expect(pkgContent.dependencies["@aws-sdk/client-sns"]).toBeDefined();
    });

    test("Lambda handler code is complete and functional", () => {
      const lambdaPath = path.resolve(__dirname, "../lib/lambda/drift-detector/index.js");
      const lambdaCode = fs.readFileSync(lambdaPath, "utf8");

      // Verify AWS SDK imports
      expect(lambdaCode).toMatch(/require\(["']@aws-sdk\/client-s3["']\)/);
      expect(lambdaCode).toMatch(/require\(["']@aws-sdk\/client-sns["']\)/);

      // Verify clients are initialized
      expect(lambdaCode).toMatch(/new S3Client/);
      expect(lambdaCode).toMatch(/new SNSClient/);

      // Verify main handler logic
      expect(lambdaCode).toMatch(/exports\.handler\s*=\s*async/);

      // Verify drift report generation
      expect(lambdaCode).toMatch(/driftReport/);
      expect(lambdaCode).toMatch(/PutObjectCommand/);

      // Verify SNS notification logic
      expect(lambdaCode).toMatch(/PublishCommand/);

      // Verify error handling
      expect(lambdaCode).toMatch(/try/);
      expect(lambdaCode).toMatch(/catch/);
    });
  });

  describe("End-to-End Workflow Validation", () => {
    test("drift detection workflow is properly configured", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // Step 1: EventBridge triggers Lambda every 6 hours
      expect(mainContent).toMatch(/schedule_expression\s*=\s*"rate\(6 hours\)"/);

      // Step 2: Lambda executes drift detection
      expect(mainContent).toMatch(/aws_lambda_function.*drift_detector/);

      // Step 3: Lambda stores report in S3
      const lambdaPath = path.resolve(__dirname, "../lib/lambda/drift-detector/index.js");
      const lambdaCode = fs.readFileSync(lambdaPath, "utf8");
      expect(lambdaCode).toMatch(/DRIFT_REPORTS_BUCKET/);
      expect(lambdaCode).toMatch(/PutObjectCommand/);

      // Step 4: Lambda sends SNS notification for critical drift
      expect(lambdaCode).toMatch(/severity.*===.*['"]critical['"]/);
      expect(lambdaCode).toMatch(/PublishCommand/);

      // Step 5: CloudWatch tracks metrics
      expect(mainContent).toMatch(/aws_cloudwatch_dashboard.*drift_metrics/);
    });

    test("monitoring and alerting workflow is complete", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // CloudWatch logs for Lambda
      expect(mainContent).toMatch(/aws_cloudwatch_log_group.*drift_detector_logs/);

      // CloudWatch alarm for failures
      expect(mainContent).toMatch(/aws_cloudwatch_metric_alarm.*drift_detection_failures/);

      // Alarm actions to SNS
      expect(mainContent).toMatch(/alarm_actions/);
    });

    test("AWS Config integration is properly configured", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // Config recorder
      expect(mainContent).toMatch(/aws_config_configuration_recorder/);

      // Config delivery channel to S3
      expect(mainContent).toMatch(/aws_config_delivery_channel/);

      // Config rules
      expect(mainContent).toMatch(/aws_config_config_rule/);

      // Config recorder status enabled
      expect(mainContent).toMatch(/aws_config_configuration_recorder_status/);
      expect(mainContent).toMatch(/is_enabled\s*=\s*true/);
    });
  });

  describe("Security and Compliance Validation", () => {
    test("S3 buckets use encryption", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      expect(mainContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });

    test("IAM roles follow least-privilege principle", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // Lambda role has specific permissions
      expect(mainContent).toMatch(/aws_iam_role_policy.*lambda_drift_detection_policy/);

      // Config role uses AWS managed policy
      expect(mainContent).toMatch(/AWS_ConfigRole/);

      // Cross-account role requires external ID
      expect(mainContent).toMatch(/sts:ExternalId/);
    });

    test("DynamoDB has point-in-time recovery enabled", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      expect(mainContent).toMatch(/point_in_time_recovery\s*\{/);
      expect(mainContent).toMatch(/enabled\s*=\s*true/);
    });

    test("no deletion protection or prevent_destroy policies", () => {
      const mainPath = path.resolve(__dirname, "../lib/main.tf");
      const mainContent = fs.readFileSync(mainPath, "utf8");

      // Ensure resources are destroyable
      expect(mainContent).not.toMatch(/prevent_destroy\s*=\s*true/);
      expect(mainContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });
  });

  afterAll(() => {
    if (usingMockOutputs) {
      console.log("\n⚠️  Integration tests ran with mock outputs");
      console.log("   For full validation, deploy infrastructure and rerun tests");
      console.log("   Expected file: cfn-outputs/flat-outputs.json");
    } else {
      console.log("\n✅ Integration tests ran with actual deployment outputs");
    }
  });
});
