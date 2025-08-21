import { Testing } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Region ECS Stack - Self-Contained Integration Tests', () => {
  const testEnvironments: EnvironmentConfig[] = [
    {
      envName: 'dev',
      awsRegion: 'us-east-1',
      replicaRegion: 'us-west-2',
      vpcCidr: '10.10.0.0/16',
      tags: {},
    },
    {
      envName: 'prod',
      awsRegion: 'us-west-2',
      replicaRegion: 'us-east-1',
      vpcCidr: '10.20.0.0/16',
      tags: {},
    },
  ];

  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', {
      environments: testEnvironments,
    })
  );
  const resources = JSON.parse(synthesized).resource || {};

  it('should associate the PROD ECS Service with the newly created private subnets', () => {
    const service = resources.aws_ecs_service['EcsService-prod-us-west-2'];
    expect(service).toBeDefined();

    const networkConfig = service.network_configuration;
    expect(networkConfig.subnets).toHaveLength(2);
    expect(networkConfig.subnets[0]).toMatch(
      /\${aws_subnet.PrivateSubnetA-prod-us-west-2.id}/
    );
    expect(networkConfig.subnets[1]).toMatch(
      /\${aws_subnet.PrivateSubnetB-prod-us-west-2.id}/
    );
  });

  it('should associate the DEV ALB with the newly created public subnets', () => {
    const alb = resources.aws_lb['ALB-dev-us-east-1'];
    expect(alb).toBeDefined();

    expect(alb.subnets).toHaveLength(2);
    expect(alb.subnets[0]).toMatch(
      /\${aws_subnet.PublicSubnetA-dev-us-east-1.id}/
    );
    expect(alb.subnets[1]).toMatch(
      /\${aws_subnet.PublicSubnetB-dev-us-east-1.id}/
    );
  });

  it('should configure S3 replication from the primary to the replica bucket for PROD', () => {
    const replicationConfig =
      resources.aws_s3_bucket_replication_configuration[
        'S3ReplicationConfig-prod-us-west-2'
      ];
    expect(replicationConfig).toBeDefined();

    expect(replicationConfig.role).toMatch(
      /\${aws_iam_role.S3ReplicationRole-prod-us-west-2.arn}/
    );
    const destinationBucket = replicationConfig.rule[0].destination.bucket;
    expect(destinationBucket).toMatch(
      /\${aws_s3_bucket.S3ReplicaBucket-prod-us-west-2.arn}/
    );
  });

  it('should associate the DEV Task Definition with both Task and Execution Roles', () => {
    const taskDef =
      resources.aws_ecs_task_definition['TaskDefinition-dev-us-east-1'];
    expect(taskDef).toBeDefined();

    expect(taskDef.execution_role_arn).toMatch(
      /\${aws_iam_role.EcsTaskExecRole-dev-us-east-1.arn}/
    );
    expect(taskDef.task_role_arn).toMatch(
      /\${aws_iam_role.EcsTaskRole-dev-us-east-1.arn}/
    );
  });
});
