import { Testing, App } from 'cdktf';
import { SecureInfraStack } from '../lib/secure-infra-stack';

describe('SecureInfraStack Unit Tests', () => {
  let synthesized: any;

  const findResources = (type: string) =>
    Object.values(synthesized.resource?.[type] || {});
  const findDataSources = (type: string) =>
    Object.values(synthesized.data?.[type] || {});

  beforeAll(() => {
    const app = new App();
    const stack = new SecureInfraStack(app, 'secure-infra-stack');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  it('should configure complete public access blocks for both S3 buckets', () => {
    const publicAccessBlocks = findResources(
      'aws_s3_bucket_public_access_block'
    ) as any[];
    expect(publicAccessBlocks.length).toBe(2);
    for (const block of publicAccessBlocks) {
      expect(block.block_public_acls).toBe(true);
      expect(block.block_public_policy).toBe(true);
      expect(block.ignore_public_acls).toBe(true);
      expect(block.restrict_public_buckets).toBe(true);
    }
  });

  it('should enforce HTTPS on both S3 buckets via bucket policies', () => {
    const policyDocs = findDataSources('aws_iam_policy_document') as any[];
    const secureTransportPolicies = policyDocs.filter(doc =>
      JSON.stringify(doc).includes('aws:SecureTransport')
    );
    expect(secureTransportPolicies.length).toBe(2);
  });

  it('should configure the sensitive data bucket with a restrictive principal policy', () => {
    const policyDocs = findDataSources('aws_iam_policy_document') as any[];
    const restrictivePolicy = policyDocs.find(doc =>
      JSON.stringify(doc).includes('StringNotEquals')
    );
    expect(restrictivePolicy).toBeDefined();
  });

  it('should configure the backend state bucket to use a customer-managed KMS key', () => {
    const encryptionConfigs = findResources(
      'aws_s3_bucket_server_side_encryption_configuration'
    ) as any[];
    const stateBucketEncryption = encryptionConfigs.find(config =>
      config.bucket.includes('TerraformStateBucket')
    );
    expect(
      stateBucketEncryption.rule[0].apply_server_side_encryption_by_default
        .sse_algorithm
    ).toEqual('aws:kms');
  });
});
