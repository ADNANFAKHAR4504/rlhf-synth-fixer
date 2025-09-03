import { Testing } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Environment Stack - Comprehensive Integration Tests', () => {
  const testEnvironments: TapStackConfig[] = [
    {
      environment: 'dev',
      vpcCidr: '10.10.0.0/16',
      instanceType: 't3.micro',
      dbInstanceClass: 'db.t3.micro',
      tags: {},
    },
    {
      environment: 'prod',
      vpcCidr: '10.30.0.0/16',
      instanceType: 't3.medium',
      dbInstanceClass: 'db.t3.medium',
      tags: {},
    },
  ];

  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', {
      environments: testEnvironments,
    })
  );
  const resources = JSON.parse(synthesized).resource || {};
  const outputs = JSON.parse(synthesized).output || {};

  it('should define distinct DNS and endpoint outputs for each environment', () => {
    expect(outputs['AlbDnsName-dev']).toBeDefined();
    expect(outputs['RdsEndpoint-dev']).toBeDefined();
    expect(outputs['AlbDnsName-prod']).toBeDefined();
    expect(outputs['RdsEndpoint-prod']).toBeDefined();
  });

  it('should associate the PROD ASG with the PROD private subnets and target group', () => {
    const asg = (Object.values(resources.aws_autoscaling_group) as any[]).find(
      a => a.name.startsWith('asg-prod')
    );
    expect(asg).toBeDefined();
    // Check subnet association
    expect(asg.vpc_zone_identifier[0]).toMatch(
      /\${aws_subnet.PrivateSubnetA-prod.*.id}/
    );
    expect(asg.vpc_zone_identifier[1]).toMatch(
      /\${aws_subnet.PrivateSubnetB-prod.*.id}/
    );
    // Check target group association
    expect(asg.target_group_arns[0]).toMatch(
      /\${aws_lb_target_group.TargetGroup-prod.*.arn}/
    );
  });

  it('should associate the DEV ALB with the DEV public subnets and security group', () => {
    const alb = (Object.values(resources.aws_lb) as any[]).find(l =>
      l.name.startsWith('alb-dev')
    );
    expect(alb).toBeDefined();
    // Check subnet association
    expect(alb.subnets[0]).toMatch(/\${aws_subnet.PublicSubnetA-dev.*.id}/);
    expect(alb.subnets[1]).toMatch(/\${aws_subnet.PublicSubnetB-dev.*.id}/);
    // Check security group association
    expect(alb.security_groups[0]).toMatch(
      /\${aws_security_group.AlbSg-dev.*.id}/
    );
  });

  it('should associate the PROD IAM Role with its Policy and Instance Profile', () => {
    // FIX: The 'role' property is an interpolation string like "${aws_iam_role.WebServerRole-prod.name}".
    // We need to check if the string *includes* the logical ID of the role.
    const roleAttachment = (
      Object.values(resources.aws_iam_role_policy_attachment) as any[]
    ).find(att => att.role.includes('WebServerRole-prod'));
    const instanceProfile = (
      Object.values(resources.aws_iam_instance_profile) as any[]
    ).find(ip => ip.name.startsWith('web-server-profile-prod'));

    expect(roleAttachment).toBeDefined();
    expect(instanceProfile).toBeDefined();

    // Check that the policy is attached to the role
    expect(roleAttachment.policy_arn).toMatch(
      /\${aws_iam_policy.WebServerPolicy-prod.*.arn}/
    );
    // Check that the role is attached to the instance profile
    expect(instanceProfile.role).toMatch(
      /\${aws_iam_role.WebServerRole-prod.*.name}/
    );
  });

  it('should configure the DEV LB Listener to forward to the DEV Target Group', () => {
    const listener = (Object.values(resources.aws_lb_listener) as any[]).find(
      l => l.load_balancer_arn.includes('ALB-dev')
    );
    expect(listener).toBeDefined();
    expect(listener.port).toBe(80);
    expect(listener.protocol).toBe('HTTP');

    const defaultAction = listener.default_action[0];
    expect(defaultAction.type).toBe('forward');
    expect(defaultAction.target_group_arn).toMatch(
      /\${aws_lb_target_group.TargetGroup-dev.*.arn}/
    );
  });
});
