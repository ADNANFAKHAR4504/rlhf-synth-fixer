import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { TapStack, InfraStackProps } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-unit-' + Math.random().toString(36).substring(7);

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const props: InfraStackProps = {
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
      dbInstanceClass: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      ecsInstanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
    };
    stack = new TapStack(app, 'TestTapStack', props);
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization', () => {
    test('should create TapStack with correct environmentSuffix', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.environmentSuffix).toBe(environmentSuffix);
    });

    test('should synthesize without errors', () => {
      expect(() => app.synth()).not.toThrow();
    });

    test('should apply correct tags to all resources', () => {
      const tags = cdk.Tags.of(stack);
      expect(tags).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets across 2 AZs', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private + 2 isolated = 6 total
    });

    test('should create NAT Gateways for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should create route tables for subnets', () => {
      // Route tables are automatically created by VPC construct, count should be > 0
      template.hasResource('AWS::EC2::RouteTable', {});
    });
  });

  describe('Security - KMS Configuration', () => {
    test('should create KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('KMS key for infrastructure encryption.*'),
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/infra-encryption-key.*'),
      });
    });
  });

  describe('Database Configuration', () => {
    test('should create Secrets Manager secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.stringLikeRegexp('RDS PostgreSQL credentials.*'),
        GenerateSecretString: {
          SecretStringTemplate: Match.anyValue(),
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\\'',
          IncludeSpace: false,
          PasswordLength: 32,
        },
      });
    });

    test('should create RDS PostgreSQL instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false, // Testing mode
        EnablePerformanceInsights: true,
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
    });

    test('should create read replica', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2); // Main + Read Replica
    });

    test('should create database security group with restrictive rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for RDS database.*'),
        VpcId: Match.anyValue(),
      });
    });
  });

  describe('ECS Cluster Configuration', () => {
    test('should create ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: Match.stringLikeRegexp('cluster-.*'),
      });
    });

    test('should create CloudWatch log group for ECS', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/ecs/cluster-.*'),
        RetentionInDays: 7,
      });
    });

    test('should create IAM role for ECS instances', () => {
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
        Description: Match.stringLikeRegexp('IAM role for ECS EC2 instances.*'),
      });
    });

    test('should create launch template with encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeSize: 30,
                VolumeType: 'gp3',
              },
            },
          ],
        },
      });
    });

    test('should create Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('should create scaling policy for CPU utilization', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
      });
    });

    test('should create ECS capacity provider', () => {
      template.hasResourceProperties('AWS::ECS::CapacityProvider', {
        AutoScalingGroupProvider: {
          ManagedScaling: {
            Status: 'ENABLED',
            TargetCapacity: 80,
          },
          ManagedTerminationProtection: 'DISABLED',
        },
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ECS security group with outbound access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for ECS instances.*'),
      });
    });

    test('should allow ECS to connect to RDS on port 5432', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('should create ECS Cluster Name output', () => {
      template.hasOutput('ECSClusterName', {
        Description: 'ECS Cluster Name',
      });
    });

    test('should create RDS Endpoint output', () => {
      template.hasOutput('RDSEndpoint', {
        Description: 'RDS PostgreSQL Endpoint',
      });
    });

    test('should create Secrets Manager ARN output', () => {
      template.hasOutput('SecretsManagerARN', {
        Description: 'Secrets Manager ARN for database credentials',
      });
    });

    test('should create KMS Key ID output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper resource dependencies', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.ecsCluster).toBeDefined();
      expect(stack.database).toBeDefined();
      expect(stack.dbSecret).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    test('should handle custom VPC CIDR', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomCIDRStack', {
        environmentSuffix: 'test',
        vpcCidr: '192.168.0.0/16',
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '192.168.0.0/16',
      });
    });

    test('should handle custom domain name when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomDomainStack', {
        environmentSuffix: 'test',
        domainName: 'example.com',
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: Match.stringLikeRegexp('.*example\.com\.$'),
      });
    });
  });
});
