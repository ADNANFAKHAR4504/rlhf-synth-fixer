import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('should use props environmentSuffix when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'shipments-test',
      });
    });

    test('should use context environmentSuffix when props not provided', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'staging' } });
      const testStack = new TapStack(testApp, 'TestStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'shipments-staging',
      });
    });

    test('should default to dev when no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'shipments-dev',
      });
    });

    test('should default to dev when props is undefined', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'shipments-dev',
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('should create shipments table with streams enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `shipments-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        KeySchema: [
          { AttributeName: 'shipmentId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('should create connections table with TTL enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `connections-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
        KeySchema: [{ AttributeName: 'connectionId', KeyType: 'HASH' }],
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create status update lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `status-update-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should create stream processor lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `stream-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 60,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should create websocket handler lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `websocket-handler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `shipment-tracking-api-${environmentSuffix}`,
        Description: 'API for shipment status updates',
      });
    });

    test('should create WebSocket API', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: `shipment-tracking-ws-${environmentSuffix}`,
        ProtocolType: 'WEBSOCKET',
      });
    });

    test('should create WebSocket routes', () => {
      template.resourceCountIs('AWS::ApiGatewayV2::Route', 3);
    });
  });

  describe('SNS and SQS', () => {
    test('should create SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `shipment-notifications-${environmentSuffix}`,
        DisplayName: 'Shipment Status Notifications',
      });
    });

    test('should create SQS queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `shipment-notifications-${environmentSuffix}`,
        VisibilityTimeout: 300,
      });
    });

    test('should subscribe SQS to SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'sqs',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket for failure destination', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const hasBucket = Object.values(buckets).some((bucket: any) => {
        const bucketName = bucket.Properties?.BucketName;
        if (typeof bucketName === 'object' && bucketName['Fn::Join']) {
          const parts = bucketName['Fn::Join'][1];
          return parts.some((part: any) => part.includes && part.includes('shipment-tracking-failures'));
        }
        return bucketName && bucketName.includes('shipment-tracking-failures');
      });
      expect(hasBucket).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create queue depth alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `shipment-queue-depth-${environmentSuffix}`,
        Threshold: 100,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create SNS failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `shipment-sns-failures-${environmentSuffix}`,
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });
  });

  describe('DynamoDB Stream Event Source', () => {
    test('should create event source mapping for stream processor', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 100,
        BisectBatchOnFunctionError: true,
        MaximumRetryAttempts: 3,
        StartingPosition: 'LATEST',
      });
    });
  });

  describe('IAM Permissions', () => {
    test('should grant DynamoDB write permissions to status update function', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasDynamoPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (statement: any) =>
            statement.Action?.some &&
            (statement.Action.some((action: string) => action.includes('dynamodb')) ||
             statement.Action === 'dynamodb:*')
        );
      });
      expect(hasDynamoPolicy).toBe(true);
    });

    test('should grant SNS publish permissions to status update function', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasSnsPublishPolicy = Object.values(policies).some(
        (policy: any) => {
          const statements = policy.Properties?.PolicyDocument?.Statement || [];
          return statements.some(
            (statement: any) =>
              statement.Action?.includes('sns:Publish') ||
              statement.Action === 'sns:Publish'
          );
        }
      );
      expect(hasSnsPublishPolicy).toBe(true);
    });

    test('should grant execute-api:ManageConnections to stream processor', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasManageConnectionsPolicy = Object.values(policies).some(
        (policy: any) => {
          const statements = policy.Properties?.PolicyDocument?.Statement || [];
          return statements.some(
            (statement: any) =>
              statement.Action?.includes('execute-api:ManageConnections') ||
              statement.Action === 'execute-api:ManageConnections'
          );
        }
      );
      expect(hasManageConnectionsPolicy).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    test('should export REST API URL', () => {
      template.hasOutput('RestApiUrl', {
        Export: {
          Name: `RestApiUrl-${environmentSuffix}`,
        },
      });
    });

    test('should export WebSocket API URL', () => {
      template.hasOutput('WebSocketApiUrl', {
        Export: {
          Name: `WebSocketApiUrl-${environmentSuffix}`,
        },
      });
    });

    test('should export Shipments Table Name', () => {
      template.hasOutput('ShipmentsTableName', {
        Export: {
          Name: `ShipmentsTableName-${environmentSuffix}`,
        },
      });
    });

    test('should export Notification Topic ARN', () => {
      template.hasOutput('NotificationTopicArn', {
        Export: {
          Name: `NotificationTopicArn-${environmentSuffix}`,
        },
      });
    });

    test('should export Notification Queue URL', () => {
      template.hasOutput('NotificationQueueUrl', {
        Export: {
          Name: `NotificationQueueUrl-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of Lambda functions', () => {
      // 3 application lambdas + 1 custom resource lambda for S3 auto-delete
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('should create expected number of DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 2);
    });

    test('should create expected number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });
});
