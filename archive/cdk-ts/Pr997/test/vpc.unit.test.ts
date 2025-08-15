import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebVpc } from '../lib/constructs/vpc';

describe('WebVpc', () => {
  it('creates a VPC with correct tags and config', () => {
    const stack = new cdk.Stack();
    new WebVpc(stack, 'TestVpc', { stage: 'foo' });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    // Find the VPC resource and check its tags array
    const resources = template.findResources('AWS::EC2::VPC');
    const vpc = Object.values(resources)[0];
    expect(vpc.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Stage', Value: 'foo' }),
        expect.objectContaining({ Key: 'Component', Value: 'web-vpc' }),
      ])
    );
  });
});
