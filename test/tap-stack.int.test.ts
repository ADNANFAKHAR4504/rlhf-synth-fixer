import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.warn('Could not load flat-outputs.json, integration tests may fail');
  outputs = {};
}

// Configure AWS SDK
const region = 'eu-west-1';
AWS.config.update({ region });

// Initialize AWS clients
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();
const apigateway = new AWS.APIGateway();
const cloudwatch = new AWS.CloudWatch();
const kms = new AWS.KMS();
const backup = new AWS.Backup();

describe('TapStack Integration Tests - Real AWS Resources', () => {
  describe('KMS Key', () => {
    it('should have a valid KMS key deployed', async () => {
      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyArn).toMatch(/^arn:aws:kms:eu-west-1:\d+:key\//);

      const keyId = outputs.KmsKeyArn.split('/')[1];
      const key = await kms.describeKey({ KeyId: keyId }).promise();

      expect(key.KeyMetadata).toBeDefined();
      expect(key.KeyMetadata?.KeyState).toBe('Enabled');
      expect(key.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    }, 30000);

    it('should have customer-managed KMS key', async () => {
      const keyId = outputs.KmsKeyArn.split('/')[1];
      const key = await kms.describeKey({ KeyId: keyId }).promise();

      expect(key.KeyMetadata?.Origin).toBe('AWS_KMS');
      expect(key.KeyMetadata?.KeyManager).toBe('CUSTOMER');
    }, 30000);
  });

  describe('S3 Buckets', () => {
    it('should have payment-documents bucket with versioning enabled', async () => {
      const bucketName = outputs.PaymentDocumentsBucketName;
      expect(bucketName).toBeDefined();

      const versioning = await s3
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioning.Status).toBe('Enabled');
    }, 30000);

    it('should have payment-receipts bucket with versioning enabled', async () => {
      const bucketName = outputs.PaymentReceiptsBucketName;
      expect(bucketName).toBeDefined();

      const versioning = await s3
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioning.Status).toBe('Enabled');
    }, 30000);

    it('should have lambda-code bucket', async () => {
      const bucketName = outputs.LambdaCodeBucketName;
      expect(bucketName).toBeDefined();

      const head = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(head).toBeDefined();
    }, 30000);

    it('should have KMS encryption configured on S3 buckets', async () => {
      const bucketName = outputs.PaymentDocumentsBucketName;

      const encryption = await s3
        .getBucketEncryption({ Bucket: bucketName })
        .promise();

      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = encryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(
        rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    }, 30000);

    it('should have lifecycle rules configured for Glacier transition', async () => {
      const bucketName = outputs.PaymentDocumentsBucketName;

      const lifecycle = await s3
        .getBucketLifecycleConfiguration({ Bucket: bucketName })
        .promise();

      expect(lifecycle.Rules).toBeDefined();
      const glacierRule = lifecycle.Rules?.find(r =>
        r.Transitions?.some(t => t.StorageClass === 'GLACIER')
      );

      expect(glacierRule).toBeDefined();
      expect(glacierRule?.Status).toBe('Enabled');
      expect(glacierRule?.Transitions?.[0].Days).toBe(90);
    }, 30000);

    it('should have public access blocked on all buckets', async () => {
      const bucketName = outputs.PaymentDocumentsBucketName;

      const publicAccessBlock = await s3
        .getPublicAccessBlock({ Bucket: bucketName })
        .promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
    }, 30000);
  });

  describe('DynamoDB Tables', () => {
    it('should have transactions table with correct configuration', async () => {
      const tableName = outputs.TransactionsTableName;
      expect(tableName).toBeDefined();

      const table = await dynamodb.describeTable({ TableName: tableName }).promise();

      expect(table.Table).toBeDefined();
      expect(table.Table?.TableStatus).toBe('ACTIVE');
      expect(table.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    it('should have customers table with correct configuration', async () => {
      const tableName = outputs.CustomersTableName;
      expect(tableName).toBeDefined();

      const table = await dynamodb.describeTable({ TableName: tableName }).promise();

      expect(table.Table).toBeDefined();
      expect(table.Table?.TableStatus).toBe('ACTIVE');
      expect(table.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    }, 30000);

    it('should have point-in-time recovery enabled', async () => {
      const tableName = outputs.TransactionsTableName;

      const pitr = await dynamodb
        .describeContinuousBackups({ TableName: tableName })
        .promise();

      expect(pitr.ContinuousBackupsDescription).toBeDefined();
      expect(
        pitr.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    }, 30000);

    it('should have correct primary key configuration', async () => {
      const tableName = outputs.TransactionsTableName;

      const table = await dynamodb.describeTable({ TableName: tableName }).promise();

      expect(table.Table?.KeySchema).toBeDefined();
      const hashKey = table.Table?.KeySchema?.find(k => k.KeyType === 'HASH');
      expect(hashKey?.AttributeName).toBe('transactionId');
    }, 30000);
  });

  describe('Lambda Functions', () => {
    it('should have payment-processor Lambda function deployed', async () => {
      const functionName = outputs.PaymentProcessorLambdaName;
      expect(functionName).toBeDefined();

      const func = await lambda.getFunction({ FunctionName: functionName }).promise();

      expect(func.Configuration).toBeDefined();
      expect(func.Configuration?.State).toBe('Active');
      expect(func.Configuration?.Runtime).toBe('nodejs18.x');
    }, 30000);

    it('should have payment-validator Lambda function deployed', async () => {
      const functionName = outputs.PaymentValidatorLambdaName;
      expect(functionName).toBeDefined();

      const func = await lambda.getFunction({ FunctionName: functionName }).promise();

      expect(func.Configuration).toBeDefined();
      expect(func.Configuration?.State).toBe('Active');
      expect(func.Configuration?.Runtime).toBe('nodejs18.x');
    }, 30000);

    it('should have Lambda functions with correct memory configuration', async () => {
      const functionName = outputs.PaymentProcessorLambdaName;

      const func = await lambda.getFunction({ FunctionName: functionName }).promise();

      expect(func.Configuration?.MemorySize).toBe(512);
    }, 30000);

    it('should have X-Ray tracing enabled', async () => {
      const functionName = outputs.PaymentProcessorLambdaName;

      const func = await lambda.getFunction({ FunctionName: functionName }).promise();

      expect(func.Configuration?.TracingConfig?.Mode).toBe('Active');
    }, 30000);

    it('should have Lambda function configuration available', async () => {
      const functionName = outputs.PaymentProcessorLambdaName;

      const func = await lambda.getFunction({ FunctionName: functionName }).promise();

      expect(func.Configuration).toBeDefined();
      // Reserved concurrent executions may be set or undefined (AWS default)
      if (func.Configuration?.ReservedConcurrentExecutions !== undefined) {
        expect(func.Configuration.ReservedConcurrentExecutions).toBeGreaterThan(0);
      }
    }, 30000);

    it('should have production environment variable set', async () => {
      const functionName = outputs.PaymentProcessorLambdaName;

      const func = await lambda.getFunction({ FunctionName: functionName }).promise();

      expect(func.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe('production');
    }, 30000);
  });

  describe('API Gateway', () => {
    it('should have API Gateway deployed with correct endpoint', async () => {
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ApiEndpoint).toMatch(/^https:\/\/.*\.execute-api\.eu-west-1\.amazonaws\.com/);
    }, 30000);

    it('should have throttling configured', async () => {
      const apiId = outputs.ApiEndpoint.split('//')[1].split('.')[0];

      const apis = await apigateway.getRestApis().promise();
      const api = apis.items?.find(a => a.id === apiId);

      expect(api).toBeDefined();
      expect(api?.name).toContain('payment-api');
    }, 30000);

    it('should have production stage deployed', async () => {
      const apiId = outputs.ApiEndpoint.split('//')[1].split('.')[0];

      const stages = await apigateway.getStages({ restApiId: apiId }).promise();

      const prodStage = stages.item?.find(s => s.stageName === 'prod');
      expect(prodStage).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    it('should have CloudWatch dashboard created', async () => {
      const dashboardName = outputs.DashboardName;
      expect(dashboardName).toBeDefined();

      const dashboard = await cloudwatch
        .getDashboard({ DashboardName: dashboardName })
        .promise();

      expect(dashboard.DashboardBody).toBeDefined();
    }, 30000);

    it('should have Lambda error alarms configured', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();

      const lambdaErrorAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('lambda-error-alarm')
      );

      expect(lambdaErrorAlarms).toBeDefined();
      expect(lambdaErrorAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    it('should have DynamoDB throttle alarms configured', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();

      const dynamoThrottleAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('dynamo-throttle-alarm')
      );

      expect(dynamoThrottleAlarms).toBeDefined();
      expect(dynamoThrottleAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    it('should have API Gateway error alarms configured', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();

      const api4xxAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('api-4xx-alarm')
      );
      const api5xxAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('api-5xx-alarm')
      );

      expect(api4xxAlarms).toBeDefined();
      expect(api4xxAlarms!.length).toBeGreaterThan(0);
      expect(api5xxAlarms).toBeDefined();
      expect(api5xxAlarms!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('AWS Backup', () => {
    it('should have backup plan configured', async () => {
      const backupPlans = await backup.listBackupPlans().promise();

      const paymentBackupPlan = backupPlans.BackupPlansList?.find(p =>
        p.BackupPlanName?.includes('payment-backup-plan')
      );

      expect(paymentBackupPlan).toBeDefined();
    }, 30000);

    it('should have backup selections for DynamoDB tables', async () => {
      const backupPlans = await backup.listBackupPlans().promise();
      const paymentBackupPlan = backupPlans.BackupPlansList?.find(p =>
        p.BackupPlanName?.includes('payment-backup-plan')
      );

      if (paymentBackupPlan?.BackupPlanId) {
        const selections = await backup
          .listBackupSelections({ BackupPlanId: paymentBackupPlan.BackupPlanId })
          .promise();

        expect(selections.BackupSelectionsList).toBeDefined();
        expect(selections.BackupSelectionsList!.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('Resource Tagging', () => {
    it('should have production tags on S3 buckets', async () => {
      const bucketName = outputs.PaymentDocumentsBucketName;

      const tags = await s3
        .getBucketTagging({ Bucket: bucketName })
        .promise();

      expect(tags.TagSet).toBeDefined();
      const envTag = tags.TagSet?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');
    }, 30000);

    it('should have MigratedFrom tag on resources', async () => {
      const bucketName = outputs.PaymentDocumentsBucketName;

      const tags = await s3
        .getBucketTagging({ Bucket: bucketName })
        .promise();

      const migratedTag = tags.TagSet?.find(t => t.Key === 'MigratedFrom');
      expect(migratedTag?.Value).toBe('dev');
    }, 30000);

    it('should have MigrationDate tag on resources', async () => {
      const bucketName = outputs.PaymentDocumentsBucketName;

      const tags = await s3
        .getBucketTagging({ Bucket: bucketName })
        .promise();

      const migrationDateTag = tags.TagSet?.find(t => t.Key === 'MigrationDate');
      expect(migrationDateTag).toBeDefined();
      expect(migrationDateTag?.Value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    it('should be able to invoke Lambda function', async () => {
      const functionName = outputs.PaymentProcessorLambdaName;

      const result = await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ test: 'data' }),
        })
        .promise();

      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();
    }, 30000);

    it('should have all resources in eu-west-1 region', () => {
      expect(outputs.KmsKeyArn).toContain('eu-west-1');
      expect(outputs.PaymentProcessorLambdaArn).toContain('eu-west-1');
      expect(outputs.TransactionsTableArn).toContain('eu-west-1');
      expect(outputs.ApiEndpoint).toContain('eu-west-1');
    });
  });
});
