import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { FinTechTradingStack } from '../lib/main';

describe('FinTechTradingStack Unit Tests', () => {
  let app: App;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    app = Testing.app();
    originalEnv = { ...process.env };
    delete process.env.TERRAFORM_STATE_BUCKET;
    delete process.env.TERRAFORM_STATE_BUCKET_REGION;
    delete process.env.TERRAFORM_STATE_BUCKET_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Stack Initialization', () => {
    test('should create stack with default configuration', () => {
      expect(() => {
        new FinTechTradingStack(app, 'test-stack', {
          environmentSuffix: 'test',
          region: 'ca-central-1',
          vpcCidr: '10.0.0.0/16',
          dbUsername: 'testadmin',
          enableMutualTls: true,
        });
      }).not.toThrow();
    });

    test('should synthesize successfully', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(0);
    });

    test('should use environment suffix in resource naming', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'prod',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'prodadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('prod');
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create all required KMS keys', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('rds-kms-key');
      expect(synthesized).toContain('efs-kms-key');
      expect(synthesized).toContain('secrets-kms-key');
      expect(synthesized).toContain('kinesis-kms-key');
    });

    test('should enable key rotation for all KMS keys', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);

      // Verify key rotation is enabled
      expect(synthesized).toContain('enable_key_rotation');
      expect(synthesized).toContain('true');
    });

    test('should create KMS aliases for each key', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('alias/rds-key');
      expect(synthesized).toContain('alias/efs-key');
      expect(synthesized).toContain('alias/secrets-key');
      expect(synthesized).toContain('alias/kinesis-key');
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.0.0.0/16');
    });

    test('should enable DNS hostnames and support', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('enable_dns_hostnames');
      expect(synthesized).toContain('enable_dns_support');
    });

    test('should create public subnets', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.0.1.0/24');
      expect(synthesized).toContain('10.0.2.0/24');
      expect(synthesized).toContain('public-subnet');
    });

    test('should create private subnets', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('10.0.11.0/24');
      expect(synthesized).toContain('10.0.12.0/24');
      expect(synthesized).toContain('10.0.13.0/24');
      expect(synthesized).toContain('private-subnet');
    });

    test('should create internet gateway', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_internet_gateway');
    });

    test('should create route tables', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_route_table');
      expect(synthesized).toContain('route-table');
    });
  });

  describe('Security Group Configuration', () => {
    test('should create RDS security group', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('rds-sg');
      expect(synthesized).toContain('5432');
    });

    test('should create ElastiCache security group', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('elasticache-sg');
      expect(synthesized).toContain('6379');
    });

    test('should create EFS security group', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('efs-sg');
      expect(synthesized).toContain('2049');
    });
  });

  describe('RDS Aurora Configuration', () => {
    test('should create RDS Aurora cluster', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_rds_cluster');
      expect(synthesized).toContain('aurora-postgresql');
    });

    test('should enable storage encryption for RDS', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('storage_encrypted');
    });

    test('should configure backup retention', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('backup_retention_period');
    });

    test('should create RDS cluster instances', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_rds_cluster_instance');
      expect(synthesized).toContain('aurora-instance-1');
      expect(synthesized).toContain('aurora-instance-2');
    });
  });

  describe('ElastiCache Configuration', () => {
    test('should create ElastiCache Redis replication group', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_elasticache_replication_group');
      expect(synthesized).toContain('redis');
    });

    test('should enable encryption for ElastiCache', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('at_rest_encryption_enabled');
      expect(synthesized).toContain('transit_encryption_enabled');
    });
  });

  describe('EFS Configuration', () => {
    test('should create EFS file system', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_efs_file_system');
      expect(synthesized).toContain('encrypted');
    });

    test('should create EFS mount targets', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_efs_mount_target');
      expect(synthesized).toContain('efs-mount');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should create Secrets Manager secret', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_secretsmanager_secret');
      expect(synthesized).toContain('trading-db-credentials');
    });

    test('should configure secret rotation', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_secretsmanager_secret_rotation');
    });
  });

  describe('Kinesis Configuration', () => {
    test('should create Kinesis data stream', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_kinesis_stream');
      expect(synthesized).toContain('trading-transactions');
    });

    test('should configure encryption for Kinesis', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('encryption_type');
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create API Gateway', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_apigatewayv2_api');
      expect(synthesized).toContain('trading-api');
    });

    test('should create API Gateway stage', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_apigatewayv2_stage');
    });
  });

  describe('Lambda Configuration', () => {
    test('should create Lambda function for rotation', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_lambda_function');
      expect(synthesized).toContain('rotation-lambda');
    });

    test('should create IAM role for Lambda', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('rotation-lambda-role');
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch log group', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_cloudwatch_log_group');
    });

    test('should create CloudWatch alarms', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
      expect(synthesized).toContain('cpu-alarm');
    });
  });

  describe('Terraform Outputs', () => {
    test('should create required outputs', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('vpc-id');
      expect(synthesized).toContain('rds-cluster-endpoint');
      expect(synthesized).toContain('elasticache-endpoint');
      expect(synthesized).toContain('efs-id');
      expect(synthesized).toContain('kinesis-stream-name');
      expect(synthesized).toContain('api-gateway-url');
    });
  });

  describe('High Availability', () => {
    test('should deploy across multiple availability zones', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('data.aws_availability_zones');
    });

    test('should create multiple instances for redundancy', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('aurora-instance-1');
      expect(synthesized).toContain('aurora-instance-2');
    });
  });

  describe('Security Best Practices', () => {
    test('should enable encryption for data stores', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('encrypted');
      expect(synthesized).toContain('kms_key_id');
    });

    test('should enable key rotation', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('enable_key_rotation');
    });

    test('should place sensitive resources in private subnets', () => {
      const stack = new FinTechTradingStack(app, 'test-stack', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('private-subnet');
    });
  });

  describe('Configuration Validation', () => {
    test('should accept different AWS regions', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

      regions.forEach(region => {
        expect(() => {
          new FinTechTradingStack(app, `test-stack-${region}`, {
            environmentSuffix: 'test',
            region: region,
            vpcCidr: '10.0.0.0/16',
            dbUsername: 'testadmin',
            enableMutualTls: true,
          });
        }).not.toThrow();
      });
    });

    test('should accept different environment suffixes', () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach(env => {
        expect(() => {
          new FinTechTradingStack(app, `test-stack-${env}`, {
            environmentSuffix: env,
            region: 'ca-central-1',
            vpcCidr: '10.0.0.0/16',
            dbUsername: 'testadmin',
            enableMutualTls: true,
          });
        }).not.toThrow();
      });
    });

    test('should handle custom Terraform state configuration', () => {
      process.env.TERRAFORM_STATE_BUCKET = 'test-bucket';
      process.env.TERRAFORM_STATE_BUCKET_REGION = 'eu-west-1';
      process.env.TERRAFORM_STATE_BUCKET_KEY = 'custom-key';

      const stack = new FinTechTradingStack(app, 'test-stack-state', {
        environmentSuffix: 'test',
        region: 'ca-central-1',
        vpcCidr: '10.0.0.0/16',
        dbUsername: 'testadmin',
        enableMutualTls: true,
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('test-bucket');
      expect(synthesized).toContain('eu-west-1');
      expect(synthesized).toContain('custom-key');

      delete process.env.TERRAFORM_STATE_BUCKET;
      delete process.env.TERRAFORM_STATE_BUCKET_REGION;
      delete process.env.TERRAFORM_STATE_BUCKET_KEY;
    });
  });
});
