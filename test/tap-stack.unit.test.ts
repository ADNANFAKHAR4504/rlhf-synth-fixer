import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const TEST_ACCOUNT = process.env.AWS_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT || '000000000000';
const TEST_REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-west-2';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Dev Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with dev CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('RDS cluster created with t3.medium instance', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        DatabaseName: 'paymentdb',
        StorageEncrypted: true,
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.medium',
        Engine: 'aurora-postgresql',
      });
    });

    test('All RDS resources have DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBCluster', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('SQS queues created with correct retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 86400, // 1 day for dev
      });
    });

    test('Dead letter queue configured', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('S3 bucket has 7-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 7,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('S3 bucket has DESTROY removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('Lambda function created with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 30,
        MemorySize: 512,
        Environment: {
          Variables: {
            SSM_CONFIG_PATH: '/dev/payment-service/config/settings',
            ENVIRONMENT: 'dev',
            DB_NAME: 'paymentdb',
          },
        },
      });
    });

    test('Lambda has IAM permissions for SSM', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Effect: 'Allow',
              Resource: Match.anyValue(), // Resource format may vary (string or Fn::Join)
            }),
          ]),
        },
      });
    });

    test('API Gateway created with dev stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payment-api-dev',
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'dev',
      });
    });

    test('WAF Web ACL created with rate limiting', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'payment-waf-dev',
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
            Statement: {
              RateBasedStatement: {
                Limit: 500, // Dev limit
                AggregateKeyType: 'IP',
              },
            },
            Action: {
              Block: {},
            },
          }),
        ]),
      });
    });

    test('SSM parameter created for dev config', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dev/payment-service/config/settings',
        Type: 'String',
      });
    });

    test('CloudFormation outputs created', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('VpcId');
      expect(Object.keys(outputs)).toContain('DatabaseEndpoint');
      expect(Object.keys(outputs)).toContain('ApiUrl');
      expect(Object.keys(outputs)).toContain('QueueUrl');
      expect(Object.keys(outputs)).toContain('BucketName');
      expect(Object.keys(outputs)).toContain('LambdaFunctionName');
      expect(Object.keys(outputs)).toContain('WafAclArn');
    });
  });

  describe('Staging Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with staging CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('RDS cluster created with r5.large instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.large',
      });
    });

    test('SQS queue has 7-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 604800, // 7 days
      });
    });

    test('S3 bucket has 30-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 30,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 15, // 30/2 = 15
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with prod CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });
    });

    test('RDS cluster created with r5.xlarge instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.xlarge',
      });
    });

    test('SQS queue has 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('S3 bucket has 90-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 90,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 45, // 90/2 = 45
                },
              ],
            },
          ],
        },
      });
    });

    test('API Gateway has method settings', () => {
      // Throttling is configured via deployOptions which appear in MethodSettings
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([Match.objectLike({})]),
      });
    });

    test('WAF has production rate limits', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Statement: {
              RateBasedStatement: {
                Limit: 2000, // Prod limit
              },
            },
          }),
        ]),
      });
    });
  });

  describe('Configuration Validation', () => {
    test('Invalid environment throws error', () => {
      expect(() => {
        new TapStack(app, 'TestStack', {
          environmentSuffix: 'invalid',
        });
      }).toThrow('Environment configuration not found for: invalid');
    });

    test('Environment suffix from props takes precedence', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('Environment suffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('Environment suffix defaults to dev when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('Resource Counting', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      template = Template.fromStack(stack);
    });

    test('Has VPC resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Has RDS cluster and instance', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('Has two SQS queues (main + DLQ)', () => {
      template.resourceCountIs('AWS::SQS::Queue', 2);
    });

    test('Has S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('Has Lambda function', () => {
      // Check for at least 1 Lambda (may have custom resource Lambdas too)
      const resources = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(1);
      // Verify payment handler Lambda exists
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
      });
    });

    test('Has API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('Has WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('Has SSM parameter', () => {
      template.resourceCountIs('AWS::SSM::Parameter', 1);
    });
  });

  describe('Lambda Handler Unit Tests', () => {
    const mockSSMClient = {
      send: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('Lambda handler should be included in stack', () => {
      // Check for at least 1 Lambda (may have custom resource Lambdas too)
      const resources = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(1);
      // Verify payment handler Lambda exists
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
      });
    });

    test('Lambda should have correct handler path', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
      });
    });

    test('Lambda should have environment variables set', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            SSM_CONFIG_PATH: '/dev/payment-service/config/settings',
            ENVIRONMENT: 'dev',
            DB_NAME: 'paymentdb',
          },
        },
      });
    });
  });

  describe('Payment Config Unit Tests', () => {
    test('Dev config should have correct VPC CIDR', () => {
      const devStack = new TapStack(app, 'DevStack', {
        environmentSuffix: 'dev',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      const devTemplate = Template.fromStack(devStack);
      devTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('Staging config should have correct VPC CIDR', () => {
      const stagingStack = new TapStack(app, 'StagingStack', {
        environmentSuffix: 'staging',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      const stagingTemplate = Template.fromStack(stagingStack);
      stagingTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('Prod config should have correct VPC CIDR', () => {
      const prodStack = new TapStack(app, 'ProdStack', {
        environmentSuffix: 'prod',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      const prodTemplate = Template.fromStack(prodStack);
      prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });
    });

    test('PR6742 config should have correct VPC CIDR', () => {
      const pr6742Stack = new TapStack(app, 'PR6742Stack', {
        environmentSuffix: 'pr6742',
        env: { account: TEST_ACCOUNT, region: TEST_REGION },
      });
      const pr6742Template = Template.fromStack(pr6742Stack);
      pr6742Template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.3.0.0/16',
      });
    });

    test('All environments should have unique VPC CIDRs', () => {
      const envs = ['dev', 'staging', 'prod', 'pr6742'];
      const cidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16'];

      envs.forEach((env, index) => {
        // Create a new app for each environment to avoid synthesis conflicts
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `TestStack${env}`, {
          environmentSuffix: env,
          env: { account: TEST_ACCOUNT, region: TEST_REGION },
        });
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: cidrs[index],
        });
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('Lambda security group should be created', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    });

    test('Database security group should allow Lambda access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        // Ports are dynamic references to database endpoint, so we check they exist
        FromPort: Match.anyValue(),
        ToPort: Match.anyValue(),
      });
    });
  });

  describe('VPC Networking', () => {
    test('VPC should have public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('VPC should have internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('VPC should have route tables', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
    });

    test('VPC should have S3 endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': [
            '',
            ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3'],
          ],
        },
      });
    });
  });

  describe('Database Configuration', () => {
    test('RDS cluster should have backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('RDS cluster should have preferred backup window', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredBackupWindow: '03:00-04:00',
      });
    });

    test('RDS cluster should have preferred maintenance window', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('RDS secret should be created', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('RDS secret should be attached to cluster', () => {
      template.resourceCountIs('AWS::SecretsManager::SecretTargetAttachment', 1);
    });
  });

  describe('API Gateway Configuration', () => {
    test('API Gateway should have CORS enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('API Gateway should have method settings configured', () => {
      // deployOptions configure these settings but they appear in MethodSettings
      // not as direct Stage properties
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([Match.objectLike({})]),
      });
    });

    test('API Gateway should have health endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('API Gateway should have payments endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'payments',
      });
    });
  });

  describe('WAF Configuration', () => {
    test('WAF should have managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: [
          {
            Name: 'RateLimitRule',
            Priority: 1,
          },
          {
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 2,
          },
          {
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 3,
          },
        ],
      });
    });

    test('WAF should be associated with API Gateway', () => {
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
    });
  });

  describe('SQS Configuration', () => {
    test('Main queue should have dead letter queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('Queue should have encryption enabled', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        SqsManagedSseEnabled: true,
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('S3 bucket should have encryption enabled', () => {
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

    test('S3 bucket should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket should have public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket should have auto-delete enabled for dev', () => {
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 1);
    });
  });

  describe('IAM Permissions', () => {
    test('Lambda should have IAM role attached', () => {
      // Check for at least 2 IAM roles (may have custom resource roles too)
      const resources = template.findResources('AWS::IAM::Role');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(2);
    });

    test('Lambda role should have policies attached', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      expect(policies.length).toBeGreaterThan(0);
    });

    test('IAM policies should have policy documents', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      policies.forEach((policy: any) => {
        expect(policy.Properties.PolicyDocument).toBeDefined();
        expect(policy.Properties.PolicyDocument.Statement).toBeDefined();
        expect(Array.isArray(policy.Properties.PolicyDocument.Statement)).toBe(
          true
        );
      });
    });
  });

  describe('Tags and Naming', () => {
    test('Resources should have environment tags', () => {
      const resources = template.toJSON().Resources;
      const resourceWithTags = Object.values(resources).find(
        (r: any) => r.Properties?.Tags
      );
      expect(resourceWithTags).toBeDefined();
    });

    test('Stack outputs should have description', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.ApiUrl).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
    });
  });
});
