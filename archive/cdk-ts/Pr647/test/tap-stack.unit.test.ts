import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { CdkVpcStack } from '../lib/cdk-vpc-stack';
import { CdkComputeStack } from '../lib/cdk-compute-stack';
import { CdkServiceNetworkConstruct } from '../lib/cdk-constructs';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Main Stack', () => {
    test('creates nested stacks with correct naming', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 2);

      // Nested stacks exist with proper references
      const resources = template.toJSON().Resources;
      const nestedStacks = Object.entries(resources).filter(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::CloudFormation::Stack'
      );
      expect(nestedStacks).toHaveLength(2);
    });

    test('creates VPC Lattice service network', () => {
      template.resourceCountIs('AWS::VpcLattice::ServiceNetwork', 1);
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'cdk-service-network-test',
        AuthType: 'AWS_IAM',
      });
    });

    test('creates VPC Lattice association', () => {
      template.resourceCountIs(
        'AWS::VpcLattice::ServiceNetworkVpcAssociation',
        1
      );
    });

    test('applies environment tags to all resources', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties?.Tags) {
          expect(resource.Properties.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ Key: 'Environment', Value: 'test' }),
            ])
          );
        }
      });
    });
  });
});

describe('CdkVpcStack', () => {
  let app: cdk.App;
  let vpcStack: CdkVpcStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const parentStack = new cdk.Stack(app, 'ParentStack');
    vpcStack = new CdkVpcStack(parentStack, 'TestVpcStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(vpcStack);
  });

  test('creates VPC with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Name', Value: 'cdk-vpc-test' }),
      ]),
    });
  });

  test('creates exactly 2 public subnets', () => {
    const subnets = template.findResources('AWS::EC2::Subnet', {
      Properties: {
        MapPublicIpOnLaunch: true,
      },
    });
    expect(Object.keys(subnets).length).toBe(2);
  });

  test('creates exactly 2 private subnets', () => {
    const subnets = template.findResources('AWS::EC2::Subnet', {
      Properties: {
        MapPublicIpOnLaunch: false,
      },
    });
    expect(Object.keys(subnets).length).toBe(2);
  });

  test('creates NAT gateway', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('creates Internet Gateway', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('creates route tables for all subnets', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 4);
  });

  test('exports VPC outputs', () => {
    template.hasOutput('VpcId', {
      Description: 'VPC ID',
      Export: {
        Name: 'cdk-vpc-id-test',
      },
    });

    template.hasOutput('PrivateSubnetIds', {
      Description: 'Private Subnet IDs',
      Export: {
        Name: 'cdk-private-subnet-ids-test',
      },
    });

    template.hasOutput('PublicSubnetIds', {
      Description: 'Public Subnet IDs',
      Export: {
        Name: 'cdk-public-subnet-ids-test',
      },
    });
  });
});

describe('CdkComputeStack', () => {
  let app: cdk.App;
  let computeStack: CdkComputeStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const parentStack = new cdk.Stack(app, 'ParentStack');
    const vpcStack = new CdkVpcStack(parentStack, 'VpcStack', {
      environmentSuffix: 'test',
    });

    computeStack = new CdkComputeStack(parentStack, 'TestComputeStack', {
      vpc: vpcStack.vpc,
      environmentSuffix: 'test',
    });
    template = Template.fromStack(computeStack);
  });

  test('creates ALB security group with correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'cdk-alb-sg-test',
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

  test('creates EC2 security group with restricted SSH access', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'cdk-ec2-sg-test',
      GroupDescription: 'Security group for EC2 instances',
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '10.0.0.0/8',
        }),
      ]),
    });
  });

  test('creates IAM role for EC2 instances', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'cdk-ec2-role-test',
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

  test('creates launch template with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateName: 'cdk-launch-template-test',
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.micro',
        MetadataOptions: Match.objectLike({
          HttpTokens: 'required',
        }),
      }),
    });
  });

  test('creates Auto Scaling Group with correct capacity', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      AutoScalingGroupName: 'cdk-asg-test',
      MinSize: '1',
      MaxSize: '6',
      DesiredCapacity: '2',
    });
  });

  test('creates Application Load Balancer', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Name: 'cdk-alb-test',
        Type: 'application',
        Scheme: 'internet-facing',
      }
    );
  });

  test('creates target group with health checks', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'cdk-tg-test',
      Port: 80,
      Protocol: 'HTTP',
      TargetType: 'instance',
      HealthCheckEnabled: true,
      HealthCheckPath: '/',
      HealthCheckProtocol: 'HTTP',
    });
  });

  test('creates ALB listener on port 80', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('creates CPU scaling policy', () => {
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      PolicyType: 'TargetTrackingScaling',
      TargetTrackingConfiguration: Match.objectLike({
        PredefinedMetricSpecification: Match.objectLike({
          PredefinedMetricType: 'ASGAverageCPUUtilization',
        }),
        TargetValue: 70,
      }),
    });
  });

  test('exports load balancer DNS', () => {
    template.hasOutput('LoadBalancerDNS', {
      Description: 'Load Balancer DNS Name',
      Export: {
        Name: 'cdk-alb-dns-test',
      },
    });
  });

  test('exports Auto Scaling Group ARN', () => {
    template.hasOutput('AutoScalingGroupArn', {
      Description: 'Auto Scaling Group ARN',
      Export: {
        Name: 'cdk-asg-arn-test',
      },
    });
  });
});

describe('CdkServiceNetworkConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    const vpcStack = new CdkVpcStack(stack, 'VpcStack', {
      environmentSuffix: 'test',
    });

    new CdkServiceNetworkConstruct(stack, 'TestServiceNetwork', {
      vpc: vpcStack.vpc,
      environmentSuffix: 'test',
    });

    template = Template.fromStack(stack);
  });

  test('creates VPC Lattice service network', () => {
    template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
      Name: 'cdk-service-network-test',
      AuthType: 'AWS_IAM',
    });
  });

  test('creates VPC association', () => {
    template.hasResourceProperties(
      'AWS::VpcLattice::ServiceNetworkVpcAssociation',
      {
        ServiceNetworkIdentifier: Match.anyValue(),
        VpcIdentifier: Match.anyValue(),
      }
    );
  });

  test('applies tags to service network', () => {
    const resources = template.findResources('AWS::VpcLattice::ServiceNetwork');
    Object.values(resources).forEach((resource: any) => {
      expect(resource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: 'cdk-service-network-test',
          }),
          expect.objectContaining({ Key: 'Environment', Value: 'test' }),
        ])
      );
    });
  });
});

describe('Resource Naming Convention', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('all named resources use cdk- prefix', () => {
    const resources = template.toJSON().Resources;

    Object.values(resources).forEach((resource: any) => {
      // Check common name properties
      const nameProps = [
        'Name',
        'GroupName',
        'RoleName',
        'LoadBalancerName',
        'TargetGroupName',
        'AutoScalingGroupName',
        'LaunchTemplateName',
        'VpcName',
      ];

      nameProps.forEach(prop => {
        if (
          resource.Properties?.[prop] &&
          typeof resource.Properties[prop] === 'string'
        ) {
          expect(resource.Properties[prop]).toMatch(/^cdk-/);
        }
      });

      // Check Name tag
      if (resource.Properties?.Tags) {
        const nameTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Name'
        );
        if (nameTag) {
          expect(nameTag.Value).toMatch(/^cdk-/);
        }
      }
    });
  });
});

describe('Environment Suffix', () => {
  test('uses provided environment suffix', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'prod',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
      Name: 'cdk-service-network-prod',
    });
  });

  test('uses context environment suffix when not provided in props', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'staging',
      },
    });
    const stack = new TapStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
      Name: 'cdk-service-network-staging',
    });
  });

  test('defaults to dev when no suffix provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
      Name: 'cdk-service-network-dev',
    });
  });
});
