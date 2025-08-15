import { Testing, App } from 'cdktf';
import { SecureInfraStack } from '../lib/secure-infra-stack';

describe('SecureInfraStack Integration Tests', () => {
  let synthesized: any;

  const findResources = (type: string) => synthesized.resource?.[type] || {};

  beforeAll(() => {
    const app = new App();
    const stack = new SecureInfraStack(app, 'secure-infra-stack');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  it('should create exactly two S3 buckets', () => {
    expect(Object.keys(findResources('aws_s3_bucket')).length).toBe(2);
  });

  it('should create exactly one DynamoDB table', () => {
    expect(Object.keys(findResources('aws_dynamodb_table')).length).toBe(1);
  });

  it('should create exactly one KMS key', () => {
    expect(Object.keys(findResources('aws_kms_key')).length).toBe(1);
  });

  it('should create exactly one IAM role', () => {
    expect(Object.keys(findResources('aws_iam_role')).length).toBe(1);
  });

  it('should create exactly one IAM policy', () => {
    expect(Object.keys(findResources('aws_iam_policy')).length).toBe(1);
  });

  it('should create exactly one S3 bucket policy', () => {
    expect(Object.keys(findResources('aws_s3_bucket_policy')).length).toBe(1);
  });

  it('should create exactly one IAM role policy attachment', () => {
    expect(
      Object.keys(findResources('aws_iam_role_policy_attachment')).length
    ).toBe(1);
  });
});
