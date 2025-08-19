import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// FIX: Manually declare Jest globals to resolve TypeScript type errors
declare var describe: any;
declare var it: any;
declare var expect: any;
declare var beforeAll: any;

describe('Unit Tests for TapStack', () => {
  let resources: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new TapStack(app, 'unit-test-stack');
    const synthesized = Testing.synth(stack);
    resources = JSON.parse(synthesized).resource;
  });

  it('should have a KMS key with rotation enabled in the primary region', () => {
    const kmsKey = resources.aws_kms_key.PciKmsKeyPrimary;
    expect(kmsKey.enable_key_rotation).toBe(true);
  });

  it('should have a primary RDS instance with Multi-AZ enabled and encrypted storage', () => {
    const rdsInstanceKey = Object.keys(resources.aws_db_instance).find(k =>
      k.startsWith('PrimaryInfra_PostgresInstance')
    );
    const rdsInstance = resources.aws_db_instance[rdsInstanceKey!];
    expect(rdsInstance.multi_az).toBe(true);
    expect(rdsInstance.storage_encrypted).toBe(true);
  });

  it('should create an RDS read replica in the secondary region', () => {
    const rdsReplicaKey = Object.keys(resources.aws_db_instance).find(k =>
      k.startsWith('SecondaryInfra_PostgresInstance')
    );
    const rdsReplica = resources.aws_db_instance[rdsReplicaKey!];
    expect(rdsReplica).toBeDefined();
    expect(rdsReplica.replicate_source_db).toBeDefined();
  });

  it('should have an S3 bucket with versioning enabled', () => {
    const s3VersioningKey = Object.keys(
      resources.aws_s3_bucket_versioning
    ).find(k => k.startsWith('PrimaryInfra_S3Versioning'));
    const s3Versioning = resources.aws_s3_bucket_versioning[s3VersioningKey!];
    expect(s3Versioning.versioning_configuration.status).toEqual('Enabled');
  });

  it('should configure DynamoDB with point-in-time recovery', () => {
    const dynamoTableKey = Object.keys(resources.aws_dynamodb_table).find(k =>
      k.startsWith('PrimaryInfra_PciDataTable')
    );
    const dynamoTable = resources.aws_dynamodb_table[dynamoTableKey!];
    expect(dynamoTable.point_in_time_recovery.enabled).toBe(true);
  });

  it('should create a CloudFront distribution', () => {
    expect(resources.aws_cloudfront_distribution.CfDistribution).toBeDefined();
  });

  it('should create a WAFv2 Web ACL', () => {
    const wafAcl = resources.aws_wafv2_web_acl.WebAcl;
    expect(wafAcl).toBeDefined();
    expect(wafAcl.scope).toEqual('CLOUDFRONT');
  });
});
