import { Match, Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: Template;

  beforeEach(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const templateJson = JSON.parse(templateContent);
    template = Template.fromJSON(templateJson);
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      template.hasParameter('EnvironmentSuffix', {
        Type: 'String',
        Default: 'dev',
        Description: Match.stringLikeRegexp('Environment suffix'),
        AllowedPattern: '^[a-zA-Z0-9]+$',
      });
    });
  });

  describe('SQS Queues', () => {
    test('should create PaymentDLQ with correct properties', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.objectLike({
          'Fn::Sub': Match.stringLikeRegexp('payment-dlq-'),
        }),
        MessageRetentionPeriod: 1209600,
        SqsManagedSseEnabled: true,
      });
    });

    test('should create PaymentQueue with visibility timeout and redrive policy', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.objectLike({
          'Fn::Sub': Match.stringLikeRegexp('payment-queue-'),
        }),
        VisibilityTimeout: 1800,
        SqsManagedSseEnabled: true,
        RedrivePolicy: Match.objectLike({
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        }),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create PaymentTransactionsTable with PAY_PER_REQUEST billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.objectLike({
          'Fn::Sub': Match.stringLikeRegexp('PaymentTransactions-'),
        }),
        AttributeDefinitions: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'transactionId',
            AttributeType: 'S',
          }),
        ]),
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          }),
        ]),
        BillingMode: 'PAY_PER_REQUEST',
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create PaymentProcessorFunction with Python 3.12 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.objectLike({
          'Fn::Sub': Match.stringLikeRegexp('payment-processor-'),
        }),
        Runtime: 'python3.12',
        Handler: 'index.lambda_handler',
        MemorySize: 1024,
        Timeout: 300,
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            DYNAMODB_TABLE_NAME: Match.anyValue(),
            AWS_REGION_NAME: Match.anyValue(),
          }),
        }),
      });
    });

    test('should have inline code with lambda_handler function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: Match.objectLike({
          ZipFile: Match.stringLikeRegexp('lambda_handler'),
        }),
      });
    });
  });

  describe('IAM Role', () => {
    test('should create PaymentProcessorRole with Lambda assume role policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.objectLike({
          'Fn::Sub': Match.stringLikeRegexp('payment-processor-role-'),
        }),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });

    test('should have SQS permissions in policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ]),
                  Resource: Match.anyValue(),
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('should have DynamoDB permissions in policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                  ]),
                  Resource: Match.anyValue(),
                }),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should create log group with 30-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.objectLike({
          'Fn::Sub': Match.stringLikeRegexp('/aws/lambda/payment-processor-'),
        }),
        RetentionInDays: 30,
      });
    });
  });

  describe('Lambda Event Source Mapping', () => {
    test('should create event source mapping for SQS', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        Enabled: true,
      });
    });
  });

  describe('Outputs', () => {
    test('should export PaymentQueueUrl', () => {
      template.hasOutput('PaymentQueueUrl', {
        Value: Match.anyValue(),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': Match.stringLikeRegexp('PaymentQueueUrl'),
          }),
        }),
      });
    });

    test('should export PaymentProcessorFunctionArn', () => {
      template.hasOutput('PaymentProcessorFunctionArn', {
        Value: Match.anyValue(),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': Match.stringLikeRegexp('PaymentProcessorFunctionArn'),
          }),
        }),
      });
    });

    test('should export PaymentTransactionsTableName', () => {
      template.hasOutput('PaymentTransactionsTableName', {
        Value: Match.anyValue(),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': Match.stringLikeRegexp('PaymentTransactionsTableName'),
          }),
        }),
      });
    });
  });
});