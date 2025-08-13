import { Testing } from 'cdktf';
import { MultiRegionSecurityStack } from '../lib/tap-stack';

describe('MultiRegionSecurityStack Unit Tests', () => {
  let synthesized: any;
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new MultiRegionSecurityStack(app, 'unit-test-stack');
    synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized).resource;
  });

  it('should create a central logging bucket with versioning and encryption', () => {
    const bucket = Object.values(resources.aws_s3_bucket)[0] as any;
    expect(bucket.bucket).toContain('securecore-central-logs');

    const versioning = Object.values(
      resources.aws_s3_bucket_versioning
    )[0] as any;
    expect(versioning.versioning_configuration.status).toBe('Enabled');

    const encryption = Object.values(
      resources.aws_s3_bucket_server_side_encryption_configuration
    )[0] as any;
    expect(
      encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm
    ).toBe('AES256');

    const publicAccessBlock = Object.values(
      resources.aws_s3_bucket_public_access_block
    )[0] as any;
    expect(publicAccessBlock.block_public_acls).toBe(true);
    expect(publicAccessBlock.restrict_public_buckets).toBe(true);
  });

  it('should create VPC Flow Logs for each region pointing to the central bucket', () => {
    const flowLogs = Object.values(resources.aws_flow_log) as any[];
    // FIX: Instead of trying to resolve the ARN, we find the bucket's logical ID and build the expected token.
    const centralBucketLogicalId = Object.keys(resources.aws_s3_bucket).find(
      k => k.includes('CentralLogBucket')
    );
    const expectedArnToken = `\${aws_s3_bucket.${centralBucketLogicalId}.arn}`;

    expect(flowLogs.length).toBe(3);
    flowLogs.forEach(log => {
      expect(log.log_destination_type).toBe('s3');
      // FIX: Compare the log destination against the expected token string.
      expect(log.log_destination).toBe(expectedArnToken);
      expect(log.traffic_type).toBe('ALL');
    });
  });

  it('should create an encrypted RDS instance in each region', () => {
    const rdsInstances = Object.values(resources.aws_db_instance) as any[];
    expect(rdsInstances.length).toBe(3);
    rdsInstances.forEach(db => {
      expect(db.storage_encrypted).toBe(true);
    });
  });

  it('should generate a random password and a secret for each DB', () => {
    const randomPasswords = Object.values(resources.random_password) as any[];
    const secrets = Object.values(resources.aws_secretsmanager_secret) as any[];
    const secretVersions = Object.values(
      resources.aws_secretsmanager_secret_version
    ) as any[];

    expect(randomPasswords.length).toBe(3);
    expect(secrets.length).toBe(3);
    expect(secretVersions.length).toBe(3);

    expect(secrets[0].name).toContain('prod/rds/master_password/');
  });

  it('should apply all required tags to a sample resource (VPC)', () => {
    const vpcs = Object.values(resources.aws_vpc) as any[];
    const vpcEast = vpcs.find(v => v.tags.Region === 'us-east-1');

    expect(vpcEast.tags.Project).toBe('SecureCore');
    expect(vpcEast.tags.Owner).toBe('SRE-Team');
    expect(vpcEast.tags.Environment).toBe('Prod');
    expect(vpcEast.tags.Region).toBe('us-east-1');
  });
});
