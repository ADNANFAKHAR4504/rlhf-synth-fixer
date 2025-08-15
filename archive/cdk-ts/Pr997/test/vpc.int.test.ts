import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebVpc } from '../lib/constructs/vpc';

describe('WebVpc Integration', () => {
  it('creates a VPC with correct properties', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpcConstruct = new WebVpc(stack, 'WebVpc', { stage: 'int' });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    // Check for tags
    const vpcResources = template.findResources('AWS::EC2::VPC');
    const vpc = Object.values(vpcResources)[0];
    expect(vpc.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Stage', Value: 'int' }),
      ])
    );
  });
});
