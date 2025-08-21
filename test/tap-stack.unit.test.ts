import { Testing } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Region ECS Stack - Hardened Unit Tests', () => {
  const testEnvironments: EnvironmentConfig[] = [
    {
      envName: 'dev',
      awsRegion: 'us-east-1',
      replicaRegion: 'us-west-2',
      awsAccountId: '123456789012',
      vpcId: 'vpc-dev-ue1',
      publicSubnetIds: [],
      privateSubnetIds: [],
      amiId: 'ami-dev-ue1',
      cpu: 256,
      memory: 512,
      tags: { Environment: 'Development' },
    },
    {
      envName: 'prod',
      awsRegion: 'us-west-2',
      replicaRegion: 'us-east-1',
      awsAccountId: '210987654321',
      vpcId: 'vpc-prod-uw2',
      publicSubnetIds: [],
      privateSubnetIds: [],
      amiId: 'ami-prod-uw2',
      cpu: 1024,
      memory: 2048,
      tags: { Environment: 'Production' },
    },
  ];

  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', {
      environments: testEnvironments,
    })
  );
  const resources = JSON.parse(synthesized).resource || {};

  it('should create a primary and replica S3 bucket for each environment', () => {
    const buckets = Object.values(resources.aws_s3_bucket) as any[];
    expect(buckets).toHaveLength(4); // 2 primary, 2 replica

    const devPrimary = buckets.find(b =>
      b.bucket.startsWith('webapp-primary-dev')
    );
    const devReplica = buckets.find(b =>
      b.bucket.startsWith('webapp-replica-dev')
    );
    expect(devPrimary).toBeDefined();
    expect(devReplica).toBeDefined();
    expect(devPrimary.provider).toBe('aws.dev-us-east-1');
    expect(devReplica.provider).toBe('aws.dev-us-west-2');
  });

  it('should create an IAM Role for S3 replication', () => {
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

  it('should configure hardened security group egress rules for PROD', () => {
    const securityGroups = Object.values(resources.aws_security_group) as any[];
    const prodEcsSg = securityGroups.find(sg =>
      sg.name.startsWith('ecs-sg-prod-us-west-2')
    );

    expect(prodEcsSg).toBeDefined();
    const egressRule = prodEcsSg.egress[0];
    expect(egressRule.protocol).toBe('tcp');
    expect(egressRule.from_port).toBe(443); // Egress only for HTTPS
    expect(egressRule.cidr_blocks).toEqual(['0.0.0.0/0']);
  });

  it('should create an ECS Cluster and Service for each environment-region', () => {
    const clusters = Object.values(resources.aws_ecs_cluster) as any[];
    const services = Object.values(resources.aws_ecs_service) as any[];
    expect(clusters).toHaveLength(2);
    expect(services).toHaveLength(2);
  });
});
