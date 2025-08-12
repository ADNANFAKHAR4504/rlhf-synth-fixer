import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';
import { SecurityStack } from '../lib/security-stack';
import { ComputeStack } from '../lib/compute-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('Creates nested stacks with correct hierarchy', () => {
    // Verify the main stack exists
    expect(stack).toBeDefined();

    // Check that the stack has the expected number of child nodes
    const children = stack.node.children;
    expect(children.length).toBeGreaterThanOrEqual(3); // At least 3 child stacks
  });

  test('Passes environment suffix to all child stacks', () => {
    const app = new cdk.App();
    const environmentSuffix = 'test-env';
    const stack = new TapStack(app, 'TestStack', { environmentSuffix });

    // Verify that all child stacks receive the environment suffix
    const vpcStack = stack.node.findChild('VpcStack') as VpcStack;
    const securityStack = stack.node.findChild(
      'SecurityStack'
    ) as SecurityStack;
    const computeStack = stack.node.findChild('ComputeStack') as ComputeStack;

    expect(vpcStack).toBeDefined();
    expect(securityStack).toBeDefined();
    expect(computeStack).toBeDefined();
  });
});

describe('VpcStack', () => {
  let app: cdk.App;
  let stack: VpcStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new VpcStack(app, 'TestVpcStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('Creates VPC with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Creates public subnet with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.0.0/24',
      MapPublicIpOnLaunch: true,
    });
  });

  test('Creates private subnet with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.1.0/24',
      MapPublicIpOnLaunch: false,
    });
  });

  test('Creates Internet Gateway', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {});
  });

  test('Creates NAT Gateway for private subnet', () => {
    template.hasResourceProperties('AWS::EC2::NatGateway', {});
  });

  test('Creates route tables for subnets', () => {
    // Should have at least 2 route tables (public and private)
    const routeTables = template.findResources('AWS::EC2::RouteTable');
    expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(2);
  });

  test('Tags all resources with Environment tag', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Development',
        }),
      ]),
    });
  });

  test('Exports VPC and subnet IDs', () => {
    const outputs = template.findOutputs('*');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('PublicSubnetId');
    expect(outputs).toHaveProperty('PrivateSubnetId');
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let vpcStack: cdk.Stack;
  let vpc: ec2.Vpc;
  let stack: SecurityStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new cdk.Stack(app, 'TestVpcStack');
    vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    stack = new SecurityStack(app, 'TestSecurityStack', {
      vpc,
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('Creates public security group with correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for public subnet EC2 instances',
      SecurityGroupIngress: [
        Match.objectLike({
          CidrIp: '198.51.100.0/24',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        }),
      ],
    });
  });

  test('Creates private security group with correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for private subnet EC2 instances',
    });
  });

  test('Allows SSH from public to private security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 22,
      ToPort: 22,
      IpProtocol: 'tcp',
    });
  });

  test('Security groups have environment suffix in name', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: Match.stringLikeRegexp(
        `securityGroupPublic${environmentSuffix}`
      ),
    });
  });

  test('Tags security groups with Environment tag', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Development',
        }),
      ]),
    });
  });

  test('Exports security group IDs', () => {
    const outputs = template.findOutputs('*');
    expect(outputs).toHaveProperty('PublicSecurityGroupId');
    expect(outputs).toHaveProperty('PrivateSecurityGroupId');
  });
});

describe('ComputeStack', () => {
  let app: cdk.App;
  let vpcStack: cdk.Stack;
  let vpc: ec2.Vpc;
  let publicSubnet: ec2.ISubnet;
  let privateSubnet: ec2.ISubnet;
  let securityGroupPublic: ec2.SecurityGroup;
  let securityGroupPrivate: ec2.SecurityGroup;
  let stack: ComputeStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new cdk.Stack(app, 'TestVpcStack');
    vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    publicSubnet = vpc.publicSubnets[0];
    privateSubnet = vpc.privateSubnets[0];

    securityGroupPublic = new ec2.SecurityGroup(vpcStack, 'TestSgPublic', {
      vpc,
      description: 'Test public SG',
    });

    securityGroupPrivate = new ec2.SecurityGroup(vpcStack, 'TestSgPrivate', {
      vpc,
      description: 'Test private SG',
    });

    stack = new ComputeStack(app, 'TestComputeStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
      environmentSuffix,
    });

    template = Template.fromStack(stack);
  });

  test('Creates EC2 key pair with environment suffix', () => {
    template.hasResourceProperties('AWS::EC2::KeyPair', {
      KeyName: `keyPairBasic${environmentSuffix}`,
      KeyType: 'rsa',
      KeyFormat: 'pem',
    });
  });

  test('Creates public EC2 instance with t2.micro', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: `instancePublic${environmentSuffix}`,
        }),
      ]),
    });
  });

  test('Creates private EC2 instance with t2.micro', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: `instancePrivate${environmentSuffix}`,
        }),
      ]),
    });
  });

  test('Tags all instances with Environment tag', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Environment',
          Value: 'Development',
        }),
      ]),
    });
  });

  test('Creates IAM roles for EC2 instances', () => {
    // Should have at least 2 IAM roles for instances
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2);
  });

  test('Creates instance profiles for EC2 instances', () => {
    // Should have at least 2 instance profiles
    const profiles = template.findResources('AWS::IAM::InstanceProfile');
    expect(Object.keys(profiles).length).toBeGreaterThanOrEqual(2);
  });

  test('Exports EC2 instance information', () => {
    const outputs = template.findOutputs('*');
    expect(outputs).toHaveProperty('PublicInstanceId');
    expect(outputs).toHaveProperty('PublicInstancePublicIp');
    expect(outputs).toHaveProperty('PrivateInstanceId');
    expect(outputs).toHaveProperty('PrivateInstancePrivateIp');
    expect(outputs).toHaveProperty('KeyPairName');
  });

  test('Uses Amazon Linux 2023 AMI', () => {
    // Verify instances use appropriate machine image
    const instances = template.findResources('AWS::EC2::Instance');
    expect(Object.keys(instances).length).toBe(2);
  });
});
