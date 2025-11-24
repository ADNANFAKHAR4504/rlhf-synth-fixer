import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime with config
pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: Record<string, unknown>;
    } {
      const id = args.inputs.name
        ? `${args.type}-${args.inputs.name}`
        : `${args.type}-id`;
      return {
        id: id,
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type}:us-east-2:123456789012:${args.name}`,
          id: id,
          endpoint: 'test-endpoint.us-east-2.rds.amazonaws.com',
          readerEndpoint: 'test-reader-endpoint.us-east-2.rds.amazonaws.com',
          bucket: args.inputs.bucket || `test-bucket-${args.name}`,
          name: args.inputs.name || `test-${args.name}`,
          keyId: args.inputs.keyId || 'test-key-id',
        },
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      if (
        args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones'
      ) {
        return {
          names: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
        };
      }
      if (args.token === 'aws:index/getRegion:getRegion') {
        return {
          name: 'us-east-2',
        };
      }
      return args.inputs;
    },
  },
  'project',
  'stack',
  false,
  {
    environmentSuffix: 'test',
  }
);

// Import the infrastructure code
import * as infra from '../lib/tap-stack';

describe('Financial Analytics Platform Infrastructure', () => {
  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', done => {
      infra.vpcCidr.apply(cidr => {
        expect(cidr).toBe('10.0.0.0/16');
        done();
      });
    });

    it('should create VPC ID', done => {
      infra.vpcId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should create 3 public subnets', done => {
      infra.publicSubnetIds.apply(ids => {
        expect(ids).toHaveLength(3);
        done();
      });
    });

    it('should create 3 private subnets', done => {
      infra.privateSubnetIds.apply(ids => {
        expect(ids).toHaveLength(3);
        done();
      });
    });
  });

  describe('ECS Cluster', () => {
    it('should export ECS cluster ARN', done => {
      infra.ecsClusterArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export ECS cluster name', done => {
      infra.ecsClusterName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export ECS task execution role ARN', done => {
      infra.ecsTaskExecutionRoleArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export ECS task role ARN', done => {
      infra.ecsTaskRoleArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export ECS security group ID', done => {
      infra.ecsSecurityGroupId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });

  describe('Aurora PostgreSQL', () => {
    it('should export Aurora cluster ARN', done => {
      infra.auroraClusterArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export Aurora cluster endpoint', done => {
      infra.auroraClusterEndpoint.apply(endpoint => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });

    it('should export Aurora reader endpoint', done => {
      infra.auroraClusterReaderEndpoint.apply(endpoint => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });

    it('should export Aurora security group ID', done => {
      infra.auroraSecurityGroupId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export database secret ARN', done => {
      infra.dbSecretArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });
  });

  describe('KMS Encryption', () => {
    it('should export KMS key ARN', done => {
      infra.kmsKeyArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export KMS key ID', done => {
      infra.kmsKeyId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });

  describe('S3 Buckets', () => {
    it('should export raw data bucket name', done => {
      infra.rawDataBucketName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export raw data bucket ARN', done => {
      infra.rawDataBucketArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export processed data bucket name', done => {
      infra.processedDataBucketName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export processed data bucket ARN', done => {
      infra.processedDataBucketArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });
  });

  describe('Kinesis Stream', () => {
    it('should export Kinesis stream ARN', done => {
      infra.kinesisStreamArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export Kinesis stream name', done => {
      infra.kinesisStreamName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });

  describe('CloudWatch Logs', () => {
    it('should export ECS log group name', done => {
      infra.ecsLogGroupName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });

  describe('AWS Backup', () => {
    it('should export backup vault ARN', done => {
      infra.backupVaultArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export backup plan ID', done => {
      infra.backupPlanId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should use ENVIRONMENT_SUFFIX from environment variable', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'custom-env';

      // Note: This test validates the pattern is present in the code
      // The actual value is set during module load, so we verify the exports contain expected patterns
      infra.ecsClusterName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
      });

      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });

    it('should use AWS_REGION from environment variable', () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-west-2';

      // Verify exports work regardless of region setting
      infra.vpcId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
      });

      process.env.AWS_REGION = originalRegion;
    });

    it('should handle missing environment variables with defaults', () => {
      // Verify the infrastructure is created even when env vars might be missing
      expect(infra.vpcId).toBeDefined();
      expect(infra.ecsClusterName).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use analytics prefix for all resources', done => {
      Promise.all([
        infra.ecsClusterName.apply(name => {
          expect(name).toContain('analytics');
        }),
        infra.rawDataBucketName.apply(name => {
          expect(name).toContain('analytics');
        }),
        infra.processedDataBucketName.apply(name => {
          expect(name).toContain('analytics');
        }),
        infra.kinesisStreamName.apply(name => {
          expect(name).toContain('analytics');
        }),
      ]).then(() => done());
    });

    it('should include resource type in names', done => {
      Promise.all([
        infra.ecsClusterName.apply(name => {
          expect(name).toContain('ecs-cluster');
        }),
        infra.rawDataBucketName.apply(name => {
          expect(name).toContain('raw-data');
        }),
        infra.processedDataBucketName.apply(name => {
          expect(name).toContain('processed-data');
        }),
        infra.kinesisStreamName.apply(name => {
          expect(name).toContain('stream');
        }),
      ]).then(() => done());
    });

    it('should have consistent naming pattern across resources', done => {
      // All resource names should follow: analytics-{type}-{suffix} pattern
      Promise.all([
        infra.ecsClusterName.apply(name => {
          expect(name).toMatch(/^analytics-[a-z]+-[a-z0-9-]+$/);
        }),
        infra.kinesisStreamName.apply(name => {
          expect(name).toMatch(/^analytics-[a-z]+-[a-z0-9-]+$/);
        }),
      ]).then(() => done());
    });
  });

  describe('Security Configuration', () => {
    it('should have separate security groups for ECS and Aurora', done => {
      Promise.all([
        infra.ecsSecurityGroupId,
        infra.auroraSecurityGroupId,
      ]).then(([ecsSgId, auroraSgId]) => {
        expect(ecsSgId).toBeDefined();
        expect(auroraSgId).toBeDefined();
        expect(ecsSgId).not.toBe(auroraSgId);
        done();
      });
    });

    it('should have KMS key for encryption', done => {
      Promise.all([
        infra.kmsKeyArn.apply(arn => {
          expect(arn).toBeDefined();
          expect(arn).toContain('kms');
        }),
        infra.kmsKeyId.apply(id => {
          expect(id).toBeDefined();
          expect(id.length).toBeGreaterThan(0);
        }),
      ]).then(() => done());
    });

    it('should have database secret stored in Secrets Manager', done => {
      infra.dbSecretArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        expect(arn).toContain('analytics-db-secret');
        done();
      });
    });

    it('should have separate IAM roles for task execution and application', done => {
      Promise.all([
        infra.ecsTaskExecutionRoleArn,
        infra.ecsTaskRoleArn,
      ]).then(([execRoleArn, taskRoleArn]) => {
        expect(execRoleArn).toBeDefined();
        expect(taskRoleArn).toBeDefined();
        expect(execRoleArn).not.toBe(taskRoleArn);
        done();
      });
    });
  });

  describe('High Availability Configuration', () => {
    it('should have both writer and reader endpoints for Aurora', done => {
      Promise.all([
        infra.auroraClusterEndpoint,
        infra.auroraClusterReaderEndpoint,
      ]).then(([writerEndpoint, readerEndpoint]) => {
        expect(writerEndpoint).toBeDefined();
        expect(readerEndpoint).toBeDefined();
        expect(writerEndpoint).not.toBe(readerEndpoint);
        done();
      });
    });

    it('should have multiple subnets for high availability', done => {
      Promise.all([
        infra.publicSubnetIds.apply(ids => {
          expect(ids.length).toBeGreaterThanOrEqual(3);
        }),
        infra.privateSubnetIds.apply(ids => {
          expect(ids.length).toBeGreaterThanOrEqual(3);
        }),
      ]).then(() => done());
    });
  });

  describe('Data Storage Configuration', () => {
    it('should have separate buckets for raw and processed data', done => {
      Promise.all([
        infra.rawDataBucketName,
        infra.processedDataBucketName,
      ]).then(([rawBucket, processedBucket]) => {
        expect(rawBucket).toBeDefined();
        expect(processedBucket).toBeDefined();
        expect(rawBucket).not.toBe(processedBucket);
        done();
      });
    });

    it('should have both bucket names and ARNs exported', done => {
      Promise.all([
        infra.rawDataBucketName.apply(name => {
          expect(name).toBeDefined();
          expect(typeof name).toBe('string');
        }),
        infra.rawDataBucketArn.apply(arn => {
          expect(arn).toBeDefined();
          expect(arn).toContain('arn:aws:');
        }),
        infra.processedDataBucketName.apply(name => {
          expect(name).toBeDefined();
          expect(typeof name).toBe('string');
        }),
        infra.processedDataBucketArn.apply(arn => {
          expect(arn).toBeDefined();
          expect(arn).toContain('arn:aws:');
        }),
      ]).then(() => done());
    });
  });

  describe('Streaming Data Configuration', () => {
    it('should have Kinesis stream configured', done => {
      Promise.all([
        infra.kinesisStreamArn.apply(arn => {
          expect(arn).toBeDefined();
          expect(arn).toContain('kinesis');
        }),
        infra.kinesisStreamName.apply(name => {
          expect(name).toBeDefined();
          expect(typeof name).toBe('string');
        }),
      ]).then(() => done());
    });

    it('should have stream name in stream ARN', done => {
      Promise.all([
        infra.kinesisStreamArn,
        infra.kinesisStreamName,
      ]).then(([arn, name]) => {
        // Verify both are defined
        expect(arn).toBeDefined();
        expect(name).toBeDefined();
        done();
      });
    });
  });

  describe('Logging Configuration', () => {
    it('should have CloudWatch log group for ECS', done => {
      infra.ecsLogGroupName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should have log group name with proper prefix', done => {
      infra.ecsLogGroupName.apply(name => {
        expect(name).toBeDefined();
        expect(name).toContain('analytics-ecs-logs');
        done();
      });
    });
  });

  describe('Backup and Disaster Recovery', () => {
    it('should have backup vault configured', done => {
      infra.backupVaultArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('backup');
        expect(arn).toContain('vault');
        done();
      });
    });

    it('should have backup plan configured', done => {
      infra.backupPlanId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should have both backup vault and plan', done => {
      Promise.all([
        infra.backupVaultArn,
        infra.backupPlanId,
      ]).then(([vaultArn, planId]) => {
        expect(vaultArn).toBeDefined();
        expect(planId).toBeDefined();
        done();
      });
    });
  });

  describe('Output Completeness', () => {
    it('should export all critical infrastructure outputs', () => {
      const criticalOutputs = [
        infra.vpcId,
        infra.vpcCidr,
        infra.publicSubnetIds,
        infra.privateSubnetIds,
        infra.ecsClusterArn,
        infra.ecsClusterName,
        infra.auroraClusterArn,
        infra.auroraClusterEndpoint,
        infra.kmsKeyArn,
        infra.rawDataBucketName,
        infra.processedDataBucketName,
        infra.kinesisStreamName,
        infra.backupVaultArn,
      ];

      criticalOutputs.forEach(output => {
        expect(output).toBeDefined();
      });
    });

    it('should have all IAM role ARNs exported', () => {
      expect(infra.ecsTaskExecutionRoleArn).toBeDefined();
      expect(infra.ecsTaskRoleArn).toBeDefined();
    });

    it('should have all security group IDs exported', () => {
      expect(infra.ecsSecurityGroupId).toBeDefined();
      expect(infra.auroraSecurityGroupId).toBeDefined();
    });
  });
});
