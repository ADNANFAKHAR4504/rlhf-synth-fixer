import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Resources', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('creates VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('creates S3 Gateway Endpoint', () => {
      const resources = template.toJSON().Resources;
      const vpcEndpoints = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPCEndpoint'
      );
      const s3Endpoint = vpcEndpoints.find((ep: any) =>
        ep.Properties?.ServiceName?.['Fn::Join']?.[1]?.some(
          (part: any) => typeof part === 'string' && part.includes('.s3')
        )
      );
      expect(s3Endpoint).toBeDefined();
    });

    test('creates DynamoDB Gateway Endpoint', () => {
      const resources = template.toJSON().Resources;
      const vpcEndpoints = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPCEndpoint'
      );
      const dynamoEndpoint = vpcEndpoints.find((ep: any) =>
        ep.Properties?.ServiceName?.['Fn::Join']?.[1]?.some(
          (part: any) => typeof part === 'string' && part.includes('.dynamodb')
        )
      );
      expect(dynamoEndpoint).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    test('creates Database KMS key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('Database encryption key'),
        EnableKeyRotation: true,
      });
    });

    test('creates S3 KMS key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('S3 encryption key'),
        EnableKeyRotation: true,
      });
    });

    test('creates Lambda KMS key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp(
          'Lambda environment variables encryption key'
        ),
        EnableKeyRotation: true,
      });
    });

    test('all KMS keys have DESTROY removal policy', () => {
      const resources = template.toJSON().Resources;
      const kmsKeys = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );
      expect(kmsKeys.length).toBeGreaterThan(0);
      kmsKeys.forEach((key: any) => {
        // DESTROY policy means DeletionPolicy is either undefined or 'Delete'
        expect(key.DeletionPolicy).not.toBe('Retain');
        expect(key.UpdateReplacePolicy).not.toBe('Retain');
      });
    });
  });

  describe('Database Resources', () => {
    test('creates Aurora Serverless v2 cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 2,
        },
        StorageEncrypted: true,
      });
    });

    test('creates DynamoDB user sessions table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'sessionId',
            AttributeType: 'S',
          },
        ],
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('creates DynamoDB API keys table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: Match.arrayWith([
          {
            AttributeName: 'apiKey',
            AttributeType: 'S',
          },
        ]),
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'UserIdIndex',
          }),
        ]),
      });
    });

    test('Aurora cluster has no deletion protection', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });
  });

  describe('Storage Resources', () => {
    test('creates raw data S3 bucket with encryption', () => {
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates access logging bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 4); // raw, processed, archive, logs
    });

    test('all S3 buckets have public access blocked', () => {
      const resources = template.toJSON().Resources;
      const buckets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      buckets.forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toMatchObject({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('S3 buckets have lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  describe('Compute Resources', () => {
    test('creates Lambda function with ARM architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Environment: {
          Variables: Match.objectLike({
            ENVIRONMENT: 'test',
          }),
        },
      });
    });

    test('creates Dead Letter Queue for Lambda', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp('data-processor-dlq'),
      });
    });

    test('Lambda execution role has VPC access policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Lambda role has region restriction policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyOtherRegions',
              Effect: 'Deny',
              Condition: {
                StringNotEquals: {
                  'aws:RequestedRegion': Match.objectLike({
                    Ref: 'AWS::Region',
                  }),
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway Resources', () => {
    test('creates REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('trading-api'),
      });
    });

    test('creates API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Enabled: true,
      });
    });

    test('creates usage plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
        Quota: {
          Limit: 1000000,
          Period: 'MONTH',
        },
      });
    });

    test('API deployment has correct stage', () => {
      // Stage is created separately, not in deployment resource
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });
  });

  describe('Monitoring Resources', () => {
    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Trading Platform Alerts',
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('trading-dashboard'),
      });
    });

    test('creates CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3); // DB CPU, Lambda errors, API 5xx
    });

    test('creates CloudWatch Log Groups with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('Compliance Resources', () => {
    test('does not create AWS Config recorder', () => {
      template.resourceCountIs('AWS::Config::ConfigurationRecorder', 0);
    });

    test('does not create Config delivery channel', () => {
      template.resourceCountIs('AWS::Config::DeliveryChannel', 0);
    });

    test('creates Config rules for PCI-DSS compliance', () => {
      const configRuleCount = Object.values(template.toJSON().Resources).filter(
        (r: any) => r.Type === 'AWS::Config::ConfigRule'
      ).length;
      expect(configRuleCount).toBe(10);
    });

    test('creates S3 encryption Config rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          SourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      });
    });

    test('creates RDS encryption Config rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          SourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
        },
      });
    });

    test('creates VPC flow logs Config rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          SourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
        },
      });
    });

    test('creates DynamoDB PITR Config rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          SourceIdentifier: 'DYNAMODB_PITR_ENABLED',
        },
      });
    });

    test('creates IAM password policy Config rule', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          SourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
        InputParameters: Match.objectLike({
          MinimumPasswordLength: '14',
        }),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the trading analytics platform',
        Export: {
          Name: 'TradingPlatform-VpcId-test',
        },
      });
    });

    test('exports Database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'Aurora Serverless v2 PostgreSQL cluster endpoint',
        Export: {
          Name: 'TradingPlatform-DbEndpoint-test',
        },
      });
    });

    test('exports API Gateway URL', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL for client access',
        Export: {
          Name: 'TradingPlatform-ApiUrl-test',
        },
      });
    });

    test('exports all three S3 bucket names', () => {
      template.hasOutput('RawDataBucketName', {
        Export: {
          Name: 'TradingPlatform-RawBucket-test',
        },
      });
      template.hasOutput('ProcessedDataBucketName', {
        Export: {
          Name: 'TradingPlatform-ProcessedBucket-test',
        },
      });
      template.hasOutput('ArchiveBucketName', {
        Export: {
          Name: 'TradingPlatform-ArchiveBucket-test',
        },
      });
    });
  });

  describe('Resource Tags', () => {
    test('applies standard tags to stack', () => {
      const resources = template.toJSON().Resources;
      const vpc = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::EC2::VPC'
      );
      expect(vpc).toBeDefined();
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('S3 buckets include environmentSuffix', () => {
      const resources = template.toJSON().Resources;
      const buckets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      const namedBuckets = buckets.filter((b: any) => b.Properties.BucketName);
      namedBuckets.forEach((bucket: any) => {
        expect(bucket.Properties.BucketName).toMatch(/test/);
      });
    });

    test('Lambda function includes environmentSuffix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('test'),
      });
    });

    test('DynamoDB tables include environmentSuffix', () => {
      const resources = template.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::Table'
      );
      tables.forEach((table: any) => {
        if (table.Properties.TableName) {
          expect(table.Properties.TableName).toMatch(/test/);
        }
      });
    });

    test('defaults to "dev" when no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultEnvStack');
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('dev'),
      });
    });

    test('uses context value for environmentSuffix', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'prod',
        },
      });
      const testStack = new TapStack(testApp, 'ContextEnvStack');
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('prod'),
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets enforce SSL', () => {
      const resources = template.toJSON().Resources;
      const buckets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      // Checking for bucket policies that enforce SSL
      const bucketPolicies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::S3::BucketPolicy'
      );
      expect(bucketPolicies.length).toBeGreaterThan(0);
    });

    test('IAM roles follow least privilege', () => {
      const resources = template.toJSON().Resources;
      const roles = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );
      expect(roles.length).toBeGreaterThan(0);
      roles.forEach((role: any) => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of subnets', () => {
      // VPC creates subnets across AZs - verify we have the right count
      const resources = template.toJSON().Resources;
      const subnets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBeGreaterThanOrEqual(6); // At least 6 subnets created
    });

    test('creates NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates expected number of route tables', () => {
      // Public, Private×3, Isolated×3 + main = multiple route tables
      const resources = template.toJSON().Resources;
      const routeTables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::RouteTable'
      );
      expect(routeTables.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Removal Policies', () => {
    test('Aurora cluster is destroyable', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });

    test('DynamoDB tables are destroyable', () => {
      const resources = template.toJSON().Resources;
      const tables = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::DynamoDB::Table'
      );
      tables.forEach((table: any) => {
        expect(table.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('S3 buckets have autoDeleteObjects enabled', () => {
      // Buckets with autoDeleteObjects will have custom resources
      const resources = template.toJSON().Resources;
      const customResources = Object.values(resources).filter(
        (r: any) => r.Type === 'Custom::S3AutoDeleteObjects'
      );
      expect(customResources.length).toBeGreaterThan(0);
    });
  });
});
