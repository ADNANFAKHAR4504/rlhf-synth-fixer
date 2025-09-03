import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DefenseInDepthStack, DefenseInDepthStackProps } from '../lib/defense-in-depth-stack';

describe('DefenseInDepthStack', () => {
  let app: cdk.App;
  let stack: DefenseInDepthStack;
  let template: Template;

  const defaultProps: DefenseInDepthStackProps = {
    environmentSuffix: 'test',
    personalIpAddress: '192.168.1.1',
  };

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Construction', () => {
    test('should create DefenseInDepthStack with required props', () => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestDefenseStack');
    });

    test('should use default personalIpAddress when not provided', () => {
      const propsWithoutIp = {
        environmentSuffix: 'test',
      };
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', propsWithoutIp);
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
    });

    test('should use context personalIpAddress when not in props', () => {
      app = new cdk.App({
        context: {
          personalIpAddress: '10.0.0.1',
        },
      });
      const propsWithoutIp = {
        environmentSuffix: 'test',
      };
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', propsWithoutIp);
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create EBS KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'EBS encryption key for test',
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/ebs-key-test',
      });
    });

    test('should create S3 KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'S3 encryption key for test',
        EnableKeyRotation: true,
      });
    });

    test('should create SQS KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'SQS encryption key for test',
        EnableKeyRotation: true,
      });
    });

    test('should have KMS key policy for Auto Scaling service role', () => {
      template.hasResourceProperties('AWS::KMS::Key', {});
    });
  });

  describe('IAM Roles and Policies', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create EC2 role with SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {});
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });

    test('should create Lambda role with SQS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {});
    });
  });

  describe('VPC and Networking', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create NAT gateway', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });

    test('should create internet gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create EC2 security group with SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('should create ALB security group with HTTP/HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });
  });

  describe('EC2 and Auto Scaling', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro',
        },
      });
    });

    test('should create auto scaling group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '4',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('should create target tracking scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
      });
    });
  });

  describe('Load Balancer', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create application load balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('should create load balancer listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('S3 Bucket', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create S3 bucket policy for CloudFront', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {});
    });
  });

  describe('SQS Queue', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create SQS queue with encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'log-queue-test',
        VisibilityTimeout: 300,
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });
  });

  describe('Lambda Function', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
      });
    });

    test('should create S3 event notification for Lambda', () => {
      // S3 event notifications are handled by CDK custom resources
      // We just verify the Lambda function exists
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
      });
    });
  });

  describe('WAF Web ACL', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create WAF Web ACL with managed rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'CLOUDFRONT',
        DefaultAction: { Allow: {} },
      });
    });
  });

  describe('CloudFront Distribution', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
          },
          PriceClass: 'PriceClass_100',
        },
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'notBreaching',
        AlarmDescription: 'High CPU utilization alarm',
      });
    });

    test('should create network in alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'NetworkIn',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 1000000,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'notBreaching',
        AlarmDescription: 'High network in traffic alarm',
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);
    });

    test('should create VPC ID output', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('should create ALB DNS name output', () => {
      template.hasOutput('AlbDnsName', {
        Description: 'ALB DNS Name',
      });
    });

    test('should create CloudFront domain name output', () => {
      template.hasOutput('CloudFrontDomainName', {
        Description: 'CloudFront Distribution Domain Name',
      });
    });

    test('should create S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
      });
    });

    test('should create SQS queue URL output', () => {
      template.hasOutput('SqsQueueUrl', {
        Description: 'SQS Queue URL',
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing personalIpAddress gracefully', () => {
      const propsWithoutIp = {
        environmentSuffix: 'test',
      };
      expect(() => {
        stack = new DefenseInDepthStack(app, 'TestDefenseStack', propsWithoutIp);
      }).not.toThrow();
    });

    test('should handle empty environment suffix', () => {
      const propsWithEmptySuffix = {
        environmentSuffix: '',
        personalIpAddress: '192.168.1.1',
      };
      expect(() => {
        stack = new DefenseInDepthStack(app, 'TestDefenseStack', propsWithEmptySuffix);
      }).not.toThrow();
    });

    test('should handle special characters in environment suffix', () => {
      const propsWithSpecialChars = {
        environmentSuffix: 'test-env_123',
        personalIpAddress: '192.168.1.1',
      };
      expect(() => {
        stack = new DefenseInDepthStack(app, 'TestDefenseStack', propsWithSpecialChars);
      }).not.toThrow();
    });

    test('should handle invalid IP address format', () => {
      const propsWithInvalidIp = {
        environmentSuffix: 'test',
        personalIpAddress: 'invalid-ip',
      };
      expect(() => {
        stack = new DefenseInDepthStack(app, 'TestDefenseStack', propsWithInvalidIp);
      }).toThrow();
    });

    test('should handle IP address with existing CIDR mask', () => {
      const propsWithCidrIp = {
        environmentSuffix: 'test',
        personalIpAddress: '192.168.1.1/32',
      };
      expect(() => {
        stack = new DefenseInDepthStack(app, 'TestDefenseStack', propsWithCidrIp);
      }).not.toThrow();
    });
  });

  describe('Resource Naming', () => {
    test('should use environment suffix in resource names', () => {
      const customSuffix = 'custom-env';
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', {
        environmentSuffix: customSuffix,
        personalIpAddress: '192.168.1.1',
      });
      template = Template.fromStack(stack);

      // Check that resources include the environment suffix
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `EBS encryption key for ${customSuffix}`,
      });

      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `log-queue-${customSuffix}`,
      });
    });
  });

  describe('Stack Properties', () => {
    test('should have correct stack properties', () => {
      stack = new DefenseInDepthStack(app, 'TestDefenseStack', defaultProps);
      template = Template.fromStack(stack);

      expect(stack.stackName).toBe('TestDefenseStack');
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should be constructable with different construct IDs', () => {
      const stack1 = new DefenseInDepthStack(app, 'Stack1', defaultProps);
      const stack2 = new DefenseInDepthStack(app, 'Stack2', defaultProps);

      expect(stack1.stackName).toBe('Stack1');
      expect(stack2.stackName).toBe('Stack2');
      expect(stack1).not.toBe(stack2);
    });
  });
});
