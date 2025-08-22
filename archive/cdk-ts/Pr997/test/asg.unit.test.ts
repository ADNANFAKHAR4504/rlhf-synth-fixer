import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebAsg } from '../lib/constructs/asg';
import { WebLaunchTemplate } from '../lib/constructs/launch-template';

describe('WebAsg', () => {
  it('creates an AutoScalingGroup with correct config', () => {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const sg = new ec2.SecurityGroup(stack, 'SG', { vpc });
    const lt = new WebLaunchTemplate(stack, 'LT', {
      stage: 'baz',
      securityGroup: sg,
    });
    new WebAsg(stack, 'ASG', { vpc, launchTemplate: lt.lt });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
  });
});
