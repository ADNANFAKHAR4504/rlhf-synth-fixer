import { Testing } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Multi-Environment Production Stack - Unit Tests', () => {
  const testConfig: TapStackConfig = {
    environment: 'test',
    vpcCidr: '10.99.0.0/16',
    instanceType: 't3.nano',
    dbInstanceClass: 'db.t3.micro',
    tags: { Environment: 'Test', ManagedBy: 'CDKTF' },
  };

  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', testConfig)
  );
  const resources = JSON.parse(synthesized).resource || {};

  it('should create a VPC with the correct CIDR', () => {
    const vpc = Object.values(resources.aws_vpc)[0] as any;
    expect(vpc.cidr_block).toBe(testConfig.vpcCidr);
  });

  it('should create four subnets (2 public, 2 private)', () => {
    const subnets = Object.values(resources.aws_subnet);
    expect(subnets).toHaveLength(4);
  });

  it('should create security groups with correct rules', () => {
    const securityGroups = Object.values(resources.aws_security_group) as any[];
    const albSg = securityGroups.find(sg =>
      sg.name.startsWith(`alb-sg-${testConfig.environment}`)
    );
    const webSg = securityGroups.find(sg =>
      sg.name.startsWith(`web-sg-${testConfig.environment}`)
    );
    const dbSg = securityGroups.find(sg =>
      sg.name.startsWith(`db-sg-${testConfig.environment}`)
    );

    expect(albSg).toBeDefined();
    expect(webSg).toBeDefined();
    expect(dbSg).toBeDefined();

    expect(albSg.ingress[0].cidr_blocks).toEqual(['0.0.0.0/0']);
    expect(webSg.ingress[0].security_groups[0]).toMatch(
      /\${aws_security_group\.AlbSg.*\.id}/
    );
    expect(dbSg.ingress[0].security_groups[0]).toMatch(
      /\${aws_security_group\.WebSg.*\.id}/
    );
  });

  it('should create a Network ACL with correct rules', () => {
    const naclRules = Object.values(resources.aws_network_acl_rule) as any[];
    expect(naclRules.length).toBeGreaterThanOrEqual(2);
  });

  it('should create an encrypted RDS instance', () => {
    const dbInstance = Object.values(resources.aws_db_instance)[0] as any;
    expect(dbInstance.storage_encrypted).toBe(true);
    expect(dbInstance.kms_key_id).toBeDefined();
  });

  it('should create Auto Scaling and Load Balancer components', () => {
    expect(Object.keys(resources.aws_launch_template)).toHaveLength(1);
    expect(Object.keys(resources.aws_autoscaling_group)).toHaveLength(1);
    expect(Object.keys(resources.aws_lb)).toHaveLength(1);
  });
});
