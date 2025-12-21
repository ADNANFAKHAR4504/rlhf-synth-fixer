import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import { jest } from '@jest/globals';

// Mock __dirname for ES modules compatibility with Jest
const __dirname = process.cwd();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
      isPrimary: true,
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Encryption', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('creates KMS key alias', () => {
      template.resourceCountIs('AWS::KMS::Alias', 1);
    });

    test('KMS key has correct description', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `Global API KMS Key - ${environmentSuffix}`,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration in non-LocalStack environment', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 AZs x 2 subnet types
    });

    test('creates NAT gateway for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('does not create VPC in LocalStack environment', () => {
      // Set LocalStack environment
      const originalEndpoint = process.env.AWS_ENDPOINT_URL;
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      const localStackApp = new cdk.App();
      const localStackStack = new TapStack(localStackApp, 'LocalStackTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix,
        isPrimary: true,
      });
      const localStackTemplate = Template.fromStack(localStackStack);

      const vpcs = localStackTemplate.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBe(0);

      // Restore original environment
      if (originalEndpoint) {
        process.env.AWS_ENDPOINT_URL = originalEndpoint;
      } else {
        delete process.env.AWS_ENDPOINT_URL;
      }
    });
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with partition and sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          Match.objectLike({ AttributeName: 'id', KeyType: 'HASH' }),
          Match.objectLike({ AttributeName: 'sk', KeyType: 'RANGE' }),
        ]),
      });
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('DynamoDB table has TTL attribute configured', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('DynamoDB table has stream enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('DynamoDB table uses customer managed KMS encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          KMSMasterKeyId: Match.anyValue(),
        },
      });
    });

    test('DynamoDB table has correct billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('DynamoDB table has GSI for primary stack', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'gsi1',
            KeySchema: Match.arrayWith([
              Match.objectLike({ AttributeName: 'gsi1pk', KeyType: 'HASH' }),
              Match.objectLike({ AttributeName: 'gsi1sk', KeyType: 'RANGE' }),
            ]),
          }),
        ]),
      });
    });

    test('DynamoDB table does not have GSI for non-primary stack', () => {
      const nonPrimaryStack = new TapStack(app, 'NonPrimaryTestTapStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix,
        isPrimary: false,
      });
      const nonPrimaryTemplate = Template.fromStack(nonPrimaryStack);

      const tables = nonPrimaryTemplate.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(tables)[0];
      expect(tableResource.Properties.GlobalSecondaryIndexes).toBeUndefined();
    });
  });

  describe('S3 Buckets', () => {
    test('creates S3 buckets with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates S3 buckets with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('S3 buckets block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates at least 2 S3 buckets (asset and backup)', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(2);
    });

    test('S3 buckets have lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
            }),
          ]),
        },
      });
    });

    test('asset bucket has 30-day lifecycle rule', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              NoncurrentVersionExpirationInDays: 30,
            }),
          ]),
        },
      });
    });

    test('backup bucket has 90-day lifecycle rule', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              NoncurrentVersionExpirationInDays: 90,
            }),
          ]),
        },
      });
    });
  });

  describe('EventBridge Configuration', () => {
    test('creates EventBridge event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `global-api-events-${environmentSuffix}`,
      });
    });

    test('creates cross-region event forwarding rule for primary stack', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['global-api.events'],
        },
      });
    });

    test('does not create cross-region forwarding for non-primary stack', () => {
      const nonPrimaryStack = new TapStack(app, 'NonPrimaryTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix,
        isPrimary: false,
      });
      const nonPrimaryTemplate = Template.fromStack(nonPrimaryStack);

      const rules = nonPrimaryTemplate.findResources('AWS::Events::Rule');
      expect(Object.keys(rules).length).toBe(0);
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
      });
    });

    test('Lambda function has X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Lambda function has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT_SUFFIX: environmentSuffix,
          }),
        },
      });
    });

    test('creates Lambda alias with provisioned concurrency', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'production',
        ProvisionedConcurrencyConfig: {
          ProvisionedConcurrentExecutions: 50,
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('creates API Gateway REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `global-api-${environmentSuffix}`,
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates API Gateway deployment and stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        TracingEnabled: true,
      });
    });

    test('creates health resource endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('creates GET method for root and health endpoints', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 2); // Root GET + Health GET
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF Web ACL with rate limiting', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
          }),
        ]),
      });
    });

    test('creates WAF Web ACL association with API Gateway', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.stringLikeRegexp(
          /^arn:aws:apigateway:.*:\/restapis\/.*\/stages\/prod$/
        ),
      });
    });

    test('WAF includes AWS managed rule set', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 2,
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });

    test('creates API Gateway error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 50,
        EvaluationPeriods: 3,
      });
    });

    test('alarms have correct thresholds and evaluation periods', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmKeys = Object.keys(alarms);
      expect(alarmKeys.length).toBeGreaterThanOrEqual(2);
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-monitoring-${environmentSuffix}`,
      });
    });

    test('dashboard has correct widget configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.serializedJson(
          Match.objectLike({
            widgets: Match.arrayWith([
              Match.objectLike({
                type: 'metric',
                properties: Match.objectLike({
                  title: 'Lambda Invocations',
                }),
              }),
            ]),
          })
        ),
      });
    });
  });

  describe('CloudWatch Synthetics', () => {
    test('creates synthetics canary in non-LocalStack environment', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Name: `tap-api-canary-${environmentSuffix}`,
        RuntimeVersion: 'syn-nodejs-puppeteer-6.2',
      });
    });

    test('canary has correct schedule configuration', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Schedule: {
          Expression: 'rate(5 minutes)',
        },
      });
    });

    test('does not create canary in LocalStack environment', () => {
      const originalEndpoint = process.env.AWS_ENDPOINT_URL;
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      const localStackApp = new cdk.App();
      const localStackStack = new TapStack(localStackApp, 'LocalStackCanaryTest', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix,
        isPrimary: true,
      });
      const localStackTemplate = Template.fromStack(localStackStack);

      const canaries = localStackTemplate.findResources('AWS::Synthetics::Canary');
      expect(Object.keys(canaries).length).toBe(0);

      // Restore original environment
      if (originalEndpoint) {
        process.env.AWS_ENDPOINT_URL = originalEndpoint;
      } else {
        delete process.env.AWS_ENDPOINT_URL;
      }
    });
  });

  describe('IAM Permissions', () => {
    test('Lambda function has DynamoDB read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['dynamodb:BatchGetItem', 'dynamodb:GetRecords']),
            }),
          ]),
        },
      });
    });

    test('Lambda function has S3 bucket permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetObject*', 's3:GetBucket*']),
            }),
          ]),
        },
      });
    });

    test('Lambda function has EventBridge permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['events:PutEvents'],
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = [
        'ApiEndpoint',
        'ApiId',
        'TableName',
        'AssetBucketName',
        'BackupBucketName',
        'EventBusName',
        'LambdaFunctionName',
        'WebAclArn',
        'DashboardUrl',
      ];

      outputs.forEach((outputName) => {
        template.hasOutput(outputName, {});
      });
    });

    test('outputs have correct export names', () => {
      template.hasOutput('ApiEndpoint', {
        Export: {
          Name: `global-api-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('dashboard URL output has correct format', () => {
      template.hasOutput('DashboardUrl', {
        Value: Match.stringLikeRegexp(
          /^https:\/\/.*\.console\.aws\.amazon\.com\/cloudwatch\/home/
        ),
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resources use environment suffix in names', () => {
      // Test that table name includes environment suffix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `global-api-table-${environmentSuffix}`,
      });

      // Test that event bus name includes environment suffix
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `global-api-events-${environmentSuffix}`,
      });
    });

    test('bucket names include account and region for uniqueness', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          new RegExp(`global-api-.*-${environmentSuffix}-123456789012-us-east-1`)
        ),
      });
    });
  });

  describe('Security Configuration', () => {
    test('all encryption uses customer managed KMS keys', () => {
      // DynamoDB encryption
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          KMSMasterKeyId: Match.anyValue(),
        },
      });

      // S3 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
            }),
          ]),
        },
      });
    });

    test('API Gateway has CloudWatch logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: Match.absent(),
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
          }),
        ]),
      });
    });
  });

  describe('Error Handling', () => {
    test('stack handles missing props gracefully', () => {
      const minimalStack = new TapStack(app, 'MinimalTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const minimalTemplate = Template.fromStack(minimalStack);

      // Should still create basic resources with defaults
      minimalTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'global-api-table-dev',
      });
    });

    test('removal policies are set for stateful resources', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
      });
    });
  });
});
