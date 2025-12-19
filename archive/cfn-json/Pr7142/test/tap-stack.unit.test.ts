import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const defaultProps = {
    environmentSuffix: 'test',
    environmentName: 'staging',
    isPrimaryRegion: true,
    secondaryRegion: 'us-west-2',
    alertEmail: 'test@example.com',
    hostedZoneName: 'test.payment-system-demo.com',
    lambdaReservedConcurrency: 50,
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', defaultProps);
    template = Template.fromStack(stack);
  });

  test('should create DynamoDB Global Table with correct properties', () => {
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      TableName: 'payment-transactions-test',
      BillingMode: 'PAY_PER_REQUEST',
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
    });

    // Check attribute definitions
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      AttributeDefinitions: [
        { AttributeName: 'transactionId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'N' },
        { AttributeName: 'customerId', AttributeType: 'S' },
      ],
    });

    // Check key schema
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      KeySchema: [
        { AttributeName: 'transactionId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
    });

    // Check GSI
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CustomerIndex',
          KeySchema: [
            { AttributeName: 'customerId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    });
  });

  test('should create S3 bucket for transaction logs in primary region', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: {
        'Fn::Join': [
          '',
          [
            'transaction-logs-',
            { 'Ref': 'AWS::Region' },
            '-test',
          ],
        ],
      },
      VersioningConfiguration: { Status: 'Enabled' },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
        ],
      },
    });
  });

  test('should create IAM role for S3 replication', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 's3-replication-role-test',
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });
  });

  test('should create Secrets Manager secret', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'payment-api-keys-test',
      Description: 'API keys for payment processing gateway',
      ReplicaRegions: [{ Region: 'us-west-2' }],
    });
  });

  test('should create Lambda execution role with correct policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'payment-lambda-role-test',
      ManagedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
    });

    // Check that it has DynamoDB access policy
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'payment-lambda-role-test',
      ManagedPolicyArns: ['arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'],
      Policies: [
        {
          PolicyName: 'DynamoDBAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:Query',
                  'dynamodb:UpdateItem',
                  'dynamodb:BatchWriteItem',
                ],
                Resource: [
                  { 'Fn::GetAtt': ['PaymentProcessingTable', 'Arn'] },
                  {
                    'Fn::Sub': {
                      'Fn::Join': [
                        '',
                        [
                          { 'Fn::GetAtt': ['PaymentProcessingTable', 'Arn'] },
                          '/index/*',
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          PolicyName: 'SecretsManagerAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
                Resource: { Ref: 'ApiSecret' },
              },
            ],
          },
        },
        {
          PolicyName: 'S3LogAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: {
                  'Fn::Join': [
                    '',
                    [{ 'Fn::GetAtt': ['TransactionLogsBucket', 'Arn'] }, '/*'],
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });

  test('should create payment processing Lambda function with correct configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'payment-processor-test',
      Runtime: 'python3.11',
      Handler: 'index.lambda_handler',
      Timeout: 30,
      MemorySize: 512,
      ReservedConcurrentExecutions: 50,
    });

    // Check environment variables
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          REGION: { Ref: 'AWS::Region' },
          ENVIRONMENT: 'staging',
          TABLE_NAME: { Ref: 'PaymentProcessingTable' },
          SECRET_ARN: { Ref: 'ApiSecret' },
          LOGS_BUCKET: { Ref: 'TransactionLogsBucket' },
          IS_PRIMARY: 'true',
        },
      },
    });
  });

  test('should create health check Lambda function', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'health-check-test',
      Runtime: 'python3.11',
      Handler: 'index.lambda_handler',
      Timeout: 10,
      MemorySize: 256,
    });
  });

  test('should create Lambda function URLs', () => {
    template.hasResourceProperties('AWS::Lambda::Url', {
      AuthType: 'NONE',
      Cors: {
        AllowOrigins: ['*'],
        AllowMethods: ['POST'],
        AllowHeaders: ['Content-Type'],
      },
    });

    template.hasResourceProperties('AWS::Lambda::Url', {
      AuthType: 'NONE',
    });
  });

  test('should create Route 53 hosted zone in primary region', () => {
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'test.payment-system-demo.com',
      HostedZoneConfig: {
        Comment: 'Hosted zone for multi-region payment processing system',
      },
    });
  });

  test('should create Route 53 health check', () => {
    template.hasResourceProperties('AWS::Route53::HealthCheck', {
      HealthCheckConfig: {
        Type: 'HTTPS',
        ResourcePath: '/',
        Port: 443,
        RequestInterval: 30,
        FailureThreshold: 3,
      },
    });
  });

  test('should create Route 53 DNS record', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: { 'Fn::Sub': 'api.test.payment-system-demo.com' },
      Type: 'CNAME',
      SetIdentifier: {
        'Fn::Sub': {
          'Fn::Join': [
            '',
            [
              { 'Ref': 'AWS::Region' },
              '-endpoint',
            ],
          ],
        },
      },
      Weight: 100,
      TTL: '60',
    });
  });

  test('should create SNS topic for alerts', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'payment-alerts-test',
      DisplayName: 'Payment Processing Alerts',
      Subscription: [
        {
          Endpoint: 'test@example.com',
          Protocol: 'email',
        },
      ],
    });
  });

  test('should create CloudWatch alarms', () => {
    // Lambda error alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'lambda-errors-test',
      AlarmDescription: 'Alert when Lambda function errors exceed threshold',
      MetricName: 'Errors',
      Namespace: 'AWS/Lambda',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 10,
      ComparisonOperator: 'GreaterThanThreshold',
    });

    // Lambda throttle alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'lambda-throttles-test',
      AlarmDescription: 'Alert when Lambda function is throttled',
      MetricName: 'Throttles',
      Namespace: 'AWS/Lambda',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 1,
      Threshold: 5,
      ComparisonOperator: 'GreaterThanThreshold',
    });

    // DynamoDB read throttle alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'dynamodb-read-throttle-test',
      AlarmDescription: 'Alert when DynamoDB read capacity is throttled',
      MetricName: 'ReadThrottleEvents',
      Namespace: 'AWS/DynamoDB',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 10,
      ComparisonOperator: 'GreaterThanThreshold',
    });

    // DynamoDB write throttle alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'dynamodb-write-throttle-test',
      AlarmDescription: 'Alert when DynamoDB write capacity is throttled',
      MetricName: 'WriteThrottleEvents',
      Namespace: 'AWS/DynamoDB',
      Statistic: 'Sum',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 10,
      ComparisonOperator: 'GreaterThanThreshold',
    });

    // S3 replication latency alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 's3-replication-latency-test',
      AlarmDescription: 'Alert when S3 replication latency exceeds 15 minutes',
      MetricName: 'ReplicationLatency',
      Namespace: 'AWS/S3',
      Statistic: 'Maximum',
      Period: 900,
      EvaluationPeriods: 1,
      Threshold: 900,
      ComparisonOperator: 'GreaterThanThreshold',
    });
  });

  test('should create all required outputs', () => {
    const outputs = template.findOutputs('*');

    expect(outputs).toHaveProperty('DynamoDBTableName');
    expect(outputs).toHaveProperty('DynamoDBTableArn');
    expect(outputs).toHaveProperty('S3BucketName');
    expect(outputs).toHaveProperty('S3BucketArn');
    expect(outputs).toHaveProperty('LambdaFunctionArn');
    expect(outputs).toHaveProperty('LambdaFunctionUrl');
    expect(outputs).toHaveProperty('HealthCheckUrlOutput');
    expect(outputs).toHaveProperty('SecretArn');
    expect(outputs).toHaveProperty('SNSTopicArn');
    expect(outputs).toHaveProperty('HostedZoneId');
    expect(outputs).toHaveProperty('HealthCheckId');
  });

  test('should create resources with correct tags', () => {
    template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
      Replicas: [
        {
          Region: 'us-east-1',
          Tags: [
            { Key: 'Environment', Value: 'staging' },
            { Key: 'Region', Value: 'us-east-1' },
            { Key: 'Service', Value: 'PaymentProcessing' },
          ],
        },
        {
          Region: 'us-west-2',
          Tags: [
            { Key: 'Environment', Value: 'staging' },
            { Key: 'Region', Value: 'us-west-2' },
            { Key: 'Service', Value: 'PaymentProcessing' },
          ],
        },
      ],
    });
  });

  test('should use default values when optional props not provided', () => {
    const minimalApp = new cdk.App();
    const minimalStack = new TapStack(minimalApp, 'MinimalStack', {
      environmentSuffix: 'minimal',
      alertEmail: 'minimal@example.com',
    });
    const minimalTemplate = Template.fromStack(minimalStack);

    minimalTemplate.hasResourceProperties('AWS::Lambda::Function', {
      ReservedConcurrentExecutions: 100, // default value
    });

    minimalTemplate.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'payment-system-demo.com', // default value
    });
  });

  test('should create Lambda permissions for function URLs', () => {
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunctionUrl',
      Principal: '*',
      FunctionUrlAuthType: 'NONE',
    });

    // Should have two permissions (one for each function)
    template.resourceCountIs('AWS::Lambda::Permission', 2);
  });

  test('should configure S3 lifecycle rules correctly', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'TransitionToIA',
            Status: 'Enabled',
            Transitions: [
              { TransitionInDays: 30, StorageClass: 'STANDARD_IA' },
              { TransitionInDays: 90, StorageClass: 'GLACIER' },
            ],
          },
        ],
      },
    });
  });
});
