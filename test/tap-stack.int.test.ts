import { Testing } from 'cdktf';
import { TapStack, TapStackConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Multi-Environment Production Stack - Plan Tests', () => {
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
  const outputs = JSON.parse(synthesized).output || {};

  it('should define the required outputs', () => {
    expect(outputs.AlbDnsName).toBeDefined();
    expect(outputs.RdsEndpoint).toBeDefined();
  });

  it('should associate the ASG with private subnets', () => {
    const asg = Object.values(resources.aws_autoscaling_group)[0] as any;
    expect(asg.vpc_zone_identifier).toHaveLength(2);
    expect(asg.vpc_zone_identifier[0]).toMatch(
      /\${aws_subnet\.PrivateSubnetA.*\.id}/
    );
    expect(asg.vpc_zone_identifier[1]).toMatch(
      /\${aws_subnet\.PrivateSubnetB.*\.id}/
    );
  });

  it('should associate the ALB with public subnets', () => {
    const alb = Object.values(resources.aws_lb)[0] as any;
    expect(alb.subnets).toHaveLength(2);
    expect(alb.subnets[0]).toMatch(/\${aws_subnet\.PublicSubnetA.*\.id}/);
    expect(alb.subnets[1]).toMatch(/\${aws_subnet\.PublicSubnetB.*\.id}/);
  });

  it('should associate the RDS instance with a multi-AZ subnet group', () => {
    const dbInstance = Object.values(resources.aws_db_instance)[0] as any;
    expect(dbInstance.db_subnet_group_name).toBeDefined();
  });
});
