import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebAsg } from '../lib/constructs/asg';
import { WebLaunchTemplate } from '../lib/constructs/launch-template';
import { WebSecurityGroups } from '../lib/constructs/security-groups';
import { WebVpc } from '../lib/constructs/vpc';

describe('WebAsg Integration', () => {
  it('creates an Auto Scaling Group using the launch template', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new WebVpc(stack, 'WebVpc', { stage: 'int' }).vpc;
    const sgs = new WebSecurityGroups(stack, 'WebSecurityGroups', {
      vpc,
      stage: 'int',
    });
    const lt = new WebLaunchTemplate(stack, 'WebLaunchTemplate', {
      stage: 'int',
      securityGroup: sgs.appSg,
    }).lt;
    new WebAsg(stack, 'WebAsg', { vpc, launchTemplate: lt });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
  });
});
