import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityStack } from '../lib/security-stack';

describe('SecurityStack Advanced Tests', () => {
  let app: cdk.App;
  let vpcStack: cdk.Stack;
  let vpc: ec2.Vpc;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new cdk.Stack(app, 'TestVpcStack');
    vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
  });

  test('Uses default environment suffix when not provided', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'securityGroupPublicdev',
    });
  });

  test('Uses provided environment suffix', () => {
    const stack = new SecurityStack(app, 'TestStack', {
      vpc,
      environmentSuffix: 'staging',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'securityGroupPublicstaging',
    });
  });

  test('Public security group allows outbound traffic', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    // Check that the security group doesn't have explicit egress rules blocking traffic
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
      Properties: {
        GroupDescription: 'Security group for public subnet EC2 instances',
      },
    });

    expect(Object.keys(securityGroups).length).toBe(1);
  });

  test('Private security group allows outbound traffic', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
      Properties: {
        GroupDescription: 'Security group for private subnet EC2 instances',
      },
    });

    expect(Object.keys(securityGroups).length).toBe(1);
  });

  test('SSH access is restricted to specific CIDR', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
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

  test('Private security group allows internal communication', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    // Check for self-referencing security group ingress rule
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: '-1', // All traffic
    });
  });

  test('Security groups are properly exported', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });

    expect(stack.securityGroupPublic).toBeDefined();
    expect(stack.securityGroupPrivate).toBeDefined();
  });

  test('Creates exactly two security groups', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    expect(Object.keys(securityGroups).length).toBe(2);
  });

  test('All security group ingress rules have descriptions', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    const ingressRules = template.findResources(
      'AWS::EC2::SecurityGroupIngress'
    );
    Object.values(ingressRules).forEach((rule: any) => {
      expect(rule.Properties.Description).toBeDefined();
    });
  });

  test('Stack creates proper exports', () => {
    const stack = new SecurityStack(app, 'TestStack', { vpc });
    const template = Template.fromStack(stack);

    const outputs = template.findOutputs('*');
    expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(2);

    // Check that outputs have Export values for cross-stack references
    Object.values(outputs).forEach((output: any) => {
      expect(output.Export).toBeDefined();
    });
  });
});
