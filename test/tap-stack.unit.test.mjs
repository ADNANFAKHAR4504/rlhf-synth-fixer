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

    test('EventBridge event bus has correct name pattern', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `global-api-events-${environmentSuffix}`,
      });
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

    test('Lambda function has correct function name pattern', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `global-api-function-${environmentSuffix}`,
      });
    });

    test('Lambda function has VPC configuration when not in LocalStack', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.anyValue(),
      });
    });
  });

  describe('API Gateway', () => {
    test('creates API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('creates API Gateway deployment and stage', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
    });

    test('API Gateway has correct endpoint type', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('API Gateway stage has tracing enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });

    test('API Gateway has health resource configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('API Gateway has CloudWatch role enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: Match.anyValue(),
      });
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF WebACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('WAF has rate limiting rule', () => {
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

    test('WAF has AWS managed rules', () => {
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

    test('WAF has correct scope for regional deployment', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('creates Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });
    });

    test('creates API Gateway error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
      });
    });

    test('alarms have correct thresholds and evaluation periods', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: Match.anyValue(),
        EvaluationPeriods: 2,
      });
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

    test('outputs have descriptions', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
      template.hasOutput('TableName', {
        Description: 'DynamoDB table name',
      });
    });
  });

  describe('IAM Permissions', () => {
    test('Lambda has DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
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
            }),
          ]),
        },
      });
    });

    test('Lambda has S3 permissions for both buckets', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
                's3:DeleteObject*',
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*',
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
});
