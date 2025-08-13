import * as fs from 'fs';
import * as path from 'path';
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand 
} from '@aws-sdk/client-s3';
import { 
  DynamoDBClient, 
  DescribeTableCommand,
  DescribeContinuousBackupsCommand 
} from '@aws-sdk/client-dynamodb';
import { 
  IAMClient, 
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  GetOpenIDConnectProviderCommand 
} from '@aws-sdk/client-iam';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';

// Load outputs from deployment
function loadDeploymentOutputs() {
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Deployment outputs not found at ${outputsPath}. Run deployment first.`);
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any;
  let s3Client: S3Client;
  let dynamoClient: DynamoDBClient;
  let iamClient: IAMClient;
  let logsClient: CloudWatchLogsClient;
  
  beforeAll(async () => {
    // Load deployment outputs
    outputs = loadDeploymentOutputs();
    
    // Initialize AWS SDK clients
    const region = outputs.aws_region || 'us-east-1';
    s3Client = new S3Client({ region });
    dynamoClient = new DynamoDBClient({ region });
    iamClient = new IAMClient({ region });
    logsClient = new CloudWatchLogsClient({ region });
  });

  describe('S3 Bucket - Artifacts', () => {
    test('artifacts bucket exists and is accessible', async () => {
      const bucketName = outputs.artifacts_bucket_name;
      expect(bucketName).toBeDefined();
      
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('artifacts bucket has versioning enabled', async () => {
      const bucketName = outputs.artifacts_bucket_name;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('artifacts bucket has encryption configured', async () => {
      const bucketName = outputs.artifacts_bucket_name;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.BucketKeyEnabled).toBe(true);
    });

    test('artifacts bucket has public access blocked', async () => {
      const bucketName = outputs.artifacts_bucket_name;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('S3 Bucket - Terraform State', () => {
    test('terraform state bucket exists and is accessible', async () => {
      const bucketName = outputs.terraform_state_bucket_name;
      expect(bucketName).toBeDefined();
      
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('terraform state bucket has versioning enabled', async () => {
      const bucketName = outputs.terraform_state_bucket_name;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('terraform state bucket has encryption configured', async () => {
      const bucketName = outputs.terraform_state_bucket_name;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('DynamoDB Table - Terraform Locks', () => {
    test('terraform locks table exists and is accessible', async () => {
      const tableName = outputs.terraform_locks_table_name;
      expect(tableName).toBeDefined();
      
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      
      expect(response.Table?.TableName).toBe(tableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('terraform locks table has correct schema', async () => {
      const tableName = outputs.terraform_locks_table_name;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      
      expect(response.Table?.KeySchema).toEqual([
        { AttributeName: 'LockID', KeyType: 'HASH' }
      ]);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('terraform locks table has point-in-time recovery enabled', async () => {
      const tableName = outputs.terraform_locks_table_name;
      const command = new DescribeContinuousBackupsCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      
      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    test('terraform locks table does not have deletion protection', async () => {
      const tableName = outputs.terraform_locks_table_name;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      
      // Deletion protection should be false for rollback capability
      expect(response.Table?.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('IAM Role - CircleCI', () => {
    test('circleci role exists and is accessible', async () => {
      const roleArn = outputs.circleci_role_arn;
      const roleName = outputs.circleci_role_name;
      expect(roleArn).toBeDefined();
      expect(roleName).toBeDefined();
      
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.Arn).toBe(roleArn);
    });

    test('circleci role has correct trust policy', async () => {
      const roleName = outputs.circleci_role_name;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || ''));
      expect(trustPolicy.Statement).toContainEqual(
        expect.objectContaining({
          Effect: 'Allow',
          Action: 'sts:AssumeRoleWithWebIdentity',
          Principal: expect.objectContaining({
            Federated: expect.stringContaining('oidc.circleci.com')
          })
        })
      );
    });

    test('circleci role has required policies attached', async () => {
      const roleName = outputs.circleci_role_name;
      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      const policyNames = response.PolicyNames || [];
      expect(policyNames.length).toBeGreaterThan(0);
      expect(policyNames.some(name => name.includes('s3'))).toBe(true);
      expect(policyNames.some(name => name.includes('dynamodb'))).toBe(true);
      expect(policyNames.some(name => name.includes('logs'))).toBe(true);
    });

    test('circleci role S3 policy allows bucket operations', async () => {
      const roleName = outputs.circleci_role_name;
      const listResponse = await iamClient.send(new ListRolePoliciesCommand({ RoleName: roleName }));
      const s3PolicyName = listResponse.PolicyNames?.find(name => name.includes('s3'));
      
      expect(s3PolicyName).toBeDefined();
      
      const policyResponse = await iamClient.send(new GetRolePolicyCommand({ 
        RoleName: roleName,
        PolicyName: s3PolicyName! 
      }));
      
      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || ''));
      const statements = policy.Statement;
      
      expect(statements.some((stmt: any) => 
        stmt.Action.includes('s3:GetObject') && stmt.Action.includes('s3:PutObject')
      )).toBe(true);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('application log group exists', async () => {
      const logGroupName = outputs.cloudwatch_log_group_name;
      expect(logGroupName).toBeDefined();
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);
      
      expect(response.logGroups?.some(group => group.logGroupName === logGroupName)).toBe(true);
    });

    test('pipeline log group exists', async () => {
      const pipelineLogGroupName = outputs.cloudwatch_pipeline_log_group_name;
      expect(pipelineLogGroupName).toBeDefined();
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: pipelineLogGroupName
      });
      const response = await logsClient.send(command);
      
      expect(response.logGroups?.some(group => group.logGroupName === pipelineLogGroupName)).toBe(true);
    });

    test('log groups have proper retention settings', async () => {
      const logGroupName = outputs.cloudwatch_log_group_name;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find(group => group.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBe(14);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('all output values are properly formatted and contain environment suffix', () => {
      const envSuffix = outputs.environment_suffix;
      expect(envSuffix).toBeDefined();
      
      // All resource names should include the environment suffix
      expect(outputs.artifacts_bucket_name).toContain(envSuffix);
      expect(outputs.terraform_state_bucket_name).toContain(envSuffix);
      expect(outputs.terraform_locks_table_name).toContain(envSuffix);
      expect(outputs.circleci_role_name).toContain(envSuffix);
    });

    test('deployment outputs contain all required fields', () => {
      const requiredFields = [
        'artifacts_bucket_name',
        'terraform_state_bucket_name',
        'terraform_locks_table_name',
        'circleci_role_arn',
        'circleci_role_name',
        'cloudwatch_log_group_name',
        'aws_account_id',
        'aws_region',
        'environment_suffix',
        'project_name'
      ];
      
      requiredFields.forEach(field => {
        expect(outputs[field]).toBeDefined();
        expect(typeof outputs[field]).toBe('string');
        expect(outputs[field]).not.toBe('');
      });
    });

    test('resources are properly connected for CI/CD workflow', async () => {
      // Verify that the CircleCI role can access the created buckets
      const roleName = outputs.circleci_role_name;
      const artifactsBucket = outputs.artifacts_bucket_name;
      const stateBucket = outputs.terraform_state_bucket_name;
      
      const listResponse = await iamClient.send(new ListRolePoliciesCommand({ RoleName: roleName }));
      const s3PolicyName = listResponse.PolicyNames?.find(name => name.includes('s3'));
      
      const policyResponse = await iamClient.send(new GetRolePolicyCommand({ 
        RoleName: roleName,
        PolicyName: s3PolicyName! 
      }));
      
      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || ''));
      const s3Resources = policy.Statement.find((stmt: any) => stmt.Action.includes('s3:GetObject'))?.Resource || [];
      
      expect(s3Resources.some((resource: string) => resource.includes(artifactsBucket))).toBe(true);
      expect(s3Resources.some((resource: string) => resource.includes(stateBucket))).toBe(true);
    });
  });
});
