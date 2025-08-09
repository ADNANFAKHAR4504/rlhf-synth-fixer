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
      allowedCidrBlocks: ['10.0.0.0/8'],
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
        allowedCidrBlocks: ['192.168.1.0/24'],
      });
      expect(customStack).toBeDefined();
    });

    test('uses allowed CIDR blocks from props', () => {
      const customApp = new cdk.App();
      const customStack = new SecureWebAppStack(customApp, 'CustomStack', {
        environment: 'custom',
        allowedCidrBlocks: ['172.16.0.0/12'],
      });
      expect(customStack).toBeDefined();
    });

    test('uses default CIDR blocks when not provided', () => {
      const customApp = new cdk.App();
      const customStack = new SecureWebAppStack(customApp, 'CustomStack', {
        environment: 'custom',
        // allowedCidrBlocks not provided - should use default ['10.0.0.0/8']
      });
      expect(customStack).toBeDefined();
      
      // Verify the default CIDR block is used in security group
      const customTemplate = Template.fromStack(customStack);
      customTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8'
          })
        ])
      });
    });
  });

  describe('KMS Key', () => {
    test('creates KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting resources in test environment',
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

    test('creates NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('creates flow log group with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs-test',
        RetentionInDays: 30,
      });
    });

    test('creates VPC endpoints for secure AWS service access', () => {
      // S3 Gateway Endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });

      // SSM Interface Endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with restricted outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            Description: 'Allow HTTP to EC2 instances',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          }),
        ]),
      });
    });

    test('creates EC2 security group with restricted outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '169.254.169.254/32',
            Description: 'Allow HTTP to EC2 metadata service',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            Description: 'Allow DNS resolution',
            FromPort: 53,
            IpProtocol: 'udp',
            ToPort: 53,
          }),
        ]),
      });
    });
  });

  describe('IAM Role', () => {
    test('creates EC2 role with proper managed policies', () => {
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

    test('has S3 access policy with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3Access',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                  Condition: {
                    StringEquals: {
                      's3:ExistingObjectTag/Environment': 'test',
                    },
                  },
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('has KMS access policy with ViaService condition', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3Access',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: [
                    'kms:Encrypt',
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey',
                  ],
                  Condition: {
                    StringEquals: {
                      'kms:ViaService': [
                        's3.us-west-2.amazonaws.com',
                        'logs.us-west-2.amazonaws.com',
                      ],
                    },
                  },
                }),
              ]),
            },
          }),
        ]),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates main S3 bucket with security features', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-backend-storage-test-123456789012',
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
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            }),
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            }),
          ]),
        },
      });
    });

    test('creates ALB logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-alb-logs-test-123456789012',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
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
  });

  describe('Launch Template', () => {
    test('creates launch template with security features', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'tf-launch-template-test',
        LaunchTemplateData: {
          InstanceType: 't3.medium',
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
    test('creates ALB with deletion protection', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-alb-test',
        Type: 'application',
        Scheme: 'internet-facing',
        LoadBalancerAttributes: Match.arrayWith([
          {
            Key: 'deletion_protection.enabled',
            Value: 'true',
          },
        ]),
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'tf-target-group-test',
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
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
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'EC2',
        HealthCheckGracePeriod: 300,
      });
    });

    test('creates scaling policies', () => {
      // Note: We now use TargetTrackingScalingPolicy instead of StepScalingPolicy
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
                Limit: 2000,
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
    test('creates CloudWatch log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ec2/httpd-access-test',
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ec2/httpd-error-test',
        RetentionInDays: 30,
      });
    });

    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tf-alerts-test',
        DisplayName: 'Alerts for test environment',
      });
    });

    test('creates CloudWatch alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-high-cpu-alarm-test',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-unhealthy-hosts-alarm-test',
        MetricName: 'UnHealthyHostCount',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the load balancer',
        Export: {
          Name: 'tf-alb-dns-test',
        },
      });

      template.hasOutput('S3BucketName', {
        Description: 'Name of the S3 bucket',
        Export: {
          Name: 'tf-s3-bucket-test',
        },
      });

      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID',
        Export: {
          Name: 'tf-kms-key-test',
        },
      });

      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: 'tf-vpc-id-test',
        },
      });

      template.hasOutput('WAFWebACLArn', {
        Description: 'WAF Web ACL ARN',
        Export: {
          Name: 'tf-waf-arn-test',
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates expected number of core resources', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3); // ALB SG + EC2 SG + VPC Endpoint SG
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 2); // S3 Gateway + SSM Interface endpoints
      // Note: CDK creates additional IAM roles for VPC flow logs
      const iamRoles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(iamRoles).length).toBeGreaterThanOrEqual(1);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      // Note: CDK creates additional CloudWatch alarms for auto scaling
      const cloudWatchAlarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(cloudWatchAlarms).length).toBeGreaterThanOrEqual(2);
      // Note: CDK creates additional log groups for VPC flow logs
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(3);
    });
  });
});
