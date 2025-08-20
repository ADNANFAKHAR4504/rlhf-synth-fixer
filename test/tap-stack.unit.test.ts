import { Testing } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Environment Stack - Unit Tests', () => {
  const testEnvironments: TapStackConfig[] = [
    {
      environment: 'dev',
      vpcCidr: '10.10.0.0/16',
      instanceType: 't3.micro',
      dbInstanceClass: 'db.t3.micro',
      tags: {},
    },
    {
      environment: 'test',
      vpcCidr: '10.99.0.0/16',
      instanceType: 't3.nano',
      dbInstanceClass: 'db.t3.micro',
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

  it('should create one VPC per environment with the correct CIDR', () => {
    const vpcs = Object.values(resources.aws_vpc) as any[];
    expect(vpcs).toHaveLength(2);
    const testVpc = vpcs.find(v => v.tags.Name === 'vpc-test');
    expect(testVpc.cidr_block).toBe('10.99.0.0/16');
  });

  it('should create 8 subnets in total (4 per environment)', () => {
    const subnets = Object.values(resources.aws_subnet);
    expect(subnets).toHaveLength(8);
  });

  it('should create a Network ACL and rules for each environment', () => {
    const nacls = Object.values(resources.aws_network_acl) as any[];
    const naclRules = Object.values(resources.aws_network_acl_rule) as any[];

    // 2 environments should result in 2 NACLs
    expect(nacls).toHaveLength(2);
    // 2 environments * 3 rules each = 6 NACL rules
    expect(naclRules).toHaveLength(6);

    // Check a specific rule for the 'test' environment
    const testInboundHttpRule = naclRules.find(
      rule =>
        rule.network_acl_id.includes('NACL-test') &&
        rule.rule_number === 100 &&
        rule.egress === false
    );
    expect(testInboundHttpRule).toBeDefined();
    expect(testInboundHttpRule.cidr_block).toBe('0.0.0.0/0');
    expect(testInboundHttpRule.from_port).toBe(80);
    expect(testInboundHttpRule.rule_action).toBe('allow');
  });

  it('should correctly configure Security Group dependencies for the dev environment', () => {
    const securityGroups = Object.values(resources.aws_security_group) as any[];
    const devAlbSg = securityGroups.find(sg => sg.name === 'alb-sg-dev');
    const devWebSg = securityGroups.find(sg => sg.name === 'web-sg-dev');
    const devDbSg = securityGroups.find(sg => sg.name === 'db-sg-dev');

    expect(devAlbSg).toBeDefined();
    expect(devWebSg).toBeDefined();
    expect(devDbSg).toBeDefined();

    expect(devWebSg.ingress[0].security_groups[0]).toMatch(
      /\${aws_security_group.AlbSg-dev.*.id}/
    );
    expect(devDbSg.ingress[0].security_groups[0]).toMatch(
      /\${aws_security_group.WebSg-dev.*.id}/
    );
  });
});
