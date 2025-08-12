import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebAlb } from '../lib/constructs/alb';
import { WebAsg } from '../lib/constructs/asg';
import { WebLaunchTemplate } from '../lib/constructs/launch-template';

describe('WebAlb', () => {
  it('creates an ALB with HTTP and HTTPS listeners and correct targets', () => {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const albSg = new ec2.SecurityGroup(stack, 'AlbSg', { vpc });
    const appSg = new ec2.SecurityGroup(stack, 'AppSg', { vpc });
    const lt = new WebLaunchTemplate(stack, 'LT', {
      stage: 'baz',
      securityGroup: appSg,
    });
    const asg = new WebAsg(stack, 'ASG', { vpc, launchTemplate: lt.lt });
    const certArn = 'arn:aws:acm:us-east-1:123456789012:certificate/abc123';
    new WebAlb(stack, 'ALB', {
      vpc,
      albSecurityGroup: albSg,
      appAsg: asg.asg,
      stage: 'baz',
      certificateArn: certArn,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
  });
});
