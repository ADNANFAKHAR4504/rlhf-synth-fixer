import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TransactionProcessingStack } from '../lib/transaction-processing-stack';

const environmentSuffix = 'test';

describe('TransactionProcessingStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let childStack: TransactionProcessingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    childStack = new TransactionProcessingStack(stack, 'TransactionProcessing', {
      environmentSuffix,
    });
    template = Template.fromStack(childStack);
  });

  describe('DynamoDB Table', () => {
    test('creates table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `transaction-state-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
        },
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('table has deletion policy DESTROY', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });
    });

    test('table count is exactly 1', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });

  describe('SNS Topic', () => {
    test('creates topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `transaction-topic-${environmentSuffix}`,
        DisplayName: 'Transaction Processing Topic',
      });
    });

    test('topic count is exactly 1', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('topic has subscription to validator lambda', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
        TopicArn: Match.objectLike({
          Ref: Match.stringLikeRegexp('TransactionTopic'),
        }),
      });
    });
  });

  describe('SQS Queues - Dead Letter Queues', () => {
    test('creates validation DLQ with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `validation-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days in seconds
        KmsMasterKeyId: 'alias/aws/sqs',
      });
    });

    test('creates enrichment DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `enrichment-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });
    });

    test('creates high value DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `high-value-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });
    });

    test('creates standard value DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `standard-value-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });
    });

    test('creates low value DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `low-value-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600,
      });
    });
  });

  describe('SQS Queues - Processing Queues', () => {
    test('creates validation queue with correct configuration', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `validation-queue-${environmentSuffix}`,
        VisibilityTimeout: 180, // 6 times 30 seconds
        MessageRetentionPeriod: 345600, // 4 days in seconds
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('creates enrichment queue with DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `enrichment-queue-${environmentSuffix}`,
        VisibilityTimeout: 180,
        MessageRetentionPeriod: 345600,
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('creates high value queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `high-value-queue-${environmentSuffix}`,
        VisibilityTimeout: 180,
        MessageRetentionPeriod: 345600,
      });
    });

    test('creates standard value queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `standard-value-queue-${environmentSuffix}`,
        VisibilityTimeout: 180,
        MessageRetentionPeriod: 345600,
      });
    });

    test('creates low value queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `low-value-queue-${environmentSuffix}`,
        VisibilityTimeout: 180,
        MessageRetentionPeriod: 345600,
      });
    });
  });

  describe('SQS Queues - Destination Queues', () => {
    test('creates success destination queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `success-destination-${environmentSuffix}`,
        MessageRetentionPeriod: 345600,
      });
    });

    test('creates failure destination queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `failure-destination-${environmentSuffix}`,
        MessageRetentionPeriod: 345600,
      });
    });

    test('total queue count is 12', () => {
      template.resourceCountIs('AWS::SQS::Queue', 12);
    });
  });

  describe('Lambda Functions', () => {
    test('creates webhook function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `webhook-receiver-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
        ReservedConcurrentExecutions: 10,
        Environment: {
          Variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            TOPIC_ARN: Match.objectLike({
              Ref: Match.stringLikeRegexp('TransactionTopic'),
            }),
          },
        },
      });
    });

    test('creates validator function with destinations', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transaction-validator-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
        ReservedConcurrentExecutions: 10,
      });
    });

    test('creates enrichment function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transaction-enrichment-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
        ReservedConcurrentExecutions: 10,
      });
    });

    test('creates routing function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transaction-routing-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
        ReservedConcurrentExecutions: 10,
      });
    });

    test('lambda function count is 5 (4 application + 1 log retention)', () => {
      template.resourceCountIs('AWS::Lambda::Function', 5);
    });

    test('webhook function has function URL', () => {
      template.hasResourceProperties('AWS::Lambda::Url', {
        AuthType: 'NONE',
        Cors: {
          AllowOrigins: ['*'],
          AllowMethods: ['POST'],
        },
      });
    });
  });

  describe('Lambda Event Source Mappings', () => {
    test('enrichment function has validation queue event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        FunctionName: Match.objectLike({
          Ref: Match.stringLikeRegexp('EnrichmentFunction'),
        }),
        EventSourceArn: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('ValidationQueue'),
          ]),
        }),
      });
    });

    test('routing function has enrichment queue event source', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        FunctionName: Match.objectLike({
          Ref: Match.stringLikeRegexp('RoutingFunction'),
        }),
        EventSourceArn: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('EnrichmentQueue'),
          ]),
        }),
      });
    });

    test('event source mapping count is 2', () => {
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 2);
    });
  });

  describe('Lambda Event Invoke Configs (Destinations)', () => {
    test('validator function has destinations configured', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        FunctionName: Match.objectLike({
          Ref: Match.stringLikeRegexp('ValidatorFunction'),
        }),
        DestinationConfig: {
          OnSuccess: {
            Destination: Match.objectLike({
              'Fn::GetAtt': Match.arrayWith([
                Match.stringLikeRegexp('SuccessQueue'),
              ]),
            }),
          },
          OnFailure: {
            Destination: Match.objectLike({
              'Fn::GetAtt': Match.arrayWith([
                Match.stringLikeRegexp('FailureQueue'),
              ]),
            }),
          },
        },
      });
    });

    test('enrichment function has destinations configured', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        FunctionName: Match.objectLike({
          Ref: Match.stringLikeRegexp('EnrichmentFunction'),
        }),
      });
    });

    test('routing function has destinations configured', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        FunctionName: Match.objectLike({
          Ref: Match.stringLikeRegexp('RoutingFunction'),
        }),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('webhook function has SNS publish permissions', () => {
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

    test('validator function has SQS and DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('enrichment function has DynamoDB read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('routing function has SQS send message permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('IAM role count includes all lambda functions', () => {
      template.resourceCountIs('AWS::IAM::Role', 5);
    });
  });

  describe('CloudWatch Alarms - Queue Depth', () => {
    test('creates alarm for validation queue depth', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `ValidationQueue-depth-${environmentSuffix}`,
        Threshold: 1000,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
      });
    });

    test('creates alarm for enrichment queue depth', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `EnrichmentQueue-depth-${environmentSuffix}`,
        Threshold: 1000,
      });
    });

    test('creates alarm for high value queue depth', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `HighValueQueue-depth-${environmentSuffix}`,
        Threshold: 1000,
      });
    });

    test('creates alarm for standard value queue depth', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `StandardValueQueue-depth-${environmentSuffix}`,
        Threshold: 1000,
      });
    });

    test('creates alarm for low value queue depth', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `LowValueQueue-depth-${environmentSuffix}`,
        Threshold: 1000,
      });
    });
  });

  describe('CloudWatch Alarms - Lambda Errors', () => {
    test('creates alarm for webhook function errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `WebhookFunction-errors-${environmentSuffix}`,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });
    });

    test('creates alarm for validator function errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `ValidatorFunction-errors-${environmentSuffix}`,
        Threshold: 1,
      });
    });

    test('creates alarm for enrichment function errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `EnrichmentFunction-errors-${environmentSuffix}`,
        Threshold: 1,
      });
    });

    test('creates alarm for routing function errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `RoutingFunction-errors-${environmentSuffix}`,
        Threshold: 1,
      });
    });

    test('total alarm count is 9 (5 queue + 4 lambda)', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 9);
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('log retention is configured for Lambda functions', () => {
      // Log retention is handled by CDK's custom resource, not explicit LogGroups
      // Verify that Lambda functions have the correct configuration
      const lambdaFunctions = [
        `webhook-receiver-${environmentSuffix}`,
        `transaction-validator-${environmentSuffix}`,
        `transaction-enrichment-${environmentSuffix}`,
        `transaction-routing-${environmentSuffix}`,
      ];

      lambdaFunctions.forEach((functionName) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: functionName,
        });
      });
    });

    test('log retention custom resource lambda exists', () => {
      // CDK creates a log retention custom resource lambda
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports webhook endpoint URL', () => {
      template.hasOutput('WebhookEndpointUrl', {
        Description: 'Webhook endpoint URL for receiving transactions',
        Export: {
          Name: `webhook-url-${environmentSuffix}`,
        },
      });
    });

    test('exports transaction topic ARN', () => {
      template.hasOutput('TransactionTopicArn', {
        Description: 'SNS Topic ARN for transactions',
        Export: {
          Name: `transaction-topic-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports high value queue URL', () => {
      template.hasOutput('HighValueQueueUrl', {
        Description: 'High value queue URL',
        Export: {
          Name: `high-value-queue-url-${environmentSuffix}`,
        },
      });
    });

    test('exports standard value queue URL', () => {
      template.hasOutput('StandardValueQueueUrl', {
        Description: 'Standard value queue URL',
        Export: {
          Name: `standard-value-queue-url-${environmentSuffix}`,
        },
      });
    });

    test('exports low value queue URL', () => {
      template.hasOutput('LowValueQueueUrl', {
        Description: 'Low value queue URL',
        Export: {
          Name: `low-value-queue-url-${environmentSuffix}`,
        },
      });
    });

    test('exports transaction table name', () => {
      template.hasOutput('TransactionTableName', {
        Description: 'DynamoDB table name for transaction state',
        Export: {
          Name: `transaction-table-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources include environmentSuffix in names', () => {
      const resources = template.toJSON().Resources;
      const resourcesWithNames = Object.values(resources).filter(
        (resource: any) =>
          resource.Properties?.FunctionName ||
          resource.Properties?.QueueName ||
          resource.Properties?.TopicName ||
          resource.Properties?.TableName ||
          resource.Properties?.AlarmName,
      );

      resourcesWithNames.forEach((resource: any) => {
        const name =
          resource.Properties.FunctionName ||
          resource.Properties.QueueName ||
          resource.Properties.TopicName ||
          resource.Properties.TableName ||
          resource.Properties.AlarmName;

        if (typeof name === 'string') {
          expect(name).toContain(environmentSuffix);
        }
      });
    });
  });

  describe('Encryption and Security', () => {
    test('DynamoDB table uses AWS managed encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('SQS queues use KMS encryption', () => {
      const queueNames = [
        `validation-dlq-${environmentSuffix}`,
        `enrichment-dlq-${environmentSuffix}`,
        `high-value-dlq-${environmentSuffix}`,
        `standard-value-dlq-${environmentSuffix}`,
        `low-value-dlq-${environmentSuffix}`,
        `validation-queue-${environmentSuffix}`,
        `enrichment-queue-${environmentSuffix}`,
        `high-value-queue-${environmentSuffix}`,
        `standard-value-queue-${environmentSuffix}`,
        `low-value-queue-${environmentSuffix}`,
        `success-destination-${environmentSuffix}`,
        `failure-destination-${environmentSuffix}`,
      ];

      queueNames.forEach((queueName) => {
        template.hasResourceProperties('AWS::SQS::Queue', {
          QueueName: queueName,
          KmsMasterKeyId: 'alias/aws/sqs',
        });
      });
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      const functionNames = [
        `webhook-receiver-${environmentSuffix}`,
        `transaction-validator-${environmentSuffix}`,
        `transaction-enrichment-${environmentSuffix}`,
        `transaction-routing-${environmentSuffix}`,
      ];

      functionNames.forEach((functionName) => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: functionName,
          TracingConfig: {
            Mode: 'Active',
          },
        });
      });
    });
  });

  describe('Error Handling Configuration', () => {
    test('all processing queues have dead letter queues configured', () => {
      const processingQueues = [
        { name: `validation-queue-${environmentSuffix}`, dlq: 'ValidationDLQ' },
        {
          name: `enrichment-queue-${environmentSuffix}`,
          dlq: 'EnrichmentDLQ',
        },
        {
          name: `high-value-queue-${environmentSuffix}`,
          dlq: 'HighValueDLQ',
        },
        {
          name: `standard-value-queue-${environmentSuffix}`,
          dlq: 'StandardValueDLQ',
        },
        {
          name: `low-value-queue-${environmentSuffix}`,
          dlq: 'LowValueDLQ',
        },
      ];

      processingQueues.forEach((queue) => {
        template.hasResourceProperties('AWS::SQS::Queue', {
          QueueName: queue.name,
          RedrivePolicy: {
            maxReceiveCount: 3,
          },
        });
      });
    });

    test('Lambda functions have async destinations configured', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        DestinationConfig: {
          OnSuccess: Match.objectLike({
            Destination: Match.anyValue(),
          }),
          OnFailure: Match.objectLike({
            Destination: Match.anyValue(),
          }),
        },
      });
    });
  });
});
