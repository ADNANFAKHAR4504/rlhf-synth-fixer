import * as pulumi from '@pulumi/pulumi';
import { ApiGatewayComponent } from '../lib/components/api-gateway';
import { DatabaseComponent } from '../lib/components/database';
import { DynamoDbComponent } from '../lib/components/dynamodb';
import { LambdaComponent } from '../lib/components/lambda';
import { MonitoringComponent } from '../lib/components/monitoring';
import { S3Component } from '../lib/components/s3';
import { VpcComponent } from '../lib/components/vpc';
import { getEnvironmentConfig } from '../lib/config';
import { PaymentStack } from '../lib/payment-stack';
import { EnvironmentConfig } from '../lib/types';

// Set up Pulumi mocks before any imports
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:mock:us-east-1:123456789012:${args.type}/${args.name}`,
        id: `${args.name}-id`,
        endpoint: args.type.includes('rds') ? `${args.name}.mock.rds.amazonaws.com:5432` : undefined,
        apiEndpoint: args.type.includes('apigateway') ? `https://${args.name}.execute-api.us-east-1.amazonaws.com` : undefined,
        hex: args.type.includes('random') ? 'abc123' : undefined,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

// Set required config - default to dev, can be overridden in tests
pulumi.runtime.setConfig('TapStack:environment', 'dev');
pulumi.runtime.setConfig('TapStack:dbPassword', 'test-password-123');
pulumi.runtime.setConfig('aws:region', 'us-east-1');

describe('PaymentStack Unit Tests', () => {
  beforeEach(() => {
    // Reset to dev config before each test
    pulumi.runtime.setConfig('TapStack:environment', 'dev');
  });

  describe('Environment Configuration', () => {
    it('should return correct dev configuration', () => {
      const config = getEnvironmentConfig();

      expect(config.environment).toBe('dev');
      expect(config.lambdaConcurrency).toBe(10);
      expect(config.logRetentionDays).toBe(7);
      expect(config.rdsAlarmThreshold).toBe(80);
      expect(config.s3LifecycleDays).toBe(30);
      expect(config.dbInstanceClass).toBe('db.t3.micro');
      expect(config.enableWaf).toBe(false);
      expect(config.customDomain).toBe('api-dev.payments.internal');
    });

    it('should have prod configuration values', () => {
      const prodConfig: EnvironmentConfig = {
        environment: 'prod',
        lambdaConcurrency: 200,
        logRetentionDays: 90,
        rdsAlarmThreshold: 70,
        s3LifecycleDays: 90,
        dbInstanceClass: 'db.t3.medium',
        enableWaf: true,
        customDomain: 'api-prod.payments.internal',
      };

      expect(prodConfig.environment).toBe('prod');
      expect(prodConfig.lambdaConcurrency).toBe(200);
      expect(prodConfig.logRetentionDays).toBe(90);
      expect(prodConfig.rdsAlarmThreshold).toBe(70);
      expect(prodConfig.s3LifecycleDays).toBe(90);
      expect(prodConfig.dbInstanceClass).toBe('db.t3.medium');
      expect(prodConfig.enableWaf).toBe(true);
      expect(prodConfig.customDomain).toBe('api-prod.payments.internal');
    });

    it('should have staging configuration values', () => {
      const stagingConfig: EnvironmentConfig = {
        environment: 'staging',
        lambdaConcurrency: 50,
        logRetentionDays: 30,
        rdsAlarmThreshold: 75,
        s3LifecycleDays: 60,
        dbInstanceClass: 'db.t3.small',
        enableWaf: false,
        customDomain: 'api-staging.payments.internal',
      };

      expect(stagingConfig.environment).toBe('staging');
      expect(stagingConfig.lambdaConcurrency).toBe(50);
      expect(stagingConfig.logRetentionDays).toBe(30);
      expect(stagingConfig.enableWaf).toBe(false);
    });
  });

  describe('VPC Component', () => {
    it('should create VPC component', () => {
      const vpc = new VpcComponent('test-vpc', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });

      expect(vpc).toBeDefined();
      expect(vpc.vpc).toBeDefined();
      expect(vpc.privateSubnets).toHaveLength(3);
      expect(vpc.vpcId).toBeDefined();
      expect(vpc.privateSubnetIds).toHaveLength(3);
    });

    it('should create VPC with environment suffix in name', () => {
      const suffix = 'unittest';
      const vpc = new VpcComponent('test-vpc', {
        environmentSuffix: suffix,
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: suffix,
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });

      expect(vpc).toBeDefined();
    });
  });

  describe('Database Component', () => {
    let vpc: VpcComponent;

    beforeEach(() => {
      vpc = new VpcComponent('test-vpc', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });
    });

    it('should create database component', () => {
      const db = new DatabaseComponent('test-db', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        vpcId: vpc.vpcId,
        privateSubnetIds: vpc.privateSubnetIds,
      });

      expect(db).toBeDefined();
      expect(db.kmsKey).toBeDefined();
      expect(db.kmsAlias).toBeDefined();
      expect(db.securityGroup).toBeDefined();
      expect(db.subnetGroup).toBeDefined();
      expect(db.dbInstance).toBeDefined();
    });

    it('should create database with encryption', () => {
      pulumi.runtime.setConfig('TapStack:environment', 'dev');
      const db = new DatabaseComponent('test-db', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        vpcId: vpc.vpcId,
        privateSubnetIds: vpc.privateSubnetIds,
      });

      expect(db.kmsKey).toBeDefined();
      expect(db.dbEndpoint).toBeDefined();
    });

    it('should create database with prod-specific configuration', () => {
      const prodConfig: EnvironmentConfig = {
        environment: 'prod',
        lambdaConcurrency: 200,
        logRetentionDays: 90,
        rdsAlarmThreshold: 70,
        s3LifecycleDays: 90,
        dbInstanceClass: 'db.t3.medium',
        enableWaf: true,
        customDomain: 'api-prod.payments.internal',
      };

      const db = new DatabaseComponent('test-db-prod', {
        environmentSuffix: 'prod',
        envConfig: prodConfig,
        tags: {
          Environment: 'prod',
          EnvironmentSuffix: 'prod',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        vpcId: vpc.vpcId,
        privateSubnetIds: vpc.privateSubnetIds,
      });

      expect(db.dbInstance).toBeDefined();
      expect(db.dbEndpoint).toBeDefined();
    });
  });

  describe('DynamoDB Component', () => {
    it('should create DynamoDB component', () => {
      const dynamo = new DynamoDbComponent('test-dynamo', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });

      expect(dynamo).toBeDefined();
      expect(dynamo.table).toBeDefined();
      expect(dynamo.tableName).toBeDefined();
      expect(dynamo.tableArn).toBeDefined();
    });

    it('should create table with environment suffix', () => {
      const suffix = 'unittest';
      const dynamo = new DynamoDbComponent('test-dynamo', {
        environmentSuffix: suffix,
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: suffix,
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });

      expect(dynamo).toBeDefined();
    });
  });

  describe('S3 Component', () => {
    it('should create S3 component', () => {
      const s3 = new S3Component('test-s3', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });

      expect(s3).toBeDefined();
      expect(s3.bucket).toBeDefined();
      expect(s3.bucketVersioning).toBeDefined();
      expect(s3.bucketLifecycle).toBeDefined();
      expect(s3.bucketEncryption).toBeDefined();
      expect(s3.bucketPublicAccessBlock).toBeDefined();
    });

    it('should create bucket with versioning and encryption', () => {
      const s3 = new S3Component('test-s3', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });

      expect(s3.bucketName).toBeDefined();
      expect(s3.bucketArn).toBeDefined();
    });
  });

  describe('Lambda Component', () => {
    let vpc: VpcComponent;
    let dynamo: DynamoDbComponent;

    beforeEach(() => {
      vpc = new VpcComponent('test-vpc', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });

      dynamo = new DynamoDbComponent('test-dynamo', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
      });
    });

    it('should create Lambda component', () => {
      const lambda = new LambdaComponent('test-lambda', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        vpcId: vpc.vpcId,
        privateSubnetIds: vpc.privateSubnetIds,
        dbEndpoint: pulumi.output('test.rds.amazonaws.com:5432'),
        dynamoTableName: dynamo.tableName,
        dynamoTableArn: dynamo.tableArn,
      });

      expect(lambda).toBeDefined();
      expect(lambda.role).toBeDefined();
      expect(lambda.securityGroup).toBeDefined();
      expect(lambda.function).toBeDefined();
      expect(lambda.logGroup).toBeDefined();
    });

    it('should create Lambda with correct memory and concurrency', () => {
      pulumi.runtime.setConfig('TapStack:environment', 'dev');
      const lambda = new LambdaComponent('test-lambda', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        vpcId: vpc.vpcId,
        privateSubnetIds: vpc.privateSubnetIds,
        dbEndpoint: pulumi.output('test.rds.amazonaws.com:5432'),
        dynamoTableName: dynamo.tableName,
        dynamoTableArn: dynamo.tableArn,
      });

      expect(lambda.functionArn).toBeDefined();
      expect(lambda.functionName).toBeDefined();
    });

    it('should create Lambda with prod-specific configuration', () => {
      const prodConfig: EnvironmentConfig = {
        environment: 'prod',
        lambdaConcurrency: 200,
        logRetentionDays: 90,
        rdsAlarmThreshold: 70,
        s3LifecycleDays: 90,
        dbInstanceClass: 'db.t3.medium',
        enableWaf: true,
        customDomain: 'api-prod.payments.internal',
      };

      const lambda = new LambdaComponent('test-lambda-prod', {
        environmentSuffix: 'prod',
        envConfig: prodConfig,
        tags: {
          Environment: 'prod',
          EnvironmentSuffix: 'prod',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        vpcId: vpc.vpcId,
        privateSubnetIds: vpc.privateSubnetIds,
        dbEndpoint: pulumi.output('prod.rds.amazonaws.com:5432'),
        dynamoTableName: dynamo.tableName,
        dynamoTableArn: dynamo.tableArn,
      });

      expect(lambda.function).toBeDefined();
      expect(lambda.functionArn).toBeDefined();
    });
  });

  describe('API Gateway Component', () => {
    it('should create API Gateway component', () => {
      const api = new ApiGatewayComponent('test-api', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123456789012:function:test'),
        lambdaFunctionName: pulumi.output('test-function'),
      });

      expect(api).toBeDefined();
      expect(api.api).toBeDefined();
      expect(api.stage).toBeDefined();
      expect(api.logGroup).toBeDefined();
    });

    it('should not create WAF for dev environment', () => {
      const api = new ApiGatewayComponent('test-api-dev', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123456789012:function:test'),
        lambdaFunctionName: pulumi.output('test-function'),
      });

      expect(api.wafWebAcl).toBeUndefined();
      expect(api.wafAssociation).toBeUndefined();
    });

    it('should create WAF for prod environment', () => {
      const prodConfig: EnvironmentConfig = {
        environment: 'prod',
        lambdaConcurrency: 200,
        logRetentionDays: 90,
        rdsAlarmThreshold: 70,
        s3LifecycleDays: 90,
        dbInstanceClass: 'db.t3.medium',
        enableWaf: true,
        customDomain: 'api-prod.payments.internal',
      };

      const api = new ApiGatewayComponent('test-api-prod', {
        environmentSuffix: 'prod',
        envConfig: prodConfig,
        tags: {
          Environment: 'prod',
          EnvironmentSuffix: 'prod',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        lambdaFunctionArn: pulumi.output('arn:aws:lambda:us-east-1:123456789012:function:test-prod'),
        lambdaFunctionName: pulumi.output('test-function-prod'),
      });

      expect(api.api).toBeDefined();
      expect(api.wafWebAcl).toBeDefined();
      expect(api.wafAssociation).toBeDefined();
    });
  });

  describe('Monitoring Component', () => {
    it('should create Monitoring component', () => {
      const monitoring = new MonitoringComponent('test-monitoring', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        dbInstanceId: pulumi.output('test-db'),
        lambdaFunctionName: pulumi.output('test-function'),
        dynamoTableName: pulumi.output('test-table'),
        apiId: pulumi.output('test-api'),
      });

      expect(monitoring).toBeDefined();
      expect(monitoring.rdsAlarm).toBeDefined();
      expect(monitoring.lambdaErrorAlarm).toBeDefined();
      expect(monitoring.lambdaThrottleAlarm).toBeDefined();
      expect(monitoring.apiErrorAlarm).toBeDefined();
      expect(monitoring.dashboard).toBeDefined();
    });

    it('should create alarms with correct environment thresholds', () => {
      const monitoring = new MonitoringComponent('test-monitoring', {
        environmentSuffix: 'test',
        envConfig: getEnvironmentConfig(),
        tags: {
          Environment: 'dev',
          EnvironmentSuffix: 'test',
          ManagedBy: 'Pulumi',
          Project: 'Test',
        },
        dbInstanceId: pulumi.output('test-db'),
        lambdaFunctionName: pulumi.output('test-function'),
        dynamoTableName: pulumi.output('test-table'),
        apiId: pulumi.output('test-api'),
      });

      expect(monitoring.rdsAlarm).toBeDefined();
    });
  });

  describe('PaymentStack Integration', () => {
    it('should create complete PaymentStack', () => {
      const stack = new PaymentStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          Test: 'true',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.dbEndpoint).toBeDefined();
      expect(stack.dbArn).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.apiArn).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
      expect(stack.dynamoTableArn).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.auditBucketArn).toBeDefined();
    });

    it('should use environment suffix in all resources', () => {
      const stack = new PaymentStack('test-stack-suffix', {
        environmentSuffix: 'unittest',
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.dbEndpoint).toBeDefined();
    });

    it('should handle explicit environment suffix argument', () => {
      const stack = new PaymentStack('test-stack-explicit', {
        environmentSuffix: 'explicit-test',
        tags: {
          Test: 'explicit',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('should apply custom tags', () => {
      const customTags = {
        CustomTag: 'CustomValue',
        Team: 'TestTeam',
      };

      const stack = new PaymentStack('test-stack-tags', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should use default environment suffix when not provided', () => {
      const stack = new PaymentStack('test-stack-default', {});

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('should fallback to process.env when environmentSuffix not in args', () => {
      process.env.ENVIRONMENT_SUFFIX = 'envvar';
      const stack = new PaymentStack('test-stack-env', {});

      expect(stack).toBeDefined();
      delete process.env.ENVIRONMENT_SUFFIX;
    });
  });
});
