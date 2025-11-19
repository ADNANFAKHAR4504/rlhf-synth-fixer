import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack - Financial Trading Analytics Platform', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR and 3 AZs', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `trading-vpc-${environmentSuffix}` },
        ]),
      });
    });

    test('should create public and private subnets in each AZ', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private
    });

    test('should create 3 NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });
  });

  describe('KMS Keys Configuration', () => {
    test('should create 4 KMS keys with rotation enabled', () => {
      template.resourceCountIs('AWS::KMS::Key', 4); // DB, S3, Lambda, DynamoDB

      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.objectLike({}),
              }),
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });

    test('should create KMS key aliases for each key', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/database-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/s3-key-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/lambda-key-${environmentSuffix}`,
      });
    });

    test('all KMS keys should have DESTROY removal policy', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach(key => {
        expect(key.UpdateReplacePolicy).toBe('Delete');
        expect(key.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Aurora Serverless v2 Database', () => {
    test('should use customer-managed KMS key for encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        KmsKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('DbEncryptionKey'),
          ]),
        }),
      });
    });

    test('should have 7-day backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('should have DESTROY removal policy', () => {
      const clusters = template.findResources('AWS::RDS::DBCluster');
      Object.values(clusters).forEach(cluster => {
        expect(cluster.UpdateReplacePolicy).toBe('Delete');
        expect(cluster.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('should create sessions table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `user-sessions-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should create API keys table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `api-keys-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'apiKeyId',
            KeyType: 'HASH',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should use customer-managed KMS encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
          KMSMasterKeyId: Match.objectLike({
            'Fn::GetAtt': Match.arrayWith([
              Match.stringLikeRegexp('DynamoEncryptionKey'),
            ]),
          }),
        },
      });
    });

    test('DynamoDB tables should have DESTROY removal policy', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach(table => {
        expect(table.UpdateReplacePolicy).toBe('Delete');
        expect(table.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('S3 Buckets', () => {
    test('ingestion bucket should have correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `trading-ingestion-${environmentSuffix}-123456789012`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('all buckets should enforce SSL', () => {
      const buckets = template.findResources('AWS::S3::BucketPolicy');
      Object.values(buckets).forEach(bucketPolicy => {
        const policyDoc = bucketPolicy.Properties.PolicyDocument;
        expect(policyDoc.Statement).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Deny',
              Principal: expect.objectContaining({ AWS: '*' }),
              Condition: expect.objectContaining({
                Bool: expect.objectContaining({
                  'aws:SecureTransport': 'false',
                }),
              }),
            }),
          ])
        );
      });
    });

    test('buckets should use customer-managed KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.objectLike({
                  'Fn::GetAtt': Match.arrayWith([
                    Match.stringLikeRegexp('S3EncryptionKey'),
                  ]),
                }),
              },
            },
          ],
        },
      });
    });

    test('ingestion and analytics buckets should have 90-day Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('trading-ingestion'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ]),
            }),
          ]),
        },
      });
    });

    test('archival bucket should have Deep Archive transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('trading-archival'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'DEEP_ARCHIVE',
                  TransitionInDays: 90,
                },
              ]),
            }),
          ]),
        },
      });
    });

    test('all buckets should have DESTROY removal policy', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `data-processor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Architectures: ['arm64'],
      });
    });

    test('Lambda should use ARM64 (Graviton2) architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64'],
      });
    });

    test('Lambda should have environment variables encrypted with KMS', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        KmsKeyArn: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([
            Match.stringLikeRegexp('LambdaEncryptionKey'),
          ]),
        }),
        Environment: {
          Variables: {
            ENVIRONMENT: environmentSuffix,
            SESSIONS_TABLE: Match.anyValue(),
            API_KEYS_TABLE: Match.anyValue(),
          },
        },
      });
    });

  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `trading-api-${environmentSuffix}`,
        Description: 'API for trading analytics platform',
      });
    });

    test('should have CloudWatch logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
          }),
        ]),
      });
    });

    test('should have usage plan with 1000 RPS throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `trading-usage-plan-${environmentSuffix}`,
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
      });
    });

    test('should create API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `trading-api-key-${environmentSuffix}`,
        Enabled: true,
      });
    });

    test('should require API key for endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        ApiKeyRequired: true,
      });
    });
  });

  describe('AWS Config', () => {
    test('Config role should have regional restrictions', () => {
      const capture = new Capture();
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
              Condition: {
                StringNotEquals: {
                  'aws:RequestedRegion': ['us-east-1'],
                },
              },
            },
          ]),
        },
        Roles: Match.arrayWith([capture]),
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('API Gateway should have 30-day log retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/trading-api-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `VpcId-${environmentSuffix}`,
        },
      });
    });

    test('should export Database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'Database cluster endpoint',
        Export: {
          Name: `DatabaseEndpoint-${environmentSuffix}`,
        },
      });
    });

    test('should export API Gateway URL', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: `ApiUrl-${environmentSuffix}`,
        },
      });
    });

    test('should export all S3 bucket names', () => {
      template.hasOutput('IngestionBucketName', {
        Description: 'Ingestion S3 bucket name',
        Export: {
          Name: `IngestionBucket-${environmentSuffix}`,
        },
      });

      template.hasOutput('AnalyticsBucketName', {
        Description: 'Analytics S3 bucket name',
        Export: {
          Name: `AnalyticsBucket-${environmentSuffix}`,
        },
      });

      template.hasOutput('ArchivalBucketName', {
        Description: 'Archival S3 bucket name',
        Export: {
          Name: `ArchivalBucket-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Security and Compliance Requirements', () => {
    test('all data at rest should be encrypted with customer-managed KMS keys', () => {
      // RDS
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });

      // DynamoDB
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });

      // S3
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

    test('all resources should include environmentSuffix in names', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp(environmentSuffix) },
        ]),
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(environmentSuffix),
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp(environmentSuffix),
      });
    });

  });
});

describe('TapStack - Environment Suffix Handling', () => {
  let app: cdk.App;

  test('should use environmentSuffix from props when provided', () => {
    app = new cdk.App();
    const stack = new TapStack(app, 'TestStackWithSuffix', {
      environmentSuffix: 'production',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    // Verify that the suffix is used in resource names
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'trading-vpc-production' },
      ]),
    });
  });

  test('should use context value when props.environmentSuffix is not provided', () => {
    app = new cdk.App();
    app.node.setContext('environmentSuffix', 'staging');
    const stack = new TapStack(app, 'TestStackWithContext', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    // Verify that the context suffix is used in resource names
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'trading-vpc-staging' },
      ]),
    });
  });

  test('should default to "dev" when neither props nor context provide environmentSuffix', () => {
    app = new cdk.App();
    const stack = new TapStack(app, 'TestStackDefault', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    // Verify that the default 'dev' suffix is used in resource names
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'trading-vpc-dev' },
      ]),
    });
  });

  test('should handle undefined props gracefully', () => {
    app = new cdk.App();
    const stack = new TapStack(app, 'TestStackUndefinedProps');
    const template = Template.fromStack(stack);

    // Verify stack is created with default suffix
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'trading-vpc-dev' },
      ]),
    });
  });
});
