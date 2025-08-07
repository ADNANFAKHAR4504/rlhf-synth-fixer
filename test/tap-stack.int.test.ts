// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Highly Available VPC Infrastructure Integration Tests', () => {
  describe('CloudFormation Outputs Validation', () => {
    test('should have all required output values', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnetAId',
        'PublicSubnetBId', 
        'PrivateSubnetAId',
        'PrivateSubnetBId',
        'PublicSecurityGroupId',
        'PrivateSecurityGroupId',
        'EC2S3AccessRoleArn',
        'EC2S3AccessInstanceProfileArn',
        'InternetGatewayId',
        'NatGatewayAId',
        'NatGatewayBId'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('VPC ID should be valid AWS format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[0-9a-fA-F]{17}$/);
    });

    test('Subnet IDs should be valid AWS format', () => {
      const subnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId
      ];

      subnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[0-9a-fA-F]{17}$/);
      });
    });

    test('Security Group IDs should be valid AWS format', () => {
      const securityGroupIds = [
        outputs.PublicSecurityGroupId,
        outputs.PrivateSecurityGroupId
      ];

      securityGroupIds.forEach(sgId => {
        expect(sgId).toMatch(/^sg-[0-9a-fA-F]{17}$/);
      });
    });

    test('IAM Role ARN should be valid format', () => {
      expect(outputs.EC2S3AccessRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
    });

    test('Instance Profile ARN should be valid format', () => {
      expect(outputs.EC2S3AccessInstanceProfileArn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\/.+$/);
    });

    test('Internet Gateway ID should be valid AWS format', () => {
      expect(outputs.InternetGatewayId).toMatch(/^igw-[0-9a-fA-F]{17}$/);
    });

    test('NAT Gateway IDs should be valid AWS format', () => {
      const natGatewayIds = [outputs.NatGatewayAId, outputs.NatGatewayBId];
      
      natGatewayIds.forEach(natId => {
        expect(natId).toMatch(/^nat-[0-9a-fA-F]{17}$/);
      });
    });
  });

  describe('Infrastructure Naming and Tagging', () => {
    test('resources should follow naming conventions', () => {
      // Check that resource names contain expected prefixes
      expect(outputs.EC2S3AccessRoleArn).toContain('EC2S3AccessRole');
      expect(outputs.EC2S3AccessInstanceProfileArn).toContain('EC2S3AccessInstanceProfile');
    });
  });

  describe('High Availability Validation', () => {
    test('should have multiple subnets for high availability', () => {
      // Ensure we have at least 2 public and 2 private subnets
      expect(outputs.PublicSubnetAId).not.toBe(outputs.PublicSubnetBId);
      expect(outputs.PrivateSubnetAId).not.toBe(outputs.PrivateSubnetBId);
    });

    test('should have multiple NAT Gateways for high availability', () => {
      // Ensure we have 2 different NAT Gateways
      expect(outputs.NatGatewayAId).not.toBe(outputs.NatGatewayBId);
    });

    test('should have separate security groups for public and private resources', () => {
      // Ensure public and private security groups are different
      expect(outputs.PublicSecurityGroupId).not.toBe(outputs.PrivateSecurityGroupId);
    });
  });

  describe('Template Configuration Validation', () => {
    test('environment suffix should be properly configured', () => {
      // The environment suffix should be either 'dev' or the one set in CI/CD
      expect(['dev', 'pr661', 'staging', 'prod']).toContain(environmentSuffix);
    });

    test('outputs structure should match CloudFormation template requirements', () => {
      // Verify all outputs from template are present
      const outputCount = Object.keys(outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(12);
    });
  });
});
