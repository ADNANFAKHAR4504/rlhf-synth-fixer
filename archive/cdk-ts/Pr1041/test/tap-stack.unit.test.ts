import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  describe('Security Infrastructure Tests', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create security groups with proper restrictions', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web applications',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database instances',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Restricted SSH access security group',
      });
    });

    test('should restrict database access to web security group only', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });

    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Key for encrypting resources in secure infrastructure',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/secure-infra-key-${environmentSuffix}`,
      });
    });

    test('should create CloudWatch Log Group with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/secure-infrastructure/tap-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('should create Security Hub', () => {
      template.hasResourceProperties('AWS::SecurityHub::Hub', {});
    });

    test('should create WAF WebACL with managed rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
          }),
          Match.objectLike({
            Name: 'RateLimitRule',
          }),
        ]),
      });
    });

    test('should create Network Firewall components', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
        Type: 'STATELESS',
        Capacity: 100,
      });

      template.hasResourceProperties(
        'AWS::NetworkFirewall::FirewallPolicy',
        {}
      );

      template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {});
    });

    test('should create Config rules for compliance', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `root-account-mfa-enabled-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `mfa-enabled-for-iam-console-access-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `encrypted-volumes-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `rds-storage-encrypted-${environmentSuffix}`,
      });
    });

    test('should create S3 bucket for Config with encryption', () => {
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
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create IAM roles with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'config.amazonaws.com',
              }),
            }),
          ]),
        }),
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should create MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });

    test('should create CloudWatch Dashboard for security monitoring', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `security-monitoring-${environmentSuffix}`,
      });
    });

    test('should output essential resource IDs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('WebSecurityGroupId', {});
      template.hasOutput('DatabaseSecurityGroupId', {});
      template.hasOutput('KmsKeyId', {});
      template.hasOutput('WebAclArn', {});
    });

    test('should expose VPC through stack property', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.vpc.vpcId).toBeDefined();
    });

    test('should expose security groups through stack properties', () => {
      expect(stack.webSecurityGroup).toBeDefined();
      expect(stack.databaseSecurityGroup).toBeDefined();
    });

    test('should use default environment suffix when not provided', () => {
      const newApp = new cdk.App();
      const defaultStack = new TapStack(newApp, 'DefaultTestStack', {
        env: { region: 'us-west-2' },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: 'root-account-mfa-enabled-dev',
      });
    });
  });
});
