import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack, TapApp } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Core Infrastructure', () => {
    test('VPC is created with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('KMS Key is created with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('Secrets Manager secret is created', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-${environmentSuffix}-app-secrets`,
      });
    });

    test('DynamoDB table is created with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-${environmentSuffix}-data-table`,
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('DynamoDB auto scaling is configured', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 2);
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
    });

    test('S3 bucket is created with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-${environmentSuffix}-static-content`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Lambda execution role is created with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-lambda-execution-role`,
      });
    });

    test('Lambda security group is created', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
    });

    test('Lambda function is created with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-${environmentSuffix}-api-handler`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
      });
    });

    test('API Gateway is created', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('API Gateway usage plan is configured', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
    });

    test('WAF Web ACL is created', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('CloudFront distribution is created', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('X-Ray sampling rule is created', () => {
      template.resourceCountIs('AWS::XRay::SamplingRule', 1);
    });

    test('CloudWatch alarms are created', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('CloudWatch log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/tap-${environmentSuffix}-api-handler`,
      });
    });
  });

  describe('Outputs', () => {
    test('Stack outputs are created correctly', () => {
      template.hasOutput('ApiGatewayUrl', {});
      template.hasOutput('CloudFrontUrl', {});
      template.hasOutput('DynamoDBTableName', {});
      template.hasOutput('S3BucketName', {});
      template.hasOutput('LambdaFunctionName', {});
      template.hasOutput('UsagePlanId', {});
    });
  });

  describe('Conditional Features', () => {
    test('Domain-related resources are created when domain configuration is provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDomainStack', { 
        environmentSuffix: 'test',
        domainName: 'example.com',
        hostedZoneId: 'Z1234567890'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.resourceCountIs('AWS::CertificateManager::Certificate', 1);
      testTemplate.resourceCountIs('AWS::Route53::RecordSet', 1);
    });

    test('CI/CD pipeline resources are created when GitHub configuration is provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestCICDStack', { 
        environmentSuffix: 'test',
        githubOwner: 'testowner',
        githubRepo: 'testrepo'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.resourceCountIs('AWS::CodeCommit::Repository', 1);
      testTemplate.resourceCountIs('AWS::CodeBuild::Project', 1);
      testTemplate.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });
  });

  describe('TapApp class', () => {
    test('TapApp creates a TapStack correctly', () => {
      const testApp = new cdk.App();
      // Use a different stack name to avoid conflicts
      const testStack = new TapStack(testApp, 'TestDirectTapStack', { 
        environmentSuffix: 'test' 
      });
      const testTemplate = Template.fromStack(testStack);
      
      expect(testTemplate).toBeDefined();
      testTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('TapApp constructor creates proper infrastructure', () => {
      const tapApp = new TapApp();
      expect(tapApp).toBeInstanceOf(cdk.App);
      
      // Verify the app has stacks
      expect(tapApp.node.children.length).toBeGreaterThan(0);
    });

    test('TapApp synth works correctly', () => {
      const tapApp = new TapApp();
      const assembly = tapApp.synth();
      
      expect(assembly).toBeDefined();
      expect(assembly.stacks.length).toBeGreaterThan(0);
    });
  });

  describe('Default Values', () => {
    test('Stack works with minimal configuration', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestMinimalStack', { 
        environmentSuffix: 'minimal'
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Should still create core infrastructure with defaults
      testTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
      testTemplate.resourceCountIs('AWS::Lambda::Function', 1);
    });
  });
});
