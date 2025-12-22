import {
  GetPolicyCommand,
  GetPolicyVersionCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Setup ---
const region = process.env.AWS_REGION || 'us-east-1';

// Detect LocalStack environment
const isLocalStack = (() => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
})();

// AWS SDK client configuration for LocalStack
const clientConfig = isLocalStack
  ? {
      region,
      endpoint: process.env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }
  : { region };

// S3 needs forcePathStyle for LocalStack
const s3ClientConfig = isLocalStack
  ? { ...clientConfig, forcePathStyle: true }
  : clientConfig;

const s3Client = new S3Client(s3ClientConfig);
const iamClient = new IAMClient(clientConfig);
const kmsClient = new KMSClient(clientConfig);

// Support both flat outputs (direct values) and nested outputs ({ value: string })
interface TerraformOutputs {
  s3_bucket_name: string | { value: string };
  kms_key_arn: string | { value: string };
  iam_role_arn: string | { value: string };
}

// Helper to extract value from either format
function getValue(output: string | { value: string }): string {
  return typeof output === 'string' ? output : output.value;
}

describe('Live AWS Infrastructure Integration Tests', () => {
  let outputs: TerraformOutputs;

  // Read the CI/CD outputs file once before running tests
  beforeAll(() => {
    // Try multiple possible output file locations
    const possiblePaths = [
      'cdk-outputs/flat-outputs.json',
      'cfn-outputs/flat-outputs.json',
      'cfn-outputs/all-outputs.json',
    ];

    let outputPath = '';
    for (const p of possiblePaths) {
      const fullPath = path.resolve(process.cwd(), p);
      if (fs.existsSync(fullPath)) {
        outputPath = fullPath;
        break;
      }
    }

    if (!outputPath) {
      throw new Error(
        `Output file not found. Tried: ${possiblePaths.join(', ')}. Run the deployment pipeline first.`
      );
    }
    const rawJson = fs.readFileSync(outputPath, 'utf-8');
    outputs = JSON.parse(rawJson);
  });

  // --- S3 Bucket Validation ---
  describe('S3 Bucket: Security and Configuration', () => {
    test('should be encrypted with the correct KMS key', async () => {
      const bucketName = getValue(outputs.s3_bucket_name);
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();

      const encryptionRule =
        response.ServerSideEncryptionConfiguration!.Rules![0];
      const sseAlgorithm =
        encryptionRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      const kmsKeyArn =
        encryptionRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;

      expect(sseAlgorithm).toBe('aws:kms');
      expect(kmsKeyArn).toBe(getValue(outputs.kms_key_arn));
    });

    test('should block all public access', async () => {
      const bucketName = getValue(outputs.s3_bucket_name);
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', async () => {
      const bucketName = getValue(outputs.s3_bucket_name);
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  // --- IAM Role Validation ---
  describe('IAM Role: Least Privilege', () => {
    test('should only be assumable by the EC2 service', async () => {
      const roleName = getValue(outputs.iam_role_arn).split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument!)
      );
      const principal = trustPolicy.Statement[0].Principal;

      expect(principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should have a read-only policy for S3 and KMS', async () => {
      const roleName = getValue(outputs.iam_role_arn).split('/').pop()!;

      // 1. List policies attached to the role
      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const attachedPolicies = await iamClient.send(listPoliciesCommand);
      expect(attachedPolicies.AttachedPolicies?.length).toBeGreaterThan(0);
      const policyArn = attachedPolicies.AttachedPolicies![0].PolicyArn;

      // 2. Get the policy to find its default version ID
      const getPolicyCommand = new GetPolicyCommand({ PolicyArn: policyArn });
      const policyDetails = await iamClient.send(getPolicyCommand);
      const versionId = policyDetails.Policy?.DefaultVersionId;

      // 3. Get the policy version document
      const getPolicyVersionCommand = new GetPolicyVersionCommand({
        PolicyArn: policyArn,
        VersionId: versionId,
      });
      const policyVersion = await iamClient.send(getPolicyVersionCommand);
      const policyDoc = JSON.parse(
        decodeURIComponent(policyVersion.PolicyVersion?.Document!)
      );

      const actions = policyDoc.Statement.flatMap((s: any) => s.Action);

      // Positive checks: ensure required permissions are present
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:ListBucket');
      expect(actions).toContain('kms:Decrypt');

      // Negative checks (edge cases): ensure no write/delete permissions exist
      expect(actions).not.toContain('s3:PutObject');
      expect(actions).not.toContain('s3:DeleteObject');
      expect(actions).not.toContain('s3:*');
    });
  });

  // --- KMS Key Validation ---
  describe('KMS Key: Configuration', () => {
    test('should be enabled and customer-managed', async () => {
      const keyId = getValue(outputs.kms_key_arn).split('/').pop()!;
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyManager).toBe('CUSTOMER');
    });

    test('should have key rotation enabled', async () => {
      const keyId = getValue(outputs.kms_key_arn).split('/').pop()!;
      const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      expect(response.KeyRotationEnabled).toBe(true);
    });
  });
});
