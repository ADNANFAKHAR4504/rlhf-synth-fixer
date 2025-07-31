import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Define a dummy context for testing purposes to match the stack's logic
const testContext = {
  context: {
    [environmentSuffix]: {
      instanceSize: 'micro',
      vpcCidr: '10.0.0.0/16',
    },
  },
};

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App(testContext);
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Logic', () => {
    test('should use environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack1', { environmentSuffix: 'prod' });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'prod' }
        ]),
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');
      const testStack = new TapStack(testApp, 'TestStack2');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'staging' }
        ]),
      });
    });

    test('should default to dev when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack3');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'dev' }
        ]),
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with the correct CIDR from context', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should create public and private subnets', () => {
      // Check for at least one of each required subnet type
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true, // Identifies a public subnet
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false, // Identifies a private subnet
      });
    });
  });

  describe('Database Configuration', () => {
    test('should create an RDS instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        DBInstanceClass: 'db.t4g.small', // Based on actual implementation
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create an S3 bucket with versioning and encryption', () => {
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
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('should apply Project and Environment tags to the VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Project', Value: 'SecureCloudEnvironment' }
        ]),
      });
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: environmentSuffix }
        ]),
      });
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create an Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create ALB target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/health',
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create an Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
      });
    });

    test('should create scaling policies', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
      });
    });
  });

  describe('Security Groups', () => {
    test('should create bastion security group with SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for bastion host',
        SecurityGroupIngress: [
          {
            CidrIp: '203.0.113.0/24',
            Description: 'Allow SSH access from trusted IP range',
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
          },
        ],
      });
    });

    test('should create ALB security group with HTTP access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ALB',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ],
      });
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Bastion Host Configuration', () => {
    test('should create bastion host instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.nano',
      });
    });
  });

  describe('Outputs', () => {
    test('should create outputs for important resources', () => {
      // Assert the actual outputs defined in tap-stack.ts
      template.hasOutput('ALBDNS', {});
      template.hasOutput('BastionHostId', {});
      template.hasOutput('RDSEndpoint', {});
      template.hasOutput('LogBucketName', {});
      template.hasOutput('VPCId', {});
    });
  });
});
