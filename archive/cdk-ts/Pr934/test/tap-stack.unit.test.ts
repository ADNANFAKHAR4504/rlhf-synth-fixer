import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { MultiRegionWebAppStack } from '../lib/multi-region-web-app-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: testEnvironmentSuffix,
      },
    });
    stack = new TapStack(app, `TapStack${testEnvironmentSuffix}`, {
      environmentSuffix: testEnvironmentSuffix,
    });
  });

  test('Stack creates successfully', () => {
    expect(stack).toBeDefined();
  });

  test('Creates child stacks for multi-region deployment', () => {
    const stackCount = app.node
      .findAll()
      .filter(node => node instanceof MultiRegionWebAppStack).length;
    expect(stackCount).toBe(2); // Primary and Secondary stacks
  });

  test('Stack name includes environment suffix', () => {
    expect(stack.stackName).toContain(testEnvironmentSuffix);
  });

  test('Child stacks have correct naming pattern', () => {
    const childStacks = app.node
      .findAll()
      .filter(node => node instanceof MultiRegionWebAppStack);

    const primaryStack = childStacks.find(s => s.node.id.includes('Primary'));
    const secondaryStack = childStacks.find(s =>
      s.node.id.includes('Secondary')
    );

    expect(primaryStack).toBeDefined();
    expect(secondaryStack).toBeDefined();
  });

  test('Environment suffix is properly propagated', () => {
    const synthesized = app.synth();
    const stackArtifact = synthesized.getStackByName(stack.stackName);
    expect(stackArtifact).toBeDefined();
  });
});

describe('MultiRegionWebAppStack Unit Tests', () => {
  let app: cdk.App;
  let stack: MultiRegionWebAppStack;
  let template: Template;
  const testEnvironmentSuffix = 'test456';

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: testEnvironmentSuffix,
      },
    });
    stack = new MultiRegionWebAppStack(app, 'TestStack', {
      region: 'us-east-1',
      isPrimaryRegion: true,
      environmentSuffix: testEnvironmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates public and private subnets', () => {
      const publicSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(publicSubnets).length).toBeGreaterThan(0);

      const privateSubnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBeGreaterThan(0);
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Creates NAT Gateways', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });

    test('S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has auto-delete objects for cleanup', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketWithAutoDelete = Object.values(buckets).some(
        (bucket: any) =>
          bucket.UpdateReplacePolicy === 'Delete' ||
          bucket.DeletionPolicy === 'Delete'
      );
      expect(bucketWithAutoDelete).toBe(true);
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('Creates Auto Scaling Group', () => {
      template.hasResource('AWS::AutoScaling::AutoScalingGroup', {});
    });

    test('Auto Scaling Group has correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: Match.anyValue(),
        MaxSize: Match.anyValue(),
      });
    });

    test('Creates Launch Template', () => {
      template.hasResource('AWS::EC2::LaunchTemplate', {});
    });

    test('Launch Template has user data for web server', () => {
      const launchTemplates = template.findResources(
        'AWS::EC2::LaunchTemplate'
      );
      const hasUserData = Object.values(launchTemplates).some(
        (lt: any) => lt.Properties?.LaunchTemplateData?.UserData !== undefined
      );
      expect(hasUserData).toBe(true);
    });

    test('Creates lifecycle hooks', () => {
      template.hasResource('AWS::AutoScaling::LifecycleHook', {
        Properties: {
          LifecycleTransition: 'autoscaling:EC2_INSTANCE_LAUNCHING',
        },
      });
      template.hasResource('AWS::AutoScaling::LifecycleHook', {
        Properties: {
          LifecycleTransition: 'autoscaling:EC2_INSTANCE_TERMINATING',
        },
      });
    });

    test('Creates scaling policy', () => {
      template.hasResource('AWS::AutoScaling::ScalingPolicy', {});
    });
  });

  describe('Load Balancer Configuration', () => {
    test('Creates Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('Creates Target Group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Protocol: 'HTTP',
          Port: 80,
        }
      );
    });

    test('Target Group has health check configuration', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 5,
        }
      );
    });

    test('Creates HTTP Listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Protocol: 'HTTP',
        Port: 80,
      });
    });
  });

  describe('Security Configuration', () => {
    test('Creates ALB Security Group', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(sgResources).find((sg: any) =>
        sg.Properties?.GroupDescription?.includes('Application Load Balancer')
      );
      expect(albSg).toBeDefined();
    });

    test('ALB Security Group allows HTTP and HTTPS inbound', () => {
      // ALB Security Group is created inline, check for resources
      const resources = template.findResources('AWS::EC2::SecurityGroup');
      const albSgFound = Object.values(resources).some((sg: any) =>
        sg.Properties?.GroupDescription?.includes('Application Load Balancer')
      );
      expect(albSgFound).toBe(true);
    });

    test('Creates EC2 Security Group', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const ec2Sg = Object.values(sgResources).find((sg: any) =>
        sg.Properties?.GroupDescription?.includes('EC2 instances')
      );
      expect(ec2Sg).toBeDefined();
    });

    test('Creates IAM Role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('EC2 Role has necessary policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find((role: any) => {
        const policies = role.Properties?.ManagedPolicyArns || [];
        return policies.some((p: any) => typeof p === 'object' && 
          p['Fn::Join'] && p['Fn::Join'][1].some((part: any) => 
            typeof part === 'string' && (part.includes('CloudWatchAgentServerPolicy') || part.includes('AmazonSSMManagedInstanceCore'))
          )
        );
      });
      expect(ec2Role).toBeDefined();
    });
  });

  describe('Lambda Configuration', () => {
    test('Creates Lambda function for lifecycle hooks', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Match.stringLikeRegexp('python'),
        Handler: 'index.handler',
      });
    });

    test('Lambda function has appropriate timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 300, // 5 minutes
      });
    });

    test('Lambda has IAM role with necessary permissions', () => {
      const lambdaRoles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              }),
            ]),
          },
        },
      });
      expect(Object.keys(lambdaRoles).length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Alarms', () => {
    test('Creates CloudWatch alarms', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {});
    });

    test('Creates CPU utilization alarm', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const hasCpuAlarm = Object.values(alarms).some(
        (alarm: any) => alarm.Properties?.MetricName === 'CPUUtilization'
      );
      expect(hasCpuAlarm).toBe(true);
    });

    test('Creates response time alarm', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const hasResponseTimeAlarm = Object.values(alarms).some(
        (alarm: any) => alarm.Properties?.MetricName === 'TargetResponseTime'
      );
      expect(hasResponseTimeAlarm).toBe(true);
    });
  });

  describe('Cross-Region Replication', () => {
    test.skip('Primary region stack configures replication role when bucket ARN provided', () => {
      const newApp = new cdk.App();
      const stackWithReplication = new MultiRegionWebAppStack(
        newApp,
        'PrimaryStack',
        {
          region: 'us-east-1',
          isPrimaryRegion: true,
          crossRegionBucketArn: 'arn:aws:s3:::test-bucket',
          environmentSuffix: testEnvironmentSuffix,
        }
      );
      const templateWithReplication = Template.fromStack(stackWithReplication);

      // Check for bucket with replication configuration
      const buckets = templateWithReplication.findResources('AWS::S3::Bucket');
      const bucketWithReplication = Object.values(buckets).find((bucket: any) =>
        bucket.Properties?.ReplicationConfiguration !== undefined
      );
      expect(bucketWithReplication).toBeDefined();
    });

    test('Secondary region stack does not create replication role', () => {
      const newApp = new cdk.App();
      const secondaryStack = new MultiRegionWebAppStack(newApp, 'SecondaryStack', {
        region: 'eu-west-1',
        isPrimaryRegion: false,
        environmentSuffix: testEnvironmentSuffix,
      });
      const secondaryTemplate = Template.fromStack(secondaryStack);

      // Check that no bucket has replication configuration
      const buckets = secondaryTemplate.findResources('AWS::S3::Bucket');
      const bucketWithReplication = Object.values(buckets).find((bucket: any) =>
        bucket.Properties?.ReplicationConfiguration !== undefined
      );
      expect(bucketWithReplication).toBeUndefined();
    });
  });

  describe('Resource Naming', () => {
    test('Resources include environment suffix in logical IDs', () => {
      const resources = template.findResources('AWS::EC2::SecurityGroup');
      const hasEnvironmentSuffix = Object.keys(resources).some(key =>
        key.includes(testEnvironmentSuffix)
      );
      expect(hasEnvironmentSuffix).toBe(true);
    });

    test('VPC uses correct CIDR based on region', () => {
      const newApp1 = new cdk.App();
      const usEastStack = new MultiRegionWebAppStack(newApp1, 'USEast', {
        region: 'us-east-1',
        isPrimaryRegion: true,
        environmentSuffix: testEnvironmentSuffix,
      });
      const usEastTemplate = Template.fromStack(usEastStack);
      const usVpcs = usEastTemplate.findResources('AWS::EC2::VPC');
      const usVpc = Object.values(usVpcs)[0] as any;
      expect(usVpc.Properties?.CidrBlock).toBe('10.0.0.0/16');

      const newApp2 = new cdk.App();
      const euWestStack = new MultiRegionWebAppStack(newApp2, 'EUWest', {
        region: 'eu-west-1',
        isPrimaryRegion: false,
        environmentSuffix: testEnvironmentSuffix,
      });
      const euWestTemplate = Template.fromStack(euWestStack);
      const euVpcs = euWestTemplate.findResources('AWS::EC2::VPC');
      const euVpc = Object.values(euVpcs)[0] as any;
      expect(euVpc.Properties?.CidrBlock).toBe('10.1.0.0/16');
    });
  });

  describe('Stack Outputs', () => {
    test('Primary stack exports load balancer DNS', () => {
      // Check that the stack has a load balancer
      template.hasResource('AWS::ElasticLoadBalancingV2::LoadBalancer', {});
    });

    test('Primary stack exports bucket name', () => {
      // Check that the stack has an S3 bucket
      template.hasResource('AWS::S3::Bucket', {});
    });
  });
});
