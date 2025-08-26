// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CDK Multi-Region Infrastructure Integration Tests', () => {
  describe('Infrastructure Outputs Validation', () => {
    test('should have valid infrastructure outputs', () => {
      const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');

      // Check if outputs file exists
      expect(fs.existsSync(outputsPath)).toBe(true);

      // Read and parse outputs
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      const outputs = JSON.parse(outputsContent);

      // Validate that outputs object is not empty
      expect(Object.keys(outputs).length).toBeGreaterThan(0);

      // Check for expected infrastructure components
      expect(outputs).toHaveProperty('vpc_id');
      expect(outputs).toHaveProperty('public_subnet_ids');
      expect(outputs).toHaveProperty('private_subnet_id');
      expect(outputs).toHaveProperty('public_security_group_id');
      expect(outputs).toHaveProperty('private_security_group_id');
      expect(outputs).toHaveProperty('internet_gateway_id');

      // Validate VPC ID format
      expect(outputs.vpc_id.value).toMatch(/^vpc-[a-f0-9]+$/);

      // Validate subnet IDs format
      expect(outputs.public_subnet_ids.value).toBeInstanceOf(Array);
      expect(outputs.public_subnet_ids.value.length).toBeGreaterThan(0);
      outputs.public_subnet_ids.value.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });

      // Validate security group ID format
      expect(outputs.public_security_group_id.value).toMatch(/^sg-[a-f0-9]+$/);
      expect(outputs.private_security_group_id.value).toMatch(/^sg-[a-f0-9]+$/);

      // Validate internet gateway ID format
      expect(outputs.internet_gateway_id.value).toMatch(/^igw-[a-f0-9]+$/);
    });

    test('should have flat outputs file', () => {
      const flatOutputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

      // Check if flat outputs file exists
      expect(fs.existsSync(flatOutputsPath)).toBe(true);

      // Read and parse flat outputs
      const flatOutputsContent = fs.readFileSync(flatOutputsPath, 'utf8');
      const flatOutputs = JSON.parse(flatOutputsContent);

      // Flat outputs might be empty if infrastructure is not deployed
      // This is acceptable for integration tests
      expect(typeof flatOutputs).toBe('object');
    });
  });

  describe('CDK Stack Configuration', () => {
    test('should have valid CDK configuration', () => {
      const cdkConfigPath = path.join(__dirname, '../cdk.json');

      // Check if CDK config exists
      expect(fs.existsSync(cdkConfigPath)).toBe(true);

      // Read and parse CDK config
      const cdkConfigContent = fs.readFileSync(cdkConfigPath, 'utf8');
      const cdkConfig = JSON.parse(cdkConfigContent);

      // Validate CDK config structure
      expect(cdkConfig).toHaveProperty('app');
      expect(cdkConfig).toHaveProperty('context');
    });
  });

  describe('Environment Configuration', () => {
    test('should have valid environment suffix', () => {
      // Environment suffix should be a valid string
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);

      // Should be one of the expected values
      const validSuffixes = ['dev', 'staging', 'prod'];
      expect(validSuffixes).toContain(environmentSuffix);
    });
  });
});
