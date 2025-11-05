// Unit tests for Terraform compliance monitoring infrastructure
import fs from "fs";
import path from "path";

const MAIN_TF_PATH = path.resolve(__dirname, "../lib/main.tf");
const VARIABLES_TF_PATH = path.resolve(__dirname, "../lib/variables.tf");
const OUTPUTS_TF_PATH = path.resolve(__dirname, "../lib/outputs.tf");
const PROVIDER_TF_PATH = path.resolve(__dirname, "../lib/provider.tf");

describe("Terraform Compliance Monitoring Infrastructure - Unit Tests", () => {
  let mainTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    mainTfContent = fs.readFileSync(MAIN_TF_PATH, "utf8");
    variablesTfContent = fs.readFileSync(VARIABLES_TF_PATH, "utf8");
    outputsTfContent = fs.readFileSync(OUTPUTS_TF_PATH, "utf8");
    providerTfContent = fs.readFileSync(PROVIDER_TF_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("main.tf exists", () => {
      expect(fs.existsSync(MAIN_TF_PATH)).toBe(true);
    });

    test("variables.tf exists", () => {
      expect(fs.existsSync(VARIABLES_TF_PATH)).toBe(true);
    });

    test("outputs.tf exists", () => {
      expect(fs.existsSync(OUTPUTS_TF_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_TF_PATH)).toBe(true);
    });
  });

  describe("Provider Configuration", () => {
    test("uses AWS provider", () => {
      expect(providerTfContent).toMatch(/provider\s+"aws"\s*\{/);
    });

    test("configures region from variable", () => {
      expect(providerTfContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("has S3 backend configuration", () => {
      expect(providerTfContent).toMatch(/backend\s+"s3"\s*\{/);
    });

    test("requires Terraform >= 1.4.0", () => {
      expect(providerTfContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });
  });

  describe("Variables", () => {
    test("defines environment_suffix variable", () => {
      expect(variablesTfContent).toMatch(/variable\s+"environment_suffix"\s*\{/);
    });

    test("defines aws_region variable with default eu-central-1", () => {
      expect(variablesTfContent).toMatch(/variable\s+"aws_region"\s*\{/);
      expect(variablesTfContent).toMatch(/default\s*=\s*"eu-central-1"/);
    });

    test("defines lambda_timeout variable with default 180", () => {
      expect(variablesTfContent).toMatch(/variable\s+"lambda_timeout"\s*\{/);
      expect(variablesTfContent).toMatch(/default\s*=\s*180/);
    });
  });

  describe("S3 Resources", () => {
    test("creates S3 bucket for Config with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config_bucket"\s*\{/);
      expect(mainTfContent).toMatch(/bucket\s*=\s*"compliance-config-\$\{var\.environment_suffix\}"/);
    });

    test("enables versioning on Config bucket", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"config_bucket"\s*\{/);
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("configures bucket policy for AWS Config service", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config_bucket_policy"\s*\{/);
      expect(mainTfContent).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
    });
  });

  describe("IAM Resources", () => {
    test("creates IAM role for AWS Config with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"config_role"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"config-role-\$\{var\.environment_suffix\}"/);
    });

    test("creates IAM role for Lambda with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambda_role"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"compliance-lambda-role-\$\{var\.environment_suffix\}"/);
    });

    test("attaches AWS_ConfigRole managed policy", () => {
      expect(mainTfContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/service-role\/AWS_ConfigRole"/);
    });

    test("Lambda role has Config permissions", () => {
      expect(mainTfContent).toMatch(/config:DescribeComplianceByConfigRule/);
      expect(mainTfContent).toMatch(/config:GetComplianceDetailsByConfigRule/);
    });
  });

  describe("AWS Config Resources", () => {
    test("creates Config recorder with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"compliance-recorder-\$\{var\.environment_suffix\}"/);
    });

    test("creates Config delivery channel with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"compliance-channel-\$\{var\.environment_suffix\}"/);
    });

    test("creates S3 encryption Config rule with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"s3_encryption"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"s3-bucket-encryption-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED/);
    });

    test("creates RDS public access Config rule with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_config_rule"\s+"rds_public_access"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"rds-instance-public-access-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/RDS_INSTANCE_PUBLIC_ACCESS_CHECK/);
    });

    test("enables Config recorder", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"\s*\{/);
      expect(mainTfContent).toMatch(/is_enabled\s*=\s*true/);
    });
  });

  describe("Lambda Resources", () => {
    test("creates compliance analyzer Lambda with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"compliance_analyzer"\s*\{/);
      expect(mainTfContent).toMatch(/function_name\s*=\s*"compliance-analyzer-\$\{var\.environment_suffix\}"/);
    });

    test("creates compliance tagger Lambda with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_function"\s+"compliance_tagger"\s*\{/);
      expect(mainTfContent).toMatch(/function_name\s*=\s*"compliance-tagger-\$\{var\.environment_suffix\}"/);
    });

    test("Lambda functions use Node.js 18.x runtime", () => {
      const runtimeMatches = mainTfContent.match(/runtime\s*=\s*"nodejs18\.x"/g);
      expect(runtimeMatches).toHaveLength(2);
    });

    test("Lambda functions use configured timeout", () => {
      expect(mainTfContent).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    });

    test("Lambda functions have CloudWatch log groups", () => {
      expect(mainTfContent).toMatch(/\/aws\/lambda\/compliance-analyzer-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/\/aws\/lambda\/compliance-tagger-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("SNS Resources", () => {
    test("creates critical alerts SNS topic with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"critical_alerts"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"compliance-critical-\$\{var\.environment_suffix\}"/);
    });

    test("creates warning alerts SNS topic with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"warning_alerts"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"compliance-warning-\$\{var\.environment_suffix\}"/);
    });

    test("creates email subscriptions for SNS topics", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"critical_email"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"warning_email"/);
      expect(mainTfContent).toMatch(/protocol\s*=\s*"email"/);
    });
  });

  describe("CloudWatch Resources", () => {
    test("creates CloudWatch dashboard with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_dashboard"\s+"compliance_dashboard"\s*\{/);
      expect(mainTfContent).toMatch(/dashboard_name\s*=\s*"compliance-dashboard-\$\{var\.environment_suffix\}"/);
    });

    test("dashboard tracks CompliancePercentage metric", () => {
      expect(mainTfContent).toMatch(/ComplianceMetrics/);
      expect(mainTfContent).toMatch(/CompliancePercentage/);
    });

    test("dashboard tracks NonCompliantResources metric", () => {
      expect(mainTfContent).toMatch(/NonCompliantResources/);
    });

    test("creates low compliance alarm with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_compliance"\s*\{/);
      expect(mainTfContent).toMatch(/alarm_name\s*=\s*"low-compliance-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/threshold\s*=\s*80/);
    });
  });

  describe("EventBridge Resources", () => {
    test("creates daily compliance check rule with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"daily_compliance_check"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"daily-compliance-check-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/schedule_expression\s*=\s*"rate\(1 day\)"/);
    });

    test("creates Config compliance change rule with environment suffix", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"config_compliance_change"\s*\{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"config-compliance-change-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/Config Rules Compliance Change/);
    });

    test("creates event targets for Lambda functions", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"compliance_analyzer_target"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"tagger_target"/);
    });

    test("grants EventBridge permission to invoke Lambda functions", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_analyzer"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allow_eventbridge_tagger"/);
      expect(mainTfContent).toMatch(/principal\s*=\s*"events\.amazonaws\.com"/);
    });
  });

  describe("Outputs", () => {
    test("outputs Config bucket name", () => {
      expect(outputsTfContent).toMatch(/output\s+"config_bucket_name"\s*\{/);
    });

    test("outputs SNS topic ARNs", () => {
      expect(outputsTfContent).toMatch(/output\s+"critical_alerts_topic_arn"\s*\{/);
      expect(outputsTfContent).toMatch(/output\s+"warning_alerts_topic_arn"\s*\{/);
    });

    test("outputs Lambda function names", () => {
      expect(outputsTfContent).toMatch(/output\s+"compliance_analyzer_function_name"\s*\{/);
      expect(outputsTfContent).toMatch(/output\s+"compliance_tagger_function_name"\s*\{/);
    });

    test("outputs dashboard URL", () => {
      expect(outputsTfContent).toMatch(/output\s+"compliance_dashboard_url"\s*\{/);
    });
  });

  describe("Resource Naming and Environment Suffix", () => {
    test("all resource names include environment_suffix", () => {
      const resourceNames = [
        "compliance-config",
        "config-role",
        "compliance-lambda-role",
        "compliance-recorder",
        "compliance-channel",
        "s3-bucket-encryption",
        "rds-instance-public-access",
        "compliance-analyzer",
        "compliance-tagger",
        "compliance-critical",
        "compliance-warning",
        "compliance-dashboard",
        "low-compliance",
        "daily-compliance-check",
        "config-compliance-change"
      ];

      resourceNames.forEach(name => {
        const pattern = new RegExp(`${name}-\\$\\{var\\.environment_suffix\\}`);
        expect(mainTfContent).toMatch(pattern);
      });
    });

    test("no hardcoded environment values", () => {
      expect(mainTfContent).not.toMatch(/prod-/);
      expect(mainTfContent).not.toMatch(/dev-/);
      expect(mainTfContent).not.toMatch(/stage-/);
    });
  });
});
