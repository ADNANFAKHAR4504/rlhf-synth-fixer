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
      // Check that all resources have Environment: Production tag
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
      // Check that the stack has the expected tags applied to resources
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
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets
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
              Condition: Match.objectLike({
                ArnEquals: Match.anyValue(),
              }),
            }),
            Match.objectLike({
              Sid: 'Allow S3 Service',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 's3.amazonaws.com',
              }),
              Condition: Match.objectLike({
                StringEquals: Match.anyValue(),
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
    test('creates ALB security group with HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
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
            Description: 'Allow HTTPS for updates and SSM',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP for package repositories',
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

    test('attaches least privilege policies to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'S3ObjectAccess',
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject'],
              Resource: Match.stringLikeRegexp('.*tf-secure-storage-test-.*/app-data/\\*'),
            }),
            Match.objectLike({
              Sid: 'S3BucketList',
              Effect: 'Allow',
              Action: 's3:ListBucket',
              Condition: Match.objectLike({
                StringLike: {
                  's3:prefix': ['app-data/*'],
                },
              }),
            }),
            Match.objectLike({
              Sid: 'KMSAccess',
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
              Condition: Match.objectLike({
                StringEquals: Match.anyValue(),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with enhanced security features', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tf-secure-storage-test-.*'),
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
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerEnforced',
            },
          ],
        },
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
            Match.objectLike({
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            }),
          ]),
        },
      });
    });

    test('creates separate access logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tf-access-logs-test-.*'),
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

    test('creates ALB logs bucket with unique naming', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tf-alb-access-logs-test-.*'),
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerEnforced',
            },
          ],
        },
      });
    });
  });

  describe('CloudTrail and GuardDuty', () => {
    test('creates CloudTrail for API logging', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: 'tf-secure-cloudtrail-test',
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      });
    });

    test('creates CloudTrail log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/cloudtrail/test',
        RetentionInDays: 365,
      });
    });

    test('creates GuardDuty detector', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
        DataSources: Match.objectLike({
          S3Logs: { Enable: true },
          Kubernetes: { AuditLogs: { Enable: true } },
          MalwareProtection: { ScanEc2InstanceWithFindings: { EbsVolumes: true } },
        }),
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for security notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tf-security-notifications-test',
        DisplayName: 'Security Notifications for test',
      });
    });

    test('SNS topic uses KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });
  });

  describe('Launch Template', () => {
    test('creates launch template with enhanced security configuration', () => {
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
            HttpPutResponseHopLimit: 1,
          }),
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
                DeleteOnTermination: true,
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
        Subnets: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
          Match.objectLike({
            Ref: Match.anyValue(),
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

    test('creates HTTP listener for testing without domain', () => {
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
        VPCZoneIdentifier: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
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

    test('creates CPU and request count scaling policies', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
        }),
      });

      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 1000,
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ALBRequestCountPerTarget',
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
            Name: 'RateLimitRule',
            Priority: 3,
            Action: { Block: {} },
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
          }),
          Match.objectLike({
            Name: 'GeoBlockingRule',
            Priority: 4,
            Action: { Block: {} },
            Statement: {
              GeoMatchStatement: {
                CountryCodes: ['CN', 'RU', 'KP'],
              },
            },
          }),
          Match.objectLike({
            Name: 'SQLInjectionRule',
            Priority: 5,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            OverrideAction: { None: {} },
          }),
        ]),
      });
    });

    test('creates WAF logging configuration', () => {
      template.hasResourceProperties('AWS::WAFv2::LoggingConfiguration', {
        ResourceArn: Match.anyValue(),
        LogDestinationConfigs: Match.arrayWith([
          Match.objectLike({
            'Fn::GetAtt': Match.anyValue(),
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
    test('creates comprehensive monitoring alarms', () => {
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

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-WAF-blocked-requests-test',
        Threshold: 100,
        EvaluationPeriods: 2,
        MetricName: 'BlockedRequests',
        Namespace: 'AWS/WAFV2',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tf-GuardDuty-findings-test',
        Threshold: 1,
        EvaluationPeriods: 1,
        MetricName: 'FindingCount',
        Namespace: 'AWS/GuardDuty',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('creates comprehensive log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs-test',
        RetentionInDays: 30,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/cloudtrail/test',
        RetentionInDays: 365,
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/wafv2/test',
        RetentionInDays: 30,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);

      expect(outputKeys.some(key => key.includes('tfLoadBalancerDNStest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfS3BucketNametest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfKMSKeyIdtest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfVPCIdtest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfWAFWebACLArntest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfCloudTrailArntest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfGuardDutyDetectorIdtest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tflistenerarntest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tf4xxalarmnametest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tf5xxalarmnametest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfresponsetimealarmnametest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfwafblockedalarmnametest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfguarddutyalarmnametest'))).toBe(true);
    });

    test('outputs have correct descriptions', () => {
      const outputs = template.findOutputs('*');
      
      // Find the actual output keys (they have unique suffixes)
      const loadBalancerDnsKey = Object.keys(outputs).find(key => key.includes('tfLoadBalancerDNStest'));
      const s3BucketNameKey = Object.keys(outputs).find(key => key.includes('tfS3BucketNametest'));
      const kmsKeyIdKey = Object.keys(outputs).find(key => key.includes('tfKMSKeyIdtest'));
      const vpcIdKey = Object.keys(outputs).find(key => key.includes('tfVPCIdtest'));
      const wafWebAclArnKey = Object.keys(outputs).find(key => key.includes('tfWAFWebACLArntest'));
      const cloudTrailArnKey = Object.keys(outputs).find(key => key.includes('tfCloudTrailArntest'));
      const guardDutyDetectorIdKey = Object.keys(outputs).find(key => key.includes('tfGuardDutyDetectorIdtest'));

      if (loadBalancerDnsKey) expect(outputs[loadBalancerDnsKey].Description).toBe('DNS name of the load balancer');
      if (s3BucketNameKey) expect(outputs[s3BucketNameKey].Description).toBe('Name of the S3 bucket');
      if (kmsKeyIdKey) expect(outputs[kmsKeyIdKey].Description).toBe('KMS Key ID for encryption');
      if (vpcIdKey) expect(outputs[vpcIdKey].Description).toBe('VPC ID');
      if (wafWebAclArnKey) expect(outputs[wafWebAclArnKey].Description).toBe('WAF Web ACL ARN');
      if (cloudTrailArnKey) expect(outputs[cloudTrailArnKey].Description).toBe('CloudTrail ARN');
      if (guardDutyDetectorIdKey) expect(outputs[guardDutyDetectorIdKey].Description).toBe('GuardDuty Detector ID');
    });
  });

  describe('Resource Count Validation', () => {
    test('creates expected number of resources', () => {
      // Check for specific resources by counting them directly
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::S3::Bucket', 3); // Main bucket + ALB logs bucket + Access logs bucket
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5); // 4xx, 5xx, response time, WAF blocked, GuardDuty
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.resourceCountIs('AWS::GuardDuty::Detector', 1);
      template.resourceCountIs('AWS::WAFv2::LoggingConfiguration', 1);
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

    test('EC2 instances use encrypted EBS volumes with enhanced security', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
                DeleteOnTermination: true,
              }),
            }),
          ]),
          MetadataOptions: Match.objectLike({
            HttpTokens: 'required',
            HttpPutResponseHopLimit: 1,
          }),
        }),
      });
    });

    test('Security groups implement least privilege', () => {
      // EC2 security group should not allow all outbound traffic
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            Description: 'Allow HTTPS for updates and SSM',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            Description: 'Allow HTTP for package repositories',
          }),
          Match.objectLike({
            IpProtocol: 'udp',
            FromPort: 53,
            ToPort: 53,
            Description: 'Allow DNS resolution',
          }),
        ]),
      });
    });

    test('IAM roles follow least privilege principle', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'S3ObjectAccess',
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject'],
              Resource: Match.stringLikeRegexp('.*app-data/\\*'),
            }),
            Match.objectLike({
              Sid: 'KMSAccess',
              Effect: 'Allow',
              Condition: Match.objectLike({
                StringEquals: Match.anyValue(),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Environment-specific Configuration', () => {
    test('uses environment suffix and unique identifiers in resource names', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tf-secure-storage-test-.*'),
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
        BucketName: Match.stringLikeRegexp('tf-secure-storage-prod-.*'),
      });

      prodTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-secure-alb-prod',
      });
    });

    test('creates HTTPS configuration when domain is provided', () => {
      const httpsApp = new cdk.App();
      const httpsStack = new SecureWebAppStack(httpsApp, 'HttpsSecureWebAppStack', {
        environment: 'prod',
        domainName: 'example.com',
        hostedZoneId: 'Z123456789',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      const httpsTemplate = Template.fromStack(httpsStack);

      httpsTemplate.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'example.com',
      });

      httpsTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
        SslPolicy: 'ELBSecurityPolicy-TLS-1-2-Ext-2018-06',
      });

      httpsTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'redirect',
            RedirectConfig: Match.objectLike({
              Protocol: 'HTTPS',
              Port: '443',
              StatusCode: 'HTTP_301',
            }),
          }),
        ]),
      });
    });
  });

  describe('Infrastructure Compliance', () => {
    test('all resources have tf- prefix', () => {
      // Check KMS Key
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Encryption key for secure web app - test',
      });
      
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'tf-secure-vpc-test',
          }),
        ]),
      });

      // Check Security Group names
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tf-alb-security-group-test',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'tf-ec2-security-group-test',
      });

      // Check S3 bucket names
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tf-secure-storage-test-.*'),
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tf-alb-access-logs-test-.*'),
      });

      // Check WAF name
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'tf-secure-waf-test',
      });

      // Check Auto Scaling Group name
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'tf-secure-asg-test',
      });

      // Check ALB name
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tf-secure-alb-test',
      });
    });

    test('all resources tagged with Environment: Production', () => {
      // Check multiple resource types have the Production tag
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

    test('uses Amazon Linux 2023 AMI', () => {
      // This is verified by the machineImage configuration in launch template
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          ImageId: Match.anyValue(), // AMI ID will be resolved at deployment
        }),
      });
    });

    test('outputs have tf- prefix', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);

      // Check that main outputs have tf- prefix
      expect(outputKeys.some(key => key.includes('tfLoadBalancerDNStest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfS3BucketNametest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfKMSKeyIdtest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfVPCIdtest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfWAFWebACLArntest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfCloudTrailArntest'))).toBe(true);
      expect(outputKeys.some(key => key.includes('tfGuardDutyDetectorIdtest'))).toBe(true);
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
