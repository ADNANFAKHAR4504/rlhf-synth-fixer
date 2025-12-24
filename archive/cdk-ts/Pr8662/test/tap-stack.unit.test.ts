import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'testenv';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Components', () => {
    test('VPC is created with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has correct subnet configuration', () => {
      // Public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });

      // Database subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('NAT Gateway is created', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('Internet Gateway is created', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('EC2 Security Group allows only HTTP and HTTPS inbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances - HTTP/HTTPS only',
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ]),
      });
    });

    test('EC2 Security Group allows all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1',
          },
        ],
      });
    });

    test('RDS Security Group allows only EC2 access on port 5432', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS - EC2 access only',
      });

      // Check for security group ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'Allow PostgreSQL access from EC2 instances',
        FromPort: 5432,
        IpProtocol: 'tcp',
        ToPort: 5432,
      });
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key is created with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP infrastructure encryption',
        EnableKeyRotation: true,
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role is created with minimal permissions', () => {
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
        Description: 'Minimal IAM role for EC2 instances',
      });
    });

    test('EC2 role has SSM managed instance core policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ]),
      });
    });

    test('EC2 role has custom policy for SSM Parameter Store', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              Effect: 'Allow',
              Resource: Match.stringLikeRegexp('.*:parameter/tap/\\*'),
            },
          ]),
        },
      });
    });

    test('EC2 role has CloudWatch logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ]),
        },
      });
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instances are created with correct configuration', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);

      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('EC2 instances have proper tags', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('TAP-Instance-.*'),
          },
        ]),
      });
    });
  });

  describe('RDS Subnet Group', () => {
    test('DB Subnet Group is created for isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for TAP RDS database',
      });
    });
  });

  describe('RDS Database', () => {
    test('RDS instance is created with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
        DBName: 'tapdb',
        Engine: 'postgres',
        AllocatedStorage: '20',
        StorageEncrypted: true,
        MultiAZ: false,
        BackupRetentionPeriod: 1,
        EnablePerformanceInsights: false,
      });
    });

    test('RDS instance has proper tags', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });
  });

  describe('Environment Suffix', () => {
    test('All resources have environment suffix in their names', () => {
      const resources = template.findResources('AWS::KMS::Key');
      const keyNames = Object.keys(resources);
      expect(keyNames.some(name => name.includes(environmentSuffix))).toBe(
        true
      );

      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcNames = Object.keys(vpcResources);
      expect(vpcNames.some(name => name.includes(environmentSuffix))).toBe(
        true
      );

      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const rdsNames = Object.keys(rdsResources);
      expect(rdsNames.some(name => name.includes(environmentSuffix))).toBe(
        true
      );
    });
  });

  describe('Resource Tagging', () => {
    test('Resources are tagged with Environment: Production', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });
  });

  describe('Outputs', () => {
    test('Stack has required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('DatabaseEndpoint', {});
      template.hasOutput('KmsKeyId', {});
      template.hasOutput('Ec2Instance1Id', {});
      template.hasOutput('Ec2Instance2Id', {});
      template.hasOutput('Ec2SecurityGroupId', {});
      template.hasOutput('RdsSecurityGroupId', {});
    });
  });

  describe('Resource Count Validation', () => {
    test('Expected number of resources are created', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private + 2 database
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2); // EC2 + RDS
      template.resourceCountIs('AWS::EC2::Instance', 2);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::IAM::Role', 1); // Only EC2 role
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });
  });

  describe('Stack with different environment suffix', () => {
    test('Stack works with default environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestTapStackDefault', {
        env: { region: 'us-east-1', account: '123456789012' },
      });
      const testTemplate = Template.fromStack(testStack);

      // Should use 'dev' as default
      const resources = testTemplate.findResources('AWS::KMS::Key');
      const keyNames = Object.keys(resources);
      expect(keyNames.some(name => name.includes('dev'))).toBe(true);
    });

    test('Stack works with custom environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestTapStackCustom', {
        environmentSuffix: 'custom123',
        env: { region: 'us-east-1', account: '123456789012' },
      });
      const testTemplate = Template.fromStack(testStack);

      const resources = testTemplate.findResources('AWS::KMS::Key');
      const keyNames = Object.keys(resources);
      expect(keyNames.some(name => name.includes('custom123'))).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    test('RDS credentials are properly configured', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MasterUsername: Match.stringLikeRegexp(
          `tapdbadmin${environmentSuffix}`
        ),
      });
    });

    test('Database name is set correctly', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'tapdb',
      });
    });
  });

  describe('Existing Resource Support', () => {
    test('Stack can be created with existing VPC and KMS key', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestTapStackExisting', {
        environmentSuffix: 'existing',
        vpcId: 'vpc-12345678',
        kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/abcd1234',
        env: { region: 'us-east-1', account: '123456789012' },
      });

      // Should not throw errors when using existing resources
      expect(testStack).toBeDefined();
    });
  });
});
