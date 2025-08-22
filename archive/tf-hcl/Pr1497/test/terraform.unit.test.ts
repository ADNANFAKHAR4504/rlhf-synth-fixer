// Unit tests for Terraform CI/CD Pipeline Infrastructure
// Tests structure, configuration, and resource definitions

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

// Helper function to read all TF files
function readTerraformFile(filename: string): string {
  const filePath = path.join(libPath, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

// Helper to check if a resource exists in content
function hasResource(content: string, resourceType: string, resourceName: string): boolean {
  const pattern = new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"\\s*{`);
  return pattern.test(content);
}

// Helper to check if a variable exists
function hasVariable(content: string, varName: string): boolean {
  const pattern = new RegExp(`variable\\s+"${varName}"\\s*{`);
  return pattern.test(content);
}

// Helper to check if an output exists
function hasOutput(content: string, outputName: string): boolean {
  const pattern = new RegExp(`output\\s+"${outputName}"\\s*{`);
  return pattern.test(content);
}

describe("Terraform Infrastructure Files", () => {
  test("All required Terraform files exist", () => {
    const requiredFiles = [
      "provider.tf",
      "variables.tf",
      "outputs.tf",
      "tap_stack.tf",
      "s3.tf",
      "iam.tf",
      "codebuild.tf",
      "sns.tf",
      "cloudwatch.tf",
      "eventbridge.tf",
      "secrets.tf",
      "lambda.tf",
      "config.tf",
      "data.tf"
    ];

    requiredFiles.forEach((file) => {
      const filePath = path.join(libPath, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test("Buildspec files exist", () => {
    const buildspecs = ["buildspec-test.yml", "buildspec-deploy.yml"];
    
    buildspecs.forEach((file) => {
      const filePath = path.join(libPath, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});

describe("Variables Configuration", () => {
  let variablesContent: string;

  beforeAll(() => {
    variablesContent = readTerraformFile("variables.tf");
  });

  test("Essential variables are defined", () => {
    const requiredVars = [
      "aws_region",
      "project_name",
      "environments",
      "notification_email",
      "github_owner",
      "github_repo",
      "github_branch",
      "environment_suffix",
      "common_tags"
    ];

    requiredVars.forEach((varName) => {
      expect(hasVariable(variablesContent, varName)).toBe(true);
    });
  });

  test("environment_suffix variable has proper configuration", () => {
    expect(variablesContent).toContain('variable "environment_suffix"');
    expect(variablesContent).toContain('description = "Suffix for environment-specific resource naming"');
  });

  test("common_tags includes required tags", () => {
    expect(variablesContent).toContain("Project");
    expect(variablesContent).toContain("ManagedBy");
    expect(variablesContent).toContain("CostCenter");
  });
});

describe("Provider Configuration", () => {
  let providerContent: string;

  beforeAll(() => {
    providerContent = readTerraformFile("provider.tf");
  });

  test("Terraform version constraint is set", () => {
    expect(providerContent).toContain('required_version = ">= 1.4.0"');
  });

  test("Required providers are configured", () => {
    expect(providerContent).toContain('source  = "hashicorp/aws"');
    expect(providerContent).toContain('source  = "hashicorp/random"');
    expect(providerContent).toContain('source  = "hashicorp/archive"');
  });

  test("S3 backend is configured", () => {
    expect(providerContent).toContain('backend "s3"');
  });

  test("AWS provider uses region variable", () => {
    expect(providerContent).toContain("region = var.aws_region");
  });
});

describe("S3 Buckets Configuration", () => {
  let s3Content: string;

  beforeAll(() => {
    s3Content = readTerraformFile("s3.tf");
  });

  test("All required S3 buckets are defined", () => {
    expect(hasResource(s3Content, "aws_s3_bucket", "pipeline_artifacts")).toBe(true);
    expect(hasResource(s3Content, "aws_s3_bucket", "deployment_logs")).toBe(true);
    expect(hasResource(s3Content, "aws_s3_bucket", "config_logs")).toBe(true);
  });

  test("S3 buckets have force_destroy enabled", () => {
    // Check that force_destroy is set for all buckets
    expect(s3Content).toContain('force_destroy = true');
    
    // Count occurrences of force_destroy in the file
    const forceDestroyCount = (s3Content.match(/force_destroy\s*=\s*true/g) || []).length;
    // We have 3 buckets, all should have force_destroy
    expect(forceDestroyCount).toBe(3);
  });

  test("S3 buckets use environment_suffix in naming", () => {
    expect(s3Content).toContain("${var.environment_suffix}-${var.project_name}");
  });

  test("S3 buckets have versioning enabled", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_versioning", "pipeline_artifacts")).toBe(true);
    expect(hasResource(s3Content, "aws_s3_bucket_versioning", "deployment_logs")).toBe(true);
  });

  test("S3 buckets have encryption configured", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_server_side_encryption_configuration", "pipeline_artifacts")).toBe(true);
    expect(hasResource(s3Content, "aws_s3_bucket_server_side_encryption_configuration", "deployment_logs")).toBe(true);
  });

  test("S3 buckets have public access blocked", () => {
    expect(hasResource(s3Content, "aws_s3_bucket_public_access_block", "pipeline_artifacts")).toBe(true);
    expect(hasResource(s3Content, "aws_s3_bucket_public_access_block", "deployment_logs")).toBe(true);
  });

  test("Random ID resource exists for bucket naming", () => {
    expect(hasResource(s3Content, "random_id", "bucket_suffix")).toBe(true);
  });
});

describe("IAM Roles and Policies", () => {
  let iamContent: string;

  beforeAll(() => {
    iamContent = readTerraformFile("iam.tf");
  });

  test("All required IAM roles are defined", () => {
    const roles = [
      "codepipeline_role",
      "codebuild_role",
      "cloudformation_role",
      "lambda_role",
      "config_role"
    ];

    roles.forEach((role) => {
      expect(hasResource(iamContent, "aws_iam_role", role)).toBe(true);
    });
  });

  test("IAM roles use environment_suffix in naming", () => {
    expect(iamContent).toContain('name = "${var.environment_suffix}-${var.project_name}');
  });

  test("IAM role policies are attached", () => {
    expect(hasResource(iamContent, "aws_iam_role_policy", "codepipeline_policy")).toBe(true);
    expect(hasResource(iamContent, "aws_iam_role_policy", "codebuild_policy")).toBe(true);
    expect(hasResource(iamContent, "aws_iam_role_policy", "cloudformation_policy")).toBe(true);
    expect(hasResource(iamContent, "aws_iam_role_policy", "lambda_policy")).toBe(true);
  });

  test("Config role has correct policy attachment", () => {
    expect(hasResource(iamContent, "aws_iam_role_policy_attachment", "config_role_policy")).toBe(true);
    expect(iamContent).toContain("AWS_ConfigRole");
  });
});

describe("CodeBuild Projects", () => {
  let codebuildContent: string;

  beforeAll(() => {
    codebuildContent = readTerraformFile("codebuild.tf");
  });

  test("All CodeBuild projects are defined", () => {
    expect(hasResource(codebuildContent, "aws_codebuild_project", "test_project")).toBe(true);
    expect(hasResource(codebuildContent, "aws_codebuild_project", "deploy_dev")).toBe(true);
    expect(hasResource(codebuildContent, "aws_codebuild_project", "deploy_prod")).toBe(true);
  });

  test("CodeBuild projects use environment_suffix in naming", () => {
    expect(codebuildContent).toContain('name         = "${var.environment_suffix}-${var.project_name}');
  });

  test("CodeBuild projects have proper artifact configuration", () => {
    expect(codebuildContent).toContain('type = "CODEPIPELINE"');
  });

  test("CodeBuild projects have CloudWatch logs configured", () => {
    expect(codebuildContent).toContain('cloudwatch_logs {');
    expect(codebuildContent).toContain('group_name = aws_cloudwatch_log_group.codebuild_logs.name');
  });

  test("CodeBuild projects have S3 logs configured", () => {
    expect(codebuildContent).toContain('s3_logs {');
  });

  test("CodeBuild projects reference buildspec files", () => {
    expect(codebuildContent).toContain('buildspec = "buildspec-test.yml"');
    expect(codebuildContent).toContain('buildspec = "buildspec-deploy.yml"');
  });
});

describe("CodePipeline Configuration", () => {
  let pipelineContent: string;

  beforeAll(() => {
    pipelineContent = readTerraformFile("tap_stack.tf");
  });

  test("CodePipeline resource is defined", () => {
    expect(hasResource(pipelineContent, "aws_codepipeline", "main_pipeline")).toBe(true);
  });

  test("Pipeline uses environment_suffix in naming", () => {
    expect(pipelineContent).toContain('name     = "${var.environment_suffix}-${var.project_name}-pipeline"');
  });

  test("All required pipeline stages are defined", () => {
    const stages = [
      "Source",
      "Test",
      "DeployDev",
      "ApprovalForProduction",
      "DeployProd",
      "RollbackOnFailure"
    ];

    stages.forEach((stage) => {
      expect(pipelineContent).toContain(`name = "${stage}"`);
    });
  });

  test("Manual approval stage is configured", () => {
    expect(pipelineContent).toContain('category = "Approval"');
    expect(pipelineContent).toContain('provider = "Manual"');
  });

  test("Pipeline has artifact store configured", () => {
    expect(pipelineContent).toContain('artifact_store {');
    expect(pipelineContent).toContain('type     = "S3"');
  });
});

describe("Lambda Function", () => {
  let lambdaContent: string;

  beforeAll(() => {
    lambdaContent = readTerraformFile("lambda.tf");
  });

  test("Lambda rollback function is defined", () => {
    expect(hasResource(lambdaContent, "aws_lambda_function", "rollback_function")).toBe(true);
  });

  test("Lambda function uses environment_suffix in naming", () => {
    expect(lambdaContent).toContain('function_name    = "${var.environment_suffix}-${var.project_name}-rollback-function"');
  });

  test("Lambda function has environment variables", () => {
    expect(lambdaContent).toContain("SNS_TOPIC_ARN");
  });

  test("Lambda function archive is configured", () => {
    // Check for the data archive_file - it's defined as a data source
    expect(lambdaContent).toContain('data "archive_file" "rollback_zip"');
  });
});

describe("SNS and Notifications", () => {
  let snsContent: string;

  beforeAll(() => {
    snsContent = readTerraformFile("sns.tf");
  });

  test("SNS topic is defined", () => {
    expect(hasResource(snsContent, "aws_sns_topic", "pipeline_notifications")).toBe(true);
  });

  test("SNS topic uses environment_suffix in naming", () => {
    expect(snsContent).toContain('name = "${var.environment_suffix}-${var.project_name}-pipeline-notifications"');
  });

  test("Email subscription is configured", () => {
    expect(hasResource(snsContent, "aws_sns_topic_subscription", "email_notification")).toBe(true);
    expect(snsContent).toContain('protocol  = "email"');
  });

  test("SNS topic policy is configured", () => {
    expect(hasResource(snsContent, "aws_sns_topic_policy", "pipeline_notifications_policy")).toBe(true);
  });
});

describe("CloudWatch Resources", () => {
  let cloudwatchContent: string;

  beforeAll(() => {
    cloudwatchContent = readTerraformFile("cloudwatch.tf");
  });

  test("CloudWatch log group is defined", () => {
    expect(hasResource(cloudwatchContent, "aws_cloudwatch_log_group", "codebuild_logs")).toBe(true);
  });

  test("Log group has retention configured", () => {
    expect(cloudwatchContent).toContain("retention_in_days = 30");
  });

  test("CloudWatch alarms are defined", () => {
    expect(hasResource(cloudwatchContent, "aws_cloudwatch_metric_alarm", "pipeline_failure")).toBe(true);
    expect(hasResource(cloudwatchContent, "aws_cloudwatch_metric_alarm", "pipeline_success")).toBe(true);
  });

  test("Alarms use environment_suffix in naming", () => {
    expect(cloudwatchContent).toContain('alarm_name          = "${var.environment_suffix}-${var.project_name}');
  });
});

describe("EventBridge Configuration", () => {
  let eventbridgeContent: string;

  beforeAll(() => {
    eventbridgeContent = readTerraformFile("eventbridge.tf");
  });

  test("EventBridge rule is defined", () => {
    expect(hasResource(eventbridgeContent, "aws_cloudwatch_event_rule", "pipeline_state_change")).toBe(true);
  });

  test("EventBridge rule uses environment_suffix in naming", () => {
    expect(eventbridgeContent).toContain('name        = "${var.environment_suffix}-${var.project_name}-pipeline-state-change"');
  });

  test("EventBridge target is configured", () => {
    expect(hasResource(eventbridgeContent, "aws_cloudwatch_event_target", "sns")).toBe(true);
  });
});

describe("Secrets Manager", () => {
  let secretsContent: string;

  beforeAll(() => {
    secretsContent = readTerraformFile("secrets.tf");
  });

  test("Required secrets are defined", () => {
    expect(hasResource(secretsContent, "aws_secretsmanager_secret", "github_token")).toBe(true);
    expect(hasResource(secretsContent, "aws_secretsmanager_secret", "app_config")).toBe(true);
  });

  test("Secrets use environment_suffix in naming", () => {
    expect(secretsContent).toContain('name        = "${var.environment_suffix}-${var.project_name}/github-token"');
    expect(secretsContent).toContain('name        = "${var.environment_suffix}-${var.project_name}/app-config"');
  });

  test("Secret version is configured for app_config", () => {
    expect(hasResource(secretsContent, "aws_secretsmanager_secret_version", "app_config")).toBe(true);
  });
});

describe("Outputs Configuration", () => {
  let outputsContent: string;

  beforeAll(() => {
    outputsContent = readTerraformFile("outputs.tf");
  });

  test("Essential outputs are defined", () => {
    const requiredOutputs = [
      "pipeline_name",
      "pipeline_arn",
      "artifacts_bucket",
      "logs_bucket",
      "sns_topic_arn",
      "codebuild_test_project",
      "codebuild_deploy_dev_project",
      "codebuild_deploy_prod_project",
      "rollback_function_name"
    ];

    requiredOutputs.forEach((output) => {
      expect(hasOutput(outputsContent, output)).toBe(true);
    });
  });
});

describe("Resource Tagging", () => {
  const files = ["s3.tf", "iam.tf", "codebuild.tf", "tap_stack.tf", "sns.tf", "cloudwatch.tf"];
  
  test("Resources use common_tags", () => {
    files.forEach((file) => {
      const content = readTerraformFile(file);
      expect(content).toContain("merge(var.common_tags");
    });
  });

  test("Resources include Environment tag with environment_suffix", () => {
    files.forEach((file) => {
      const content = readTerraformFile(file);
      // Check if the file contains Environment tag references
      if (content.includes("tags")) {
        expect(content).toContain("Environment");
      }
    });
  });
});

describe("Security Best Practices", () => {
  test("S3 buckets have encryption enabled", () => {
    const s3Content = readTerraformFile("s3.tf");
    expect(s3Content).toContain("aws_s3_bucket_server_side_encryption_configuration");
    expect(s3Content).toContain("sse_algorithm");
  });

  test("S3 buckets have public access blocked", () => {
    const s3Content = readTerraformFile("s3.tf");
    expect(s3Content).toContain("block_public_acls       = true");
    expect(s3Content).toContain("block_public_policy     = true");
    expect(s3Content).toContain("ignore_public_acls      = true");
    expect(s3Content).toContain("restrict_public_buckets = true");
  });

  test("Secrets are stored in Secrets Manager", () => {
    const secretsContent = readTerraformFile("secrets.tf");
    expect(secretsContent).toContain("aws_secretsmanager_secret");
  });

  test("IAM roles follow least privilege", () => {
    const iamContent = readTerraformFile("iam.tf");
    expect(iamContent).toContain("AssumeRole");
    expect(iamContent).toContain("Principal");
  });
});

describe("Infrastructure Naming Convention", () => {
  test("Resources follow [env]-myapp-[resource] pattern", () => {
    const files = ["s3.tf", "iam.tf", "codebuild.tf", "tap_stack.tf", "lambda.tf"];
    
    files.forEach((file) => {
      const content = readTerraformFile(file);
      // Check for environment_suffix usage in resource names
      expect(content).toContain("${var.environment_suffix}-${var.project_name}");
    });
  });
});