import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack');
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

    test('creates public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates NAT gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with HTTP/HTTPS rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web tier - migrated from us-west-1',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application tier - migrated from us-west-1',
      });
    });

    test('creates database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database tier - migrated from us-west-1',
      });
    });

    test('creates database security group ingress rule for MySQL', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });
  });

  describe('RDS Configuration', () => {
    test('creates RDS parameter group for MySQL 8.0', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Description: 'Parameter group for MySQL 8.0 - migrated from us-west-1',
        Family: 'mysql8.0',
        Parameters: {
          innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
          max_connections: '1000',
          slow_query_log: '1',
          long_query_time: '2',
          general_log: '1',
        },
      });
    });

    test('creates RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS MySQL - migrated from us-west-1',
      });
    });

    test('creates RDS MySQL instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.42',
        DBInstanceClass: 'db.t3.medium',
        AllocatedStorage: '100',
        MaxAllocatedStorage: 1000,
        StorageEncrypted: true,
        MultiAZ: true,
        DeletionProtection: true,
        BackupRetentionPeriod: 7,
        EnablePerformanceInsights: true,
        MonitoringInterval: 60,
        EnableCloudwatchLogsExports: ['error', 'general'],
      });
    });
  });

  describe('S3 Configuration', () => {
    test('creates S3 bucket with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates bucket deployment for test object', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates VPC outputs', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID in us-west-2',
        Export: {
          Name: 'MainVPCId',
        },
      });

      template.hasOutput('VPCCidr', {
        Description: 'VPC CIDR Block',
        Export: {
          Name: 'MainVPCCidr',
        },
      });
    });

    test('creates subnet outputs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        Export: {
          Name: 'PublicSubnetIds',
        },
      });

      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Export: {
          Name: 'PrivateSubnetIds',
        },
      });
    });

    test('creates database outputs', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS MySQL Endpoint',
        Export: {
          Name: 'DatabaseEndpoint',
        },
      });

      template.hasOutput('DatabasePort', {
        Description: 'RDS MySQL Port',
        Export: {
          Name: 'DatabasePort',
        },
      });
    });

    test('creates S3 outputs', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
        Export: {
          Name: 'ApplicationBucketName',
        },
      });

      template.hasOutput('S3BucketArn', {
        Description: 'S3 Bucket ARN',
        Export: {
          Name: 'ApplicationBucketArn',
        },
      });
    });

    test('creates security group outputs', () => {
      template.hasOutput('WebSecurityGroupId', {
        Description: 'Web Security Group ID',
        Export: {
          Name: 'WebSecurityGroupId',
        },
      });

      template.hasOutput('AppSecurityGroupId', {
        Description: 'Application Security Group ID',
        Export: {
          Name: 'AppSecurityGroupId',
        },
      });

      template.hasOutput('DatabaseSecurityGroupId', {
        Description: 'Database Security Group ID',
        Export: {
          Name: 'DatabaseSecurityGroupId',
        },
      });
    });

    test('creates region migration output', () => {
      template.hasOutput('RegionMigrated', {
        Description: 'Target migration region',
        Export: {
          Name: 'TargetRegion',
        },
      });
    });
  });

  describe('Tagging', () => {
    test('applies stack-level tags', () => {
      const stackTags = stack.tags;
      expect(stackTags.tagValues()).toHaveProperty('Project');
      expect(stackTags.tagValues()).toHaveProperty('Environment');
      expect(stackTags.tagValues()).toHaveProperty('MigratedFrom');
      expect(stackTags.tagValues()).toHaveProperty('MigrationDate');
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of core resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3); // web + app + db
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::RDS::DBParameterGroup', 1);
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('Region Configuration', () => {
    test('stack is configured for us-west-2 region', () => {
      expect(stack.region).toBe('us-west-2');
    });
  });
});
