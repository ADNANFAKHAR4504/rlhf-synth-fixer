import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { WebhookStack } from '../lib/webhook';

describe('WebhookStack Unit Tests', () => {
  let app: cdk.App;
  let stack: WebhookStack;
  let template: Template;
  const environmentSuffix = 'test';
  const stageName = 'dev';

  beforeEach(() => {
    app = new cdk.App();
    stack = new WebhookStack(app, `WebhookStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
      stageName,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('stack synthesizes without errors', () => {
      expect(() => app.synth()).not.toThrow();
    });

    test('stack has correct name format', () => {
      expect(stack.stackName).toBe(`WebhookStack${environmentSuffix}`);
    });
  });

  describe('KMS Key Configuration', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.anyValue(),
              }),
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });

    test('creates KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/marketgrid-${stageName}-${environmentSuffix}`,
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `MarketGrid-Transactions-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'vendorId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ]),
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('creates Global Secondary Index for vendor queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'VendorIndex',
            KeySchema: [
              {
                AttributeName: 'vendorId',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          }),
        ]),
      });
    });

    test('DynamoDB table uses KMS encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `marketgrid-webhook-archive-${environmentSuffix}`,
      });
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'ArchiveOldWebhooks',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 90,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 180,
                },
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('SQS Queue Configuration', () => {
    test('creates main FIFO queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `MarketGrid-Webhook-Queue-${environmentSuffix}.fifo`,
        FifoQueue: true,
        ContentBasedDeduplication: true,
        VisibilityTimeout: 300,
        MessageRetentionPeriod: 604800, // 7 days
      });
    });

    test('creates DLQ FIFO queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `MarketGrid-Webhook-DLQ-${environmentSuffix}.fifo`,
        FifoQueue: true,
        ContentBasedDeduplication: true,
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('main queue has redrive policy to DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: Match.objectLike({
          maxReceiveCount: 3,
        }),
      });
    });

    test('queues use KMS encryption', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      Object.values(queues).forEach((queue: any) => {
        expect(queue.Properties.KmsMasterKeyId).toBeDefined();
      });
    });
  });

  describe('Lambda Functions Configuration', () => {
    test('creates authorizer Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `MarketGrid-Authorizer-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        MemorySize: 256,
        Timeout: 5,
        Environment: {
          Variables: {
            PARAMETER_STORE_PREFIX: `/marketgrid/${stageName}/${environmentSuffix}/api-keys/`,
          },
        },
      });
    });

    test('creates webhook processing Lambda', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const processorLambda = Object.values(lambdas).find((lambda: any) =>
        lambda.Properties.FunctionName === `MarketGrid-WebhookProcessor-${environmentSuffix}`
      ) as any;

      expect(processorLambda).toBeDefined();
      expect(processorLambda.Properties.Runtime).toBe('nodejs18.x');
      expect(processorLambda.Properties.MemorySize).toBe(3008);
      expect(processorLambda.Properties.Timeout).toBe(30);
      // TRANSACTIONS_TABLE is a CloudFormation reference
      expect(processorLambda.Properties.Environment.Variables.TRANSACTIONS_TABLE).toBeDefined();
    });

    test('creates webhook archiver Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `MarketGrid-WebhookArchiver-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        MemorySize: 256,
        Timeout: 30,
      });
    });

    test('creates vendor notification Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `MarketGrid-VendorNotifier-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        MemorySize: 256,
        Timeout: 10,
      });
    });

    test('Lambda functions have X-Ray tracing enabled', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      // Filter to only application Lambdas (not CDK custom resources)
      const appLambdas = Object.values(lambdas).filter((lambda: any) =>
        lambda.Properties.FunctionName?.includes('MarketGrid-')
      );
      appLambdas.forEach((lambda: any) => {
        expect(lambda.Properties.TracingConfig?.Mode).toBe('Active');
      });
    });
  });

  describe('Lambda Provisioned Concurrency', () => {
    test('creates Lambda version', () => {
      const versions = template.findResources('AWS::Lambda::Version');
      expect(Object.keys(versions).length).toBeGreaterThan(0);
    });

    test('creates Lambda alias with provisioned concurrency', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'production',
        ProvisionedConcurrencyConfig: {
          ProvisionedConcurrentExecutions: 10,
        },
      });
    });

    test('creates Application Auto Scaling target', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 10,
        MaxCapacity: 500,
        ScalableDimension: 'lambda:function:ProvisionedConcurrency',
        ServiceNamespace: 'lambda',
      });
    });

    test('creates Auto Scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 0.7,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'LambdaProvisionedConcurrencyUtilization',
          },
        },
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('creates REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `MarketGrid-${stageName}-Webhook-API-${environmentSuffix}`,
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: stageName,
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    test('creates webhook resource paths', () => {
      const resources = template.findResources('AWS::ApiGateway::Resource');
      const resourcePaths = Object.values(resources).map(
        (r: any) => r.Properties.PathPart
      );
      expect(resourcePaths).toContain('webhook');
      expect(resourcePaths).toContain('stripe');
      expect(resourcePaths).toContain('paypal');
    });

    test('creates POST methods for webhook endpoints', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');
      const postMethods = Object.values(methods).filter(
        (m: any) => m.Properties.HttpMethod === 'POST'
      );
      expect(postMethods.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF Web ACL with multiple rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 0,
          }),
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 2,
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 3,
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesAmazonIpReputationList',
            Priority: 4,
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesAnonymousIpList',
            Priority: 5,
          }),
          Match.objectLike({
            Name: 'BlockOversizedRequests',
            Priority: 6,
          }),
          Match.objectLike({
            Name: 'BlockSuspiciousUserAgents',
            Priority: 7,
          }),
        ]),
      });
    });

    test('rate limit rule blocks at 10000 requests', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Statement: {
              RateBasedStatement: {
                Limit: 10000,
                AggregateKeyType: 'IP',
              },
            },
          }),
        ]),
      });
    });

    test('oversized request rule blocks > 8KB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'BlockOversizedRequests',
            Statement: {
              SizeConstraintStatement: {
                ComparisonOperator: 'GT',
                Size: 8192,
              },
            },
          }),
        ]),
      });
    });

    test('associates WAF with API Gateway', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        WebACLArn: Match.anyValue(),
        ResourceArn: Match.anyValue(), // Can be intrinsic function
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    test('creates SNS topic for vendor notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `MarketGrid-${stageName}-VendorNotifications-${environmentSuffix}`,
        DisplayName: `MarketGrid ${stageName} Vendor Notifications`,
      });
    });

    test('SNS topic uses KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('EventBridge Pipes Configuration', () => {
    test('creates EventBridge Pipe from DynamoDB to Lambda', () => {
      template.hasResourceProperties('AWS::Pipes::Pipe', {
        Name: `MarketGrid-${stageName}-DynamoStream-${environmentSuffix}`,
        SourceParameters: {
          DynamoDBStreamParameters: {
            StartingPosition: 'LATEST',
            BatchSize: 10,
            MaximumBatchingWindowInSeconds: 5,
          },
        },
      });
    });

    test('EventBridge Pipe has filter for INSERT events', () => {
      template.hasResourceProperties('AWS::Pipes::Pipe', {
        SourceParameters: {
          FilterCriteria: {
            Filters: Match.arrayWith([
              Match.objectLike({
                Pattern: Match.stringLikeRegexp('.*INSERT.*'),
              }),
            ]),
          },
        },
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates CloudWatch dashboard', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      expect(Object.keys(dashboards).length).toBeGreaterThan(0);
    });

    test('dashboard has DashboardBody defined', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;
      // DashboardBody can be an intrinsic function, so just verify it exists
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('IAM Permissions', () => {
    test('authorizer Lambda has SSM parameter access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['ssm:GetParameter', 'ssm:GetParameters']),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('webhook processor Lambda has CloudWatch Metrics permission', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'cloudwatch:PutMetricData',
              Effect: 'Allow',
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('webhook processor Lambda has DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
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
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('archiver Lambda has S3 write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('vendor notification Lambda has SNS publish permission', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('SSM Parameters', () => {
    test('creates SSM parameter for table name', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/marketgrid/${stageName}/${environmentSuffix}/transactions-table-name`,
        Type: 'String',
      });
    });

    test('creates SSM parameter for bucket name', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/marketgrid/${stageName}/${environmentSuffix}/webhook-archive-bucket-name`,
        Type: 'String',
      });
    });

    test('creates SSM parameter for queue URL', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/marketgrid/${stageName}/${environmentSuffix}/webhook-queue-url`,
        Type: 'String',
      });
    });

    test('creates SSM parameter for SNS topic ARN', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/marketgrid/${stageName}/${environmentSuffix}/vendor-notification-topic-arn`,
        Type: 'String',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Export: {
          Name: `MarketGrid-ApiEndpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports webhook URLs', () => {
      template.hasOutput('StripeWebhookUrl', {
        Export: {
          Name: `MarketGrid-StripeWebhookUrl-${environmentSuffix}`,
        },
      });
      template.hasOutput('PaypalWebhookUrl', {
        Export: {
          Name: `MarketGrid-PaypalWebhookUrl-${environmentSuffix}`,
        },
      });
    });

    test('exports DynamoDB table name', () => {
      template.hasOutput('TransactionsTableName', {
        Export: {
          Name: `MarketGrid-TransactionsTableName-${environmentSuffix}`,
        },
      });
    });

    test('exports Lambda ARNs', () => {
      template.hasOutput('WebhookProcessingLambdaArn', {
        Export: {
          Name: `MarketGrid-WebhookProcessingLambdaArn-${environmentSuffix}`,
        },
      });
    });

    test('exports WAF WebACL ID', () => {
      template.hasOutput('WafWebAclId', {
        Export: {
          Name: `MarketGrid-WafWebAclId-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Custom Domain Configuration (Optional)', () => {
    test('creates stack without custom domain', () => {
      const noDomainApp = new cdk.App();
      const noDomainStack = new WebhookStack(noDomainApp, 'WebhookStackNoDomain', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'test',
        stageName: 'dev',
      });

      expect(() => noDomainApp.synth()).not.toThrow();
    });

    test('creates stack with custom domain', () => {
      const domainApp = new cdk.App();
      const domainStack = new WebhookStack(domainApp, 'WebhookStackDomain', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        environmentSuffix: 'test',
        stageName: 'dev',
        domainName: 'webhooks.example.com',
        hostedZoneId: 'Z1234567890ABC',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      });

      const domainTemplate = Template.fromStack(domainStack);

      // Should create custom domain
      domainTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: 'webhooks.example.com',
        RegionalCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      });

      // Should create Route53 record
      domainTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'webhooks.example.com.',
        Type: 'A',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of Lambda functions', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      // Filter to only application Lambdas (not CDK custom resources)
      const appLambdas = Object.values(lambdas).filter((lambda: any) =>
        lambda.Properties.FunctionName?.includes('MarketGrid-')
      );
      expect(appLambdas.length).toBe(4); // authorizer, processor, archiver, notifier
    });

    test('creates expected number of SQS queues', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      expect(Object.keys(queues).length).toBe(2); // main queue + DLQ
    });

    test('creates expected number of DynamoDB tables', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(tables).length).toBe(1);
    });

    test('creates expected number of S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBe(1);
    });

    test('creates expected number of SNS topics', () => {
      const topics = template.findResources('AWS::SNS::Topic');
      expect(Object.keys(topics).length).toBe(1);
    });

    test('creates expected number of KMS keys', () => {
      const keys = template.findResources('AWS::KMS::Key');
      expect(Object.keys(keys).length).toBe(1);
    });

    test('creates at least 30 outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(30);
    });
  });
});
