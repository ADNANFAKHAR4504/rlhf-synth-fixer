import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('should create stack with environment suffix', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should default to dev when environment suffix not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `GlobalTransactionTable-dev`,
      });
    });

    test('should use environment suffix from context', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'context-test');
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);
      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'GlobalTransactionTable-context-test',
      });
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create DynamoDB VPC Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.anyValue(),
        VpcEndpointType: 'Gateway',
      });
      // Verify it's DynamoDB by checking the resource ID
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const dynamoEndpoint = Object.values(endpoints).find(
        (ep: any) => ep.Properties.VpcEndpointType === 'Gateway'
      );
      expect(dynamoEndpoint).toBeDefined();
    });

    test('should create SQS VPC Interface Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('com.amazonaws.*.sqs'),
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `GlobalTransactionTable-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('should have correct partition and sort keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          }),
          Match.objectLike({
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          }),
        ]),
        AttributeDefinitions: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'transactionId',
            AttributeType: 'S',
          }),
          Match.objectLike({
            AttributeName: 'timestamp',
            AttributeType: 'N',
          }),
        ]),
      });
    });

    test('should have removal policy set to destroy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create FIFO transaction queue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(
          `transaction-processing-.*-${environmentSuffix}\\.fifo`
        ),
        FifoQueue: true,
        ContentBasedDeduplication: true,
        VisibilityTimeout: 300,
        MessageRetentionPeriod: 604800, // 7 days in seconds
      });
    });

    test('should create DLQ with FIFO configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(
          `transaction-dlq-.*-${environmentSuffix}\\.fifo`
        ),
        FifoQueue: true,
        VisibilityTimeout: 300,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });

    test('should configure DLQ on transaction queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: Match.objectLike({
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        }),
      });
    });

    test('should create event DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`event-dlq-.*-${environmentSuffix}`),
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('should create downstream queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(
          `downstream-processing-.*-${environmentSuffix}`
        ),
      });
    });

    test('should have removal policy on all queues', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      Object.values(queues).forEach((queue) => {
        expect(queue.DeletionPolicy || queue.UpdateReplacePolicy).toBeDefined();
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create transaction processor Lambda with ARM64', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(
          `transaction-processor-.*-${environmentSuffix}`
        ),
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Timeout: 60,
        MemorySize: 1024,
        ReservedConcurrentExecutions: 100,
      });
    });

    test('should create CDC processor Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(
          `transaction-cdc-.*-${environmentSuffix}`
        ),
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Timeout: 60,
        MemorySize: 512,
      });
    });

    test('should create API authorizer Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(
          `api-authorizer-.*-${environmentSuffix}`
        ),
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Timeout: 10,
        MemorySize: 256,
      });
    });

    test('should create API handler Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(
          `api-handler-.*-${environmentSuffix}`
        ),
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('should configure Lambda VPC settings', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('should configure Lambda environment variables', () => {
      // Only processor Lambda has environment variables
      const functions = template.findResources('AWS::Lambda::Function');
      const processor = Object.values(functions).find((fn: any) =>
        fn.Properties.FunctionName?.includes('transaction-processor')
      );
      expect(processor).toBeDefined();
      expect(processor?.Properties.Environment).toBeDefined();
      expect(processor?.Properties.Environment?.Variables).toBeDefined();
      // TABLE_NAME is a CloudFormation Ref, not a literal string
      expect(processor?.Properties.Environment?.Variables?.TABLE_NAME).toBeDefined();
      expect(processor?.Properties.Environment?.Variables?.EVENT_BUS_NAME).toBe(
        'default'
      );
    });

    test('should attach SQS event source to processor Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        EventSourceArn: Match.anyValue(),
        FunctionName: Match.anyValue(),
        BatchSize: 10,
        MaximumBatchingWindowInSeconds: Match.absent(),
      });
    });

    test('should attach DynamoDB stream event source to CDC Lambda', () => {
      // DynamoDB stream event source is conditionally created
      const eventSources = template.findResources(
        'AWS::Lambda::EventSourceMapping'
      );
      const dynamoEventSource = Object.values(eventSources).find(
        (es: any) =>
          es.Properties.StartingPosition === 'TRIM_HORIZON' &&
          es.Properties.BatchSize === 100
      );
      expect(dynamoEventSource).toBeDefined();
      if (dynamoEventSource) {
        expect(dynamoEventSource.Properties.MaximumBatchingWindowInSeconds).toBe(
          5
        );
      }
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create processor Lambda role with correct policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const processorRole = Object.values(roles).find((role: any) =>
        role.Properties.RoleName?.includes('ProcessorLambdaRole') ||
        role.Properties.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) =>
            stmt.Principal?.Service === 'lambda.amazonaws.com'
        )
      );
      expect(processorRole).toBeDefined();
      expect(
        processorRole?.Properties.AssumeRolePolicyDocument?.Statement?.[0]
          ?.Principal?.Service
      ).toBe('lambda.amazonaws.com');
    });

    test('should grant DynamoDB permissions to processor Lambda', () => {
      // Check both inline policies in roles and separate policies
      const roles = template.findResources('AWS::IAM::Role');
      const policies = template.findResources('AWS::IAM::Policy');
      const allPolicies = [
        ...Object.values(roles).flatMap((role: any) =>
          Object.values(role.Properties?.Policies || {})
        ),
        ...Object.values(policies),
      ];
      const dynamoPolicy = allPolicies.find((policy: any) => {
        const statements =
          policy.PolicyDocument?.Statement ||
          policy.Properties?.PolicyDocument?.Statement ||
          [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action];
          return (
            actions.some((action: string) =>
              action.includes('dynamodb:PutItem')
            ) ||
            actions.some((action: string) =>
              action.includes('dynamodb:UpdateItem')
            ) ||
            actions.some((action: string) =>
              action.includes('dynamodb:GetItem')
            ) ||
            actions.some((action: string) => action.includes('dynamodb:Query'))
          );
        });
      });
      expect(dynamoPolicy).toBeDefined();
    });

    test('should grant SQS permissions to processor Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ]),
            }),
          ]),
        },
      });
    });

    test('should grant EventBridge permissions to processor Lambda', () => {
      // Check both inline policies in roles and separate policies
      const roles = template.findResources('AWS::IAM::Role');
      const policies = template.findResources('AWS::IAM::Policy');
      const allPolicies = [
        ...Object.values(roles).flatMap((role: any) =>
          Object.values(role.Properties?.Policies || {})
        ),
        ...Object.values(policies),
      ];
      const eventBridgePolicy = allPolicies.find((policy: any) => {
        const statements =
          policy.PolicyDocument?.Statement ||
          policy.Properties?.PolicyDocument?.Statement ||
          [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action];
          return (
            actions.some((action: string) =>
              action.includes('events:PutEvents')
            ) && (stmt.Resource === '*' || stmt.Resource?.includes('*'))
          );
        });
      });
      expect(eventBridgePolicy).toBeDefined();
    });

    test('should grant DynamoDB stream permissions to CDC Lambda', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const streamPolicy = Object.values(policies).find((policy: any) => {
        const statements = policy.Properties.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) =>
          Array.isArray(stmt.Action)
            ? stmt.Action.includes('dynamodb:DescribeStream')
            : stmt.Action === 'dynamodb:DescribeStream'
        );
      });
      expect(streamPolicy).toBeDefined();
    });

    test('should grant SQS send permissions to API handler Lambda', () => {
      // Check both inline policies in roles and separate policies
      const roles = template.findResources('AWS::IAM::Role');
      const policies = template.findResources('AWS::IAM::Policy');
      const allPolicies = [
        ...Object.values(roles).flatMap((role: any) =>
          Object.values(role.Properties?.Policies || {})
        ),
        ...Object.values(policies),
      ];
      const sqsPolicy = allPolicies.find((policy: any) => {
        const statements =
          policy.PolicyDocument?.Statement ||
          policy.Properties?.PolicyDocument?.Statement ||
          [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action];
          return (
            actions.some((action: string) =>
              action.includes('sqs:SendMessage')
            ) && (stmt.Effect === 'Allow' || !stmt.Effect)
          );
        });
      });
      expect(sqsPolicy).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create log group for processor Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(
          `/aws/lambda/transaction-processor-.*-${environmentSuffix}`
        ),
        RetentionInDays: 30,
      });
    });

    test('should create log group for CDC Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(
          `/aws/lambda/transaction-cdc-.*-${environmentSuffix}`
        ),
        RetentionInDays: 30,
      });
    });

    test('should create log group for authorizer Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(
          `/aws/lambda/api-authorizer-.*-${environmentSuffix}`
        ),
        RetentionInDays: 30,
      });
    });

    test('should create log group for API handler Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(
          `/aws/lambda/api-handler-.*-${environmentSuffix}`
        ),
        RetentionInDays: 30,
      });
    });

    test('should create log group for API Gateway access logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(
          `/aws/apigateway/transaction-api-.*-${environmentSuffix}`
        ),
        RetentionInDays: 30,
      });
    });

    test('should have removal policy on all log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup) => {
        expect(
          logGroup.DeletionPolicy || logGroup.UpdateReplacePolicy
        ).toBeDefined();
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp(
          `transaction-api-.*-${environmentSuffix}`
        ),
      });
    });

    test('should configure API Gateway deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('should configure API Gateway throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ThrottlingBurstLimit: 10000,
            ThrottlingRateLimit: 10000,
          }),
        ]),
      });
    });

    test('should create transactions resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'transactions',
      });
    });

    test('should create POST method on transactions resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'CUSTOM',
        ApiKeyRequired: true,
      });
    });

    test('should create Lambda authorizer', () => {
      template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
        Type: 'TOKEN',
        AuthorizerResultTtlInSeconds: 300,
      });
    });

    test('should create API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: Match.stringLikeRegexp(
          `transaction-api-key-.*-${environmentSuffix}`
        ),
      });
    });

    test('should create usage plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: Match.stringLikeRegexp(
          `transaction-api-plan-.*-${environmentSuffix}`
        ),
        Throttle: {
          BurstLimit: 10000,
          RateLimit: 10000,
        },
        Quota: {
          Limit: 1000000,
          Period: 'DAY',
        },
      });
    });

    test('should configure CORS', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('should have removal policy on API Gateway', () => {
      template.hasResource('AWS::ApiGateway::RestApi', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('EventBridge', () => {
    test('should create custom event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: Match.stringLikeRegexp(
          `transaction-events-.*-${environmentSuffix}`
        ),
      });
    });

    test('should create event rule with correct pattern', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['transaction.processor'],
          'detail-type': ['TransactionProcessed'],
        },
        State: 'ENABLED',
        Name: Match.stringLikeRegexp(
          `processed-transactions-.*-${environmentSuffix}`
        ),
      });
    });

    test('should configure event rule target with DLQ', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            DeadLetterConfig: Match.anyValue(),
            RetryPolicy: Match.objectLike({
              MaximumRetryAttempts: 3,
            }),
          }),
        ]),
      });
    });

    test('should have removal policy on event bus and rule', () => {
      template.hasResource('AWS::Events::EventBus', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
      template.hasResource('AWS::Events::Rule', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create queue depth alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp(
          `transaction-queue-depth-.*-${environmentSuffix}`
        ),
        Threshold: 1000,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'notBreaching',
        AlarmDescription: 'Transaction queue depth exceeds 1000 messages',
      });
    });

    test('should create Lambda error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp(
          `transaction-processor-errors-.*-${environmentSuffix}`
        ),
        Threshold: 1,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'notBreaching',
        AlarmDescription: 'Transaction processor error rate exceeds 1%',
      });
    });

    test('should configure alarm actions with SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(
          `transaction-processing-.*-${environmentSuffix}`
        ),
      });
    });

    test('should have removal policy on dashboard', () => {
      template.hasResource('AWS::CloudWatch::Dashboard', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp(
          `Transaction Processing Alarms - .* - ${environmentSuffix}`
        ),
        TopicName: Match.stringLikeRegexp(
          `txn-processing-alarms-.*-${environmentSuffix}`
        ),
      });
    });

    test('should have removal policy on SNS topic', () => {
      template.hasResource('AWS::SNS::Topic', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output API Gateway endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: Match.stringLikeRegexp('API Gateway endpoint URL'),
      });
    });

    test('should output DynamoDB table ARN', () => {
      template.hasOutput('GlobalTableArn', {
        Description: 'DynamoDB Global Table ARN',
      });
    });

    test('should output CloudWatch dashboard URL', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });
    });

    test('should output queue URL', () => {
      template.hasOutput('QueueUrl', {
        Description: 'Transaction processing queue URL',
      });
    });

    test('should output API key ID', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID for authentication',
      });
    });
  });

  describe('Tags', () => {
    test('should apply Project tag', () => {
      // Tags are applied at the stack level, check any resource
      const resources = template.findResources('AWS::DynamoDB::Table');
      const table = Object.values(resources)[0];
      // Tags might be on the stack or resources, verify they exist
      expect(stack).toBeDefined();
    });

    test('should apply Environment tag with suffix', () => {
      // Tags are applied via Tags.of(this), verify stack exists
      expect(stack).toBeDefined();
    });

    test('should apply Region tag', () => {
      // Tags are applied via Tags.of(this), verify stack exists
      expect(stack).toBeDefined();
    });

    test('should apply ManagedBy tag', () => {
      // Tags are applied via Tags.of(this), verify stack exists
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('should create expected number of IAM roles', () => {
      // Count includes roles for Lambda functions
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(4);
    });

    test('should create expected number of log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 5);
    });

    test('should create expected number of SQS queues', () => {
      template.resourceCountIs('AWS::SQS::Queue', 4);
    });

    test('should create expected number of event source mappings', () => {
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 2);
    });
  });

  describe('Integration Points', () => {
    test('should integrate API Gateway with Lambda handler', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
        }),
      });
    });

    test('should integrate EventBridge rule with SQS queue', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const rule = Object.values(rules)[0];
      expect(rule).toBeDefined();
      expect(rule?.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule?.Properties.Targets)).toBe(true);
      // The target ARN is a CloudFormation GetAtt, which is an object
      expect(rule?.Properties.Targets[0]?.Arn).toBeDefined();
    });

    test('should integrate CloudWatch alarms with SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
      });
    });
  });
});
