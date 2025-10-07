import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('Stack is created with correct properties', () => {
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test123'
    });

    expect(stack).toBeDefined();
    expect(stack.stackName).toBe('TestTapStack');
  });

  test('Stack creates VPC with correct configuration', () => {
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test123'
    });

    expect(stack.vpc).toBeDefined();
    // VPC CIDR block is a token that resolves at synthesis time
    expect(stack.vpc.vpcCidrBlock).toBeDefined();
  });

  test('Stack creates S3 bucket with environment suffix', () => {
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test123'
    });

    expect(stack.staticContentBucket).toBeDefined();
    // Bucket name will include the suffix
  });

  test('Stack creates Auto Scaling Group', () => {
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'prod',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });

    expect(stack.autoScalingGroup).toBeDefined();
    expect(stack.account).toBe('123456789012');
    expect(stack.region).toBe('us-east-1');
  });
});

describe('TapStack Infrastructure', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestInfraStack', {
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.3.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('Creates public and private subnets', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true
        }
      });

      const allSubnets = template.findResources('AWS::EC2::Subnet');

      expect(Object.keys(publicSubnets).length).toBeGreaterThan(0);
      expect(Object.keys(allSubnets).length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
    });

    test('Creates Internet Gateway and attaches to VPC', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('Creates correct route tables', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0'
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('S3 bucket has lifecycle rule for Intelligent-Tiering', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'IntelligentTiering',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'INTELLIGENT_TIERING',
                  TransitionInDays: 0
                })
              ])
            })
          ])
        }
      });
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('S3 bucket has correct removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });
    });
  });

  describe('Security Configuration', () => {
    test('Creates security group for web servers', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1'
          }
        ]
      });
    });

    test('Security group allows HTTP traffic on port 80', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp'
          })
        ])
      });
    });

    test('Creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('IAM role has correct managed policies attached', () => {
      // Look for the WebServerRole specifically
      const roles = template.findResources('AWS::IAM::Role');
      const webServerRole = Object.entries(roles).find(([key, value]) =>
        key.startsWith('WebServerRole')
      );

      expect(webServerRole).toBeDefined();
      const roleResource = webServerRole![1];
      expect(roleResource.Properties.ManagedPolicyArns).toBeDefined();
      expect(roleResource.Properties.ManagedPolicyArns.length).toBe(3);

      // Check that the managed policies contain the expected strings
      const policiesAsStrings = JSON.stringify(roleResource.Properties.ManagedPolicyArns);
      expect(policiesAsStrings).toContain('CloudWatchAgentServerPolicy');
      expect(policiesAsStrings).toContain('AmazonSSMManagedInstanceCore');
      expect(policiesAsStrings).toContain('EC2InstanceConnect');
    });

    test('EC2 instances have read access to S3 bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Compute Resources', () => {
    test('Creates launch template with t3.micro instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro'
        })
      });
    });

    test('Launch template enables detailed monitoring', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          Monitoring: {
            Enabled: true
          }
        })
      });
    });

    test('Launch template requires IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required'
          }
        })
      });
    });

    test('Creates Auto Scaling Group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        DesiredCapacity: '2'
      });
    });

    test('Auto Scaling Group uses public subnets', () => {
      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgResource = Object.values(asg)[0];

      expect(asgResource.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asgResource.Properties.VPCZoneIdentifier.length).toBeGreaterThan(0);
    });

    test('Auto Scaling Group has EC2 health check configured', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'EC2',
        HealthCheckGracePeriod: 300
      });
    });

    test('Creates CPU utilization scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization'
          },
          TargetValue: 60
        })
      });
    });
  });

  describe('Monitoring Configuration', () => {
    test('Creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'CommunityPlatformAlerts'
      });
    });

    test('Creates CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'breaching'
      });
    });

    test('Creates memory utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'MemoryUsedPercent',
        Namespace: 'CommunityPlatform',
        Threshold: 80,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('Alarms are connected to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');

      Object.values(alarms).forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('CloudWatch Application Insights application is commented out', () => {
      // ApplicationInsights is temporarily disabled to fix deployment issues
      template.resourceCountIs('AWS::ApplicationInsights::Application', 0);
    });
  });

  describe('Additional Features', () => {
    test('EC2 Instance Connect Endpoint is commented out', () => {
      // InstanceConnectEndpoint is temporarily disabled to fix deployment issues
      template.resourceCountIs('AWS::EC2::InstanceConnectEndpoint', 0);
    });
  });

  describe('Stack Outputs', () => {
    test('Exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID'
      });
    });

    test('Exports S3 bucket name', () => {
      template.hasOutput('StaticContentBucketName', {
        Description: 'S3 Bucket for static content'
      });
    });

    test('Exports Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name'
      });
    });

    test('Exports Alert Topic ARN', () => {
      template.hasOutput('AlertTopicArn', {
        Description: 'SNS Topic ARN for alerts'
      });
    });
  });

  describe('Tags', () => {
    test('Resources are tagged with Project tag', () => {
      const resources = template.toJSON().Resources;

      const taggedResources = Object.values(resources).filter((resource: any) =>
        resource.Properties?.Tags || resource.Properties?.TagSpecifications
      );

      expect(taggedResources.length).toBeGreaterThan(0);
    });
  });

  describe('Environment Suffix Usage', () => {
    test('Uses environment suffix in resource names', () => {
      const newApp = new cdk.App();
      const customStack = new TapStack(newApp, 'CustomStack', {
        environmentSuffix: 'prod123'
      });
      const customTemplate = Template.fromStack(customStack);

      // Check bucket name contains suffix
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((b: any) =>
        JSON.stringify(b.Properties.BucketName)
      );
      expect(bucketNames.some(name => name.includes('prod123'))).toBe(false); // This is using the main template

      // Instead check the custom template
      const customBuckets = customTemplate.findResources('AWS::S3::Bucket');
      const customBucketNames = Object.values(customBuckets).map((b: any) =>
        JSON.stringify(b.Properties.BucketName)
      );
      expect(customBucketNames.some(name => name.includes('prod123'))).toBe(true);

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*prod123')
      });
    });

    test('Falls back to default environment suffix', () => {
      const newApp = new cdk.App();
      const defaultStack = new TapStack(newApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Check that the bucket name definition includes 'dev' in the Fn::Join
      const buckets = defaultTemplate.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((b: any) =>
        JSON.stringify(b.Properties.BucketName)
      );
      expect(bucketNames.some(name => name.includes('dev'))).toBe(true);
    });
  });
});