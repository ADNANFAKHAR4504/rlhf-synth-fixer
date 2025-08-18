/**
 * Unit tests for Terraform Validator
 */

import { TerraformValidator } from '../lib/terraform-validator';
import * as fs from 'fs';
import * as path from 'path';

describe('TerraformValidator', () => {
  let validator: TerraformValidator;

  beforeEach(() => {
    validator = new TerraformValidator();
  });

  describe('loadConfiguration', () => {
    it('should load configuration files successfully', () => {
      expect(() => validator.loadConfiguration()).not.toThrow();
    });

    it('should throw error if config file does not exist', () => {
      const invalidValidator = new TerraformValidator('/invalid/path.tf', '/invalid/provider.tf');
      expect(() => invalidValidator.loadConfiguration()).toThrow('Configuration file not found');
    });
  });

  describe('validateRegionCompliance', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate us-east-1 region requirement', () => {
      const result = validator.validateRegionCompliance();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate availability zones are in us-east-1', () => {
      const result = validator.validateRegionCompliance();
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTerraformVersion', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate Terraform version requirement', () => {
      const result = validator.validateTerraformVersion();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateEnvironmentConfigurations', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate all three environments are configured', () => {
      const result = validator.validateEnvironmentConfigurations();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate environment suffix support', () => {
      const result = validator.validateEnvironmentConfigurations();
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCostEstimation', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate cost estimation output exists', () => {
      const result = validator.validateCostEstimation();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateNetworkConfiguration', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate all required network resources exist', () => {
      const result = validator.validateNetworkConfiguration();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateSSHRestrictions', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate SSH access is restricted', () => {
      const result = validator.validateSSHRestrictions();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateRemoteStateManagement', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate S3 backend is configured', () => {
      const result = validator.validateRemoteStateManagement();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateS3Security', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate all S3 security features are configured', () => {
      const result = validator.validateS3Security();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateNamingConventions', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate naming conventions include environment suffix', () => {
      const result = validator.validateNamingConventions();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateNoHardcodedSecrets', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate no hardcoded secrets exist', () => {
      const result = validator.validateNoHardcodedSecrets();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('extractEnvironmentConfigs', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should extract environment configurations', () => {
      const configs = validator.extractEnvironmentConfigs();
      expect(configs).toHaveLength(3);
      expect(configs.map(c => c.environment)).toContain('development');
      expect(configs.map(c => c.environment)).toContain('staging');
      expect(configs.map(c => c.environment)).toContain('production');
    });

    it('should have correct instance types per environment', () => {
      const configs = validator.extractEnvironmentConfigs();
      const dev = configs.find(c => c.environment === 'development');
      const staging = configs.find(c => c.environment === 'staging');
      const prod = configs.find(c => c.environment === 'production');
      
      expect(dev?.instanceType).toBe('t3.micro');
      expect(staging?.instanceType).toBe('t3.small');
      expect(prod?.instanceType).toBe('t3.medium');
    });
  });

  describe('extractResources', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should extract all Terraform resources', () => {
      const resources = validator.extractResources();
      expect(resources.length).toBeGreaterThan(20);
      expect(resources.some(r => r.type === 'aws_vpc')).toBe(true);
      expect(resources.some(r => r.type === 'aws_subnet')).toBe(true);
      expect(resources.some(r => r.type === 'aws_security_group')).toBe(true);
    });
  });

  describe('validateAll', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate all requirements successfully', () => {
      const result = validator.validateAll();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('isDeletionProtectionDisabled', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should verify deletion protection is disabled for testing', () => {
      const isDisabled = validator.isDeletionProtectionDisabled();
      expect(isDisabled).toBe(true);
    });
  });

  describe('hasEnvironmentSuffix', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should verify environment suffix is configured', () => {
      const hasSuffix = validator.hasEnvironmentSuffix();
      expect(hasSuffix).toBe(true);
    });
  });

  describe('getResourceCountByType', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should count resources by type', () => {
      const counts = validator.getResourceCountByType();
      expect(counts.get('aws_security_group')).toBeGreaterThan(3);
      expect(counts.get('aws_subnet')).toBeGreaterThan(1);
      expect(counts.get('aws_vpc')).toBe(1);
    });
  });

  describe('validateProductionFeatures', () => {
    beforeEach(() => {
      validator.loadConfiguration();
    });

    it('should validate production-specific features', () => {
      const result = validator.validateProductionFeatures();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});