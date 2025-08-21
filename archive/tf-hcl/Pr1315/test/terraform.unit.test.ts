// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform IAM security configuration
// No Terraform commands are executed - only file structure and content validation

import fs from 'fs';
import path from 'path';

describe('Terraform IAM Security Configuration - Unit Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');

  // Core file existence tests
  describe('Required Files Existence', () => {
    const requiredFiles = ['main.tf', 'provider.tf', 'tap_stack.tf'];

    requiredFiles.forEach(filename => {
      test(`${filename} exists`, () => {
        const filePath = path.join(libPath, filename);
        const exists = fs.existsSync(filePath);
        if (!exists) {
          console.error(`[unit] Expected file at: ${filePath}`);
        }
        expect(exists).toBe(true);
      });
    });
  });

  // Provider configuration validation
  describe('Provider Configuration', () => {
    let providerContent: string;

    beforeAll(() => {
      const providerPath = path.join(libPath, 'provider.tf');
      providerContent = fs.readFileSync(providerPath, 'utf8');
    });

    test('declares AWS provider with version constraint', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    test('requires minimum Terraform version 0.14', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*0\.14"/);
    });

    test('includes default tags for AWS provider', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toMatch(/Environment/);
      expect(providerContent).toMatch(/ManagedBy/);
    });
  });

  // Variables validation (now in main.tf)
  describe('Variables Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      const mainPath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    const requiredVariables = [
      'aws_region',
      'environment',
      'trusted_account_ids',
      'log_bucket_name',
      'app_s3_bucket_name',
      'notification_email',
    ];

    requiredVariables.forEach(varName => {
      test(`declares ${varName} variable`, () => {
        expect(mainContent).toMatch(
          new RegExp(`variable\\s+"${varName}"\\s*{`)
        );
      });
    });

    test('environment variable has default value', () => {
      expect(mainContent).toMatch(
        /variable\s+"environment"\s*{[\s\S]*?default\s*=\s*"dev"/
      );
    });

    test('uses data source for account_id instead of variable', () => {
      expect(mainContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
      expect(mainContent).toMatch(
        /account_id\s*=\s*data\.aws_caller_identity\.current\.account_id/
      );
    });
  });

  // Main configuration validation
  describe('Main Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      const mainPath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    const requiredRoles = ['app_deploy_role', 'readonly_role', 'audit_role'];

    requiredRoles.forEach(roleName => {
      test(`declares IAM role: ${roleName}`, () => {
        expect(mainContent).toMatch(
          new RegExp(`resource\\s+"aws_iam_role"\\s+"${roleName}"`)
        );
      });
    });

    const requiredPolicies = [
      'app_deploy_policy',
      'readonly_policy',
      'audit_policy',
      'cloudwatch_readonly_policy',
      's3_upload_policy',
      'cloudtrail_write_policy',
    ];

    requiredPolicies.forEach(policyName => {
      test(`declares IAM policy: ${policyName}`, () => {
        expect(mainContent).toMatch(
          new RegExp(`resource\\s+"aws_iam_policy"\\s+"${policyName}"`)
        );
      });
    });

    test('creates CloudTrail for auditing', () => {
      expect(mainContent).toMatch(
        /resource\s+"aws_cloudtrail"\s+"security_trail"/
      );
    });

    test('creates S3 bucket for CloudTrail logs with versioning', () => {
      expect(mainContent).toMatch(
        /resource\s+"aws_s3_bucket"\s+"cloudtrail_logs"/
      );
      expect(mainContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    });

    test('configures CloudWatch log group for CloudTrail', () => {
      expect(mainContent).toMatch(
        /resource\s+"aws_cloudwatch_log_group"\s+"cloudtrail_log_group"/
      );
    });

    test('sets up IAM policy attachments', () => {
      expect(mainContent).toMatch(
        /resource\s+"aws_iam_role_policy_attachment"/
      );
    });
  });

  // Policies validation (now in main.tf)
  describe('Policy Documents', () => {
    let mainContent: string;

    beforeAll(() => {
      const mainPath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('defines cross-account trust policy with MFA requirement', () => {
      expect(mainContent).toMatch(
        /data\s+"aws_iam_policy_document"\s+"cross_account_trust"/
      );
      expect(mainContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test('app deploy policy follows least privilege', () => {
      expect(mainContent).toMatch(/EC2DeploymentAccess/);
      expect(mainContent).toMatch(/ECSDeploymentAccess/);
      expect(mainContent).toMatch(/IAMPassRoleForDeployment/);
    });

    test('readonly policy includes explicit deny for destructive actions', () => {
      expect(mainContent).toMatch(/DenyDestructiveActions/);
      expect(mainContent).toMatch(/ec2:TerminateInstances/);
      expect(mainContent).toMatch(/s3:DeleteBucket/);
      expect(mainContent).toMatch(/iam:DeleteRole/);
    });

    test('audit policy allows CloudTrail and compliance access', () => {
      expect(mainContent).toMatch(/AuditReadAccess/);
      expect(mainContent).toMatch(/cloudtrail:LookupEvents/);
      expect(mainContent).toMatch(/iam:GetCredentialReport/);
    });
  });

  // Outputs validation (now in main.tf)
  describe('Outputs Configuration', () => {
    let mainContent: string;

    beforeAll(() => {
      const mainPath = path.join(libPath, 'main.tf');
      mainContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('outputs IAM roles information', () => {
      expect(mainContent).toMatch(/output\s+"iam_roles"/);
    });

    test('outputs CloudTrail information', () => {
      expect(mainContent).toMatch(/output\s+"cloudtrail_arn"/);
      expect(mainContent).toMatch(/output\s+"log_bucket_name"/);
    });

    test('outputs cross-account assume role commands', () => {
      expect(mainContent).toMatch(
        /output\s+"cross_account_assume_role_commands"/
      );
      expect(mainContent).toMatch(/aws sts assume-role/);
    });

    test('outputs security configuration summary', () => {
      expect(mainContent).toMatch(/output\s+"security_configuration_summary"/);
    });
  });

  // Security best practices validation
  describe('Security Best Practices', () => {
    let allContent: string;

    beforeAll(() => {
      const mainPath = path.join(libPath, 'main.tf');
      allContent = fs.readFileSync(mainPath, 'utf8');
    });

    test('does not contain hardcoded secrets or keys', () => {
      expect(allContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(allContent).not.toMatch(/password\s*=\s*"[^"]+"/);
      expect(allContent).not.toMatch(/secret\s*=\s*"[^"]+"/);
    });

    test('uses variables with default values and unique bucket names', () => {
      expect(allContent).toMatch(/local\.account_id/); // Uses data source for account_id
      expect(allContent).toMatch(/local\.log_bucket_name/); // Uses local with random suffix
      expect(allContent).toMatch(/local\.app_bucket_name/); // Uses local with random suffix
      expect(allContent).toMatch(/var\.notification_email/); // Uses variable with default
      expect(allContent).toMatch(
        /default\s*=\s*"iac-cloudtrail-logs-dev-default"/
      ); // Has bucket default
      expect(allContent).toMatch(/default\s*=\s*"devops@example\.com"/); // Has email default
      expect(allContent).toMatch(/random_id\.bucket_suffix\.hex/); // Uses random suffix for uniqueness
    });

    test('includes proper resource tagging', () => {
      expect(allContent).toMatch(/tags\s*=\s*local\.common_tags/);
      expect(allContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(allContent).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });

    test('enables S3 bucket security features', () => {
      expect(allContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(allContent).toMatch(/server_side_encryption/);
      expect(allContent).toMatch(/versioning_configuration/);
    });
  });

  // File structure integrity
  describe('File Structure Integrity', () => {
    test('no duplicate resource names in main.tf', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      const resources = content.match(/resource\s+"[^"]+"\s+"([^"]+)"/g) || [];
      const resourceNames: string[] = [];

      resources.forEach(resource => {
        const match = resource.match(/resource\s+"[^"]+"\s+"([^"]+)"/);
        if (match) {
          const resourceName = match[1];
          expect(resourceNames).not.toContain(resourceName);
          resourceNames.push(resourceName);
        }
      });
    });

    test('all referenced variables are declared in main.tf', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const mainContent = fs.readFileSync(mainPath, 'utf8');

      const declaredVars =
        mainContent
          .match(/variable\s+"([^"]+)"/g)
          ?.map(v => v.match(/variable\s+"([^"]+)"/)?.[1])
          .filter(Boolean) || [];

      const usedVars =
        mainContent
          .match(/var\.([a-zA-Z_][a-zA-Z0-9_]*)/g)
          ?.map(v => v.replace('var.', '')) || [];

      usedVars.forEach(usedVar => {
        expect(declaredVars).toContain(usedVar);
      });
    });

    test('main.tf contains all required sections', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      // Check for required sections
      expect(content).toMatch(/# Variables/);
      expect(content).toMatch(/# Locals/);
      expect(content).toMatch(/# Data Sources/);
      expect(content).toMatch(/# IAM Policies/);
      expect(content).toMatch(/# IAM Roles/);
      expect(content).toMatch(/# Outputs/);
    });
  });
});
