// Unit tests for Terraform validator utility
import fs from 'fs';
import path from 'path';
import {
  TerraformValidator,
  extractResourcesByType,
  validateCIDRBlock,
  checkNamingConsistency,
  generatePlanSummary,
} from '../lib/terraform-validator';

describe('TerraformValidator', () => {
  const libPath = path.resolve(__dirname, '../lib');
  const validator = new TerraformValidator(libPath);
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
    providerContent = fs.readFileSync(
      path.join(libPath, 'provider.tf'),
      'utf8'
    );
  });

  describe('validateFileStructure', () => {
    test('should return true when all required files exist', () => {
      expect(validator.validateFileStructure()).toBe(true);
    });

    test('should validate file existence individually', () => {
      const files = [
        'tap_stack.tf',
        'provider.tf',
        'variables.tf',
        'backend.tf',
      ];
      files.forEach(file => {
        expect(fs.existsSync(path.join(libPath, file))).toBe(true);
      });
    });
  });

  describe('validateProviderConfig', () => {
    test('should validate provider configuration', () => {
      expect(validator.validateProviderConfig(providerContent)).toBe(true);
    });

    test('should detect required version', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]+"/);
    });

    test('should detect AWS provider', () => {
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/aws"/);
    });
  });

  describe('validateEnvironmentSuffix', () => {
    test('should count environment suffix usage', () => {
      const count = validator.validateEnvironmentSuffix(stackContent);
      expect(count).toBeGreaterThanOrEqual(20);
    });

    test('should find suffix in resource names', () => {
      expect(stackContent).toMatch(
        /Name\s*=\s*"[^"]*\$\{var\.environment_suffix\}"/
      );
    });
  });

  describe('validateRDSHighAvailability', () => {
    test('should validate RDS high availability configuration', () => {
      expect(validator.validateRDSHighAvailability(stackContent)).toBe(true);
    });

    test('should check for Multi-AZ', () => {
      expect(stackContent).toMatch(/multi_az\s*=\s*true/);
    });

    test('should check for backup retention', () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*\d+/);
    });

    test('should check for encryption', () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });
  });

  describe('validateVPCConfiguration', () => {
    test('should validate VPC configuration', () => {
      expect(validator.validateVPCConfiguration(stackContent)).toBe(true);
    });

    test('should check for primary VPC', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"primary"/);
    });

    test('should check for secondary VPC', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"secondary"/);
    });

    test('should check DNS settings', () => {
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
    });
  });

  describe('validateSubnetConfiguration', () => {
    test('should validate subnet configuration', () => {
      expect(validator.validateSubnetConfiguration(stackContent)).toBe(true);
    });

    test('should check for public subnets', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_subnet"\s+"primary_public"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_subnet"\s+"secondary_public"/
      );
    });

    test('should check for private subnets', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_subnet"\s+"primary_private"/
      );
      expect(stackContent).toMatch(
        /resource\s+"aws_subnet"\s+"secondary_private"/
      );
    });
  });

  describe('validateSecurityBestPractices', () => {
    test('should validate security best practices', () => {
      expect(validator.validateSecurityBestPractices(stackContent)).toBe(true);
    });

    test('should check for no hardcoded passwords', () => {
      expect(stackContent).not.toMatch(/password\s*=\s*"[^$]/);
    });

    test('should check for random password usage', () => {
      expect(stackContent).toMatch(/resource\s+"random_password"/);
    });

    test('should check for Secrets Manager usage', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"/);
    });

    test('should check RDS is not publicly accessible', () => {
      expect(stackContent).toMatch(/publicly_accessible\s*=\s*false/);
    });
  });

  describe('validateOutputs', () => {
    test('should extract all outputs', () => {
      const outputs = validator.validateOutputs(stackContent);
      expect(outputs).toContain('primary_vpc_id');
      expect(outputs).toContain('secondary_vpc_id');
      expect(outputs).toContain('primary_rds_endpoint');
      expect(outputs).toContain('secondary_rds_endpoint');
      expect(outputs).toContain('db_secret_arn');
    });

    test('should find correct number of outputs', () => {
      const outputs = validator.validateOutputs(stackContent);
      expect(outputs.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('validateIAMConfiguration', () => {
    test('should validate IAM configuration', () => {
      expect(validator.validateIAMConfiguration(stackContent)).toBe(true);
    });

    test('should check for IAM role', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"/);
    });

    test('should check for role policy attachment', () => {
      expect(stackContent).toMatch(
        /resource\s+"aws_iam_role_policy_attachment"/
      );
    });

    test('should check for enhanced monitoring role', () => {
      expect(stackContent).toMatch(/rds_enhanced_monitoring/);
    });
  });

  describe('validateResourceDependencies', () => {
    test('should validate resource dependencies', () => {
      expect(validator.validateResourceDependencies(stackContent)).toBe(true);
    });

    test('should check for depends_on usage', () => {
      expect(stackContent).toMatch(/depends_on\s*=\s*\[/);
    });
  });

  describe('getResourceCount', () => {
    test('should count VPC resources', () => {
      const count = validator.getResourceCount(stackContent, 'aws_vpc');
      expect(count).toBe(2);
    });

    test('should count subnet resources', () => {
      const count = validator.getResourceCount(stackContent, 'aws_subnet');
      expect(count).toBe(4);
    });

    test('should count RDS instances', () => {
      const count = validator.getResourceCount(stackContent, 'aws_db_instance');
      expect(count).toBe(2);
    });
  });

  describe('validateCompleteInfrastructure', () => {
    test('should validate complete infrastructure', () => {
      const result = validator.validateCompleteInfrastructure();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return validation details', () => {
      const result = validator.validateCompleteInfrastructure();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });
});

describe('Helper Functions', () => {
  const libPath = path.resolve(__dirname, '../lib');
  let stackContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(path.join(libPath, 'tap_stack.tf'), 'utf8');
  });

  describe('extractResourcesByType', () => {
    test('should extract VPC resources', () => {
      const vpcs = extractResourcesByType(stackContent, 'aws_vpc');
      expect(vpcs).toContain('primary');
      expect(vpcs).toContain('secondary');
    });

    test('should extract subnet resources', () => {
      const subnets = extractResourcesByType(stackContent, 'aws_subnet');
      expect(subnets).toContain('primary_public');
      expect(subnets).toContain('primary_private');
      expect(subnets).toContain('secondary_public');
      expect(subnets).toContain('secondary_private');
    });

    test('should extract RDS instances', () => {
      const rds = extractResourcesByType(stackContent, 'aws_db_instance');
      expect(rds).toContain('primary');
      expect(rds).toContain('secondary');
    });
  });

  describe('validateCIDRBlock', () => {
    test('should validate correct CIDR blocks', () => {
      expect(validateCIDRBlock('10.0.0.0/16')).toBe(true);
      expect(validateCIDRBlock('192.168.1.0/24')).toBe(true);
      expect(validateCIDRBlock('172.16.0.0/12')).toBe(true);
    });

    test('should reject invalid CIDR blocks', () => {
      expect(validateCIDRBlock('256.0.0.0/16')).toBe(false);
      expect(validateCIDRBlock('10.0.0.0/33')).toBe(false);
      expect(validateCIDRBlock('10.0.0.0')).toBe(false);
      expect(validateCIDRBlock('invalid')).toBe(false);
    });

    test('should validate edge cases', () => {
      expect(validateCIDRBlock('0.0.0.0/0')).toBe(true);
      expect(validateCIDRBlock('255.255.255.255/32')).toBe(true);
    });
  });

  describe('checkNamingConsistency', () => {
    test('should check naming consistency', () => {
      const result = checkNamingConsistency(stackContent);
      expect(result).toHaveProperty('consistent');
      expect(result).toHaveProperty('issues');
    });

    test('should detect primary/secondary pattern', () => {
      const primaryCount = (
        stackContent.match(/resource\s+"[^"]+"\s+"[^"]*primary[^"]*"/g) || []
      ).length;
      const secondaryCount = (
        stackContent.match(/resource\s+"[^"]+"\s+"[^"]*secondary[^"]*"/g) || []
      ).length;
      expect(primaryCount).toBeGreaterThan(0);
      expect(secondaryCount).toBeGreaterThan(0);
    });
  });

  describe('generatePlanSummary', () => {
    test('should generate plan summary', () => {
      const summary = generatePlanSummary(stackContent);
      expect(summary).toHaveProperty('resourceCounts');
      expect(summary).toHaveProperty('totalResources');
      expect(summary).toHaveProperty('regions');
      expect(summary).toHaveProperty('hasHighAvailability');
    });

    test('should count resources correctly', () => {
      const summary = generatePlanSummary(stackContent);
      expect(summary.resourceCounts['aws_vpc']).toBe(2);
      expect(summary.resourceCounts['aws_db_instance']).toBe(2);
      expect(summary.totalResources).toBeGreaterThan(10);
    });

    test('should detect regions', () => {
      const summary = generatePlanSummary(stackContent);
      expect(summary.regions).toContain('us-east-1');
      expect(summary.regions).toContain('us-west-2');
    });

    test('should detect high availability', () => {
      const summary = generatePlanSummary(stackContent);
      expect(summary.hasHighAvailability).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty content', () => {
      const emptyResult = extractResourcesByType('', 'aws_vpc');
      expect(emptyResult).toEqual([]);
    });

    test('should handle invalid resource types', () => {
      const invalidResult = extractResourcesByType(
        stackContent,
        'invalid_resource'
      );
      expect(invalidResult).toEqual([]);
    });

    test('should handle malformed CIDR blocks', () => {
      expect(validateCIDRBlock('')).toBe(false);
      expect(validateCIDRBlock('10.0.0.0/')).toBe(false);
      expect(validateCIDRBlock('/24')).toBe(false);
    });
  });
});
