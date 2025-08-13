import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebSecurityGroups } from '../lib/constructs/security-groups';
import { WebVpc } from '../lib/constructs/vpc';

describe('WebSecurityGroups Integration', () => {
  it('creates security groups in the VPC', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new WebVpc(stack, 'WebVpc', { stage: 'int' }).vpc;
    new WebSecurityGroups(stack, 'WebSecurityGroups', { vpc, stage: 'int' });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
  });
});
