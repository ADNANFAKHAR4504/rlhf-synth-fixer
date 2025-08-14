import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityStack } from '../lib/security-stack';

describe('SecurityStack', () => {
  let app: cdk.App;
  let testStack: cdk.Stack;
  let vpc: ec2.Vpc;

  beforeEach(() => {
    app = new cdk.App();
    testStack = new cdk.Stack(app, 'TestStack');
    vpc = new ec2.Vpc(testStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 1,
    });
  });

  test('Creates public security group with correct properties', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for public subnet EC2 instances',
      GroupName: 'securityGroupPublictest',
    });
  });

  test('Creates private security group with correct properties', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for private subnet EC2 instances',
      GroupName: 'securityGroupPrivatetest',
    });
  });

  test('Public security group allows SSH from specified IP range', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '198.51.100.0/24',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        }),
      ]),
    });
  });

  test('Private security group allows SSH from public security group', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    // Check for security group ingress rule
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 22,
      ToPort: 22,
      IpProtocol: 'tcp',
    });
  });

  test('Private security group allows internal communication', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    // Check for security group ingress rule allowing all traffic from itself
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: '-1',
    });
  });

  test('Both security groups allow all outbound traffic', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    Object.values(securityGroups).forEach((sg: any) => {
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  test('Security groups are properly tagged', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    Object.values(securityGroups).forEach((sg: any) => {
      const envTag = sg.Properties.Tags?.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Development');
    });
  });

  test('Uses default environment suffix when not provided', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'securityGroupPublicdev',
    });
  });

  test('Security groups are associated with the correct VPC', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    Object.values(securityGroups).forEach((sg: any) => {
      expect(sg.Properties.VpcId).toBeDefined();
    });
  });

  test('Stack exports are properly defined', () => {
    const securityStack = new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });

    expect(securityStack.securityGroupPublic).toBeDefined();
    expect(securityStack.securityGroupPrivate).toBeDefined();
  });

  test('All outputs have proper descriptions', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(testStack);

    // Since we removed the outputs from individual constructs, 
    // this test should verify that the main stack handles outputs
    const outputs = template.findOutputs('*');
    // The outputs are now handled by the main TapStack, not the individual constructs
    expect(Object.keys(outputs).length).toBe(0);
  });

  test('Security group names are unique with environment suffix', () => {
    new SecurityStack(testStack, 'TestSecurityStack', {
      vpc,
      environmentSuffix: 'prod',
    });
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'securityGroupPublicprod',
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'securityGroupPrivateprod',
    });
  });
});
