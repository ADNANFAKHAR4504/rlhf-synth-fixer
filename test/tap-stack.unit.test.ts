import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/network-stack';
import { WebAppStack } from '../lib/webapp-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const environmentSuffix = 'test';

describe('NetworkStack', () => {
  let app: cdk.App;
  let stack: NetworkStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new NetworkStack(app, 'TestNetworkStack', {
      environmentSuffix,
      regionName: 'primary',
    });
    template = Template.fromStack(stack);
  });

  test('creates VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      Tags: Match.arrayWith([
        { Key: 'Name', Value: Match.stringLikeRegexp('vpc-pri-test') },
      ]),
    });
  });

  test('creates public subnets', () => {
    // LocalStack: Simplified to public subnets only (no NAT Gateway required)
    template.resourceCountIs('AWS::EC2::Subnet', 2); // 2 public subnets only

    // Verify public subnet configuration
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
      Tags: Match.arrayWith([
        { Key: 'aws-cdk:subnet-name', Value: 'public' },
      ]),
    });
  });

  test('does not create NAT gateways (LocalStack simplified)', () => {
    // LocalStack: NAT Gateways removed to avoid complexity
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
  });

  test('does not create VPC Flow Logs (LocalStack unsupported)', () => {
    // LocalStack: VPC Flow Logs not fully supported
    template.resourceCountIs('AWS::EC2::FlowLog', 0);
  });

  test('creates security group for web application', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web application instances',
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

  test('exports VPC and security group IDs', () => {
    template.hasOutput('VPCIdprimary', {
      Export: {
        Name: `VPC-primary-${environmentSuffix}`,
      },
    });

    template.hasOutput('WebAppSecurityGroupIdprimary', {
      Export: {
        Name: `WebAppSG-primary-${environmentSuffix}`,
      },
    });
  });
});

describe('WebAppStack', () => {
  let app: cdk.App;
  let networkStack: NetworkStack;
  let webAppStack: WebAppStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    
    // Create network stack first
    networkStack = new NetworkStack(app, 'TestNetworkStack', {
      environmentSuffix,
      regionName: 'primary',
    });

    // Create web app stack with network stack's VPC
    webAppStack = new WebAppStack(app, 'TestWebAppStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      regionName: 'primary',
    });
    
    template = Template.fromStack(webAppStack);
  });

  test('creates Application Load Balancer', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Type: 'application',
      Scheme: 'internet-facing',
      Name: Match.stringLikeRegexp('alb-pri-'),
    });
  });

  test('creates ALB security group with correct rules', () => {
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

  test('creates EC2 security group allowing traffic from ALB', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for EC2 instances',
    });
  });

  test('creates IAM role for EC2 instances', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          }),
        ]),
      }),
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({ 'Fn::Join': Match.anyValue() }),
        Match.objectLike({ 'Fn::Join': Match.anyValue() }),
      ]),
    });
  });

  test('creates Launch Template with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateName: Match.stringLikeRegexp('lt-pri-'),
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.micro',
        Monitoring: { Enabled: true },
      }),
    });
  });

  test('creates Auto Scaling Group with correct settings', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      MaxSize: '10',
      DesiredCapacity: '2',
      AutoScalingGroupName: Match.stringLikeRegexp('asg-pri-'),
      HealthCheckType: 'ELB',
      HealthCheckGracePeriod: 300,
    });
  });

  test('creates Target Group with health check', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
      Protocol: 'HTTP',
      TargetType: 'instance',
      Name: Match.stringLikeRegexp('tg-pri-'),
      HealthCheckEnabled: true,
      HealthCheckIntervalSeconds: 30,
      HealthCheckTimeoutSeconds: 10,
      UnhealthyThresholdCount: 5,
      HealthCheckPath: '/',
      Matcher: { HttpCode: '200' },
    });
  });

  test('creates ALB Listener', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
      DefaultActions: Match.arrayWith([
        Match.objectLike({
          Type: 'forward',
        }),
      ]),
    });
  });

  test('creates CPU utilization scaling policy', () => {
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingConfiguration: Match.objectLike({
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ASGAverageCPUUtilization',
        },
        TargetValue: 70,
      }),
    });
  });

  test('creates request count scaling policy', () => {
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingConfiguration: Match.objectLike({
        PredefinedMetricSpecification: {
          PredefinedMetricType: 'ALBRequestCountPerTarget',
        },
      }),
    });
  });

  test('exports ALB DNS name and hosted zone', () => {
    template.hasOutput('LoadBalancerDNSprimary', {
      Export: {
        Name: `ALB-DNS-primary-${environmentSuffix}`,
      },
    });

    template.hasOutput('LoadBalancerHostedZoneIdprimary', {
      Export: {
        Name: `ALB-HZ-primary-${environmentSuffix}`,
      },
    });
  });
});

describe('Multi-Region Setup', () => {
  test('verifies configuration supports multi-region deployment', () => {
    const app = new cdk.App();
    
    // Test primary region setup
    const primaryNetworkStack = new NetworkStack(app, 'PrimaryNetwork', {
      environmentSuffix,
      regionName: 'primary',
      env: { region: 'us-east-1' },
    });
    
    const primaryWebAppStack = new WebAppStack(app, 'PrimaryWebApp', {
      environmentSuffix,
      vpc: primaryNetworkStack.vpc,
      regionName: 'primary',
      env: { region: 'us-east-1' },
    });
    
    // Test secondary region setup
    const secondaryNetworkStack = new NetworkStack(app, 'SecondaryNetwork', {
      environmentSuffix,
      regionName: 'secondary',
      env: { region: 'us-west-2' },
    });
    
    const secondaryWebAppStack = new WebAppStack(app, 'SecondaryWebApp', {
      environmentSuffix,
      vpc: secondaryNetworkStack.vpc,
      regionName: 'secondary',
      env: { region: 'us-west-2' },
    });
    
    // Verify stacks are created with correct regions
    expect(primaryNetworkStack.region).toBe('us-east-1');
    expect(primaryWebAppStack.region).toBe('us-east-1');
    expect(secondaryNetworkStack.region).toBe('us-west-2');
    expect(secondaryWebAppStack.region).toBe('us-west-2');
  });
});

describe('Resource Naming', () => {
  test('ensures resource names are within AWS limits', () => {
    const app = new cdk.App();
    const longSuffix = 'verylongenvironmentsuffix12345';
    
    // Create a proper network stack for the VPC
    const networkStack = new NetworkStack(app, 'TestNetworkStack', {
      environmentSuffix: longSuffix,
      regionName: 'primary',
    });
    
    const stack = new WebAppStack(app, 'TestStack', {
      environmentSuffix: longSuffix,
      vpc: networkStack.vpc,
      regionName: 'primary',
    });
    
    const template = Template.fromStack(stack);
    
    // ALB name should be truncated to fit 32 character limit
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: Match.stringLikeRegexp('^.{1,32}$'),
    });
    
    // Target group name should be truncated to fit 32 character limit
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: Match.stringLikeRegexp('^.{1,32}$'),
    });
  });
});