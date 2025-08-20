import { Testing } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Environment Stack - Integration Tests', () => {
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

  // FIX: Pass the config in the correct { environments: [...] } structure.
  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', {
      environments: testEnvironments,
    })
  );
  const resources = JSON.parse(synthesized).resource || {};
  const outputs = JSON.parse(synthesized).output || {};

  it('should define distinct outputs for each environment', () => {
    expect(outputs['AlbDnsName-dev']).toBeDefined();
    expect(outputs['RdsEndpoint-dev']).toBeDefined();
    expect(outputs['AlbDnsName-prod']).toBeDefined();
    expect(outputs['RdsEndpoint-prod']).toBeDefined();
  });

  it('should associate the PROD ASG with the PROD private subnets', () => {
    const asg = (Object.values(resources.aws_autoscaling_group) as any[]).find(
      a => a.name === 'asg-prod'
    );
    expect(asg).toBeDefined();
    expect(asg.vpc_zone_identifier).toHaveLength(2);
    expect(asg.vpc_zone_identifier[0]).toMatch(
      /\${aws_subnet.PrivateSubnetA-prod.*.id}/
    );
    expect(asg.vpc_zone_identifier[1]).toMatch(
      /\${aws_subnet.PrivateSubnetB-prod.*.id}/
    );
  });

  it('should associate the DEV ALB with the DEV public subnets', () => {
    const alb = (Object.values(resources.aws_lb) as any[]).find(
      l => l.name === 'alb-dev'
    );
    expect(alb).toBeDefined();
    expect(alb.subnets).toHaveLength(2);
    expect(alb.subnets[0]).toMatch(/\${aws_subnet.PublicSubnetA-dev.*.id}/);
    expect(alb.subnets[1]).toMatch(/\${aws_subnet.PublicSubnetB-dev.*.id}/);
  });

  it('should associate the DEV Network ACL with all DEV subnets', () => {
    const nacl = (Object.values(resources.aws_network_acl) as any[]).find(
      n => n.tags.Name === 'nacl-dev'
    );
    expect(nacl).toBeDefined();
    expect(nacl.subnet_ids).toHaveLength(4);
    expect(nacl.subnet_ids).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\${aws_subnet.PublicSubnetA-dev.*.id}/),
        expect.stringMatching(/\${aws_subnet.PublicSubnetB-dev.*.id}/),
        expect.stringMatching(/\${aws_subnet.PrivateSubnetA-dev.*.id}/),
        expect.stringMatching(/\${aws_subnet.PrivateSubnetB-dev.*.id}/),
      ])
    );
  });
});
