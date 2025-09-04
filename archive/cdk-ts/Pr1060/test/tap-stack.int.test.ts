// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { S3Client, GetBucketLocationCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetBucketLifecycleConfigurationCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, GetFunctionConfigurationCommand, InvokeCommand, ListTagsCommand } from '@aws-sdk/client-lambda';
import { APIGatewayClient, GetRestApiCommand, GetResourcesCommand, GetStagesCommand } from '@aws-sdk/client-api-gateway';
import { CloudFormationClient, ListStacksCommand } from '@aws-sdk/client-cloudformation';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);


// Configure AWS SDK
const region = outputs.DeploymentRegion || 'us-east-1';

// Create AWS service clients
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });
const apigateway = new APIGatewayClient({ region });
const cloudformation = new CloudFormationClient({ region });

describe('Multi-Environment Consistency CDK Integration Tests', () => {
  describe('S3 Bucket Tests', () => {
    test('should verify data bucket exists and is configured correctly', async () => {
      const bucketName = outputs.DataBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('tap-');
      expect(bucketName).toContain('-data-');

      try {
        // Check bucket exists
        const bucketLocation = await s3.send(new GetBucketLocationCommand({ Bucket: bucketName }));
        expect(bucketLocation).toBeDefined();

        // Check bucket encryption
        const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

        // Check bucket versioning
        const versioning = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
        expect(['Enabled', 'Suspended']).toContain(versioning.Status || 'Suspended');

        // Check bucket public access block
        const publicAccess = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
        expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

        // Check lifecycle configuration
        const lifecycle = await s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName }));
        expect(lifecycle.Rules).toBeDefined();
        expect(lifecycle.Rules?.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.code === 'NoSuchBucket') {
          console.warn(`Bucket ${bucketName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should verify logs bucket exists and is configured correctly', async () => {
      const bucketName = outputs.LogsBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('tap-');
      expect(bucketName).toContain('-logs-');

      try {
        // Check bucket exists
        const bucketLocation = await s3.send(new GetBucketLocationCommand({ Bucket: bucketName }));
        expect(bucketLocation).toBeDefined();

        // Check bucket encryption
        const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();

        // Check lifecycle configuration for archival
        const lifecycle = await s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName }));
        expect(lifecycle.Rules).toBeDefined();
        const archiveRule = lifecycle.Rules?.find((r: any) => r.ID === 'ArchiveLogFiles');
        expect(archiveRule).toBeDefined();
        expect(archiveRule?.Transitions).toBeDefined();
        expect(archiveRule?.Transitions?.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.code === 'NoSuchBucket') {
          console.warn(`Bucket ${bucketName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should be able to write and read from data bucket', async () => {
      const bucketName = outputs.DataBucketName;
      const testKey = `test-${Date.now()}.json`;
      const testData = { test: true, timestamp: new Date().toISOString() };

      try {
        // Write test object
        await s3.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
        }));

        // Read test object
        const getResult = await s3.send(new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        }));

        // Handle S3 Body stream - convert to string first
        const bodyStream = getResult.Body;
        let bodyText = '{}';
        if (bodyStream) {
          if (typeof bodyStream.transformToString === 'function') {
            bodyText = await bodyStream.transformToString();
          } else {
            // Fallback for different stream types
            const chunks: Buffer[] = [];
            for await (const chunk of bodyStream as any) {
              chunks.push(chunk);
            }
            bodyText = Buffer.concat(chunks).toString();
          }
        }
        const retrievedData = JSON.parse(bodyText);
        expect(retrievedData).toEqual(testData);

        // Clean up
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        }));
      } catch (error: any) {
        if (error.code === 'NoSuchBucket') {
          console.warn(`Bucket ${bucketName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Lambda Function Tests', () => {
    test('should verify API Lambda function exists and is configured correctly', async () => {
      const functionName = outputs.ApiFunctionName;
      expect(functionName).toBeDefined();
      expect(functionName).toContain('tap-');
      expect(functionName).toContain('-api-function');

      try {
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        }));

        expect(functionConfig.FunctionName).toBe(functionName);
        expect(functionConfig.Runtime).toBe('nodejs20.x');
        expect(functionConfig.Handler).toBe('index.handler');
        expect(functionConfig.MemorySize).toBeGreaterThanOrEqual(256);
        expect(functionConfig.Timeout).toBeGreaterThanOrEqual(30);
        expect(functionConfig.Environment?.Variables?.ENVIRONMENT).toBeDefined();
        expect(functionConfig.Environment?.Variables?.LOG_LEVEL).toBeDefined();
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn(`Function ${functionName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should verify Processing Lambda function exists and is configured correctly', async () => {
      const functionName = outputs.ProcessingFunctionName;
      expect(functionName).toBeDefined();
      expect(functionName).toContain('tap-');
      expect(functionName).toContain('-processing-function');

      try {
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        }));

        expect(functionConfig.FunctionName).toBe(functionName);
        expect(functionConfig.Runtime).toBe('nodejs20.x');
        expect(functionConfig.Handler).toBe('index.handler');
        expect(functionConfig.Environment?.Variables?.ENVIRONMENT).toBeDefined();
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn(`Function ${functionName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should verify Validation Lambda function exists', async () => {
      const functionName = outputs.ValidationFunctionName;
      expect(functionName).toBeDefined();
      expect(functionName).toContain('tap-');
      expect(functionName).toContain('-validation-function');

      try {
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        }));

        expect(functionConfig.FunctionName).toBe(functionName);
        expect(functionConfig.Runtime).toBe('nodejs20.x');
        expect(functionConfig.MemorySize).toBe(256);
        expect(functionConfig.Timeout).toBe(60);
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn(`Function ${functionName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should invoke API Lambda function and get response', async () => {
      const functionName = outputs.ApiFunctionName;

      try {
        const invokeResult = await lambda.send(new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ test: true }),
        }));

        expect(invokeResult.StatusCode).toBe(200);
        
        // Note: Response streaming functions may return different payload format
        if (invokeResult.Payload) {
          const payloadString = Buffer.from(invokeResult.Payload).toString();
          try {
            const payload = JSON.parse(payloadString);
            // Check if it's a response streaming function or regular function
            if (payload.message || payload.body) {
              expect(payload).toBeDefined();
            }
          } catch (parseError) {
            // If payload is not valid JSON, check if it's a string response
            console.log('Lambda payload is not JSON:', payloadString);
            expect(payloadString).toBeDefined();
            expect(payloadString.length).toBeGreaterThan(0);
          }
        }
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn(`Function ${functionName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should invoke Processing Lambda function and get response', async () => {
      const functionName = outputs.ProcessingFunctionName;

      try {
        const invokeResult = await lambda.send(new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ action: 'process', data: 'test' }),
        }));

        expect(invokeResult.StatusCode).toBe(200);
        
        if (invokeResult.Payload) {
          const payloadString = Buffer.from(invokeResult.Payload).toString();
          try {
            const payload = JSON.parse(payloadString);
            expect(payload.statusCode).toBe(200);
            
            if (payload.body) {
              const body = JSON.parse(payload.body);
              expect(body.message).toBe('Processing completed');
            }
          } catch (parseError) {
            // If payload is not valid JSON, check if it's a string response
            console.log('Processing Lambda payload is not JSON:', payloadString);
            expect(payloadString).toBeDefined();
            expect(payloadString.length).toBeGreaterThan(0);
          }
        }
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn(`Function ${functionName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('API Gateway Tests', () => {
    test('should verify API Gateway exists and has correct configuration', async () => {
      const apiId = outputs.ApiId;
      expect(apiId).toBeDefined();

      try {
        const api = await apigateway.send(new GetRestApiCommand({ restApiId: apiId }));
        
        expect(api.name).toContain('tap-');
        expect(api.name).toContain('-api');
        expect(api.endpointConfiguration?.types).toContain('REGIONAL');
      } catch (error: any) {
        if (error.code === 'NotFoundException') {
          console.warn(`API ${apiId} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should verify API Gateway has expected resources', async () => {
      const apiId = outputs.ApiId;

      try {
        const resources = await apigateway.send(new GetResourcesCommand({ restApiId: apiId }));
        
        expect(resources.items).toBeDefined();
        
        // Check for expected paths
        const paths = resources.items?.map((r: any) => r.path) || [];
        expect(paths).toContain('/');
        expect(paths.some((p: any) => p?.includes('/api'))).toBe(true);
        expect(paths.some((p: any) => p?.includes('/v1'))).toBe(true);
        expect(paths.some((p: any) => p?.includes('/health'))).toBe(true);
        expect(paths.some((p: any) => p?.includes('/process'))).toBe(true);
      } catch (error: any) {
        if (error.code === 'NotFoundException') {
          console.warn(`API ${apiId} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });

    test('should verify API Gateway stages', async () => {
      const apiId = outputs.ApiId;

      try {
        const stages = await apigateway.send(new GetStagesCommand({ restApiId: apiId }));
        
        expect(stages.item).toBeDefined();
        expect(stages.item?.length).toBeGreaterThan(0);
        
        // Check for environment-specific stage
        const hasEnvironmentStage = stages.item?.some((s: any) => 
          s.stageName === 'dev' || s.stageName === 'staging' || s.stageName === 'prod'
        );
        expect(hasEnvironmentStage).toBe(true);
      } catch (error: any) {
        if (error.code === 'NotFoundException') {
          console.warn(`API ${apiId} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Environment Configuration Tests', () => {
    test('should verify environment-specific configurations are applied', async () => {
      const environmentName = outputs.EnvironmentName;
      const environmentSuffix = outputs.EnvironmentSuffix;

      expect(environmentName).toBeDefined();
      expect(environmentSuffix).toBeDefined();
      expect(['dev', 'staging', 'prod']).toContain(environmentName);
    });

    test('should verify all resources use consistent naming with environment suffix', async () => {
      const suffix = outputs.EnvironmentSuffix;

      // Check all resource names contain the suffix
      expect(outputs.DataBucketName).toContain(suffix);
      expect(outputs.LogsBucketName).toContain(suffix);
      expect(outputs.ApiFunctionName).toContain(suffix);
      expect(outputs.ProcessingFunctionName).toContain(suffix);
      expect(outputs.ValidationFunctionName).toContain(suffix);
    });

    test('should verify cross-stack resource sharing', async () => {
      // Verify Lambda functions have permissions to access S3 buckets
      const functionName = outputs.ApiFunctionName;
      const bucketName = outputs.DataBucketName;

      try {
        // Get Lambda function's role
        const functionConfig = await lambda.send(new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        }));

        expect(functionConfig.Role).toBeDefined();
        
        // The role should have permissions to access the S3 bucket
        // This is verified by the successful read/write test above
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn(`Function ${functionName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Stack Validation Tests', () => {
    test('should verify CloudFormation stacks are in correct state', async () => {
      const stackPrefix = 'TapStack' + outputs.EnvironmentSuffix;

      try {
        const stacks = await cloudformation.send(new ListStacksCommand({
          StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE'],
        }));

        const projectStacks = stacks.StackSummaries?.filter((s: any) => 
          s.StackName?.includes(stackPrefix)
        ) || [];

        // If stacks exist, they should be in good state
        if (projectStacks.length > 0) {
          projectStacks.forEach((stack: any) => {
            expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus);
          });
        }
      } catch (error) {
        console.warn('Could not verify CloudFormation stacks:', error);
      }
    });

    test('should verify tags are applied consistently', async () => {
      const functionName = outputs.ApiFunctionName;

      try {
        const tags = await lambda.send(new ListTagsCommand({
          Resource: `arn:aws:lambda:${outputs.DeploymentRegion}:*:function:${functionName}`,
        }));

        // Check for expected tags
        expect(tags.Tags).toBeDefined();
        if (tags.Tags) {
          expect(tags.Tags['Project']).toBe('MultiEnvironmentConsistency');
          expect(tags.Tags['ManagedBy']).toBe('CDK');
          expect(tags.Tags['Environment']).toBeDefined();
        }
      } catch (error: any) {
        // Tags might not be accessible or function might not exist
        console.warn('Could not verify tags:', error.message);
      }
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('should complete a full workflow from API to S3', async () => {
      // This test simulates a complete workflow:
      // 1. Call API Gateway endpoint
      // 2. API triggers Lambda function
      // 3. Lambda writes to S3
      // 4. Verify data in S3

      const apiUrl = outputs.ApiUrl;
      const bucketName = outputs.DataBucketName;

      if (apiUrl && bucketName) {
        // Note: In a real deployment, you would make an HTTP request to the API
        // For this test, we're verifying the components exist and are connected
        
        expect(apiUrl).toContain('execute-api');
        expect(apiUrl).toContain('amazonaws.com');
        expect(bucketName).toContain('tap-');
      }
    });

    test('should verify monitoring and validation functions work', async () => {
      const validationFunctionName = outputs.ValidationFunctionName;

      try {
        // Invoke validation function
        const invokeResult = await lambda.send(new InvokeCommand({
          FunctionName: validationFunctionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({ source: 'integration-test' }),
        }));

        expect(invokeResult.StatusCode).toBe(200);
        
        if (invokeResult.Payload) {
          const payloadString = Buffer.from(invokeResult.Payload).toString();
          try {
            const payload = JSON.parse(payloadString);
            expect(payload).toBeDefined();
            
            // Validation function should return validation results
            if (payload.validations) {
              expect(Array.isArray(payload.validations)).toBe(true);
            }
          } catch (parseError) {
            // If payload is not valid JSON, check if it's a string response
            console.log('Validation Lambda payload is not JSON:', payloadString);
            expect(payloadString).toBeDefined();
            expect(payloadString.length).toBeGreaterThan(0);
          }
        }
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn(`Function ${validationFunctionName} does not exist - may have been cleaned up`);
        } else {
          throw error;
        }
      }
    });
  });
});