/**
 * Unit tests for TerraformValidator module
 * These tests validate the Terraform configuration validation logic
 */

import { TerraformValidator } from '../lib/terraform-validator';
import path from 'path';

describe('TerraformValidator Unit Tests', () => {
  let validator: TerraformValidator;

  beforeAll(() => {
    const libPath = path.resolve(__dirname, '../lib');
    validator = new TerraformValidator(libPath);
  });

  describe('File Existence Checks', () => {
    test('should detect existing Terraform files', () => {
      const result = validator.checkFilesExist();
      expect(result.stack).toBe(true);
      expect(result.provider).toBe(true);
    });
  });

  describe('Provider Configuration Validation', () => {
    test('should validate provider configuration correctly', () => {
      const result = validator.validateProviderConfig();
      
      expect(result.hasRequiredProviders).toBe(true);
      expect(result.hasAWSProvider).toBe(true);
      expect(result.hasCorrectVersion).toBe(true);
      expect(result.hasRegion).toBe(true);
      expect(result.region).toBe('us-east-1');
    });
  });

  describe('Stack Configuration Validation', () => {
    test('should validate stack configuration correctly', () => {
      const result = validator.validateStackConfig();
      
      expect(result.hasEnvironmentVariable).toBe(true);
      expect(result.hasVPC).toBe(true);
      expect(result.hasIGW).toBe(true);
      expect(result.hasSubnets).toBe(2);
      expect(result.hasRouteTable).toBe(true);
      expect(result.hasRoute).toBe(true);
      expect(result.hasAssociations).toBe(2);
      expect(result.outputs).toContain('vpc_id');
      expect(result.outputs).toContain('subnet_ids');
      expect(result.outputs).toContain('internet_gateway_id');
      expect(result.outputs).toContain('route_table_id');
    });
  });

  describe('Environment Suffix Validation', () => {
    test('should validate environment suffix usage', () => {
      const result = validator.validateEnvironmentSuffix();
      
      expect(result.allTagsUseVariable).toBe(true);
      expect(result.variableHasDefault).toBe(true);
      expect(result.resourcesWithSuffix.length).toBeGreaterThan(0);
    });
  });

  describe('CIDR Configuration Validation', () => {
    test('should validate CIDR configuration', () => {
      const result = validator.validateCIDRConfig();
      
      expect(result.vpcCIDR).toBe('10.0.0.0/16');
      expect(result.subnetCIDRs).toContain('10.0.1.0/24');
      expect(result.subnetCIDRs).toContain('10.0.2.0/24');
      expect(result.validCIDRs).toBe(true);
    });
  });

  describe('Availability Zone Validation', () => {
    test('should validate availability zones', () => {
      const result = validator.validateAvailabilityZones();
      
      expect(result.zones).toContain('us-east-1a');
      expect(result.zones).toContain('us-east-1b');
      expect(result.uniqueZones).toBe(true);
      expect(result.matchRegion).toBe(true);
    });
  });

  describe('Resource Dependencies Validation', () => {
    test('should validate resource dependencies', () => {
      const result = validator.validateDependencies();
      
      expect(result.igwReferencesVPC).toBe(true);
      expect(result.subnetsReferenceVPC).toBe(true);
      expect(result.routeTableReferencesVPC).toBe(true);
      expect(result.routeReferencesResources).toBe(true);
      expect(result.associationsReferenceResources).toBe(true);
    });
  });

  describe('Outputs Validation', () => {
    test('should validate outputs configuration', () => {
      const result = validator.validateOutputs();
      
      expect(result.hasAllRequiredOutputs).toBe(true);
      expect(result.outputsWithDescriptions.length).toBe(4);
      expect(result.outputsWithValues.length).toBe(4);
    });
  });

  describe('Comprehensive Validation Report', () => {
    test('should generate complete validation report', () => {
      const report = validator.getValidationReport();
      
      expect(report.filesExist.stack).toBe(true);
      expect(report.filesExist.provider).toBe(true);
      expect(report.provider.hasAWSProvider).toBe(true);
      expect(report.stack.hasVPC).toBe(true);
      expect(report.environmentSuffix.allTagsUseVariable).toBe(true);
      expect(report.cidr.validCIDRs).toBe(true);
      expect(report.availabilityZones.uniqueZones).toBe(true);
      expect(report.dependencies.igwReferencesVPC).toBe(true);
      expect(report.outputs.hasAllRequiredOutputs).toBe(true);
      expect(report.isValid).toBe(true);
    });

    test('should correctly determine overall validity', () => {
      const report = validator.getValidationReport();
      
      // The configuration should be valid if all critical checks pass
      const expectedValidity = 
        report.filesExist.stack && 
        report.filesExist.provider &&
        report.provider.hasRequiredProviders && 
        report.provider.hasAWSProvider &&
        report.stack.hasVPC && 
        report.stack.hasIGW && 
        report.stack.hasSubnets >= 2 &&
        report.environmentSuffix.allTagsUseVariable && 
        report.environmentSuffix.variableHasDefault &&
        report.cidr.validCIDRs && 
        report.availabilityZones.uniqueZones &&
        report.dependencies.igwReferencesVPC && 
        report.dependencies.subnetsReferenceVPC &&
        report.outputs.hasAllRequiredOutputs;
      
      expect(report.isValid).toBe(expectedValidity);
    });
  });

  describe('Edge Cases', () => {
    test('should handle multiple subnets correctly', () => {
      const result = validator.validateStackConfig();
      expect(result.hasSubnets).toBe(2);
      expect(result.hasAssociations).toBe(2);
    });

    test('should validate all Name tags use environment suffix', () => {
      const result = validator.validateEnvironmentSuffix();
      expect(result.allTagsUseVariable).toBe(true);
    });

    test('should ensure subnet CIDRs are within VPC range', () => {
      const result = validator.validateCIDRConfig();
      const vpcPrefix = result.vpcCIDR?.split('.').slice(0, 2).join('.');
      
      result.subnetCIDRs.forEach(cidr => {
        expect(cidr).toMatch(new RegExp(`^${vpcPrefix}\\.`));
      });
    });

    test('should ensure all outputs have both description and value', () => {
      const result = validator.validateOutputs();
      expect(result.outputsWithDescriptions.length).toBe(result.outputsWithValues.length);
    });
  });
});