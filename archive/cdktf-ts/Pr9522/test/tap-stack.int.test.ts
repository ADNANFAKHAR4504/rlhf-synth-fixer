import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// FIX: Manually declare Jest globals to resolve TypeScript type errors
declare var describe: any;
declare var it: any;
declare var expect: any;
declare var beforeAll: any;

describe('Integration Tests for TapStack', () => {
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new TapStack(app, 'integration-test-stack');
    const synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized).resource;
  });

  it('should associate the primary RDS instance with the correct subnet group', () => {
    const rdsInstanceKey = Object.keys(resources.aws_db_instance).find(k =>
      k.startsWith('PrimaryInfra_PostgresInstance')
    );
    const rdsInstance = resources.aws_db_instance[rdsInstanceKey!];
    expect(rdsInstance.db_subnet_group_name).toContain(
      '${aws_db_subnet_group.PrimaryInfra_RdsSubnetGroup'
    );
  });

  it('should configure S3 replication to the replica region', () => {
    const replicationConfig =
      resources.aws_s3_bucket_replication_configuration.S3Replication;
    // FIX: The test now expects the ARN from the Data Source, matching our deployment fix.
    expect(replicationConfig.rule[0].destination.bucket).toContain(
      '${data.aws_s3_bucket.S3ReplicaBucketData.arn}'
    );
  });

  it('should create two subnets within the primary VPC', () => {
    const allSubnets = resources.aws_subnet;
    const primarySubnets = Object.values(allSubnets).filter((subnet: any) =>
      subnet.vpc_id.includes('PrimaryInfra_MainVpc')
    );
    expect(primarySubnets.length).toBe(2);
  });

  it('should associate the WAF ACL with the CloudFront distribution when not using LocalStack', () => {
    const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                         process.env.LOCALSTACK_ENDPOINT !== undefined;

    if (!isLocalStack) {
      const cfDistro = resources.aws_cloudfront_distribution.CfDistribution;
      expect(cfDistro.web_acl_id).toContain('${aws_wafv2_web_acl.WebAcl.arn}');
    } else {
      expect(resources.aws_cloudfront_distribution?.CfDistribution).toBeUndefined();
    }
  });

  it('should have an RDS instance in secondary region', () => {
    const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                         process.env.LOCALSTACK_ENDPOINT !== undefined;

    const rdsReplicaKey = Object.keys(resources.aws_db_instance).find(k =>
      k.startsWith('SecondaryInfra_PostgresInstance')
    );
    const rdsReplica = resources.aws_db_instance[rdsReplicaKey!];

    if (!isLocalStack) {
      // AWS: Should be a read replica
      expect(rdsReplica.replicate_source_db).toContain(
        '${aws_db_instance.PrimaryInfra_PostgresInstance'
      );
    } else {
      // LocalStack: Independent instance
      expect(rdsReplica.engine).toBeDefined();
    }
  });
});
