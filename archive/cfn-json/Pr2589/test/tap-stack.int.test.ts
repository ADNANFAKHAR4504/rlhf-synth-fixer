// test/tap-stack.int.test.ts

// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

// Resolve file path
const outputsFile = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

// Load outputs safely
let outputs: Record<string, any> = {};
if (fs.existsSync(outputsFile)) {
  outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
} else {
  console.warn(
    `⚠️  Warning: ${outputsFile} not found. Using empty outputs. ` +
    `Make sure your CDK deploy step generates this file before running integration tests.`
  );
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('S3 Security Infrastructure Integration Tests', () => {
  const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

  describe('S3 Bucket Tests', () => {
    test('Main S3 bucket exists and is properly configured', async () => {
      expect(typeof outputs).toBe('object');
      expect(environmentSuffix).toBeDefined();
      
      const mainBucketName = outputs['MainBucketName'];
      expect(mainBucketName).toBeDefined();
      
      if (mainBucketName) {
        // Test bucket exists
        const headBucketResponse = await s3Client.send(new HeadBucketCommand({ Bucket: mainBucketName }));
        expect(headBucketResponse.$metadata.httpStatusCode).toBe(200);
        
        // Test bucket encryption
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: mainBucketName }));
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
        
        // Test bucket policy exists and denies insecure transport
        const policyResponse = await s3Client.send(new GetBucketPolicyCommand({ Bucket: mainBucketName }));
        expect(policyResponse.Policy).toBeDefined();
        const policy = JSON.parse(policyResponse.Policy!);
        const denyInsecureStatement = policy.Statement.find((s: any) => s.Sid === 'DenyInsecureConnections');
        expect(denyInsecureStatement).toBeDefined();
        expect(denyInsecureStatement.Effect).toBe('Deny');
      }
    }, 30000);

    test('Logging S3 bucket exists and is properly configured', async () => {
      const loggingBucketName = outputs['LoggingBucketName'];
      expect(loggingBucketName).toBeDefined();
      
      if (loggingBucketName) {
        // Test bucket exists
        const headBucketResponse = await s3Client.send(new HeadBucketCommand({ Bucket: loggingBucketName }));
        expect(headBucketResponse.$metadata.httpStatusCode).toBe(200);
        
        // Test bucket encryption
        const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: loggingBucketName }));
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      }
    }, 30000);
  });

  describe('SNS Topic Tests', () => {
    test('Security notification topic exists', async () => {
      const snsTopicArn = outputs['SNSTopicArn'];
      expect(snsTopicArn).toBeDefined();
      
      if (snsTopicArn) {
        // Verify topic exists by listing topics and finding ours
        const listResponse = await snsClient.send(new ListTopicsCommand({}));
        const topicExists = listResponse.Topics?.some(topic => topic.TopicArn === snsTopicArn);
        expect(topicExists).toBe(true);
      }
    }, 30000);
  });

  describe('Lambda Function Tests', () => {
    test('Remediation Lambda function exists and is properly configured', async () => {
      const lambdaArn = outputs['RemediationLambdaArn'];
      expect(lambdaArn).toBeDefined();
      
      if (lambdaArn) {
        const functionName = lambdaArn.split(':').pop();
        const getResponse = await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
        
        expect(getResponse.Configuration?.Runtime).toBe('python3.12');
        expect(getResponse.Configuration?.Handler).toBe('index.lambda_handler');
        expect(getResponse.Configuration?.Timeout).toBe(300);
        
        // Check environment variables are set
        const envVars = getResponse.Configuration?.Environment?.Variables;
        expect(envVars?.['SNS_TOPIC_ARN']).toBeDefined();
        expect(envVars?.['MAIN_BUCKET']).toBeDefined();
        expect(envVars?.['LOGGING_BUCKET']).toBeDefined();
        expect(envVars?.['KMS_KEY_ID']).toBeDefined();
      }
    }, 30000);
  });

  describe('Resource Naming Tests', () => {
    test('All resources include environment suffix for conflict avoidance', () => {
      // Test that key outputs include environment suffix in naming
      const mainBucketName = outputs['MainBucketName'];
      const loggingBucketName = outputs['LoggingBucketName'];
      const lambdaArn = outputs['RemediationLambdaArn'];
      
      if (mainBucketName) {
        expect(mainBucketName).toContain(environmentSuffix);
      }
      
      if (loggingBucketName) {
        expect(loggingBucketName).toContain(environmentSuffix);
      }
      
      if (lambdaArn) {
        expect(lambdaArn).toContain(environmentSuffix);
      }
    });
  });
});
