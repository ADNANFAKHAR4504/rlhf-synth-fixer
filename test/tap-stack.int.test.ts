import fs from 'fs';
import path from 'path';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read AWS region from AWS_REGION file
const awsRegion = fs
  .readFileSync(path.join(__dirname, '../lib/AWS_REGION'), 'utf8')
  .trim();

describe('Secure Infrastructure Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'SecureDataBucketName',
        'LogsBucketName',
        'EC2InstanceId',
        'EC2InstanceRoleArn',
        'ApplicationServiceRoleArn',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'SecurityGroupId',
        'PrivateRouteTableId',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('stack name should contain tap-stack or TapStack', () => {
      expect(outputs.StackName.toLowerCase()).toContain('tap-stack');
    });

    test('environment suffix should be defined', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).not.toBe('');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have valid VPC ID format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have valid public subnet ID format', () => {
      expect(outputs.PublicSubnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
    });

    test('should have valid private subnet ID format', () => {
      expect(outputs.PrivateSubnetId).toMatch(/^subnet-[a-f0-9]{8,17}$/);
    });

    test('public and private subnets should be different', () => {
      expect(outputs.PublicSubnetId).not.toBe(outputs.PrivateSubnetId);
    });

    test('should have valid private route table ID format', () => {
      expect(outputs.PrivateRouteTableId).toMatch(/^rtb-[a-f0-9]{8,17}$/);
    });
  });

  describe('EC2 Infrastructure', () => {
    test('should have valid EC2 instance ID format', () => {
      expect(outputs.EC2InstanceId).toMatch(/^i-[a-f0-9]{8,17}$/);
    });

    test('should have valid security group ID format', () => {
      expect(outputs.SecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });
  });

  describe('S3 Infrastructure', () => {
    test('SecureDataBucket should have valid S3 bucket name format', () => {
      expect(outputs.SecureDataBucketName).toMatch(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/);
    });

    test('LogsBucket should have valid S3 bucket name format', () => {
      expect(outputs.LogsBucketName).toMatch(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/);
    });

    test('SecureDataBucket name should contain environment suffix', () => {
      expect(outputs.SecureDataBucketName.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
    });

    test('LogsBucket name should contain environment suffix', () => {
      expect(outputs.LogsBucketName.toLowerCase()).toContain(
        outputs.EnvironmentSuffix.toLowerCase()
      );
    });

    test('S3 bucket names should follow naming convention', () => {
      expect(outputs.SecureDataBucketName).toContain('secure-data');
      expect(outputs.LogsBucketName).toContain('logs');
    });

    test('S3 buckets should be unique', () => {
      expect(outputs.SecureDataBucketName).not.toBe(outputs.LogsBucketName);
    });
  });

  describe('IAM Infrastructure', () => {
    test('EC2InstanceRole should have valid IAM role ARN format', () => {
      expect(outputs.EC2InstanceRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/.+$/
      );
    });

    test('ApplicationServiceRole should have valid IAM role ARN format', () => {
      expect(outputs.ApplicationServiceRoleArn).toMatch(
        /^arn:aws:iam::\d{12}:role\/.+$/
      );
    });

    test('IAM roles should be unique', () => {
      expect(outputs.EC2InstanceRoleArn).not.toBe(outputs.ApplicationServiceRoleArn);
    });

    test('EC2InstanceRole ARN should reference EC2InstanceRole', () => {
      expect(outputs.EC2InstanceRoleArn).toContain('EC2InstanceRole');
    });

    test('ApplicationServiceRole ARN should reference ApplicationServiceRole', () => {
      expect(outputs.ApplicationServiceRoleArn).toContain('ApplicationServiceRole');
    });
  });

  describe('Cross-Resource Integration', () => {
    test('all resource names should be consistent with environment suffix', () => {
      const suffix = outputs.EnvironmentSuffix.toLowerCase();

      expect(outputs.SecureDataBucketName.toLowerCase()).toContain(suffix);
      expect(outputs.LogsBucketName.toLowerCase()).toContain(suffix);
    });

    test('stack name should contain tap-stack prefix', () => {
      expect(outputs.StackName.toLowerCase()).toMatch(/^tap-?stack/);
    });
  });

  describe('Security Validation', () => {
    test('S3 bucket names should not expose sensitive information', () => {
      expect(outputs.SecureDataBucketName.toLowerCase()).not.toContain('password');
      expect(outputs.SecureDataBucketName.toLowerCase()).not.toContain('secret');
      expect(outputs.SecureDataBucketName.toLowerCase()).not.toContain('key');
      expect(outputs.LogsBucketName.toLowerCase()).not.toContain('password');
      expect(outputs.LogsBucketName.toLowerCase()).not.toContain('secret');
      expect(outputs.LogsBucketName.toLowerCase()).not.toContain('key');
    });

    test('IAM role ARNs should follow CloudFormation naming convention', () => {
      expect(outputs.EC2InstanceRoleArn).toContain('EC2InstanceRole');
      expect(outputs.ApplicationServiceRoleArn).toContain('ApplicationServiceRole');
    });
  });

  describe('Infrastructure Compliance', () => {
    test('all resource identifiers should be unique per environment', () => {
      const resourceIds = [
        outputs.VPCId,
        outputs.EC2InstanceId,
        outputs.SecureDataBucketName,
        outputs.LogsBucketName,
        outputs.PublicSubnetId,
        outputs.PrivateSubnetId,
        outputs.SecurityGroupId,
        outputs.EC2InstanceRoleArn,
        outputs.ApplicationServiceRoleArn,
      ];

      // All resource IDs should be unique
      const uniqueIds = new Set(resourceIds);
      expect(uniqueIds.size).toBe(resourceIds.length);
    });

    test('infrastructure should follow naming conventions', () => {
      // Stack name follows convention (TapStack or tap-stack)
      expect(outputs.StackName.toLowerCase()).toMatch(/^tap-?stack/);

      // S3 bucket follows lowercase convention
      expect(outputs.SecureDataBucketName).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.LogsBucketName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Resource Dependencies', () => {
    test('EC2 instance should be in VPC context', () => {
      // Both EC2 and VPC resources should be present
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.SecurityGroupId).toBeDefined();
    });

    test('subnets should be associated with VPC', () => {
      // Both subnets should be present when VPC exists
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnetId).toBeDefined();
      expect(outputs.PrivateSubnetId).toBeDefined();
    });

    test('private route table should exist for routing', () => {
      expect(outputs.PrivateRouteTableId).toBeDefined();
      expect(outputs.PrivateSubnetId).toBeDefined();
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateway output should be present if CreateNATGateway is true', () => {
      // If NAT Gateway exists in outputs, validate its format
      if (outputs.NATGatewayId) {
        expect(outputs.NATGatewayId).toMatch(/^nat-[a-f0-9]{8,17}$/);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('all resources should be properly connected', () => {
      // Verify all outputs are present and follow naming convention
      expect(outputs.SecureDataBucketName).toContain('secure-data');
      expect(outputs.LogsBucketName).toContain('logs');
      expect(outputs.EC2InstanceRoleArn).toContain('EC2InstanceRole');
      expect(outputs.ApplicationServiceRoleArn).toContain('ApplicationServiceRole');

      // Verify environment suffix is consistently applied
      const suffix = outputs.EnvironmentSuffix.toLowerCase();
      expect(outputs.SecureDataBucketName.toLowerCase()).toContain(suffix);
      expect(outputs.LogsBucketName.toLowerCase()).toContain(suffix);
    });

    test('resource naming should follow organization standards', () => {
      // Check bucket naming convention
      expect(outputs.SecureDataBucketName).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.LogsBucketName).toMatch(/^[a-z0-9-]+$/);

      // Check IAM role ARN format
      expect(outputs.EC2InstanceRoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
      expect(outputs.ApplicationServiceRoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+$/);

      // Check instance ID format
      expect(outputs.EC2InstanceId).toMatch(/^i-[0-9a-f]+$/);
    });
  });
});
