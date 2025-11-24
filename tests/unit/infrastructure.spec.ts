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
import * as infra from '../../index';

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
});
