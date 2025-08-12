import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack Advanced Tests', () => {
  test('Uses default environment suffix when not provided', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    // Should use 'dev' as default
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: 'vpcBasicdev',
        }),
      ]),
    });
  });

  test('Uses provided environment suffix in resource names', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack', {
      environmentSuffix: 'production',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: 'vpcBasicproduction',
        }),
      ]),
    });
  });

  test('VPC has DNS support and hostnames enabled', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Creates correct number of subnets', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    const subnets = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(subnets).length).toBe(2); // One public, one private
  });

  test('Public subnet has correct route to Internet Gateway', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: Match.anyValue(),
    });
  });

  test('Private subnet has route to NAT Gateway', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: Match.anyValue(),
    });
  });

  test('VPC CIDR block is correctly set', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });

  test('Subnets are associated with correct route tables', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    const associations = template.findResources(
      'AWS::EC2::SubnetRouteTableAssociation'
    );
    expect(Object.keys(associations).length).toBeGreaterThanOrEqual(2);
  });

  test('Internet Gateway is attached to VPC', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
      VpcId: Match.anyValue(),
      InternetGatewayId: Match.anyValue(),
    });
  });

  test('All outputs have descriptions', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'TestStack');
    const template = Template.fromStack(stack);

    const outputs = template.findOutputs('*');
    expect(outputs.VpcId.Description).toBeDefined();
    expect(outputs.PublicSubnetId.Description).toBeDefined();
    expect(outputs.PrivateSubnetId.Description).toBeDefined();
  });
});
