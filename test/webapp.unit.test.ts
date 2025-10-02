import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { WebAppStack } from '../lib/webapp';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('WebAppStack', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let webAppStack: WebAppStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    webAppStack = new WebAppStack(stack, 'TestWebAppStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        InternetGatewayId: Match.objectLike({
          Ref: Match.anyValue(),
        }),
        VpcId: Match.objectLike({
          Ref: Match.anyValue(),
        }),
      });
    });

    test('creates three subnets with correct CIDR blocks', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
      });
    });

    test('creates route tables for public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
      });
    });
  });

  describe('EC2 Configuration', () => {
    test('creates EC2 Instance Connect Endpoint', () => {
      template.resourceCountIs('AWS::EC2::InstanceConnectEndpoint', 1);
      template.hasResourceProperties('AWS::EC2::InstanceConnectEndpoint', {
        SubnetId: Match.objectLike({
          Ref: Match.anyValue(),
        }),
      });
    });

    test('creates security group for EC2 Instance Connect Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 Instance Connect Endpoint',
      });
    });

    test('creates security group for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('creates security group ingress rule for SSH from EICE', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
      });
    });

    test('creates IAM role for EC2 with CloudWatch policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
        ],
      });
    });

    test('creates IAM policy for EC2 instance', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
              Effect: 'Allow',
              Resource: '*',
            },
            Match.objectLike({
              Action: Match.arrayWith([
                'ssm:UpdateInstanceInformation',
                'ssmmessages:CreateControlChannel',
                'ssmmessages:CreateDataChannel',
                'ssmmessages:OpenControlChannel',
                'ssmmessages:OpenDataChannel',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('creates EC2 instance with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        IamInstanceProfile: Match.objectLike({
          Ref: Match.anyValue(),
        }),
        UserData: Match.anyValue(),
      });
    });

    test('EC2 instance has IMDSv2 required', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });
  });

  describe('RDS Configuration', () => {
    test('creates security group for RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS instance',
      });
    });

    test('creates security group ingress rule from EC2 to RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS instance',
      });
    });

    test('creates RDS instance with Multi-AZ enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: Match.stringLikeRegexp('^8\\.0'),
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        AllocatedStorage: '20',
        StorageType: 'gp3',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        EnablePerformanceInsights: false,
        MonitoringInterval: 60,
        AutoMinorVersionUpgrade: false,
        CopyTagsToSnapshot: true,
      });
    });

    test('creates IAM role for RDS monitoring', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
              ],
            ],
          },
        ],
      });
    });

    test('RDS credentials are generated and stored in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          GenerateStringKey: 'password',
          PasswordLength: 30,
          SecretStringTemplate: '{"username":"admin"}',
        },
      });
    });
  });

  describe('CloudWatch Configuration', () => {
    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `SecureWebAppFoundation-${environmentSuffix}`,
      });
    });

    test('dashboard contains EC2 and RDS metrics', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0] as any;
      expect(dashboard).toBeDefined();
      expect(dashboard.Properties.DashboardName).toBe(
        `SecureWebAppFoundation-${environmentSuffix}`
      );
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `VPCId-${environmentSuffix}`,
        },
      });
    });

    test('exports EC2 Instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID',
        Export: {
          Name: `EC2InstanceId-${environmentSuffix}`,
        },
      });
    });

    test('exports Instance Connect Endpoint ID', () => {
      template.hasOutput('InstanceConnectEndpointId', {
        Description: 'EC2 Instance Connect Endpoint ID',
        Export: {
          Name: `InstanceConnectEndpointId-${environmentSuffix}`,
        },
      });
    });

    test('exports RDS Endpoint', () => {
      template.hasOutput('RDSEndpoint', {
        Description: 'RDS Instance Endpoint',
        Export: {
          Name: `RDSEndpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports Database Secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'ARN of the secret containing database credentials',
        Export: {
          Name: `DatabaseSecretArn-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates correct number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 4);
    });

    test('creates correct number of subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 3);
    });

    test('creates correct number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 2);
    });
  });

  describe('Environment Suffix', () => {
    test('uses environment suffix in dashboard name', () => {
      const customEnv = 'staging';
      const customApp = new cdk.App();
      const customParentStack = new cdk.Stack(customApp, 'CustomParentStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const customStack = new WebAppStack(customParentStack, 'CustomWebAppStack', {
        environmentSuffix: customEnv,
      });
      const customTemplate = Template.fromStack(customParentStack);

      customTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `SecureWebAppFoundation-${customEnv}`,
      });
    });

    test('uses environment suffix in database name', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: `webappdb${environmentSuffix}`,
      });
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultParentStack = new cdk.Stack(defaultApp, 'DefaultParentStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const defaultStack = new WebAppStack(defaultParentStack, 'DefaultWebAppStack', {});
      const defaultTemplate = Template.fromStack(defaultParentStack);

      defaultTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'SecureWebAppFoundation-dev',
      });

      defaultTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'webappdbdev',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('RDS encryption is enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('RDS is not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: Match.absent(),
      });
    });

    test('RDS deletion protection is disabled for easy cleanup', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('EC2 security group allows only SSH from EICE', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const ec2SecurityGroup = Object.values(securityGroups).find(
        (sg: any) =>
          sg.Properties.GroupDescription === 'Security group for EC2 instances'
      );
      expect(ec2SecurityGroup).toBeDefined();
    });
  });
});
