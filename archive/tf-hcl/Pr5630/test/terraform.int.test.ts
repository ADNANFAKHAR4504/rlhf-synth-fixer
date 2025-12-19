// Integration tests for Terraform compliance monitoring infrastructure
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

// Check if Terraform CLI is available
function isTerraformAvailable(): boolean {
  try {
    execSync("terraform version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe("Terraform Compliance Monitoring Infrastructure - Integration Tests", () => {
  const terraformAvailable = isTerraformAvailable();

  beforeAll(() => {
    if (!terraformAvailable) {
      console.warn("⚠️  Terraform CLI not found - Terraform command tests will be skipped");
    }
  });

  describe("Terraform Configuration Validation", () => {
    test("terraform init succeeds", () => {
      if (!terraformAvailable) {
        console.log("⏭️  Terraform CLI not available - test skipped");
        return;
      }

      try {
        const output = execSync("terraform init -backend=false", {
          cwd: LIB_DIR,
          encoding: "utf8",
          stdio: "pipe",
        });
        expect(output).toContain("Terraform has been successfully initialized");
      } catch (error: any) {
        throw new Error(`terraform init failed: ${error.message}\n${error.stdout}\n${error.stderr}`);
      }
    }, 60000);

    test("terraform validate succeeds", () => {
      if (!terraformAvailable) {
        console.log("⏭️  Terraform CLI not available - test skipped");
        return;
      }

      try {
        const output = execSync("terraform validate", {
          cwd: LIB_DIR,
          encoding: "utf8",
          stdio: "pipe",
        });
        expect(output).toContain("Success");
        expect(output).toContain("valid");
      } catch (error: any) {
        throw new Error(`terraform validate failed: ${error.message}\n${error.stdout}\n${error.stderr}`);
      }
    });

    test("terraform fmt check passes", () => {
      if (!terraformAvailable) {
        console.log("⏭️  Terraform CLI not available - test skipped");
        return;
      }

      try {
        execSync("terraform fmt -check -recursive", {
          cwd: LIB_DIR,
          encoding: "utf8",
          stdio: "pipe",
        });
        // If no output, formatting is correct
        expect(true).toBe(true);
      } catch (error: any) {
        // If fmt -check fails, it exits with non-zero code
        throw new Error(`terraform fmt check failed - files need formatting:\n${error.stdout}`);
      }
    });
  });

  describe("Lambda Function Packages", () => {
    test("compliance analyzer Lambda package exists", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda", "compliance_analyzer.zip");
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test("compliance tagger Lambda package exists", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda", "compliance_tagger.zip");
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });

    test("compliance analyzer Lambda package is not empty", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda", "compliance_analyzer.zip");
      if (fs.existsSync(lambdaPath)) {
        const stats = fs.statSync(lambdaPath);
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      }
    });

    test("compliance tagger Lambda package is not empty", () => {
      const lambdaPath = path.join(LIB_DIR, "lambda", "compliance_tagger.zip");
      if (fs.existsSync(lambdaPath)) {
        const stats = fs.statSync(lambdaPath);
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      }
    });
  });

  describe("Configuration File Consistency", () => {
    test("all Terraform files use consistent resource naming", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
      const variablesTf = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");

      // Verify environment_suffix variable is defined
      expect(variablesTf).toMatch(/variable\s+"environment_suffix"/);

      // Verify environment_suffix is used in resource names
      const envSuffixUsages = mainTf.match(/\$\{var\.environment_suffix\}/g);
      expect(envSuffixUsages).toBeTruthy();
      expect(envSuffixUsages!.length).toBeGreaterThan(10);
    });

    test("all resources follow naming convention", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      // Check that resource names use kebab-case with environment suffix
      const resourceNamePattern = /"[a-z-]+-\$\{var\.environment_suffix\}"/g;
      const matches = mainTf.match(resourceNamePattern);

      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThan(8);
    });

    test("eu-central-1 region is correctly configured", () => {
      const variablesTf = fs.readFileSync(path.join(LIB_DIR, "variables.tf"), "utf8");
      expect(variablesTf).toMatch(/default\s*=\s*"eu-central-1"/);
    });
  });

  describe("IAM Policy Validation", () => {
    test("Config role has correct service principal", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
      expect(mainTf).toMatch(/Service\s*=\s*"config\.amazonaws\.com"/);
    });

    test("Lambda role has correct service principal", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
      expect(mainTf).toMatch(/Service\s*=\s*"lambda\.amazonaws\.com"/);
    });

    test("S3 bucket policy grants Config required permissions", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      // Verify all three required S3 permissions for Config
      expect(mainTf).toMatch(/s3:GetBucketAcl/);
      expect(mainTf).toMatch(/s3:ListBucket/);
      expect(mainTf).toMatch(/s3:PutObject/);
    });

    test("Lambda policy includes Config read permissions", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainTf).toMatch(/config:DescribeComplianceByConfigRule/);
      expect(mainTf).toMatch(/config:GetComplianceDetailsByConfigRule/);
      expect(mainTf).toMatch(/config:DescribeConfigRules/);
    });

    test("Lambda policy includes CloudWatch Logs permissions", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainTf).toMatch(/logs:CreateLogGroup/);
      expect(mainTf).toMatch(/logs:CreateLogStream/);
      expect(mainTf).toMatch(/logs:PutLogEvents/);
    });
  });

  describe("AWS Config Rule Configuration", () => {
    test("S3 encryption rule uses correct AWS managed rule", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
      expect(mainTf).toMatch(/source_identifier\s*=\s*"S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"/);
    });

    test("RDS public access rule uses correct AWS managed rule", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
      expect(mainTf).toMatch(/source_identifier\s*=\s*"RDS_INSTANCE_PUBLIC_ACCESS_CHECK"/);
    });

    test("Config rules depend on recorder", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const s3RuleBlock = mainTf.match(/resource "aws_config_config_rule" "s3_encryption"[\s\S]*?^\}/m);
      const rdsRuleBlock = mainTf.match(/resource "aws_config_config_rule" "rds_public_access"[\s\S]*?^\}/m);

      expect(s3RuleBlock![0]).toMatch(/depends_on\s*=\s*\[aws_config_configuration_recorder\.main\]/);
      expect(rdsRuleBlock![0]).toMatch(/depends_on\s*=\s*\[aws_config_configuration_recorder\.main\]/);
    });
  });

  describe("EventBridge Integration", () => {
    test("daily compliance check uses correct schedule", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
      expect(mainTf).toMatch(/schedule_expression\s*=\s*"rate\(1 day\)"/);
    });

    test("Config compliance change rule has correct event pattern", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");
      expect(mainTf).toMatch(/source.*aws\.config/);
      expect(mainTf).toMatch(/Config Rules Compliance Change/);
    });

    test("EventBridge rules have Lambda permissions", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const analyzerPermission = mainTf.match(/resource "aws_lambda_permission" "allow_eventbridge_analyzer"/);
      const taggerPermission = mainTf.match(/resource "aws_lambda_permission" "allow_eventbridge_tagger"/);

      expect(analyzerPermission).toBeTruthy();
      expect(taggerPermission).toBeTruthy();
    });
  });

  describe("CloudWatch Configuration", () => {
    test("dashboard tracks compliance metrics", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainTf).toMatch(/ComplianceMetrics/);
      expect(mainTf).toMatch(/CompliancePercentage/);
      expect(mainTf).toMatch(/NonCompliantResources/);
    });

    test("low compliance alarm has correct threshold", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const alarmBlock = mainTf.match(/resource "aws_cloudwatch_metric_alarm" "low_compliance"[\s\S]+?^\}/m);

      expect(alarmBlock![0]).toMatch(/threshold\s*=\s*80/);
      expect(alarmBlock![0]).toMatch(/comparison_operator\s*=\s*"LessThanThreshold"/);
    });

    test("alarm publishes to critical SNS topic", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const alarmBlock = mainTf.match(/resource "aws_cloudwatch_metric_alarm" "low_compliance"[\s\S]+?^\}/m);
      expect(alarmBlock![0]).toMatch(/alarm_actions\s*=\s*\[aws_sns_topic\.critical_alerts\.arn\]/);
    });
  });

  describe("SNS Topic Configuration", () => {
    test("both SNS topics are configured with email subscriptions", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainTf).toMatch(/resource "aws_sns_topic_subscription" "critical_email"/);
      expect(mainTf).toMatch(/resource "aws_sns_topic_subscription" "warning_email"/);
      expect(mainTf).toMatch(/protocol\s*=\s*"email"/);
    });

    test("SNS subscriptions use count for multiple emails", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const criticalSub = mainTf.match(/resource "aws_sns_topic_subscription" "critical_email"[\s\S]+?^\}/m);
      const warningSub = mainTf.match(/resource "aws_sns_topic_subscription" "warning_email"[\s\S]+?^\}/m);

      expect(criticalSub![0]).toMatch(/count\s*=/);
      expect(warningSub![0]).toMatch(/count\s*=/);
    });
  });

  describe("Lambda Function Configuration", () => {
    test("Lambda functions use Node.js 18.x runtime", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const analyzerBlock = mainTf.match(/resource "aws_lambda_function" "compliance_analyzer"[\s\S]+?^\}/m);
      const taggerBlock = mainTf.match(/resource "aws_lambda_function" "compliance_tagger"[\s\S]+?^\}/m);

      expect(analyzerBlock![0]).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
      expect(taggerBlock![0]).toMatch(/runtime\s*=\s*"nodejs18\.x"/);
    });

    test("Lambda functions use configured timeout variable", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      const analyzerBlock = mainTf.match(/resource "aws_lambda_function" "compliance_analyzer"[\s\S]+?^\}/m);
      const taggerBlock = mainTf.match(/resource "aws_lambda_function" "compliance_tagger"[\s\S]+?^\}/m);

      expect(analyzerBlock![0]).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
      expect(taggerBlock![0]).toMatch(/timeout\s*=\s*var\.lambda_timeout/);
    });

    test("Lambda functions have CloudWatch log groups", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainTf).toMatch(/resource "aws_cloudwatch_log_group" "compliance_lambda_logs"/);
      expect(mainTf).toMatch(/resource "aws_cloudwatch_log_group" "tagging_lambda_logs"/);
      expect(mainTf).toMatch(/retention_in_days\s*=\s*14/);
    });

    test("Lambda functions use path.module for file paths", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainTf).toMatch(/filename\s*=\s*"\$\{path\.module\}\/lambda\/compliance_analyzer\.zip"/);
      expect(mainTf).toMatch(/filename\s*=\s*"\$\{path\.module\}\/lambda\/compliance_tagger\.zip"/);
    });

    test("Lambda functions have source_code_hash for change detection", () => {
      const mainTf = fs.readFileSync(path.join(LIB_DIR, "main.tf"), "utf8");

      expect(mainTf).toMatch(/source_code_hash\s*=\s*filebase64sha256/);
    });
  });

  describe("Output Configuration", () => {
    test("all required outputs are defined", () => {
      const outputsTf = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");

      const requiredOutputs = [
        "config_bucket_name",
        "critical_alerts_topic_arn",
        "warning_alerts_topic_arn",
        "compliance_analyzer_function_name",
        "compliance_tagger_function_name",
        "compliance_dashboard_url"
      ];

      requiredOutputs.forEach(output => {
        expect(outputsTf).toMatch(new RegExp(`output\\s+"${output}"\\s*\\{`));
      });
    });

    test("outputs have descriptions", () => {
      const outputsTf = fs.readFileSync(path.join(LIB_DIR, "outputs.tf"), "utf8");

      const descriptionCount = (outputsTf.match(/description\s*=/g) || []).length;
      expect(descriptionCount).toBeGreaterThanOrEqual(6);
    });
  });
});
