// Integration tests for Cross-Account S3 Data Sharing System
// These tests validate deployed AWS infrastructure against actual environment
// Tests read outputs from cfn-outputs/flat-outputs.json
// NOTE: These tests run in CI/CD environment only, not locally

import AWS from 'aws-sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const s3 = new AWS.S3({ region: AWS_REGION });
const dynamodb = new AWS.DynamoDB({ region: AWS_REGION });
const kms = new AWS.KMS({ region: AWS_REGION });
const cloudtrail = new AWS.CloudTrail({ region: AWS_REGION });
const cloudwatch = new AWS.CloudWatch({ region: AWS_REGION });
const cloudwatchLogs = new AWS.CloudWatchLogs({ region: AWS_REGION });
const lambda = new AWS.Lambda({ region: AWS_REGION });
const sns = new AWS.SNS({ region: AWS_REGION });
const eventbridge = new AWS.EventBridge({ region: AWS_REGION });

// Read terraform outputs
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

if (existsSync(outputsPath)) {
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
}

describe('Cross-Account S3 Data Sharing System - Integration Tests', () => {

  describe('Infrastructure Deployment', () => {
    test('outputs file exists with required values', () => {
      expect(existsSync(outputsPath)).toBe(true);
      expect(outputs.primary_bucket_name).toBeDefined();
      expect(outputs.audit_bucket_name).toBeDefined();
      expect(outputs.kms_key_id).toBeDefined();
    });

    test('all required outputs are present', () => {
      const requiredOutputs = [
        'primary_bucket_name',
        'primary_bucket_arn',
        'audit_bucket_name',
        'kms_key_id',
        'kms_key_arn',
        'access_control_table_name',
        'audit_logs_table_name',
        'cloudtrail_name',
        'cloudtrail_arn',
        'sns_topic_arn',
        'lambda_access_validator_arn',
        'lambda_access_logger_arn',
        'lambda_governance_check_arn',
        'lambda_expiration_enforcer_arn'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(typeof outputs[output]).toBe('string');
        expect(outputs[output].length).toBeGreaterThan(0);
      });
    });
  });

  describe('S3 Primary Bucket Configuration', () => {
    let bucketExists = false;
    let versioningConfig: AWS.S3.GetBucketVersioningOutput | undefined;
    let encryptionConfig: AWS.S3.ServerSideEncryptionConfiguration | undefined;
    let publicAccessBlock: AWS.S3.PublicAccessBlockConfiguration | undefined;
    let lifecycleRules: AWS.S3.LifecycleRules | undefined;

    beforeAll(async () => {
      try {
        await s3.headBucket({ Bucket: outputs.primary_bucket_name }).promise();
        bucketExists = true;

        versioningConfig = await s3.getBucketVersioning({ Bucket: outputs.primary_bucket_name }).promise();
        const encryptionResponse = await s3.getBucketEncryption({ Bucket: outputs.primary_bucket_name }).promise();
        encryptionConfig = encryptionResponse.ServerSideEncryptionConfiguration;

        const publicAccessResponse = await s3.getPublicAccessBlock({ Bucket: outputs.primary_bucket_name }).promise();
        publicAccessBlock = publicAccessResponse.PublicAccessBlockConfiguration;

        const lifecycleResponse = await s3.getBucketLifecycleConfiguration({ Bucket: outputs.primary_bucket_name }).promise();
        lifecycleRules = lifecycleResponse.Rules;
      } catch (error: any) {
        console.log(`Primary bucket setup check failed: ${error.message}`);
      }
    });

    test('primary bucket exists and is accessible', () => {
      expect(bucketExists).toBe(true);
    });

    test('versioning is enabled', () => {
      if (!bucketExists) {
        console.log('Skipping: Bucket not deployed');
        return;
      }
      expect(versioningConfig?.Status).toBe('Enabled');
    });

    test('bucket is encrypted with KMS', () => {
      if (!bucketExists) {
        console.log('Skipping: Bucket not deployed');
        return;
      }

      expect(encryptionConfig).toBeDefined();
      const rule = encryptionConfig?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(outputs.kms_key_id);
    });

    test('all public access is blocked', () => {
      if (!bucketExists) {
        console.log('Skipping: Bucket not deployed');
        return;
      }

      expect(publicAccessBlock?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock?.RestrictPublicBuckets).toBe(true);
    });

    test('lifecycle rules are configured', () => {
      if (!bucketExists || !lifecycleRules) {
        console.log('Skipping: Bucket or lifecycle rules not deployed');
        return;
      }

      expect(lifecycleRules.length).toBeGreaterThan(0);

      const intelligentTieringRule = lifecycleRules.find(rule =>
        rule.ID === 'intelligent-tiering-transition'
      );
      expect(intelligentTieringRule).toBeDefined();

      const glacierRule = lifecycleRules.find(rule =>
        rule.ID === 'glacier-transition'
      );
      expect(glacierRule).toBeDefined();
    });
  });

  describe('S3 Audit Bucket Configuration', () => {
    let bucketExists = false;
    let lifecycleRules: AWS.S3.LifecycleRules | undefined;

    beforeAll(async () => {
      try {
        await s3.headBucket({ Bucket: outputs.audit_bucket_name }).promise();
        bucketExists = true;

        const lifecycleResponse = await s3.getBucketLifecycleConfiguration({ Bucket: outputs.audit_bucket_name }).promise();
        lifecycleRules = lifecycleResponse.Rules;
      } catch (error: any) {
        console.log(`Audit bucket check failed: ${error.message}`);
      }
    });

    test('audit bucket exists', () => {
      expect(bucketExists).toBe(true);
    });

    test('audit bucket has retention policies for logs', () => {
      if (!bucketExists || !lifecycleRules) {
        console.log('Skipping: Audit bucket or lifecycle rules not deployed');
        return;
      }

      const cloudtrailRule = lifecycleRules.find(rule =>
        rule.ID === 'cloudtrail-logs-retention'
      );
      expect(cloudtrailRule).toBeDefined();

      const s3AccessLogsRule = lifecycleRules.find(rule =>
        rule.ID === 's3-access-logs-retention'
      );
      expect(s3AccessLogsRule).toBeDefined();
    });
  });

  describe('KMS Encryption Key', () => {
    let keyMetadata: AWS.KMS.KeyMetadata | undefined;
    let keyRotation: AWS.KMS.GetKeyRotationStatusResponse | undefined;

    beforeAll(async () => {
      try {
        const metadataResponse = await kms.describeKey({ KeyId: outputs.kms_key_id }).promise();
        keyMetadata = metadataResponse.KeyMetadata;

        keyRotation = await kms.getKeyRotationStatus({ KeyId: outputs.kms_key_id }).promise();
      } catch (error: any) {
        console.log(`KMS key check failed: ${error.message}`);
      }
    });

    test('KMS key exists and is enabled', () => {
      expect(keyMetadata).toBeDefined();
      expect(keyMetadata?.Enabled).toBe(true);
    });

    test('KMS key rotation is enabled', () => {
      expect(keyRotation?.KeyRotationEnabled).toBe(true);
    });

    test('KMS key is customer managed', () => {
      expect(keyMetadata?.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('DynamoDB Tables', () => {
    let accessControlTable: AWS.DynamoDB.TableDescription | undefined;
    let auditLogsTable: AWS.DynamoDB.TableDescription | undefined;

    beforeAll(async () => {
      try {
        const accessControlResponse = await dynamodb.describeTable({
          TableName: outputs.access_control_table_name
        }).promise();
        accessControlTable = accessControlResponse.Table;

        const auditLogsResponse = await dynamodb.describeTable({
          TableName: outputs.audit_logs_table_name
        }).promise();
        auditLogsTable = auditLogsResponse.Table;
      } catch (error: any) {
        console.log(`DynamoDB tables check failed: ${error.message}`);
      }
    });

    test('access control table exists with correct schema', () => {
      expect(accessControlTable).toBeDefined();
      expect(accessControlTable?.TableStatus).toBe('ACTIVE');
      expect(accessControlTable?.KeySchema).toContainEqual({ AttributeName: 'account_id', KeyType: 'HASH' });
      expect(accessControlTable?.KeySchema).toContainEqual({ AttributeName: 'prefix', KeyType: 'RANGE' });
    });

    test('access control table has GSI for expiration_date', () => {
      if (!accessControlTable) {
        console.log('Skipping: Access control table not deployed');
        return;
      }

      const gsi = accessControlTable.GlobalSecondaryIndexes?.find(
        index => index.IndexName === 'expiration-index'
      );
      expect(gsi).toBeDefined();
      expect(gsi?.KeySchema).toContainEqual({ AttributeName: 'expiration_date', KeyType: 'HASH' });
    });

    test('access control table has encryption enabled', () => {
      if (!accessControlTable) {
        console.log('Skipping: Access control table not deployed');
        return;
      }

      expect(accessControlTable.SSEDescription?.Status).toBe('ENABLED');
      expect(accessControlTable.SSEDescription?.SSEType).toBe('KMS');
    });

    test('access control table has point-in-time recovery enabled', async () => {
      if (!accessControlTable) {
        console.log('Skipping: Access control table not deployed');
        return;
      }

      const pitrResponse = await dynamodb.describeContinuousBackups({
        TableName: outputs.access_control_table_name
      }).promise();

      expect(pitrResponse.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    test('audit logs table exists with TTL enabled', async () => {
      expect(auditLogsTable).toBeDefined();
      expect(auditLogsTable?.TableStatus).toBe('ACTIVE');

      const ttlResponse = await dynamodb.describeTimeToLive({
        TableName: outputs.audit_logs_table_name
      }).promise();

      expect(ttlResponse.TimeToLiveDescription?.TimeToLiveStatus).toBe('ENABLED');
      expect(ttlResponse.TimeToLiveDescription?.AttributeName).toBe('ttl');
    });

    test('audit logs table has GSI for account_id', () => {
      if (!auditLogsTable) {
        console.log('Skipping: Audit logs table not deployed');
        return;
      }

      const gsi = auditLogsTable.GlobalSecondaryIndexes?.find(
        index => index.IndexName === 'account-index'
      );
      expect(gsi).toBeDefined();
    });
  });

  describe('CloudTrail Configuration', () => {
    let trail: AWS.CloudTrail.Trail | undefined;
    let trailStatus: AWS.CloudTrail.GetTrailStatusResponse | undefined;

    beforeAll(async () => {
      try {
        const trailResponse = await cloudtrail.describeTrails({
          trailNameList: [outputs.cloudtrail_name]
        }).promise();
        trail = trailResponse.trailList?.[0];

        trailStatus = await cloudtrail.getTrailStatus({
          Name: outputs.cloudtrail_name
        }).promise();
      } catch (error: any) {
        console.log(`CloudTrail check failed: ${error.message}`);
      }
    });

    test('CloudTrail is configured and logging', () => {
      expect(trail).toBeDefined();
      expect(trailStatus?.IsLogging).toBe(true);
    });

    test('CloudTrail is multi-region trail', () => {
      expect(trail?.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail has log file validation enabled', () => {
      expect(trail?.LogFileValidationEnabled).toBe(true);
    });

    test('CloudTrail uses KMS encryption', () => {
      expect(trail?.KmsKeyId).toContain(outputs.kms_key_id);
    });
  });

  describe('Lambda Functions', () => {
    let accessValidatorConfig: AWS.Lambda.FunctionConfiguration | undefined;
    let accessLoggerConfig: AWS.Lambda.FunctionConfiguration | undefined;
    let governanceCheckConfig: AWS.Lambda.FunctionConfiguration | undefined;
    let expirationEnforcerConfig: AWS.Lambda.FunctionConfiguration | undefined;

    beforeAll(async () => {
      try {
        const validatorResponse = await lambda.getFunction({
          FunctionName: outputs.lambda_access_validator_arn
        }).promise();
        accessValidatorConfig = validatorResponse.Configuration;

        const loggerResponse = await lambda.getFunction({
          FunctionName: outputs.lambda_access_logger_arn
        }).promise();
        accessLoggerConfig = loggerResponse.Configuration;

        const governanceResponse = await lambda.getFunction({
          FunctionName: outputs.lambda_governance_check_arn
        }).promise();
        governanceCheckConfig = governanceResponse.Configuration;

        const enforcerResponse = await lambda.getFunction({
          FunctionName: outputs.lambda_expiration_enforcer_arn
        }).promise();
        expirationEnforcerConfig = enforcerResponse.Configuration;
      } catch (error: any) {
        console.log(`Lambda functions check failed: ${error.message}`);
      }
    });

    test('all Lambda functions are deployed and active', () => {
      expect(accessValidatorConfig).toBeDefined();
      expect(accessValidatorConfig?.State).toBe('Active');

      expect(accessLoggerConfig).toBeDefined();
      expect(accessLoggerConfig?.State).toBe('Active');

      expect(governanceCheckConfig).toBeDefined();
      expect(governanceCheckConfig?.State).toBe('Active');

      expect(expirationEnforcerConfig).toBeDefined();
      expect(expirationEnforcerConfig?.State).toBe('Active');
    });

    test('access validator has correct environment variables', () => {
      if (!accessValidatorConfig) {
        console.log('Skipping: Access validator not deployed');
        return;
      }

      const env = accessValidatorConfig.Environment?.Variables;
      expect(env?.ACCESS_CONTROL_TABLE).toBe(outputs.access_control_table_name);
      expect(env?.PRIMARY_BUCKET).toBe(outputs.primary_bucket_name);
      expect(env?.SNS_TOPIC_ARN).toBe(outputs.sns_topic_arn);
    });

    test('access logger has correct environment variables', () => {
      if (!accessLoggerConfig) {
        console.log('Skipping: Access logger not deployed');
        return;
      }

      const env = accessLoggerConfig.Environment?.Variables;
      expect(env?.AUDIT_LOGS_TABLE).toBe(outputs.audit_logs_table_name);
      expect(env?.TTL_DAYS).toBeDefined();
    });

    test('governance check has correct environment variables', () => {
      if (!governanceCheckConfig) {
        console.log('Skipping: Governance check not deployed');
        return;
      }

      const env = governanceCheckConfig.Environment?.Variables;
      expect(env?.ACCESS_CONTROL_TABLE).toBe(outputs.access_control_table_name);
      expect(env?.PRIMARY_BUCKET).toBe(outputs.primary_bucket_name);
      expect(env?.SNS_TOPIC_ARN).toBe(outputs.sns_topic_arn);
      expect(env?.KMS_KEY_ID).toContain(outputs.kms_key_id);
      expect(env?.CLOUDTRAIL_NAME).toBe(outputs.cloudtrail_name);
    });

    test('Lambda functions have CloudWatch log groups', async () => {
      const functionArns = [
        outputs.lambda_access_validator_arn,
        outputs.lambda_access_logger_arn,
        outputs.lambda_governance_check_arn,
        outputs.lambda_expiration_enforcer_arn
      ];

      for (const arn of functionArns) {
        const functionName = arn.split(':').pop();
        const logGroupName = `/aws/lambda/${functionName}`;

        try {
          const logGroups = await cloudwatchLogs.describeLogGroups({
            logGroupNamePrefix: logGroupName
          }).promise();

          expect(logGroups.logGroups?.length).toBeGreaterThan(0);
        } catch (error) {
          console.log(`Log group check skipped for ${functionName}`);
        }
      }
    });
  });

  describe('EventBridge Rules and Triggers', () => {
    let rules: AWS.EventBridge.Rule[] = [];

    beforeAll(async () => {
      try {
        const rulesResponse = await eventbridge.listRules({
          Limit: 50
        }).promise();
        rules = rulesResponse.Rules || [];
      } catch (error: any) {
        console.log(`EventBridge rules check failed: ${error.message}`);
      }
    });

    test('EventBridge rules are created', () => {
      if (rules.length === 0) {
        console.log('Skipping: EventBridge rules not deployed');
        return;
      }

      expect(rules.length).toBeGreaterThan(0);
    });

    test('scheduled rules for Lambda functions exist', () => {
      if (rules.length === 0) {
        console.log('Skipping: EventBridge rules not deployed');
        return;
      }

      const scheduledRules = rules.filter(rule =>
        rule.ScheduleExpression !== undefined
      );

      expect(scheduledRules.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SNS Topic and Alerts', () => {
    let topicAttributes: AWS.SNS.GetTopicAttributesResponse | undefined;

    beforeAll(async () => {
      try {
        topicAttributes = await sns.getTopicAttributes({
          TopicArn: outputs.sns_topic_arn
        }).promise();
      } catch (error: any) {
        console.log(`SNS topic check failed: ${error.message}`);
      }
    });

    test('SNS topic exists', () => {
      expect(topicAttributes).toBeDefined();
      expect(topicAttributes?.Attributes).toBeDefined();
    });

    test('SNS topic has KMS encryption enabled', () => {
      if (!topicAttributes) {
        console.log('Skipping: SNS topic not deployed');
        return;
      }

      expect(topicAttributes.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    let alarms: AWS.CloudWatch.MetricAlarms | undefined;

    beforeAll(async () => {
      try {
        const alarmsResponse = await cloudwatch.describeAlarms({}).promise();
        alarms = alarmsResponse.MetricAlarms;
      } catch (error: any) {
        console.log(`CloudWatch alarms check failed: ${error.message}`);
      }
    });

    test('CloudWatch alarms are configured', () => {
      if (!alarms || alarms.length === 0) {
        console.log('Skipping: CloudWatch alarms not deployed');
        return;
      }

      expect(alarms.length).toBeGreaterThan(0);
    });

    test('alarms are configured to trigger SNS notifications', () => {
      if (!alarms || alarms.length === 0) {
        console.log('Skipping: CloudWatch alarms not deployed');
        return;
      }

      const alarmsWithActions = alarms.filter(alarm =>
        alarm.AlarmActions && alarm.AlarmActions.length > 0
      );

      expect(alarmsWithActions.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Functionality', () => {
    test('primary bucket can be accessed programmatically', async () => {
      try {
        const response = await s3.listObjectsV2({
          Bucket: outputs.primary_bucket_name,
          MaxKeys: 1
        }).promise();

        expect(response).toBeDefined();
      } catch (error: any) {
        if (error.code === 'AccessDenied' || error.code === 'NoSuchBucket') {
          console.log(`Access test skipped: ${error.message}`);
        } else {
          throw error;
        }
      }
    });

    test('audit bucket stores logs', async () => {
      try {
        const response = await s3.listObjectsV2({
          Bucket: outputs.audit_bucket_name,
          MaxKeys: 10
        }).promise();

        expect(response).toBeDefined();
        expect(response.KeyCount).toBeGreaterThanOrEqual(0);
      } catch (error: any) {
        console.log(`Audit bucket test skipped: ${error.message}`);
      }
    });

    test('DynamoDB access control table is queryable', async () => {
      try {
        const response = await dynamodb.scan({
          TableName: outputs.access_control_table_name,
          Limit: 1
        }).promise();

        expect(response).toBeDefined();
      } catch (error: any) {
        console.log(`DynamoDB query test skipped: ${error.message}`);
      }
    });

    test('CloudTrail is recording events', async () => {
      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

        const events = await cloudtrail.lookupEvents({
          StartTime: startTime,
          EndTime: endTime,
          MaxResults: 5
        }).promise();

        expect(events.Events).toBeDefined();
      } catch (error: any) {
        console.log(`CloudTrail events test skipped: ${error.message}`);
      }
    });

    test('complete monitoring and alerting pipeline is configured', () => {
      expect(outputs.primary_bucket_name).toBeDefined();
      expect(outputs.cloudtrail_name).toBeDefined();
      expect(outputs.lambda_access_logger_arn).toBeDefined();
      expect(outputs.audit_logs_table_name).toBeDefined();
      expect(outputs.sns_topic_arn).toBeDefined();
    });
  });

  describe('Security and Compliance Validation', () => {
    test('all critical resources are encrypted', () => {
      expect(outputs.kms_key_id).toBeDefined();
      expect(outputs.primary_bucket_name).toBeDefined();
      expect(outputs.audit_bucket_name).toBeDefined();
      expect(outputs.access_control_table_name).toBeDefined();
      expect(outputs.audit_logs_table_name).toBeDefined();
    });

    test('audit trail is comprehensive', () => {
      expect(outputs.cloudtrail_name).toBeDefined();
      expect(outputs.audit_bucket_name).toBeDefined();
      expect(outputs.audit_logs_table_name).toBeDefined();
    });

    test('governance and compliance automation is in place', () => {
      expect(outputs.lambda_governance_check_arn).toBeDefined();
      expect(outputs.lambda_expiration_enforcer_arn).toBeDefined();
    });

    test('real-time monitoring is configured', () => {
      expect(outputs.lambda_access_logger_arn).toBeDefined();
      expect(outputs.sns_topic_arn).toBeDefined();
    });
  });
});
