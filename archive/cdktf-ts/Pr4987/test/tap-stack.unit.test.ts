// tests/tap-stack.unit.test.ts
import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app({ stackTraces: false });
    // --- FIX: Pass mock props to the stack constructor ---
    const stack = new TapStack(app, 'MultiRegionDrStack', {
      environmentSuffix: 'unit-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => {
    return synthesized.resource[type] || {};
  };

  const countResources = (type: string) => {
    return Object.keys(findResources(type)).length;
  };

  it('should have two AWS providers with aliases', () => {
    expect(synthesized.provider.aws).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ alias: 'primary', region: 'us-east-1' }),
        expect.objectContaining({ alias: 'dr', region: 'us-west-2' }),
      ]),
    );
  });

  it('should create a VPC in each region', () => {
    expect(countResources('aws_vpc')).toBe(2);
  });

  it('should create 8 subnets (2 public, 2 private per region)', () => {
    expect(countResources('aws_subnet')).toBe(8);
  });

  it('should create a NAT Gateway in each region', () => {
    expect(countResources('aws_nat_gateway')).toBe(2);
  });

  it('should create two KMS keys', () => {
    expect(countResources('aws_kms_key')).toBe(2);
  });

  it('should create one Secrets Manager secret', () => {
    expect(countResources('aws_secretsmanager_secret')).toBe(1);
    expect(countResources('aws_secretsmanager_secret_version')).toBe(1);
  });

  it('should create two independent RDS Clusters', () => {
    expect(countResources('aws_rds_cluster')).toBe(2);
  });

  it('should create 2 RDS Cluster Instances (1 per cluster)', () => {
    expect(countResources('aws_rds_cluster_instance')).toBe(2);
  });

  it('should create two Launch Templates and two ASGs', () => {
    expect(countResources('aws_launch_template')).toBe(2);
    expect(countResources('aws_autoscaling_group')).toBe(2);
  });

  it('should create two Load Balancers and two Listeners', () => {
    expect(countResources('aws_lb')).toBe(2);
    expect(countResources('aws_lb_listener')).toBe(2);
  });

  it('should create one Route 53 Zone', () => {
    expect(countResources('aws_route53_zone')).toBe(1);
  });

  it('should create two Route 53 Health Checks', () => {
    expect(countResources('aws_route53_health_check')).toBe(2);
  });

  it('should create two Route 53 Records for failover', () => {
    const records = Object.values(findResources('aws_route53_record'));
    expect(records.length).toBe(2);
    expect(records[0]).toHaveProperty('failover_routing_policy');
    expect(records[1]).toHaveProperty('failover_routing_policy');
  });

  it('should create one CloudWatch Alarm', () => {
    expect(countResources('aws_cloudwatch_metric_alarm')).toBe(1);
  });

  it('should define all required outputs', () => {
    expect(synthesized.output).toHaveProperty('PrimaryALBEndpoint');
    expect(synthesized.output).toHaveProperty('DrALBEndpoint');
    expect(synthesized.output).toHaveProperty('Route53FailoverDNS');
    expect(synthesized.output).toHaveProperty('PrimaryDBClusterEndpoint');
    expect(synthesized.output).toHaveProperty('ReplicaDBClusterEndpoint');
  });

  it('should define outputs for integration testing', () => {
    expect(synthesized.output).toHaveProperty('PrimaryDBClusterIdentifier');
    expect(synthesized.output).toHaveProperty('ReplicaDBClusterIdentifier');
    expect(synthesized.output).toHaveProperty('PrimaryASGName');
    expect(synthesized.output).toHaveProperty('DrASGName');
  });
});
