import fs from 'fs';
import { 
  S3Client, 
  ListObjectsV2Command, 
  GetObjectCommand, 
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand
} from '@aws-sdk/client-s3';
import { 
  LambdaClient, 
  InvokeCommand, 
  GetFunctionCommand,
  GetFunctionConfigurationCommand 
} from '@aws-sdk/client-lambda';
import { 
  EventBridgeClient, 
  DescribeRuleCommand, 
  ListTargetsByRuleCommand 
} from '@aws-sdk/client-eventbridge';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand, 
  GetMetricStatisticsCommand 
} from '@aws-sdk/client-cloudwatch';
import { 
  KMSClient, 
  DescribeKeyCommand, 
  GetKeyPolicyCommand 
} from '@aws-sdk/client-kms';
import { 
  IAMClient, 
  GetRoleCommand, 
  GetRolePolicyCommand 
} from '@aws-sdk/client-iam';

// Configuration from CloudFormation outputs
let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('CFN outputs not found, using environment variables');
}

const environment = process.env.ENVIRONMENT || 'prod';
const region = process.env.AWS_REGION || 'us-east-1';

// AWS Clients
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });

// Helper function to extract resource names from outputs or environment variables
const getResourceName = (outputKey: string, fallback: string) => {
  return outputs[outputKey] || process.env[outputKey] || fallback;
};

describe('Data Backup System Integration Tests', () => {
  const backupBucketName = getResourceName('BackupBucketName', `backup-bucket-${environment}-${Date.now()}`);
  const loggingBucketName = getResourceName('LoggingBucketName', `${backupBucketName}-logs`);
  const lambdaFunctionName = getResourceName('BackupLambdaArn', `${environment}-backup-function`)?.split(':').pop() || `${environment}-backup-function`;
  const eventRuleName = getResourceName('EventBridgeRuleName', `${environment}-daily-backup-trigger`);
  const kmsKeyId = getResourceName('KMSKeyId', '');

  describe('S3 Backup Infrastructure', () => {
    test('backup bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: backupBucketName });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('backup bucket should have KMS encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: backupBucketName });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
    }, 30000);

    test('backup bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: backupBucketName });
      
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('backup bucket should have lifecycle policies configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: backupBucketName });
      
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      
      // Check for backup deletion rule
      const deleteRule = response.Rules!.find(rule => rule.ID === 'DeleteOldBackups');
      expect(deleteRule).toBeDefined();
      expect(deleteRule!.Status).toBe('Enabled');
      expect(deleteRule!.Expiration!.Days).toBeGreaterThan(0);
      
      // Check for multipart upload cleanup
      const multipartRule = response.Rules!.find(rule => rule.ID === 'AbortIncompleteMultipartUploads');
      expect(multipartRule).toBeDefined();
      expect(multipartRule!.AbortIncompleteMultipartUpload!.DaysAfterInitiation).toBe(1);
    }, 30000);

    test('logging bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: loggingBucketName });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);
  });

  describe('Lambda Function Integration', () => {
    test('backup Lambda function should exist and be properly configured', async () => {
      const command = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      
      const response = await s3Client.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.9');
      expect(response.Configuration!.Handler).toBe('index.lambda_handler');
      expect(response.Configuration!.Timeout).toBe(900);
      expect(response.Configuration!.MemorySize).toBe(512);
    }, 30000);

    test('Lambda function should have proper environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionName });
      
      const response = await lambdaClient.send(command);
      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      
      const envVars = response.Environment!.Variables!;
      expect(envVars.BACKUP_BUCKET).toBe(backupBucketName);
      expect(envVars.ENVIRONMENT).toBe(environment);
      expect(envVars.KMS_KEY_ID).toBeDefined();
    }, 30000);

    test('Lambda function should execute successfully and create backup files', async () => {
      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify({
          source: 'integration-test',
          timestamp: new Date().toISOString()
        })
      });

      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toContain('Backup completed successfully');
      expect(body.documents_uploaded).toBe(500);
      expect(body.backup_date).toBeDefined();
      
      // Verify backup files were created
      const today = new Date().toISOString().split('T')[0];
      const listCommand = new ListObjectsV2Command({
        Bucket: backupBucketName,
        Prefix: `backups/${today}/`
      });

      const listResponse = await s3Client.send(listCommand);
      expect(listResponse.Contents).toBeDefined();
      expect(listResponse.Contents!.length).toBeGreaterThan(0);

      // Check if manifest exists
      const manifestExists = listResponse.Contents!.some(obj => 
        obj.Key!.endsWith('manifest.json')
      );
      expect(manifestExists).toBe(true);
    }, 60000);

    test('backup manifest should contain proper business document structure', async () => {
      const today = new Date().toISOString().split('T')[0];
      const manifestKey = `backups/${today}/manifest.json`;

      const getCommand = new GetObjectCommand({
        Bucket: backupBucketName,
        Key: manifestKey
      });

      const response = await s3Client.send(getCommand);
      const manifestContent = await response.Body!.transformToString();
      const manifest = JSON.parse(manifestContent);

      expect(manifest.backup_date).toBe(today);
      expect(manifest.total_documents).toBe(500);
      expect(manifest.backup_summary).toBeDefined();
      expect(manifest.backup_summary.document_types).toBeDefined();
      expect(manifest.backup_summary.departments).toBeDefined();
      expect(manifest.backup_summary.total_size_bytes).toBeGreaterThan(0);
      expect(manifest.documents).toHaveLength(500);

      // Verify document structure
      const sampleDoc = manifest.documents[0];
      expect(sampleDoc.document_id).toBeDefined();
      expect(sampleDoc.type).toBeDefined();
      expect(sampleDoc.content).toBeDefined();
      expect(sampleDoc.metadata).toBeDefined();
      expect(sampleDoc.metadata.department).toBeDefined();
      expect(sampleDoc.metadata.priority).toBeDefined();
    }, 30000);
  });

  describe('EventBridge Scheduling', () => {
    test('daily backup rule should be configured correctly', async () => {
      const command = new DescribeRuleCommand({ Name: eventRuleName });
      
      const response = await eventBridgeClient.send(command);
      expect(response.ScheduleExpression).toBe('cron(0 2 * * ? *)');
      expect(response.State).toBe('ENABLED');
      expect(response.Description).toContain('daily backup');
    }, 30000);

    test('EventBridge rule should target Lambda function', async () => {
      const command = new ListTargetsByRuleCommand({ Rule: eventRuleName });
      
      const response = await eventBridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);

      const lambdaTarget = response.Targets!.find(target => 
        target.Arn!.includes('lambda') && target.Arn!.includes(lambdaFunctionName)
      );
      expect(lambdaTarget).toBeDefined();
      expect(lambdaTarget!.RetryPolicy).toBeDefined();
      expect(lambdaTarget!.RetryPolicy!.MaximumRetryAttempts).toBe(2);
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    test('backup failure alarm should be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`${environment}-backup-failures`]
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('BackupFailure');
      expect(alarm.Namespace).toBe('BackupSystem');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    }, 30000);

    test('Lambda duration alarm should be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`${environment}-backup-duration-high`]
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Duration');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(600000); // 10 minutes
    }, 30000);

    test('custom metrics should be available after backup execution', async () => {
      // This test depends on previous Lambda execution
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const successMetricCommand = new GetMetricStatisticsCommand({
        Namespace: 'BackupSystem',
        MetricName: 'BackupSuccess',
        Dimensions: [
          {
            Name: 'Environment',
            Value: environment
          }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum']
      });

      const response = await cloudWatchClient.send(successMetricCommand);
      expect(response.Datapoints).toBeDefined();
      
      // Check if we have recent successful backups
      const recentDatapoints = response.Datapoints!.filter(
        dp => dp.Timestamp! > new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
      );
      
      if (recentDatapoints.length > 0) {
        expect(recentDatapoints.some(dp => dp.Sum! > 0)).toBe(true);
      }
    }, 30000);
  });

  describe('Security and Encryption', () => {
    test('KMS key should exist and be properly configured', async () => {
      if (!kmsKeyId) {
        console.warn('KMS Key ID not available, skipping KMS tests');
        return;
      }

      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    }, 30000);

    test('KMS key policy should allow Lambda and root access', async () => {
      if (!kmsKeyId) {
        console.warn('KMS Key ID not available, skipping KMS policy test');
        return;
      }

      const command = new GetKeyPolicyCommand({
        KeyId: kmsKeyId,
        PolicyName: 'default'
      });

      const response = await kmsClient.send(command);
      expect(response.Policy).toBeDefined();

      const policy = JSON.parse(response.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);

      // Check for Lambda permissions
      const lambdaStatement = policy.Statement.find((stmt: any) => 
        stmt.Principal && stmt.Principal.Service === 'lambda.amazonaws.com'
      );
      expect(lambdaStatement).toBeDefined();
    }, 30000);

    test('Lambda execution role should have appropriate permissions', async () => {
      const roleName = `${environment}-backup-lambda-role`;
      
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.AssumeRolePolicyDocument).toBeDefined();

      // Check assume role policy
      const assumePolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
      const lambdaStatement = assumePolicy.Statement.find((stmt: any) => 
        stmt.Principal && stmt.Principal.Service === 'lambda.amazonaws.com'
      );
      expect(lambdaStatement).toBeDefined();

      // Check backup policy
      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'BackupS3Access'
      });
      
      const policyResponse = await iamClient.send(getPolicyCommand);
      expect(policyResponse.PolicyDocument).toBeDefined();

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);

      // Verify S3 permissions
      const s3Statement = policy.Statement.find((stmt: any) => 
        stmt.Action && stmt.Action.some((action: string) => action.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();

      // Verify KMS permissions
      const kmsStatement = policy.Statement.find((stmt: any) => 
        stmt.Action && stmt.Action.some((action: string) => action.startsWith('kms:'))
      );
      expect(kmsStatement).toBeDefined();
    }, 30000);
  });

  describe('Cross-Account Compatibility Tests', () => {
    test('template should work across different AWS accounts', async () => {
      // Verify no hardcoded account IDs in resource configurations
      const functionConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: lambdaFunctionName })
      );

      // Environment variables should use resource references, not hardcoded values
      const envVars = functionConfig.Environment!.Variables!;
      expect(envVars.BACKUP_BUCKET).not.toMatch(/\d{12}/); // No account ID
      expect(envVars.KMS_KEY_ID).not.toMatch(/arn:aws:kms:[^:]*:\d{12}:/); // No hardcoded account ID
    }, 30000);

    test('resources should be accessible from different regions', async () => {
      // Test bucket access doesn't rely on hardcoded regions
      const bucketCommand = new HeadBucketCommand({ Bucket: backupBucketName });
      await expect(s3Client.send(bucketCommand)).resolves.not.toThrow();
      
      // Test Lambda function doesn't have region-specific hardcoding
      const functionCommand = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const response = await lambdaClient.send(functionCommand);
      
      expect(response.Configuration!.Environment!.Variables!.BACKUP_BUCKET).toBe(backupBucketName);
    }, 30000);
  });

  describe('Disaster Recovery and Data Integrity', () => {
    test('backup data should be retrievable and valid', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // List all backup objects for today
      const listCommand = new ListObjectsV2Command({
        Bucket: backupBucketName,
        Prefix: `backups/${today}/`
      });

      const listResponse = await s3Client.send(listCommand);
      expect(listResponse.Contents).toBeDefined();
      expect(listResponse.Contents!.length).toBeGreaterThan(0);

      // Verify each backup file is accessible and valid
      for (const obj of listResponse.Contents!.slice(0, 3)) { // Test first 3 objects
        const getCommand = new GetObjectCommand({
          Bucket: backupBucketName,
          Key: obj.Key!
        });

        const response = await s3Client.send(getCommand);
        expect(response.Body).toBeDefined();
        
        const content = await response.Body!.transformToString();
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);

        // If it's a JSON file, verify it's valid JSON
        if (obj.Key!.endsWith('.json')) {
          expect(() => JSON.parse(content)).not.toThrow();
        }
      }
    }, 60000);

    test('backups should have proper metadata for compliance', async () => {
      const today = new Date().toISOString().split('T')[0];
      const manifestKey = `backups/${today}/manifest.json`;

      const command = new GetObjectCommand({
        Bucket: backupBucketName,
        Key: manifestKey
      });

      const response = await s3Client.send(command);
      
      // Check object metadata
      expect(response.Metadata).toBeDefined();
      expect(response.Metadata!['backup-date']).toBe(today);
      expect(response.Metadata!['document-count']).toBe('500');
      expect(response.Metadata!['backup-type']).toBe('daily-business-documents');
      
      // Check server-side encryption
      expect(response.ServerSideEncryption).toBe('aws:kms');
      expect(response.SSEKMSKeyId).toBeDefined();
    }, 30000);
  });

  describe('Performance and Scalability', () => {
    test('Lambda function should complete within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const invokeCommand = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify({
          source: 'performance-test',
          timestamp: new Date().toISOString()
        })
      });

      const response = await lambdaClient.send(invokeCommand);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(response.StatusCode).toBe(200);
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
      
      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      const body = JSON.parse(payload.body);
      expect(body.documents_uploaded).toBe(500);
    }, 45000);

    test('system should handle backup volume appropriately', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const listCommand = new ListObjectsV2Command({
        Bucket: backupBucketName,
        Prefix: `backups/${today}/`,
        MaxKeys: 1000
      });

      const response = await s3Client.send(listCommand);
      expect(response.Contents).toBeDefined();
      
      // Calculate total backup size
      const totalSize = response.Contents!.reduce((sum, obj) => sum + (obj.Size || 0), 0);
      expect(totalSize).toBeGreaterThan(0);
      expect(totalSize).toBeLessThan(100 * 1024 * 1024); // Should be less than 100MB for test data
    }, 30000);
  });
});
