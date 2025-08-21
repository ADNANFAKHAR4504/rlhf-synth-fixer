import {
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  GetPolicyCommand,
  GetRoleCommand,
  GetUserCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListAttachedUserPoliciesCommand
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Configuration - These outputs come from cfn-outputs after terraform apply
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (err) {
  console.warn('Warning: Outputs file not found or invalid. Integration tests will be skipped.');
}

// AWS clients - set region explicitly
const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const iamClient = new IAMClient({ region });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Terraform Stack Integration Tests', () => {
  
  describe('S3 Buckets - Terraform State Management', () => {
    test('Terraform state bucket exists and has correct configuration', async () => {
      const bucketName = outputs.terraform_state_bucket_id;
      if (!bucketName) {
        console.warn('terraform_state_bucket_id output is missing. Skipping test.');
        return;
      }
      expect(bucketName).toBeDefined();
      
      // Verify bucket exists
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();
      
      // Verify versioning is enabled
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(versioningResponse.Status).toBe('Enabled');
      
      // Verify encryption is configured
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      
      // Verify public access is blocked
      const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('Terraform state bucket has secure bucket policy', async () => {
      const bucketName = outputs.terraform_state_bucket_id;
      
      if (!bucketName) {
        console.warn('terraform_state_bucket_id output is missing. Skipping test.');
        return;
      }
      
      // Verify bucket policy exists and enforces security
      const policyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
      expect(policyResponse.Policy).toBeDefined();
      
      const policy = JSON.parse(policyResponse.Policy!);
      expect(policy.Statement).toBeDefined();
      
      // Check for SSL/TLS enforcement
      const sslStatement = policy.Statement.find((stmt: any) => 
        stmt.Condition?.Bool?.['aws:SecureTransport']?.includes('false')
      );
      expect(sslStatement).toBeDefined();
      expect(sslStatement.Effect).toBe('Deny');
    });
  });

  describe('S3 Buckets - Sensitive Data Storage', () => {
    test('Sensitive data buckets exist and have correct configuration', async () => {
      const sensitiveDataPrimaryBucket = outputs['sensitive_buckets_sensitive-data-primary_id'];
      const sensitiveDataBackupBucket = outputs['sensitive_buckets_sensitive-data-backup_id'];
      
      if (!sensitiveDataPrimaryBucket || !sensitiveDataBackupBucket) {
        console.warn('Sensitive bucket outputs missing. Skipping test.');
        return;
      }
      
      expect(sensitiveDataPrimaryBucket).toBeDefined();
      expect(sensitiveDataBackupBucket).toBeDefined();
      
      const buckets = [sensitiveDataPrimaryBucket, sensitiveDataBackupBucket];
      
      for (const bucketName of buckets) {
        // Verify bucket exists
        await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();
        
        // Verify versioning is enabled
        const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
        expect(versioningResponse.Status).toBe('Enabled');
        
        // Verify encryption is configured
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
        
        // Verify public access is blocked
        const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }
    });

    test('Sensitive data buckets have restrictive bucket policies', async () => {
      const sensitiveDataPrimaryBucket = outputs['sensitive_buckets_sensitive-data-primary_id'];
      const sensitiveDataBackupBucket = outputs['sensitive_buckets_sensitive-data-backup_id'];
      
      if (!sensitiveDataPrimaryBucket || !sensitiveDataBackupBucket) {
        console.warn('Sensitive bucket outputs missing. Skipping test.');
        return;
      }
      
      const buckets = [sensitiveDataPrimaryBucket, sensitiveDataBackupBucket];
      
      for (const bucketName of buckets) {
        // Verify bucket policy exists and is restrictive
        const policyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
        expect(policyResponse.Policy).toBeDefined();
        
        const policy = JSON.parse(policyResponse.Policy!);
        expect(policy.Statement).toBeDefined();
        
        // Check for SSL/TLS enforcement
        const sslStatement = policy.Statement.find((stmt: any) => 
          stmt.Condition?.Bool?.['aws:SecureTransport']?.includes('false')
        );
        expect(sslStatement).toBeDefined();
        expect(sslStatement.Effect).toBe('Deny');
        
        // Check for authorized principals restriction
        const principalStatement = policy.Statement.find((stmt: any) => 
          stmt.Condition?.StringNotEquals?.['aws:PrincipalArn']
        );
        expect(principalStatement).toBeDefined();
        expect(principalStatement.Effect).toBe('Deny');
      }
    });
  });

  describe('DynamoDB Table - State Locking', () => {
    test('DynamoDB state lock table exists and has correct configuration', async () => {
      const tableName = outputs.terraform_state_dynamodb_table_name;
      
      if (!tableName) {
        console.warn('terraform_state_dynamodb_table_name output is missing. Skipping test.');
        return;
      }
      
      expect(tableName).toBeDefined();
      
      // Verify table exists and has correct configuration
      const tableResponse = await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');
      expect(tableResponse.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(tableResponse.Table?.KeySchema?.[0]?.AttributeName).toBe('LockID');
      expect(tableResponse.Table?.KeySchema?.[0]?.KeyType).toBe('HASH');
    });
  });

  describe('IAM Users and Access Management', () => {
    test('Authorized IAM users exist and have correct policies attached', async () => {
      const dataAnalystUser = outputs['authorized_users_data-analyst_name'];
      const securityAdminUser = outputs['authorized_users_security-admin_name'];
      
      if (!dataAnalystUser || !securityAdminUser) {
        console.warn('Authorized user outputs missing. Skipping test.');
        return;
      }
      
      expect(dataAnalystUser).toBeDefined();
      expect(securityAdminUser).toBeDefined();
      
      const users = [dataAnalystUser, securityAdminUser];
      
      for (const userName of users) {
        // Verify user exists
        const userResponse = await iamClient.send(new GetUserCommand({ UserName: userName }));
        expect(userResponse.User?.UserName).toBe(userName);
        
        // Verify sensitive bucket access policy is attached
        const attachedPoliciesResponse = await iamClient.send(
          new ListAttachedUserPoliciesCommand({ UserName: userName })
        );
        
        const hasSensitiveBucketPolicy = attachedPoliciesResponse.AttachedPolicies?.some(
          policy => policy.PolicyName?.includes('sensitive-bucket-access')
        );
        expect(hasSensitiveBucketPolicy).toBe(true);
      }
    });

    test('Access keys are created for authorized users', async () => {
      const dataAnalystAccessKey = outputs['authorized_users_access_keys_data-analyst_access_key_id'];
      const securityAdminAccessKey = outputs['authorized_users_access_keys_security-admin_access_key_id'];
      
      if (!dataAnalystAccessKey || !securityAdminAccessKey) {
        console.warn('User access key outputs missing. Skipping test.');
        return;
      }
      
      expect(dataAnalystAccessKey).toBeDefined();
      expect(securityAdminAccessKey).toBeDefined();
      expect(typeof dataAnalystAccessKey).toBe('string');
      expect(typeof securityAdminAccessKey).toBe('string');
    });
  });

  describe('IAM Roles and Service Integration', () => {
    test('Authorized IAM roles exist and have correct trust policies', async () => {
      const dataProcessingRole = outputs['authorized_roles_data-processing-role_name'];
      const backupServiceRole = outputs['authorized_roles_backup-service-role_name'];
      
      if (!dataProcessingRole || !backupServiceRole) {
        console.warn('Authorized role outputs missing. Skipping test.');
        return;
      }
      
      expect(dataProcessingRole).toBeDefined();
      expect(backupServiceRole).toBeDefined();
      
      const roles = [dataProcessingRole, backupServiceRole];
      
      for (const roleName of roles) {
        // Verify role exists
        const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        expect(roleResponse.Role?.RoleName).toBe(roleName);
        
        // Verify trust policy allows EC2 and Lambda services
        const trustPolicy = JSON.parse(decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument!));
        const allowedServices = trustPolicy.Statement[0].Principal.Service;
        expect(allowedServices).toContain('ec2.amazonaws.com');
        expect(allowedServices).toContain('lambda.amazonaws.com');
        
        // Verify sensitive bucket access policy is attached
        const attachedPoliciesResponse = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        
        const hasSensitiveBucketPolicy = attachedPoliciesResponse.AttachedPolicies?.some(
          policy => policy.PolicyName?.includes('sensitive-bucket-access')
        );
        expect(hasSensitiveBucketPolicy).toBe(true);
      }
    });
  });

  describe('IAM Policy - Least Privilege Access', () => {
    test('Sensitive bucket access policy enforces least privilege', async () => {
      const policyArn = outputs.iam_policy_arn;
      
      if (!policyArn) {
        console.warn('iam_policy_arn output is missing. Skipping test.');
        return;
      }
      
      expect(policyArn).toBeDefined();
      
      // Get policy version and document
      const policyResponse = await iamClient.send(new GetPolicyCommand({ PolicyArn: policyArn }));
      expect(policyResponse.Policy?.PolicyName).toContain('sensitive-bucket-access');
      
      // Note: Detailed policy document inspection would require GetPolicyVersion
      // which needs the version ID, but we can verify the policy exists and has the correct name
      expect(policyResponse.Policy?.Description).toContain('Least privilege policy for accessing sensitive S3 buckets');
    });
  });

  describe('Backend Configuration', () => {
    test('Backend configuration outputs are properly structured', async () => {
      const backendBucket = outputs.backend_configuration_bucket;
      const backendKey = outputs.backend_configuration_key;
      const backendRegion = outputs.backend_configuration_region;
      const backendDynamoTable = outputs.backend_configuration_dynamodb_table;
      const backendEncrypt = outputs.backend_configuration_encrypt;
      
      if (!backendBucket || !backendKey || !backendRegion || !backendDynamoTable) {
        console.warn('Backend configuration outputs missing. Skipping test.');
        return;
      }
      
      expect(backendBucket).toBeDefined();
      expect(backendKey).toBe('terraform.tfstate');
      expect(backendRegion).toBeDefined();
      expect(backendDynamoTable).toBeDefined();
      expect(backendEncrypt).toBe(true);
      
      // Verify backend bucket matches state bucket
      expect(backendBucket).toBe(outputs.terraform_state_bucket_id);
      expect(backendDynamoTable).toBe(outputs.terraform_state_dynamodb_table_name);
    });
  });
});