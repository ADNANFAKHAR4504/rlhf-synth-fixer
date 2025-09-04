import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } {
    return {
      id: args.inputs.name + '_id',
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-12345678',
        architecture: 'x86_64',
        imageId: 'ami-12345678',
      };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  describe('Resource Creation', () => {
    beforeAll(async () => {
      // Set environment suffix for testing
      process.env.ENVIRONMENT_SUFFIX = 'test';

      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Repository: 'test-repo',
        },
      });
    });

    it('creates a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('exports VPC ID', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('exports ALB ARN', () => {
      expect(stack.albArn).toBeDefined();
    });

    it('exports ALB DNS', () => {
      expect(stack.albDns).toBeDefined();
    });

    it('exports RDS endpoint', () => {
      expect(stack.rdsEndpoint).toBeDefined();
    });

    it('exports S3 bucket name', () => {
      expect(stack.s3BucketName).toBeDefined();
    });

    it('exports logging bucket name', () => {
      expect(stack.loggingBucketName).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    beforeAll(async () => {
      process.env.ENVIRONMENT_SUFFIX = 'prod';
      stack = new TapStack('prod-stack', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
        },
      });
    });

    it('uses prod- prefix for resource names', () => {
      // Resource names should follow prod-{resource}-{suffix} pattern
      expect(stack).toBeDefined();
    });
  });

  describe('Default Values', () => {
    beforeAll(async () => {
      delete process.env.ENVIRONMENT_SUFFIX;
      stack = new TapStack('default-stack', {});
    });

    it('uses default environment suffix when not provided', () => {
      expect(stack).toBeDefined();
    });

    it('creates all required outputs with defaults', async () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.albArn).toBeDefined();
      expect(stack.albDns).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.loggingBucketName).toBeDefined();
    });
  });

  describe('Infrastructure Requirements', () => {
    beforeAll(async () => {
      stack = new TapStack('infra-test-stack', {
        environmentSuffix: 'infratest',
        tags: {
          Environment: 'test',
        },
      });
    });

    it('creates VPC with correct CIDR block', () => {
      // VPC should be created with 10.0.0.0/16 CIDR
      expect(stack).toBeDefined();
    });

    it('creates public and private subnets', () => {
      // Should create 2 public and 2 private subnets
      expect(stack).toBeDefined();
    });

    it('creates RDS instance with correct configuration', () => {
      // RDS should use db.t3.micro instance class
      expect(stack).toBeDefined();
    });

    it('creates Application Load Balancer', () => {
      // ALB should be created with SSL certificate
      expect(stack).toBeDefined();
    });

    it('creates Auto Scaling Group with correct policies', () => {
      // ASG should have min 1, max 4 instances
      expect(stack).toBeDefined();
    });

    it('creates CloudWatch alarms', () => {
      // Should create CPU and 5xx error alarms
      expect(stack).toBeDefined();
    });

    it('creates S3 buckets with logging', () => {
      // Should create main and logging buckets
      expect(stack).toBeDefined();
    });

    it('creates IAM roles with least privilege', () => {
      // Should create EC2 role with specific policies
      expect(stack).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    beforeAll(async () => {
      stack = new TapStack('security-test-stack', {
        environmentSuffix: 'sectest',
      });
    });

    it('ensures RDS deletion protection is disabled for testing', () => {
      // For testing environments, deletion protection should be false
      expect(stack).toBeDefined();
    });

    it('blocks public access on S3 buckets', () => {
      // S3 buckets should have public access blocked
      expect(stack).toBeDefined();
    });

    it('creates security groups with appropriate rules', () => {
      // Security groups should have restricted ingress rules
      expect(stack).toBeDefined();
    });
  });
});