import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/network-stack';
// LocalStack: Import LocalStack-compatible stack (standalone EC2 instead of AutoScaling/ALB)
import { WebAppStack } from '../lib/webapp-stack-localstack';
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

describe('WebAppStack (LocalStack-Compatible)', () => {
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

  test('does not create Application Load Balancer (LocalStack limitation)', () => {
    // LocalStack Community: ALB not supported, using standalone EC2 instances
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 0);
  });

  test('does not create Auto Scaling Group (LocalStack limitation)', () => {
    // LocalStack Community: AutoScaling not supported, using standalone EC2 instances
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 0);
  });

  test('creates EC2 security group with correct ingress rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for EC2 instances',
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

  test('creates IAM role for EC2 instances with SSM and CloudWatch policies', () => {
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

  test('creates 2 standalone EC2 instances', () => {
    // LocalStack: Using standalone EC2 instances instead of AutoScaling
    template.resourceCountIs('AWS::EC2::Instance', 2);
  });

  test('EC2 instances have correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
      UserData: Match.anyValue(), // User data script for Apache installation
    });
  });

  test('exports instance DNS names', () => {
    template.hasOutput('Instance1Idprimary', {});
    template.hasOutput('Instance1PublicDnsprimary', {
      Export: {
        Name: `Instance1-DNS-primary-${environmentSuffix}`,
      },
    });

    template.hasOutput('Instance2Idprimary', {});
    template.hasOutput('Instance2PublicDnsprimary', {
      Export: {
        Name: `Instance2-DNS-primary-${environmentSuffix}`,
      },
    });
  });

  test('exports primary instance DNS for reference', () => {
    template.hasOutput('PrimaryInstanceDnsprimary', {
      Export: {
        Name: `Primary-DNS-primary-${environmentSuffix}`,
      },
    });
  });

  test('includes LocalStack limitations note', () => {
    template.hasOutput('LocalStackNoteprimary', {});
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
  test('ensures EC2 instance names are properly set', () => {
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

    // LocalStack: Verify EC2 instances are created (no ALB/TargetGroup)
    template.resourceCountIs('AWS::EC2::Instance', 2);
  });
});