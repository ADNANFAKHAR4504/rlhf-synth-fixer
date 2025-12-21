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
  });

  describe('EventBridge', () => {
    test('creates EventBridge event bus', () => {
      template.resourceCountIs('AWS::Events::EventBus', 1);
    });

    test('creates cross-region event forwarding rule (primary only)', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['global-api.events'],
        },
      });
    });

    test('event forwarding rule targets default event bus', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.stringLikeRegexp('arn:aws:events:.*:.*:event-bus/default'),
          }),
        ]),
      });
    });

    test('does not create event forwarding rule for non-primary stack', () => {
      const nonPrimaryStack = new TapStack(app, 'NonPrimaryTestTapStack', {
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
    test('creates Lambda function', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda function uses Node.js runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
      });
    });

    test('Lambda function has X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Lambda function has environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            ASSET_BUCKET: Match.anyValue(),
            BACKUP_BUCKET: Match.anyValue(),
            REGION: Match.anyValue(),
            EVENT_BUS: Match.anyValue(),
          }),
        },
      });
    });

    test('Lambda has provisioned concurrency via alias', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'production',
        ProvisionedConcurrencyConfig: {
          ProvisionedConcurrentExecutions: 50,
        },
      });
    });

    test('Lambda function has proper IAM role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: { Service: 'lambda.amazonaws.com' },
            }),
          ]),
        },
      });
    });

    test('Lambda function is not in VPC for LocalStack', () => {
      // Set LocalStack environment
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      const localStackApp = new cdk.App();
      const localStackStack = new TapStack(localStackApp, 'LocalStackTapStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix,
        isPrimary: true,
      });
      const localStackTemplate = Template.fromStack(localStackStack);

      const lambdas = localStackTemplate.findResources('AWS::Lambda::Function');
      const lambdaResource = Object.values(lambdas)[0];
      expect(lambdaResource.Properties.VpcConfig).toBeUndefined();

      // Clean up environment
      delete process.env.AWS_ENDPOINT_URL;
    });
  });

  describe('API Gateway', () => {
    test('creates API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('API Gateway is regional endpoint type', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates API Gateway stage with logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
          }),
        ]),
      });
    });

    test('creates health endpoint resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('creates GET methods for root and health endpoints', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');
      const getMethods = Object.values(methods).filter(
        method => method.Properties.HttpMethod === 'GET'
      );
      expect(getMethods.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC for non-LocalStack environment', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('does not create VPC for LocalStack environment', () => {
      // Set LocalStack environment
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      const localStackApp = new cdk.App();
      const localStackStack = new TapStack(localStackApp, 'LocalStackTapStack', {
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

      // Clean up environment
      delete process.env.AWS_ENDPOINT_URL;
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('WAF Web ACL has rate limiting rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
          }),
        ]),
      });
    });

    test('WAF Web ACL has AWS managed rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          }),
        ]),
      });
    });

    test('creates WAF Web ACL association with API Gateway', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });
  });

  describe('CloudWatch Resources', () => {
    test('creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('creates CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('creates Synthetics canary', () => {
      template.resourceCountIs('AWS::Synthetics::Canary', 1);
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = template.findOutputs('*');
      const expectedOutputs = [
        'ApiEndpoint',
        'ApiId',
        'TableName',
        'AssetBucketName',
        'BackupBucketName',
        'EventBusName',
        'LambdaFunctionName',
        'WebAclArn',
        'DashboardUrl',
        'CanaryName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
      });
    });
  });
});
