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

  describe('EventBridge', () => {
    test('creates custom event bus', () => {
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

    test('does not create cross-region rule for non-primary stack', () => {
      const nonPrimaryStack = new TapStack(app, 'NonPrimaryEventTestStack', {
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
      });
    });

    test('Lambda function has tracing enabled', () => {
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
            REGION: 'us-east-1',
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

    test('Lambda function is in VPC for non-LocalStack environment', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.anyValue(),
      });
    });

    test('Lambda function not in VPC for LocalStack environment', () => {
      const originalEndpoint = process.env.AWS_ENDPOINT_URL;
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      const localStackApp = new cdk.App();
      const localStackStack = new TapStack(localStackApp, 'LocalStackLambdaTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix,
        isPrimary: true,
      });
      const localStackTemplate = Template.fromStack(localStackStack);

      const functions = localStackTemplate.findResources('AWS::Lambda::Function');
      const functionResource = Object.values(functions)[0];
      expect(functionResource.Properties.VpcConfig).toBeUndefined();

      // Restore original environment
      if (originalEndpoint) {
        process.env.AWS_ENDPOINT_URL = originalEndpoint;
      } else {
        delete process.env.AWS_ENDPOINT_URL;
      }
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `global-api-${environmentSuffix}`,
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates API Gateway stage with tracing enabled', () => {
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

    test('creates GET methods for root and health endpoints', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 2);
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF WebACL with rate limiting rule', () => {
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

    test('creates WAF association with API Gateway', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
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
        Threshold: 5,
      });
    });

    test('creates API Gateway error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 10,
      });
    });

    test('alarms have correct thresholds and evaluation periods', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        EvaluationPeriods: 2,
        Period: 300,
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-monitoring-${environmentSuffix}`,
      });
    });

    test('dashboard has correct widget configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.stringLikeRegexp('Lambda Function Metrics'),
      });
    });
  });

  describe('Synthetics Canary', () => {
    test('creates synthetics canary in non-LocalStack environment', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Name: `api-canary-${environmentSuffix}`,
        RuntimeVersion: 'syn-nodejs-puppeteer-6.2',
      });
    });

    test('canary has correct schedule', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Schedule: {
          Expression: 'rate(5 minutes)',
        },
      });
    });

    test('creates IAM role for canary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'synthetics.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('does not create canary in LocalStack environment', () => {
      const originalEndpoint = process.env.AWS_ENDPOINT_URL;
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';

      const localStackApp = new cdk.App();
      const localStackStack = new TapStack(localStackApp, 'LocalStackCanaryTestStack', {
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

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('ApiEndpoint', {});
      template.hasOutput('ApiId', {});
      template.hasOutput('TableName', {});
      template.hasOutput('AssetBucketName', {});
      template.hasOutput('BackupBucketName', {});
      template.hasOutput('EventBusName', {});
      template.hasOutput('LambdaFunctionName', {});
    });

    test('outputs have correct descriptions', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
      template.hasOutput('TableName', {
        Description: 'DynamoDB table name',
      });
    });
  });

  describe('IAM Permissions', () => {
    test('Lambda has DynamoDB read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ]),
            }),
          ]),
        },
      });
    });

    test('Lambda has S3 read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
              ]),
            }),
          ]),
        },
      });
    });

    test('Lambda has EventBridge permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'events:PutEvents',
            }),
          ]),
        },
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
      expect(minimalStack).toBeDefined();
    });

    test('removal policies are set for stateful resources', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });
      template.hasResourceProperties('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
      });
    });

    test('stack works with different environment suffixes', () => {
      const devStack = new TapStack(app, 'DevTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'dev',
      });
      expect(devStack).toBeDefined();

      const prodStack = new TapStack(app, 'ProdTestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'prod',
      });
      expect(prodStack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    test('resources have environment suffix in names', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `global-api-table-${environmentSuffix}`,
      });
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `global-api-events-${environmentSuffix}`,
      });
    });

    test('S3 buckets have unique names with account and region', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `global-api-assets-${environmentSuffix}-123456789012-us-east-1`,
      });
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `global-api-backups-${environmentSuffix}-123456789012-us-east-1`,
      });
    });
  });
});
