// tests/unit/unit-tests.ts
// Comprehensive unit tests for Terraform IAM security configuration
// No Terraform commands are executed - only file structure and content validation

import fs from 'fs';
import path from 'path';

describe('Terraform IAM Security Configuration - Unit Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');

  // Core file existence tests
  describe('Required Files Existence', () => {
    const requiredFiles = [
      'main.tf',
      'variables.tf',
      'outputs.tf',
      'policies.tf',
      'provider.tf',
      'tap_stack.tf',
    ];

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

  // Variables validation
  describe('Variables Configuration', () => {
    let variablesContent: string;

    beforeAll(() => {
      const variablesPath = path.join(libPath, 'variables.tf');
      variablesContent = fs.readFileSync(variablesPath, 'utf8');
    });

    const requiredVariables = [
      'aws_region',
      'environment',
      'account_id',
      'trusted_account_ids',
      'log_bucket_name',
      'app_s3_bucket_name',
      'notification_email',
    ];

    requiredVariables.forEach(varName => {
      test(`declares ${varName} variable`, () => {
        expect(variablesContent).toMatch(
          new RegExp(`variable\\s+"${varName}"\\s*{`)
        );
      });
    });

    test('environment variable has validation', () => {
      expect(variablesContent).toMatch(/validation\s*{/);
      expect(variablesContent).toMatch(/(dev|staging|prod)/);
    });

    test('account_id variable validates 12-digit format', () => {
      expect(variablesContent).toMatch(/\[0-9\]\{12\}/);
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

  // Policies validation
  describe('Policy Documents', () => {
    let policiesContent: string;

    beforeAll(() => {
      const policiesPath = path.join(libPath, 'policies.tf');
      policiesContent = fs.readFileSync(policiesPath, 'utf8');
    });

    test('defines cross-account trust policy with MFA requirement', () => {
      expect(policiesContent).toMatch(
        /data\s+"aws_iam_policy_document"\s+"cross_account_trust"/
      );
      expect(policiesContent).toMatch(/aws:MultiFactorAuthPresent/);
    });

    test('app deploy policy follows least privilege', () => {
      expect(policiesContent).toMatch(/EC2DeploymentAccess/);
      expect(policiesContent).toMatch(/ECSDeploymentAccess/);
      expect(policiesContent).toMatch(/IAMPassRoleForDeployment/);
    });

    test('readonly policy includes explicit deny for destructive actions', () => {
      expect(policiesContent).toMatch(/DenyDestructiveActions/);
      expect(policiesContent).toMatch(/\*:Delete\*/);
      expect(policiesContent).toMatch(/\*:Terminate\*/);
    });

    test('audit policy allows CloudTrail and compliance access', () => {
      expect(policiesContent).toMatch(/AuditReadAccess/);
      expect(policiesContent).toMatch(/cloudtrail:LookupEvents/);
      expect(policiesContent).toMatch(/iam:GetCredentialReport/);
    });
  });

  // Outputs validation
  describe('Outputs Configuration', () => {
    let outputsContent: string;

    beforeAll(() => {
      const outputsPath = path.join(libPath, 'outputs.tf');
      outputsContent = fs.readFileSync(outputsPath, 'utf8');
    });

    test('outputs IAM roles information', () => {
      expect(outputsContent).toMatch(/output\s+"iam_roles"/);
    });

    test('outputs CloudTrail information', () => {
      expect(outputsContent).toMatch(/output\s+"cloudtrail_arn"/);
      expect(outputsContent).toMatch(/output\s+"log_bucket_name"/);
    });

    test('outputs cross-account assume role commands', () => {
      expect(outputsContent).toMatch(
        /output\s+"cross_account_assume_role_commands"/
      );
      expect(outputsContent).toMatch(/aws sts assume-role/);
    });

    test('outputs security configuration summary', () => {
      expect(outputsContent).toMatch(
        /output\s+"security_configuration_summary"/
      );
    });
  });

  // Security best practices validation
  describe('Security Best Practices', () => {
    let allContent: string;

    beforeAll(() => {
      const files = ['main.tf', 'policies.tf', 'variables.tf'];
      allContent = files
        .map(file => {
          const filePath = path.join(libPath, file);
          return fs.readFileSync(filePath, 'utf8');
        })
        .join('\n');
    });

    test('does not contain hardcoded secrets or keys', () => {
      expect(allContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(allContent).not.toMatch(/password\s*=\s*"[^"]+"/);
      expect(allContent).not.toMatch(/secret\s*=\s*"[^"]+"/);
    });

    test('uses variables for sensitive configuration', () => {
      expect(allContent).toMatch(/var\.account_id/);
      expect(allContent).toMatch(/var\.log_bucket_name/);
      expect(allContent).toMatch(/var\.notification_email/);
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
    test('no duplicate resource names across files', () => {
      const files = ['main.tf', 'policies.tf', 'tap_stack.tf'];
      const allResources: string[] = [];

      files.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const resources =
          content.match(/resource\s+"[^"]+"\s+"([^"]+)"/g) || [];

        resources.forEach(resource => {
          const match = resource.match(/resource\s+"[^"]+"\s+"([^"]+)"/);
          if (match) {
            const resourceName = match[1];
            expect(allResources).not.toContain(resourceName);
            allResources.push(resourceName);
          }
        });
      });
    });

    test('all referenced variables are declared', () => {
      const variablesPath = path.join(libPath, 'variables.tf');
      const variablesContent = fs.readFileSync(variablesPath, 'utf8');
      const declaredVars =
        variablesContent
          .match(/variable\s+"([^"]+)"/g)
          ?.map(v => v.match(/variable\s+"([^"]+)"/)?.[1])
          .filter(Boolean) || [];

      const files = ['main.tf', 'policies.tf', 'outputs.tf'];
      files.forEach(file => {
        const filePath = path.join(libPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const usedVars =
          content
            .match(/var\.([a-zA-Z_][a-zA-Z0-9_]*)/g)
            ?.map(v => v.replace('var.', '')) || [];

        usedVars.forEach(usedVar => {
          expect(declaredVars).toContain(usedVar);
        });
      });
    });
  });
});
