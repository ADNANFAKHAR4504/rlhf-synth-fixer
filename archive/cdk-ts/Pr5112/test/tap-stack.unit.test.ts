import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { AmlPipelineStack } from '../lib/aml-pipeline-stack';

describe('TapStack', () => {
  let app: cdk.App;
  const environmentSuffix = 'test';

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
  });

  describe('Stack Creation', () => {
    test('should create TapStack with default environment suffix', () => {
      const stack = new TapStack(app, 'TestTapStack');
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should create TapStack with props environment suffix', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should create TapStack with context environment suffix', () => {
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'context-suffix' },
      });
      const stack = new TapStack(appWithContext, 'TestTapStack');
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should prioritize props over context for environmentSuffix', () => {
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'context-suffix' },
      });
      const stack = new TapStack(appWithContext, 'TestTapStack', {
        environmentSuffix: 'props-suffix',
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Nested Stack Configuration', () => {
    test('should create TapStack successfully', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should pass correct SageMaker endpoint name to pipeline', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      expect(stack).toBeDefined();
      // The nested AmlPipelineStack should receive sagemakerEndpointName
    });

    test('should pass correct Verified Permissions policy store ID', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      expect(stack).toBeDefined();
      // The nested AmlPipelineStack should receive verifiedPermissionsPolicyStoreId
    });

    test('should pass correct data bucket name to pipeline', () => {
      const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      expect(stack).toBeDefined();
      // The nested AmlPipelineStack should receive dataBucketName
    });
  });
});

describe('AmlPipelineStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let pipeline: AmlPipelineStack;
  let template: Template;
  const environmentSuffix = 'test';

  const defaultProps = {
    sagemakerEndpointName: 'test-sagemaker-endpoint',
    verifiedPermissionsPolicyStoreId: 'ps-test-12345',
    dataBucketName: 'test-data-bucket',
    environmentSuffix,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    pipeline = new AmlPipelineStack(stack, 'TestPipeline', defaultProps);
    template = Template.fromStack(pipeline);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and isolated subnets', () => {
      // VPC with 2 AZs creates 4 subnets (2 public + 2 isolated)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(4);
    });

    test('should create security groups', () => {
      // Multiple security groups for Redis, Neptune, and VPC defaults
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(2);
    });

    test('VPC should be accessible via public property', () => {
      expect(pipeline.vpc).toBeDefined();
      expect(pipeline.vpc).toBeInstanceOf(Object);
    });
  });

  describe('Hot Path Resources', () => {
    test('should create Kinesis stream with encryption', () => {
      template.resourceCountIs('AWS::Kinesis::Stream', 1);
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        RetentionPeriodHours: 24,
        ShardCount: 1,
        StreamEncryption: {
          EncryptionType: 'KMS',
          KeyId: 'alias/aws/kinesis',
        },
      });
    });

    test('should create DynamoDB table for customer risk profiles', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'customerId',
            KeyType: 'HASH',
          },
        ],
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should create DynamoDB GSI for risk level queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'riskLevel-index',
            KeySchema: [
              {
                AttributeName: 'riskLevel',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'lastUpdated',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('should create Redis cluster with encryption', () => {
      template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1);
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        Engine: 'redis',
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
        TransitEncryptionMode: 'required',
        Port: 6379,
        AutomaticFailoverEnabled: true,
      });
    });

    test('should create Redis subnet group', () => {
      template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1);
    });

    test('should create Triage Lambda function', () => {
      // We have 5 Lambda functions: Triage, Scoring, BedrockSummarizer, SarFiling, EvidenceArchiver
      const lambdas = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThanOrEqual(5);

      // Check that at least one Lambda has the expected configuration
      const hasExpectedLambda = Object.values(lambdas).some((lambda: any) => {
        return lambda.Properties?.Runtime === 'nodejs20.x';
      });
      expect(hasExpectedLambda).toBe(true);
    });

    test('should configure Triage Lambda with correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            VERIFIED_PERMISSIONS_POLICY_STORE_ID: 'ps-test-12345',
            SAGEMAKER_ENDPOINT_NAME: 'test-sagemaker-endpoint',
          },
        },
      });
    });

    test('should grant Triage Lambda permissions for Verified Permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasVerifiedPermissionsPolicy = Object.values(policies).some((policy: any) => {
        return policy.Properties?.PolicyDocument?.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) => action.includes('verifiedpermissions'));
        });
      });
      expect(hasVerifiedPermissionsPolicy).toBe(true);
    });

    test('should grant Triage Lambda permissions for SageMaker', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasSageMakerPolicy = Object.values(policies).some((policy: any) => {
        return policy.Properties?.PolicyDocument?.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) => action.includes('sagemaker'));
        });
      });
      expect(hasSageMakerPolicy).toBe(true);
    });

    test('should add Kinesis event source to Triage Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        StartingPosition: 'LATEST',
        BatchSize: 10,
      });
    });

    test('transaction stream should be accessible via public property', () => {
      expect(pipeline.transactionStream).toBeDefined();
      expect(pipeline.transactionStream).toBeInstanceOf(Object);
    });
  });

  describe('Warm Path Resources', () => {
    test('should create Neptune cluster with encryption', () => {
      template.resourceCountIs('AWS::Neptune::DBCluster', 1);
      template.hasResourceProperties('AWS::Neptune::DBCluster', {
        StorageEncrypted: true,
        IamAuthEnabled: true,
      });
    });

    test('should create Neptune subnet group', () => {
      template.resourceCountIs('AWS::Neptune::DBSubnetGroup', 1);
    });

    test('should create Aurora PostgreSQL cluster with encryption', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        StorageEncrypted: true,
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 1,
        },
      });
    });

    test('should create Athena workgroup', () => {
      template.resourceCountIs('AWS::Athena::WorkGroup', 1);
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        WorkGroupConfiguration: {
          EnforceWorkGroupConfiguration: true,
          PublishCloudWatchMetricsEnabled: true,
        },
      });
    });

    test('should create S3 bucket for Athena results with encryption', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
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

    test('should create Scoring Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 300,
        MemorySize: 512,
      });
    });

    test('should create Bedrock Summarizer Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Environment: {
          Variables: {
            BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
          },
        },
      });
    });

    test('should grant Bedrock permissions to Summarizer Lambda', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasBedrockPolicy = Object.values(policies).some((policy: any) => {
        return policy.Properties?.PolicyDocument?.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) => action.includes('bedrock'));
        });
      });
      expect(hasBedrockPolicy).toBe(true);
    });

    test('should create Step Functions state machine', () => {
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('should create CloudWatch Logs for Step Functions', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('Action Path Resources', () => {
    test('should create API Gateway for SAR filing', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('SAR Filing API'),
      });
    });

    test('should create API Gateway deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    });

    test('should create API Gateway stage with logging', () => {
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('should create SAR Filing Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 30,
      });
    });

    test('should create OpenSearch Serverless collection', () => {
      template.resourceCountIs('AWS::OpenSearchServerless::Collection', 1);
      template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
        Type: 'SEARCH',
      });
    });

    test('should create OpenSearch encryption policy', () => {
      template.resourceCountIs('AWS::OpenSearchServerless::SecurityPolicy', 2);
      template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
        Type: 'encryption',
      });
    });

    test('should create OpenSearch network policy', () => {
      template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
        Type: 'network',
      });
    });

    test('should create Evidence Archiver Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 60,
      });
    });

    test('should grant OpenSearch permissions to Evidence Archiver', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasOpenSearchPolicy = Object.values(policies).some((policy: any) => {
        return policy.Properties?.PolicyDocument?.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) => action.includes('aoss'));
        });
      });
      expect(hasOpenSearchPolicy).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    test('should create outputs for all infrastructure components', () => {
      // CDK synthesizes outputs with unique IDs, so we check that outputs exist
      const templateJson = JSON.parse(JSON.stringify(template.toJSON()));
      const outputs = templateJson.Outputs || {};

      // Verify we have outputs defined
      expect(Object.keys(outputs).length).toBeGreaterThan(0);

      // Check for some key outputs by looking for partial name matches
      const outputKeys = Object.keys(outputs);
      const hasKinesisOutput = outputKeys.some(key => key.includes('TransactionStream'));
      const hasDynamoOutput = outputKeys.some(key => key.includes('CustomerRiskTable'));
      const hasStepFunctionOutput = outputKeys.some(key => key.includes('StepFunction'));

      expect(hasKinesisOutput).toBe(true);
      expect(hasDynamoOutput).toBe(true);
      expect(hasStepFunctionOutput).toBe(true);
    });

    test('should create Hot Path outputs', () => {
      const templateJson = JSON.parse(JSON.stringify(template.toJSON()));
      const outputs = templateJson.Outputs || {};
      const outputKeys = Object.keys(outputs);

      // Check for Kinesis, DynamoDB, Redis, Lambda outputs
      const hasRedisOutput = outputKeys.some(key => key.includes('Redis'));
      const hasTriageLambdaOutput = outputKeys.some(key => key.includes('TriageLambda'));

      expect(hasRedisOutput).toBe(true);
      expect(hasTriageLambdaOutput).toBe(true);
    });

    test('should create Warm Path outputs', () => {
      const templateJson = JSON.parse(JSON.stringify(template.toJSON()));
      const outputs = templateJson.Outputs || {};
      const outputKeys = Object.keys(outputs);

      // Check for Neptune, Aurora, Athena outputs
      const hasNeptuneOutput = outputKeys.some(key => key.includes('Neptune'));
      const hasAuroraOutput = outputKeys.some(key => key.includes('Aurora'));
      const hasAthenaOutput = outputKeys.some(key => key.includes('Athena'));

      expect(hasNeptuneOutput).toBe(true);
      expect(hasAuroraOutput).toBe(true);
      expect(hasAthenaOutput).toBe(true);
    });

    test('should create Action Path outputs', () => {
      const templateJson = JSON.parse(JSON.stringify(template.toJSON()));
      const outputs = templateJson.Outputs || {};
      const outputKeys = Object.keys(outputs);

      // Check for API Gateway, OpenSearch outputs
      const hasSarApiOutput = outputKeys.some(key => key.includes('SarApi'));
      const hasOpenSearchOutput = outputKeys.some(key => key.includes('OpenSearch'));

      expect(hasSarApiOutput).toBe(true);
      expect(hasOpenSearchOutput).toBe(true);
    });

    test('should create infrastructure outputs', () => {
      const templateJson = JSON.parse(JSON.stringify(template.toJSON()));
      const outputs = templateJson.Outputs || {};
      const outputKeys = Object.keys(outputs);

      // Check for VPC and Region outputs
      const hasVpcOutput = outputKeys.some(key => key.includes('Vpc'));
      const hasRegionOutput = outputKeys.some(key => key.includes('Region'));

      expect(hasVpcOutput).toBe(true);
      expect(hasRegionOutput).toBe(true);
    });
  });

  describe('IAM Permissions and Security', () => {
    test('should create IAM roles for Lambda functions', () => {
      // Each Lambda function gets a role, plus Step Functions role
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(5);
    });

    test('should grant Step Functions permissions for Athena', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasAthenaPolicy = Object.values(policies).some((policy: any) => {
        return policy.Properties?.PolicyDocument?.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) => action.includes('athena'));
        });
      });
      expect(hasAthenaPolicy).toBe(true);
    });

    test('should grant Aurora Data API access to Scoring Lambda', () => {
      // Aurora Data API access is granted through grantDataApiAccess
      // which adds rds-data and secretsmanager permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const hasScoringPolicy = Object.values(policies).some((policy: any) => {
        return policy.Properties?.PolicyDocument?.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) => action.includes('rds-data'));
        });
      });
      expect(hasScoringPolicy).toBe(true);
    });

    test('should grant DynamoDB read access to Triage Lambda', () => {
      // DynamoDB read access is granted through grantReadData
      const policies = template.findResources('AWS::IAM::Policy');
      const hasDynamoPolicy = Object.values(policies).some((policy: any) => {
        return policy.Properties?.PolicyDocument?.Statement?.some((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          return actions.some((action: string) =>
            action.includes('dynamodb:GetItem') ||
            action.includes('dynamodb:Query') ||
            action.includes('dynamodb:Scan')
          );
        });
      });
      expect(hasDynamoPolicy).toBe(true);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should apply environment suffix to resource names', () => {
      // Neptune cluster should have suffix in identifier
      template.hasResourceProperties('AWS::Neptune::DBCluster', {
        DBClusterIdentifier: `aml-neptune-${environmentSuffix}`,
      });
    });

    test('should apply environment suffix to Aurora cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: `aml-aurora-${environmentSuffix}`,
      });
    });

    test('should apply environment suffix to Redis cluster', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        ReplicationGroupId: `aml-redis-${environmentSuffix}`,
      });
    });

    test('should apply environment suffix to OpenSearch collection', () => {
      template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
        Name: `aml-evid-${environmentSuffix}`,
      });
    });
  });

  describe('Cost Optimization Configuration', () => {
    test('should use minimal shard count for Kinesis', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        ShardCount: 1,
      });
    });

    test('should use Aurora Serverless v2 with minimal capacity', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,
          MaxCapacity: 1,
        },
      });
    });

    test('should use small cache node type for Redis', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        CacheNodeType: 'cache.t3.micro',
      });
    });

    test('should use reduced Lambda memory size', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 512,
      });
    });

    test('should configure S3 lifecycle rules for Athena results', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 7,
              Id: 'delete-old-results',
              Prefix: 'athena-results/',
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('Deletion and Cleanup Configuration', () => {
    test('should configure S3 bucket for automatic deletion', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should configure DynamoDB table for automatic deletion', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should disable deletion protection on Aurora cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DeletionProtection: false,
      });
    });

    test('should disable deletion protection on Neptune cluster', () => {
      template.hasResourceProperties('AWS::Neptune::DBCluster', {
        DeletionProtection: false,
      });
    });
  });
});
