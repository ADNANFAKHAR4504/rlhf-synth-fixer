// Unit tests for Terraform drift detection infrastructure
// Tests validate Terraform configuration structure without deploying

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform Drift Detection Infrastructure - Unit Tests", () => {

  describe("File Structure", () => {
    test("main.tf exists", () => {
      const mainPath = path.join(libPath, "main.tf");
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    test("variables.tf exists", () => {
      const varsPath = path.join(libPath, "variables.tf");
      expect(fs.existsSync(varsPath)).toBe(true);
    });

    test("outputs.tf exists", () => {
      const outputsPath = path.join(libPath, "outputs.tf");
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      const providerPath = path.join(libPath, "provider.tf");
      expect(fs.existsSync(providerPath)).toBe(true);
    });

    test("Lambda function code exists", () => {
      const lambdaPath = path.join(libPath, "lambda/drift-detector/index.js");
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });
  });

  describe("S3 Bucket Configuration (Requirement 1)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares drift reports S3 bucket", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"drift_reports"/);
    });

    test("S3 bucket name includes environment_suffix", () => {
      expect(mainContent).toMatch(/drift-reports-\$\{var\.environment_suffix\}/);
    });

    test("enables S3 bucket versioning", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"drift_reports"/);
      expect(mainContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures S3 lifecycle policies", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"\s+"drift_reports"/);
      expect(mainContent).toMatch(/storage_class\s*=\s*"STANDARD_IA"/);
      expect(mainContent).toMatch(/storage_class\s*=\s*"GLACIER"/);
    });

    test("enables S3 encryption at rest", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"\s+"drift_reports"/);
      expect(mainContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
    });
  });

  describe("DynamoDB State Locking (Requirement 2)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares DynamoDB table for state locking", () => {
      expect(mainContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"/);
    });

    test("DynamoDB table name includes environment_suffix", () => {
      expect(mainContent).toMatch(/terraform-state-lock-\$\{var\.environment_suffix\}/);
    });

    test("enables point-in-time recovery", () => {
      expect(mainContent).toMatch(/point_in_time_recovery\s*\{/);
      expect(mainContent).toMatch(/enabled\s*=\s*true/);
    });

    test("uses PAY_PER_REQUEST billing mode", () => {
      expect(mainContent).toMatch(/billing_mode\s*=\s*"PAY_PER_REQUEST"/);
    });
  });

  describe("AWS Config Setup (Requirement 3)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares AWS Config S3 bucket", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config_bucket"/);
    });

    test("declares AWS Config IAM role", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"config_role"/);
    });

    test("uses correct AWS Config managed policy", () => {
      expect(mainContent).toMatch(/arn:aws:iam::aws:policy\/service-role\/AWS_ConfigRole/);
    });

    test("declares Config recorder", () => {
      expect(mainContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
    });

    test("declares Config delivery channel", () => {
      expect(mainContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
    });

    test("tracks EC2 resources", () => {
      expect(mainContent).toMatch(/AWS::EC2::Instance/);
    });

    test("tracks RDS resources", () => {
      expect(mainContent).toMatch(/AWS::RDS::DBInstance/);
    });

    test("tracks S3 resources", () => {
      expect(mainContent).toMatch(/AWS::S3::Bucket/);
    });

    test("declares Config rules", () => {
      expect(mainContent).toMatch(/resource\s+"aws_config_config_rule"/);
    });
  });

  describe("Lambda Drift Detection Function (Requirement 4)", () => {
    let mainContent: string;
    let lambdaCode: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
      lambdaCode = fs.readFileSync(path.join(libPath, "lambda/drift-detector/index.js"), "utf8");
    });

    test("declares Lambda IAM role", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"drift_detection_lambda"/);
    });

    test("declares Lambda function", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_function"\s+"drift_detector"/);
    });

    test("Lambda function name includes environment_suffix", () => {
      expect(mainContent).toMatch(/drift-detector-\$\{var\.environment_suffix\}/);
    });

    test("uses Node.js 18 runtime", () => {
      expect(mainContent).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
    });

    test("Lambda has proper timeout", () => {
      expect(mainContent).toMatch(/timeout\s*=\s*300/);
    });

    test("Lambda code uses AWS SDK v3 for S3", () => {
      expect(lambdaCode).toMatch(/@aws-sdk\/client-s3/);
    });

    test("Lambda code uses AWS SDK v3 for SNS", () => {
      expect(lambdaCode).toMatch(/@aws-sdk\/client-sns/);
    });

    test("Lambda generates structured JSON reports", () => {
      expect(lambdaCode).toMatch(/timestamp/);
      expect(lambdaCode).toMatch(/severity/);
      expect(lambdaCode).toMatch(/drift_detected/);
    });
  });

  describe("EventBridge Scheduling (Requirement 5)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares EventBridge rule", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"drift_check_schedule"/);
    });

    test("schedules every 6 hours", () => {
      expect(mainContent).toMatch(/schedule_expression\s*=\s*"rate\(6 hours\)"/);
    });

    test("declares EventBridge target", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"drift_detector_target"/);
    });

    test("configures retry policy", () => {
      expect(mainContent).toMatch(/retry_policy\s*\{/);
      expect(mainContent).toMatch(/maximum_retry_attempts/);
    });

    test("declares Lambda permission for EventBridge", () => {
      expect(mainContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge"/);
    });
  });

  describe("SNS Notifications (Requirement 6)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares SNS topic", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic"\s+"drift_alerts"/);
    });

    test("SNS topic name includes environment_suffix", () => {
      expect(mainContent).toMatch(/drift-alerts-\$\{var\.environment_suffix\}/);
    });

    test("declares email subscription", () => {
      expect(mainContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"drift_alerts_email"/);
      expect(mainContent).toMatch(/protocol\s*=\s*"email"/);
    });
  });

  describe("Cross-Account IAM Roles (Requirement 7)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares cross-account IAM role", () => {
      expect(mainContent).toMatch(/resource\s+"aws_iam_role"\s+"cross_account_drift_analysis"/);
    });

    test("role name includes environment_suffix", () => {
      expect(mainContent).toMatch(/cross-account-drift-\$\{var\.environment_suffix\}/);
    });

    test("configures external ID for cross-account access", () => {
      expect(mainContent).toMatch(/sts:ExternalId/);
    });
  });

  describe("CloudWatch Dashboard and Alarms (Requirement 8)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares CloudWatch dashboard", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"drift_metrics"/);
    });

    test("dashboard includes Lambda metrics", () => {
      expect(mainContent).toMatch(/AWS\/Lambda/);
      expect(mainContent).toMatch(/Invocations/);
      expect(mainContent).toMatch(/Errors/);
    });

    test("declares CloudWatch alarm", () => {
      expect(mainContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test("alarm monitors Lambda failures", () => {
      expect(mainContent).toMatch(/drift_detection_failures/);
    });
  });

  describe("Terraform Data Sources (Requirement 9)", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("uses data source for AWS account ID", () => {
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });

    test("uses data source for AWS region", () => {
      expect(mainContent).toMatch(/data\s+"aws_region"\s+"current"/);
    });

    test("validates S3 bucket with data source", () => {
      expect(mainContent).toMatch(/data\s+"aws_s3_bucket"\s+"drift_reports_validation"/);
    });

    test("validates DynamoDB table with data source", () => {
      expect(mainContent).toMatch(/data\s+"aws_dynamodb_table"\s+"state_lock_validation"/);
    });
  });

  describe("Multi-Region Setup", () => {
    let providerContent: string;
    let mainContent: string;

    beforeAll(() => {
      providerContent = fs.readFileSync(path.join(libPath, "provider.tf"), "utf8");
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("declares us-west-2 provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s+\{\s*alias\s*=\s*"us_west_2"/);
    });

    test("declares eu-central-1 provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s+\{\s*alias\s*=\s*"eu_central_1"/);
    });

    test("creates S3 bucket in us-west-2", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"drift_reports_us_west_2"/);
    });

    test("creates S3 bucket in eu-central-1", () => {
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket"\s+"drift_reports_eu_central_1"/);
    });
  });

  describe("Variables Configuration", () => {
    let varsContent: string;

    beforeAll(() => {
      varsContent = fs.readFileSync(path.join(libPath, "variables.tf"), "utf8");
    });

    test("declares aws_region variable", () => {
      expect(varsContent).toMatch(/variable\s+"aws_region"/);
    });

    test("declares environment_suffix variable", () => {
      expect(varsContent).toMatch(/variable\s+"environment_suffix"/);
    });

    test("declares alert_email variable", () => {
      expect(varsContent).toMatch(/variable\s+"alert_email"/);
    });

    test("declares repository variable", () => {
      expect(varsContent).toMatch(/variable\s+"repository"/);
    });
  });

  describe("Outputs Configuration (Requirement 10)", () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libPath, "outputs.tf"), "utf8");
    });

    test("outputs drift reports bucket name", () => {
      expect(outputsContent).toMatch(/output\s+"drift_reports_bucket_name"/);
    });

    test("outputs state lock table name", () => {
      expect(outputsContent).toMatch(/output\s+"state_lock_table_name"/);
    });

    test("outputs Lambda function name", () => {
      expect(outputsContent).toMatch(/output\s+"drift_detector_function_name"/);
    });

    test("outputs SNS topic ARN", () => {
      expect(outputsContent).toMatch(/output\s+"drift_alerts_topic_arn"/);
    });

    test("outputs CloudWatch dashboard name", () => {
      expect(outputsContent).toMatch(/output\s+"cloudwatch_dashboard_name"/);
    });

    test("outputs cross-account role ARN", () => {
      expect(outputsContent).toMatch(/output\s+"cross_account_role_arn"/);
    });

    test("outputs multi-region bucket names", () => {
      expect(outputsContent).toMatch(/output\s+"drift_reports_us_west_2_bucket"/);
      expect(outputsContent).toMatch(/output\s+"drift_reports_eu_central_1_bucket"/);
    });
  });

  describe("Deployment Requirements Compliance", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("no Retain policies configured", () => {
      expect(mainContent).not.toMatch(/prevent_destroy\s*=\s*true/);
      expect(mainContent).not.toMatch(/lifecycle\s*\{\s*prevent_destroy/);
    });

    test("no deletion_protection enabled", () => {
      expect(mainContent).not.toMatch(/deletion_protection\s*=\s*true/);
    });

    test("no GuardDuty detector creation", () => {
      expect(mainContent).not.toMatch(/aws_guardduty_detector/);
    });
  });

  describe("Lambda Package Structure", () => {
    test("Lambda package.json exists", () => {
      const pkgPath = path.join(libPath, "lambda/drift-detector/package.json");
      expect(fs.existsSync(pkgPath)).toBe(true);
    });

    test("Lambda package.json includes AWS SDK v3 dependencies", () => {
      const pkgPath = path.join(libPath, "lambda/drift-detector/package.json");
      const pkgContent = fs.readFileSync(pkgPath, "utf8");
      expect(pkgContent).toMatch(/@aws-sdk\/client-s3/);
      expect(pkgContent).toMatch(/@aws-sdk\/client-sns/);
    });
  });

  describe("Resource Naming Conventions", () => {
    let mainContent: string;

    beforeAll(() => {
      mainContent = fs.readFileSync(path.join(libPath, "main.tf"), "utf8");
    });

    test("all major resources include environment_suffix in name", () => {
      const resourcePatterns = [
        /drift-reports-\$\{var\.environment_suffix\}/,
        /terraform-state-lock-\$\{var\.environment_suffix\}/,
        /aws-config-bucket-\$\{var\.environment_suffix\}/,
        /drift-detector-\$\{var\.environment_suffix\}/,
        /drift-alerts-\$\{var\.environment_suffix\}/,
        /cross-account-drift-\$\{var\.environment_suffix\}/,
      ];

      resourcePatterns.forEach(pattern => {
        expect(mainContent).toMatch(pattern);
      });
    });
  });

  describe("Lambda Error Handling and Logging", () => {
    let lambdaCode: string;

    beforeAll(() => {
      lambdaCode = fs.readFileSync(path.join(libPath, "lambda/drift-detector/index.js"), "utf8");
    });

    test("Lambda implements try-catch error handling", () => {
      expect(lambdaCode).toMatch(/try\s*\{/);
      expect(lambdaCode).toMatch(/catch\s*\(/);
    });

    test("Lambda logs important events", () => {
      expect(lambdaCode).toMatch(/console\.log/);
    });

    test("Lambda sends error notifications", () => {
      expect(lambdaCode).toMatch(/error/);
      expect(lambdaCode).toMatch(/SNS/i);
    });
  });
});
