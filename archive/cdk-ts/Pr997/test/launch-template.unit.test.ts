import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebLaunchTemplate } from '../lib/constructs/launch-template';

describe('WebLaunchTemplate', () => {
  it('creates a launch template with correct config', () => {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const sg = new ec2.SecurityGroup(stack, 'SG', { vpc });
    new WebLaunchTemplate(stack, 'LT', { stage: 'baz', securityGroup: sg });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
    // Find the actual LaunchTemplateName and assert it contains the stage
    const resources = template.findResources('AWS::EC2::LaunchTemplate');
    const launchTemplate = Object.values(resources)[0];
    expect(launchTemplate.Properties.LaunchTemplateName).toContain('baz');
  });
});
