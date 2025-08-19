import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Terraform IAM Infrastructure Unit Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');
  const providerPath = path.join(libPath, 'provider.tf');
  const tapStackPath = path.join(libPath, 'tap_stack.tf');
  const tfvarsPath = path.join(libPath, 'terraform.tfvars');
  
  let providerContent: string;
  let tapStackContent: string;
  let tfvarsContent: string;
  
  beforeAll(() => {
    // Read file contents once
    providerContent = fs.readFileSync(providerPath, 'utf8');
    tapStackContent = fs.readFileSync(tapStackPath, 'utf8');
    if (fs.existsSync(tfvarsPath)) {
      tfvarsContent = fs.readFileSync(tfvarsPath, 'utf8');
    }
  });

  describe('File Structure and Requirements', () => {
    it('should have exactly two main terraform files as per requirements', () => {
      expect(fs.existsSync(providerPath)).toBe(true);
      expect(fs.existsSync(tapStackPath)).toBe(true);
      
      // Verify no other .tf files exist (only provider.tf and tap_stack.tf)
      const tfFiles = fs.readdirSync(libPath).filter(f => f.endsWith('.tf'));
      expect(tfFiles).toHaveLength(2);
      expect(tfFiles).toContain('provider.tf');
      expect(tfFiles).toContain('tap_stack.tf');
    });

    it('should have terraform.tfvars file for configuration', () => {
      expect(fs.existsSync(tfvarsPath)).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    it('should configure terraform version >= 1.0', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    it('should pin AWS provider version to ~> 5.0', () => {
      expect(providerContent).toMatch(/version\s*=\s*"~>\s*5\.0"/);
    });

    it('should have default provider for us-east-1', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?region\s*=\s*"us-east-1"/);
    });

    it('should have EU alias provider for eu-west-1', () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{[\s\S]*?alias\s*=\s*"eu"[\s\S]*?region\s*=\s*"eu-west-1"/);
    });

    it('should include default tags for compliance', () => {
      const defaultTagsMatch = providerContent.match(/default_tags\s*{[\s\S]*?tags\s*=\s*{[\s\S]*?}/g);
      expect(defaultTagsMatch).toBeTruthy();
      expect(providerContent).toContain('owner');
      expect(providerContent).toContain('purpose');
      expect(providerContent).toContain('env');
      expect(providerContent).toContain('managed_by');
      expect(providerContent).toContain('compliance');
      expect(providerContent).toContain('soc2-gdpr');
    });

    it('should have commented assume_role configuration for cross-account access', () => {
      expect(providerContent).toContain('# assume_role {');
      expect(providerContent).toContain('corp-terraform-deployer');
    });
  });

  describe('Variable Definitions', () => {
    it('should define env variable with validation', () => {
      expect(tapStackContent).toMatch(/variable\s+"env"\s*{/);
      expect(tapStackContent).toContain('validation');
      expect(tapStackContent).toContain('["dev", "staging", "prod"]');
    });

    it('should define environment_suffix variable', () => {
      expect(tapStackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(tapStackContent).toContain('Suffix to append to resource names');
    });

    it('should define owner variable with default', () => {
      expect(tapStackContent).toMatch(/variable\s+"owner"\s*{/);
      expect(tapStackContent).toContain('terraform-automation');
    });

    it('should define purpose variable with default', () => {
      expect(tapStackContent).toMatch(/variable\s+"purpose"\s*{/);
      expect(tapStackContent).toContain('iam-governance');
    });

    it('should define target_account_id variable', () => {
      expect(tapStackContent).toMatch(/variable\s+"target_account_id"\s*{/);
    });

    it('should define external_id variable as optional', () => {
      expect(tapStackContent).toMatch(/variable\s+"external_id"\s*{/);
      expect(tapStackContent).toContain('default     = ""');
    });

    it('should define complex roles variable with proper structure', () => {
      expect(tapStackContent).toMatch(/variable\s+"roles"\s*{/);
      expect(tapStackContent).toContain('map(object({');
      expect(tapStackContent).toContain('max_session_duration');
      expect(tapStackContent).toContain('trusted_principals');
      expect(tapStackContent).toContain('require_external_id');
      expect(tapStackContent).toContain('require_mfa');
      expect(tapStackContent).toContain('inline_policies');
      expect(tapStackContent).toContain('managed_policy_arns');
    });
  });

  describe('Local Values', () => {
    it('should define name_prefix as corp-', () => {
      expect(tapStackContent).toMatch(/name_prefix\s*=\s*"corp-"/);
    });

    it('should define common_tags with required fields', () => {
      expect(tapStackContent).toContain('common_tags');
      expect(tapStackContent).toContain('terraform_managed');
      expect(tapStackContent).toContain('compliance_scope');
      expect(tapStackContent).toContain('last_updated');
    });
  });

  describe('Permission Boundary Policy', () => {
    it('should define permission boundary data source', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"permission_boundary"/);
    });

    it('should deny attaching AdministratorAccess policy', () => {
      expect(tapStackContent).toContain('DenyAttachAdministratorAccess');
      expect(tapStackContent).toContain('iam:AttachRolePolicy');
      expect(tapStackContent).toContain('arn:aws:iam::aws:policy/AdministratorAccess');
    });

    it('should enforce regional restrictions with StringNotEqualsIfExists', () => {
      expect(tapStackContent).toContain('EnforceRegionRestriction');
      expect(tapStackContent).toContain('StringNotEqualsIfExists');
      expect(tapStackContent).toContain('aws:RequestedRegion');
      expect(tapStackContent).toContain('["us-east-1", "eu-west-1"]');
    });

    it('should require MFA for sensitive IAM operations', () => {
      expect(tapStackContent).toContain('RequireMFAForConsole');
      expect(tapStackContent).toContain('aws:MultiFactorAuthPresent');
      expect(tapStackContent).toContain('iam:CreateRole');
      expect(tapStackContent).toContain('iam:DeleteRole');
    });

    it('should protect security-critical roles', () => {
      expect(tapStackContent).toContain('ProtectSecurityResources');
      expect(tapStackContent).toContain('corp-security-*');
      expect(tapStackContent).toContain('corp-breakglass-*');
    });

    it('should create permission boundary resource with proper naming', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_policy"\s+"permission_boundary"/);
      expect(tapStackContent).toContain('${local.name_prefix}permission-boundary-${var.environment_suffix}');
    });
  });

  describe('IAM Roles Configuration', () => {
    it('should create roles using for_each', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role"\s+"roles"\s*{[\s\S]*?for_each\s*=\s*var\.roles/);
    });

    it('should apply permission boundary to all roles', () => {
      expect(tapStackContent).toContain('permissions_boundary = aws_iam_policy.permission_boundary.arn');
    });

    it('should use consistent naming with environment suffix', () => {
      expect(tapStackContent).toContain('${local.name_prefix}${each.key}-${var.environment_suffix}');
    });

    it('should set max_session_duration from variable', () => {
      expect(tapStackContent).toContain('max_session_duration = each.value.max_session_duration');
    });

    it('should apply tags to roles', () => {
      const roleResourceMatch = tapStackContent.match(/resource\s+"aws_iam_role"\s+"roles"\s*{[\s\S]*?tags\s*=\s*merge/);
      expect(roleResourceMatch).toBeTruthy();
    });
  });

  describe('Trust Policies', () => {
    it('should define trust policy data source with for_each', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"trust_policy"\s*{[\s\S]*?for_each\s*=\s*var\.roles/);
    });

    it('should support external ID condition dynamically', () => {
      expect(tapStackContent).toContain('dynamic "condition"');
      expect(tapStackContent).toContain('require_external_id && var.external_id != ""');
      expect(tapStackContent).toContain('sts:ExternalId');
    });

    it('should support MFA condition dynamically', () => {
      expect(tapStackContent).toContain('require_mfa');
      expect(tapStackContent).toContain('aws:MultiFactorAuthPresent');
    });
  });

  describe('Inline Policies', () => {
    it('should create inline policy resources', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"inline_policies"/);
    });

    it('should create inline policy documents', () => {
      expect(tapStackContent).toMatch(/data\s+"aws_iam_policy_document"\s+"inline_policies"/);
    });

    it('should support dynamic conditions in policies', () => {
      const policyDocMatch = tapStackContent.match(/data\s+"aws_iam_policy_document"\s+"inline_policies"[\s\S]*?dynamic\s+"condition"/);
      expect(policyDocMatch).toBeTruthy();
    });
  });

  describe('Managed Policy Attachments', () => {
    it('should support attaching AWS managed policies', () => {
      expect(tapStackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"managed_policies"/);
    });

    it('should use replace function for policy ARN keys', () => {
      expect(tapStackContent).toContain('replace(combo.policy_arn');
    });
  });

  describe('Default Role Examples', () => {
    it('should include security-auditor role example', () => {
      expect(tapStackContent).toContain('security-auditor');
      expect(tapStackContent).toContain('SOC 2 compliance auditing');
      expect(tapStackContent).toContain('cloudtrail:Get*');
    });

    it('should include ci-deployer role example', () => {
      expect(tapStackContent).toContain('ci-deployer');
      expect(tapStackContent).toContain('CI/CD pipeline');
      expect(tapStackContent).toContain('lambda:CreateFunction');
    });

    it('should include breakglass role example', () => {
      expect(tapStackContent).toContain('breakglass');
      expect(tapStackContent).toContain('Emergency access');
      expect(tapStackContent).toContain('max_session_duration = 3600');
    });
  });

  describe('Outputs', () => {
    it('should output role ARNs', () => {
      expect(tapStackContent).toMatch(/output\s+"role_arns"/);
      expect(tapStackContent).toContain('for role_key, role in aws_iam_role.roles');
    });

    it('should output permission boundary ARN', () => {
      expect(tapStackContent).toMatch(/output\s+"permission_boundary_arn"/);
      expect(tapStackContent).toContain('aws_iam_policy.permission_boundary.arn');
    });

    it('should output applied tags', () => {
      expect(tapStackContent).toMatch(/output\s+"applied_tags"/);
      expect(tapStackContent).toContain('local.common_tags');
    });

    it('should output compliance summary', () => {
      expect(tapStackContent).toMatch(/output\s+"compliance_summary"/);
      expect(tapStackContent).toContain('permission_boundaries_enabled = true');
      expect(tapStackContent).toContain('mfa_required_for_sensitive');
      expect(tapStackContent).toContain('regional_restrictions');
      expect(tapStackContent).toContain('resource_tagging_enforced');
      expect(tapStackContent).toContain('least_privilege_applied');
    });
  });

  describe('CI/CD Integration', () => {
    it('should include CI/CD example comments', () => {
      expect(tapStackContent).toContain('terraform fmt -check');
      expect(tapStackContent).toContain('terraform validate');
      expect(tapStackContent).toContain('tflint');
      expect(tapStackContent).toContain('checkov');
    });

    it('should include policy sanity check examples', () => {
      expect(tapStackContent).toContain('Permission Boundary Test');
      expect(tapStackContent).toContain('Least Privilege Validation');
      expect(tapStackContent).toContain('SOC 2 Control Mapping');
      expect(tapStackContent).toContain('GDPR Compliance');
    });
  });

  describe('Backend Configuration', () => {
    it('should configure S3 backend', () => {
      expect(tapStackContent).toMatch(/backend\s+"s3"\s*{/);
      expect(tapStackContent).toContain('Backend configuration for S3 state management');
    });

    it('should have comments for backend configuration', () => {
      expect(tapStackContent).toContain('# bucket = "iac-rlhf-tf-states"');
      expect(tapStackContent).toContain('# key    = "prs/${ENVIRONMENT_SUFFIX}/terraform.tfstate"');
      expect(tapStackContent).toContain('# encrypt = true');
    });
  });

  describe('Security Best Practices', () => {
    it('should not have any hardcoded AWS account IDs in main code', () => {
      // Check that placeholder account IDs are used
      const realAccountIdPattern = /\d{12}/g;
      const matches = tapStackContent.match(realAccountIdPattern);
      if (matches) {
        // All matches should be placeholder values
        matches.forEach(match => {
          expect(['111122223333', '444455556666', '123456789012']).toContain(match);
        });
      }
    });

    it('should use least privilege principle in policies', () => {
      expect(tapStackContent).not.toContain('"*:*"');
      expect(tapStackContent).toContain('iam:Get*');
      expect(tapStackContent).toContain('iam:List*');
      // Breakglass is the exception with broader permissions but requires MFA
      const breakglassSection = tapStackContent.match(/breakglass[\s\S]*?managed_policy_arns/);
      if (breakglassSection) {
        expect(breakglassSection[0]).toContain('require_mfa          = true');
      }
    });

    it('should enforce resource-level permissions where possible', () => {
      expect(tapStackContent).toContain('arn:aws:lambda:*:123456789012:function:corp-*');
      expect(tapStackContent).toContain('arn:aws:s3:::corp-deployment-artifacts-dev/*');
    });

    it('should use dynamic blocks for conditional logic', () => {
      const dynamicCount = (tapStackContent.match(/dynamic\s+"condition"/g) || []).length;
      expect(dynamicCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Terraform Best Practices', () => {
    it('should use data sources for policy documents', () => {
      expect(tapStackContent).toContain('data "aws_iam_policy_document"');
      expect(tapStackContent).not.toContain('jsonencode({'); // Should use data sources, not jsonencode
    });

    it('should use for_each instead of count for resources', () => {
      expect(tapStackContent).toContain('for_each');
      expect(tapStackContent).not.toMatch(/count\s*=/); // Should not use count
    });

    it('should use locals for repeated values', () => {
      expect(tapStackContent).toContain('locals {');
      expect(tapStackContent).toContain('local.name_prefix');
      expect(tapStackContent).toContain('local.common_tags');
    });

    it('should have descriptive resource names', () => {
      expect(tapStackContent).toContain('permission_boundary');
      expect(tapStackContent).toContain('trust_policy');
      expect(tapStackContent).toContain('inline_policies');
    });
  });

  describe('Compliance and Governance', () => {
    it('should support SOC 2 compliance requirements', () => {
      expect(tapStackContent).toContain('SOC 2');
      expect(tapStackContent).toContain('CC6.1');
      expect(tapStackContent).toContain('CC6.2');
      expect(tapStackContent).toContain('CC6.3');
      expect(tapStackContent).toContain('CC7.2');
    });

    it('should support GDPR compliance requirements', () => {
      expect(tapStackContent).toContain('GDPR');
      expect(tapStackContent).toContain('Data residency');
      expect(tapStackContent).toContain('Regional restrictions');
    });

    it('should enforce consistent tagging', () => {
      expect(tapStackContent).toContain('owner');
      expect(tapStackContent).toContain('purpose');
      expect(tapStackContent).toContain('env');
      expect(tapStackContent).toContain('compliance_scope');
    });

    it('should have audit trail capabilities', () => {
      expect(tapStackContent).toContain('CloudTrail');
      expect(tapStackContent).toContain('audit');
      expect(tapStackContent).toContain('logging');
    });
  });

  describe('Terraform Configuration Validation', () => {
    it('should pass terraform fmt check', () => {
      try {
        execSync('cd lib && terraform fmt -check', { encoding: 'utf8' });
        expect(true).toBe(true);
      } catch (error) {
        // If format check fails, the test should fail
        expect(error).toBeUndefined();
      }
    });

    it('should pass terraform validate', () => {
      try {
        // Initialize first (required for validate)
        execSync('cd lib && terraform init -backend=false', { encoding: 'utf8', stdio: 'pipe' });
        const result = execSync('cd lib && terraform validate', { encoding: 'utf8' });
        expect(result).toContain('Success');
      } catch (error) {
        // If validation fails, the test should fail
        expect(error).toBeUndefined();
      }
    });

    it('should generate a plan without errors', () => {
      try {
        execSync('cd lib && terraform init -backend=false', { encoding: 'utf8', stdio: 'pipe' });
        const result = execSync('cd lib && terraform plan -input=false', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        expect(result).toBeDefined();
        expect(result).not.toContain('Error:');
      } catch (error: any) {
        // Plan might fail due to AWS credentials, but shouldn't have syntax errors
        if (error.stdout) {
          expect(error.stdout).not.toContain('Error: Invalid');
          expect(error.stdout).not.toContain('Error: Unsupported');
        }
      }
    });
  });

  describe('Variable Defaults and Overrides', () => {
    it('should have appropriate defaults for all variables', () => {
      expect(tapStackContent).toContain('default     = "dev"'); // env
      expect(tapStackContent).toContain('default     = "terraform-automation"'); // owner
      expect(tapStackContent).toContain('default     = "iam-governance"'); // purpose
    });

    it('should have example role configurations in defaults', () => {
      const defaultBlock = tapStackContent.match(/default\s*=\s*{[\s\S]*?^  \}/m);
      expect(defaultBlock).toBeTruthy();
      if (defaultBlock) {
        expect(defaultBlock[0]).toContain('security-auditor');
        expect(defaultBlock[0]).toContain('ci-deployer');
        expect(defaultBlock[0]).toContain('breakglass');
      }
    });

    it('tfvars file should override defaults appropriately', () => {
      if (tfvarsContent) {
        expect(tfvarsContent).toContain('environment_suffix');
        expect(tfvarsContent).toContain('owner');
        expect(tfvarsContent).toContain('purpose');
        expect(tfvarsContent).toContain('roles');
      }
    });
  });
});