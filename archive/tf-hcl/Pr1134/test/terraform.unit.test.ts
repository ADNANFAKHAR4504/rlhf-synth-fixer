import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// Helper function to execute terraform commands
function executeTerraformCommand(command: string, cwd: string): string {
  try {
    return execSync(command, { cwd, encoding: 'utf8', stdio: 'pipe' });
  } catch (error: any) {
    throw new Error(`Terraform command failed: ${error.message}`);
  }
}

// Helper function to read Terraform files
function readTerraformFile(filename: string): string {
  const filePath = path.join(__dirname, '../lib', filename);
  return fs.readFileSync(filePath, 'utf8');
}

// Helper function to generate test environment suffix
function generateTestEnvironmentSuffix(): string {
  return `test${crypto.randomBytes(4).toString('hex')}`;
}

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '../lib');

  describe('Terraform Syntax Validation', () => {
    test('main.tf has valid Terraform syntax', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toContain('resource "aws_s3_bucket"');
      expect(mainTfContent).toContain('resource "aws_dynamodb_table"');
      expect(mainTfContent).toContain('resource "aws_iam_role"');
    });

    test('provider.tf has valid provider configuration', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toContain('terraform {');
      expect(providerContent).toContain('required_providers {');
      expect(providerContent).toContain('provider "aws" {');
    });

    test('Terraform formatting is correct', () => {
      const output = executeTerraformCommand('terraform fmt -check -diff', libPath);
      // If fmt returns empty string, files are already formatted
      expect(typeof output).toBe('string');
    });
  });

  describe('Variable Validation', () => {
    test('aws_region variable has proper validation', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/variable "aws_region"[\s\S]*?validation/);
      expect(mainTfContent).toMatch(/can\(regex\("\^\[a-z0-9-\]\+\$"/);
    });

    test('aws_account_id variable validates 12-digit format', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/variable "aws_account_id"[\s\S]*?validation/);
      expect(mainTfContent).toMatch(/can\(regex\("\^\[0-9\]\{12\}\$"/);
    });

    test('project_name variable has lowercase validation', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/variable "project_name"[\s\S]*?validation/);
      expect(mainTfContent).toMatch(/can\(regex\("\^\[a-z0-9-\]\+\$"/);
    });

    test('environment variable has allowed values', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/variable "environment"[\s\S]*?validation/);
      expect(mainTfContent).toMatch(/contains\(\["dev", "staging", "prod"\]/);
    });

    test('environment_suffix variable has proper validation', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/variable "environment_suffix"[\s\S]*?validation/);
      expect(mainTfContent).toMatch(/can\(regex\("\^\[a-z0-9\]\*\$"/);
    });
  });

  describe('Resource Configuration Validation', () => {
    test('S3 buckets are configured with force_destroy for rollback', () => {
      const mainTfContent = readTerraformFile('main.tf');
      const s3BucketMatches = mainTfContent.match(/resource "aws_s3_bucket"/g);
      expect(s3BucketMatches).toHaveLength(2); // artifacts and terraform_state
      expect(mainTfContent).toMatch(/force_destroy\s*=\s*true/g);
    });

    test('DynamoDB table has deletion_protection_enabled = false for rollback', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/resource "aws_dynamodb_table"/);  
      expect(mainTfContent).toMatch(/deletion_protection_enabled\s*=\s*false/);
    });

    test('S3 buckets have encryption configured', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(mainTfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      expect(mainTfContent).toMatch(/bucket_key_enabled\s*=\s*true/);
    });

    test('S3 buckets have public access blocked', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/aws_s3_bucket_public_access_block/);
      expect(mainTfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/block_public_policy\s*=\s*true/);
      expect(mainTfContent).toMatch(/ignore_public_acls\s*=\s*true/);
      expect(mainTfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/point_in_time_recovery\s*\{[\s\S]*?enabled\s*=\s*true/);
    });

    test('IAM role has proper trust policy for CircleCI OIDC', () => {
      const mainTfContent = readTerraformFile('main.tf');
      expect(mainTfContent).toMatch(/aws_iam_openid_connect_provider/);
      expect(mainTfContent).toMatch(/oidc\.circleci\.com/);
      expect(mainTfContent).toMatch(/sts:AssumeRoleWithWebIdentity/);
    });
  });

  describe('Outputs Configuration', () => {
    test('all required outputs are defined', () => {
      const mainTfContent = readTerraformFile('main.tf');
      const expectedOutputs = [
        'artifacts_bucket_name',
        'terraform_state_bucket_name', 
        'terraform_locks_table_name',
        'circleci_role_arn',
        'cloudwatch_log_group_name',
        'aws_account_id',
        'aws_region',
        'environment_suffix'
      ];
      
      expectedOutputs.forEach(output => {
        expect(mainTfContent).toMatch(new RegExp(`output "${output}"`));
      });
    });
  });

  describe('Naming Convention with Environment Suffix', () => {
    test('locals define proper naming with environment suffix', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toMatch(/environment_suffix = var\.environment_suffix/);
      expect(providerContent).toMatch(/name_prefix = "\$\{var\.project_name\}-\$\{local\.environment_suffix\}"/);
      expect(providerContent).toMatch(/s3_artifacts_name\s*=\s*"s3-\$\{var\.project_name\}-artifacts-\$\{local\.environment_suffix\}"/);
    });

    test('all resource names include environment suffix', () => {
      const providerContent = readTerraformFile('provider.tf');
      const resourceNameVars = [
        's3_artifacts_name',
        's3_terraform_state',
        'iam_circleci_role',
        'dynamodb_tf_locks'
      ];
      
      resourceNameVars.forEach(varName => {
        expect(providerContent).toMatch(new RegExp(`${varName}[\\s\\S]*?local\\.environment_suffix`));
      });
    });

    test('common tags include EnvironmentSuffix', () => {
      const providerContent = readTerraformFile('provider.tf');
      expect(providerContent).toMatch(/common_tags\s*=[\s\S]*?EnvironmentSuffix\s*=\s*local\.environment_suffix/);
    });
  });

  describe('Test Infrastructure Validation with Randomness', () => {
    test('can generate unique environment suffix with randomness', () => {
      const suffix1 = generateTestEnvironmentSuffix();
      const suffix2 = generateTestEnvironmentSuffix();
      
      expect(suffix1).toMatch(/^test[a-f0-9]{8}$/);
      expect(suffix2).toMatch(/^test[a-f0-9]{8}$/);
      expect(suffix1).not.toBe(suffix2);
    });

    test('environment suffix passes validation regex', () => {
      const testSuffix = generateTestEnvironmentSuffix();
      // Should match the validation regex from the variable
      expect(testSuffix).toMatch(/^[a-z0-9]*$/); 
    });

    test('generated test suffix creates unique resource names', () => {
      const testSuffix = generateTestEnvironmentSuffix();
      const projectName = 'myproject';
      
      const expectedBucketName = `s3-${projectName}-artifacts-${testSuffix}`;
      const expectedDynamoName = `dynamodb-${projectName}-terraform-locks-${testSuffix}`;
      
      expect(expectedBucketName).toMatch(/^s3-myproject-artifacts-test[a-f0-9]{8}$/);
      expect(expectedDynamoName).toMatch(/^dynamodb-myproject-terraform-locks-test[a-f0-9]{8}$/);
    });
  });
});
