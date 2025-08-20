import { Testing } from 'cdktf'; // FIX: No longer need to import App directly
import { MultiRegionStack } from '../lib/tap-stack';

describe('TapStack End-to-End Integration Tests', () => {
  let synthesized: any;

  beforeAll(() => {
    // FIX: Use the in-memory testing app to avoid file system conflicts.
    const app = Testing.app();
    const stack = new MultiRegionStack(
      app,
      'multi-region-infra-integration-test'
    );
    synthesized = JSON.parse(Testing.synth(stack));
  });

  it('should synthesize a valid Terraform configuration without errors', () => {
    expect(synthesized).toBeDefined();
    expect(synthesized.resource).toBeDefined();
  });

  it('should create a random password resource', () => {
    const passwords = synthesized.resource.random_password || {};
    expect(Object.keys(passwords).length).toBe(1);
  });

  it('should create exactly 3 VPCs, RDS instances, and ElastiCache clusters', () => {
    expect(Object.keys(synthesized.resource.aws_vpc || {}).length).toBe(3);
    expect(Object.keys(synthesized.resource.aws_db_instance || {}).length).toBe(
      3
    );
    expect(
      Object.keys(synthesized.resource.aws_elasticache_cluster || {}).length
    ).toBe(3);
  });

  it('should establish all required VPC peering connections', () => {
    const peeringConnections =
      synthesized.resource.aws_vpc_peering_connection || {};
    expect(Object.keys(peeringConnections).length).toBe(3);
  });

  it('should correctly configure routes for public and private subnets', () => {
    const routes = synthesized.resource.aws_route || {};
    expect(Object.keys(routes).length).toBe(15);
  });

  it('should create CloudWatch log groups for RDS', () => {
    const logGroups = synthesized.resource.aws_cloudwatch_log_group || {};
    expect(Object.keys(logGroups).length).toBe(3);
  });

  it('should create Terraform outputs for all service endpoints', () => {
    const outputs = synthesized.output || {};
    expect(Object.keys(outputs).length).toBe(12);
  });

  it('should configure database security groups with specific ports', () => {
    const securityGroups = synthesized.resource.aws_security_group || {};
    const dbSgs = Object.values(securityGroups).filter((sg: any) =>
      sg.name?.includes('-db-sg')
    );
    expect(dbSgs.length).toBe(3);

    dbSgs.forEach((sg: any) => {
      const hasPostgresRule = sg.ingress.some(
        (rule: any) => rule.from_port === 5432
      );
      const hasRedisRule = sg.ingress.some(
        (rule: any) => rule.from_port === 6379
      );
      const hasPermissiveRule = sg.ingress.some(
        (rule: any) => rule.protocol === '-1'
      );

      expect(hasPostgresRule).toBe(true);
      expect(hasRedisRule).toBe(true);
      expect(hasPermissiveRule).toBe(false);
    });
  });
});
