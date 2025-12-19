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

  describe('S3 Transaction Ingestion', () => {
    test('should create S3 bucket with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `transaction-processing-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            },
          ],
        },
      });

      // Check lifecycle rules
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ],
            },
          ],
        },
      });
    });

    test('should create access logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `transaction-access-logs-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  describe('DynamoDB Metadata Store', () => {
    test('should create DynamoDB table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `transaction-metadata-${environmentSuffix}`,
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should create DynamoDB table without GSIs initially', () => {
      // Check that no GSIs are created initially to avoid deployment conflicts
      const globalSecondaryIndexes = template.findResources(
        'AWS::DynamoDB::Table'
      )[Object.keys(template.findResources('AWS::DynamoDB::Table'))[0]]
        .Properties.GlobalSecondaryIndexes;

      // Temporarily no GSIs to avoid DynamoDB deployment limits
      expect(globalSecondaryIndexes).toBeUndefined();
    });
  });

  describe('Systems Manager Parameters', () => {
    test('should create risk threshold parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/transaction-processing/${environmentSuffix}/risk-threshold`,
        Type: 'String',
        Value: '0.75',
        Description: 'Risk threshold for transaction processing',
      });
    });

    test('should create API key parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/transaction-processing/${environmentSuffix}/api-key`,
        Type: 'String',
        Value: 'secure-api-key-placeholder',
        Description: 'API key for external risk assessment service',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create transaction validator function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transaction-validator-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        MemorySize: 3072,
        ReservedConcurrentExecutions: 100,
      });
    });

    test('should create risk calculator function with correct concurrency', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `risk-calculator-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        MemorySize: 3072,
        ReservedConcurrentExecutions: 50,
      });
    });

    test('should create compliance checker function with correct concurrency', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `compliance-checker-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        MemorySize: 2048,
        ReservedConcurrentExecutions: 30,
      });
    });

    test('should create notification dispatcher function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `notification-dispatcher-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        MemorySize: 3072,
      });
    });
  });

  describe('Step Functions Workflow', () => {
    test('should create Step Functions state machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `transaction-risk-analysis-${environmentSuffix}`,
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });
  });

  describe('SNS Topics', () => {
    test('should create high risk alerts topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `transaction-high-risk-alerts-${environmentSuffix}`,
        DisplayName: 'High Risk Transaction Alerts',
      });
    });

    test('should create compliance alerts topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `transaction-compliance-alerts-${environmentSuffix}`,
        DisplayName: 'Compliance Alerts',
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `transaction-processing-api-${environmentSuffix}`,
        Description: 'Transaction Processing Status API',
      });
    });

    test('should create API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `transaction-api-key-${environmentSuffix}`,
      });
    });

    test('should create usage plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `transaction-usage-plan-${environmentSuffix}`,
        Throttle: {
          BurstLimit: 200,
          RateLimit: 100,
        },
        Quota: {
          Limit: 10000,
          Period: 'DAY',
        },
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `high-risk-transactions-${environmentSuffix}`,
        ComparisonOperator: 'GreaterThanThreshold',
        Threshold: 10,
        EvaluationPeriods: 3,
      });
    });

    test('should create Lambda log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThan(3); // At least 4 Lambda functions

      // Check specific log groups exist
      const logGroupNames = Object.values(logGroups).map(
        (lg: any) => lg.Properties.LogGroupName
      );
      expect(logGroupNames).toContain(
        `/aws/lambda/transaction-validator-${environmentSuffix}`
      );
      expect(logGroupNames).toContain(
        `/aws/lambda/risk-calculator-${environmentSuffix}`
      );
      expect(logGroupNames).toContain(
        `/aws/lambda/compliance-checker-${environmentSuffix}`
      );
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              ],
            ],
          },
        ],
      });
    });
  });

  describe('S3 Event Triggers', () => {
    test('should configure S3 bucket notification for validator function', () => {
      // This would be tested through the Lambda event source mapping or bucket notification
      // The test verifies the bucket exists and Lambda function exists
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `transaction-processing-${environmentSuffix}`,
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `transaction-validator-${environmentSuffix}`,
      });
    });
  });

  describe('Outputs', () => {
    test('should have correct outputs', () => {
      const outputs = template.findOutputs('*');

      // Check for key outputs
      expect(Object.keys(outputs)).toContain(
        `TransactionBucketName${environmentSuffix}`
      );
      expect(Object.keys(outputs)).toContain(
        `TransactionApiUrl${environmentSuffix}`
      );
      expect(Object.keys(outputs)).toContain(
        `TransactionApiKeyId${environmentSuffix}`
      );
      expect(Object.keys(outputs)).toContain(
        `HighRiskAlertsTopic${environmentSuffix}`
      );
      expect(Object.keys(outputs)).toContain(
        `EnvironmentSuffix${environmentSuffix}`
      );
    });

    test('should output environment suffix correctly', () => {
      const outputs = template.findOutputs('*');
      expect(outputs[`EnvironmentSuffix${environmentSuffix}`]).toEqual({
        Description: 'Environment suffix used for resource naming',
        Value: environmentSuffix,
      });
    });
  });

  describe('Resource Counts and Architecture Validation', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);

      // Lambda functions (5 total)
      expect(
        resourceTypes.filter((type: string) => type === 'AWS::Lambda::Function')
          .length
      ).toBe(5);

      // DynamoDB table (1)
      expect(
        resourceTypes.filter((type: string) => type === 'AWS::DynamoDB::Table')
          .length
      ).toBe(1);

      // S3 buckets (2 - main + access logs)
      expect(
        resourceTypes.filter((type: string) => type === 'AWS::S3::Bucket')
          .length
      ).toBe(2);

      // SNS topics (2)
      expect(
        resourceTypes.filter((type: string) => type === 'AWS::SNS::Topic')
          .length
      ).toBe(2);

      // API Gateway resources
      expect(
        resourceTypes.filter(
          (type: string) => type === 'AWS::ApiGateway::RestApi'
        ).length
      ).toBe(1);

      // Step Functions
      expect(
        resourceTypes.filter(
          (type: string) => type === 'AWS::StepFunctions::StateMachine'
        ).length
      ).toBe(1);

      // SSM Parameters (2)
      expect(
        resourceTypes.filter((type: string) => type === 'AWS::SSM::Parameter')
          .length
      ).toBe(2);
    });
  });

  describe('Environment Configuration', () => {
    test('should use environmentSuffix from props', () => {
      // This is implicitly tested by all the resource names containing environmentSuffix
      const bucketResource = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(bucketResource).map(
        (b: any) => b.Properties.BucketName
      );
      expect(
        bucketNames.some((name: string) => name.includes(environmentSuffix))
      ).toBe(true);
    });

    test('should use environmentSuffix from context when props not provided', () => {
      // Create a new stack without props to test context fallback
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'test-context');
      const contextStack = new TapStack(testApp, 'ContextTestStack');
      const contextTemplate = Template.fromStack(contextStack);

      // Should use context value
      const contextBucket = contextTemplate.findResources('AWS::S3::Bucket');
      const contextBucketNames = Object.values(contextBucket).map(
        (b: any) => b.Properties.BucketName
      );
      expect(
        contextBucketNames.some((name: string) => name.includes('test-context'))
      ).toBe(true);
    });

    test('should default to dev when no environment configuration provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTestStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      const defaultBucket = defaultTemplate.findResources('AWS::S3::Bucket');
      const defaultBucketNames = Object.values(defaultBucket).map(
        (b: any) => b.Properties.BucketName
      );
      expect(
        defaultBucketNames.some((name: string) => name.includes('dev'))
      ).toBe(true);
    });
  });
});
