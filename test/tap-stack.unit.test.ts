import { Testing, App } from 'cdktf';
import { SecureInfraStack } from '../lib/secure-infra-stack';

describe('SecureInfraStack Unit Tests', () => {
  let synthesized: any;

  // FIX: Renamed this function to findResources (plural) for consistency.
  const findResources = (type: string) => synthesized.resource?.[type] || {};
  const findDataSources = (type: string) => synthesized.data?.[type] || {};

  beforeAll(() => {
    const app = new App();
    const stack = new SecureInfraStack(app, 'secure-infra-stack');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  it('should create a KMS key with rotation and a deletion window', () => {
    // FIX: The call to findResources now matches the function name.
    const kmsKey = Object.values(findResources('aws_kms_key'))[0] as any;
    expect(kmsKey.enable_key_rotation).toBe(true);
    expect(kmsKey.deletion_window_in_days).toBe(10);
  });

  it('should create an IAM role that trusts the account root', () => {
    const policyDocs = findDataSources('aws_iam_policy_document');
    const trustPolicy = Object.values(policyDocs).find((doc: any) =>
      JSON.stringify(doc).includes('sts:AssumeRole')
    ) as any;

    const principal = trustPolicy.statement[0].principals[0];
    expect(principal.identifiers[0]).toContain(':root');
  });

  it('should create a restrictive S3 bucket policy that denies except for specific principals', () => {
    const policyDocs = findDataSources('aws_iam_policy_document');
    const bucketPolicy = Object.values(policyDocs).find((doc: any) =>
      JSON.stringify(doc).includes('StringNotEquals')
    ) as any;

    const denyStatement = bucketPolicy.statement[0];
    expect(denyStatement.effect).toEqual('Deny');
    expect(denyStatement.condition[0].test).toEqual('StringNotEquals');
    expect(denyStatement.condition[0].variable).toEqual('aws:PrincipalArn');
  });

  it('should create an IAM policy with necessary S3 and KMS permissions', () => {
    const policyDocs = findDataSources('aws_iam_policy_document');
    const accessPolicy = Object.values(policyDocs).find((doc: any) =>
      JSON.stringify(doc).includes('s3:GetObject')
    ) as any;

    const actions = accessPolicy.statement.flatMap((s: any) => s.actions);
    expect(actions).toContain('s3:GetObject');
    expect(actions).toContain('s3:ListBucket');
    expect(actions).toContain('kms:Decrypt');
    expect(actions).toContain('kms:Encrypt');
  });
});
