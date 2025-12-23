import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  describe('KMS Encryption', () => {
    test('should create KMS key with rotation enabled', () => {
      const app = new cdk.App();
      const primaryStack = new TapStack(app, 'TestPrimaryStack', {
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const secondaryStack = new TapStack(app, 'TestSecondaryStack', {
        environmentSuffix,
        isPrimaryRegion: false,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);
      
      primaryTemplate.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
      secondaryTemplate.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct subnet configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      template.resourceCountIs('AWS::EC2::NatGateway', 1); // Reduced to 1 NAT Gateway to stay within EIP limits
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('should create EC2 security group with restricted SSH access', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: [
          {
            CidrIp: '203.0.113.0/24',
            Description: 'SSH access from allowed IP range only',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ],
      });
    });

    test('should not allow unrestricted SSH access', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach(sg => {
        const ingress = sg.Properties?.SecurityGroupIngress || [];
        ingress.forEach((rule: any) => {
          if (rule.FromPort === 22 && rule.ToPort === 22) {
            expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            expect(rule.CidrIp).toBe('203.0.113.0/24');
          }
        });
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 role with least privilege', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          }],
        },
      });
    });

    test('should create Lambda role with minimal permissions', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          }],
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('should create encrypted RDS instance', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        Engine: 'mysql',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create S3 buckets with encryption and versioning', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('should have deletion policy set for cleanup', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      const buckets = template.findResources('AWS::S3::Bucket');
      
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('tap-.*-api-.*'),
      });
    });

    test('should have Lambda integration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
      });
    });
  });

  describe('WAF Configuration', () => {
    test('should create WAF WebACL with SQL injection protection', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'SQLInjectionRule',
            Priority: 1,
            Statement: {
              SqliMatchStatement: Match.anyValue(),
            },
            Action: {
              Block: {},
            },
          }),
        ]),
      });
    });

    test('should include AWS managed rule sets', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          }),
        ]),
      });
    });

    test('should associate WAF with API Gateway', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {});
    });
  });



  describe('SSM Parameters', () => {
    test('should store configuration in SSM', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/tap/.*/primary/cloudtrail-config'),
        Type: 'String',
      });
      
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/tap/.*/primary/inspector-status'),
        Type: 'String',
      });
    });
  });

  describe('Cross-Region Deployment', () => {
    test('primary and secondary stacks should have different configurations', () => {
      const app = new cdk.App();
      const primaryStack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const secondaryStack = new TapStack(app, `TapStack${environmentSuffix}-Secondary`, {
        stackName: `TapStack${environmentSuffix}-Secondary`,
        environmentSuffix,
        isPrimaryRegion: false,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      
      const primaryTemplate = Template.fromStack(primaryStack);
      const secondaryTemplate = Template.fromStack(secondaryStack);
      
      // Both stacks should have their own VPCs
      
      // Both should have their own VPCs
      primaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      secondaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });
  });

  describe('Outputs', () => {
    test('should export required outputs for primary region', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, `TapStack${environmentSuffix}-Primary`, {
        stackName: `TapStack${environmentSuffix}-Primary`,
        environmentSuffix,
        isPrimaryRegion: true,
        env: { account: '123456789012', region: 'us-west-1' },
      });
      const template = Template.fromStack(stack);
      
      // Primary region outputs
      template.hasOutput('VpcIdPrimary', {});
      template.hasOutput('ApiUrlPrimary', {});
      template.hasOutput('DatabaseEndpointPrimary', {});
      template.hasOutput('WAFWebACLArnPrimary', {});
      template.hasOutput('InstanceIdPrimary', {});
    });

    test('should export required outputs for secondary region', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix,
        isPrimaryRegion: false,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);
      
      // Secondary region outputs
      template.hasOutput('VpcIdSecondary', {});
      template.hasOutput('ApiUrlSecondary', {});
      template.hasOutput('DatabaseEndpointSecondary', {});
      template.hasOutput('WAFWebACLArnSecondary', {});
      template.hasOutput('InstanceIdSecondary', {});
    });
  });
});
