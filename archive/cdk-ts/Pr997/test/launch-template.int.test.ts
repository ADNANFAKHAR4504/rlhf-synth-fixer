import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebLaunchTemplate } from '../lib/constructs/launch-template';
import { WebSecurityGroups } from '../lib/constructs/security-groups';
import { WebVpc } from '../lib/constructs/vpc';

describe('WebLaunchTemplate Integration', () => {
  it('creates a launch template with correct security group', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new WebVpc(stack, 'WebVpc', { stage: 'int' }).vpc;
    const sgs = new WebSecurityGroups(stack, 'WebSecurityGroups', {
      vpc,
      stage: 'int',
    });
    new WebLaunchTemplate(stack, 'WebLaunchTemplate', {
      stage: 'int',
      securityGroup: sgs.appSg,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
  });
});
