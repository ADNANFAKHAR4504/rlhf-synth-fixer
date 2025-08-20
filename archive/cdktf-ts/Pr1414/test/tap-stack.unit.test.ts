import { Testing } from 'cdktf'; // FIX: No longer need to import App directly
import { MultiRegionStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let synthesized: any;

  beforeAll(() => {
    // FIX: Use the in-memory testing app to avoid file system conflicts.
    const app = Testing.app();
    const stack = new MultiRegionStack(app, 'test-stack');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResource = (type: string, matchProperty: (res: any) => boolean) => {
    const resources = synthesized.resource?.[type] || {};
    return Object.values(resources).find(matchProperty);
  };

  const findAllResources = (type: string) => {
    return Object.values(synthesized.resource?.[type] || {});
  };

  it('should create a random password resource', () => {
    const passwordResource = findResource('random_password', () => true);
    expect(passwordResource).toBeDefined();
  });

  it('should create private route tables', () => {
    const privateRouteTables = findAllResources('aws_route_table').filter(
      (rt: any) => rt.tags?.Name?.includes('-private-rt-')
    );
    expect(privateRouteTables.length).toBe(6);
  });

  it('should create CloudWatch log groups for RDS', () => {
    const logGroups = findAllResources('aws_cloudwatch_log_group');
    expect(logGroups.length).toBe(3);
  });

  it('should create Terraform outputs for endpoints and security groups', () => {
    const outputs = synthesized.output || {};
    expect(Object.keys(outputs).length).toBe(12);
    expect(outputs['rds-endpoint-eu-central-1']).toBeDefined();
  });

  describe('Security Group Rules', () => {
    it('should configure database security groups with least privilege', () => {
      const dbSg: any = findResource('aws_security_group', r =>
        r.name?.startsWith('production-v4-eu-central-1-db-sg-')
      );
      expect(dbSg).toBeDefined();
      expect(dbSg.ingress.length).toBe(6);
      const postgresRule = dbSg.ingress.find(
        (rule: any) => rule.from_port === 5432
      );
      expect(postgresRule).toBeDefined();
      const redisRule = dbSg.ingress.find(
        (rule: any) => rule.from_port === 6379
      );
      expect(redisRule).toBeDefined();
    });

    it('should not allow public SSH access in application security groups', () => {
      const appSg: any = findResource('aws_security_group', r =>
        r.name?.startsWith('production-v4-eu-central-1-app-sg-')
      );
      expect(appSg).toBeDefined();
      expect(appSg.ingress).toEqual([]);
    });
  });
});
