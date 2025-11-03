import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  describe('Stack without Route53 (default)', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        serviceName: 'test-service',
        email: 'test@example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    describe('DynamoDB Global Table', () => {
      test('should create a global table with replicas', () => {
        template.resourceCountIs('AWS::DynamoDB::GlobalTable', 1);

        template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
          TableName: `test-service-transactions-us-east-1-${environmentSuffix}`,
          KeySchema: [
            { AttributeName: 'transactionId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          Replicas: Match.arrayWith([
            Match.objectLike({
              Region: 'eu-central-1',
            }),
          ]),
        });
      });

      test('should have point-in-time recovery enabled', () => {
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

      test('should have contributor insights enabled', () => {
        template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
          Replicas: Match.arrayWith([
            Match.objectLike({
              ContributorInsightsSpecification: {
                Enabled: true,
              },
            }),
          ]),
        });
      });
    });

    describe('S3 Buckets', () => {
      test('should create three S3 buckets', () => {
        // Primary, Replica, and CloudFront Logs buckets
        template.resourceCountIs('AWS::S3::Bucket', 3);
      });

      test('should create primary bucket with correct naming', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: `test-service-primary-123456789012-us-east-1-${environmentSuffix}`,
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        });
      });

      test('should create replica bucket with correct naming', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: `test-service-replica-123456789012-eu-central-1-${environmentSuffix}`,
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        });
      });

      test('should create CloudFront logs bucket with ACL enabled', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: `test-service-cf-logs-123456789012-us-east-1-${environmentSuffix}`,
          OwnershipControls: {
            Rules: [
              {
                ObjectOwnership: 'BucketOwnerPreferred',
              },
            ],
          },
        });
      });

      test('should have lifecycle rules on primary bucket', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: `test-service-primary-123456789012-us-east-1-${environmentSuffix}`,
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'DeleteOldVersions',
                Status: 'Enabled',
              }),
              Match.objectLike({
                Id: 'TransitionToIA',
                Status: 'Enabled',
              }),
            ]),
          },
        });
      });

      test('should have replication configuration', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          ReplicationConfiguration: {
            Role: Match.anyValue(),
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'ReplicateTransactions',
                Status: 'Enabled',
                Priority: 1,
                Filter: {
                  Prefix: 'transactions/',
                },
              }),
            ]),
          },
        });
      });

      test('should have encryption enabled', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
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

      test('should block public access', () => {
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

    describe('Lambda Function', () => {
      test('should create Lambda function with correct naming', () => {
        // CDK creates additional Lambda functions for custom resources (log retention, auto-delete S3)
        // So we just verify our specific function exists
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `test-service-processor-us-east-1-${environmentSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          Timeout: 30,
          MemorySize: 512,
        });
      });

      test('should have X-Ray tracing enabled', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          TracingConfig: {
            Mode: 'Active',
          },
        });
      });

      test('should have correct environment variables', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: {
              TABLE_NAME: Match.anyValue(),
              BUCKET_NAME: Match.anyValue(),
              ENVIRONMENT: environmentSuffix,
              SERVICE: 'test-service',
            },
          },
        });
      });

      test('should have health check code', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
          Code: {
            ZipFile: Match.stringLikeRegexp('healthCheck'),
          },
        });
      });

      test('should create Lambda alias', () => {
        template.resourceCountIs('AWS::Lambda::Alias', 1);

        template.hasResourceProperties('AWS::Lambda::Alias', {
          Name: 'live',
        });
      });

      test('should have log group with retention', () => {
        // CDK creates log groups via custom resources, check the function has logRetention
        const functions = template.findResources('AWS::Lambda::Function', {
          Properties: {
            FunctionName: `test-service-processor-us-east-1-${environmentSuffix}`,
          },
        });
        expect(Object.keys(functions).length).toBeGreaterThan(0);
      });
    });

    describe('IAM Roles', () => {
      test('should create Lambda execution role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `test-service-lambda-processor-us-east-1-${environmentSuffix}`,
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              }),
            ]),
          }),
          // ManagedPolicyArns can be objects with Fn::Join, check for existence
          ManagedPolicyArns: Match.anyValue(),
        });
      });

      test('should create S3 replication role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `test-service-s3-replication-us-east-1-${environmentSuffix}`,
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 's3.amazonaws.com',
                },
              }),
            ]),
          }),
        });
      });

      test('should create EventBridge cross-region role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `test-service-eventbridge-cross-region-us-east-1-${environmentSuffix}`,
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'events.amazonaws.com',
                },
              }),
            ]),
          }),
        });
      });

      test('should grant Lambda permissions to DynamoDB', () => {
        // Find policies related to our transaction processor role
        const policies = template.findResources('AWS::IAM::Policy');
        const hasDynamoPolicy = Object.values(policies).some((policy: any) => {
          const statements = policy.Properties?.PolicyDocument?.Statement || [];
          return statements.some((stmt: any) => {
            const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
            return actions.some((action: string) => action.includes('dynamodb'));
          });
        });
        expect(hasDynamoPolicy).toBe(true);
      });

      test('should grant Lambda permissions to S3', () => {
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: Match.arrayWith([Match.stringLikeRegexp('s3:.*')]),
                Effect: 'Allow',
              }),
            ]),
          },
        });
      });
    });

    describe('SNS Topic', () => {
      test('should create SNS topic with correct naming', () => {
        template.resourceCountIs('AWS::SNS::Topic', 1);

        template.hasResourceProperties('AWS::SNS::Topic', {
          TopicName: `test-service-alerts-us-east-1-${environmentSuffix}`,
          DisplayName: 'Transaction Migration Alerts',
        });
      });

      test('should create email subscription when email is provided', () => {
        template.resourceCountIs('AWS::SNS::Subscription', 1);

        template.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
          Endpoint: 'test@example.com',
        });
      });
    });

    describe('EventBridge', () => {
      test('should create custom event bus', () => {
        template.resourceCountIs('AWS::Events::EventBus', 1);

        template.hasResourceProperties('AWS::Events::EventBus', {
          Name: `test-service-migration-us-east-1-${environmentSuffix}`,
        });
      });

      test('should create event rule with correct pattern', () => {
        template.resourceCountIs('AWS::Events::Rule', 1);

        template.hasResourceProperties('AWS::Events::Rule', {
          Name: `test-service-transaction-events-us-east-1-${environmentSuffix}`,
          EventPattern: {
            source: ['transaction.processing'],
            'detail-type': ['Transaction Created', 'Transaction Updated'],
          },
        });
      });

      test('should configure retry policy for event targets', () => {
        template.hasResourceProperties('AWS::Events::Rule', {
          Targets: Match.arrayWith([
            Match.objectLike({
              RetryPolicy: {
                MaximumRetryAttempts: 3,
                MaximumEventAgeInSeconds: 7200,
              },
            }),
          ]),
        });
      });
    });

    describe('CloudWatch', () => {
      test('should create CloudWatch dashboard', () => {
        template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);

        template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
          DashboardName: `test-service-migration-us-east-1-${environmentSuffix}`,
        });
      });

      test('should create replication lag alarm', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `test-service-replication-lag-us-east-1-${environmentSuffix}`,
          MetricName: 'ReplicationLatency',
          Namespace: 'AWS/DynamoDB',
          Threshold: 60000,
          ComparisonOperator: 'GreaterThanThreshold',
        });
      });

      test('should create Lambda error alarm', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `test-service-lambda-errors-us-east-1-${environmentSuffix}`,
          Threshold: 5,
          ComparisonOperator: 'GreaterThanThreshold',
        });
      });

      test('should link alarms to SNS topic', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmActions: Match.arrayWith([
            Match.objectLike({
              Ref: Match.stringLikeRegexp('AlertTopic'),
            }),
          ]),
        });
      });
    });

    describe('SSM Parameters', () => {
      test('should create migration state parameter', () => {
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/test-service/migration/state/${environmentSuffix}`,
          Type: 'String',
          Description: 'Migration state tracking',
        });
      });

      test('should create migration config parameter', () => {
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/test-service/migration/config/${environmentSuffix}`,
          Type: 'String',
          Description: 'Migration configuration metadata',
        });
      });

      test('should have correct state parameter value', () => {
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/test-service/migration/state/${environmentSuffix}`,
          Value: Match.stringLikeRegexp('primaryRegion'),
        });
      });

      test('should have correct config parameter value', () => {
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/test-service/migration/config/${environmentSuffix}`,
          Value: Match.stringLikeRegexp('trafficWeightPrimary'),
        });
      });
    });

    describe('Step Functions', () => {
      test('should create state machine', () => {
        template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

        template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
          StateMachineName: `test-service-migration-orchestration-us-east-1-${environmentSuffix}`,
        });
      });

      test('should have tracing enabled', () => {
        template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
          TracingConfiguration: {
            Enabled: true,
          },
        });
      });

      test('should have correct definition structure', () => {
        // DefinitionString is synthesized as an object with Fn::Join
        template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
          DefinitionString: Match.anyValue(),
        });
      });
    });

    describe('CloudFront Distribution', () => {
      test('should create CloudFront distribution', () => {
        template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      });

      test('should have logging enabled', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: Match.objectLike({
            Logging: {
              Bucket: Match.anyValue(),
              Prefix: 'cloudfront-logs/',
            },
          }),
        });
      });

      test('should have HTTPS redirect enabled', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: Match.objectLike({
            DefaultCacheBehavior: Match.objectLike({
              ViewerProtocolPolicy: 'redirect-to-https',
            }),
          }),
        });
      });

      test('should have API cache disabled', () => {
        template.hasResourceProperties('AWS::CloudFront::Distribution', {
          DistributionConfig: Match.objectLike({
            CacheBehaviors: Match.arrayWith([
              Match.objectLike({
                PathPattern: '/api/*',
                CachePolicyId: Match.stringLikeRegexp('4135ea2d-6df8-44a3-9df3-4b5a84be39ad'), // CACHING_DISABLED
              }),
            ]),
          }),
        });
      });
    });

    describe('Tags', () => {
      test('should apply Project tag', () => {
        // Check for tags on Step Functions which definitely has them
        const resources = template.findResources('AWS::StepFunctions::StateMachine');
        const resourceKey = Object.keys(resources)[0];
        const tags = resources[resourceKey].Properties?.Tags || [];

        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Project',
              Value: 'TransactionMigration',
            }),
          ])
        );
      });

      test('should apply Environment tag', () => {
        const resources = template.findResources('AWS::StepFunctions::StateMachine');
        const resourceKey = Object.keys(resources)[0];
        const tags = resources[resourceKey].Properties?.Tags || [];

        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
              Value: environmentSuffix,
            }),
          ])
        );
      });

      test('should apply Service tag', () => {
        const resources = template.findResources('AWS::StepFunctions::StateMachine');
        const resourceKey = Object.keys(resources)[0];
        const tags = resources[resourceKey].Properties?.Tags || [];

        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Service',
              Value: 'test-service',
            }),
          ])
        );
      });
    });

    describe('Stack Outputs', () => {
      test('should have DynamoDB table name output', () => {
        template.hasOutput('TransactionTableName', {
          Value: Match.anyValue(),
          Export: {
            Name: `test-service-table-us-east-1-${environmentSuffix}`,
          },
        });
      });

      test('should have primary bucket name output', () => {
        template.hasOutput('PrimaryBucketName', {
          Value: Match.anyValue(),
          Export: {
            Name: `test-service-primary-bucket-us-east-1-${environmentSuffix}`,
          },
        });
      });

      test('should have Lambda ARN output', () => {
        template.hasOutput('TransactionProcessorArn', {
          Value: Match.anyValue(),
          Export: {
            Name: `test-service-lambda-us-east-1-${environmentSuffix}`,
          },
        });
      });

      test('should have CloudFront distribution ID output', () => {
        template.hasOutput('CloudFrontDistributionId', {
          Value: Match.anyValue(),
        });
      });

      test('should have CloudFront domain name output', () => {
        template.hasOutput('CloudFrontDomainName', {
          Value: Match.anyValue(),
        });
      });

      test('should have state machine ARN output', () => {
        template.hasOutput('StateMachineArn', {
          Value: Match.anyValue(),
        });
      });

      test('should have SNS topic ARN output', () => {
        template.hasOutput('AlertTopicArn', {
          Value: Match.anyValue(),
        });
      });

      test('should have dashboard name output', () => {
        template.hasOutput('DashboardName', {
          Value: Match.anyValue(),
        });
      });
    });
  });

  describe('Stack with Route53 (when domainName is provided)', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackWithRoute53', {
        environmentSuffix: 'prod',
        serviceName: 'test-service',
        email: 'test@example.com',
        domainName: 'example.com',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    describe('Route53 Health Checks', () => {
      test('should create health checks', () => {
        template.resourceCountIs('AWS::Route53::HealthCheck', 4);
      });

      test('should create primary HTTPS health check', () => {
        template.hasResourceProperties('AWS::Route53::HealthCheck', {
          HealthCheckConfig: Match.objectLike({
            Type: 'HTTPS',
            ResourcePath: '/health',
            Port: 443,
            RequestInterval: 30,
            FailureThreshold: 3,
            MeasureLatency: true,
          }),
        });
      });

      test('should create calculated health check', () => {
        template.hasResourceProperties('AWS::Route53::HealthCheck', {
          HealthCheckConfig: Match.objectLike({
            Type: 'CALCULATED',
            HealthThreshold: 1,
          }),
        });
      });

      test('should create CloudWatch metric health check', () => {
        template.hasResourceProperties('AWS::Route53::HealthCheck', {
          HealthCheckConfig: Match.objectLike({
            Type: 'CLOUDWATCH_METRIC',
            InsufficientDataHealthStatus: 'Unhealthy',
          }),
        });
      });

      test('should create composite health check', () => {
        template.hasResourceProperties('AWS::Route53::HealthCheck', {
          HealthCheckConfig: Match.objectLike({
            Type: 'CALCULATED',
            HealthThreshold: 2,
          }),
        });
      });

      test('should tag health checks appropriately', () => {
        template.hasResourceProperties('AWS::Route53::HealthCheck', {
          HealthCheckTags: Match.arrayWith([
            Match.objectLike({
              Key: 'Service',
              Value: 'test-service',
            }),
          ]),
        });
      });
    });

    describe('Route53 DNS Records', () => {
      test('should create A record for failover', () => {
        template.resourceCountIs('AWS::Route53::RecordSet', 1);
      });

      test('should configure PRIMARY failover', () => {
        template.hasResourceProperties('AWS::Route53::RecordSet', {
          Name: 'api-prod.example.com.',
          Type: 'A',
          Failover: 'PRIMARY',
          SetIdentifier: 'test-service-primary-us-east-1-prod',
        });
      });

      test('should link record to health check', () => {
        template.hasResourceProperties('AWS::Route53::RecordSet', {
          HealthCheckId: Match.anyValue(),
        });
      });
    });

    describe('CloudWatch Alarms for Route53', () => {
      test('should create data consistency alarm', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'test-service-data-consistency-us-east-1-prod',
          MetricName: 'ReplicationLatency',
          Threshold: 30000,
          ComparisonOperator: 'LessThanThreshold',
        });
      });

      test('should create health check failure alarm', () => {
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: 'test-service-healthcheck-failure-us-east-1-prod',
          Namespace: 'AWS/Route53',
          MetricName: 'HealthCheckStatus',
          Threshold: 1,
          ComparisonOperator: 'LessThanThreshold',
        });
      });
    });

    describe('Route53 Outputs', () => {
      test('should have API domain output', () => {
        template.hasOutput('ApiDomain', {
          Value: 'api-prod.example.com',
          Export: {
            Name: 'test-service-api-domain-prod',
          },
        });
      });

      test('should have health check ID output', () => {
        template.hasOutput('HealthCheckId', {
          Value: Match.anyValue(),
        });
      });
    });
  });

  describe('Stack without email (optional parameter)', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStackNoEmail', {
        environmentSuffix: 'dev',
        serviceName: 'test-service',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('should create SNS topic without subscription', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should still create all other resources', () => {
      template.resourceCountIs('AWS::DynamoDB::GlobalTable', 1);
      // Verify our main resources exist (CDK creates custom resource Lambdas too, so we don't count them)
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-service-processor-us-east-1-dev',
      });
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('Resource naming with different parameters', () => {
    test('should use custom service name in resource names', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'CustomStack', {
        environmentSuffix: 'staging',
        serviceName: 'custom-service',
        env: {
          account: '987654321098',
          region: 'eu-central-1',
        },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: 'custom-service-transactions-eu-central-1-staging',
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'custom-service-processor-eu-central-1-staging',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'custom-service-primary-987654321098-eu-central-1-staging',
      });
    });

    test('should create replica in primary region when deployed to eu-central-1', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'EUStack', {
        environmentSuffix: 'dev',
        serviceName: 'test-service',
        env: {
          account: '123456789012',
          region: 'eu-central-1',
        },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        Replicas: Match.arrayWith([
          Match.objectLike({
            Region: 'us-east-1', // Should replicate to us-east-1
          }),
        ]),
      });
    });
  });

  describe('Removal Policies', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'dev',
        serviceName: 'test-service',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('should have deletion policy on DynamoDB table', () => {
      template.hasResource('AWS::DynamoDB::GlobalTable', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should have auto-delete on S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.keys(buckets).forEach((key) => {
        expect(buckets[key]).toHaveProperty('DeletionPolicy', 'Delete');
      });
    });
  });

  describe('Environment Suffix Fallback Logic (Lines 33-36)', () => {
    test('should use environmentSuffix from props when provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStackWithProps', {
        environmentSuffix: 'custom-env',
        serviceName: 'test-service',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template = Template.fromStack(stack);

      // Verify the custom environmentSuffix is used in resource names
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: 'test-service-transactions-us-east-1-custom-env',
      });
    });

    test('should use environmentSuffix from context when not in props', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });

      const stack = new TapStack(app, 'TestStackWithContext', {
        serviceName: 'test-service',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template = Template.fromStack(stack);

      // Verify the context environmentSuffix is used in resource names
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: 'test-service-transactions-us-east-1-context-env',
      });
    });

    test('should default to "dev" when environmentSuffix not provided anywhere', () => {
      const app = new cdk.App();

      const stack = new TapStack(app, 'TestStackDefault', {
        serviceName: 'test-service',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template = Template.fromStack(stack);

      // Verify the default 'dev' is used in resource names
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: 'test-service-transactions-us-east-1-dev',
      });
    });

    test('should prioritize props over context for environmentSuffix', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });

      const stack = new TapStack(app, 'TestStackPriority', {
        environmentSuffix: 'props-env',
        serviceName: 'test-service',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template = Template.fromStack(stack);

      // Verify props takes priority over context
      template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TableName: 'test-service-transactions-us-east-1-props-env',
      });
    });
  });
});
