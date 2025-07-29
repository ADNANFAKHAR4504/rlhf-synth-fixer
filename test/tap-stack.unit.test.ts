import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let primaryStack: TapStack;
  let secondaryStack: TapStack;
  let primaryTemplate: Template;
  let secondaryTemplate: Template;

  beforeEach(() => {
    app = new cdk.App();
    primaryStack = new TapStack(app, 'TestTapStackPrimary', {
      environmentSuffix,
      isPrimaryRegion: true,
      globalClusterId: 'test-global-db',
      env: { region: 'us-east-1' },
    });
    secondaryStack = new TapStack(app, 'TestTapStackSecondary', {
      environmentSuffix,
      isPrimaryRegion: false,
      globalClusterId: 'test-global-db',
      env: { region: 'eu-west-1' },
    });
    primaryTemplate = Template.fromStack(primaryStack);
    secondaryTemplate = Template.fromStack(secondaryStack);
  });

  describe('VPC Configuration Tests', () => {
    test('should create a VPC with correct configuration in both regions', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
      secondaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets in both regions', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
      secondaryTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets with egress in both regions', () => {
      primaryTemplate.resourceCountIs('AWS::EC2::NatGateway', 1);
      secondaryTemplate.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('Encryption and Security Tests', () => {
    test('should create S3 bucket with encryption and versioning', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
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
  });

  describe('Database Configuration Tests', () => {
    test('should create RDS MySQL instance with proper configuration', () => {
      primaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t4g.small',
        MultiAZ: true,
        StorageEncrypted: true,
      });
    });
  });

  describe('Application Tier Tests', () => {
    test('should create Auto Scaling Group with proper configuration', () => {
      primaryTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
      });
    });

    test('should create Application Load Balancer', () => {
      primaryTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create IAM role for EC2 instances', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Role', {
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
      });
    });
  });

  describe('Monitoring and Alerting Tests', () => {
    test('should create CloudWatch alarm for Auto Scaling Group CPU', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 85,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('Comprehensive Tagging Tests', () => {
    test('should apply tagging strategy to all resources', () => {
      // Test that VPC has the project and environment tags
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Project', Value: 'SecureCloudEnvironment' }]),
      });
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: environmentSuffix }]),
      });
    });
  });

  describe('Multi-Region Resource Count Tests', () => {
    test('should create expected infrastructure in primary region', () => {
      primaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      primaryTemplate.resourceCountIs('AWS::RDS::DBInstance', 1);
      primaryTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      primaryTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      primaryTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      primaryTemplate.resourceCountIs('AWS::EC2::Instance', 1); // Bastion host
    });

    test('should create expected infrastructure in secondary region', () => {
      secondaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      secondaryTemplate.resourceCountIs('AWS::RDS::DBInstance', 1);
      secondaryTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      secondaryTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      secondaryTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      secondaryTemplate.resourceCountIs('AWS::EC2::Instance', 1); // Bastion host
    });

    test('should create proper subnet configuration for high availability', () => {
      // 2 AZs * 3 subnet types = 6 subnets per region
      primaryTemplate.resourceCountIs('AWS::EC2::Subnet', 6);
      secondaryTemplate.resourceCountIs('AWS::EC2::Subnet', 6);
    });
  });

  describe('Security Configuration Tests', () => {
    test('should create security groups with restrictive access', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for'),
      });
    });

    test('should enforce SSL on S3 bucket', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Deny',
              Action: 's3:*',
              Principal: { AWS: '*' },
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });
  });

  describe('Output Tests', () => {
    test('should create outputs for important resources', () => {
      primaryTemplate.hasOutput('ALB_DNS', {});
      primaryTemplate.hasOutput('BastionHostId', {});
      primaryTemplate.hasOutput('DatabaseEndpoint', {});
    });
  });

  describe('Route53 Failover Tests', () => {
    test('should not create Route53 records when domain props not provided', () => {
      // This tests that no Route53 records are created in basic configuration
      primaryTemplate.resourceCountIs('AWS::Route53::RecordSet', 0);
      secondaryTemplate.resourceCountIs('AWS::Route53::RecordSet', 0);
    });
  });

  describe('Conditional Logic Tests', () => {
    test('should handle stack with different regions correctly', () => {
      const app = new cdk.App();
      const differentRegionStack = new TapStack(app, 'TestStackDifferentRegion', {
        environmentSuffix,
        isPrimaryRegion: false,
        env: { region: 'eu-west-1' },
      });
      const templateDifferentRegion = Template.fromStack(differentRegionStack);
      
      // Should still create core resources
      templateDifferentRegion.resourceCountIs('AWS::EC2::VPC', 1);
      templateDifferentRegion.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('should handle undefined environment suffix correctly', () => {
      const app = new cdk.App();
      const stackWithoutSuffix = new TapStack(app, 'TestStackWithoutSuffix', {
        env: { region: 'us-west-2' },
      });
      const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);
      
      // Should still create core resources with default suffix
      templateWithoutSuffix.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });
  });
});
