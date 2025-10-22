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
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('should create content bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have KMS encryption enabled', () => {
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

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('should create UserPreferencesTable with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should create EngagementTrackingTable with composite key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
      });
    });

    test('should create GSI on UserPreferencesTable', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'preferenceTypeIndex',
            KeySchema: [
              {
                AttributeName: 'preferenceType',
                KeyType: 'HASH',
              },
            ],
          },
        ],
      });
    });

    test('should create GSI on EngagementTrackingTable', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'contentIdIndex',
            KeySchema: [
              {
                AttributeName: 'contentId',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
              },
            ],
          },
        ],
      });
    });
  });

  describe('Lambda@Edge Functions', () => {
    test('should create personalization Lambda@Edge function with external handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'personalization.handler',
        MemorySize: 128,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('should have IAM policy for DynamoDB access on personalization function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['dynamodb:GetItem', 'dynamodb:Query'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have IAM policy for DynamoDB write on engagement tracking function', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have X-Ray tracing permissions for Lambda@Edge functions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Effect: 'Allow',
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('should have external handlers configured for Lambda@Edge functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'personalization.handler',
      });
      
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'engagement-tracking.handler',
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
        }),
      });
    });

    test('should redirect HTTP to HTTPS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        },
      });
    });

    test('should have Lambda@Edge associations', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: Match.arrayWith([
              Match.objectLike({
                EventType: 'origin-request',
              }),
              Match.objectLike({
                EventType: 'viewer-response',
              }),
            ]),
          },
        },
      });
    });

    test('should use price class 100', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          PriceClass: 'PriceClass_100',
        },
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard with environment suffix', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `NewsPersonalizationDashboard-${environmentSuffix}`,
      });
    });

    test('should have dashboard body with widgets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export DistributionDomainName', () => {
      template.hasOutput('DistributionDomainName', {
        Export: {
          Name: Match.stringLikeRegexp('.*DistributionDomainName'),
        },
      });
    });

    test('should export ContentBucketName', () => {
      template.hasOutput('ContentBucketName', {
        Export: {
          Name: Match.stringLikeRegexp('.*ContentBucketName'),
        },
      });
    });

    test('should export UserPreferencesTableName', () => {
      template.hasOutput('UserPreferencesTableName', {
        Export: {
          Name: Match.stringLikeRegexp('.*UserPreferencesTableName'),
        },
      });
    });

    test('should export EngagementTrackingTableName', () => {
      template.hasOutput('EngagementTrackingTableName', {
        Export: {
          Name: Match.stringLikeRegexp('.*EngagementTrackingTableName'),
        },
      });
    });

    test('should export DistributionId', () => {
      template.hasOutput('DistributionId', {
        Export: {
          Name: Match.stringLikeRegexp('.*DistributionId'),
        },
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should create expected number of DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 2);
    });

    test('should create expected number of Lambda functions', () => {
      const lambdaCount = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaCount).length).toBeGreaterThanOrEqual(2);
    });

    test('should create one CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should create one CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use default environment suffix if not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('NewsPersonalizationDashboard-.*'),
      });
    });

    test('should use provided environment suffix', () => {
      const testApp = new cdk.App();
      const customSuffix = 'prod';
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: customSuffix,
        env: { region: 'us-east-1' },
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `NewsPersonalizationDashboard-${customSuffix}`,
      });
    });
  });

  describe('Removal Policy', () => {
    test('should have DESTROY removal policy on S3 bucket', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy on DynamoDB tables', () => {
      const resources = template.findResources('AWS::DynamoDB::Table');
      Object.values(resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS keys with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*encryption'),
        EnableKeyRotation: true,
      });
    });

    test('should create at least 2 KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
    });

    test('should use KMS encryption for DynamoDB tables', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create Lambda@Edge error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*LambdaEdge-Errors.*'),
        ComparisonOperator: 'GreaterThanThreshold',
        Threshold: 10,
      });
    });

    test('should create CloudFront 5xx error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*CloudFront-5xxErrors.*'),
        Threshold: 5,
      });
    });

    test('should create DynamoDB throttling alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*DynamoDB-Throttles.*'),
      });
    });

    test('should create at least 4 CloudWatch alarms', () => {
      const alarmCount = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarmCount).length).toBeGreaterThanOrEqual(4);
    });

    test('should have SNS actions configured for alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('AlarmTopic.*'),
          }),
        ]),
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('NewsPersonalization-Alarms.*'),
      });
    });

    test('should export SNS topic ARN', () => {
      template.hasOutput('AlarmTopicArn', {
        Export: {
          Name: Match.stringLikeRegexp('.*AlarmTopicArn'),
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag S3 bucket with Service tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Service',
            Value: 'NewsPersonalization',
          }),
        ]),
      });
    });

    test('should tag resources with Environment tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });
    });

    test('should tag DynamoDB tables with Component tag', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Component',
          }),
        ]),
      });
    });
  });
});
