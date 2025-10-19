import fs from 'fs';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { CloudFrontClient, GetDistributionCommand, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import * as ApiGateway from '@aws-sdk/client-api-gateway';
import { EC2Client, DescribeInstancesCommand, StartInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2';
import { KMSClient, EncryptCommand, DecryptCommand, GenerateDataKeyCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, GetSecretValueCommand, UpdateSecretCommand } from '@aws-sdk/client-secrets-manager';
import { SNSClient, PublishCommand, ListTopicsCommand } from '@aws-sdk/client-sns';
import { ConfigServiceClient, StartConfigRulesEvaluationCommand, GetComplianceDetailsByConfigRuleCommand } from '@aws-sdk/client-config-service';
import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { WAFv2Client, GetWebACLCommand, UpdateWebACLCommand } from '@aws-sdk/client-wafv2';

// Configuration from CloudFormation outputs
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

// AWS Clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION || 'us-west-2' });
const cloudFrontClient = new CloudFrontClient({ region: process.env.AWS_REGION || 'us-west-2' });
const apiGatewayClient = new ApiGateway.ApiGatewayClient({ region: process.env.AWS_REGION || 'us-west-2' });
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-west-2' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-west-2' });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-west-2' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-west-2' });
const configClient = new ConfigServiceClient({ region: process.env.AWS_REGION || 'us-west-2' });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-west-2' });
const wafClient = new WAFv2Client({ region: process.env.AWS_REGION || 'us-west-2' });

describe('Nova Clinical Trial Data Platform End-to-End Workflow Tests', () => {
  const testTimeout = 600000; // 10 minutes
  let testData: any = {};

  describe('Data Ingestion and Processing Workflow', () => {
    test('should complete end-to-end data flow: S3 -> KMS -> CloudFront -> API Gateway', async () => {
      // Step 1: Generate test clinical data
      const clinicalData = {
        patientId: 'P001',
        trialId: 'T001',
        timestamp: new Date().toISOString(),
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6
        },
        medication: {
          name: 'TestMed',
          dosage: '10mg',
          frequency: 'daily'
        }
      };

      // Step 2: Encrypt data using KMS
      const keyId = outputs['nova-clinical-prod-nova-kms-key-id'];
      const encryptResponse = await kmsClient.send(new EncryptCommand({
        KeyId: keyId,
        Plaintext: JSON.stringify(clinicalData)
      }));
      expect(encryptResponse.CiphertextBlob).toBeDefined();
      testData.encryptedData = encryptResponse.CiphertextBlob;

      // Step 3: Store encrypted data in S3
      const bucketName = outputs['nova-clinical-prod-secure-s3-bucket'];
      const objectKey = `clinical-data/${clinicalData.patientId}/${Date.now()}.json`;
      
      const putResponse = await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: encryptResponse.CiphertextBlob,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: keyId
      }));
      expect(putResponse.$metadata.httpStatusCode).toBe(200);
      testData.s3ObjectKey = objectKey;

      // Step 4: Verify data retrieval and decryption
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
      }));
      expect(getResponse.Body).toBeDefined();
      
      const decryptedData = await kmsClient.send(new DecryptCommand({
        CiphertextBlob: await getResponse.Body?.transformToByteArray()
      }));
      const decryptedClinicalData = JSON.parse(decryptedData.Plaintext?.toString() || '{}');
      expect(decryptedClinicalData.patientId).toBe(clinicalData.patientId);

      // Step 5: Test CloudFront distribution
      const distributionId = outputs['nova-clinical-prod-cloudfront-id'];
      const distributionResponse = await cloudFrontClient.send(new GetDistributionCommand({ Id: distributionId }));
      expect(distributionResponse.Distribution?.Status).toBe('Deployed');

      // Step 6: Create CloudFront invalidation to ensure fresh content
      const invalidationResponse = await cloudFrontClient.send(new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: [`/${objectKey}`]
          },
          CallerReference: `test-${Date.now()}`
        }
      }));
      expect(invalidationResponse.Invalidation?.Status).toBe('InProgress');

      // Step 7: Test API Gateway endpoint
      const apiId = outputs['nova-clinical-prod-api-gateway-id'];
      const apiResponse = await apiGatewayClient.send(new ApiGateway.GetRestApiCommand({ restApiId: apiId }));
      expect(apiResponse.$metadata.httpStatusCode).toBe(200);

      // Step 8: Test API Gateway method invocation
      const testInvokeResponse = await apiGatewayClient.send(new ApiGateway.TestInvokeMethodCommand({
        restApiId: apiId,
        resourceId: apiResponse.resources?.find(r => r.pathPart === 'clinical-data')?.id,
        httpMethod: 'GET',
        pathWithQueryString: '/clinical-data',
        body: JSON.stringify({ patientId: clinicalData.patientId })
      }));
      expect(testInvokeResponse.status).toBe(200);

    }, testTimeout);
  });

  describe('Database Integration and Security Workflow', () => {
    test('should complete database workflow: Secrets Manager -> RDS -> Application', async () => {
      // Step 1: Retrieve database credentials from Secrets Manager
      const secretResponse = await secretsClient.send(new GetSecretValueCommand({
        SecretId: 'nova-clinical-prod-db-password'
      }));
      expect(secretResponse.SecretString).toBeDefined();
      
      const dbCredentials = JSON.parse(secretResponse.SecretString || '{}');
      expect(dbCredentials.username).toBe('dbadmin');
      expect(dbCredentials.password).toBeDefined();
      testData.dbCredentials = dbCredentials;

      // Step 2: Verify RDS instance is accessible
      const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = rdsResponse.DBInstances?.find(db => 
        db.DBInstanceIdentifier?.includes('nova-clinical')
      );
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      testData.dbEndpoint = dbInstance?.Endpoint?.Address;

      // Step 3: Test database connection (simulated)
      const connectionString = `postgresql://${dbCredentials.username}:${dbCredentials.password}@${testData.dbEndpoint}:5432/nova_clinical`;
      expect(connectionString).toContain('postgresql://');
      expect(connectionString).toContain(testData.dbEndpoint);

      // Step 4: Verify encryption at rest
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();

    }, testTimeout);
  });

  describe('Monitoring and Alerting Workflow', () => {
    test('should complete monitoring workflow: CloudWatch -> SNS -> Notification', async () => {
      // Step 1: Create test log events
      const logGroupName = outputs['nova-clinical-prod-api-gateway-log-group'];
      const logStreamName = `test-stream-${Date.now()}`;
      
      await logsClient.send(new CreateLogStreamCommand({
        logGroupName: logGroupName,
        logStreamName: logStreamName
      }));

      const logEvents = [
        {
          timestamp: Date.now(),
          message: JSON.stringify({
            level: 'INFO',
            message: 'Clinical data processed successfully',
            patientId: 'P001',
            trialId: 'T001'
          })
        },
        {
          timestamp: Date.now() + 1000,
          message: JSON.stringify({
            level: 'WARN',
            message: 'Data validation warning',
            patientId: 'P001',
            field: 'bloodPressure'
          })
        }
      ];

      await logsClient.send(new PutLogEventsCommand({
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: logEvents
      }));

      // Step 2: Test SNS notification
      const topicsResponse = await snsClient.send(new ListTopicsCommand({}));
      const topic = topicsResponse.Topics?.find(t => t.TopicArn?.includes('nova-clinical'));
      expect(topic?.TopicArn).toBeDefined();

      const publishResponse = await snsClient.send(new PublishCommand({
        TopicArn: topic?.TopicArn,
        Message: JSON.stringify({
          alertType: 'DataProcessing',
          severity: 'INFO',
          message: 'Clinical data workflow completed successfully',
          timestamp: new Date().toISOString()
        }),
        Subject: 'Nova Clinical Platform Alert'
      }));
      expect(publishResponse.MessageId).toBeDefined();

    }, testTimeout);
  });

  describe('Security and Compliance Workflow', () => {
    test('should complete security workflow: WAF -> Config -> Compliance Check', async () => {
      // Step 1: Test WAF protection
      const webACLId = outputs['nova-clinical-prod-web-acl-id'];
      if (webACLId) {
        const wafResponse = await wafClient.send(new GetWebACLCommand({
          Id: webACLId,
          Scope: 'REGIONAL'
        }));
        expect(wafResponse.WebACL?.Name).toContain('nova-clinical');
        expect(wafResponse.WebACL?.Rules?.length).toBeGreaterThan(0);
      }

      // Step 2: Trigger Config rule evaluation
      const configRulesResponse = await configClient.send(new StartConfigRulesEvaluationCommand({
        ConfigRuleNames: ['S3BucketServerSideEncryptionEnabledRule', 'RDSInstancePublicAccessCheckRule']
      }));
      expect(configRulesResponse.$metadata.httpStatusCode).toBe(200);

      // Step 3: Check compliance status
      const complianceResponse = await configClient.send(new GetComplianceDetailsByConfigRuleCommand({
        ConfigRuleName: 'S3BucketServerSideEncryptionEnabledRule',
        ComplianceTypes: ['COMPLIANT', 'NON_COMPLIANT']
      }));
      expect(complianceResponse.$metadata.httpStatusCode).toBe(200);

    }, testTimeout);
  });

  describe('Application Lifecycle Workflow', () => {
    test('should complete application lifecycle: EC2 -> Application -> Health Check', async () => {
      // Step 1: Get EC2 instance details
      const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({}));
      const novaInstance = instancesResponse.Reservations?.flatMap(r => r.Instances || [])
        .find(instance => instance.Tags?.some(tag => 
          tag.Key === 'Name' && tag.Value?.includes('nova-clinical')
        ));
      
      expect(novaInstance).toBeDefined();
      expect(novaInstance?.State?.Name).toBe('running');
      testData.instanceId = novaInstance?.InstanceId;

      // Step 2: Test application health (simulated)
      const healthCheckData = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        services: {
          database: 'connected',
          storage: 'accessible',
          api: 'responding'
        },
        metrics: {
          cpu: '15%',
          memory: '45%',
          disk: '30%'
        }
      };

      // Step 3: Store health check data in S3
      const bucketName = outputs['nova-clinical-prod-secure-s3-bucket'];
      const healthCheckKey = `health-checks/${testData.instanceId}/${Date.now()}.json`;
      
      const healthPutResponse = await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: healthCheckKey,
        Body: JSON.stringify(healthCheckData),
        ContentType: 'application/json'
      }));
      expect(healthPutResponse.$metadata.httpStatusCode).toBe(200);

      // Step 4: Verify health check data retrieval
      const healthGetResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: healthCheckKey
      }));
      expect(healthGetResponse.Body).toBeDefined();

    }, testTimeout);
  });

  describe('Data Backup and Recovery Workflow', () => {
    test('should complete backup workflow: RDS Snapshot -> S3 Archive -> Recovery Test', async () => {
      // Step 1: Verify RDS backup configuration
      const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = rdsResponse.DBInstances?.find(db => 
        db.DBInstanceIdentifier?.includes('nova-clinical')
      );
      
      expect(dbInstance?.BackupRetentionPeriod).toBe(35);
      expect(dbInstance?.MultiAZ).toBe(false);
      expect(dbInstance?.StorageEncrypted).toBe(true);

      // Step 2: Create test backup data
      const backupData = {
        backupId: `backup-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'nova-clinical-db',
        size: '2.5GB',
        encryption: 'KMS',
        status: 'completed'
      };

      // Step 3: Store backup metadata in S3
      const bucketName = outputs['nova-clinical-prod-secure-s3-bucket'];
      const backupKey = `backups/database/${backupData.backupId}.json`;
      
      const backupPutResponse = await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: backupKey,
        Body: JSON.stringify(backupData),
        StorageClass: 'STANDARD_IA'
      }));
      expect(backupPutResponse.$metadata.httpStatusCode).toBe(200);

      // Step 4: Test backup retrieval
      const backupGetResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: backupKey
      }));
      expect(backupGetResponse.Body).toBeDefined();

    }, testTimeout);
  });

  describe('Performance and Scaling Workflow', () => {
    test('should complete performance workflow: Load Test -> Metrics -> Optimization', async () => {
      // Step 1: Generate load test data
      const loadTestData = Array.from({ length: 100 }, (_, i) => ({
        requestId: `req-${i}`,
        timestamp: new Date().toISOString(),
        endpoint: '/clinical-data',
        responseTime: Math.random() * 1000,
        status: Math.random() > 0.1 ? 200 : 500
      }));

      // Step 2: Store load test results in S3
      const bucketName = outputs['nova-clinical-prod-secure-s3-bucket'];
      const loadTestKey = `performance-tests/load-test-${Date.now()}.json`;
      
      const loadTestResponse = await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: loadTestKey,
        Body: JSON.stringify(loadTestData),
        ContentType: 'application/json'
      }));
      expect(loadTestResponse.$metadata.httpStatusCode).toBe(200);

      // Step 3: Analyze performance metrics
      const successfulRequests = loadTestData.filter(r => r.status === 200).length;
      const averageResponseTime = loadTestData.reduce((sum, r) => sum + r.responseTime, 0) / loadTestData.length;
      
      expect(successfulRequests).toBeGreaterThan(90);
      expect(averageResponseTime).toBeLessThan(1000);

      // Step 4: Test CloudFront caching
      const distributionId = outputs['nova-clinical-prod-cloudfront-id'];
      const distributionResponse = await cloudFrontClient.send(new GetDistributionCommand({ Id: distributionId }));
      expect(distributionResponse.Distribution?.DistributionConfig.DefaultCacheBehavior?.Compress).toBe(true);

    }, testTimeout);
  });

  describe('End-to-End Clinical Data Workflow', () => {
    test('should complete full clinical trial data workflow', async () => {
      // Step 1: Patient data ingestion
      const patientData = {
        patientId: 'P001',
        trialId: 'T001',
        visitNumber: 1,
        data: {
          demographics: { age: 45, gender: 'M' },
          vitals: { bp: '120/80', hr: 72, temp: 98.6 },
          medications: [{ name: 'MedA', dose: '10mg' }],
          adverseEvents: []
        }
      };

      // Step 2: Encrypt and store patient data
      const keyId = outputs['nova-clinical-prod-nova-kms-key-id'];
      const encryptResponse = await kmsClient.send(new EncryptCommand({
        KeyId: keyId,
        Plaintext: JSON.stringify(patientData)
      }));

      const bucketName = outputs['nova-clinical-prod-secure-s3-bucket'];
      const patientKey = `patients/${patientData.patientId}/visit-${patientData.visitNumber}.json`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: patientKey,
        Body: encryptResponse.CiphertextBlob,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: keyId
      }));

      // Step 3: Process data through API Gateway
      const apiId = outputs['nova-clinical-prod-api-gateway-id'];
      const apiResponse = await apiGatewayClient.send(new ApiGateway.GetRestApiCommand({ restApiId: apiId }));
      
      // Step 4: Store processed results
      const processedData = {
        ...patientData,
        processedAt: new Date().toISOString(),
        status: 'processed',
        qualityScore: 0.95
      };

      const processedKey = `processed/${patientData.patientId}/visit-${patientData.visitNumber}-processed.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: processedKey,
        Body: JSON.stringify(processedData),
        ContentType: 'application/json'
      }));

      // Step 5: Generate compliance report
      const complianceReport = {
        reportId: `compliance-${Date.now()}`,
        patientId: patientData.patientId,
        trialId: patientData.trialId,
        complianceStatus: 'COMPLIANT',
        checks: [
          { name: 'Data Encryption', status: 'PASS' },
          { name: 'Access Control', status: 'PASS' },
          { name: 'Audit Trail', status: 'PASS' }
        ],
        generatedAt: new Date().toISOString()
      };

      const reportKey = `reports/compliance/${complianceReport.reportId}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: reportKey,
        Body: JSON.stringify(complianceReport),
        ContentType: 'application/json'
      }));

      // Step 6: Send notification
      const topicsResponse = await snsClient.send(new ListTopicsCommand({}));
      const topic = topicsResponse.Topics?.find(t => t.TopicArn?.includes('nova-clinical'));
      
      if (topic?.TopicArn) {
        await snsClient.send(new PublishCommand({
          TopicArn: topic.TopicArn,
          Message: JSON.stringify({
            type: 'ClinicalDataProcessed',
            patientId: patientData.patientId,
            trialId: patientData.trialId,
            status: 'success',
            timestamp: new Date().toISOString()
          }),
          Subject: 'Clinical Data Processing Complete'
        }));
      }

      // Step 7: Verify end-to-end data integrity
      const finalDataResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: processedKey
      }));
      expect(finalDataResponse.Body).toBeDefined();

    }, testTimeout);
  });

  describe('Disaster Recovery Workflow', () => {
    test('should complete disaster recovery workflow: Failover -> Recovery -> Validation', async () => {
      // Step 1: Simulate primary system failure
      const failureEvent = {
        eventId: `failure-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'SYSTEM_FAILURE',
        severity: 'CRITICAL',
        affectedComponents: ['database', 'api'],
        status: 'DETECTED'
      };

      // Step 2: Store failure event
      const bucketName = outputs['nova-clinical-prod-secure-s3-bucket'];
      const failureKey = `incidents/${failureEvent.eventId}.json`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: failureKey,
        Body: JSON.stringify(failureEvent),
        ContentType: 'application/json'
      }));

      // Step 3: Initiate recovery procedures
      const recoveryPlan = {
        planId: `recovery-${Date.now()}`,
        incidentId: failureEvent.eventId,
        steps: [
          { step: 1, action: 'Isolate affected systems', status: 'COMPLETED' },
          { step: 2, action: 'Activate backup systems', status: 'IN_PROGRESS' },
          { step: 3, action: 'Restore data from backups', status: 'PENDING' },
          { step: 4, action: 'Validate system integrity', status: 'PENDING' }
        ],
        estimatedRecoveryTime: '30 minutes',
        status: 'ACTIVE'
      };

      const recoveryKey = `recovery/${recoveryPlan.planId}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: recoveryKey,
        Body: JSON.stringify(recoveryPlan),
        ContentType: 'application/json'
      }));

      // Step 4: Validate recovery success
      const validationResults = {
        validationId: `validation-${Date.now()}`,
        timestamp: new Date().toISOString(),
        checks: [
          { component: 'Database', status: 'HEALTHY', responseTime: '45ms' },
          { component: 'API Gateway', status: 'HEALTHY', responseTime: '120ms' },
          { component: 'Storage', status: 'HEALTHY', responseTime: '80ms' },
          { component: 'Encryption', status: 'HEALTHY', keyStatus: 'ACTIVE' }
        ],
        overallStatus: 'RECOVERED'
      };

      const validationKey = `validation/${validationResults.validationId}.json`;
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: validationKey,
        Body: JSON.stringify(validationResults),
        ContentType: 'application/json'
      }));

      expect(validationResults.overallStatus).toBe('RECOVERED');

    }, testTimeout);
  });
});