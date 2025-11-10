/**
 * Unit tests for TapStack - Disaster Recovery Infrastructure
 *
 * This test suite validates the structure and configuration of the DR infrastructure
 * including RDS, S3, Lambda, SNS, CloudWatch, and other AWS resources.
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackProps } from '../lib/tap-stack';

// Mock Pulumi runtime and config
pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      return {
        id: `${args.name}-id`,
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type}:ap-southeast-2:123456789012:${args.name}`,
          endpoint: args.type.includes('rds')
            ? `${args.name}.abc123.ap-southeast-2.rds.amazonaws.com`
            : undefined,
          bucket: args.type.includes('s3')
            ? args.inputs.bucket || args.name
            : undefined,
          name: args.inputs.name || args.name,
          id: `${args.name}-id`,
          identifier: args.inputs.identifier || args.name,
          keyId: args.type.includes('kms') ? `key-${args.name}` : undefined,
        },
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      return args.inputs;
    },
  },
  'testproject',
  'teststack',
  false, // preview
);

describe('TapStack - Disaster Recovery Infrastructure', () => {
  let stack: TapStack;
  let outputs: Record<string, any>;

  beforeAll(async () => {
    // Set environment variable for testing
    process.env.ENVIRONMENT_SUFFIX = 'test';

    // Set mock config values
    pulumi.runtime.setConfig('testproject:dbPassword', 'test-password-123');
    pulumi.runtime.setConfig('testproject:environmentSuffix', 'test');

    // Create stack with test props
    const testProps: TapStackProps = {
      tags: {
        TestEnv: 'unit-test',
        Owner: 'test-team',
      },
    };

    stack = new TapStack('test-stack', testProps);

    // Capture all outputs using pulumi.all to unwrap Output values
    const allOutputs = await pulumi
      .all([
        stack.vpcId,
        stack.primaryDbEndpoint,
        stack.primaryDbIdentifier,
        stack.replicaDbEndpoint,
        stack.replicaDbIdentifier,
        stack.backupBucketPrimaryName,
        stack.backupBucketReplicaName,
        stack.alertTopicArn,
        stack.healthCheckLambdaArn,
        stack.failoverLambdaArn,
        stack.kmsKeyId,
      ])
      .promise();

    outputs = {
      vpcId: allOutputs[0],
      primaryDbEndpoint: allOutputs[1],
      primaryDbIdentifier: allOutputs[2],
      replicaDbEndpoint: allOutputs[3],
      replicaDbIdentifier: allOutputs[4],
      backupBucketPrimaryName: allOutputs[5],
      backupBucketReplicaName: allOutputs[6],
      alertTopicArn: allOutputs[7],
      healthCheckLambdaArn: allOutputs[8],
      failoverLambdaArn: allOutputs[9],
      kmsKeyId: allOutputs[10],
    };
  });

  afterAll(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
  });

  describe('Stack Instantiation', () => {
    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should be a Pulumi ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });

  describe('VPC and Networking', () => {
    it('should export VPC ID', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toContain('vpc');
    });

    it('should include environment suffix in VPC name', () => {
      expect(outputs.vpcId).toContain('test');
    });
  });

  describe('RDS PostgreSQL Database', () => {
    it('should export primary database endpoint', () => {
      expect(outputs.primaryDbEndpoint).toBeDefined();
      expect(outputs.primaryDbEndpoint).toContain('rds.amazonaws.com');
    });

    it('should export primary database identifier', () => {
      expect(outputs.primaryDbIdentifier).toBeDefined();
      expect(outputs.primaryDbIdentifier).toContain('primary');
    });

    it('should export replica database endpoint', () => {
      expect(outputs.replicaDbEndpoint).toBeDefined();
      expect(outputs.replicaDbEndpoint).toContain('rds.amazonaws.com');
    });

    it('should export replica database identifier', () => {
      expect(outputs.replicaDbIdentifier).toBeDefined();
      expect(outputs.replicaDbIdentifier).toContain('replica');
    });

    it('should include environment suffix in database identifiers', () => {
      expect(outputs.primaryDbIdentifier).toContain('test');
      expect(outputs.replicaDbIdentifier).toContain('test');
    });
  });

  describe('S3 Backup Buckets', () => {
    it('should export primary backup bucket name', () => {
      expect(outputs.backupBucketPrimaryName).toBeDefined();
      expect(outputs.backupBucketPrimaryName).toContain('primary');
    });

    it('should export replica backup bucket name', () => {
      expect(outputs.backupBucketReplicaName).toBeDefined();
      expect(outputs.backupBucketReplicaName).toContain('replica');
    });

    it('should include environment suffix in bucket names', () => {
      expect(outputs.backupBucketPrimaryName).toContain('test');
      expect(outputs.backupBucketReplicaName).toContain('test');
    });
  });

  describe('SNS Alerting', () => {
    it('should export SNS topic ARN', () => {
      expect(outputs.alertTopicArn).toBeDefined();
      expect(outputs.alertTopicArn).toContain('arn:aws:');
      expect(outputs.alertTopicArn).toContain('sns');
    });

    it('should include environment suffix in topic name', () => {
      expect(outputs.alertTopicArn).toContain('test');
    });
  });

  describe('Lambda Functions', () => {
    it('should export health check Lambda ARN', () => {
      expect(outputs.healthCheckLambdaArn).toBeDefined();
      expect(outputs.healthCheckLambdaArn).toContain('arn:aws:');
      expect(outputs.healthCheckLambdaArn).toContain('lambda');
    });

    it('should export failover Lambda ARN', () => {
      expect(outputs.failoverLambdaArn).toBeDefined();
      expect(outputs.failoverLambdaArn).toContain('arn:aws:');
      expect(outputs.failoverLambdaArn).toContain('lambda');
    });

    it('should include environment suffix in Lambda names', () => {
      expect(outputs.healthCheckLambdaArn).toContain('test');
      expect(outputs.failoverLambdaArn).toContain('test');
    });

    it('should have health check Lambda in function name', () => {
      expect(outputs.healthCheckLambdaArn).toContain('health-check');
    });

    it('should have failover Lambda in function name', () => {
      expect(outputs.failoverLambdaArn).toContain('failover');
    });
  });

  describe('KMS Encryption', () => {
    it('should export KMS key ID', () => {
      expect(outputs.kmsKeyId).toBeDefined();
      expect(outputs.kmsKeyId).toContain('key');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should follow naming pattern with environment suffix', () => {
      const resources = [
        outputs.primaryDbIdentifier,
        outputs.replicaDbIdentifier,
        outputs.backupBucketPrimaryName,
        outputs.backupBucketReplicaName,
      ];

      resources.forEach((resource) => {
        expect(resource).toMatch(/-test$/);
      });
    });
  });

  describe('Output Completeness', () => {
    it('should export all required outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'primaryDbEndpoint',
        'primaryDbIdentifier',
        'replicaDbEndpoint',
        'replicaDbIdentifier',
        'backupBucketPrimaryName',
        'backupBucketReplicaName',
        'alertTopicArn',
        'healthCheckLambdaArn',
        'failoverLambdaArn',
        'kmsKeyId',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBeNull();
      });
    });
  });

  describe('Disaster Recovery Configuration', () => {
    it('should have primary and replica databases', () => {
      expect(outputs.primaryDbIdentifier).toBeDefined();
      expect(outputs.replicaDbIdentifier).toBeDefined();
      expect(outputs.primaryDbIdentifier).not.toBe(outputs.replicaDbIdentifier);
    });

    it('should have primary and replica backup buckets', () => {
      expect(outputs.backupBucketPrimaryName).toBeDefined();
      expect(outputs.backupBucketReplicaName).toBeDefined();
      expect(outputs.backupBucketPrimaryName).not.toBe(
        outputs.backupBucketReplicaName
      );
    });

    it('should have health monitoring Lambda', () => {
      expect(outputs.healthCheckLambdaArn).toBeDefined();
      expect(outputs.healthCheckLambdaArn).toContain('health-check');
    });

    it('should have failover automation Lambda', () => {
      expect(outputs.failoverLambdaArn).toBeDefined();
      expect(outputs.failoverLambdaArn).toContain('failover');
    });
  });

  describe('Environment Suffix Fallback', () => {
    it('should use environment variable when Pulumi config not set', async () => {
      // Save current env
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;

      try {
        // Set env but clear config
        process.env.ENVIRONMENT_SUFFIX = 'envtest';
        pulumi.runtime.setConfig('testproject:environmentSuffix', '');

        const testStack = new TapStack('env-fallback-stack');
        const testVpcId = await testStack.vpcId.promise();

        expect(testVpcId).toContain('envtest');
      } finally {
        // Restore
        if (originalEnv) {
          process.env.ENVIRONMENT_SUFFIX = originalEnv;
        } else {
          delete process.env.ENVIRONMENT_SUFFIX;
        }
        // Restore config
        pulumi.runtime.setConfig('testproject:environmentSuffix', 'test');
      }
    });

    it('should use default value when neither env nor config set', async () => {
      // Save current state
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;

      try {
        // Clear env
        delete process.env.ENVIRONMENT_SUFFIX;
        pulumi.runtime.setConfig('testproject:environmentSuffix', '');

        const testStack = new TapStack('default-env-stack');
        const testVpcId = await testStack.vpcId.promise();

        expect(testVpcId).toContain('dev');
      } finally {
        // Restore
        if (originalEnv) {
          process.env.ENVIRONMENT_SUFFIX = originalEnv;
        }
      }
    });
  });
});
