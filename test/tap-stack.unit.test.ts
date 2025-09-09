import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Configuration', () => {
    test('creates KMS key with proper rotation and policy', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for web application encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: { AWS: Match.anyValue() },
              Action: 'kms:*',
              Resource: '*'
            })
          ])
        }
      });
    });

    test('creates KMS alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/webapp-key-${environmentSuffix}`
      });
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `WebAppVPC-${environmentSuffix}`
          })
        ])
      });
    });

    test('creates public, private, and isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs × 3 subnet types
    });

    test('creates NAT gateways for private subnet connectivity', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates VPC Flow Log configuration', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP/HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: `Security group for Application Load Balancer - ${environmentSuffix}`,
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          }
        ]
      });
    });

    test('creates EC2 security group allowing traffic from ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: `Security group for EC2 instances - ${environmentSuffix}`
      });
    });

    test('creates RDS security group allowing MySQL traffic from EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: `Security group for RDS database - ${environmentSuffix}`,
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306
          }
        ]
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates VPC Flow Logs bucket with S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `vpc-flow-logs-${environmentSuffix}-${Match.anyValue()}-${Match.anyValue()}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('creates Assets bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `webapp-assets-${environmentSuffix}-${Match.anyValue()}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms'
              }
            }
          ]
        }
      });
    });

    test('creates CloudTrail bucket with proper policies', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `cloudtrail-logs-${environmentSuffix}-${Match.anyValue()}-${Match.anyValue()}`
      });
    });
  });

  describe('RDS Database', () => {
    test('creates MySQL RDS instance with encryption and Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `webapp-database-${environmentSuffix}`,
        Engine: 'mysql',
        EngineVersion: Match.stringLikeRegexp('8\\.0'),
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: false,
        EnablePerformanceInsights: true,
        EnableCloudwatchLogsExports: ['error', 'general'],
        MonitoringInterval: 60
      });
    });

    test('creates DB subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `db-subnet-group-${environmentSuffix}`,
        DBSubnetGroupDescription: `Subnet group for RDS database - ${environmentSuffix}`
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `webapp-alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application'
      });
    });

    test('creates target group with health check configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `webapp-tg-${environmentSuffix}`,
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP',
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates launch template with proper AMI and encryption', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `webapp-lt-${environmentSuffix}`,
        LaunchTemplateData: {
          InstanceType: 't3.small',
          Monitoring: { Enabled: true },
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
                DeleteOnTermination: true
              }
            }
          ]
        }
      });
    });

    test('creates Auto Scaling Group with proper capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `webapp-asg-${environmentSuffix}`,
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2'
      });
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF Web ACL with managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `webapp-waf-${environmentSuffix}`,
        Scope: 'REGIONAL',
        DefaultAction: { Allow: {} },
        Rules: [
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 2
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 3
          })
        ]
      });
    });

    test('associates WAF with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {});
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail with encryption and validation', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `webapp-cloudtrail-${environmentSuffix}`,
        IncludeGlobalServiceEvents: true,
        EnableLogFileValidation: true
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `high-cpu-alarm-${environmentSuffix}`,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2
      });
    });

    test('creates database connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `high-db-connections-alarm-${environmentSuffix}`,
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 20
      });
    });
  });

  describe('AWS Config', () => {
    test('creates Config delivery channel', () => {
      template.hasResourceProperties('AWS::Config::DeliveryChannel', {
        Name: `config-delivery-channel-${environmentSuffix}`,
        S3KeyPrefix: 'config'
      });
    });

    test('creates Config recorder', () => {
      template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
        Name: `config-recorder-${environmentSuffix}`,
        RecordingGroup: {
          AllSupported: true,
          IncludeGlobalResourceTypes: true
        }
      });
    });

    test('creates S3 public access Config rules', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `s3-public-read-prohibited-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED'
        }
      });

      template.hasResourceProperties('AWS::Config::ConfigRule', {
        ConfigRuleName: `s3-public-write-prohibited-${environmentSuffix}`,
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED'
        }
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates remediation Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `remediation-lambda-${environmentSuffix}`,
        Runtime: 'python3.9',
        Handler: 'index.lambda_handler',
        Timeout: 60
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 instance role with proper policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `EC2InstanceRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        ManagedPolicyArns: [
          Match.stringLikeRegexp('CloudWatchAgentServerPolicy'),
          Match.stringLikeRegexp('AmazonSSMManagedInstanceCore')
        ]
      });
    });

    test('creates instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `EC2InstanceProfile-${environmentSuffix}`
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('creates required stack outputs', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name'
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database endpoint'
      });

      template.hasOutput('AssetsBucketName', {
        Description: 'S3 bucket for application assets'
      });

      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption'
      });

      template.hasOutput('WebACLArn', {
        Description: 'WAF Web ACL ARN'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('validates expected resource counts', () => {
      // Core infrastructure resources
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs × 3 types
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3); // ALB, EC2, RDS
      template.resourceCountIs('AWS::S3::Bucket', 5); // VPC logs, Access logs, Assets, CloudTrail, Config
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      
      // Config and monitoring resources
      template.resourceCountIs('AWS::Config::ConfigRule', 3); // S3 public read/write, RDS encryption
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3); // CPU, DB connections, response time
    });
  });
});
