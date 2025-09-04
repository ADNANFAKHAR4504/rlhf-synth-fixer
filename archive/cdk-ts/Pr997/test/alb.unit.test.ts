import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebAlb } from '../lib/constructs/alb';
import { WebAsg } from '../lib/constructs/asg';
import { WebLaunchTemplate } from '../lib/constructs/launch-template';

describe('WebAlb', () => {
  it('creates an ALB with only HTTP listener and correct targets', () => {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc');
    const albSg = new ec2.SecurityGroup(stack, 'AlbSg', { vpc });
    const appSg = new ec2.SecurityGroup(stack, 'AppSg', { vpc });
    const lt = new WebLaunchTemplate(stack, 'LT', {
      stage: 'baz',
      securityGroup: appSg,
    });
    const asg = new WebAsg(stack, 'ASG', { vpc, launchTemplate: lt.lt });
    new WebAlb(stack, 'ALB', {
      vpc,
      albSecurityGroup: albSg,
      appAsg: asg.asg,
      stage: 'baz',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    // Check that only HTTP listener exists
    const listeners = template.findResources(
      'AWS::ElasticLoadBalancingV2::Listener'
    );
    const ports = Object.values(listeners).map((l: any) => l.Properties.Port);
    expect(ports).toEqual([80]);
  });

  it('creates an ALB with only HTTP listener when no certificateArn is provided', () => {
    const stack = new cdk.Stack();
    const vpc = new ec2.Vpc(stack, 'Vpc2');
    const albSg = new ec2.SecurityGroup(stack, 'AlbSg2', { vpc });
    const appSg = new ec2.SecurityGroup(stack, 'AppSg2', { vpc });
    const lt = new WebLaunchTemplate(stack, 'LT2', {
      stage: 'foo',
      securityGroup: appSg,
    });
    const asg = new WebAsg(stack, 'ASG2', { vpc, launchTemplate: lt.lt });
    new WebAlb(stack, 'ALB2', {
      vpc,
      albSecurityGroup: albSg,
      appAsg: asg.asg,
      stage: 'foo',
      // certificateArn omitted
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    // Check that only HTTP listener exists
    const listeners = template.findResources(
      'AWS::ElasticLoadBalancingV2::Listener'
    );
    const ports = Object.values(listeners).map((l: any) => l.Properties.Port);
    expect(ports).toEqual([80]);
    // Ensure no HTTPS listener or redirect action exists
    Object.values(listeners).forEach((l: any) => {
      expect(l.Properties.DefaultActions).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Type: 'redirect',
            RedirectConfig: expect.objectContaining({
              Protocol: 'HTTPS',
              Port: '443',
            }),
          }),
        ])
      );
    });
  });
});
