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

  // ENHANCED: Test KMS Key configurations in detail
  describe('KMS Keys', () => {
    it('should create two KMS keys', () => {
      const kmsKeys = findResources('aws_kms_key') as any[];
      expect(kmsKeys.length).toBe(2);
    });

    it('should configure the sensitive data key with a deletion window and rotation', () => {
      const kmsKeys = findResources('aws_kms_key') as any[];
      const sensitiveDataKey = kmsKeys.find(
        k => k.description === 'KMS key for sensitive data S3 bucket'
      );
      expect(sensitiveDataKey).toBeDefined();
      expect(sensitiveDataKey.deletion_window_in_days).toBe(10);
      expect(sensitiveDataKey.enable_key_rotation).toBe(true);
    });

    it('should configure the backend key with rotation enabled', () => {
      const kmsKeys = findResources('aws_kms_key') as any[];
      const backendKey = kmsKeys.find(
        k => k.description === 'KMS key for Terraform state bucket'
      );
      expect(backendKey).toBeDefined();
      expect(backendKey.enable_key_rotation).toBe(true);
    });
  });

  // ENHANCED: Test S3 bucket security configurations
  describe('S3 Buckets', () => {
    it('should configure complete public access blocks for both buckets', () => {
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

    it('should configure KMS encryption for both buckets', () => {
      const encryptionConfigs = findResources(
        'aws_s3_bucket_server_side_encryption_configuration'
      ) as any[];
      expect(encryptionConfigs.length).toBe(2);
      for (const config of encryptionConfigs) {
        expect(
          config.rule[0].apply_server_side_encryption_by_default.sse_algorithm
        ).toEqual('aws:kms');
      }
    });

    it('should enforce HTTPS on both buckets via policies', () => {
      const policyDocs = findDataSources('aws_iam_policy_document') as any[];
      const secureTransportPolicies = policyDocs.filter(doc =>
        JSON.stringify(doc).includes('aws:SecureTransport')
      );
      expect(secureTransportPolicies.length).toBe(2);
    });
  });

  // ENHANCED: Test IAM policies in detail
  describe('IAM Policies', () => {
    it('should create a role that trusts the account root', () => {
      const policyDocs = findDataSources('aws_iam_policy_document') as any[];
      const trustPolicy = policyDocs.find(doc =>
        JSON.stringify(doc).includes('sts:AssumeRole')
      ) as any;
      const principal = trustPolicy.statement[0].principals[0];
      expect(trustPolicy.statement[0].effect).toBe('Allow');
      expect(principal.type).toBe('AWS');
      expect(principal.identifiers[0]).toContain(':root');
    });

    it('should create a restrictive S3 bucket policy using StringNotEquals', () => {
      const policyDocs = findDataSources('aws_iam_policy_document') as any[];
      const restrictivePolicy = policyDocs.find(doc =>
        JSON.stringify(doc).includes('StringNotEquals')
      );
      expect(restrictivePolicy).toBeDefined();
    });

    it('should create an access policy with correct S3 and KMS permissions', () => {
      const policyDocs = findDataSources('aws_iam_policy_document') as any[];
      const accessPolicy = policyDocs.find(doc =>
        JSON.stringify(doc).includes('s3:GetObject')
      ) as any;
      const actions = accessPolicy.statement.flatMap((s: any) => s.actions);
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:ListBucket');
      expect(actions).toContain('kms:Decrypt');
      expect(actions).toContain('kms:Encrypt');
      // FIX: Add a test for the missing permission.
      expect(actions).toContain('kms:GenerateDataKey');
    });
  });
});
