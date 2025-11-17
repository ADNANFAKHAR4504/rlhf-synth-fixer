import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { EnvironmentConfigurations } from '../lib/config/environment-config';
import { TapStack } from '../lib/tap-stack';

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
      expect(() => EnvironmentConfigurations.getByName('invalid')).toThrow(
        'Unknown environment: invalid'
      );
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
      expect(envConfig.vpcConfig.natGateways).toBe(0);
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

  describe('TapStack', () => {
    let tapStack: TapStack;

    beforeEach(() => {
      tapStack = new TapStack(app, 'TestTapStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
    });

    test('should create stack with correct name', () => {
      expect(tapStack.stackName).toBeDefined();
    });

    describe('VPC Resources', () => {
      test('should create VPC with correct CIDR', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: envConfig.vpcConfig.cidr,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });
      });

      test('should create correct number of NAT gateways', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs(
          'AWS::EC2::NatGateway',
          envConfig.vpcConfig.natGateways
        );
      });

      test('should create public and private subnets', () => {
        const template = Template.fromStack(tapStack);
        const resources = template.findResources('AWS::EC2::Subnet');
        expect(Object.keys(resources).length).toBeGreaterThanOrEqual(2);
      });

      test('should export VPC ID to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/vpc-id`,
          Type: 'String',
        });
      });

      test('should export subnet IDs to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: Match.stringLikeRegexp(`/${testSuffix}/(private|public)-subnet-\\d+-id`),
        });
      });
    });

    describe('S3 Resources', () => {
      test('should create S3 bucket with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: `trade-data-${testSuffix}`,
        });
      });

      test('should enable encryption', () => {
        const template = Template.fromStack(tapStack);
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
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('should have lifecycle rules with intelligent tiering', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'IntelligentTiering',
                Status: 'Enabled',
                Transitions: Match.arrayWith([
                  Match.objectLike({
                    StorageClass: 'INTELLIGENT_TIERING',
                    TransitionInDays: 30,
                  }),
                ]),
              }),
            ]),
          },
        });
      });

      test('should have lifecycle expiration for dev environment', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'Expiration',
                Status: 'Enabled',
                ExpirationInDays: 30,
              }),
            ]),
          },
        });
      });

      test('should have multipart upload cleanup rule', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'CleanupMultipartUploads',
                Status: 'Enabled',
                AbortIncompleteMultipartUpload: {
                  DaysAfterInitiation: 7,
                },
              }),
            ]),
          },
        });
      });

      test('should export S3 bucket details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/trade-data-bucket-name`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/trade-data-bucket-arn`,
        });
      });

      test('should enforce SSL for S3 bucket', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::BucketPolicy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Deny',
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              }),
            ]),
          },
        });
      });
    });

    describe('DynamoDB Resources', () => {
      test('should create DynamoDB table with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          TableName: `orders-${testSuffix}`,
        });
      });

      test('should use PAY_PER_REQUEST billing mode', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          BillingMode: 'PAY_PER_REQUEST',
        });
      });

      test('should have partition and sort keys', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          KeySchema: Match.arrayWith([
            Match.objectLike({ AttributeName: 'orderId', KeyType: 'HASH' }),
            Match.objectLike({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
          ]),
        });
      });

      test('should create Global Secondary Index', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'StatusIndex',
              KeySchema: Match.arrayWith([
                Match.objectLike({
                  AttributeName: 'status',
                  KeyType: 'HASH',
                }),
                Match.objectLike({
                  AttributeName: 'timestamp',
                  KeyType: 'RANGE',
                }),
              ]),
            }),
          ]),
        });
      });

      test('should enable point-in-time recovery for dev', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: envConfig.dynamoConfig.pointInTimeRecovery,
          },
        });
      });

      test('should enable encryption', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          SSESpecification: {
            SSEEnabled: true,
          },
        });
      });

      test('should enable streams', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
        });
      });

      test('should export table details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/orders-table-name`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/orders-table-arn`,
        });
      });
    });

    describe('SQS Resources', () => {
      test('should create main queue with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          QueueName: `order-processing-${testSuffix}`,
        });
      });

      test('should create dead letter queue', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          QueueName: `order-processing-dlq-${testSuffix}`,
        });
      });

      test('should configure message retention', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          MessageRetentionPeriod: envConfig.sqsConfig.messageRetentionSeconds,
          VisibilityTimeout: envConfig.sqsConfig.visibilityTimeoutSeconds,
        });
      });

      test('should configure redrive policy', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          RedrivePolicy: Match.objectLike({
            maxReceiveCount: envConfig.sqsConfig.maxReceiveCount,
          }),
        });
      });

      test('should enable encryption for queues', () => {
        const template = Template.fromStack(tapStack);
        const queues = template.findResources('AWS::SQS::Queue');
        Object.values(queues).forEach((queue: any) => {
          expect(queue.Properties.SqsManagedSseEnabled).toBe(true);
        });
      });

      test('should export queue details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/order-processing-queue-url`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/order-processing-queue-arn`,
        });
      });
    });

    describe('Lambda Resources', () => {
      test('should create Lambda function with correct configuration', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `order-processing-${testSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          MemorySize: envConfig.lambdaConfig.memorySize,
          Timeout: envConfig.lambdaConfig.timeout,
        });
      });

      test('should configure reserved concurrent executions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          ReservedConcurrentExecutions:
            envConfig.lambdaConfig.reservedConcurrentExecutions,
        });
      });

      test('should create IAM role with correct name', () => {
        const template = Template.fromStack(tapStack);
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

      test('should have environment variables', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: Match.objectLike({
              ENVIRONMENT: testSuffix,
              DYNAMODB_TABLE: Match.anyValue(),
              SQS_QUEUE: Match.anyValue(),
              S3_BUCKET: Match.anyValue(),
            }),
          },
        });
      });

      test('should enable X-Ray tracing', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          TracingConfig: {
            Mode: 'Active',
          },
        });
      });

      test('should have DynamoDB permissions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:Query',
                ],
                Effect: 'Allow',
              }),
            ]),
          },
        });
      });

      test('should have SQS permissions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
                Effect: 'Allow',
              }),
            ]),
          },
        });
      });

      test('should have S3 permissions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: ['s3:PutObject', 's3:GetObject'],
                Effect: 'Allow',
              }),
            ]),
          },
        });
      });

      test('should export Lambda ARN to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/order-processing-function-arn`,
        });
      });
    });

    describe('API Gateway Resources', () => {
      test('should create REST API with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: `trading-api-${testSuffix}`,
        });
      });

      test('should create deployment with correct stage', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          StageName: testSuffix,
        });
      });

      test('should enable logging', () => {
        const template = Template.fromStack(tapStack);
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

      test('should configure throttling', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          MethodSettings: Match.arrayWith([
            Match.objectLike({
              ThrottlingRateLimit: envConfig.apiGatewayConfig.throttleRateLimit,
              ThrottlingBurstLimit:
                envConfig.apiGatewayConfig.throttleBurstLimit,
            }),
          ]),
        });
      });

      test('should create usage plan', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
          UsagePlanName: `usage-plan-${testSuffix}`,
          Throttle: {
            RateLimit: envConfig.apiGatewayConfig.throttleRateLimit,
            BurstLimit: envConfig.apiGatewayConfig.throttleBurstLimit,
          },
        });
      });

      test('should create /orders resource', () => {
        const template = Template.fromStack(tapStack);
        const resources = template.findResources('AWS::ApiGateway::Resource');
        const ordersResource = Object.values(resources).find(
          (r: any) => r.Properties?.PathPart === 'orders'
        );
        expect(ordersResource).toBeDefined();
      });

      test('should create POST method', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          Integration: Match.objectLike({
            Type: 'AWS_PROXY',
          }),
        });
      });

      test('should create GET method', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
        });
      });

      test('should enable CORS', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'OPTIONS',
        });
      });

      test('should create CloudWatch log group', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/aws/apigateway/trading-api-${testSuffix}`,
          RetentionInDays: 30,
        });
      });

      test('should export API details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/api-endpoint`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/api-id`,
        });
      });

      test('should create stack output for API endpoint', () => {
        const template = Template.fromStack(tapStack);
        template.hasOutput('ApiEndpoint', {
          Description: 'API Gateway endpoint URL',
          Export: {
            Name: `trading-api-endpoint-${testSuffix}`,
          },
        });
      });
    });

    describe('Monitoring Resources', () => {
      test('should create SNS topic', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SNS::Topic', {
          TopicName: `drift-detection-${testSuffix}`,
          DisplayName: 'CloudFormation Drift Detection Alerts',
        });
      });

      test('should create email subscription', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
          Endpoint: `ops-${testSuffix}@example.com`,
        });
      });

      test('should create CloudWatch alarm', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `drift-detection-alarm-${testSuffix}`,
          ComparisonOperator: 'GreaterThanOrEqualToThreshold',
          Threshold: 1,
          EvaluationPeriods: 1,
        });
      });

      test('should create CloudWatch dashboard', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
          DashboardName: `trading-platform-${testSuffix}`,
        });
      });

      test('should configure alarm action with SNS', () => {
        const template = Template.fromStack(tapStack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        const alarm = Object.values(alarms)[0] as any;
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });

      test('should export monitoring details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/drift-topic-arn`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/dashboard-name`,
        });
      });
    });

    describe('Resource Counts', () => {
      test('should create expected number of SSM parameters', () => {
        const template = Template.fromStack(tapStack);
        // vpc-id, subnet-ids, bucket-name, bucket-arn, table-name, table-arn,
        // 4 queue params, function-arn, api-endpoint, api-id, drift-topic, dashboard
        const params = template.findResources('AWS::SSM::Parameter');
        expect(Object.keys(params).length).toBeGreaterThanOrEqual(13);
      });

      test('should have exactly one VPC', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::EC2::VPC', 1);
      });

      test('should have exactly one DynamoDB table', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::DynamoDB::Table', 1);
      });

      test('should have exactly one S3 bucket', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::S3::Bucket', 1);
      });

      test('should have exactly two SQS queues', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::SQS::Queue', 2);
      });

      test('should have expected number of Lambda functions', () => {
        const template = Template.fromStack(tapStack);
        // OrderProcessingFunction + custom resource handlers
        const functions = template.findResources('AWS::Lambda::Function');
        expect(Object.keys(functions).length).toBeGreaterThanOrEqual(1);
      });

      test('should have exactly one API Gateway REST API', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      });

      test('should have exactly one CloudWatch dashboard', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      });

      test('should have exactly one CloudWatch alarm', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
      });
    });

    describe('Production Environment Configuration', () => {
      test('should enable point-in-time recovery for prod DynamoDB', () => {
        const prodStack = new TapStack(app, 'ProdTapStack', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test',
        });
        const template = Template.fromStack(prodStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: true,
          },
        });
      });

      test('should not have lifecycle expiration for prod S3', () => {
        const prodStack = new TapStack(app, 'ProdTapStack2', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test2',
        });
        const template = Template.fromStack(prodStack);
        const bucket = template.findResources('AWS::S3::Bucket');
        const bucketProps = Object.values(bucket)[0] as any;
        const expirationRule = bucketProps.Properties?.LifecycleConfiguration?.Rules?.find(
          (rule: any) => rule.Id === 'Expiration'
        );
        expect(expirationRule).toBeUndefined();
      });

      test('should have higher Lambda memory for prod', () => {
        const prodStack = new TapStack(app, 'ProdTapStack3', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test3',
        });
        const template = Template.fromStack(prodStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          MemorySize: 2048,
        });
      });

      test('should have higher API throttling for prod', () => {
        const prodStack = new TapStack(app, 'ProdTapStack4', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test4',
        });
        const template = Template.fromStack(prodStack);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          MethodSettings: Match.arrayWith([
            Match.objectLike({
              ThrottlingRateLimit: 2000,
              ThrottlingBurstLimit: 4000,
            }),
          ]),
        });
      });
    });
  });
});
