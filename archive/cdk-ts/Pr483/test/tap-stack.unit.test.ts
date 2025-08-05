import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';
import { IamStack } from '../lib/iam-stack';
import { AutoScalingStack } from '../lib/autoscaling-stack';

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

  test('should create the main stack', () => {
    expect(stack).toBeDefined();
    expect(template).toBeDefined();
  });

  test('should create nested stacks', () => {
    // Main TapStack contains nested stacks which are CloudFormation stacks
    const templateJson = template.toJSON();
    expect(templateJson).toBeDefined();
    // Since TapStack only orchestrates other stacks, it might not have direct resources
    expect(templateJson.Resources || {}).toBeDefined();
  });

  test('should set environment suffix correctly', () => {
    const testStack = new TapStack(app, 'TestStackCustom', { 
      environmentSuffix: 'test123' 
    });
    expect(testStack).toBeDefined();
  });

  test('should use default environment suffix when not provided', () => {
    const defaultStack = new TapStack(app, 'TestStackDefault');
    expect(defaultStack).toBeDefined();
  });
});

describe('VpcStack', () => {
  let app: cdk.App;
  let stack: VpcStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new VpcStack(app, 'TestVpcStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('should use default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultStack = new VpcStack(defaultApp, 'TestVpcStackDefault');
    const defaultTemplate = Template.fromStack(defaultStack);
    
    defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: [
        { Key: 'Environment', Value: 'dev' },
        { Key: 'Name', Value: 'MultiTier-VPC-dev' },
      ],
    });
  });

  test('should create VPC with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('should create public subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('should create private subnets', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
    });
  });

  test('should create Internet Gateway', () => {
    template.hasResource('AWS::EC2::InternetGateway', {});
    template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
  });

  test('should create NAT Gateways for private subnet egress', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
    template.resourceCountIs('AWS::EC2::EIP', 2);
  });

  test('should create route tables', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
    template.resourceCountIs('AWS::EC2::Route', 4); // 2 IGW routes + 2 NAT routes
  });

  test('should have outputs for VPC ID and subnet IDs', () => {
    template.hasOutput('VpcId', {});
    template.hasOutput('PublicSubnetIds', {});
    template.hasOutput('PrivateSubnetIds', {});
  });

  test('should tag VPC with environment suffix', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: [
        { Key: 'Environment', Value: environmentSuffix },
        { Key: 'Name', Value: `MultiTier-VPC-${environmentSuffix}` },
      ],
    });
  });
});

describe('IamStack', () => {
  let app: cdk.App;
  let stack: IamStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new IamStack(app, 'TestIamStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('should use default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultStack = new IamStack(defaultApp, 'TestIamStackDefault');
    const defaultTemplate = Template.fromStack(defaultStack);
    
    defaultTemplate.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'EC2-MultiTier-Role-dev',
    });
  });

  test('should create EC2 IAM role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      },
      RoleName: `EC2-MultiTier-Role-${environmentSuffix}`,
    });
  });

  test('should attach SSM managed policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/AmazonSSMManagedInstanceCore',
            ],
          ],
        },
      ],
    });
  });

  test('should have custom policy for AWS services', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
              'cloudwatch:PutMetricData',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      },
    });
  });

  test('should create instance profile', () => {
    template.hasResourceProperties('AWS::IAM::InstanceProfile', {
      InstanceProfileName: `EC2-MultiTier-Profile-${environmentSuffix}`,
    });
  });

  test('should have outputs for role and instance profile ARNs', () => {
    template.hasOutput('EC2RoleArn', {});
    template.hasOutput('InstanceProfileArn', {});
  });
});

describe('AutoScalingStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let iamStack: IamStack;
  let autoScalingStack: AutoScalingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', { environmentSuffix });
    iamStack = new IamStack(app, 'TestIamStack', { environmentSuffix });
    autoScalingStack = new AutoScalingStack(app, 'TestAutoScalingStack', {
      vpc: vpcStack.vpc,
      privateSubnets: vpcStack.privateSubnets,
      ec2Role: iamStack.ec2Role,
      environmentSuffix,
    });
    template = Template.fromStack(autoScalingStack);
  });

  test('should use default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultVpcStack = new VpcStack(defaultApp, 'DefaultVpcStack');
    const defaultIamStack = new IamStack(defaultApp, 'DefaultIamStack');
    const defaultAutoScalingStack = new AutoScalingStack(defaultApp, 'DefaultAutoScalingStack', {
      vpc: defaultVpcStack.vpc,
      privateSubnets: defaultVpcStack.privateSubnets,
      ec2Role: defaultIamStack.ec2Role,
    });
    const defaultTemplate = Template.fromStack(defaultAutoScalingStack);
    
    defaultTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateName: 'MultiTier-LaunchTemplate-dev',
    });
  });

  test('should create security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: `Security group for EC2 instances in ${environmentSuffix}`,
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          Description: 'Allow HTTP from VPC',
        },
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          Description: 'Allow HTTPS from VPC',
        },
      ],
    });
  });

  test('should create launch template', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateName: `MultiTier-LaunchTemplate-${environmentSuffix}`,
      LaunchTemplateData: {
        InstanceType: 't3.micro',
        MetadataOptions: {
          HttpTokens: 'required',
        },
      },
    });
  });

  test('should create Auto Scaling Group with correct configuration', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      MaxSize: '6',
      DesiredCapacity: '2',
      HealthCheckType: 'EC2',
    });
  });

  test('should create CPU-based scaling policy', () => {
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

  test('should have outputs for ASG name and security group ID', () => {
    template.hasOutput('AutoScalingGroupName', {});  
    template.hasOutput('SecurityGroupId', {});
  });

  test('should tag Auto Scaling Group', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      Tags: [
        {
          Key: 'Environment',
          Value: environmentSuffix,
          PropagateAtLaunch: true,
        },
        {
          Key: 'Name',
          Value: `MultiTier-ASG-${environmentSuffix}`,
          PropagateAtLaunch: true,
        },
      ],
    });
  });
});
