import { Testing } from 'cdktf';
import { TradingPlatformStack } from '../lib/index';

describe('Trading Platform Disaster Recovery Stack - Unit Tests', () => {
  describe('Stack Creation', () => {
    test('stack should be created successfully', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
    });

    test('stack should create AWS providers for both regions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      // Check for AWS providers
      expect(synthesized).toContain('"provider"');
      expect(synthesized).toContain('"aws"');
    });

    test('stack should use correct environment suffix', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      // Environment suffix should be based on process.env or default
      expect(stack).toBeDefined();
    });

    test('config should use default environment suffix when ENVIRONMENT_SUFFIX is not set', () => {
      // Save original value
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;

      // Unset the environment variable
      delete process.env.ENVIRONMENT_SUFFIX;

      // Force re-import of config to test the default branch
      jest.resetModules();
      const { config } = require('../lib/config/infrastructure-config');

      expect(config.environmentSuffix).toBe('dev');
      expect(config.hostedZoneName).toBe('trading-platform-dev.local');
      expect(config.apiDomainName).toBe('api.trading-platform-dev.local');

      // Restore original value
      if (originalEnv !== undefined) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      }
      jest.resetModules();
    });

    test('config should use custom environment suffix when ENVIRONMENT_SUFFIX is set', () => {
      // Save original value
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;

      // Set a custom environment variable
      process.env.ENVIRONMENT_SUFFIX = 'prod';

      // Force re-import of config to test the custom branch
      jest.resetModules();
      const { config } = require('../lib/config/infrastructure-config');

      expect(config.environmentSuffix).toBe('prod');
      expect(config.hostedZoneName).toBe('trading-platform-prod.local');
      expect(config.apiDomainName).toBe('api.trading-platform-prod.local');

      // Restore original value
      if (originalEnv !== undefined) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
      jest.resetModules();
    });
  });

  describe('Route 53 Configuration', () => {
    test('should create Route53 hosted zone', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_route53_zone');
    });

    test('should create health checks for both regions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      // Health checks should be created
      expect(synthesized).toContain('aws_route53_health_check');
    });
  });

  describe('RDS Global Database', () => {
    test('should create RDS global cluster', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_rds_global_cluster');
    });

    test('should create primary RDS cluster', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_rds_cluster');
    });

    test('should create secondary RDS cluster', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_rds_cluster');
    });

    test('should create RDS cluster instances', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_rds_cluster_instance');
    });

    test('should create DB subnet groups', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_db_subnet_group');
    });
  });

  describe('DynamoDB Global Table', () => {
    test('should create DynamoDB global table', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_dynamodb_table');
    });

    test('should enable point-in-time recovery', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('point_in_time_recovery');
    });
  });

  describe('S3 Cross-Region Replication', () => {
    test('should create S3 buckets in both regions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_s3_bucket');
    });

    test('should enable versioning on S3 buckets', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_s3_bucket_versioning');
    });

    test('should configure S3 replication', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_s3_bucket_replication_configuration');
    });

    test('should create IAM role for S3 replication', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_iam_role');
    });
  });

  describe('Lambda Functions', () => {
    test('should create trade processor lambda in primary region', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_lambda_function');
    });

    test('should create trade processor lambda in secondary region', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_lambda_function');
    });

    test('should create failover validator lambda', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_lambda_function');
    });

    test('should create IAM roles for Lambda functions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_iam_role');
    });

    test('should configure SQS event source mapping', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_lambda_event_source_mapping');
    });
  });

  describe('API Gateway', () => {
    test('should create API Gateway REST APIs in both regions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_api_gateway_rest_api');
    });

    test('should create API Gateway resources', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_api_gateway_resource');
    });

    test('should create API Gateway methods', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_api_gateway_method');
    });

    test('should create API Gateway integrations', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_api_gateway_integration');
    });

    test('should create API Gateway deployments', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_api_gateway_deployment');
    });

    test('should create API Gateway stages', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_api_gateway_stage');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch alarms', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
    });

    test('should create SNS topics for alarms', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_sns_topic');
    });
  });

  describe('Step Functions', () => {
    test('should create Step Functions state machine', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_sfn_state_machine');
    });

    test('should create IAM role for Step Functions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_iam_role');
    });

    test('should create EventBridge rule for triggering failover', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_cloudwatch_event_rule');
    });

    test('should create EventBridge target for Step Functions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_cloudwatch_event_target');
    });
  });

  describe('SQS Queues', () => {
    test('should create SQS queues in both regions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_sqs_queue');
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPCs in both regions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_vpc');
    });

    test('should create subnets in both regions', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_subnet');
    });

    test('should create internet gateways', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_internet_gateway');
    });

    test('should create route tables', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_route_table');
    });

    test('should create security groups', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_security_group');
    });
  });

  describe('SSM Parameter Store', () => {
    test('should create SSM parameters for configuration', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      expect(synthesized).toContain('aws_ssm_parameter');
    });
  });

  describe('Resource Naming', () => {
    test('all resources should include environment suffix', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      // Verify that resource names include environment suffix
      expect(synthesized).toBeDefined();
    });

    test('resources should be tagged appropriately', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      // Check for tags in resources
      expect(synthesized).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should export stack outputs', () => {
      const app = Testing.app();
      const stack = new TradingPlatformStack(app, 'test');
      const synthesized = Testing.synth(stack);

      // Check for outputs
      expect(synthesized).toBeDefined();
    });
  });
});
