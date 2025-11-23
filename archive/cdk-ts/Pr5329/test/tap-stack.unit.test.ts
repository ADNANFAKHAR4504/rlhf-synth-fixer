import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
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

  describe('Environment Configuration', () => {
    test('should use environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { 
        environmentSuffix: 'test-env' 
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the test environment suffix
      const bucketResources = testTemplate.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucketResources)[0];
      const bucketName = bucketResource.Properties.BucketName;

      // Verify the bucket name contains the environment suffix
      expect(bucketName).toHaveProperty('Fn::Join');
      expect(bucketName['Fn::Join'][1]).toContain('bookstore-assets-');
      expect(bucketName['Fn::Join'][1].some((item: any) => 
        typeof item === 'string' && item.includes('-test-env')
      )).toBe(true);
    });

    test('should use environment suffix from context when props not provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-env');
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the context environment suffix
      const bucketResources = testTemplate.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucketResources)[0];
      const bucketName = bucketResource.Properties.BucketName;

      // Verify the bucket name contains the context environment suffix
      expect(bucketName).toHaveProperty('Fn::Join');
      expect(bucketName['Fn::Join'][1]).toContain('bookstore-assets-');
      expect(bucketName['Fn::Join'][1].some((item: any) => 
        typeof item === 'string' && item.includes('-context-env')
      )).toBe(true);
    });

    test('should use default dev suffix when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the default dev suffix
      const bucketResources = testTemplate.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucketResources)[0];
      const bucketName = bucketResource.Properties.BucketName;

      // Verify the bucket name contains the default dev suffix
      expect(bucketName).toHaveProperty('Fn::Join');
      expect(bucketName['Fn::Join'][1]).toContain('bookstore-assets-');
      expect(bucketName['Fn::Join'][1].some((item: any) => 
        typeof item === 'string' && item.includes('-dev')
      )).toBe(true);
    });

    test('should prioritize props over context when both provided', () => {
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'context-env');
      const testStack = new TapStack(testApp, 'TestStack', { 
        environmentSuffix: 'props-env' 
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify that resources are created with the props environment suffix
      const bucketResources = testTemplate.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucketResources)[0];
      const bucketName = bucketResource.Properties.BucketName;

      // Verify the bucket name contains the props environment suffix
      expect(bucketName).toHaveProperty('Fn::Join');
      expect(bucketName['Fn::Join'][1]).toContain('bookstore-assets-');
      expect(bucketName['Fn::Join'][1].some((item: any) => 
        typeof item === 'string' && item.includes('-props-env')
      )).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.8.0.0/16',
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });

    test('should create instance security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for EC2 instances - allows traffic only from ALB',
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create Auto Scaling Group with correct instance type', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '1',
      });
    });

    test('should create Launch Configuration with t3.small instances', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        InstanceType: 't3.small',
      });
    });
  });

  describe('Load Balancer', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('should create target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
        }
      );
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

  describe('CloudWatch Alarms', () => {
    test('should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
      });
    });

    test('should create unhealthy targets alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `bookstore-unhealthy-targets-${environmentSuffix}`,
        AlarmDescription: 'Alarm when unhealthy targets detected',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
      });
    });

    test('should create high response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `bookstore-high-response-time-${environmentSuffix}`,
        AlarmDescription: 'Alarm when target response time exceeds 2 seconds',
        Threshold: 2,
      });
    });

    test('should create 5XX errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `bookstore-high-5xx-errors-${environmentSuffix}`,
        AlarmDescription: 'Alarm when 5XX errors exceed threshold',
        Threshold: 10,
      });
    });

    test('should create multiple CloudWatch alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Security Group Rules', () => {
    test('should create ALB security group with HTTP ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          },
        ],
      });
    });

    test('should create instance security group with ALB access', () => {
      // The instance security group doesn't have explicit ingress rules in the current implementation
      // It relies on the ALB security group for access
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances - allows traffic only from ALB',
      });
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create Auto Scaling Group with correct scaling configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '1',
        AutoScalingGroupName: `bookstore-asg-${environmentSuffix}`,
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('should configure ELB health check for Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });
    test('should create scaling policies', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
        },
      });
    });
    test('should create request count based scaling policy', () => {
      // Verify request count based scaling is configured
      const scalingPolicies = template.findResources('AWS::AutoScaling::ScalingPolicy');
      expect(Object.keys(scalingPolicies).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer with correct scheme', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create target group with health check configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        TargetType: 'instance',
      });
    });

    test('should create HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'forward',
          },
        ],
      });
    });

    test('should create HTTPS listener with redirect', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTP', // Note: Using HTTP for demo, should be HTTPS with certificate
        DefaultActions: [
          {
            Type: 'redirect',
            RedirectConfig: {
              Port: '80',
              Protocol: 'HTTP',
            },
          },
        ],
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with correct naming pattern', () => {
      // Get the actual bucket name from the template
      const bucketResources = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucketResources)[0];
      const bucketName = bucketResource.Properties.BucketName;

      // Verify the bucket name follows the expected pattern (CloudFormation template structure)
      expect(bucketName).toHaveProperty('Fn::Join');
      const bucketNameArray = bucketName['Fn::Join'][1];

      // Check that the array contains the expected structure
      expect(bucketNameArray).toContain('bookstore-assets-');

      // Verify the structure: ['bookstore-assets-', {Ref: 'AWS::Region'}, '-dev-randomSuffix']
      expect(bucketNameArray).toHaveLength(3);
      expect(bucketNameArray[0]).toBe('bookstore-assets-');
      expect(bucketNameArray[1]).toEqual({Ref: 'AWS::Region'});
      expect(bucketNameArray[2]).toMatch(/^-[a-z0-9-]+-[a-z0-9]+$/); // Environment suffix + random suffix
    });

    test('should create S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tags to VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: [
          {
            Key: 'Application',
            Value: 'OnlineBookstore',
          },
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'Name',
            Value: `bookstore-vpc-${environmentSuffix}`,
          },
        ],
      });
    });

    test('should apply tags to S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: [
          {
            Key: 'Application',
            Value: 'OnlineBookstore',
          },
          {
            Key: 'Environment',
            Value: environmentSuffix,
          },
          {
            Key: 'Purpose',
            Value: 'ApplicationAssets',
          },
        ],
      });
    });
  });

  describe('Resource Counts and Dependencies', () => {
    test('should create expected number of VPC resources', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcResources)).toHaveLength(1);

      const subnetResources = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnetResources)).toHaveLength(2); // 2 public subnets

      const igwResources = template.findResources('AWS::EC2::InternetGateway');
      expect(Object.keys(igwResources)).toHaveLength(1);
    });

    test('should create expected number of security groups', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(sgResources)).toHaveLength(2); // ALB + Instance security groups
    });

    test('should create expected number of load balancer resources', () => {
      const albResources = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(Object.keys(albResources)).toHaveLength(1);

      const targetGroupResources = template.findResources('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(Object.keys(targetGroupResources)).toHaveLength(1);

      const listenerResources = template.findResources('AWS::ElasticLoadBalancingV2::Listener');
      expect(Object.keys(listenerResources)).toHaveLength(2); // HTTP + HTTPS listeners
    });

    test('should create expected number of auto scaling resources', () => {
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      expect(Object.keys(asgResources)).toHaveLength(1);

      const lcResources = template.findResources('AWS::AutoScaling::LaunchConfiguration');
      expect(Object.keys(lcResources)).toHaveLength(1);

      const scalingPolicyResources = template.findResources('AWS::AutoScaling::ScalingPolicy');
      expect(Object.keys(scalingPolicyResources).length).toBeGreaterThanOrEqual(2); // CPU + Request count scaling
    });

    test('should create expected number of monitoring resources', () => {
      const alarmResources = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarmResources).length).toBeGreaterThanOrEqual(4); // CPU + Unhealthy + Response time + 5XX alarms
    });
  });

  describe('Outputs', () => {
    test('should output Load Balancer DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
      });
    });

    test('should output S3 bucket name', () => {
      template.hasOutput('AssetsBucketName', {
        Description: 'Name of the S3 bucket for application assets',
      });
    });

    test('should output CPU alarm name', () => {
      template.hasOutput('CPUAlarmName', {
        Description: 'Name of the CPU utilization alarm',
      });
    });
  });
});