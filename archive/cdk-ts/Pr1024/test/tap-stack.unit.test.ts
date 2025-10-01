import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let template: Template;

  describe('Default Stack Configuration', () => {
    beforeAll(() => {
      app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        env: { region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create a VPC with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description:
          'Customer-managed KMS key for Financial Services encryption',
        EnableKeyRotation: true,
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/financial-services-dev',
      });
    });

    test('should create security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for Lambda functions in Financial Services infrastructure',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            Description: 'HTTPS access from VPC',
          },
        ],
        SecurityGroupEgress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'HTTPS outbound access',
          },
        ],
      });
    });

    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TurnAroundPromptTabledev',
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should have correct resource count', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 2); // 2 private subnets
    });
  });

  describe('Custom Environment Suffix', () => {
    test('should use custom environment suffix', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'staging',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TurnAroundPromptTablestaging',
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/financial-services-staging',
      });
    });
  });

  describe('Secondary Region Configuration', () => {
    test('should use different CIDR for secondary region', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        env: { region: 'eu-west-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });
  });

  describe('Outputs', () => {
    beforeAll(() => {
      app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);
    });

    test('should have VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'ID of the Financial Services VPC',
      });
    });

    test('should have KMS Key ID output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'ID of the Financial Services KMS Key',
      });
    });

    test('should have Security Group ID output', () => {
      template.hasOutput('LambdaSecurityGroupId', {
        Description: 'ID of the Lambda Security Group',
      });
    });

    test('should have DynamoDB table outputs', () => {
      template.hasOutput('TurnAroundPromptTableName', {
        Description: 'Name of the Turn Around Prompt Table',
      });

      template.hasOutput('TurnAroundPromptTableArn', {
        Description: 'ARN of the Turn Around Prompt Table',
      });
    });

    test('should have environment suffix output', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for this deployment',
      });
    });
  });

  describe('Tagging', () => {
    test('should apply correct tags to all resources', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);

      // VPC should have environment and project tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
          {
            Key: 'Project',
            Value: 'FinancialServices',
          },
        ]),
      });
    });
  });

  describe('Security Configuration', () => {
    test('should encrypt DynamoDB table with customer managed KMS key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should use private subnets only', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });
  });

  describe('Context-based Configuration', () => {
    test('should use context environment suffix when provided', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'prod',
        },
      });
      const stack = new TapStack(app, 'TestTapStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TurnAroundPromptTableprod',
      });
    });
  });

  describe('Stack Properties', () => {
    test('should expose public properties correctly', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack');

      expect(stack.vpc).toBeDefined();
      expect(stack.kmsKey).toBeDefined();
      expect(stack.lambdaSecurityGroup).toBeDefined();
      expect(stack.turnAroundPromptTable).toBeDefined();
    });
  });
});
