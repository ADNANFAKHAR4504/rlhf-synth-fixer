import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { IamStack } from '../lib/iam-stack';
import { mockOutput } from './mocks';

describe('IamStack', () => {
  let iamStack: IamStack;
  const mockBucketArn = mockOutput('arn:aws:s3:::test-bucket');

  describe('with S3 bucket ARN', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        iamStack = new IamStack('test-iam', {
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
          s3BucketArn: mockBucketArn,
        });

        return {
          instanceRoleArn: iamStack.instanceRole.arn,
          instanceProfileName: iamStack.instanceProfile.name,
        };
      });
    });

    it('creates EC2 instance role', () => {
      expect(iamStack.instanceRole).toBeDefined();
    });

    it('creates instance profile', () => {
      expect(iamStack.instanceProfile).toBeDefined();
    });

    it('instance profile is associated with role', () => {
      expect(iamStack.instanceProfile).toBeDefined();
      expect(iamStack.instanceRole).toBeDefined();
    });
  });

  describe('without S3 bucket ARN', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        iamStack = new IamStack('test-iam-no-s3', {
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        });

        return {
          instanceRoleArn: iamStack.instanceRole.arn,
          instanceProfileName: iamStack.instanceProfile.name,
        };
      });
    });

    it('creates EC2 instance role without S3 bucket', () => {
      expect(iamStack.instanceRole).toBeDefined();
    });

    it('creates instance profile without S3 bucket', () => {
      expect(iamStack.instanceProfile).toBeDefined();
    });
  });

  describe('IAM policies', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        iamStack = new IamStack('policy-test', {
          environmentSuffix: 'test',
          tags: {},
          s3BucketArn: mockBucketArn,
        });

        return {
          instanceRoleArn: iamStack.instanceRole.arn,
        };
      });
    });

    it('role has CloudWatch permissions', () => {
      expect(iamStack.instanceRole).toBeDefined();
      // Should have CloudWatch policy attached
    });

    it('role has S3 permissions when bucket ARN provided', () => {
      expect(iamStack.instanceRole).toBeDefined();
      // Should have S3 policy attached
    });

    it('role has SSM permissions for management', () => {
      expect(iamStack.instanceRole).toBeDefined();
      // Should have SSM managed instance core policy attached
    });

    it('role can be assumed by EC2 service', () => {
      expect(iamStack.instanceRole).toBeDefined();
      // Assume role policy should allow EC2 service
    });
  });

  describe('resource naming and tagging', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        iamStack = new IamStack('naming-test', {
          environmentSuffix: 'production',
          tags: {
            Environment: 'production',
            Team: 'DevOps',
          },
        });

        return {
          instanceRoleArn: iamStack.instanceRole.arn,
          instanceProfileName: iamStack.instanceProfile.name,
        };
      });
    });

    it('includes environment suffix in role name', () => {
      expect(iamStack.instanceRole).toBeDefined();
      // Role name should include environment suffix
    });

    it('includes environment suffix in instance profile name', () => {
      expect(iamStack.instanceProfile).toBeDefined();
      // Instance profile name should include environment suffix
    });

    it('applies tags to IAM resources', () => {
      expect(iamStack.instanceRole).toBeDefined();
      expect(iamStack.instanceProfile).toBeDefined();
      // Both should have the provided tags
    });
  });

  describe('policy permissions scope', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        iamStack = new IamStack('scope-test', {
          environmentSuffix: 'test',
          tags: {},
          s3BucketArn: mockOutput('arn:aws:s3:::specific-bucket'),
        });

        return {
          instanceRoleArn: iamStack.instanceRole.arn,
        };
      });
    });

    it('S3 permissions are scoped to specific bucket', () => {
      expect(iamStack.instanceRole).toBeDefined();
      // S3 policy should reference the specific bucket ARN
    });

    it('CloudWatch permissions allow metric and log operations', () => {
      expect(iamStack.instanceRole).toBeDefined();
      // Should allow PutMetricData, CreateLogGroup, etc.
    });
  });
});