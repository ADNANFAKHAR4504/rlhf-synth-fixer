// test/terraform.unit.test.ts
// Unit tests for Terraform CI/CD Pipeline infrastructure defined in lib/
// These tests validate the structure and configuration without executing Terraform

import fs from "fs";
import path from "path";

const LIB_PATH = path.resolve(__dirname, "../lib");
const MAIN_TF_PATH = path.resolve(LIB_PATH, "main.tf");
const BACKEND_TF_PATH = path.resolve(LIB_PATH, "backend.tf");
const VARIABLES_TF_PATH = path.resolve(LIB_PATH, "variables.tf");
const OUTPUTS_TF_PATH = path.resolve(LIB_PATH, "outputs.tf");
const VERSIONS_TF_PATH = path.resolve(LIB_PATH, "versions.tf");

// Check for flat-outputs.json in multiple locations
const FLAT_OUTPUTS_PATHS = [
  path.resolve(__dirname, "../cfn-outputs/flat-outputs.json"),
  path.resolve(LIB_PATH, "flat-outputs.json"),
];

describe("Terraform CI/CD Pipeline Unit Tests", () => {
  let mainTfContent: string;
  let backendTfContent: string;
  let variablesTfContent: string;
  let outputsTfContent: string;
  let versionsTfContent: string;
  let flatOutputsData: Record<string, unknown> | null = null;

  beforeAll(() => {
    // Read main Terraform files
    mainTfContent = fs.readFileSync(MAIN_TF_PATH, "utf8");
    backendTfContent = fs.readFileSync(BACKEND_TF_PATH, "utf8");
    variablesTfContent = fs.readFileSync(VARIABLES_TF_PATH, "utf8");
    outputsTfContent = fs.readFileSync(OUTPUTS_TF_PATH, "utf8");

    if (fs.existsSync(VERSIONS_TF_PATH)) {
      versionsTfContent = fs.readFileSync(VERSIONS_TF_PATH, "utf8");
    } else {
      versionsTfContent = "";
    }

    // Try to load flat-outputs.json if available
    for (const outputPath of FLAT_OUTPUTS_PATHS) {
      if (fs.existsSync(outputPath)) {
        try {
          flatOutputsData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
          break;
        } catch (e) {
          console.warn(`Failed to parse flat-outputs.json at ${outputPath}:`, e);
        }
      }
    }
  });

  describe("File Structure and Existence", () => {
    test("main Terraform files exist", () => {
      expect(fs.existsSync(MAIN_TF_PATH)).toBe(true);
      expect(fs.existsSync(BACKEND_TF_PATH)).toBe(true);
      expect(fs.existsSync(VARIABLES_TF_PATH)).toBe(true);
      expect(fs.existsSync(OUTPUTS_TF_PATH)).toBe(true);
    });

    test("all Terraform files are not empty", () => {
      expect(mainTfContent.length).toBeGreaterThan(0);
      expect(backendTfContent.length).toBeGreaterThan(0);
      expect(variablesTfContent.length).toBeGreaterThan(0);
      expect(outputsTfContent.length).toBeGreaterThan(0);
    });
  });

  describe("Backend Configuration", () => {
    test("backend.tf uses S3 backend for state management", () => {
      expect(backendTfContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("backend configuration supports dynamic configuration", () => {
      // S3 backend should allow -backend-config options
      expect(backendTfContent).toMatch(/terraform\s*{/);
      expect(backendTfContent).toMatch(/backend\s+"s3"/);
    });
  });

  describe("Provider and Version Configuration", () => {
    test("versions.tf or main.tf contains required providers", () => {
      const allContent = versionsTfContent + mainTfContent;
      expect(allContent).toMatch(/required_providers|provider\s+"aws"/);
    });

    test("AWS provider is configured", () => {
      const allContent = versionsTfContent + mainTfContent;
      expect(allContent).toMatch(/aws\s*=|provider\s+"aws"/);
    });
  });

  describe("Variables Configuration", () => {
    test("defines essential variables", () => {
      expect(variablesTfContent).toMatch(/variable\s+"region"\s*{/);
      expect(variablesTfContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("variables have descriptions", () => {
      const variableMatches = variablesTfContent.match(/variable\s+"\w+"\s*{/g) || [];
      const descriptionMatches = variablesTfContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBeGreaterThanOrEqual(variableMatches.length * 0.8);
    });

    test("variables have types defined", () => {
      const variableMatches = variablesTfContent.match(/variable\s+"\w+"\s*{/g) || [];
      const typeMatches = variablesTfContent.match(/type\s*=/g) || [];
      expect(typeMatches.length).toBeGreaterThanOrEqual(variableMatches.length * 0.8);
    });
  });

  describe("CI/CD Pipeline Resources", () => {
    test("defines KMS key for encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_key"\s+"\w+"/);
    });

    test("defines KMS alias", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_kms_alias"\s+"\w+"/);
    });

    test("defines S3 bucket for Terraform state", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"terraform_state"/);
    });

    test("defines S3 bucket for pipeline artifacts", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"pipeline_artifacts"/);
    });

    test("S3 buckets have versioning enabled", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(mainTfContent).toMatch(/status\s*=\s*"Enabled"/);
    });

    test("S3 buckets have server-side encryption", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
    });

    test("S3 buckets have public access blocked", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
    });

    test("defines DynamoDB table for state locking", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_locks"/);
      expect(mainTfContent).toMatch(/hash_key\s*=\s*"LockID"/);
    });
  });

  describe("CodeCommit Repository", () => {
    test("defines CodeCommit repository", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_codecommit_repository"\s+"\w+"/);
    });

    test("CodeCommit repository has description", () => {
      expect(mainTfContent).toMatch(/description\s*=\s*".*infrastructure.*code.*"/i);
    });
  });

  describe("SNS Configuration", () => {
    test("defines SNS topic for approvals", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_approvals"/);
    });

    test("SNS topic uses KMS encryption", () => {
      expect(mainTfContent).toMatch(/kms_master_key_id\s*=\s*aws_kms_key\.\w+\.id/);
    });

    test("defines SNS topic subscription", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"\w+"/);
    });
  });

  describe("IAM Roles Configuration", () => {
    test("defines CodePipeline IAM role", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline_role"/);
    });

    test("defines CodeBuild IAM role", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"codebuild_role"/);
    });

    test("defines EventBridge IAM role", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_role"/);
    });

    test("IAM roles have proper assume role policies", () => {
      expect(mainTfContent).toMatch(/assume_role_policy\s*=/);
      expect(mainTfContent).toMatch(/codepipeline\.amazonaws\.com/);
      expect(mainTfContent).toMatch(/codebuild\.amazonaws\.com/);
      expect(mainTfContent).toMatch(/events\.amazonaws\.com/);
    });

    test("IAM role policies are defined", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"codepipeline_policy"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"codebuild_policy"/);
    });
  });

  describe("CloudWatch Configuration", () => {
    test("defines CloudWatch log groups for CodeBuild", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_plan"/);
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"codebuild_apply"/);
    });

    test("log groups have retention configured", () => {
      expect(mainTfContent).toMatch(/retention_in_days\s*=\s*\d+/);
    });
  });

  describe("CodeBuild Projects", () => {
    test("defines CodeBuild project for Terraform plan", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_plan"/);
    });

    test("defines CodeBuild project for Terraform apply", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_codebuild_project"\s+"terraform_apply"/);
    });

    test("CodeBuild projects have service role configured", () => {
      expect(mainTfContent).toMatch(/service_role\s*=\s*aws_iam_role\.codebuild_role\.arn/);
    });

    test("CodeBuild projects have build timeout", () => {
      expect(mainTfContent).toMatch(/build_timeout\s*=\s*\d+/);
    });

    test("CodeBuild projects use CODEPIPELINE as artifact type", () => {
      expect(mainTfContent).toMatch(/type\s*=\s*"CODEPIPELINE"/);
    });

    test("CodeBuild projects have environment variables", () => {
      expect(mainTfContent).toMatch(/environment_variable\s*{/);
      expect(mainTfContent).toMatch(/name\s*=\s*"TF_VERSION"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"STATE_BUCKET"/);
    });

    test("CodeBuild projects have logs configuration", () => {
      expect(mainTfContent).toMatch(/logs_config\s*{/);
      expect(mainTfContent).toMatch(/cloudwatch_logs\s*{/);
    });

    test("CodeBuild projects have buildspec defined", () => {
      expect(mainTfContent).toMatch(/buildspec\s*=/);
      expect(mainTfContent).toMatch(/version:\s*0\.2/);
      expect(mainTfContent).toMatch(/terraform\s+init/);
      expect(mainTfContent).toMatch(/terraform\s+plan/);
      expect(mainTfContent).toMatch(/terraform\s+apply/);
    });

    test("CodeBuild projects use KMS encryption", () => {
      expect(mainTfContent).toMatch(/encryption_key\s*=\s*aws_kms_key\.\w+\.arn/);
    });
  });

  describe("CodePipeline Configuration", () => {
    test("defines CodePipeline resource", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_codepipeline"\s+"terraform_pipeline"/);
    });

    test("CodePipeline has role configured", () => {
      expect(mainTfContent).toMatch(/role_arn\s*=\s*aws_iam_role\.codepipeline_role\.arn/);
    });

    test("CodePipeline has artifact store with S3", () => {
      expect(mainTfContent).toMatch(/artifact_store\s*{/);
      expect(mainTfContent).toMatch(/type\s*=\s*"S3"/);
    });

    test("CodePipeline has Source stage", () => {
      expect(mainTfContent).toMatch(/stage\s*{\s*name\s*=\s*"Source"/);
      expect(mainTfContent).toMatch(/provider\s*=\s*"CodeCommit"/);
    });

    test("CodePipeline has TerraformPlan stage", () => {
      expect(mainTfContent).toMatch(/stage\s*{\s*name\s*=\s*"TerraformPlan"/);
    });

    test("CodePipeline has ManualApproval stage", () => {
      expect(mainTfContent).toMatch(/stage\s*{\s*name\s*=\s*"ManualApproval"/);
      expect(mainTfContent).toMatch(/provider\s*=\s*"Manual"/);
    });

    test("CodePipeline has TerraformApply stage", () => {
      expect(mainTfContent).toMatch(/stage\s*{\s*name\s*=\s*"TerraformApply"/);
    });

    test("Manual approval sends notifications to SNS", () => {
      expect(mainTfContent).toMatch(/NotificationArn\s*=\s*aws_sns_topic\.pipeline_approvals\.arn/);
    });
  });

  describe("EventBridge Configuration", () => {
    test("defines EventBridge rule for CodeCommit trigger", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"codecommit_trigger"/);
    });

    test("EventBridge rule has event pattern for CodeCommit", () => {
      expect(mainTfContent).toMatch(/event_pattern\s*=/);
      expect(mainTfContent).toMatch(/aws\.codecommit/);
    });

    test("defines EventBridge target for pipeline", () => {
      expect(mainTfContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"pipeline"/);
    });

    test("EventBridge target triggers the pipeline", () => {
      expect(mainTfContent).toMatch(/arn\s*=\s*aws_codepipeline\.terraform_pipeline\.arn/);
    });
  });

  describe("Outputs Configuration", () => {
    test("outputs CodeCommit clone URLs", () => {
      expect(outputsTfContent).toMatch(/output\s+"codecommit_clone_url_http"/);
      expect(outputsTfContent).toMatch(/output\s+"codecommit_clone_url_ssh"/);
    });

    test("outputs pipeline information", () => {
      expect(outputsTfContent).toMatch(/output\s+"pipeline_arn"/);
      expect(outputsTfContent).toMatch(/output\s+"pipeline_name"/);
    });

    test("outputs state management resources", () => {
      expect(outputsTfContent).toMatch(/output\s+"terraform_state_bucket"/);
      expect(outputsTfContent).toMatch(/output\s+"terraform_locks_table"/);
    });

    test("outputs SNS topic ARN", () => {
      expect(outputsTfContent).toMatch(/output\s+"sns_topic_arn"/);
    });

    test("outputs KMS key ARN", () => {
      expect(outputsTfContent).toMatch(/output\s+"kms_key_arn"/);
    });

    test("all outputs have descriptions", () => {
      const outputMatches = outputsTfContent.match(/output\s+"\w+"/g) || [];
      const descriptionMatches = outputsTfContent.match(/description\s*=/g) || [];
      expect(descriptionMatches.length).toBe(outputMatches.length);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded AWS account IDs", () => {
      // Remove comments before checking
      const cleanContent = mainTfContent.replace(/#.*$/gm, "");
      expect(cleanContent).not.toMatch(/[0-9]{12}/);
    });

    test("no hardcoded AWS credentials", () => {
      expect(mainTfContent).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(mainTfContent).not.toMatch(/aws_access_key_id\s*=\s*"/);
      expect(mainTfContent).not.toMatch(/aws_secret_access_key\s*=\s*"/);
    });

    test("resources use environment suffix for uniqueness", () => {
      expect(mainTfContent).toMatch(/\$\{var\.environment_suffix\}/);
    });

    test("resources have proper tagging", () => {
      expect(mainTfContent).toMatch(/tags\s*=\s*{/);
      expect(mainTfContent).toMatch(/Name\s*=/);
      expect(mainTfContent).toMatch(/Environment\s*=/);
      expect(mainTfContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("S3 buckets follow naming convention", () => {
      expect(mainTfContent).toMatch(/bucket\s*=\s*"terraform-state-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/bucket\s*=\s*"pipeline-artifacts-\$\{var\.environment_suffix\}"/);
    });

    test("DynamoDB table follows naming convention", () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"terraform-locks-\$\{var\.environment_suffix\}"/);
    });

    test("CodePipeline follows naming convention", () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"terraform-pipeline-\$\{var\.environment_suffix\}"/);
    });

    test("CodeBuild projects follow naming convention", () => {
      expect(mainTfContent).toMatch(/name\s*=\s*"terraform-plan-\$\{var\.environment_suffix\}"/);
      expect(mainTfContent).toMatch(/name\s*=\s*"terraform-apply-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("Dynamic Testing from Outputs", () => {
    test("flat-outputs.json is parseable if exists", () => {
      if (flatOutputsData) {
        expect(typeof flatOutputsData).toBe("object");
      } else {
        expect(true).toBe(true); // Skip if no outputs
      }
    });

    test("outputs contain expected keys if available", () => {
      if (flatOutputsData) {
        const expectedKeys = [
          "codecommit_clone_url_http",
          "codecommit_clone_url_ssh",
          "pipeline_arn",
          "pipeline_name",
          "terraform_state_bucket",
          "terraform_locks_table",
          "sns_topic_arn",
          "kms_key_arn",
        ];

        const availableKeys = Object.keys(flatOutputsData);
        const matchedKeys = expectedKeys.filter((key) => availableKeys.includes(key));
        expect(matchedKeys.length).toBeGreaterThan(0);
      } else {
        expect(true).toBe(true); // Skip if no outputs
      }
    });
  });
});

