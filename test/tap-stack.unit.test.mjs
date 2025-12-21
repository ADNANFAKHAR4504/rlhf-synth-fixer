import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Jest-compatible way to handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    test('creates API Gateway methods for root and health endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
    });

    test('API Gateway has CloudWatch role configured', () => {
      template.resourceCountIs('AWS::ApiGateway::Account', 1);
    });
  });

  describe('WAF', () => {
    test('creates WAF WebACL with regional scope', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
      });
    });

    test('WAF has rate-based rule', () => {
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

    test('WAF has managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
          }),
        ]),
      });
    });

    test('creates WAF association with API Gateway', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });
  });

  describe('CloudWatch', () => {
    test('creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('creates CloudWatch alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('global-api-lambda-errors-.*'),
      });
    });

    test('creates Lambda duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('global-api-lambda-duration-.*'),
        Threshold: 25000,
      });
    });
  });

  describe('Synthetics Canary', () => {
    test('creates Synthetics canary for API monitoring', () => {
      template.resourceCountIs('AWS::Synthetics::Canary', 1);
    });

    test('canary has correct schedule', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Schedule: {
          Expression: 'rate(5 minutes)',
        },
      });
    });
  });

  describe('VPC Configuration', () => {
    test('VPC is not created when LocalStack environment is detected', () => {
      // Test with LocalStack environment
      const localStackApp = new cdk.App();
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
      const localStackStack = new TapStack(localStackApp, 'LocalStackTapStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'localstack',
        isPrimary: true,
      });
      const localStackTemplate = Template.fromStack(localStackStack);
      
      localStackTemplate.resourceCountIs('AWS::EC2::VPC', 0);
      localStackTemplate.resourceCountIs('AWS::EC2::NatGateway', 0);
      
      // Clean up
      delete process.env.AWS_ENDPOINT_URL;
    });

    test('VPC is created when not in LocalStack environment', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required stack outputs', () => {
      template.hasOutput('ApiEndpoint', {});
      template.hasOutput('ApiId', {});
      template.hasOutput('TableName', {});
      template.hasOutput('AssetBucketName', {});
      template.hasOutput('BackupBucketName', {});
      template.hasOutput('EventBusName', {});
      template.hasOutput('LambdaFunctionName', {});
    });

    test('outputs have proper export names', () => {
      template.hasOutput('ApiEndpoint', {
        Export: { Name: `TapApiEndpoint-${environmentSuffix}` },
      });
    });
  });

  describe('Secondary Stack Configuration', () => {
    test('secondary stack does not create cross-region forwarding rule', () => {
      const secondaryApp = new cdk.App();
      const secondaryStack = new TapStack(secondaryApp, 'SecondaryTapStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        environmentSuffix: 'test',
        isPrimary: false,
      });
      const secondaryTemplate = Template.fromStack(secondaryStack);
      
      const rules = secondaryTemplate.findResources('AWS::Events::Rule');
      const forwardingRules = Object.values(rules).filter(rule => 
        rule.Properties?.EventPattern?.source?.includes?.('global-api.events')
      );
      expect(forwardingRules.length).toBe(0);
    });

    test('secondary stack does not create GSI', () => {
      const secondaryApp = new cdk.App();
      const secondaryStack = new TapStack(secondaryApp, 'SecondaryTapStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        environmentSuffix: 'test',
        isPrimary: false,
      });
      const secondaryTemplate = Template.fromStack(secondaryStack);
      
      const tables = secondaryTemplate.findResources('AWS::DynamoDB::Table');
      const tableWithGSI = Object.values(tables).find(table => 
        table.Properties?.GlobalSecondaryIndexes
      );
      expect(tableWithGSI).toBeUndefined();
    });
  });
});
