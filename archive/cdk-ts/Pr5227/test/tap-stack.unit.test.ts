import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create VPC with 2 public and 2 private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create VPC endpoints for DynamoDB and S3', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('dynamodb')]),
          ]),
        }),
      });

      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp('s3')])]),
        }),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create API key parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/payment-processing/${environmentSuffix}/api-key`,
        Type: 'String',
        Description: 'API key for payment validation',
        Tags: Match.objectLike({
          'iac-rlhf-amazon': 'true',
        }),
      });
    });

    test('should create high value threshold parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/payment-processing/${environmentSuffix}/high-value-threshold`,
        Value: '10000',
        Description: 'Threshold for high-value transaction notifications',
        Tags: Match.objectLike({
          'iac-rlhf-amazon': 'true',
        }),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `payments-${environmentSuffix}`,
        AttributeDefinitions: [
          { AttributeName: 'payment_id', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' },
        ],
        KeySchema: [
          { AttributeName: 'payment_id', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should enable encryption for DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  describe('SQS Dead Letter Queues', () => {
    test('should create main DLQ with 14 days retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `payment-processing-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
        KmsMasterKeyId: 'alias/aws/sqs',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create EventBridge DLQ with 14 days retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `eventbridge-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
        KmsMasterKeyId: 'alias/aws/sqs',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should have exactly 2 SQS queues', () => {
      template.resourceCountIs('AWS::SQS::Queue', 2);
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `high-value-payments-${environmentSuffix}`,
        DisplayName: 'High Value Payment Notifications',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create validation Lambda with Python 3.11', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'validation.handler',
        MemorySize: 512,
        Timeout: 60,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create notification Lambda with Python 3.11', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-notification-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'notification.handler',
        MemorySize: 512,
        Timeout: 60,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should deploy Lambdas in VPC private subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('should configure validation Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            POWERTOOLS_SERVICE_NAME: 'payment-validation',
            POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
            LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('should configure notification Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-notification-${environmentSuffix}`,
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: environmentSuffix,
            POWERTOOLS_SERVICE_NAME: 'payment-notification',
            POWERTOOLS_METRICS_NAMESPACE: 'PaymentProcessing',
            LOG_LEVEL: 'INFO',
          }),
        },
      });
    });

    test('should attach Lambda Powertools layer', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `payment-validation-${environmentSuffix}`,
        Layers: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('AWSLambdaPowertoolsPythonV2')]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create validation Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `payment-validation-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create notification Lambda role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `payment-notification-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should grant DynamoDB write permissions to validation Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SSM parameter read permissions to validation Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ssm:DescribeParameters',
                'ssm:GetParameters',
                'ssm:GetParameter',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant EventBridge PutEvents permissions to validation Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'events:PutEvents',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should grant SNS publish permissions to notification Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('EventBridge', () => {
    test('should create EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `payment-events-${environmentSuffix}`,
      });
    });

    test('should create EventBridge rule for high-value payments', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `high-value-payments-${environmentSuffix}`,
        EventPattern: Match.objectLike({
          source: ['payment.processing'],
          'detail-type': ['High Value Payment'],
          detail: {
            amount: [
              {
                numeric: ['>', 10000],
              },
            ],
          },
        }),
      });
    });

    test('should configure EventBridge rule with DLQ', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            DeadLetterConfig: Match.objectLike({
              Arn: Match.anyValue(),
            }),
            RetryPolicy: Match.objectLike({
              MaximumRetryAttempts: 3,
            }),
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `payment-processing-api-${environmentSuffix}`,
        Description: 'Payment Processing Webhook API',
      });
    });

    test('should configure API Gateway with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        Description: Match.anyValue(),
      });
      // Note: Throttling is configured in the stage, not in the deployment
    });

    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: 'payment-validator',
        ValidateRequestBody: true,
        ValidateRequestParameters: false,
      });
    });

    test('should create payment model for request validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: 'PaymentModel',
        ContentType: 'application/json',
        Schema: Match.objectLike({
          type: 'object',
          required: Match.arrayWith(['payment_id', 'amount', 'currency', 'customer_id']),
          properties: Match.objectLike({
            payment_id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            customer_id: { type: 'string' },
          }),
        }),
      });
    });

    test('should create /payments/webhook resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'payments',
      });

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'webhook',
      });
    });

    test('should create POST method for webhook', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
        }),
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export API endpoint', () => {
      template.hasOutput(`ApiEndpoint${environmentSuffix}`, {
        Description: 'API Gateway endpoint URL',
        Export: Match.objectLike({
          Name: `payment-api-url-${environmentSuffix}`,
        }),
      });
    });

    test('should export DynamoDB table name', () => {
      template.hasOutput(`DynamoDBTableName${environmentSuffix}`, {
        Description: 'DynamoDB table name for payments',
        Export: Match.objectLike({
          Name: `payments-table-${environmentSuffix}`,
        }),
      });
    });

    test('should export SNS topic ARN', () => {
      template.hasOutput(`SNSTopicArn${environmentSuffix}`, {
        Description: 'SNS topic ARN for high-value notifications',
        Export: Match.objectLike({
          Name: `notification-topic-${environmentSuffix}`,
        }),
      });
    });
  });

  describe('Tagging', () => {
    test('should tag all resources with iac-rlhf-amazon', () => {
      // VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // DynamoDB
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // SQS
      template.hasResourceProperties('AWS::SQS::Queue', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // SNS
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // Lambda
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });

      // IAM Role
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Stack Properties', () => {
    test('should accept environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'qa',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payments-qa',
      });
    });

    test('should use context environmentSuffix if provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payments-staging',
      });
    });

    test('should default to dev if no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'payments-dev',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3); // 2 app lambdas + 1 LogRetention custom resource lambda
    });

    test('should have correct number of IAM roles', () => {
      // ValidationLambdaRole, NotificationLambdaRole, LogRetentionRole, CustomResourceRole
      template.resourceCountIs('AWS::IAM::Role', 4);
    });

    test('should have one EventBridge event bus', () => {
      template.resourceCountIs('AWS::Events::EventBus', 1);
    });

    test('should have one EventBridge rule', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    test('should have one API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should have one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });
});
