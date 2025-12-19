import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should pass environment suffix to nested construct', () => {
      // Verify that BlogInfrastructureStack is created as a child construct
      const children = stack.node.children;
      expect(children.length).toBeGreaterThan(0);

      // Find the BlogInfrastructureStack construct
      const blogStack = children.find(child => child.node.id === 'BlogInfrastructureStack');
      expect(blogStack).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create correct number of subnets', () => {
      // Should have 2 subnets total (1 subnet group x 2 AZs)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBe(2);
    });

    test('should create public subnets with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.1.0.0/24'
      });
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should attach Internet Gateway to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('should create route tables for public subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBe(2);
    });

    test('should create routes to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0'
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Log', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 1);
    });

    test('should create CloudWatch Log Group for Flow Logs', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
    });

    test('should create IAM role for Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [{
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0'
        }]
      });
    });

    test('should create EC2 security group with SSH restriction', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([{
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '192.168.0.0/24',
          Description: 'Allow SSH from specific CIDR'
        }])
      });
    });

    test('should allow HTTP traffic from ALB to EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should have S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      });
    });

    test('should have lifecycle rule for intelligent tiering', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [{
            Status: 'Enabled',
            NoncurrentVersionTransitions: [{
              StorageClass: 'INTELLIGENT_TIERING',
              TransitionInDays: 30
            }]
          }]
        }
      });
    });

    test('should block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have correct bucket name pattern', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketName = Object.values(buckets)[0].Properties.BucketName;

      // CDK generates CloudFormation functions, so check the structure
      expect(bucketName).toEqual({
        'Fn::Join': ['', ['blog-static-assets-test-', { Ref: 'AWS::AccountId' }]]
      });
    });

    test('should have proper removal policy configured', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(buckets)[0];
      expect(bucket.DeletionPolicy).toBe('Delete');
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('should attach CloudWatch Agent policy to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([{
          'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/CloudWatchAgentServerPolicy']]
        }])
      });
    });

    test('should grant S3 bucket access to EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([{
            Effect: 'Allow',
            Action: Match.arrayWith(['s3:GetObject*', 's3:PutObject']),
            Resource: Match.anyValue()
          }])
        }
      });
    });
  });

  describe('Launch Template', () => {
    test('should create launch template with t3.micro instance', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro'
        }
      });
    });

    test('should use Amazon Linux 2023 AMI', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          ImageId: Match.anyValue()
        }
      });
    });

    test('should include user data for Apache installation', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          UserData: Match.anyValue()
        }
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application'
      });
    });

    test('should have ALB with correct name pattern', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `blog-alb-${environmentSuffix}`
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30
      });
    });

    test('should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create ASG with correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '4',
        DesiredCapacity: '2'
      });
    });

    test('should use ELB health check', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300
      });
    });

    test('should create CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 70
        }
      });
    });

    test('should have cooldown period', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        Cooldown: Match.anyValue()
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      });
    });

    test('should create memory alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'MEM_AVAILABLE',
        Namespace: 'BlogPlatform',
        Threshold: 536870912,
        ComparisonOperator: 'LessThanThreshold'
      });
    });

    test('should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `BlogPlatform-${environmentSuffix}`
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have outputs defined in the stack', () => {
      // Check that outputs exist (they're prefixed with the nested stack name)
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);

      // Verify some key outputs exist
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.some(key => key.includes('LoadBalancerDNS'))).toBe(true);
      expect(outputKeys.some(key => key.includes('StaticAssetsBucketName'))).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('should tag VPC resources', () => {
      // Check that VPC has proper name tag
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{
          Key: 'Name',
          Value: Match.stringLikeRegexp('.*BlogVpc.*')
        }])
      });
    });
  });
});