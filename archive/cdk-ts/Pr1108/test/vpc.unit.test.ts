import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AppVpc } from '../lib/constructs/vpc';

describe('AppVpc', () => {
  it('creates a VPC with two isolated subnets and correct name', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new AppVpc(stack, 'AppVpc', 'test-vpc');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: [{ Key: 'Name', Value: 'test-vpc' }],
    });
    template.resourceCountIs('AWS::EC2::Subnet', 4);
    const subnets = template.findResources('AWS::EC2::Subnet');
    Object.values(subnets).forEach((subnet: any) => {
      expect(typeof subnet.Properties.CidrBlock).toBe('string');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });

  it('throws if VPC name is missing', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    expect(() => {
      // @ts-expect-error
      new AppVpc(stack, 'AppVpc');
    }).toThrow();
  });

  it('creates VPC with custom subnet configuration', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new AppVpc(stack, 'AppVpc', 'custom-vpc');
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::Subnet', 4);
    // Check that subnets exist and are private
    const subnets = template.findResources('AWS::EC2::Subnet');
    Object.values(subnets).forEach((subnet: any) => {
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });
});
