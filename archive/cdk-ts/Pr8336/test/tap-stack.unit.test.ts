import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Security Group is created for SSH access', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for SSH access from specific IP range',
    });
  });

  test('SSH ingress rule is configured correctly', () => {
    // Security group ingress rules are embedded in the security group, not separate resources
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '203.0.113.0/24',
          Description: 'Allow SSH access from specific IP range 203.0.113.0/24',
          FromPort: 22,
          IpProtocol: 'tcp',
          ToPort: 22,
        },
      ],
    });
  });

  test('Key Pair is created', () => {
    template.hasResourceProperties('AWS::EC2::KeyPair', {
      KeyType: 'rsa',
    });
  });

  test('Two EC2 instances are created', () => {
    template.resourceCountIs('AWS::EC2::Instance', 2);
  });

  test('Public EC2 instance is configured correctly', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
    });

    // Verify at least one instance has Environment tag
    const instances = template.findResources('AWS::EC2::Instance');
    const instanceTags = Object.values(instances)[0].Properties.Tags;
    const hasEnvironmentTag = instanceTags.some(
      (tag: any) => tag.Key === 'Environment' && tag.Value === 'Development'
    );
    expect(hasEnvironmentTag).toBe(true);
  });

  test('Stack outputs are defined', () => {
    // Check for key outputs
    const outputs = Object.keys(template.toJSON().Outputs || {});
    expect(outputs).toContain('VpcId');
    expect(outputs).toContain('VpcCidr');
    expect(outputs).toContain('PublicSubnetIds');
    expect(outputs).toContain('PrivateSubnetIds');
    expect(outputs).toContain('SecurityGroupId');
    expect(outputs).toContain('KeyPairName');
  });

  test('Environment tag is applied to VPC', () => {
    // Verify VPC has Environment tag (among potentially other tags)
    const vpcResources = template.findResources('AWS::EC2::VPC');
    const vpcTags = Object.values(vpcResources)[0].Properties.Tags;
    const hasEnvironmentTag = vpcTags.some(
      (tag: any) => tag.Key === 'Environment' && tag.Value === 'Development'
    );
    expect(hasEnvironmentTag).toBe(true);
  });

  test('LocalStack detection works correctly', () => {
    // Test with LocalStack environment
    const localStackApp = new cdk.App();
    process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
    const localStackStack = new TapStack(localStackApp, 'LocalStackStack', {
      env: { account: '000000000000', region: 'us-east-1' },
    });
    const localStackTemplate = Template.fromStack(localStackStack);

    // Verify NAT Gateway is not created for LocalStack
    localStackTemplate.resourceCountIs('AWS::EC2::NatGateway', 0);

    // Clean up
    delete process.env.AWS_ENDPOINT_URL;
  });

  test('Public subnets are created', () => {
    template.resourcePropertiesCountIs(
      'AWS::EC2::Subnet',
      {
        MapPublicIpOnLaunch: true,
      },
      2
    );
  });

  test('Internet Gateway is created and attached', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('NAT Gateway output is set correctly', () => {
    // For non-LocalStack, NAT Gateway should be created
    const outputs = template.toJSON().Outputs;
    expect(outputs.NatGatewayIds).toBeDefined();
    expect(outputs.NatGatewayIds.Description).toContain('NAT Gateway');
  });

  test('Stack with custom environment suffix', () => {
    const customApp = new cdk.App();
    const customStack = new TapStack(customApp, 'CustomStack', {
      environmentSuffix: 'prod',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const customTemplate = Template.fromStack(customStack);

    // Verify outputs use the custom suffix
    const outputs = customTemplate.toJSON().Outputs;
    expect(outputs.EnvironmentSuffix.Value).toBe('prod');
  });

  test('NAT Gateway handling in non-LocalStack environment', () => {
    // Ensure we're in non-LocalStack mode
    delete process.env.AWS_ENDPOINT_URL;

    const nonLocalApp = new cdk.App();
    const nonLocalStack = new TapStack(nonLocalApp, 'NonLocalStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const nonLocalTemplate = Template.fromStack(nonLocalStack);

    // Verify NAT Gateway is created in non-LocalStack
    nonLocalTemplate.resourceCountIs('AWS::EC2::NatGateway', 1);

    // Verify NAT Gateway output exists
    const outputs = nonLocalTemplate.toJSON().Outputs;
    expect(outputs.NatGatewayIds).toBeDefined();
    expect(outputs.NatGatewayIds.Description).toContain('NAT Gateway');
  });
});
