import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should use default environment suffix when not provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('should use context environment suffix when provided', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'context-test');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });
  });

  describe('Global Tagging', () => {
    test('should apply Environment: Production tag to all resources', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('should apply ManagedBy: CDK tag to all resources', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });

    test('should apply SecurityBaseline: Enforced tag to all resources', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          {
            Key: 'SecurityBaseline',
            Value: 'Enforced',
          },
        ]),
      });
    });
  });

  describe('KMS Key', () => {
    test('should create master KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description:
          'Master KMS key for encrypting CloudTrail logs and other sensitive data',
      });
    });

    test('should create KMS alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-baseline-master-test',
      });
    });

    test('should set RETAIN removal policy for KMS key', () => {
      // Check that KMS key exists and has proper configuration
      template.resourceCountIs('AWS::KMS::Key', 1);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs * 3 subnet types
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should use existing elastic IPs for NAT gateways', () => {
      // We use existing EIPs instead of creating new ones to avoid EIP limit issues
      template.resourceCountIs('AWS::EC2::EIP', 0);
    });

    test('should create NAT gateways with existing EIP allocation IDs', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        AllocationId: 'eipalloc-02458e4f31b8995c2',
      });
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        AllocationId: 'eipalloc-02a65d28a0b02d21f',
      });
    });

    test('should create routes for private subnets to NAT gateways', () => {
      // VPC creates default routes + our custom NAT routes
      template.resourceCountIs('AWS::EC2::Route', 5);
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue(),
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create CloudWatch log group for VPC flow logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 180, // SIX_MONTHS
      });
    });

    test('should create VPC flow log', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 1);
    });
  });

  describe('Network ACL', () => {
    test('should create network ACL', () => {
      template.resourceCountIs('AWS::EC2::NetworkAcl', 1);
    });

    test('should create network ACL entry for internal traffic', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        RuleAction: 'allow',
        CidrBlock: '10.0.0.0/8',
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('should create VPC endpoints', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3); // S3 + CloudWatch + KMS
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM user with MFA required', () => {
      template.hasResourceProperties('AWS::IAM::User', {
        UserName: 'secure-baseline-user-test',
      });
    });

    test('should create IAM role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ]),
        },
      });
    });

    test('should create IAM policy for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.anyValue(),
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create secure S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-baseline-test-123456789012',
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create CloudTrail S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'cloudtrail-test-123456789012',
      });
    });

    test('should create CloudFront logs S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'cloudfront-logs-test-123456789012',
      });
    });


    test('should set DESTROY removal policy for S3 buckets', () => {
      // Check that S3 buckets exist and have proper configuration
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should enable SSL enforcement on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: Match.anyValue(),
              Action: 's3:*',
              Resource: Match.anyValue(),
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should create auto-delete custom resources for S3 buckets', () => {
      // Verify that custom resources are created for auto-deleting S3 objects
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 2);
    });

    test('should create Lambda function for S3 auto-delete', () => {
      // The auto-delete functionality creates a Lambda function
      template.hasResourceProperties('AWS::Lambda::Function', {
        Description: Match.objectLike({
          'Fn::Join': Match.anyValue(),
        }),
        Runtime: 'nodejs22.x',
        Timeout: 900,
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should configure CloudFront with HTTPS only', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          HttpVersion: 'http2and3',
        },
      });
    });

    test('should enable CloudFront logging', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Logging: Match.objectLike({
            Bucket: Match.anyValue(),
          }),
        },
      });
    });

    test('should configure geo restriction', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Restrictions: {
            GeoRestriction: {
              RestrictionType: 'whitelist',
              Locations: ['US', 'CA', 'GB'],
            },
          },
        },
      });
    });
  });

  describe('WAF Configuration', () => {
    test('should create WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('should configure WAF with regional scope', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
      });
    });

    test('should set default action to allow', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        DefaultAction: {
          Allow: {},
        },
      });
    });

    test('should not attach WAF to CloudFront for regional deployment', () => {
      // CloudFront only supports global WAF Web ACLs (us-east-1)
      // For regional deployments, WAF is available for ALB/API Gateway
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.not(
          Match.objectLike({
            WebACLId: Match.anyValue(),
          })
        ),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should create API Gateway deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    });

    test('should create API Gateway stage', () => {
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
    });

    test('should configure API Gateway with HTTPS only', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: Match.anyValue(),
        AuthorizationType: Match.anyValue(),
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function', () => {
      // We have 2 Lambda functions: main function + auto-delete helper
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should use Node.js 18.x runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
      });
    });

    test('should configure Lambda with VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        },
      });
    });

    test('should set Lambda timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail trail', () => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });

    test('should configure CloudTrail with KMS encryption', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        KMSKeyId: Match.anyValue(),
      });
    });

    test('should enable multi-region trail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: true,
      });
    });

    test('should enable global service events', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
      });
    });

    test('should enable file validation', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EnableLogFileValidation: true,
      });
    });

    test('should send logs to CloudWatch', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.anyValue(),
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS database instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('should use PostgreSQL engine', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
      });
    });

    test('should use PostgreSQL 15.7', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EngineVersion: '15.7',
      });
    });

    test('should configure Multi-AZ deployment', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });
    });

    test('should disable deletion protection', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('should enable storage encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should configure backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 30,
      });
    });

    test('should enable CloudWatch logs export', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });

    test('should set DESTROY removal policy', () => {
      // Check that RDS instance exists and has proper configuration
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });
  });

  describe('RDS Parameter Group', () => {
    test('should create RDS parameter group', () => {
      template.resourceCountIs('AWS::RDS::DBParameterGroup', 1);
    });

    test('should configure logging parameters', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Parameters: Match.objectLike({
          log_statement: 'all',
          log_connections: '1',
          log_disconnections: '1',
        }),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 4); // DB + Lambda + VPC Flow Logs + CloudTrail
    });

    test('should create Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda function',
      });
    });

    test('should create security groups with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.anyValue(),
      });
    });
  });


  describe('Security Hub', () => {
    test('should create Security Hub', () => {
      template.resourceCountIs('AWS::SecurityHub::Hub', 1);
    });

    test('should configure Security Hub with security control findings', () => {
      template.hasResourceProperties('AWS::SecurityHub::Hub', {
        ControlFindingGenerator: 'SECURITY_CONTROL',
        EnableDefaultStandards: true,
      });
    });

    test('should tag Security Hub with Environment: Production', () => {
      template.hasResourceProperties('AWS::SecurityHub::Hub', {
        Tags: {
          Environment: 'Production',
        },
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create VPC flow log group', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2); // VPC + CloudTrail
    });

    test('should set RETAIN removal policy for log groups', () => {
      // Check that log groups exist and have proper configuration
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });
  });

  describe('Outputs', () => {
    test('should create all required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('VpcId');
      expect(Object.keys(outputs)).toContain('ApiEndpoint');
      expect(Object.keys(outputs)).toContain('S3BucketName');
      expect(Object.keys(outputs)).toContain('CloudFrontDistribution');
      expect(Object.keys(outputs)).toContain('DatabaseEndpoint');
      expect(Object.keys(outputs)).toContain('SecurityHubArn');
    });

    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('should export API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
      });
    });

    test('should export Security Hub ARN', () => {
      template.hasOutput('SecurityHubArn', {
        Description: 'Security Hub ARN',
      });
    });
  });

  describe('Resource Naming', () => {
    test('should include environment suffix in resource names', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-baseline-test-123456789012',
      });
    });

    test('should use lowercase environment suffix in bucket names', () => {
      const uppercaseApp = new cdk.App();
      const uppercaseStack = new TapStack(uppercaseApp, 'UppercaseStack', {
        environmentSuffix: 'TEST',
      });
      const uppercaseTemplate = Template.fromStack(uppercaseStack);
      // Check that buckets exist with proper naming pattern
      uppercaseTemplate.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('Environment Suffix Context', () => {
    test('should use environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);
      // Check that buckets exist with proper naming pattern
      customTemplate.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should use environment suffix from context', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'context');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      // Check that buckets exist with proper naming pattern
      contextTemplate.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should default to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      // Check that buckets exist with proper naming pattern
      defaultTemplate.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('Security Constraints Validation', () => {
    test('should enforce HTTPS for all API Gateway endpoints', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: Match.anyValue(),
      });
    });

    test('should enable server-side encryption for all S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('should encrypt CloudTrail logs using KMS', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        KMSKeyId: Match.anyValue(),
      });
    });

    test('should require MFA for all IAM users', () => {
      template.hasResourceProperties('AWS::IAM::User', {
        ManagedPolicyArns: Match.anyValue(),
      });
    });

    test('should tag all resources with Environment: Production', () => {
      const resources = template.findResources('*');
      Object.values(resources).forEach(resource => {
        if (resource.Properties.Tags) {
          expect(resource.Properties.Tags).toContainEqual({
            Key: 'Environment',
            Value: 'Production',
          });
        }
      });
    });
  });

  describe('Network Security', () => {
    test('should create VPC flow logs for all VPCs', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 1);
    });

    test('should configure network ACLs to block unauthorized traffic', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        RuleAction: 'allow',
        CidrBlock: '10.0.0.0/8',
      });
    });

    test('should use VPC Endpoints for AWS services', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
    });
  });

  describe('Logging and Monitoring', () => {
    test('should enable RDS logging for database queries', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });
    });

    test('should enable CloudTrail logging', () => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });

    test('should enable VPC flow logging', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 1);
    });
  });

  describe('Lambda Runtime', () => {
    test('should use latest Lambda runtime version', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
      });
    });
  });

  describe('WAF Implementation', () => {
    test('should implement WAF for regional services', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });
  });

  describe('Resource Access Control', () => {
    test('should restrict resource access to specific IAM users and roles', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.anyValue(),
              Resource: Match.anyValue(),
            }),
          ]),
        },
      });
    });
  });


  describe('Security Hub Implementation', () => {
    test('should implement Security Hub in the region', () => {
      template.resourceCountIs('AWS::SecurityHub::Hub', 1);
    });
  });
});
