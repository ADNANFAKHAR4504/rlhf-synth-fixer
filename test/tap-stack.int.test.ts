// Configuration - These are coming from cfn-outputs after cdk deploy
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  GetUserCommand,
  GetUserPolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Check if cfn-outputs directory exists and has the flat-outputs.json file
let outputs: any = {};
const outputsPath = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsPath)) {
  const fileContent = fs.readFileSync(outputsPath, 'utf8').trim();
  if (fileContent) {
    try {
      outputs = JSON.parse(fileContent);
    } catch (error) {
      console.warn(
        'Failed to parse cfn-outputs/flat-outputs.json. Integration tests may fail without deployment outputs.'
      );
      outputs = {};
    }
  } else {
    console.warn(
      'cfn-outputs/flat-outputs.json is empty. Integration tests may fail without deployment outputs.'
    );
  }
} else {
  console.warn(
    'cfn-outputs/flat-outputs.json not found. Integration tests may fail without deployment outputs.'
  );
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const iamClient = new IAMClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

describe('IAM Security Configuration Integration Tests', () => {
  describe('S3 Bucket Configuration', () => {
    test('should have test S3 bucket created with correct configuration', async () => {
      if (!outputs.TestS3BucketName) {
        console.warn(
          'Skipping S3 bucket test - TestS3BucketName not available in outputs'
        );
        return;
      }

      const bucketName = outputs.TestS3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(`test-security-bucket-${environmentSuffix}`);

      // Test bucket location
      const locationResponse = await s3Client.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      expect(locationResponse).toBeDefined();

      // Test bucket encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');

      // Test bucket versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should have EC2 instance role with correct configuration', async () => {
      if (!outputs.EC2InstanceRoleName) {
        console.warn(
          'Skipping IAM role test - EC2InstanceRoleName not available in outputs'
        );
        return;
      }

      const roleName = outputs.EC2InstanceRoleName;
      expect(roleName).toBeDefined();
      expect(roleName).toContain(`EC2-S3ReadOnlyRole-${environmentSuffix}`);

      // Get role details
      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();

      // Check assume role policy allows EC2
      const assumePolicy = JSON.parse(
        decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument || '')
      );
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );

      // Check attached managed policies
      const attachedPoliciesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      const policyArns =
        attachedPoliciesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
      );

      // Check inline policies (explicit deny policy)
      const inlinePolicyResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: `ExplicitS3WriteDeny-${environmentSuffix}`,
        })
      );
      expect(inlinePolicyResponse.PolicyDocument).toBeDefined();

      const inlinePolicy = JSON.parse(
        decodeURIComponent(inlinePolicyResponse.PolicyDocument || '')
      );
      expect(inlinePolicy.Statement[0].Effect).toBe('Deny');
      expect(inlinePolicy.Statement[0].Action).toContain('s3:PutObject');
      expect(inlinePolicy.Statement[0].Action).toContain('s3:DeleteObject');
    });

    test('should have instance profile with correct role attachment', async () => {
      if (!outputs.EC2InstanceProfileName || !outputs.EC2InstanceRoleName) {
        console.warn(
          'Skipping instance profile test - required outputs not available'
        );
        return;
      }

      const profileName = outputs.EC2InstanceProfileName;
      expect(profileName).toBeDefined();

      const profileResponse = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );
      expect(profileResponse.InstanceProfile?.Roles).toHaveLength(1);
      expect(profileResponse.InstanceProfile?.Roles?.[0]?.RoleName).toBe(
        outputs.EC2InstanceRoleName
      );
    });
  });

  describe('IAM User and Policy Configuration', () => {
    test('should have test IAM user created', async () => {
      if (!outputs.TestIAMUserName) {
        console.warn(
          'Skipping IAM user test - TestIAMUserName not available in outputs'
        );
        return;
      }

      const userName = outputs.TestIAMUserName;
      expect(userName).toBeDefined();
      expect(userName).toContain(`test-s3-user-${environmentSuffix}`);

      const userResponse = await iamClient.send(
        new GetUserCommand({ UserName: userName })
      );
      expect(userResponse.User).toBeDefined();
      expect(userResponse.User?.UserName).toBe(userName);
    });

    test('should have specific S3 bucket read-only policy attached to user', async () => {
      if (
        !outputs.TestIAMUserName ||
        !outputs.S3SpecificBucketReadOnlyPolicyName
      ) {
        console.warn(
          'Skipping S3 policy test - required outputs not available'
        );
        return;
      }

      const userName = outputs.TestIAMUserName;
      const policyName = outputs.S3SpecificBucketReadOnlyPolicyName;

      expect(policyName).toBeDefined();
      expect(policyName).toContain(
        `S3SpecificBucketReadOnly-${environmentSuffix}`
      );

      // Get the inline policy attached to the user
      const policyResponse = await iamClient.send(
        new GetUserPolicyCommand({
          UserName: userName,
          PolicyName: policyName,
        })
      );

      expect(policyResponse.PolicyDocument).toBeDefined();
      const policy = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument || '')
      );

      // Verify policy allows read-only access
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Action).toContain('s3:GetObject');
      expect(policy.Statement[0].Action).toContain('s3:ListBucket');
      expect(policy.Statement[0].Action).toContain('s3:GetBucketLocation');

      // Verify policy is scoped to specific bucket
      const bucketArn = outputs.TestS3BucketArn;
      expect(policy.Statement[0].Resource).toContain(bucketArn);
      expect(policy.Statement[0].Resource).toContain(`${bucketArn}/*`);
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should have DynamoDB table created with correct configuration', async () => {
      if (!outputs.TurnAroundPromptTableName) {
        console.warn(
          'Skipping DynamoDB table test - TurnAroundPromptTableName not available in outputs'
        );
        return;
      }

      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain(`TurnAroundPromptTable${environmentSuffix}`);

      const tableResponse = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );

      expect(tableResponse.Table).toBeDefined();
      expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');
      expect(tableResponse.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
      expect(tableResponse.Table?.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('Security Best Practices Validation', () => {
    test('should enforce principle of least privilege for EC2 role', async () => {
      if (!outputs.EC2InstanceRoleName) {
        console.warn(
          'Skipping EC2 role security test - EC2InstanceRoleName not available in outputs'
        );
        return;
      }

      const roleName = outputs.EC2InstanceRoleName;

      // Get inline deny policy
      const denyPolicyResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: `ExplicitS3WriteDeny-${environmentSuffix}`,
        })
      );

      const denyPolicy = JSON.parse(
        decodeURIComponent(denyPolicyResponse.PolicyDocument || '')
      );

      // Verify explicit deny prevents privilege escalation
      expect(denyPolicy.Statement[0].Effect).toBe('Deny');
      expect(denyPolicy.Statement[0].Resource).toBe('*');

      // Verify comprehensive write operations are denied
      const deniedActions = denyPolicy.Statement[0].Action;
      expect(deniedActions).toContain('s3:PutObject');
      expect(deniedActions).toContain('s3:DeleteObject');
      expect(deniedActions).toContain('s3:PutBucketPolicy');
      expect(deniedActions).toContain('s3:DeleteBucket');
      expect(deniedActions).toContain('s3:PutBucketAcl');
    });

    test('should have IAM user policy scoped to specific resources only', async () => {
      if (
        !outputs.TestIAMUserName ||
        !outputs.S3SpecificBucketReadOnlyPolicyName
      ) {
        console.warn(
          'Skipping IAM user policy security test - required outputs not available'
        );
        return;
      }

      const userName = outputs.TestIAMUserName;
      const policyName = outputs.S3SpecificBucketReadOnlyPolicyName;

      const policyResponse = await iamClient.send(
        new GetUserPolicyCommand({
          UserName: userName,
          PolicyName: policyName,
        })
      );

      const policy = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument || '')
      );

      // Verify no wildcard resources (except for specific bucket and its objects)
      const resources = policy.Statement[0].Resource;
      expect(resources).not.toContain('*');
      expect(Array.isArray(resources)).toBe(true);

      // Verify resources are scoped to specific bucket
      const bucketArn = outputs.TestS3BucketArn;
      expect(resources).toContain(bucketArn);
      expect(resources.some((r: string) => r.includes(`${bucketArn}/*`))).toBe(
        true
      );
    });
  });
});
