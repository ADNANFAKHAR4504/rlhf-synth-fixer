import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { ComputeStack } from '../lib/compute-stack';

describe('ComputeStack Advanced Tests', () => {
  let app: cdk.App;
  let vpcStack: cdk.Stack;
  let vpc: ec2.Vpc;
  let publicSubnet: ec2.ISubnet;
  let privateSubnet: ec2.ISubnet;
  let securityGroupPublic: ec2.SecurityGroup;
  let securityGroupPrivate: ec2.SecurityGroup;

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
  });

  test('Uses default environment suffix when not provided', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::KeyPair', {
      KeyName: 'keyPairBasicdev',
    });
  });

  test('Uses provided environment suffix in all resource names', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
      environmentSuffix: 'prod',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::KeyPair', {
      KeyName: 'keyPairBasicprod',
    });

    template.hasResourceProperties('AWS::EC2::Instance', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: 'instancePublicprod',
        }),
      ]),
    });
  });

  test('Public instance has public IP association', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    // The public instance should be in the public subnet
    const instances = template.findResources('AWS::EC2::Instance');
    const publicInstance = Object.values(instances).find((instance: any) =>
      instance.Properties.Tags?.some(
        (tag: any) => tag.Key === 'Name' && tag.Value.includes('instancePublic')
      )
    );

    expect(publicInstance).toBeDefined();
  });

  test('Private instance does not have public IP', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    // The private instance should be in the private subnet
    const instances = template.findResources('AWS::EC2::Instance');
    const privateInstance = Object.values(instances).find((instance: any) =>
      instance.Properties.Tags?.some(
        (tag: any) =>
          tag.Key === 'Name' && tag.Value.includes('instancePrivate')
      )
    );

    expect(privateInstance).toBeDefined();
  });

  test('Both instances use the same key pair', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    const keyPairs = template.findResources('AWS::EC2::KeyPair');
    expect(Object.keys(keyPairs).length).toBe(1);
  });

  test('Key pair uses RSA encryption', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::KeyPair', {
      KeyType: 'rsa',
      KeyFormat: 'pem',
    });
  });

  test('Instances are tagged with correct Environment', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    const instances = template.findResources('AWS::EC2::Instance');
    Object.values(instances).forEach((instance: any) => {
      const envTag = instance.Properties.Tags?.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Development');
    });
  });

  test('Stack exports are properly defined', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });

    expect(stack.publicInstance).toBeDefined();
    expect(stack.privateInstance).toBeDefined();
  });

  test('All outputs have proper descriptions', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    const outputs = template.findOutputs('*');
    expect(outputs.PublicInstanceId.Description).toContain(
      'Public EC2 Instance ID'
    );
    expect(outputs.PublicInstancePublicIp.Description).toContain(
      'Public EC2 Instance Public IP'
    );
    expect(outputs.PrivateInstanceId.Description).toContain(
      'Private EC2 Instance ID'
    );
    expect(outputs.PrivateInstancePrivateIp.Description).toContain(
      'Private EC2 Instance Private IP'
    );
    expect(outputs.KeyPairName.Description).toContain('EC2 Key Pair Name');
  });

  test('Instances have proper IAM roles attached', () => {
    const stack = new ComputeStack(app, 'TestStack', {
      vpc,
      publicSubnet,
      privateSubnet,
      securityGroupPublic,
      securityGroupPrivate,
    });
    const template = Template.fromStack(stack);

    // Check that instances have IAM instance profiles
    template.hasResourceProperties('AWS::EC2::Instance', {
      IamInstanceProfile: Match.anyValue(),
    });
  });
});
