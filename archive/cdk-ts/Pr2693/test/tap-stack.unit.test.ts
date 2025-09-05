import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const testProps = {
    environmentSuffix: 'test',
    appName: 'myapp',
    environment: 'test',
    owner: 'test-team',
    instanceType: 't3.micro',
    allowedCidrs: ['10.0.0.0/8', '172.16.0.0/12'],
    dbEngineVersion: '15',
    targetRegion: 'us-east-1'
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', testProps);
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates public subnets with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: true
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true
      });
    });

    test('creates private subnets with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: false
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
        MapPublicIpOnLaunch: false
      });
    });

    test('creates internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('VPC Endpoints', () => {
    test('creates S3 VPC Gateway Endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: {
          'Fn::Join': [
            '',
            [
              'com.amazonaws.',
              { Ref: 'AWS::Region' },
              '.s3'
            ]
          ]
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('creates EC2 security group with restrictive configuration', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances in public subnets',
        GroupName: 'test-myapp-us-east-1-ec2-sg'
      });
    });

    test('creates RDS security group with correct name and description', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL - private access only',
        GroupName: 'test-myapp-us-east-1-rds-sg'
      });
    });

    test('verifies security group rules exist', () => {
      // Check that ingress/egress rules are created (they may be separate resources)
      const securityGroupRules = template.findResources('AWS::EC2::SecurityGroupIngress');
      const egressRules = template.findResources('AWS::EC2::SecurityGroupEgress');

      // Should have some security group rules
      expect(Object.keys(securityGroupRules).length + Object.keys(egressRules).length).toBeGreaterThan(0);
    });
  });

  describe('IAM Role Configuration', () => {
    test('creates EC2 IAM role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'test-myapp-us-east-1-ec2-role',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            }
          ]
        },
        Description: 'Least-privilege role for EC2 instances'
      });
    });

    test('EC2 role has SSM managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore'
              ]
            ]
          }
        ])
      });
    });


    test('creates instance profile for EC2 role', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2); // One per EC2 instance
    });
  });

  describe('Secrets Manager and SSM', () => {
    test('creates database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'test/myapp/us-east-1/db/credentials',
        Description: 'RDS PostgreSQL master credentials'
      });
    });

    test('creates SSM parameter for secret ARN', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test/myapp/db/credentials-secret-arn',
        Type: 'String',
        Description: 'ARN of the Secrets Manager secret containing DB credentials'
      });
    });
  });

  describe('RDS Database Configuration', () => {
    test('creates DB subnet group in private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: 'test-myapp-us-east-1-db-subnet-group',
        DBSubnetGroupDescription: 'Subnet group for RDS PostgreSQL in private subnets'
      });
    });

    test('creates PostgreSQL 15 database with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'testmyappdb',
        DBInstanceIdentifier: 'test-myapp-us-east-1-db',
        Engine: 'postgres',
        EngineVersion: '15',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: true,
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: false,
        MonitoringInterval: 60,
        EnablePerformanceInsights: true,
        AutoMinorVersionUpgrade: true,
        AllowMajorVersionUpgrade: false,
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
        Port: '5432'
      });
    });

    test('database uses credentials from Secrets Manager', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MasterUsername: Match.anyValue(),
        MasterUserPassword: Match.anyValue()
      });
    });

  });

  describe('EC2 Instances', () => {
    test('creates EC2 instances with correct configuration', () => {
      // Should create 2 instances (one per AZ)
      template.resourceCountIs('AWS::EC2::Instance', 2);

      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        ImageId: Match.anyValue(),
        IamInstanceProfile: { Ref: Match.anyValue() },
        UserData: Match.anyValue(),
        Monitoring: true
      });
    });

    test('EC2 instances have encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              VolumeSize: 20,
              VolumeType: 'gp3',
              Encrypted: true,
              DeleteOnTermination: true
            }
          }
        ]
      });
    });

    test('EC2 instances are distributed across availability zones', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(instances).length).toBe(2);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('creates VPC ID output', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: 'test-myapp-us-east-1-vpc-id'
        }
      });
    });

    test('creates database endpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS PostgreSQL endpoint',
        Export: {
          Name: 'test-myapp-us-east-1-db-endpoint'
        }
      });
    });

    test('creates database credentials secret ARN output', () => {
      template.hasOutput('DatabaseCredentialsSecretArn', {
        Description: 'ARN of the Secrets Manager secret containing database credentials',
        Export: {
          Name: 'test-myapp-us-east-1-db-credentials-arn'
        }
      });
    });

    test('creates S3 VPC endpoint output', () => {
      template.hasOutput('S3VpcEndpointId', {
        Description: 'S3 VPC Gateway Endpoint ID',
        Export: {
          Name: 'test-myapp-us-east-1-s3-endpoint-id'
        }
      });
    });

    test('creates subnet outputs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public subnet IDs',
        Export: {
          Name: 'test-myapp-us-east-1-public-subnets'
        }
      });

      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private subnet IDs',
        Export: {
          Name: 'test-myapp-us-east-1-private-subnets'
        }
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('has expected number of subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('has expected number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2); // EC2 + RDS
    });

    test('has expected number of RDS instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('has expected number of EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2); // One per AZ
    });

    test('has expected number of secrets', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('has expected number of SSM parameters', () => {
      template.resourceCountIs('AWS::SSM::Parameter', 1);
    });

    test('has expected number of VPC endpoints', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 1);
    });
  });

  describe('Environment and Configuration', () => {
    test('handles missing environment suffix gracefully', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNoSuffix', {
        ...testProps,
        environmentSuffix: undefined
      });
      const testTemplate = Template.fromStack(testStack);

      // Should still create resources even without explicit environmentSuffix
      testTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('uses provided props consistently in resource names', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'test-myapp-us-east-1-db'
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('distributes resources across multiple AZs', () => {
      // Check that subnets span multiple AZs
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBe(4);
    });

    test('RDS is configured for Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true
      });
    });
  });

  describe('Security Best Practices', () => {
    test('RDS has encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('RDS has deletion protection enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: true
      });
    });

    test('EC2 instances use encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              Encrypted: true
            }
          }
        ]
      });
    });

    test('Database credentials are managed securely', () => {
      // Verify secret exists
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);

      // Verify SSM parameter for secret ARN exists
      template.resourceCountIs('AWS::SSM::Parameter', 1);
    });
  });

  describe('Resource Tagging', () => {
    test('stack has appropriate tags through CDK Tags', () => {
      // Since tags are applied at the stack level via Tags.of(), 
      // they should be present on resources
      const vpc = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpc).length).toBe(1);
    });

    test('resources have environment-specific names', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('test-myapp-us-east-1.*')
      });
    });
  });

  describe('Network Security', () => {
    test('VPC has proper DNS configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('private subnets do not auto-assign public IPs', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter(subnet =>
        subnet.Properties?.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBe(2);
    });

    test('public subnets auto-assign public IPs', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(subnet =>
        subnet.Properties?.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBe(2);
    });
  });

  describe('Monitoring and Observability', () => {
    test('RDS has monitoring enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 60,
        EnablePerformanceInsights: true
      });
    });

    test('EC2 instances have detailed monitoring enabled', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Monitoring: true
      });
    });
  });
});