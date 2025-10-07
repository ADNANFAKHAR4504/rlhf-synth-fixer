import { CloudFormationClient, CreateStackCommand, DeleteStackCommand, DescribeStacksCommand, StackStatus } from '@aws-sdk/client-cloudformation';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { SNSClient, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Serverless Image Processing System - E2E Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accountId = process.env.AWS_ACCOUNT_ID || '123456789012';
  const environmentSuffix = 'test';
  const stackName = `image-processing-e2e-test-${Date.now()}`;
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  let cfnClient: CloudFormationClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let lambdaClient: LambdaClient;
  
  let stackResources: {
    uploadBucket: string;
    processedBucket: string;
    lambdaArn: string;
    snsTopicArn: string;
  };

  beforeAll(async () => {
    cfnClient = new CloudFormationClient({ region });
    s3Client = new S3Client({ region });
    snsClient = new SNSClient({ region });
    lambdaClient = new LambdaClient({ region });
    
    // Deploy the CloudFormation stack
    const templateBody = readFileSync(join(__dirname, '../lib/TapStack.json'), 'utf-8');
    
    const createStackCommand = new CreateStackCommand({
      StackName: stackName,
      TemplateBody: templateBody,
      Parameters: [
        { ParameterKey: 'EnvironmentSuffix', ParameterValue: environmentSuffix },
        { ParameterKey: 'NotificationEmail', ParameterValue: testEmail }
      ],
      Capabilities: ['CAPABILITY_IAM'],
      TimeoutInMinutes: 30
    });

    await cfnClient.send(createStackCommand);
    
    // Wait for stack creation to complete
    await waitForStackStatus(stackName, 'CREATE_COMPLETE');
    
    // Get stack outputs
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const response = await cfnClient.send(describeCommand);
    const outputs = response.Stacks?.[0]?.Outputs || [];
    
    stackResources = {
      uploadBucket: outputs.find(o => o.OutputKey === 'UploadBucketName')?.OutputValue || '',
      processedBucket: outputs.find(o => o.OutputKey === 'ProcessedBucketName')?.OutputValue || '',
      lambdaArn: outputs.find(o => o.OutputKey === 'LambdaFunctionArn')?.OutputValue || '',
      snsTopicArn: outputs.find(o => o.OutputKey === 'SNSTopicArn')?.OutputValue || ''
    };
  }, 600000); // 10 minute timeout

  afterAll(async () => {
    // Clean up: delete the stack
    try {
      const deleteStackCommand = new DeleteStackCommand({ StackName: stackName });
      await cfnClient.send(deleteStackCommand);
      await waitForStackStatus(stackName, 'DELETE_COMPLETE');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 300000); // 5 minute timeout

  describe('Stack Deployment', () => {
    test('should create all required resources', () => {
      expect(stackResources.uploadBucket).toBeTruthy();
      expect(stackResources.processedBucket).toBeTruthy();
      expect(stackResources.lambdaArn).toBeTruthy();
      expect(stackResources.snsTopicArn).toBeTruthy();
      
      expect(stackResources.uploadBucket).toContain(`image-upload-bucket-${environmentSuffix}-${accountId}`);
      expect(stackResources.processedBucket).toContain(`processed-images-bucket-${environmentSuffix}-${accountId}`);
    });

    test('should configure SNS topic with email subscription', async () => {
      const listSubscriptionsCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: stackResources.snsTopicArn
      });
      
      const response = await snsClient.send(listSubscriptionsCommand);
      const emailSubscription = response.Subscriptions?.find(sub => 
        sub.Protocol === 'email' && sub.Endpoint === testEmail
      );
      
      expect(emailSubscription).toBeTruthy();
    });
  });

  describe('End-to-End Image Processing Flow', () => {
    const testImageKey = 'uploads/test-image.jpg';
    const expectedProcessedKey = 'processed/test-image.jpg';
    
    test('should process uploaded image through complete flow', async () => {
      // Step 1: Upload test image to S3
      const testImageBuffer = Buffer.from('fake-image-data');
      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: testImageKey,
        Body: testImageBuffer,
        ContentType: 'image/jpeg'
      });
      
      await s3Client.send(putObjectCommand);
      
      // Step 2: Wait for Lambda processing (S3 event trigger)
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
      
      // Step 3: Verify processed image exists
      const getProcessedCommand = new GetObjectCommand({
        Bucket: stackResources.processedBucket,
        Key: expectedProcessedKey
      });
      
      let processedObject;
      let attempts = 0;
      const maxAttempts = 6;
      
      while (attempts < maxAttempts) {
        try {
          processedObject = await s3Client.send(getProcessedCommand);
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error(`Processed image not found after ${maxAttempts} attempts: ${error}`);
          }
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
        }
      }
      
      // Verify processed image properties
      expect(processedObject).toBeTruthy();
      expect(processedObject?.ContentType).toBe('image/jpeg');
      expect(processedObject?.Metadata?.['original-bucket']).toBe(stackResources.uploadBucket);
      expect(processedObject?.Metadata?.['original-key']).toBe(testImageKey);
      expect(processedObject?.Metadata?.['environment']).toBe(environmentSuffix);
    }, 120000); // 2 minute timeout

    test('should handle different image formats', async () => {
      const formats = [
        { key: 'uploads/test.png', contentType: 'image/png' },
        { key: 'uploads/test.jpeg', contentType: 'image/jpeg' }
      ];
      
      for (const format of formats) {
        const putObjectCommand = new PutObjectCommand({
          Bucket: stackResources.uploadBucket,
          Key: format.key,
          Body: Buffer.from('fake-image-data'),
          ContentType: format.contentType
        });
        
        await s3Client.send(putObjectCommand);
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        const processedKey = format.key.replace('uploads/', 'processed/');
        const getProcessedCommand = new GetObjectCommand({
          Bucket: stackResources.processedBucket,
          Key: processedKey
        });
        
        const processedObject = await s3Client.send(getProcessedCommand);
        expect(processedObject).toBeTruthy();
        expect(processedObject?.ContentType).toBe(format.contentType);
      }
    }, 180000); // 3 minute timeout
  });

  describe('Lambda Function Validation', () => {
    test('should invoke Lambda function directly', async () => {
      const mockS3Event = {
        Records: [{
          s3: {
            bucket: { name: stackResources.uploadBucket },
            object: { key: 'uploads/direct-test.jpg' }
          }
        }]
      };
      
      // Upload test image first
      const putObjectCommand = new PutObjectCommand({
        Bucket: stackResources.uploadBucket,
        Key: 'uploads/direct-test.jpg',
        Body: Buffer.from('direct-test-image-data'),
        ContentType: 'image/jpeg'
      });
      
      await s3Client.send(putObjectCommand);
      
      // Invoke Lambda directly
      const invokeCommand = new InvokeCommand({
        FunctionName: stackResources.lambdaArn,
        Payload: JSON.stringify(mockS3Event)
      });
      
      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Image processing completed');
      expect(body.results).toHaveLength(1);
      expect(body.results[0].status).toBe('success');
    }, 60000); // 1 minute timeout
  });

  describe('Error Handling', () => {
    test('should handle non-existent object gracefully', async () => {
      const mockS3Event = {
        Records: [{
          s3: {
            bucket: { name: stackResources.uploadBucket },
            object: { key: 'uploads/non-existent.jpg' }
          }
        }]
      };
      
      const invokeCommand = new InvokeCommand({
        FunctionName: stackResources.lambdaArn,
        Payload: JSON.stringify(mockS3Event)
      });
      
      const response = await lambdaClient.send(invokeCommand);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.results[0].status).toBe('error');
      expect(body.results[0].error).toContain('NoSuchKey');
    }, 30000); // 30 second timeout
  });

  // Helper function to wait for CloudFormation stack status
  async function waitForStackStatus(stackName: string, desiredStatus: string): Promise<void> {
    const maxAttempts = 60; // 10 minutes with 10 second intervals
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const describeCommand = new DescribeStacksCommand({ StackName: stackName });
      
      try {
        const response = await cfnClient.send(describeCommand);
        const currentStatus = response.Stacks?.[0]?.StackStatus;
        
        if (currentStatus === desiredStatus) {
          return;
        }
        
        if (currentStatus?.includes('FAILED') || currentStatus?.includes('ROLLBACK')) {
          throw new Error(`Stack operation failed with status: ${currentStatus}`);
        }
        
      } catch (error: any) {
        if (desiredStatus === 'DELETE_COMPLETE' && error.name === 'ValidationError') {
          // Stack has been deleted successfully
          return;
        }
        throw error;
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
    
    throw new Error(`Timeout waiting for stack status: ${desiredStatus}`);
  }
});
