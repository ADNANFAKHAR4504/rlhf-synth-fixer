// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { 
  IAMClient, 
  GetRoleCommand, 
  GetUserCommand, 
  ListAttachedRolePoliciesCommand,
  ListUserPoliciesCommand,
  GetRolePolicyCommand,
  GetUserPolicyCommand,
  GetInstanceProfileCommand
} from '@aws-sdk/client-iam';
import { S3Client, GetBucketLocationCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const iamClient = new IAMClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

describe('IAM Security Configuration Integration Tests', () => {
  describe('S3 Bucket Configuration', () => {
    test('should have test S3 bucket created with correct configuration', async () => {
      const bucketName = outputs.TestS3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(`test-security-bucket-${environmentSuffix}`);

      // Test bucket location
      const locationResponse = await s3Client.send(new GetBucketLocationCommand({ Bucket: bucketName }));
      expect(locationResponse).toBeDefined();

      // Test bucket encryption
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

      // Test bucket versioning
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should have EC2 instance role with correct configuration', async () => {
      const roleName = outputs.EC2InstanceRoleName;
      expect(roleName).toBeDefined();
      expect(roleName).toContain(`EC2-S3ReadOnlyRole-${environmentSuffix}`);

      // Get role details
      const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();

      // Check assume role policy allows EC2
      const assumePolicy = JSON.parse(decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument || ''));
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      // Check attached managed policies
      const attachedPoliciesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      const policyArns = attachedPoliciesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');

      // Check inline policies (explicit deny policy)
      const inlinePolicyResponse = await iamClient.send(
        new GetRolePolicyCommand({ 
          RoleName: roleName, 
          PolicyName: `ExplicitS3WriteDeny-${environmentSuffix}` 
        })
      );
      expect(inlinePolicyResponse.PolicyDocument).toBeDefined();
      
      const inlinePolicy = JSON.parse(decodeURIComponent(inlinePolicyResponse.PolicyDocument || ''));
      expect(inlinePolicy.Statement[0].Effect).toBe('Deny');
      expect(inlinePolicy.Statement[0].Action).toContain('s3:PutObject');
      expect(inlinePolicy.Statement[0].Action).toContain('s3:DeleteObject');
    });

    test('should have instance profile with correct role attachment', async () => {
      const profileName = outputs.EC2InstanceProfileName;
      expect(profileName).toBeDefined();
      
      const profileResponse = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName })
      );
      expect(profileResponse.InstanceProfile?.Roles).toHaveLength(1);
      expect(profileResponse.InstanceProfile?.Roles?.[0]?.RoleName).toBe(outputs.EC2InstanceRoleName);
    });
  });

  describe('IAM User and Policy Configuration', () => {
    test('should have test IAM user created', async () => {
      const userName = outputs.TestIAMUserName;
      expect(userName).toBeDefined();
      expect(userName).toContain(`test-s3-user-${environmentSuffix}`);

      const userResponse = await iamClient.send(new GetUserCommand({ UserName: userName }));
      expect(userResponse.User).toBeDefined();
      expect(userResponse.User?.UserName).toBe(userName);
    });

    test('should have specific S3 bucket read-only policy attached to user', async () => {
      const userName = outputs.TestIAMUserName;
      const policyName = outputs.S3SpecificBucketReadOnlyPolicyName;
      
      expect(policyName).toBeDefined();
      expect(policyName).toContain(`S3SpecificBucketReadOnly-${environmentSuffix}`);

      // Get the inline policy attached to the user
      const policyResponse = await iamClient.send(
        new GetUserPolicyCommand({ 
          UserName: userName, 
          PolicyName: policyName 
        })
      );
      
      expect(policyResponse.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || ''));
      
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
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain(`TurnAroundPromptTable${environmentSuffix}`);

      const tableResponse = await dynamoClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      
      expect(tableResponse.Table).toBeDefined();
      expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');
      expect(tableResponse.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(tableResponse.Table?.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('Security Best Practices Validation', () => {
    test('should enforce principle of least privilege for EC2 role', async () => {
      const roleName = outputs.EC2InstanceRoleName;
      
      // Get inline deny policy
      const denyPolicyResponse = await iamClient.send(
        new GetRolePolicyCommand({ 
          RoleName: roleName, 
          PolicyName: `ExplicitS3WriteDeny-${environmentSuffix}` 
        })
      );
      
      const denyPolicy = JSON.parse(decodeURIComponent(denyPolicyResponse.PolicyDocument || ''));
      
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
      const userName = outputs.TestIAMUserName;
      const policyName = outputs.S3SpecificBucketReadOnlyPolicyName;
      
      const policyResponse = await iamClient.send(
        new GetUserPolicyCommand({ 
          UserName: userName, 
          PolicyName: policyName 
        })
      );
      
      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || ''));
      
      // Verify no wildcard resources (except for specific bucket and its objects)
      const resources = policy.Statement[0].Resource;
      expect(resources).not.toContain('*');
      expect(Array.isArray(resources)).toBe(true);
      
      // Verify resources are scoped to specific bucket
      const bucketArn = outputs.TestS3BucketArn;
      expect(resources).toContain(bucketArn);
      expect(resources.some((r: string) => r.includes(`${bucketArn}/*`))).toBe(true);
    });
  });
});
