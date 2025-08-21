import { Testing, App } from 'cdktf';
import { SecureInfraStack } from '../lib/secure-infra-stack';

describe('SecureInfraStack Integration Tests', () => {
  let synthesized: any;

  const countResources = (type: string) =>
    Object.keys(synthesized.resource?.[type] || {}).length;

  beforeAll(() => {
    const app = new App();
    const stack = new SecureInfraStack(app, 'secure-infra-stack');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  it('should create exactly two S3 buckets', () => {
    expect(countResources('aws_s3_bucket')).toBe(2);
  });

  it('should create exactly one DynamoDB table', () => {
    expect(countResources('aws_dynamodb_table')).toBe(1);
  });

  it('should create exactly two KMS keys', () => {
    expect(countResources('aws_kms_key')).toBe(2);
  });

  it('should create exactly one IAM role', () => {
    expect(countResources('aws_iam_role')).toBe(1);
  });

  it('should create exactly one IAM policy', () => {
    expect(countResources('aws_iam_policy')).toBe(1);
  });

  it('should create exactly two S3 bucket policies', () => {
    expect(countResources('aws_s3_bucket_policy')).toBe(2);
  });

  it('should create exactly one IAM role policy attachment', () => {
    expect(countResources('aws_iam_role_policy_attachment')).toBe(1);
  });
});
