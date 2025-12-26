import { Testing } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Region ECS Stack - Self-Contained Unit Tests', () => {
  const testEnvironments: EnvironmentConfig[] = [
    {
      envName: 'dev',
      awsRegion: 'us-east-1',
      replicaRegion: 'us-west-2',
      vpcCidr: '10.10.0.0/16',
      tags: { Environment: 'Development' },
    },
    {
      envName: 'prod',
      awsRegion: 'us-west-2',
      replicaRegion: 'us-east-1',
      vpcCidr: '10.20.0.0/16',
      tags: { Environment: 'Production' },
    },
  ];

  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', {
      environments: testEnvironments,
    })
  );
  const resources = JSON.parse(synthesized).resource || {};

  it('should create a new VPC for each environment with the correct CIDR', () => {
    const vpcs = Object.values(resources.aws_vpc) as any[];
    expect(vpcs).toHaveLength(2);
    const prodVpc = vpcs.find(v => v.tags.Name === 'vpc-prod-us-west-2');
    expect(prodVpc).toBeDefined();
    expect(prodVpc.cidr_block).toBe('10.20.0.0/16');
  });

  it('should create public and private subnets, an IGW, and a NAT Gateway for each environment', () => {
    const subnets = Object.values(resources.aws_subnet) as any[];
    const igws = Object.values(resources.aws_internet_gateway) as any[];
    const natGws = Object.values(resources.aws_nat_gateway) as any[];
    expect(subnets).toHaveLength(8); // 4 subnets per VPC
    expect(igws).toHaveLength(2);
    expect(natGws).toHaveLength(2);
  });

  it('should create a primary and replica S3 bucket for each environment', () => {
    const buckets = Object.values(resources.aws_s3_bucket) as any[];
    expect(buckets).toHaveLength(4);
  });

  it('should create an IAM Role for S3 replication with the correct trust policy', () => {
    const roles = Object.values(resources.aws_iam_role) as any[];
    const prodReplicationRole = roles.find(r =>
      r.name.startsWith('s3-replication-role-prod')
    );
    expect(prodReplicationRole).toBeDefined();
    const assumeRolePolicy = JSON.parse(prodReplicationRole.assume_role_policy);
    expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
      's3.amazonaws.com'
    );
  });

  it('should create an Application Load Balancer and Target Group for each environment', () => {
    const lbs = Object.values(resources.aws_lb) as any[];
    const tgs = Object.values(resources.aws_lb_target_group) as any[];
    expect(lbs).toHaveLength(2);
    expect(tgs).toHaveLength(2);

    const devLb = lbs.find(lb => lb.name.startsWith('alb-dev-us-east-1'));
    expect(devLb).toBeDefined();
    expect(devLb.load_balancer_type).toBe('application');
  });

  it('should create an ECS Task Definition with FARGATE compatibility', () => {
    const taskDefs = Object.values(resources.aws_ecs_task_definition) as any[];
    expect(taskDefs).toHaveLength(2);
    const prodTaskDef = taskDefs.find(td =>
      td.family.startsWith('webapp-prod-us-west-2')
    );
    expect(prodTaskDef).toBeDefined();
    expect(prodTaskDef.requires_compatibilities).toEqual(['FARGATE']);
    expect(prodTaskDef.network_mode).toBe('awsvpc');
  });
});
