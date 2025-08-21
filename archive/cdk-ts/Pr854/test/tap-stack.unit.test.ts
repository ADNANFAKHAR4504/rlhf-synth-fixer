import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecureWebAppStack } from '../lib/secure-web-app-stack';

describe('SecureWebAppStack', () => {
  let app: cdk.App;
  let stack: SecureWebAppStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecureWebAppStack(app, 'TestSecureWebAppStack', {
      environment: 'test',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates SecureWebAppStack with correct environment', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestSecureWebAppStack');
    });

    test('uses environment from props', () => {
      const customApp = new cdk.App();
      const customStack = new SecureWebAppStack(customApp, 'CustomStack', {
        environment: 'custom',
      });
      expect(customStack).toBeDefined();
    });
  });

  describe('KMS Key', () => {
    test('creates KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for tf infrastructure encryption - test',
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });

    test('creates KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tf-encryption-key-test',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 AZs * 2 subnet types
    });

    test('creates NAT gateway for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1); // Only 1 for cost optimization
    });

    test('creates VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('creates flow log group with correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs/tf-test',
        RetentionInDays: 30,
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        GroupName: 'tf-alb-sg-test',
      });
    });

    test('creates EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        GroupName: 'tf-ec2-sg-test',
      });
    });
  });

  describe('IAM Role', () => {
    test('creates EC2 role with proper managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tf-ec2-role-test',
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
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                Match.objectLike({ Ref: 'AWS::Partition' }),
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                Match.objectLike({ Ref: 'AWS::Partition' }),
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates main S3 bucket without account ID in name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-ec2-data-bucket-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates ALB logs bucket without account ID in name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-alb-access-logs-test',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'AES256', // S3_MANAGED encryption
              }),
            }),
          ]),
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldLogs',
              Status: 'Enabled',
              ExpirationInDays: 90,
            },
          ],
        },
      });
    });

    test('creates S3 bucket policy for ALB access logs', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowELBServiceAccount',
              Effect: 'Allow',
              Action: 's3:PutObject',
            }),
            Match.objectLike({
              Sid: 'AllowELBServiceAccountGetBucketAcl',
              Effect: 'Allow',
              Action: 's3:GetBucketAcl',
            }),
          ]),
        },
      });
    });
  });

  describe('Launch Template', () => {
    test('creates launch template with security features', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'tf-launch-template-test',
        LaunchTemplateData: {
          InstanceType: 't3.micro', // Correct instance type
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
              },
            },
          ],
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates ALB with correct configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-alb-test',
        Type: 'application',
        Scheme: 'internet-facing',
        LoadBalancerAttributes: Match.arrayWith([
          {
            Key: 'deletion_protection.enabled',
            Value: 'false', // Correct value for our implementation
          },
        ]),
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'tf-tg-test', // Correct name
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5, // Correct value
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates ASG with proper configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'tf-asg-test',
        MinSize: '2',
        MaxSize: '10', // Correct max size
        // Note: desiredCapacity removed to avoid deployment warnings
      });
    });

    test('creates scaling policies', () => {
      const scalingPolicies = template.findResources('AWS::AutoScaling::ScalingPolicy');
      expect(Object.keys(scalingPolicies).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF WebACL with managed rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'tf-waf-test',
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          }),
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 3,
            Action: {
              Block: {},
            },
            Statement: {
              RateBasedStatement: {
                Limit: 10000, // Current implementation value
                AggregateKeyType: 'IP',
              },
            },
          }),
        ]),
      });
    });

    test('associates WAF with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {});
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'tf-monitoring-dashboard-test',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates LoadBalancer DNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('creates S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name for EC2 data',
      });
    });

    test('creates VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('creates KMS Key ID output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
      });
    });

    test('creates Auto Scaling Group name output', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of core resources', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2); // ALB SG + EC2 SG
      template.resourceCountIs('AWS::S3::Bucket', 2); // Main bucket + ALB logs bucket
      template.resourceCountIs('AWS::S3::BucketPolicy', 2); // ALB logs bucket policy + main bucket policy
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      
      // Check that we have at least the expected IAM roles
      const iamRoles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(iamRoles).length).toBeGreaterThanOrEqual(1);
      
      // Check that we have at least the expected log groups
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(1);
    });
  });
});
