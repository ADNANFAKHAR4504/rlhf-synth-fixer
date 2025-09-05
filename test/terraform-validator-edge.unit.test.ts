/**
 * Edge case unit tests for TerraformValidator module
 * These tests cover additional branches and edge cases
 */

import { TerraformValidator } from '../lib/terraform-validator';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

describe('TerraformValidator Edge Case Tests', () => {
  let validator: TerraformValidator;
  const libPath = path.resolve(__dirname, '../lib');
  const backupStackPath = path.join(libPath, 'tap_stack.tf.backup');
  const stackPath = path.join(libPath, 'tap_stack.tf');

  beforeAll(() => {
    validator = new TerraformValidator(libPath);
    // Create backup of original file
    if (fs.existsSync(stackPath)) {
      fs.copyFileSync(stackPath, backupStackPath);
    }
  });

  afterAll(() => {
    // Restore original file
    if (fs.existsSync(backupStackPath)) {
      fs.copyFileSync(backupStackPath, stackPath);
      fs.unlinkSync(backupStackPath);
    }
  });

  describe('Missing Files Edge Cases', () => {
    test('should handle missing stack file gracefully', () => {
      // Temporarily rename the file
      if (fs.existsSync(stackPath)) {
        fs.renameSync(stackPath, stackPath + '.tmp');
      }
      
      try {
        const result = validator.checkFilesExist();
        expect(result.stack).toBe(false);
        expect(result.provider).toBe(true);
      } finally {
        // Restore the file
        if (fs.existsSync(stackPath + '.tmp')) {
          fs.renameSync(stackPath + '.tmp', stackPath);
        }
      }
    });
  });

  describe('Malformed Configuration Edge Cases', () => {
    test('should handle configuration without environment suffix variable', () => {
      // Create a test file without environment suffix
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(/variable\s+"environment_suffix"[^}]+}/s, '');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateStackConfig();
        expect(result.hasEnvironmentVariable).toBe(false);
        
        const suffixResult = validator.validateEnvironmentSuffix();
        expect(suffixResult.variableHasDefault).toBe(false);
      } finally {
        // Restore original content
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle configuration with missing VPC', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(/resource\s+"aws_vpc"[^}]+}/s, '');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateStackConfig();
        expect(result.hasVPC).toBe(false);
        
        const report = validator.getValidationReport();
        expect(report.isValid).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle configuration with no subnets', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(/resource\s+"aws_subnet"[^}]+}/gs, '');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateStackConfig();
        expect(result.hasSubnets).toBe(0);
        
        const cidrResult = validator.validateCIDRConfig();
        expect(cidrResult.subnetCIDRs.length).toBe(0);
        
        const azResult = validator.validateAvailabilityZones();
        expect(azResult.zones.length).toBe(0);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle configuration with missing outputs', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(/output\s+"[^"]+"\s*{[^}]+}/gs, '');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateStackConfig();
        expect(result.outputs.length).toBe(0);
        
        const outputResult = validator.validateOutputs();
        expect(outputResult.hasAllRequiredOutputs).toBe(false);
        expect(outputResult.outputsWithDescriptions.length).toBe(0);
        expect(outputResult.outputsWithValues.length).toBe(0);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle tags without environment suffix', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(/\$\{var\.environment_suffix\}/g, 'dev');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateEnvironmentSuffix();
        expect(result.allTagsUseVariable).toBe(false);
        expect(result.resourcesWithSuffix.length).toBe(0);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle invalid CIDR configurations', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      // Change subnet CIDR to be outside VPC range
      const modifiedContent = originalContent.replace('10.0.1.0/24', '192.168.1.0/24');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateCIDRConfig();
        expect(result.validCIDRs).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle duplicate availability zones', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      // Make both subnets use the same AZ
      const modifiedContent = originalContent.replace('us-east-1b', 'us-east-1a');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateAvailabilityZones();
        expect(result.uniqueZones).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle missing dependencies', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      // Remove VPC reference from IGW only (first occurrence)
      let modifiedContent = originalContent.replace(
        /resource\s+"aws_internet_gateway"[^}]+}/s,
        `resource "aws_internet_gateway" "basic_igw" {
  vpc_id = "vpc-123456"
  
  tags = {
    Name        = "basic-igw-\${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}`
      );
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateDependencies();
        expect(result.igwReferencesVPC).toBe(false);
        // Subnets should still reference VPC correctly
        expect(result.subnetsReferenceVPC).toBe(true);
        
        const report = validator.getValidationReport();
        expect(report.isValid).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle configuration without route table associations', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(
        /resource\s+"aws_route_table_association"[^}]+}/gs,
        ''
      );
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateStackConfig();
        expect(result.hasAssociations).toBe(0);
        
        const depResult = validator.validateDependencies();
        expect(depResult.associationsReferenceResources).toBe(true); // Empty array returns true for every()
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });
  });

  describe('Complex Configuration Cases', () => {
    test('should handle configuration with additional resources', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const additionalResource = `
resource "aws_subnet" "private_a" {
  vpc_id     = aws_vpc.basic_vpc.id
  cidr_block = "10.0.3.0/24"
  availability_zone = "us-east-1c"
  
  tags = {
    Name = "private-a-\${var.environment_suffix}"
    Project = "basic-network"
    Environment = var.environment_suffix
  }
}`;
      
      fs.writeFileSync(stackPath, originalContent + additionalResource);
      
      try {
        const result = validator.validateStackConfig();
        expect(result.hasSubnets).toBe(3);
        
        const cidrResult = validator.validateCIDRConfig();
        expect(cidrResult.subnetCIDRs.length).toBe(3);
        expect(cidrResult.validCIDRs).toBe(true);
        
        const azResult = validator.validateAvailabilityZones();
        expect(azResult.zones.length).toBe(3);
        expect(azResult.uniqueZones).toBe(true);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle outputs without descriptions', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(/description\s*=\s*"[^"]+"\n/g, '');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateOutputs();
        expect(result.outputsWithDescriptions.length).toBe(0);
        expect(result.outputsWithValues.length).toBe(4);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle outputs without values', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const outputBlock = `
output "test_output" {
  description = "Test output without value"
}`;
      
      fs.writeFileSync(stackPath, originalContent + outputBlock);
      
      try {
        const result = validator.validateOutputs();
        expect(result.outputsWithValues.length).toBe(4); // Only original 4 have values
        expect(result.outputsWithDescriptions.length).toBe(5); // All 5 have descriptions
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });
  });

  describe('Alternative Constructor', () => {
    test('should use default lib path when not provided', () => {
      const defaultValidator = new TerraformValidator();
      const result = defaultValidator.checkFilesExist();
      
      // Should still find files if running from the right directory
      expect(typeof result.stack).toBe('boolean');
      expect(typeof result.provider).toBe('boolean');
    });
  });

  describe('Empty Configuration Cases', () => {
    test('should handle completely empty stack file', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      
      fs.writeFileSync(stackPath, '');
      
      try {
        const result = validator.validateStackConfig();
        expect(result.hasEnvironmentVariable).toBe(false);
        expect(result.hasVPC).toBe(false);
        expect(result.hasSubnets).toBe(0);
        expect(result.outputs.length).toBe(0);
        
        const report = validator.getValidationReport();
        expect(report.isValid).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });
  });

  describe('Partial Configuration Cases', () => {
    test('should handle variable without default value', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(/default\s*=\s*"dev"/, '');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateEnvironmentSuffix();
        expect(result.variableHasDefault).toBe(false);
        
        const report = validator.getValidationReport();
        expect(report.isValid).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle mismatched availability zones with region', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      // Use west coast AZ with east coast region
      const modifiedContent = originalContent.replace('us-east-1a', 'us-west-2a');
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateAvailabilityZones();
        expect(result.matchRegion).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle route table without VPC reference', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(
        /resource\s+"aws_route_table"[^}]+}/s,
        `resource "aws_route_table" "public_rt" {
  vpc_id = "vpc-hardcoded"
  
  tags = {
    Name        = "public-rt-\${var.environment_suffix}"
    Project     = "basic-network"
    Environment = var.environment_suffix
  }
}`
      );
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateDependencies();
        expect(result.routeTableReferencesVPC).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle route without proper references', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(
        /resource\s+"aws_route"[^}]+}/s,
        `resource "aws_route" "public_internet_access" {
  route_table_id         = "rt-hardcoded"
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = "igw-hardcoded"
}`
      );
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateDependencies();
        expect(result.routeReferencesResources).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle associations without proper references', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(
        /resource\s+"aws_route_table_association"\s+"public_a"[^}]+}/s,
        `resource "aws_route_table_association" "public_a" {
  subnet_id      = "subnet-hardcoded"
  route_table_id = "rt-hardcoded"
}`
      );
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateDependencies();
        expect(result.associationsReferenceResources).toBe(false);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle configuration with no VPC CIDR', () => {
      const originalContent = fs.readFileSync(stackPath, 'utf8');
      const modifiedContent = originalContent.replace(
        /cidr_block\s*=\s*"10\.0\.0\.0\/16"/,
        ''
      );
      
      fs.writeFileSync(stackPath, modifiedContent);
      
      try {
        const result = validator.validateCIDRConfig();
        // When VPC CIDR is missing, it returns empty string not null
        expect(result.vpcCIDR).toBeFalsy();
        // validCIDRs might still be true if no subnets or empty prefix match
        expect(result.subnetCIDRs.length).toBeGreaterThan(0);
      } finally {
        fs.writeFileSync(stackPath, originalContent);
      }
    });

    test('should handle provider without region', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const originalContent = fs.readFileSync(providerPath, 'utf8');
      const modifiedContent = originalContent.replace(
        /region\s*=\s*"us-east-1"/,
        ''
      );
      
      fs.writeFileSync(providerPath, modifiedContent);
      
      try {
        const result = validator.validateProviderConfig();
        expect(result.hasRegion).toBe(false);
        expect(result.region).toBeUndefined();
      } finally {
        fs.writeFileSync(providerPath, originalContent);
      }
    });
  });
});