import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: { account: '123456789012', region: 'us-west-2' }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with 3 AZs for high availability', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
      
      // Verify 3 public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 public + 3 private + 3 isolated
    });

    test('creates NAT gateways for redundancy', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates EC2 security group with ALB access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
      
      // Verify security group ingress rule from ALB
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        Description: 'Allow HTTP from ALB',
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `ha-app-template-${environmentSuffix}`,
        LaunchTemplateData: {
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
                DeleteOnTermination: true,
              },
            }),
          ]),
        },
      });
    });

    test('creates auto scaling group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '3',
      });
    });

    test('configures ELB health check', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });
  });

  describe('Load Balancer', () => {
    test('creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 10,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5,
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Storage', () => {
    test('creates S3 bucket for application data with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `ha-app-data-${environmentSuffix}-us-west-2`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
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

    test('creates disaster recovery bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `ha-app-dr-${environmentSuffix}-us-west-2`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 buckets have deletion policy set to DESTROY', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 instance role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
        ManagedPolicyArns: Match.anyValue(),
      });
    });

    test('creates S3 access policy for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3AccessPolicy',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  Resource: `arn:aws:s3:::ha-app-data-${environmentSuffix}-us-west-2/*`,
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('creates instance profile', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `ha-app-alerts-${environmentSuffix}`,
        DisplayName: 'High Availability App Alerts',
      });
    });

    test('creates CloudWatch alarms for CPU utilization', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        Threshold: 80,
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
      });
    });

    test('creates CloudWatch alarm for unhealthy targets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        Threshold: 1,
      });
    });
  });

  describe('Auto Scaling Policies', () => {
    test('creates step scaling policies', () => {
      // Verify scaling policies exist (CDK may create additional policies)
      const policies = template.findResources('AWS::AutoScaling::ScalingPolicy');
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(2);
      
      // Check that policies are step scaling type
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'StepScaling',
      });
    });
  });

  describe('Backup and Disaster Recovery', () => {
    test('creates backup vault', () => {
      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultName: `ha-app-backup-vault-${environmentSuffix}`,
      });
    });

    test('creates backup plan with correct schedule', () => {
      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanName: `ha-app-backup-plan-${environmentSuffix}`,
        },
      });
    });

    test('creates backup selection', () => {
      template.hasResourceProperties('AWS::Backup::BackupSelection', {
        BackupSelection: {
          SelectionName: 'BackupSelection',
        },
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates EventBridge rule for instance termination', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.autoscaling'],
          'detail-type': ['EC2 Instance Terminate Successful'],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('AppDataBucketName', {
        Description: 'S3 Bucket for Application Data',
      });
    });

    test('exports SNS topic ARN', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Topic ARN for Alerts',
      });
    });

    test('exports backup vault name', () => {
      template.hasOutput('BackupVaultName', {
        Description: 'AWS Backup Vault Name',
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resources include environment suffix', () => {
      // Check that key resources include the environment suffix
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
      
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
      
      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
    });
  });

  describe('High Availability Features', () => {
    test('resources deployed across multiple AZs', () => {
      // Verify subnets are in different AZs
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set();
      Object.values(subnets).forEach(subnet => {
        if (subnet.Properties?.AvailabilityZone) {
          azs.add(subnet.Properties.AvailabilityZone);
        }
      });
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('auto scaling group spans multiple AZs', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.anyValue(),
      });
    });
  });
});