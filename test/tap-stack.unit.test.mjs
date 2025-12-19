import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

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

  describe('DynamoDB Global Table', () => {
    test('creates DynamoDB table with partition and sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        KeySchema: Match.arrayWith([
          Match.objectLike({ AttributeName: 'id', KeyType: 'HASH' }),
          Match.objectLike({ AttributeName: 'sk', KeyType: 'RANGE' }),
        ]),
      });
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        Replicas: Match.arrayWith([
          Match.objectLike({
            PointInTimeRecoverySpecification: {
              PointInTimeRecoveryEnabled: true,
            },
          }),
        ]),
      });
    });

    test('DynamoDB table has TTL attribute configured', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('DynamoDB table has stream enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
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
  });

  describe('Lambda Function', () => {
    test('creates Lambda function', () => {
      const lambdas = template.findResources('AWS::Lambda::Function'); expect(Object.keys(lambdas).length).toBeGreaterThanOrEqual(1);
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
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(2);
    });

    test('creates API errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
      });
    });

    test('creates Lambda errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
      });
    });
  });

  describe('CloudWatch Synthetics', () => {
    test('creates Synthetics canary', () => {
      template.resourceCountIs('AWS::Synthetics::Canary', 1);
    });

    test('canary has 5 minute schedule', () => {
      template.hasResourceProperties('AWS::Synthetics::Canary', {
        Schedule: {
          Expression: 'rate(5 minutes)',
        },
      });
    });
  });

  describe('Route 53', () => {
    test('creates Route 53 health check (primary only)', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTPS',
          ResourcePath: '/prod/health',
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates Lambda execution role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda role has X-Ray write access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp('AWSXRayDaemonWriteAccess')]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {});
    });

    test('exports table name', () => {
      template.hasOutput('TableName', {});
    });

    test('exports asset bucket name', () => {
      template.hasOutput('AssetBucketName', {});
    });

    test('exports backup bucket name', () => {
      template.hasOutput('BackupBucketName', {});
    });

    test('exports event bus name', () => {
      template.hasOutput('EventBusName', {});
    });

    test('exports Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {});
    });

    test('exports WAF WebACL ARN', () => {
      template.hasOutput('WafWebAclArn', {});
    });
  });

  describe('Environment Suffix', () => {
    test('uses environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'prod',
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(testStack).toBeDefined();
    });

    test('uses default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultStack', {
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(testStack).toBeDefined();
    });
  });

  describe('Secondary Region Configuration', () => {
    test('secondary region stack creates without global table replicas', () => {
      const secondaryApp = new cdk.App();
      const secondaryStack = new TapStack(secondaryApp, 'SecondaryStack', {
        environmentSuffix: 'test',
        isPrimary: false,
        env: {
          account: '123456789012',
          region: 'ap-south-1',
        },
      });
      expect(secondaryStack).toBeDefined();
    });
  });
});

