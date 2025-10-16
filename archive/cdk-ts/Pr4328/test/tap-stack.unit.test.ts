import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'ap-southeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    it('should create a KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    it('should have CloudWatch Logs permissions for KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('logs.*amazonaws\\.com'),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create a DynamoDB table with encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'learning-content-test',
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    it('should have point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    it('should have a global secondary index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'ContentTypeIndex',
            KeySchema: [
              {
                AttributeName: 'contentType',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'createdAt',
                KeyType: 'RANGE',
              },
            ],
          },
        ],
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create an S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    it('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    it('should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    it('should have intelligent tiering lifecycle rule', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'intelligent-tiering',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'INTELLIGENT_TIERING',
                  TransitionInDays: 0,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('SQS Dead Letter Queue Configuration', () => {
    it('should create an SQS queue with encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'learning-api-dlq-test',
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should create a Lambda function with Node.js 20', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'learning-api-handler-test',
        Runtime: 'nodejs20.x',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    it('should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            ENVIRONMENT: 'test',
          },
        },
      });
    });

    it('should have retry configuration', () => {
      template.hasResourceProperties('AWS::Lambda::EventInvokeConfig', {
        MaximumRetryAttempts: 2,
      });
    });
  });

  describe('IAM Role Configuration', () => {
    it('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'learning-api-lambda-role-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    it('should have DynamoDB permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyStatements = Object.values(policies).flatMap((policy: any) =>
        policy.Properties.PolicyDocument.Statement
      );
      const hasDynamoDbPermissions = policyStatements.some((statement: any) =>
        Array.isArray(statement.Action) &&
        statement.Action.some((action: string) => action.startsWith('dynamodb:'))
      );
      expect(hasDynamoDbPermissions).toBe(true);
    });
  });

  describe('CloudWatch Log Group Configuration', () => {
    it('should create encrypted log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/learning-api-test',
        RetentionInDays: 14,
      });
    });
  });

  describe('API Gateway Configuration', () => {
    it('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'learning-api-test',
        Description: 'Serverless API for educational content delivery',
      });
    });

    it('should have API key authentication', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: 'learning-api-key-test',
        Enabled: true,
      });
    });

    it('should have usage plan configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: 'learning-api-usage-plan-test',
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
        Quota: {
          Limit: 100000,
          Period: 'DAY',
        },
      });
    });

    it('should create GET /content method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true,
      });
    });

    it('should create POST /content method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
      });
    });

    it('should create PUT /content/{id} method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        ApiKeyRequired: true,
      });
    });

    it('should create DELETE /content/{id} method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        ApiKeyRequired: true,
      });
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    it('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'learning-api-errors-test',
        Threshold: 5,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    it('should create Lambda throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'learning-api-throttles-test',
        Threshold: 10,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('CloudWatch Dashboard Configuration', () => {
    it('should create monitoring dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'learning-api-dashboard-test',
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should export API URL', () => {
      template.hasOutput('ApiUrl', {
        Export: {
          Name: 'test-api-url',
        },
      });
    });

    it('should export API Key ID', () => {
      template.hasOutput('ApiKeyId', {
        Export: {
          Name: 'test-api-key-id',
        },
      });
    });

    it('should export DynamoDB table name', () => {
      template.hasOutput('ContentTableName', {
        Export: {
          Name: 'test-content-table-name',
        },
      });
    });

    it('should export S3 bucket name', () => {
      template.hasOutput('ContentBucketName', {
        Export: {
          Name: 'test-content-bucket-name',
        },
      });
    });

    it('should export Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {
        Export: {
          Name: 'test-lambda-function-name',
        },
      });
    });

    it('should export DLQ URL', () => {
      template.hasOutput('DLQUrl', {
        Export: {
          Name: 'test-dlq-url',
        },
      });
    });
  });

  describe('Resource Count Validation', () => {
    it('should have expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map(
        (r: any) => r.Type
      );

      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::SQS::Queue');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::ApiGateway::RestApi');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
    });
  });

  describe('FERPA Compliance Validation', () => {
    it('should have encryption at rest for all data stores', () => {
      // DynamoDB encryption
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });

      // S3 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.anyValue(),
      });

      // Log encryption
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        KmsKeyId: Match.anyValue(),
      });
    });

    it('should have audit logging enabled', () => {
      // Check that API Gateway stage exists with method settings
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const hasLogging = Object.values(stages).some((stage: any) =>
        stage.Properties.MethodSettings &&
        Array.isArray(stage.Properties.MethodSettings)
      );
      expect(hasLogging).toBe(true);
    });
  });

  describe('High Availability Features', () => {
    it('should have API throttling configured via usage plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
      });
    });

    it('should have method settings for throttling', () => {
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const hasMethodSettings = Object.values(stages).some((stage: any) =>
        stage.Properties.MethodSettings &&
        Array.isArray(stage.Properties.MethodSettings) &&
        stage.Properties.MethodSettings.length > 0
      );
      expect(hasMethodSettings).toBe(true);
    });
  });

  describe('Removal Policy Validation', () => {
    it('should have DESTROY removal policy for resources', () => {
      const resources = template.toJSON().Resources;
      const dynamoTable = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::DynamoDB::Table'
      ) as any;
      expect(dynamoTable.DeletionPolicy).toBe('Delete');

      const s3Bucket = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      ) as any;
      expect(s3Bucket.DeletionPolicy).toBe('Delete');
    });
  });
});
