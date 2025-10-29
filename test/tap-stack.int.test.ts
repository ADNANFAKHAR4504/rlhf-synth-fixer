import fs from 'fs';
import AWS from 'aws-sdk';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const sns = new AWS.SNS();
const kms = new AWS.KMS();
const cloudWatchLogs = new AWS.CloudWatchLogs();

describe('Compliance Validation System Integration Tests', () => {
  describe('S3 Buckets', () => {
    test('Compliance Reports bucket should exist and be properly configured', async () => {
      const bucketName = outputs.ComplianceReportsBucketName;
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const bucketResponse = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(bucketResponse).toBeDefined();
      
      // Check encryption configuration
      const encryptionResponse = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryptionResponse.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      
      // Check public access block
      const publicAccessResponse = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccessResponse.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });
    
    test('Analysis Results bucket should exist and be properly configured', async () => {
      const bucketName = outputs.AnalysisResultsBucketName;
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const bucketResponse = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(bucketResponse).toBeDefined();
      
      // Check encryption configuration
      const encryptionResponse = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryptionResponse.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });
  });
  
  describe('Lambda Functions', () => {
    test('Analyzer Lambda function should exist and be properly configured', async () => {
      const functionArn = outputs.AnalyzerFunctionArn;
      expect(functionArn).toBeDefined();
      
      const functionName = functionArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      
      expect(response.Configuration.Runtime).toBe('python3.12');
      expect(response.Configuration.Handler).toBe('index.handler');
      expect(response.Configuration.Timeout).toBe(300);
      expect(response.Configuration.MemorySize).toBe(1024);
      
      // Check environment variables
      expect(response.Configuration.Environment.Variables.COMPLIANCE_BUCKET).toBeDefined();
      expect(response.Configuration.Environment.Variables.ANALYSIS_BUCKET).toBeDefined();
      expect(response.Configuration.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
    });
    
    test('Periodic Scan Lambda function should exist and be properly configured', async () => {
      const functionArn = outputs.PeriodicScanFunctionArn;
      expect(functionArn).toBeDefined();
      
      const functionName = functionArn.split(':').pop();
      const response = await lambda.getFunction({ FunctionName: functionName }).promise();
      
      expect(response.Configuration.Runtime).toBe('python3.12');
      expect(response.Configuration.Handler).toBe('index.handler');
      expect(response.Configuration.Timeout).toBe(300);
      expect(response.Configuration.MemorySize).toBe(512);
      
      // Check environment variables
      expect(response.Configuration.Environment.Variables.ANALYZER_FUNCTION_ARN).toBeDefined();
    });
  });
  
  describe('SNS Topic', () => {
    test('Compliance Violations topic should exist and be properly configured', async () => {
      const topicArn = outputs.ComplianceViolationsTopicArn;
      expect(topicArn).toBeDefined();
      
      const response = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      
      expect(response.Attributes.DisplayName).toBe('Compliance Violations Alert');
      expect(response.Attributes.KmsMasterKeyId).toBeDefined();
    });
  });
  
  describe('KMS Key', () => {
    test('Compliance KMS key should exist and be properly configured', async () => {
      const keyId = outputs.KMSKeyId;
      const keyAlias = outputs.KMSKeyAlias;
      
      expect(keyId).toBeDefined();
      expect(keyAlias).toBeDefined();
      
      // Check key exists and is enabled
      const response = await kms.describeKey({ KeyId: keyId }).promise();
      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
      
      // Check key rotation is enabled
      const rotationResponse = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });
  
  describe('CloudWatch Log Groups', () => {
    test('Log groups should exist with proper retention policies', async () => {
      // Get stack name from outputs to construct log group names
      const analyzerLogGroupName = `/aws/lambda/${outputs.AnalyzerFunctionArn.split(':').pop()}`;
      const periodicLogGroupName = `/aws/lambda/${outputs.PeriodicScanFunctionArn.split(':').pop()}`;
      
      // Check analyzer log group
      const analyzerLogGroup = await cloudWatchLogs.describeLogGroups({
        logGroupNamePrefix: analyzerLogGroupName
      }).promise();
      
      expect(analyzerLogGroup.logGroups.length).toBeGreaterThan(0);
      expect(analyzerLogGroup.logGroups[0].retentionInDays).toBe(365);
      
      // Check periodic scan log group
      const periodicLogGroup = await cloudWatchLogs.describeLogGroups({
        logGroupNamePrefix: periodicLogGroupName
      }).promise();
      
      expect(periodicLogGroup.logGroups.length).toBeGreaterThan(0);
      expect(periodicLogGroup.logGroups[0].retentionInDays).toBe(365);
    });
  });
  
  describe('End-to-End Workflow', () => {
    test('Analyzer function should process test event successfully', async () => {
      const functionArn = outputs.AnalyzerFunctionArn;
      const functionName = functionArn.split(':').pop();
      
      const testEvent = {
        source: 'test',
        triggerType: 'manual',
        testExecution: true
      };
      
      const response = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
        InvocationType: 'RequestResponse'
      }).promise();
      
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(response.Payload.toString());
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.evaluationId).toBeDefined();
      expect(body.findingsCount).toBeDefined();
      expect(body.violationsCount).toBeDefined();
    });
    
    test('Periodic scan function should trigger analyzer successfully', async () => {
      const functionArn = outputs.PeriodicScanFunctionArn;
      const functionName = functionArn.split(':').pop();
      
      const testEvent = {
        source: 'scheduled',
        triggerType: 'test'
      };
      
      const response = await lambda.invoke({
        FunctionName: functionName,
        Payload: JSON.stringify(testEvent),
        InvocationType: 'RequestResponse'
      }).promise();
      
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(response.Payload.toString());
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Periodic scan initiated');
    });
  });
});
