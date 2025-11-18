import * as fs from 'fs';
import * as path from 'path';

describe('Terraform CodePipeline Infrastructure Unit Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');

  describe('File Structure Tests', () => {
    test('all required .tf files exist', () => {
      const requiredFiles = [
        'provider.tf',
        'variables.tf',
        'main.tf',
        's3.tf',
        'iam.tf',
        'sns.tf',
        'cloudwatch.tf',
        'eventbridge.tf',
        'outputs.tf',
      ];

      requiredFiles.forEach((file) => {
        const filePath = path.join(libDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('provider.tf contains required providers', () => {
      const content = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      expect(content).toContain('terraform');
      expect(content).toContain('required_version');
      expect(content).toContain('>= 1.0');
      expect(content).toContain('hashicorp/aws');
      expect(content).toContain('~> 5.0');
    });

    test('variables.tf contains all required variables', () => {
      const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      const requiredVars = [
        'environment_suffix',
        'aws_region',
        'github_repository_owner',
        'github_repository_name',
        'github_branch',
        'notification_email',
        'log_retention_days',
        'enable_pipeline_alarms',
        'codebuild_compute_type',
        'codebuild_image',
      ];

      requiredVars.forEach((varName) => {
        expect(content).toContain(`variable "${varName}"`);
      });
    });
  });

  describe('Resource Naming Tests', () => {
    test('all resources include environment_suffix', () => {
      const filesToCheck = ['main.tf', 's3.tf', 'iam.tf', 'sns.tf', 'cloudwatch.tf', 'eventbridge.tf'];

      filesToCheck.forEach((file) => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        const resourceMatches = content.match(/resource\s+"[^"]+"\s+"[^"]+"/g) || [];

        if (resourceMatches.length > 0) {
          expect(content).toContain('var.environment_suffix');
        }
      });
    });

    test('CodeStar connection name includes environment_suffix', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/name\s*=\s*"github-connection-\$\{var\.environment_suffix\}"/);
    });

    test('CodePipeline name includes environment_suffix', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/name\s*=\s*"terraform-pipeline-\$\{var\.environment_suffix\}"/);
    });

    test('S3 bucket name includes environment_suffix', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toMatch(/bucket\s*=\s*"pipeline-artifacts-\$\{var\.environment_suffix\}"/);
    });

    test('SNS topic name includes environment_suffix', () => {
      const content = fs.readFileSync(path.join(libDir, 'sns.tf'), 'utf8');
      expect(content).toMatch(/name\s*=\s*"pipeline-notifications-\$\{var\.environment_suffix\}"/);
    });

    test('CloudWatch log groups include environment_suffix', () => {
      const content = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(content).toMatch(/terraform-validate-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/terraform-plan-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/terraform-apply-\$\{var\.environment_suffix\}/);
    });

    test('IAM roles include environment_suffix', () => {
      const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
      expect(content).toMatch(/codepipeline-role-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/codebuild-role-\$\{var\.environment_suffix\}/);
    });
  });

  describe('CodeStar Connection Tests', () => {
    test('CodeStar connection configured for GitHub', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toContain('aws_codestarconnections_connection');
      expect(content).toContain('provider_type = "GitHub"');
    });

    test('CodeStar connection NOT using CodeCommit', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).not.toContain('provider_type = "CodeCommit"');
      expect(content).not.toContain('aws_codecommit');
    });
  });

  describe('CodePipeline Configuration Tests', () => {
    test('CodePipeline has 5 stages (Source, Validate, Plan, Approval, Apply)', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      const stageMatches = content.match(/stage\s*\{/g) || [];
      expect(stageMatches.length).toBe(5);
    });

    test('Source stage uses CodeStarSourceConnection', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/provider\s*=\s*"CodeStarSourceConnection"/);
      expect(content).toContain('ConnectionArn');
    });

    test('Pipeline includes manual approval stage', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toContain('category = "Approval"');
      expect(content).toContain('provider = "Manual"');
    });

    test('Pipeline stages reference correct CodeBuild projects', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toContain('terraform_validate');
      expect(content).toContain('terraform_plan');
      expect(content).toContain('terraform_apply');
    });

    test('Pipeline artifact store references S3 bucket', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/artifact_store\s*\{/);
      expect(content).toContain('aws_s3_bucket.pipeline_artifacts.bucket');
    });
  });

  describe('CodeBuild Projects Tests', () => {
    test('three CodeBuild projects exist', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toContain('aws_codebuild_project.terraform_validate');
      expect(content).toContain('aws_codebuild_project.terraform_plan');
      expect(content).toContain('aws_codebuild_project.terraform_apply');
    });

    test('validate project runs terraform validate', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toContain('terraform init -backend=false');
      expect(content).toContain('terraform validate');
    });

    test('plan project runs terraform plan', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      const planSection = content.match(
        /resource "aws_codebuild_project" "terraform_plan"[\s\S]*?buildspec = <<-EOT[\s\S]*?EOT/
      );
      expect(planSection).toBeTruthy();
      expect(planSection![0]).toContain('terraform plan');
    });

    test('apply project runs terraform apply', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      const applySection = content.match(
        /resource "aws_codebuild_project" "terraform_apply"[\s\S]*?buildspec = <<-EOT[\s\S]*?EOT/
      );
      expect(applySection).toBeTruthy();
      expect(applySection![0]).toContain('terraform apply -auto-approve');
    });

    test('CodeBuild projects use correct compute type', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/compute_type\s*=\s*var\.codebuild_compute_type/);
    });

    test('CodeBuild projects use correct image', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/image\s*=\s*var\.codebuild_image/);
    });

    test('CodeBuild projects have CloudWatch logging configured', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/logs_config\s*\{/);
      expect(content).toContain('cloudwatch_logs');
    });
  });

  describe('S3 Bucket Configuration Tests', () => {
    test('S3 bucket has force_destroy enabled', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toContain('force_destroy = true');
    });

    test('S3 bucket versioning is enabled', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toContain('aws_s3_bucket_versioning');
      expect(content).toContain('status = "Enabled"');
    });

    test('S3 bucket encryption is configured', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(content).toContain('sse_algorithm = "AES256"');
    });

    test('S3 bucket public access is blocked', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toContain('aws_s3_bucket_public_access_block');
      expect(content).toContain('block_public_acls       = true');
      expect(content).toContain('block_public_policy     = true');
      expect(content).toContain('ignore_public_acls      = true');
      expect(content).toContain('restrict_public_buckets = true');
    });

    test('S3 bucket lifecycle policy is configured', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(content).toMatch(/expiration\s*\{/);
      expect(content).toContain('days = 90');
    });

    test('S3 bucket lifecycle has filter configured', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toMatch(/filter\s*\{/);
    });
  });

  describe('IAM Configuration Tests', () => {
    test('CodePipeline IAM role exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
      expect(content).toContain('aws_iam_role.codepipeline');
      expect(content).toContain('codepipeline.amazonaws.com');
    });

    test('CodeBuild IAM role exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
      expect(content).toContain('aws_iam_role.codebuild');
      expect(content).toContain('codebuild.amazonaws.com');
    });

    test('CodePipeline role has S3 permissions', () => {
      const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
      expect(content).toMatch(/s3:GetObject/);
      expect(content).toMatch(/s3:PutObject/);
    });

    test('CodePipeline role has CodeBuild permissions', () => {
      const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
      expect(content).toContain('codebuild:BatchGetBuilds');
      expect(content).toContain('codebuild:StartBuild');
    });

    test('CodePipeline role has CodeStar connection permissions', () => {
      const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
      expect(content).toContain('codestar-connections:UseConnection');
    });

    test('CodeBuild role has CloudWatch Logs permissions', () => {
      const content = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
      expect(content).toMatch(/logs:CreateLogGroup/);
      expect(content).toMatch(/logs:CreateLogStream/);
      expect(content).toMatch(/logs:PutLogEvents/);
    });
  });

  describe('SNS Configuration Tests', () => {
    test('SNS topic exists for notifications', () => {
      const content = fs.readFileSync(path.join(libDir, 'sns.tf'), 'utf8');
      expect(content).toContain('aws_sns_topic.pipeline_notifications');
    });

    test('SNS topic policy allows CodePipeline to publish', () => {
      const content = fs.readFileSync(path.join(libDir, 'sns.tf'), 'utf8');
      expect(content).toContain('aws_sns_topic_policy');
      expect(content).toContain('codepipeline.amazonaws.com');
      expect(content).toContain('SNS:Publish');
    });

    test('SNS topic policy allows EventBridge to publish', () => {
      const content = fs.readFileSync(path.join(libDir, 'sns.tf'), 'utf8');
      expect(content).toContain('events.amazonaws.com');
    });

    test('SNS email subscription is conditional', () => {
      const content = fs.readFileSync(path.join(libDir, 'sns.tf'), 'utf8');
      expect(content).toContain('aws_sns_topic_subscription');
      expect(content).toMatch(/count\s*=.*notification_email/);
    });
  });

  describe('CloudWatch Configuration Tests', () => {
    test('log groups exist for all CodeBuild projects', () => {
      const content = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"terraform_validate"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"terraform_plan"/);
      expect(content).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"terraform_apply"/);
    });

    test('log retention is configured', () => {
      const content = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(content).toContain('retention_in_days = var.log_retention_days');
    });

    test('pipeline failure alarm is conditional', () => {
      const content = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(content).toContain('aws_cloudwatch_metric_alarm');
      expect(content).toMatch(/count\s*=.*enable_pipeline_alarms/);
    });
  });

  describe('EventBridge Configuration Tests', () => {
    test('EventBridge rule exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(content).toContain('aws_cloudwatch_event_rule');
    });

    test('EventBridge rule monitors pipeline state changes', () => {
      const content = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(content).toContain('aws.codepipeline');
      expect(content).toContain('CodePipeline Pipeline Execution State Change');
    });

    test('EventBridge rule does NOT reference CodeCommit', () => {
      const content = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(content).not.toContain('aws.codecommit');
      expect(content).not.toContain('CodeCommit Repository State Change');
    });

    test('EventBridge target sends to SNS', () => {
      const content = fs.readFileSync(path.join(libDir, 'eventbridge.tf'), 'utf8');
      expect(content).toContain('aws_cloudwatch_event_target');
      expect(content).toContain('aws_sns_topic.pipeline_notifications.arn');
    });
  });

  describe('Outputs Configuration Tests', () => {
    test('pipeline ARN output exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).toContain('output "pipeline_arn"');
    });

    test('CodeStar connection ARN output exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).toContain('output "codestar_connection_arn"');
    });

    test('CodeStar connection status output exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).toContain('output "codestar_connection_status"');
    });

    test('artifact bucket name output exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).toContain('output "artifact_bucket_name"');
    });

    test('notification topic ARN output exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).toContain('output "notification_topic_arn"');
    });

    test('setup instructions output exists', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).toContain('output "setup_instructions"');
    });

    test('setup instructions do NOT use invalid self reference', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).not.toContain('${self.pipeline_url}');
    });

    test('all CodeBuild project names are output', () => {
      const content = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(content).toContain('output "validate_project_name"');
      expect(content).toContain('output "plan_project_name"');
      expect(content).toContain('output "apply_project_name"');
    });
  });

  describe('Security Best Practices Tests', () => {
    test('no hardcoded credentials', () => {
      const files = ['provider.tf', 'variables.tf', 'main.tf', 's3.tf', 'iam.tf'];
      files.forEach((file) => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).not.toMatch(/access_key\s*=\s*"[^$]/);
        expect(content).not.toMatch(/secret_key\s*=\s*"[^$]/);
        expect(content).not.toMatch(/password\s*=\s*"[^$]/);
      });
    });

    test('no Retain or DeletionProtection policies', () => {
      const files = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));
      files.forEach((file) => {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content).not.toContain('prevent_destroy = true');
        expect(content).not.toMatch(/deletion_protection\s*=\s*true/);
      });
    });

    test('S3 bucket encryption uses AES256', () => {
      const content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(content).toContain('sse_algorithm = "AES256"');
    });
  });

  describe('Variable Validation Tests', () => {
    test('environment_suffix has length validation', () => {
      const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(content).toMatch(/validation\s*\{[\s\S]*?environment_suffix/);
    });

    test('default values are appropriate', () => {
      const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(content).toContain('default     = "us-east-1"');
      expect(content).toContain('default     = "main"');
      expect(content).toContain('default     = 7');
    });
  });

  describe('GitHub Integration Tests', () => {
    test('GitHub repository variables exist', () => {
      const content = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(content).toContain('github_repository_owner');
      expect(content).toContain('github_repository_name');
      expect(content).toContain('github_branch');
    });

    test('pipeline references GitHub variables', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toContain('var.github_repository_owner');
      expect(content).toContain('var.github_repository_name');
      expect(content).toContain('var.github_branch');
    });

    test('FullRepositoryId is properly formatted', () => {
      const content = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(content).toMatch(/FullRepositoryId\s*=\s*"\$\{var\.github_repository_owner\}\/\$\{var\.github_repository_name\}"/);
    });
  });

  describe('Provider Configuration Tests', () => {
    test('AWS provider region uses variable', () => {
      const content = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      expect(content).toContain('region = var.aws_region');
    });

    test('default tags include environment_suffix', () => {
      const content = fs.readFileSync(path.join(libDir, 'provider.tf'), 'utf8');
      expect(content).toMatch(/default_tags\s*\{/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment_suffix/);
    });
  });
});
