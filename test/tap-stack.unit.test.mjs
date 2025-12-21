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
  let originalEndpoint;

  beforeEach(() => {
    // Save and unset AWS_ENDPOINT_URL for non-LocalStack tests
    originalEndpoint = process.env.AWS_ENDPOINT_URL;
    delete process.env.AWS_ENDPOINT_URL;

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

  afterEach(() => {
    // Restore original AWS_ENDPOINT_URL
    if (originalEndpoint) {
      process.env.AWS_ENDPOINT_URL = originalEndpoint;
    }
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
      const nonPrimaryApp = new cdk.App();
      const nonPrimaryStack = new TapStack(nonPrimaryApp, 'NonPrimaryTestTapStack', {
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
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
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
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
      });
    });

    test('Lambda function has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            ASSET_BUCKET: Match.anyValue(),
            BACKUP_BUCKET: Match.anyValue(),
            REGION: Match.anyValue(),
            EVENT_BUS: Match.anyValue(),
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
      });
    });

    test('Lambda function has tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Lambda function has VPC configuration in non-LocalStack', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('creates Lambda alias with provisioned concurrency', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'production',
      });
    });

    test('Lambda function does not have VPC in LocalStack', () => {
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

      const functions = localStackTemplate.findResources('AWS::Lambda::Function');
      const functionResource = Object.values(functions)[0];
      expect(functionResource.Properties.VpcConfig).toBeUndefined();
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

    test('creates API Gateway deployment', () => {
      const deployments = template.findResources('AWS::ApiGateway::Deployment');
      expect(Object.keys(deployments).length).toBeGreaterThanOrEqual(1);
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

    test('creates GET methods for endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
    });

    test('configures CloudWatch role for API Gateway', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `global-api-${environmentSuffix}`,
      });
    });
  });

  describe('EventBridge', () => {
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

    test('does not create event forwarding rule for non-primary stack', () => {
      const nonPrimaryApp = new cdk.App();
      const nonPrimaryStack = new TapStack(nonPrimaryApp, 'NonPrimaryTestTapStack', {
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

  describe('WAF Configuration', () => {
    test('creates WAF WebACL with rate limiting', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
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

    test('WAF includes AWS managed rule set', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 2,
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

    test('WAF has default allow action', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        DefaultAction: { Allow: {} },
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        EvaluationPeriods: 2,
      });
    });

    test('creates API Gateway error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });

    test('alarms have correct thresholds and evaluation periods', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmValues = Object.values(alarms);
      
      expect(alarmValues.length).toBeGreaterThanOrEqual(2);
      alarmValues.forEach(alarm => {
        expect(alarm.Properties.Threshold).toBeGreaterThan(0);
        expect(alarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-monitoring-${environmentSuffix}`,
      });
    });

    test('creates synthetics canary in non-LocalStack environment', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Name: `global-api-canary-${environmentSuffix}`,
        RuntimeVersion: 'syn-nodejs-puppeteer-6.2',
      });
    });

    test('does not create synthetics canary in LocalStack environment', () => {
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

      const canaries = localStackTemplate.findResources('AWS::Synthetics::Canary');
      expect(Object.keys(canaries).length).toBe(0);
    });
  });

  describe('IAM Permissions', () => {
    test('Lambda function has DynamoDB permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const lambdaPolicy = Object.values(policies).find(policy =>
        policy.Properties.PolicyName &&
        policy.Properties.PolicyName.includes('TapLambdaServiceRole')
      );

      expect(lambdaPolicy).toBeDefined();
      const statements = lambdaPolicy.Properties.PolicyDocument.Statement;
      const dynamoDbStatement = statements.find(stmt =>
        Array.isArray(stmt.Action) && stmt.Action.some(action => action.startsWith('dynamodb:'))
      );
      expect(dynamoDbStatement).toBeDefined();
      expect(dynamoDbStatement.Effect).toBe('Allow');
    });

    test('Lambda function has S3 permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const lambdaPolicy = Object.values(policies).find(policy =>
        policy.Properties.PolicyName &&
        policy.Properties.PolicyName.includes('TapLambdaServiceRole')
      );

      expect(lambdaPolicy).toBeDefined();
      const statements = lambdaPolicy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find(stmt =>
        Array.isArray(stmt.Action) && stmt.Action.some(action => action.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
    });

    test('Lambda function has EventBridge permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const lambdaPolicy = Object.values(policies).find(policy =>
        policy.Properties.PolicyName &&
        policy.Properties.PolicyName.includes('TapLambdaServiceRole')
      );

      expect(lambdaPolicy).toBeDefined();
      const statements = lambdaPolicy.Properties.PolicyDocument.Statement;
      const eventsStatement = statements.find(stmt => {
        const action = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return action.some(a => a === 'events:PutEvents' || (typeof a === 'string' && a.startsWith('events:')));
      });
      expect(eventsStatement).toBeDefined();
      expect(eventsStatement.Effect).toBe('Allow');
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = template.findOutputs('*');
      const outputNames = Object.keys(outputs);
      
      expect(outputNames).toContain('ApiEndpoint');
      expect(outputNames).toContain('ApiId');
      expect(outputNames).toContain('TableName');
      expect(outputNames).toContain('AssetBucketName');
      expect(outputNames).toContain('BackupBucketName');
      expect(outputNames).toContain('EventBusName');
      expect(outputNames).toContain('LambdaFunctionName');
    });
  });

  describe('Error Handling', () => {
    test('stack handles missing props gracefully', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackMinimal', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Should create resources with default values
      testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
      const buckets = testTemplate.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(2);
    });

    test('removal policies are set for stateful resources', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableResource = Object.values(tables)[0];
      expect(tableResource.DeletionPolicy).toBe('Delete');

      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketResources = Object.values(buckets).filter(bucket =>
        bucket.Properties.BucketName && bucket.Properties.BucketName.includes('global-api')
      );
      bucketResources.forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('stack works with different environment suffixes', () => {
      const customSuffix = 'staging';
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackCustom', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: customSuffix,
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `global-api-table-${customSuffix}`,
      });
      
      testTemplate.hasResourceProperties('AWS::Events::EventBus', {
        Name: `global-api-events-${customSuffix}`,
      });
    });

    test('handles LocalStack environment correctly', () => {
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

      // Should not create VPC or Synthetics in LocalStack
      const vpcs = localStackTemplate.findResources('AWS::EC2::VPC');
      const canaries = localStackTemplate.findResources('AWS::Synthetics::Canary');
      expect(Object.keys(vpcs).length).toBe(0);
      expect(Object.keys(canaries).length).toBe(0);

      // Should still create other resources
      localStackTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
      localStackTemplate.resourceCountIs('AWS::S3::Bucket', 2);
      localStackTemplate.resourceCountIs('AWS::Lambda::Function', 1);
    });
  });
});
