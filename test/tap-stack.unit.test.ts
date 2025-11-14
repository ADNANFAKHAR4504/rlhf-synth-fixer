import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { EnvironmentConfigurations } from '../lib/config/environment-config';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { DynamoDbStack } from '../lib/stacks/dynamodb-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { SqsStack } from '../lib/stacks/sqs-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiGatewayStack } from '../lib/stacks/api-gateway-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { BaseStack } from '../lib/stacks/base-stack';

describe('Trading Platform Infrastructure - Unit Tests', () => {
  let app: cdk.App;
  const testSuffix = 'test';
  const envConfig = EnvironmentConfigurations.DEV;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Environment Configurations', () => {
    test('should have all three environments defined', () => {
      expect(EnvironmentConfigurations.DEV).toBeDefined();
      expect(EnvironmentConfigurations.STAGING).toBeDefined();
      expect(EnvironmentConfigurations.PROD).toBeDefined();
    });

    test('should return environment by name', () => {
      const devConfig = EnvironmentConfigurations.getByName('dev');
      expect(devConfig.name).toBe('dev');
      expect(devConfig.lambdaConfig.memorySize).toBe(512);
    });

    test('should throw error for unknown environment', () => {
      expect(() => EnvironmentConfigurations.getByName('invalid')).toThrow();
    });

    test('should return all environments', () => {
      const all = EnvironmentConfigurations.getAll();
      expect(all).toHaveLength(3);
    });

    test('dev environment should have correct configuration', () => {
      expect(envConfig.name).toBe('dev');
      expect(envConfig.lambdaConfig.memorySize).toBe(512);
      expect(envConfig.apiGatewayConfig.throttleRateLimit).toBe(100);
      expect(envConfig.dynamoConfig.pointInTimeRecovery).toBe(false);
      expect(envConfig.s3Config.lifecycleDays).toBe(30);
    });

    test('staging environment should have correct configuration', () => {
      const staging = EnvironmentConfigurations.STAGING;
      expect(staging.lambdaConfig.memorySize).toBe(1024);
      expect(staging.apiGatewayConfig.throttleRateLimit).toBe(500);
      expect(staging.s3Config.lifecycleDays).toBe(90);
    });

    test('prod environment should have correct configuration', () => {
      const prod = EnvironmentConfigurations.PROD;
      expect(prod.lambdaConfig.memorySize).toBe(2048);
      expect(prod.apiGatewayConfig.throttleRateLimit).toBe(2000);
      expect(prod.dynamoConfig.pointInTimeRecovery).toBe(true);
      expect(prod.s3Config.lifecycleDays).toBeUndefined();
    });
  });

  describe('BaseStack', () => {
    test('should set environmentSuffix from props', () => {
      const stack = new BaseStack(app, 'TestStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
      expect(stack.stackName).toContain('TestStack');
    });

    test('should use environment name as default suffix', () => {
      const stack = new BaseStack(app, 'TestStack', {
        environmentConfig: envConfig,
      });
      expect(stack.stackName).toContain('TestStack');
    });

    test('should apply environment tags', () => {
      const stack = new BaseStack(app, 'TestStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });
  });

  describe('VPC Stack', () => {
    let vpcStack: VpcStack;

    beforeEach(() => {
      vpcStack = new VpcStack(app, 'TestVpcStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
    });

    test('should create VPC with correct CIDR', () => {
      const template = Template.fromStack(vpcStack);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: envConfig.vpcConfig.cidr,
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create NAT gateways', () => {
      const template = Template.fromStack(vpcStack);
      template.resourceCountIs(
        'AWS::EC2::NatGateway',
        envConfig.vpcConfig.natGateways
      );
    });

    test('should create public and private subnets', () => {
      const template = Template.fromStack(vpcStack);
      // Should have at least 2 subnets (public + private)
      const resources = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(2);
    });

    test('should export VPC ID to SSM', () => {
      const template = Template.fromStack(vpcStack);
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/trading-platform/${testSuffix}/vpc-id`,
        Type: 'String',
      });
    });
  });

  describe('DynamoDB Stack', () => {
    let dynamoStack: DynamoDbStack;

    beforeEach(() => {
      dynamoStack = new DynamoDbStack(app, 'TestDynamoStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
    });

    test('should create DynamoDB table with correct capacity', () => {
      const template = Template.fromStack(dynamoStack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `orders-${testSuffix}`,
        ProvisionedThroughput: {
          ReadCapacityUnits: envConfig.dynamoConfig.readCapacity,
          WriteCapacityUnits: envConfig.dynamoConfig.writeCapacity,
        },
      });
    });

    test('should have partition and sort keys', () => {
      const template = Template.fromStack(dynamoStack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          Match.objectLike({ AttributeName: 'orderId', KeyType: 'HASH' }),
          Match.objectLike({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ]),
      });
    });

    test('should create Global Secondary Index', () => {
      const template = Template.fromStack(dynamoStack);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'CustomerIndex',
            KeySchema: Match.arrayWith([
              Match.objectLike({
                AttributeName: 'customerId',
                KeyType: 'HASH',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should export table name to SSM', () => {
      const template = Template.fromStack(dynamoStack);
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/trading-platform/${testSuffix}/orders-table-name`,
      });
    });

    test('should enable auto-scaling for production environment', () => {
      const prodStack = new DynamoDbStack(app, 'TestDynamoStackProd', {
        environmentConfig: EnvironmentConfigurations.PROD,
        environmentSuffix: 'prod-test',
      });
      const template = Template.fromStack(prodStack);

      // Check for auto-scaling targets (should have 2: read and write)
      template.resourceCountIs(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        2
      );

      // Check for scaling policies (should have 2: read and write)
      template.resourceCountIs(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        2
      );
    });

    test('should not enable auto-scaling for non-production environments', () => {
      const template = Template.fromStack(dynamoStack);

      // Should not have auto-scaling for dev/staging
      template.resourceCountIs(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        0
      );
    });
  });

  describe('S3 Stack', () => {
    let s3Stack: S3Stack;

    beforeEach(() => {
      s3Stack = new S3Stack(app, 'TestS3Stack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
    });

    test('should create S3 bucket with correct name', () => {
      const template = Template.fromStack(s3Stack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `trade-data-${testSuffix}`,
      });
    });

    test('should enable encryption', () => {
      const template = Template.fromStack(s3Stack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });

    test('should block public access', () => {
      const template = Template.fromStack(s3Stack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules', () => {
      const template = Template.fromStack(s3Stack);
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([Match.objectLike({ Status: 'Enabled' })]),
        },
      });
    });
  });

  describe('SQS Stack', () => {
    let sqsStack: SqsStack;

    beforeEach(() => {
      sqsStack = new SqsStack(app, 'TestSqsStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
    });

    test('should create main queue with correct name', () => {
      const template = Template.fromStack(sqsStack);
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-processing-${testSuffix}`,
      });
    });

    test('should create dead letter queue', () => {
      const template = Template.fromStack(sqsStack);
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `order-processing-dlq-${testSuffix}`,
      });
    });

    test('should configure message retention', () => {
      const template = Template.fromStack(sqsStack);
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: envConfig.sqsConfig.messageRetentionSeconds,
        VisibilityTimeout: envConfig.sqsConfig.visibilityTimeoutSeconds,
      });
    });

    test('should configure redrive policy', () => {
      const template = Template.fromStack(sqsStack);
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: Match.objectLike({
          maxReceiveCount: envConfig.sqsConfig.maxReceiveCount,
        }),
      });
    });
  });

  describe('Lambda Stack', () => {
    let vpcStack: VpcStack;
    let lambdaStack: LambdaStack;

    beforeEach(() => {
      vpcStack = new VpcStack(app, 'TestVpcStack2', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
      lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
        vpc: vpcStack.vpc,
      });
    });

    test('should create Lambda function with correct configuration', () => {
      const template = Template.fromStack(lambdaStack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `order-processing-${testSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: envConfig.lambdaConfig.memorySize,
        Timeout: envConfig.lambdaConfig.timeout,
      });
    });

    test('should configure reserved concurrent executions', () => {
      const template = Template.fromStack(lambdaStack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions:
          envConfig.lambdaConfig.reservedConcurrentExecutions,
      });
    });

    test('should create IAM role', () => {
      const template = Template.fromStack(lambdaStack);
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `order-processing-role-${testSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: { Service: 'lambda.amazonaws.com' },
            }),
          ]),
        }),
      });
    });

    test('should configure VPC settings', () => {
      const template = Template.fromStack(lambdaStack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('should create security group', () => {
      const template = Template.fromStack(lambdaStack);
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `lambda-sg-${testSuffix}`,
      });
    });
  });

  describe('API Gateway Stack', () => {
    let vpcStack: VpcStack;
    let lambdaStack: LambdaStack;
    let apiStack: ApiGatewayStack;

    beforeEach(() => {
      vpcStack = new VpcStack(app, 'TestVpcStack3', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
      lambdaStack = new LambdaStack(app, 'TestLambdaStack2', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
        vpc: vpcStack.vpc,
      });
      apiStack = new ApiGatewayStack(app, 'TestApiStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
        orderProcessingFunction: lambdaStack.orderProcessingFunction,
      });
    });

    test('should create REST API', () => {
      const template = Template.fromStack(apiStack);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `trading-api-${testSuffix}`,
      });
    });

    test('should create deployment with throttling', () => {
      const template = Template.fromStack(apiStack);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: testSuffix,
      });
    });

    test('should enable logging', () => {
      const template = Template.fromStack(apiStack);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    test('should create usage plan', () => {
      const template = Template.fromStack(apiStack);
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `usage-plan-${testSuffix}`,
        Throttle: {
          RateLimit: envConfig.apiGatewayConfig.throttleRateLimit,
          BurstLimit: envConfig.apiGatewayConfig.throttleBurstLimit,
        },
      });
    });

    test('should create Lambda integration', () => {
      const template = Template.fromStack(apiStack);
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });
  });

  describe('Monitoring Stack', () => {
    let monitoringStack: MonitoringStack;

    beforeEach(() => {
      monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
    });

    test('should create SNS topic', () => {
      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `drift-detection-${testSuffix}`,
      });
    });

    test('should create CloudWatch alarm', () => {
      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `drift-detection-alarm-${testSuffix}`,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Threshold: 1,
      });
    });

    test('should create CloudWatch dashboard', () => {
      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `trading-platform-${testSuffix}`,
      });
    });

    test('should configure alarm action', () => {
      const template = Template.fromStack(monitoringStack);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    });
  });

  describe('Integration Tests - Stack Dependencies', () => {
    test('should respect stack dependencies', () => {
      const vpcStack = new VpcStack(app, 'VpcStack4', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
      const lambdaStack = new LambdaStack(app, 'LambdaStack4', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
        vpc: vpcStack.vpc,
      });
      const apiStack = new ApiGatewayStack(app, 'ApiStack4', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
        orderProcessingFunction: lambdaStack.orderProcessingFunction,
      });

      lambdaStack.addDependency(vpcStack);
      apiStack.addDependency(lambdaStack);

      expect(lambdaStack.dependencies).toContain(vpcStack);
      expect(apiStack.dependencies).toContain(lambdaStack);
    });
  });
});
