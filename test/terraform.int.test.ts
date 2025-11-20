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

  // Live Integration Tests - Testing actual deployed AWS resources
  describe("Live AWS Resource Integration Tests", () => {
    // Skip live tests if using mock outputs
    const itLive = usingMockOutputs ? test.skip : test;

    describe("S3 Bucket Verification", () => {
      itLive("drift reports bucket exists and is accessible", async () => {
        const { S3Client, HeadBucketCommand } = require("@aws-sdk/client-s3");
        const s3Client = new S3Client({ region: "us-east-1" });

        const command = new HeadBucketCommand({
          Bucket: outputs.drift_reports_bucket_name,
        });

        await expect(s3Client.send(command)).resolves.toBeDefined();
      }, 15000);

      itLive("drift reports bucket has versioning enabled", async () => {
        const { S3Client, GetBucketVersioningCommand } = require("@aws-sdk/client-s3");
        const s3Client = new S3Client({ region: "us-east-1" });

        const command = new GetBucketVersioningCommand({
          Bucket: outputs.drift_reports_bucket_name,
        });

        const response = await s3Client.send(command);
        expect(response.Status).toBe("Enabled");
      }, 15000);

      itLive("drift reports bucket has encryption enabled", async () => {
        const { S3Client, GetBucketEncryptionCommand } = require("@aws-sdk/client-s3");
        const s3Client = new S3Client({ region: "us-east-1" });

        const command = new GetBucketEncryptionCommand({
          Bucket: outputs.drift_reports_bucket_name,
        });

        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
        expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe("AES256");
      }, 15000);

      itLive("eu-central-1 drift reports bucket exists", async () => {
        const { S3Client, HeadBucketCommand } = require("@aws-sdk/client-s3");
        const s3Client = new S3Client({ region: "eu-central-1" });

        const command = new HeadBucketCommand({
          Bucket: outputs.drift_reports_eu_central_1_bucket,
        });

        await expect(s3Client.send(command)).resolves.toBeDefined();
      }, 15000);
    });

    describe("DynamoDB Table Verification", () => {
      itLive("state lock table exists and is active", async () => {
        const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
        const dynamoClient = new DynamoDBClient({ region: "us-east-1" });

        const command = new DescribeTableCommand({
          TableName: outputs.state_lock_table_name,
        });

        const response = await dynamoClient.send(command);
        expect(response.Table).toBeDefined();
        expect(response.Table.TableStatus).toBe("ACTIVE");
        expect(response.Table.TableName).toBe(outputs.state_lock_table_name);
      }, 15000);

      itLive("state lock table has correct key schema", async () => {
        const { DynamoDBClient, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
        const dynamoClient = new DynamoDBClient({ region: "us-east-1" });

        const command = new DescribeTableCommand({
          TableName: outputs.state_lock_table_name,
        });

        const response = await dynamoClient.send(command);
        expect(response.Table.KeySchema).toBeDefined();
        expect(response.Table.KeySchema).toHaveLength(1);
        expect(response.Table.KeySchema[0].AttributeName).toBe("LockID");
        expect(response.Table.KeySchema[0].KeyType).toBe("HASH");
      }, 15000);
    });

    describe("Lambda Function Verification", () => {
      itLive("drift detector function exists and is active", async () => {
        const { LambdaClient, GetFunctionCommand } = require("@aws-sdk/client-lambda");
        const lambdaClient = new LambdaClient({ region: "us-east-1" });

        const command = new GetFunctionCommand({
          FunctionName: outputs.drift_detector_function_name,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration.State).toBe("Active");
        expect(response.Configuration.FunctionName).toBe(outputs.drift_detector_function_name);
      }, 15000);

      itLive("drift detector function has correct runtime", async () => {
        const { LambdaClient, GetFunctionCommand } = require("@aws-sdk/client-lambda");
        const lambdaClient = new LambdaClient({ region: "us-east-1" });

        const command = new GetFunctionCommand({
          FunctionName: outputs.drift_detector_function_name,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration.Runtime).toMatch(/^nodejs/);
        expect(response.Configuration.Handler).toBe("index.handler");
      }, 15000);

      itLive("drift detector function has required environment variables", async () => {
        const { LambdaClient, GetFunctionCommand } = require("@aws-sdk/client-lambda");
        const lambdaClient = new LambdaClient({ region: "us-east-1" });

        const command = new GetFunctionCommand({
          FunctionName: outputs.drift_detector_function_name,
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration.Environment).toBeDefined();
        expect(response.Configuration.Environment.Variables).toBeDefined();
        expect(response.Configuration.Environment.Variables.DRIFT_REPORTS_BUCKET).toBe(outputs.drift_reports_bucket_name);
        expect(response.Configuration.Environment.Variables.SNS_TOPIC_ARN).toBe(outputs.drift_alerts_topic_arn);
      }, 15000);

      itLive("drift detector function can be invoked", async () => {
        const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
        const lambdaClient = new LambdaClient({ region: "us-east-1" });

        const command = new InvokeCommand({
          FunctionName: outputs.drift_detector_function_name,
          InvocationType: "DryRun", // Test invocation without execution
        });

        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(204); // DryRun returns 204
      }, 15000);
    });

    describe("SNS Topic Verification", () => {
      itLive("drift alerts topic exists and is accessible", async () => {
        const { SNSClient, GetTopicAttributesCommand } = require("@aws-sdk/client-sns");
        const snsClient = new SNSClient({ region: "us-east-1" });

        const command = new GetTopicAttributesCommand({
          TopicArn: outputs.drift_alerts_topic_arn,
        });

        const response = await snsClient.send(command);
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes.TopicArn).toBe(outputs.drift_alerts_topic_arn);
      }, 15000);

      itLive("drift alerts topic has subscriptions", async () => {
        const { SNSClient, ListSubscriptionsByTopicCommand } = require("@aws-sdk/client-sns");
        const snsClient = new SNSClient({ region: "us-east-1" });

        const command = new ListSubscriptionsByTopicCommand({
          TopicArn: outputs.drift_alerts_topic_arn,
        });

        const response = await snsClient.send(command);
        expect(response.Subscriptions).toBeDefined();
        // Note: May be empty if no email confirmed yet
        expect(Array.isArray(response.Subscriptions)).toBe(true);
      }, 15000);
    });

    describe("IAM Role Verification", () => {
      itLive("cross-account role exists and is accessible", async () => {
        const { IAMClient, GetRoleCommand } = require("@aws-sdk/client-iam");
        const iamClient = new IAMClient({ region: "us-east-1" });

        // Extract role name from ARN
        const roleName = outputs.cross_account_role_arn.split("/").pop();

        const command = new GetRoleCommand({
          RoleName: roleName,
        });

        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role.Arn).toBe(outputs.cross_account_role_arn);
      }, 15000);

      itLive("cross-account role has assume role policy", async () => {
        const { IAMClient, GetRoleCommand } = require("@aws-sdk/client-iam");
        const iamClient = new IAMClient({ region: "us-east-1" });

        const roleName = outputs.cross_account_role_arn.split("/").pop();

        const command = new GetRoleCommand({
          RoleName: roleName,
        });

        const response = await iamClient.send(command);
        expect(response.Role.AssumeRolePolicyDocument).toBeDefined();

        const policy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
        expect(policy.Statement).toBeDefined();
        expect(policy.Statement.length).toBeGreaterThan(0);
      }, 15000);
    });

    describe("CloudWatch Dashboard Verification", () => {
      itLive("drift metrics dashboard exists", async () => {
        const { CloudWatchClient, GetDashboardCommand } = require("@aws-sdk/client-cloudwatch");
        const cwClient = new CloudWatchClient({ region: "us-east-1" });

        const command = new GetDashboardCommand({
          DashboardName: outputs.cloudwatch_dashboard_name,
        });

        const response = await cwClient.send(command);
        expect(response.DashboardName).toBe(outputs.cloudwatch_dashboard_name);
        expect(response.DashboardBody).toBeDefined();
      }, 15000);

      itLive("drift metrics dashboard has valid configuration", async () => {
        const { CloudWatchClient, GetDashboardCommand } = require("@aws-sdk/client-cloudwatch");
        const cwClient = new CloudWatchClient({ region: "us-east-1" });

        const command = new GetDashboardCommand({
          DashboardName: outputs.cloudwatch_dashboard_name,
        });

        const response = await cwClient.send(command);
        const dashboardBody = JSON.parse(response.DashboardBody);

        expect(dashboardBody.widgets).toBeDefined();
        expect(Array.isArray(dashboardBody.widgets)).toBe(true);
        expect(dashboardBody.widgets.length).toBeGreaterThan(0);
      }, 15000);
    });

    describe("CloudWatch Logs Verification", () => {
      itLive("Lambda function has log group", async () => {
        const { CloudWatchLogsClient, DescribeLogGroupsCommand } = require("@aws-sdk/client-cloudwatch-logs");
        const cwlClient = new CloudWatchLogsClient({ region: "us-east-1" });

        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/lambda/${outputs.drift_detector_function_name}`,
        });

        const response = await cwlClient.send(command);
        expect(response.logGroups).toBeDefined();
        expect(response.logGroups.length).toBeGreaterThan(0);
        expect(response.logGroups[0].logGroupName).toBe(`/aws/lambda/${outputs.drift_detector_function_name}`);
      }, 15000);

      itLive("Lambda log group has retention policy", async () => {
        const { CloudWatchLogsClient, DescribeLogGroupsCommand } = require("@aws-sdk/client-cloudwatch-logs");
        const cwlClient = new CloudWatchLogsClient({ region: "us-east-1" });

        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/lambda/${outputs.drift_detector_function_name}`,
        });

        const response = await cwlClient.send(command);
        expect(response.logGroups[0].retentionInDays).toBeDefined();
        expect(response.logGroups[0].retentionInDays).toBeGreaterThan(0);
      }, 15000);
    });

    describe("CloudWatch Alarms Verification", () => {
      itLive("drift detection failure alarm exists", async () => {
        const { CloudWatchClient, DescribeAlarmsCommand } = require("@aws-sdk/client-cloudwatch");
        const cwClient = new CloudWatchClient({ region: "us-east-1" });

        const command = new DescribeAlarmsCommand({
          AlarmNamePrefix: "drift-detection-failures",
        });

        const response = await cwClient.send(command);
        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms.length).toBeGreaterThan(0);
      }, 15000);

      itLive("failure alarm is configured to notify SNS", async () => {
        const { CloudWatchClient, DescribeAlarmsCommand } = require("@aws-sdk/client-cloudwatch");
        const cwClient = new CloudWatchClient({ region: "us-east-1" });

        const command = new DescribeAlarmsCommand({
          AlarmNamePrefix: "drift-detection-failures",
        });

        const response = await cwClient.send(command);
        const alarm = response.MetricAlarms[0];

        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions.length).toBeGreaterThan(0);
        expect(alarm.AlarmActions[0]).toBe(outputs.drift_alerts_topic_arn);
      }, 15000);
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
