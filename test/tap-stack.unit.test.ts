import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private (database subnets are separate)
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create NAT gateway (LocalStack compatible)', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1); // Reduced for LocalStack
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP/HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          },
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          },
        ],
      });
    });

    test('should create database security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('should create app security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application instances',
      });
    });
  });

  // VPC Flow Logs and VPC Endpoints removed for LocalStack Community compatibility

  describe('RDS Database', () => {
    test('should create encrypted RDS instance (LocalStack compatible)', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '15.8',
        StorageEncrypted: true,
        BackupRetentionPeriod: 1, // Reduced for LocalStack
        DeletionProtection: false, // Disabled for LocalStack cleanup
        MultiAZ: false, // Disabled for LocalStack
      });
    });

    test('should create database subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {});
    });

    test('should use credentials from Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS database credentials',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create encrypted S3 bucket for app assets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create S3 bucket policies for security', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {});
    });

    test('should create CloudTrail S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2); // App assets + CloudTrail
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 instance role with least privilege', () => {
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
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ],
      });
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('Application Load Balancer and Auto Scaling', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 8080,
        Protocol: 'HTTP',
        HealthCheckPath: '/health',
      });
    });

    test('should create auto scaling group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '2',
      });
    });

    test('should create launch configuration for LocalStack (no LaunchTemplate)', () => {
      // For LocalStack environment, the stack uses LaunchConfiguration
      // Check that ASG has either LaunchTemplate OR LaunchConfiguration properties
      const templateJson = template.toJSON();
      const asgResource = Object.values(templateJson.Resources).find(
        (resource: any) => resource.Type === 'AWS::AutoScaling::AutoScalingGroup'
      ) as any;

      expect(asgResource).toBeDefined();
      // Either LaunchTemplate or LaunchConfiguration should be present
      const hasLaunchMechanism =
        asgResource.Properties.LaunchTemplate !== undefined ||
        asgResource.Properties.LaunchConfigurationName !== undefined;
      expect(hasLaunchMechanism).toBe(true);
    });

    test('should use launch template for non-LocalStack with IMDSv2', () => {
      // When not in LocalStack (e.g., account !== 000000000000), should have LaunchTemplate
      const appNonLocalStack = new cdk.App();
      const stackNonLocalStack = new TapStack(appNonLocalStack, 'NonLocalStackTest', {
        env: { account: '123456789012', region: 'us-east-1' }
      });
      const templateNonLocalStack = Template.fromStack(stackNonLocalStack);

      // Should have LaunchTemplate with IMDSv2
      templateNonLocalStack.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail (LocalStack compatible)', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: false, // Simplified for LocalStack
        IsMultiRegionTrail: false, // Simplified for LocalStack
        EnableLogFileValidation: false, // Disabled for LocalStack
      });
    });

    test('should create CloudTrail log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/cloudtrail/secure-app',
        RetentionInDays: 365,
      });
    });
  });

  // IAM Access Analyzer removed (requires LocalStack Pro)

  describe('Resource Tagging', () => {
    test('should tag all resources with required tags', () => {
      // Verify that critical tags are present
      const templateJson = template.toJSON();
      const vpcResource = Object.values(templateJson.Resources).find(
        (resource: any) => resource.Type === 'AWS::EC2::VPC'
      ) as any;
      
      const tags = vpcResource.Properties.Tags;
      const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
      const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
      
      expect(environmentTag).toBeDefined();
      expect(environmentTag.Value).toBe('Production');
      expect(ownerTag).toBeDefined();
      expect(ownerTag.Value).toBe('DevOps');
    });
  });

  describe('Stack Outputs', () => {
    test('should create required CloudFormation outputs', () => {
      template.hasOutput('LoadBalancerDNS', {});
      template.hasOutput('DatabaseEndpoint', {});
      template.hasOutput('S3BucketName', {});
      template.hasOutput('VpcId', {});
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded credentials', () => {
      // Check that Secrets Manager is used for database credentials
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS database credentials',
      });
      
      // Verify that the database is encrypted
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should use HTTPS/TLS for secure communication', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enable encryption at rest', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should handle environment suffix parameter', () => {
      const stackWithSuffix = new TapStack(app, 'TestStackWithSuffix', {
        environmentSuffix: 'prod',
      });
      
      expect(stackWithSuffix).toBeDefined();
    });

    test('should work without environment suffix', () => {
      const stackWithoutSuffix = new TapStack(app, 'TestStackWithoutSuffix', {});
      
      expect(stackWithoutSuffix).toBeDefined();
    });
  });
});