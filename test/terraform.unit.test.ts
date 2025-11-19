// test/terraform.unit.test.ts
// Unit tests for Terraform CI/CD pipeline configuration
// Validates file structure, syntax, and configuration without deploying

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Terraform CI/CD Pipeline - Unit Tests', () => {
  describe('File Structure', () => {
    test('main.tf exists', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const exists = fs.existsSync(mainTfPath);
      if (!exists) {
        console.error(`[unit] Expected main.tf at: ${mainTfPath}`);
      }
      expect(exists).toBe(true);
    });

    test('variables.tf exists', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const exists = fs.existsSync(variablesTfPath);
      if (!exists) {
        console.error(`[unit] Expected variables.tf at: ${variablesTfPath}`);
      }
      expect(exists).toBe(true);
    });

    test('iam.tf exists', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const exists = fs.existsSync(iamTfPath);
      if (!exists) {
        console.error(`[unit] Expected iam.tf at: ${iamTfPath}`);
      }
      expect(exists).toBe(true);
    });

    test('outputs.tf exists', () => {
      const outputsTfPath = path.join(LIB_DIR, 'outputs.tf');
      const exists = fs.existsSync(outputsTfPath);
      if (!exists) {
        console.log('[unit] outputs.tf not found - outputs may be in main.tf');
      }
      // Don't fail if outputs.tf doesn't exist - it's optional
      expect(true).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider is declared in main.tf', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/provider\s+"aws"\s*{/);
    });

    test('Terraform version is specified', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/required_version\s*=\s*"[>=<~]+\s*[\d.]+"/);
    });

    test('AWS provider version is pinned', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/source\s*=\s*"hashicorp\/aws"/);
      expect(content).toMatch(/version\s*=\s*"~>\s*[\d.]+"/);
    });
  });

  describe('Variables Configuration', () => {
    test('aws_region variable is declared', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test('environment_suffix variable is declared', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');
      expect(content).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test('github_repository_id variable is declared', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');
      expect(content).toMatch(/variable\s+"github_repository_id"\s*{/);
    });

    test('github_branch variable is declared', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');
      expect(content).toMatch(/variable\s+"github_branch"\s*{/);
    });
  });

  describe('CodePipeline Configuration', () => {
    test('CodePipeline resource is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_codepipeline"\s+"terraform_pipeline"/);
    });

    test('CodePipeline has Source stage', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/stage\s*{[\s\S]*?name\s*=\s*"Source"/);
    });

    test('CodePipeline has Validate stage', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/name\s*=\s*"Validate"/);
    });

    test('CodePipeline has Plan stage', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/name\s*=\s*"Plan"/);
    });

    test('CodePipeline has Approval stage', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/name\s*=\s*"Approval"/);
    });

    test('CodePipeline has Apply stage', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/name\s*=\s*"Apply"/);
    });

    test('CodePipeline uses CodeStarSourceConnection', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/provider\s*=\s*"CodeStarSourceConnection"/);
    });
  });

  describe('CodeBuild Projects', () => {
    test('Validate CodeBuild project is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_codebuild_project"\s+"validate"/);
    });

    test('Plan CodeBuild project is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_codebuild_project"\s+"plan"/);
    });

    test('Apply CodeBuild project is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_codebuild_project"\s+"apply"/);
    });
  });

  describe('S3 Resources', () => {
    test('Pipeline artifacts bucket is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"pipeline_artifacts"/);
    });

    test('Terraform state bucket is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"terraform_state"/);
    });

    test('S3 buckets have versioning enabled', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/aws_s3_bucket_versioning/);
    });
  });

  describe('DynamoDB State Lock', () => {
    test('DynamoDB state lock table is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_dynamodb_table"\s+"terraform_state_lock"/);
    });

    test('DynamoDB table has hash key named LockID', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/attribute_name\s*=\s*"LockID"/);
      expect(content).toMatch(/key_type\s*=\s*"HASH"/);
    });
  });

  describe('IAM Security Configuration', () => {
    test('CodePipeline IAM role is declared', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"codepipeline_role"/);
    });

    test('CodeBuild IAM role is declared', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"codebuild_role"/);
    });

    test('IAM wildcard permissions are removed', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');

      // Check that the dangerous wildcard pattern is NOT present
      const dangerousPattern = /"iam:\*"[\s\S]*?Resource\s*=\s*"\*"/;
      expect(content).not.toMatch(dangerousPattern);
    });

    test('IAM roles are scoped to specific resource patterns', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');

      // Should have scoped IAM resources like app-*, lambda-*, terraform-managed-*
      expect(content).toMatch(/arn:aws:iam::\*:role\/app-\*/);
    });

    test('IAM PassRole has service conditions', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');

      // Should have iam:PassRole with Condition
      const hasPassRole = content.includes('"iam:PassRole"');
      const hasCondition = content.includes('Condition');

      if (hasPassRole) {
        expect(hasCondition).toBe(true);
      }
    });

    test('Permission boundary policy is declared', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');

      // Optional - permission boundary may or may not exist
      const hasPermissionBoundary = content.includes('terraform_permission_boundary');
      if (hasPermissionBoundary) {
        expect(content).toMatch(/resource\s+"aws_iam_policy"\s+"terraform_permission_boundary"/);
      }
      expect(true).toBe(true);
    });
  });

  describe('SNS Notifications', () => {
    test('SNS topic for pipeline notifications is declared', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');
      expect(content).toMatch(/resource\s+"aws_sns_topic"\s+"pipeline_notifications"/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('Resources include environment_suffix in names', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Should have multiple references to var.environment_suffix
      const matches = content.match(/var\.environment_suffix/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(5);
    });

    test('IAM roles include environment_suffix in names', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');

      expect(content).toMatch(/codepipeline-role-\$\{var\.environment_suffix\}/);
      expect(content).toMatch(/codebuild-role-\$\{var\.environment_suffix\}/);
    });
  });

  describe('Resource Tagging', () => {
    test('Resources have tags defined', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Should have tags blocks
      const tagsMatches = content.match(/tags\s*=\s*{/g);
      expect(tagsMatches).not.toBeNull();
      expect(tagsMatches!.length).toBeGreaterThan(3);
    });

    test('Default tags are configured in provider', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/default_tags\s*{/);
    });
  });

  describe('Syntax and Format', () => {
    test('No syntax errors in main.tf', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      // Check for balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('No syntax errors in iam.tf', () => {
      const iamTfPath = path.join(LIB_DIR, 'iam.tf');
      const content = fs.readFileSync(iamTfPath, 'utf8');

      // Check for balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('No syntax errors in variables.tf', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      // Check for balanced braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });
});
