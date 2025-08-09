import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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

    test('applies required tags', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });

      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('applies common tags to stack', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
          Match.objectLike({
            Key: 'Project',
            Value: 'SecureWebApp',
          }),
        ]),
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates internet gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('creates NAT gateways for private subnets', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });

    test('creates VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('KMS Key', () => {
    test('creates KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Encryption key for secure web app - test',
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.anyValue(),
              }),
            }),
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('logs.*amazonaws.com'),
              }),
            }),
            Match.objectLike({
              Sid: 'Allow S3 Service',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 's3.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('creates KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tf-secure-web-app-key-test',
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP and HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
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
        ]),
      });
    });

    test('creates EC2 security group with restricted outbound access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        GroupName: 'tf-ec2-security-group-test',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS for package updates and AWS services',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP for package updates',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 53,
            ToPort: 53,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow DNS resolution',
          }),
          Match.objectLike({
            IpProtocol: 'udp',
            FromPort: 53,
            ToPort: 53,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow DNS resolution',
          }),
        ]),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });

    test('creates instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
      });
    });

    test('creates VPC flow log role with inline policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates main S3 bucket with security features', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-secure-storage-test',
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

    test('creates ALB logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-alb-access-logs-test',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'AES256',
              }),
            }),
          ]),
        },
      });
    });

    test('creates S3 bucket policy to deny non-SSL access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for security notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tf-security-notifications-test',
        DisplayName: 'Security Notifications - test',
      });
    });

    test('SNS topic uses KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('SNS topic has access policy', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowS3Publish',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: 'sns:Publish',
            }),
          ]),
        }),
      });
    });
  });

  describe('Launch Template', () => {
    test('creates launch template with security configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'tf-secure-launch-template-test',
        LaunchTemplateData: Match.objectLike({
          ImageId: Match.anyValue(),
          InstanceType: 't3.micro',
          UserData: Match.anyValue(),
          SecurityGroupIds: Match.arrayWith([
            Match.objectLike({
              'Fn::GetAtt': Match.anyValue(),
            }),
          ]),
          IamInstanceProfile: Match.objectLike({
            Arn: Match.anyValue(),
          }),
          MetadataOptions: Match.objectLike({
            HttpTokens: 'required',
          }),
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
                VolumeType: 'gp3',
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates ALB with proper configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-secure-alb-test',
        Type: 'application',
        Scheme: 'internet-facing',
        SecurityGroups: Match.arrayWith([
          Match.objectLike({
            'Fn::GetAtt': Match.anyValue(),
          }),
        ]),
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'tf-secure-tg-test',
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckPath: '/health.html',
        HealthCheckProtocol: 'HTTP',
        HealthCheckIntervalSeconds: 30,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
            TargetGroupArn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates auto scaling group with proper configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'tf-secure-asg-test',
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
        TargetGroupARNs: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
        LaunchTemplate: Match.objectLike({
          LaunchTemplateId: Match.anyValue(),
          Version: Match.anyValue(),
        }),
      });
    });

    test('creates CPU scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
        }),
      });
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF Web ACL with enhanced managed rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'tf-secure-waf-test',
        Scope: 'REGIONAL',
        DefaultAction: { Allow: {} },
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
            OverrideAction: { None: {} },
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 2,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            OverrideAction: { None: {} },
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 3,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            OverrideAction: { None: {} },
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesBotControlRuleSet',
            Priority: 4,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesBotControlRuleSet',
              },
            },
            OverrideAction: { None: {} },
          }),
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 5,
            Action: { Block: {} },
            Statement: {
              RateBasedStatement: {
                Limit: 1000,
                AggregateKeyType: 'IP',
              },
            },
          }),
        ]),
      });
    });

    test('creates WAF association with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.anyValue(),
        WebACLArn: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates ALB monitoring alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-ALB-4xx-errors-test',
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        MetricName: 'HTTPCode_Target_4XX_Count',
        Namespace: 'AWS/ApplicationELB',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-ALB-5xx-errors-test',
        Threshold: 5,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        MetricName: 'HTTPCode_Target_5XX_Count',
        Namespace: 'AWS/ApplicationELB',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-ALB-response-time-test',
        Threshold: 1,
        EvaluationPeriods: 3,
        TreatMissingData: 'notBreaching',
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
      });
    });

    test('creates WAF blocked requests alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-WAF-blocked-requests-test',
        Threshold: 100,
        EvaluationPeriods: 2,
        MetricName: 'BlockedRequests',
        Namespace: 'AWS/WAFV2',
      });
    });

    test('creates EC2 CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-EC2-high-cpu-test',
        Threshold: 80,
        EvaluationPeriods: 3,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('creates VPC flow logs group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs-test',
        RetentionInDays: 30,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);

      expect(outputKeys.some(key => key.includes('LoadBalancerDNS'))).toBe(true);
      expect(outputKeys.some(key => key.includes('S3BucketName'))).toBe(true);
      expect(outputKeys.some(key => key.includes('KMSKeyId'))).toBe(true);
      expect(outputKeys.some(key => key.includes('VPCId'))).toBe(true);
      expect(outputKeys.some(key => key.includes('WAFWebACLArn'))).toBe(true);
      expect(outputKeys.some(key => key.includes('SecurityNotificationsTopicArn'))).toBe(true);
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::S3::Bucket', 2); // Main bucket + ALB logs bucket
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5); // 4xx, 5xx, response time, WAF blocked, EC2 CPU
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 buckets enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });

    test('KMS key has rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('EC2 instances use encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
              }),
            }),
          ]),
          MetadataOptions: Match.objectLike({
            HttpTokens: 'required',
          }),
        }),
      });
    });

    test('Security groups implement least privilege', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            Description: 'Allow HTTPS for package updates and AWS services',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            Description: 'Allow HTTP for package updates',
          }),
        ]),
      });
    });
  });

  describe('Environment-specific Configuration', () => {
    test('uses environment-specific resource names', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-secure-storage-test',
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-secure-alb-test',
      });

      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'tf-secure-asg-test',
      });
    });

    test('creates resources with different environment', () => {
      const prodApp = new cdk.App();
      const prodStack = new SecureWebAppStack(prodApp, 'ProdSecureWebAppStack', {
        environment: 'prod',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-secure-storage-prod',
      });

      prodTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-secure-alb-prod',
      });
    });
  });

  describe('Infrastructure Compliance', () => {
    test('all resources have tf- prefix', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Encryption key for secure web app - test',
      });
      
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'tf-secure-vpc-test',
          }),
        ]),
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tf-alb-security-group-test',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tf-ec2-security-group-test',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-secure-storage-test',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tf-alb-access-logs-test',
      });

      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'tf-secure-waf-test',
      });

      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'tf-secure-asg-test',
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-secure-alb-test',
      });
    });

    test('all resources tagged with Environment: Production', () => {
      const resourceTypes = [
        'AWS::KMS::Key',
        'AWS::EC2::VPC',
        'AWS::S3::Bucket',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::AutoScaling::AutoScalingGroup',
      ];

      resourceTypes.forEach(resourceType => {
        template.hasResourceProperties(resourceType, {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Environment',
              Value: 'Production',
            }),
          ]),
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing environment parameter', () => {
      expect(() => {
        new SecureWebAppStack(app, 'ErrorStack', {} as any);
      }).toThrow();
    });
  });
});
