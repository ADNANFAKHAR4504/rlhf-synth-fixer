import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebAlb } from '../lib/constructs/alb';
import { WebAsg } from '../lib/constructs/asg';
import { WebLaunchTemplate } from '../lib/constructs/launch-template';
import { WebSecurityGroups } from '../lib/constructs/security-groups';
import { WebVpc } from '../lib/constructs/vpc';

describe('WebAlb Integration', () => {
  it('creates an ALB and HTTP listener, connected to the ASG', () => {
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
    const asg = new WebAsg(stack, 'WebAsg', {
      vpc,
      launchTemplate: lt,
    }).asg;
    new WebAlb(stack, 'WebAlb', {
      vpc,
      albSecurityGroup: sgs.albSg,
      appAsg: asg,
      stage: 'int',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
  });
});
