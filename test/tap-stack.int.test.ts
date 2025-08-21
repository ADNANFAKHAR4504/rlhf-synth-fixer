import { Testing } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';
import { describe, it, expect } from '@jest/globals';

describe('Unified Multi-Region ECS Stack - Hardened Integration Tests', () => {
  const testEnvironments: EnvironmentConfig[] = [
    {
      envName: 'dev',
      awsRegion: 'us-east-1',
      replicaRegion: 'us-west-2',
      awsAccountId: '123456789012',
      vpcId: 'vpc-dev-ue1',
      publicSubnetIds: ['pub-a'],
      privateSubnetIds: ['priv-a'],
      amiId: 'ami-dev-ue1',
      cpu: 256,
      memory: 512,
      tags: { Environment: 'Development', CostCenter: 'DevTeam' },
    },
    {
      envName: 'prod',
      awsRegion: 'us-west-2',
      replicaRegion: 'us-east-1',
      awsAccountId: '210987654321',
      vpcId: 'vpc-prod-uw2',
      publicSubnetIds: ['pub-b'],
      privateSubnetIds: ['priv-b'],
      amiId: 'ami-prod-uw2',
      cpu: 1024,
      memory: 2048,
      tags: { Environment: 'Production', CostCenter: 'ProdOps' },
    },
  ];

  const synthesized = Testing.synth(
    new TapStack(Testing.app(), 'test-stack', {
      environments: testEnvironments,
    })
  );
  const resources = JSON.parse(synthesized).resource || {};
  const outputs = JSON.parse(synthesized).output || {};

  it('should define distinct outputs for each environment-region', () => {
    expect(outputs['PrimaryS3BucketName-dev-us-east-1']).toBeDefined();
    expect(outputs['EcsClusterName-prod-us-west-2']).toBeDefined();
    expect(outputs['AlbDnsName-dev-us-east-1']).toBeDefined();
  });

  it('should configure S3 replication from the primary to the replica bucket for PROD', () => {
    // FIX: Changed aws_s3_bucket_replication_configuration_a to the correct resource name.
    const replicationConfig = (
      Object.values(resources.aws_s3_bucket_replication_configuration) as any[]
    ).find(rc => rc.bucket.includes('S3PrimaryBucket-prod-us-west-2'));
    expect(replicationConfig).toBeDefined();

    expect(replicationConfig.role).toMatch(
      /\${aws_iam_role.S3ReplicationRole-prod-us-west-2.arn}/
    );
    const destinationBucket = replicationConfig.rule[0].destination.bucket;
    expect(destinationBucket).toMatch(
      /\${aws_s3_bucket.S3ReplicaBucket-prod-us-west-2.arn}/
    );
  });

  it('should attach the replication policy to the S3 Replication Role for DEV', () => {
    const attachment = (
      Object.values(resources.aws_iam_role_policy_attachment) as any[]
    ).find(att => att.role.includes('S3ReplicationRole-dev-us-east-1'));
    expect(attachment).toBeDefined();
    expect(attachment.policy_arn).toMatch(
      /\${aws_iam_policy.S3ReplicationPolicy-dev-us-east-1.arn}/
    );
  });

  it('should associate the DEV Task Definition with both Task and Execution Roles', () => {
    const taskDef = (
      Object.values(resources.aws_ecs_task_definition) as any[]
    ).find(td => td.family.startsWith('webapp-dev-us-east-1'));
    expect(taskDef).toBeDefined();

    expect(taskDef.execution_role_arn).toMatch(
      /\${aws_iam_role.EcsTaskExecRole-dev-us-east-1.arn}/
    );
    expect(taskDef.task_role_arn).toMatch(
      /\${aws_iam_role.EcsTaskRole-dev-us-east-1.arn}/
    );
  });

  it('should ensure the PROD ECS Task Policy grants access to the PROD primary bucket', () => {
    const policy = (Object.values(resources.aws_iam_policy) as any[]).find(p =>
      p.name.startsWith('ecs-task-policy-prod-us-west-2')
    );
    expect(policy).toBeDefined();

    const policyDoc = JSON.parse(policy.policy);
    const resourceString = policyDoc.Statement[0].Resource[0];
    expect(resourceString).toMatch(
      /\${aws_s3_bucket.S3PrimaryBucket-prod-us-west-2.arn}\/\*/
    );
  });
});
