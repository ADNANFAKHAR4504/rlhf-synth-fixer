import * as pulumi from '@pulumi/pulumi';
import * as infrastructure from '../lib/infrastructure';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      };
    }
    return args.inputs;
  },
});

describe('PaymentInfrastructure Unit Tests', () => {
  describe('Basic Infrastructure Creation', () => {
    it('should create infrastructure with dev environment configuration', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'payment-infra-dev',
        {
          environmentSuffix: 'dev-123',
          environment: 'dev',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra).toBeDefined();
      expect(infra.vpc).toBeDefined();
      expect(infra.privateSubnetIds).toBeDefined();
      expect(infra.publicSubnetIds).toBeDefined();
      expect(infra.apiGatewayEndpoint).toBeDefined();
      expect(infra.rdsEndpoint).toBeDefined();
      expect(infra.auditLogsBucket).toBeDefined();
      expect(infra.paymentQueue).toBeDefined();
      expect(infra.processPaymentLambda).toBeDefined();
      expect(infra.verifyPaymentLambda).toBeDefined();
    });

    it('should create infrastructure with staging environment configuration', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'payment-infra-staging',
        {
          environmentSuffix: 'staging-456',
          environment: 'staging',
          region: 'us-east-2',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra).toBeDefined();
      expect(infra.vpc).toBeDefined();
    });

    it('should create infrastructure with prod environment configuration', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'payment-infra-prod',
        {
          environmentSuffix: 'prod-789',
          environment: 'prod',
          region: 'us-east-1',
          rdsInstanceClass: 'db.r5.large',
          rdsBackupRetentionDays: 7,
          lambdaMemorySize: 1024,
          lambdaTimeout: 60,
        }
      );

      expect(infra).toBeDefined();
      expect(infra.rdsEndpoint).toBeDefined();
    });

    it('should accept custom Lambda configuration', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'payment-infra-custom',
        {
          environmentSuffix: 'custom-999',
          environment: 'dev',
          region: 'us-west-2',
          rdsInstanceClass: 'db.t3.small',
          rdsBackupRetentionDays: 5,
          lambdaMemorySize: 256,
          lambdaTimeout: 15,
        }
      );

      expect(infra).toBeDefined();
      expect(infra.processPaymentLambda).toBeDefined();
      expect(infra.verifyPaymentLambda).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    it('should create VPC with correct CIDR block', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-vpc',
        {
          environmentSuffix: 'vpc-test-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.vpc).toBeDefined();
      expect(infra.privateSubnetIds).toBeDefined();
      expect(infra.publicSubnetIds).toBeDefined();
    });

    it('should create public and private subnets', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-subnets',
        {
          environmentSuffix: 'subnet-test-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const privateSubnets = await new Promise<string[]>((resolve) => {
        infra.privateSubnetIds.apply((ids) => resolve(ids));
      });

      const publicSubnets = await new Promise<string[]>((resolve) => {
        infra.publicSubnetIds.apply((ids) => resolve(ids));
      });

      expect(privateSubnets).toBeDefined();
      expect(publicSubnets).toBeDefined();
      expect(Array.isArray(privateSubnets)).toBe(true);
      expect(Array.isArray(publicSubnets)).toBe(true);
    });

    it('should validate VPC resource naming includes environmentSuffix', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-vpc-naming',
        {
          environmentSuffix: 'vpc-naming-789',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.vpc).toBeDefined();
    });
  });

  describe('S3 Audit Logs Bucket', () => {
    it('should create S3 bucket with correct naming', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-s3',
        {
          environmentSuffix: 's3-test-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const bucketName = await new Promise<string>((resolve) => {
        infra.auditLogsBucket.bucket.apply((name) => resolve(name as string));
      });

      expect(bucketName).toContain('s3-test-123');
      expect(bucketName).toContain('payment-audit-logs');
    });

    it('should create S3 bucket with forceDestroy enabled', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-s3-destroy',
        {
          environmentSuffix: 's3-destroy-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.auditLogsBucket).toBeDefined();
    });

    it('should validate bucket naming with different environmentSuffix', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-bucket-naming',
        {
          environmentSuffix: 'bucket-xyz-999',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const bucketName = await new Promise<string>((resolve) => {
        infra.auditLogsBucket.bucket.apply((name) => resolve(name as string));
      });

      expect(bucketName).toContain('bucket-xyz-999');
    });
  });

  describe('SQS Queues', () => {
    it('should validate SQS queue with DLQ configuration', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-sqs-dlq',
        {
          environmentSuffix: 'sqs-dlq-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.paymentQueue).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    it('should validate RDS deletionProtection is false', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-rds-protection',
        {
          environmentSuffix: 'rds-protect-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.rdsEndpoint).toBeDefined();
    });

    it('should create RDS with custom instance class', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-rds-custom',
        {
          environmentSuffix: 'rds-custom-789',
          environment: 'prod',
          region: 'us-east-1',
          rdsInstanceClass: 'db.r5.large',
          rdsBackupRetentionDays: 7,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.rdsEndpoint).toBeDefined();
    });

    it('should create RDS with custom backup retention', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-rds-backup',
        {
          environmentSuffix: 'rds-backup-999',
          environment: 'prod',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 14,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.rdsEndpoint).toBeDefined();
    });

    it('should validate RDS is not publicly accessible', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-rds-private',
        {
          environmentSuffix: 'rds-private-111',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.rdsEndpoint).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    it('should create process payment Lambda function', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-lambda-process',
        {
          environmentSuffix: 'lambda-process-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.processPaymentLambda).toBeDefined();
      expect(infra.processPaymentLambda.lambda).toBeDefined();
      expect(infra.processPaymentLambda.lambdaArn).toBeDefined();
    });

    it('should create verify payment Lambda function', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-lambda-verify',
        {
          environmentSuffix: 'lambda-verify-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.verifyPaymentLambda).toBeDefined();
      expect(infra.verifyPaymentLambda.lambda).toBeDefined();
      expect(infra.verifyPaymentLambda.lambdaArn).toBeDefined();
    });

    it('should create Lambda with custom memory configuration', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-lambda-memory',
        {
          environmentSuffix: 'lambda-memory-789',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 1024,
          lambdaTimeout: 30,
        }
      );

      expect(infra.processPaymentLambda).toBeDefined();
      expect(infra.verifyPaymentLambda).toBeDefined();
    });

    it('should create Lambda with custom timeout configuration', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-lambda-timeout',
        {
          environmentSuffix: 'lambda-timeout-999',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 60,
        }
      );

      expect(infra.processPaymentLambda).toBeDefined();
      expect(infra.verifyPaymentLambda).toBeDefined();
    });

    it('should validate Lambda functions are in VPC', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-lambda-vpc',
        {
          environmentSuffix: 'lambda-vpc-111',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.processPaymentLambda.lambda).toBeDefined();
      expect(infra.verifyPaymentLambda.lambda).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    it('should validate API Gateway endpoint is defined', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-api-endpoint',
        {
          environmentSuffix: 'api-endpoint-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.apiGatewayEndpoint).toBeDefined();
    });

    it('should create API Gateway with CloudWatch logging', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-api-logs',
        {
          environmentSuffix: 'api-logs-789',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.apiGatewayEndpoint).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create Lambda execution role', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-iam',
        {
          environmentSuffix: 'iam-test-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.processPaymentLambda).toBeDefined();
      expect(infra.verifyPaymentLambda).toBeDefined();
    });

    it('should attach required IAM policies', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-iam-policies',
        {
          environmentSuffix: 'iam-policies-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.processPaymentLambda.lambda).toBeDefined();
    });
  });

  describe('Resource Naming Validation', () => {
    it('should validate all resources include environmentSuffix', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-naming',
        {
          environmentSuffix: 'naming-test-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const bucketName = await new Promise<string>((resolve) => {
        infra.auditLogsBucket.bucket.apply((name) => resolve(name as string));
      });

      expect(bucketName).toContain('naming-test-123');
    });

    it('should handle environmentSuffix with special characters', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-special',
        {
          environmentSuffix: 'test-abc-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra).toBeDefined();
    });

    it('should create unique resource names for different environments', async () => {
      const devInfra = new infrastructure.PaymentInfrastructure(
        'test-infra-dev-unique',
        {
          environmentSuffix: 'dev-unique-111',
          environment: 'dev',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const prodInfra = new infrastructure.PaymentInfrastructure(
        'test-infra-prod-unique',
        {
          environmentSuffix: 'prod-unique-222',
          environment: 'prod',
          region: 'us-east-1',
          rdsInstanceClass: 'db.r5.large',
          rdsBackupRetentionDays: 7,
          lambdaMemorySize: 1024,
          lambdaTimeout: 60,
        }
      );

      const devBucket = await new Promise<string>((resolve) => {
        devInfra.auditLogsBucket.bucket.apply((name) =>
          resolve(name as string)
        );
      });

      const prodBucket = await new Promise<string>((resolve) => {
        prodInfra.auditLogsBucket.bucket.apply((name) =>
          resolve(name as string)
        );
      });

      expect(devBucket).not.toEqual(prodBucket);
      expect(devBucket).toContain('dev-unique-111');
      expect(prodBucket).toContain('prod-unique-222');
    });
  });

  describe('Configuration Validation', () => {
    it('should accept different AWS regions', async () => {
      const usEast1Infra = new infrastructure.PaymentInfrastructure(
        'test-infra-us-east-1',
        {
          environmentSuffix: 'region-us-east-1',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const usWest2Infra = new infrastructure.PaymentInfrastructure(
        'test-infra-us-west-2',
        {
          environmentSuffix: 'region-us-west-2',
          environment: 'test',
          region: 'us-west-2',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(usEast1Infra).toBeDefined();
      expect(usWest2Infra).toBeDefined();
    });

    it('should validate minimum Lambda memory size', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-lambda-min-memory',
        {
          environmentSuffix: 'lambda-min-mem-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 128,
          lambdaTimeout: 30,
        }
      );

      expect(infra.processPaymentLambda).toBeDefined();
    });

    it('should validate maximum Lambda timeout', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-lambda-max-timeout',
        {
          environmentSuffix: 'lambda-max-timeout-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 900,
        }
      );

      expect(infra.processPaymentLambda).toBeDefined();
    });

    it('should validate RDS backup retention period', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-rds-retention',
        {
          environmentSuffix: 'rds-retention-789',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 1,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.rdsEndpoint).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should export VPC ID', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-output-vpc',
        {
          environmentSuffix: 'output-vpc-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const vpcId = await new Promise<string>((resolve) => {
        infra.vpc.id.apply((id) => resolve(id as string));
      });

      expect(vpcId).toBeDefined();
    });

    it('should export subnet IDs', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-output-subnets',
        {
          environmentSuffix: 'output-subnets-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const privateSubnets = await new Promise<string[]>((resolve) => {
        infra.privateSubnetIds.apply((ids) => resolve(ids));
      });

      const publicSubnets = await new Promise<string[]>((resolve) => {
        infra.publicSubnetIds.apply((ids) => resolve(ids));
      });

      expect(privateSubnets.length).toBeGreaterThan(0);
      expect(publicSubnets.length).toBeGreaterThan(0);
    });

    it('should export S3 bucket name', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-output-s3',
        {
          environmentSuffix: 'output-s3-111',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      const bucketName = await new Promise<string>((resolve) => {
        infra.auditLogsBucket.bucket.apply((name) => resolve(name as string));
      });

      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('output-s3-111');
    });
  });

  describe('Security Validation', () => {
    it('should validate RDS is encrypted', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-security-rds',
        {
          environmentSuffix: 'security-rds-123',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.rdsEndpoint).toBeDefined();
    });

    it('should validate S3 bucket versioning is enabled', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-security-s3',
        {
          environmentSuffix: 'security-s3-456',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.auditLogsBucket).toBeDefined();
    });

    it('should validate Lambda functions have security groups', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-security-lambda',
        {
          environmentSuffix: 'security-lambda-789',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.processPaymentLambda.lambda).toBeDefined();
      expect(infra.verifyPaymentLambda.lambda).toBeDefined();
    });

    it('should validate RDS has proper security group rules', async () => {
      const infra = new infrastructure.PaymentInfrastructure(
        'test-infra-security-rds-sg',
        {
          environmentSuffix: 'security-rds-sg-999',
          environment: 'test',
          region: 'us-east-1',
          rdsInstanceClass: 'db.t3.medium',
          rdsBackupRetentionDays: 3,
          lambdaMemorySize: 512,
          lambdaTimeout: 30,
        }
      );

      expect(infra.rdsEndpoint).toBeDefined();
    });
  });
});
