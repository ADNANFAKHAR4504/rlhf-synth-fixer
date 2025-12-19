import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform CodePipeline Integration Tests', () => {
  const libDir = path.join(__dirname, '..', 'lib');

  describe('Terraform Validation Tests', () => {
    test('terraform init succeeds', () => {
      try {
        const output = execSync('terraform init -backend=false', {
          cwd: libDir,
          encoding: 'utf8',
          stdio: 'pipe',
        });
        expect(output).toContain('Terraform has been successfully initialized');
      } catch (error: any) {
        throw new Error(`terraform init failed: ${error.message}`);
      }
    });

    test('terraform validate succeeds', () => {
      try {
        const output = execSync('terraform validate', {
          cwd: libDir,
          encoding: 'utf8',
          stdio: 'pipe',
        });
        expect(output).toContain('Success');
      } catch (error: any) {
        throw new Error(`terraform validate failed: ${error.message}`);
      }
    });

    test('terraform fmt check passes', () => {
      try {
        execSync('terraform fmt -check -recursive', {
          cwd: libDir,
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        // terraform fmt returns non-zero if files need formatting
        const stdout = error.stdout || '';
        if (stdout.trim().length > 0) {
          throw new Error(`terraform fmt found unformatted files: ${stdout}`);
        }
      }
    });
  });

  describe('Configuration Structure Validation', () => {
    let allTfContent: string;

    beforeAll(() => {
      const tfFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));
      allTfContent = tfFiles.map((f) => fs.readFileSync(path.join(libDir, f), 'utf8')).join('\n');
    });

    test('all resources are properly defined', () => {
      const resourceTypes = [
        'aws_codestarconnections_connection',
        'aws_codepipeline',
        'aws_codebuild_project',
        'aws_s3_bucket',
        'aws_s3_bucket_versioning',
        'aws_s3_bucket_server_side_encryption_configuration',
        'aws_s3_bucket_public_access_block',
        'aws_s3_bucket_lifecycle_configuration',
        'aws_iam_role',
        'aws_iam_role_policy',
        'aws_sns_topic',
        'aws_sns_topic_policy',
        'aws_cloudwatch_log_group',
        'aws_cloudwatch_event_rule',
        'aws_cloudwatch_event_target',
      ];

      resourceTypes.forEach((resourceType) => {
        expect(allTfContent).toContain(`resource "${resourceType}"`);
      });
    });

    test('no resources reference deprecated services', () => {
      expect(allTfContent).not.toContain('aws_codecommit_repository');
      expect(allTfContent).not.toContain('codecommit.amazonaws.com');
    });

    test('all resource references are valid', () => {
      // Check for common reference patterns
      const references = [
        'aws_s3_bucket.pipeline_artifacts',
        'aws_iam_role.codepipeline',
        'aws_iam_role.codebuild',
        'aws_sns_topic.pipeline_notifications',
        'aws_codestarconnections_connection.github',
        'aws_codebuild_project.terraform_validate',
        'aws_codebuild_project.terraform_plan',
        'aws_codebuild_project.terraform_apply',
        'aws_cloudwatch_log_group.terraform_validate',
        'aws_cloudwatch_log_group.terraform_plan',
        'aws_cloudwatch_log_group.terraform_apply',
      ];

      references.forEach((ref) => {
        expect(allTfContent).toContain(ref);
      });
    });
  });

  describe('Resource Count Validation', () => {
    let allTfContent: string;

    beforeAll(() => {
      const tfFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));
      allTfContent = tfFiles.map((f) => fs.readFileSync(path.join(libDir, f), 'utf8')).join('\n');
    });

    test('exactly 1 CodeStar connection', () => {
      const matches = allTfContent.match(/resource "aws_codestarconnections_connection"/g);
      expect(matches).toHaveLength(1);
    });

    test('exactly 1 CodePipeline', () => {
      const matches = allTfContent.match(/resource "aws_codepipeline"/g);
      expect(matches).toHaveLength(1);
    });

    test('exactly 3 CodeBuild projects', () => {
      const matches = allTfContent.match(/resource "aws_codebuild_project"/g);
      expect(matches).toHaveLength(3);
    });

    test('exactly 1 S3 bucket', () => {
      const matches = allTfContent.match(/resource "aws_s3_bucket" "pipeline_artifacts"/g);
      expect(matches).toHaveLength(1);
    });

    test('exactly 2 IAM roles (CodePipeline and CodeBuild)', () => {
      const matches = allTfContent.match(/resource "aws_iam_role"/g);
      expect(matches).toHaveLength(2);
    });

    test('exactly 1 SNS topic', () => {
      const matches = allTfContent.match(/resource "aws_sns_topic" "pipeline_notifications"/g);
      expect(matches).toHaveLength(1);
    });

    test('exactly 3 CloudWatch log groups', () => {
      const matches = allTfContent.match(/resource "aws_cloudwatch_log_group"/g);
      expect(matches).toHaveLength(3);
    });
  });

  describe('Pipeline Stage Validation', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('Source stage configuration is complete', () => {
      expect(mainTfContent).toMatch(/stage\s*\{\s*name\s*=\s*"Source"/);
      expect(mainTfContent).toMatch(/provider\s*=\s*"CodeStarSourceConnection"/);
      expect(mainTfContent).toMatch(/output_artifacts\s*=\s*\["source_output"\]/);
    });

    test('Validate stage configuration is complete', () => {
      expect(mainTfContent).toMatch(/stage\s*\{\s*name\s*=\s*"Validate"/);
      expect(mainTfContent).toMatch(/input_artifacts\s*=\s*\["source_output"\]/);
      expect(mainTfContent).toMatch(/output_artifacts\s*=\s*\["validate_output"\]/);
    });

    test('Plan stage configuration is complete', () => {
      expect(mainTfContent).toMatch(/stage\s*\{\s*name\s*=\s*"Plan"/);
      expect(mainTfContent).toMatch(/ProjectName = aws_codebuild_project\.terraform_plan\.name/);
    });

    test('Approval stage configuration is complete', () => {
      expect(mainTfContent).toMatch(/stage\s*\{\s*name\s*=\s*"Approval"/);
      expect(mainTfContent).toMatch(/category\s*=\s*"Approval"/);
      expect(mainTfContent).toMatch(/NotificationArn/);
    });

    test('Apply stage configuration is complete', () => {
      expect(mainTfContent).toMatch(/stage\s*\{\s*name\s*=\s*"Apply"/);
      expect(mainTfContent).toMatch(/ProjectName = aws_codebuild_project\.terraform_apply\.name/);
    });
  });

  describe('BuildSpec Validation', () => {
    let mainTfContent: string;

    beforeAll(() => {
      mainTfContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
    });

    test('validate buildspec has required commands', () => {
      const validateBuildspec = mainTfContent.match(
        /resource "aws_codebuild_project" "terraform_validate"[\s\S]*?buildspec = <<-EOT[\s\S]*?EOT/
      );
      expect(validateBuildspec).toBeTruthy();
      expect(validateBuildspec![0]).toContain('version: 0.2');
      expect(validateBuildspec![0]).toContain('terraform init -backend=false');
      expect(validateBuildspec![0]).toContain('terraform validate');
    });

    test('plan buildspec has required commands', () => {
      const planBuildspec = mainTfContent.match(
        /resource "aws_codebuild_project" "terraform_plan"[\s\S]*?buildspec = <<-EOT[\s\S]*?EOT/
      );
      expect(planBuildspec).toBeTruthy();
      expect(planBuildspec![0]).toContain('version: 0.2');
      expect(planBuildspec![0]).toContain('terraform init');
      expect(planBuildspec![0]).toContain('terraform plan -out=tfplan');
      expect(planBuildspec![0]).toContain('terraform show tfplan');
    });

    test('apply buildspec has required commands', () => {
      const applyBuildspec = mainTfContent.match(
        /resource "aws_codebuild_project" "terraform_apply"[\s\S]*?buildspec = <<-EOT[\s\S]*?EOT/
      );
      expect(applyBuildspec).toBeTruthy();
      expect(applyBuildspec![0]).toContain('version: 0.2');
      expect(applyBuildspec![0]).toContain('terraform init');
      expect(applyBuildspec![0]).toContain('terraform apply -auto-approve');
    });
  });

  describe('IAM Policy Validation', () => {
    let iamContent: string;

    beforeAll(() => {
      iamContent = fs.readFileSync(path.join(libDir, 'iam.tf'), 'utf8');
    });

    test('CodePipeline role has all required permissions', () => {
      const requiredActions = [
        's3:GetObject',
        's3:PutObject',
        'codebuild:BatchGetBuilds',
        'codebuild:StartBuild',
        'codestar-connections:UseConnection',
        'sns:Publish',
      ];

      requiredActions.forEach((action) => {
        expect(iamContent).toContain(action);
      });
    });

    test('CodeBuild role has all required permissions', () => {
      const requiredActions = [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        's3:GetObject',
        's3:PutObject',
      ];

      requiredActions.forEach((action) => {
        expect(iamContent).toContain(action);
      });
    });

    test('IAM policies reference correct resources', () => {
      expect(iamContent).toContain('aws_s3_bucket.pipeline_artifacts.arn');
      expect(iamContent).toContain('aws_codebuild_project.terraform_validate.arn');
      expect(iamContent).toContain('aws_codebuild_project.terraform_plan.arn');
      expect(iamContent).toContain('aws_codebuild_project.terraform_apply.arn');
      expect(iamContent).toContain('aws_codestarconnections_connection.github.arn');
      expect(iamContent).toContain('aws_sns_topic.pipeline_notifications.arn');
    });
  });

  describe('Output Validation', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
    });

    test('all required outputs are defined', () => {
      const requiredOutputs = [
        'pipeline_name',
        'pipeline_arn',
        'pipeline_url',
        'codestar_connection_arn',
        'codestar_connection_status',
        'artifact_bucket_name',
        'artifact_bucket_arn',
        'notification_topic_arn',
        'validate_project_name',
        'plan_project_name',
        'apply_project_name',
        'setup_instructions',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputsContent).toMatch(new RegExp(`output\\s+"${output}"\\s*\\{`));
      });
    });

    test('outputs have descriptions', () => {
      const outputBlocks = outputsContent.match(/output "[^"]+"\s*\{[^}]*}/g) || [];
      outputBlocks.forEach((block) => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('setup instructions mention GitHub authorization', () => {
      expect(outputsContent).toContain('Authorize the GitHub Connection');
      expect(outputsContent).toContain('AWS Console');
      expect(outputsContent).toContain('CodePipeline');
      expect(outputsContent).toContain('Connections');
    });
  });

  describe('Variable Configuration Validation', () => {
    let variablesContent: string;

    beforeAll(() => {
      variablesContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
    });

    test('all variables have descriptions', () => {
      const variableBlocks = variablesContent.match(/variable "[^"]+"\s*\{[^}]*}/gs) || [];
      expect(variableBlocks.length).toBeGreaterThan(0);
      variableBlocks.forEach((block) => {
        expect(block).toMatch(/description\s*=/);
      });
    });

    test('all variables have types', () => {
      const variableBlocks = variablesContent.match(/variable "[^"]+"\s*\{[^}]*}/gs) || [];
      variableBlocks.forEach((block) => {
        expect(block).toMatch(/type\s*=/);
      });
    });

    test('environment_suffix has validation rule', () => {
      const envSuffixBlock = variablesContent.match(
        /variable "environment_suffix"\s*\{[\s\S]*?\n\}/
      );
      expect(envSuffixBlock).toBeTruthy();
      expect(envSuffixBlock![0]).toMatch(/validation\s*\{/);
      expect(envSuffixBlock![0]).toContain('condition');
      expect(envSuffixBlock![0]).toContain('error_message');
    });
  });

  describe('Terraform Configuration Completeness', () => {
    test('all .tf files are readable and not empty', () => {
      const tfFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));

      for (const file of tfFiles) {
        const content = fs.readFileSync(path.join(libDir, file), 'utf8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toMatch(/resource|variable|output|provider|terraform/);
      }
    });

    test('no duplicate resource names', () => {
      const tfFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));
      const allContent = tfFiles.map((f) => fs.readFileSync(path.join(libDir, f), 'utf8')).join('\n');

      const resourceMatches = allContent.match(/resource\s+"([^"]+)"\s+"([^"]+)"/g) || [];
      const resourceNames = resourceMatches.map((match) => {
        const parts = match.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        return `${parts![1]}.${parts![2]}`;
      });

      const duplicates = resourceNames.filter((name, index) => resourceNames.indexOf(name) !== index);
      expect(duplicates).toHaveLength(0);
    });

    test('no syntax errors in JSON blocks', () => {
      const tfFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));
      const allContent = tfFiles.map((f) => fs.readFileSync(path.join(libDir, f), 'utf8')).join('\n');

      const jsonencodeMatches = allContent.match(/jsonencode\s*\(\s*\{[\s\S]*?\}\s*\)/g) || [];

      jsonencodeMatches.forEach((match, index) => {
        // Extract the JSON content
        const jsonContent = match.replace(/jsonencode\s*\(\s*/, '').replace(/\s*\)$/, '');
        // This is HCL syntax, not pure JSON, so we just check for balanced braces
        const openBraces = (jsonContent.match(/\{/g) || []).length;
        const closeBraces = (jsonContent.match(/\}/g) || []).length;
        expect(openBraces).toBe(closeBraces);
      });
    });
  });

  describe('Cost Optimization Validation', () => {
    let allTfContent: string;

    beforeAll(() => {
      const tfFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));
      allTfContent = tfFiles.map((f) => fs.readFileSync(path.join(libDir, f), 'utf8')).join('\n');
    });

    test('CodeBuild uses cost-efficient compute type by default', () => {
      const variablesContent = fs.readFileSync(path.join(libDir, 'variables.tf'), 'utf8');
      expect(variablesContent).toMatch(/codebuild_compute_type[\s\S]*?default\s*=\s*"BUILD_GENERAL1_SMALL"/);
    });

    test('CloudWatch logs have retention configured', () => {
      const cloudwatchContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchContent).toContain('retention_in_days');
      expect(cloudwatchContent).toContain('var.log_retention_days');
    });

    test('S3 lifecycle rules help manage storage costs', () => {
      const s3Content = fs.readFileSync(path.join(libDir, 's3.tf'), 'utf8');
      expect(s3Content).toContain('aws_s3_bucket_lifecycle_configuration');
      expect(s3Content).toMatch(/days\s*=\s*90/);
    });

    test('pipeline alarms are optional to reduce costs', () => {
      const cloudwatchContent = fs.readFileSync(path.join(libDir, 'cloudwatch.tf'), 'utf8');
      expect(cloudwatchContent).toMatch(/aws_cloudwatch_metric_alarm[\s\S]*?count\s*=/);
    });
  });

  describe('Migration from CodeCommit Validation', () => {
    test('no CodeCommit resources remain', () => {
      const tfFiles = fs.readdirSync(libDir).filter((f) => f.endsWith('.tf'));
      const allContent = tfFiles.map((f) => fs.readFileSync(path.join(libDir, f), 'utf8')).join('\n');

      expect(allContent).not.toContain('aws_codecommit');
      expect(allContent).not.toContain('codecommit.amazonaws.com');
    });

    test('GitHub integration is properly configured', () => {
      const mainContent = fs.readFileSync(path.join(libDir, 'main.tf'), 'utf8');
      expect(mainContent).toContain('aws_codestarconnections_connection');
      expect(mainContent).toContain('provider_type = "GitHub"');
      expect(mainContent).toContain('CodeStarSourceConnection');
    });

    test('outputs warn about manual GitHub authorization', () => {
      const outputsContent = fs.readFileSync(path.join(libDir, 'outputs.tf'), 'utf8');
      expect(outputsContent).toContain('MUST be authorized');
      expect(outputsContent).toContain('Authorize the GitHub Connection');
    });
  });
});
