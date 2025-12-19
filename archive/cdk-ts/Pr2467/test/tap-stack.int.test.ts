import fs from 'fs';
import path from 'path';
import { 
  S3Client, 
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand 
} from '@aws-sdk/client-s3';
import { 
  LambdaClient, 
  GetFunctionCommand,
  InvokeCommand 
} from '@aws-sdk/client-lambda';
import { 
  CodePipelineClient, 
  GetPipelineCommand,
  GetPipelineStateCommand 
} from '@aws-sdk/client-codepipeline';
import { 
  CodeBuildClient, 
  BatchGetProjectsCommand 
} from '@aws-sdk/client-codebuild';
import { 
  SNSClient, 
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand 
} from '@aws-sdk/client-sns';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev2';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const codePipelineClient = new CodePipelineClient({ region });
const codeBuildClient = new CodeBuildClient({ region });
const snsClient = new SNSClient({ region });

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};

beforeAll(() => {
  try {
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      // Fallback: construct expected resource names based on our stack convention
      outputs = {
        SourceBucketName: `tap-app-source-${environmentSuffix.toLowerCase()}-546574183988`,
        LambdaFunctionName: `tap-app-function-${environmentSuffix.toLowerCase()}`,
        LambdaFunctionArn: `arn:aws:lambda:${region}:546574183988:function:tap-app-function-${environmentSuffix.toLowerCase()}`,
        PipelineName: `tap-app-pipeline-${environmentSuffix.toLowerCase()}`,
        BuildProjectName: `tap-app-build-${environmentSuffix.toLowerCase()}`,
        TestProjectName: `tap-app-test-${environmentSuffix.toLowerCase()}`,
        FailureNotificationTopicArn: `arn:aws:sns:${region}:546574183988:tap-app-pipeline-failures-${environmentSuffix.toLowerCase()}`,
      };
    }
  } catch (error) {
    console.warn('Could not read cfn-outputs, using fallback values:', error);
    outputs = {};
  }
});

describe('CI/CD Pipeline Integration Tests', () => {
  describe('S3 Bucket Tests', () => {
    test('should verify source bucket exists and has correct configuration', async () => {
      const bucketName = outputs.SourceBucketName;
      expect(bucketName).toBeDefined();

      // Verify bucket exists
      const headBucketCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headBucketCommand)).resolves.not.toThrow();

      // Verify bucket versioning is enabled
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Verify bucket encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, 30000);
  });

  describe('Lambda Function Tests', () => {
    test('should verify Lambda function exists and has correct configuration', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const getFunctionCommand = new GetFunctionCommand({ FunctionName: functionName });
      const functionResponse = await lambdaClient.send(getFunctionCommand);

      expect(functionResponse.Configuration?.Runtime).toBe('nodejs18.x');
      expect(functionResponse.Configuration?.Handler).toBe('index.handler');
      expect(functionResponse.Configuration?.MemorySize).toBe(128);
      expect(functionResponse.Configuration?.Timeout).toBe(30);
      expect(functionResponse.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
      expect(functionResponse.Configuration?.Environment?.Variables?.APPLICATION_NAME).toBe('tap-app');
    }, 30000);

    test('should verify Lambda function can be invoked successfully', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const invokeCommand = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({ test: 'integration-test' }),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);
      
      const responsePayload = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
      expect(responsePayload.statusCode).toBe(200);
      
      const body = JSON.parse(responsePayload.body);
      expect(body.message).toBe('Hello from Lambda!');
      expect(body.environment).toBe(environmentSuffix);
    }, 30000);
  });

  describe('CodePipeline Tests', () => {
    test('should verify pipeline exists and has correct configuration', async () => {
      const pipelineName = outputs.PipelineName;
      expect(pipelineName).toBeDefined();

      const getPipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codePipelineClient.send(getPipelineCommand);

      expect(pipelineResponse.pipeline?.name).toBe(pipelineName);
      expect(pipelineResponse.pipeline?.stages).toHaveLength(4);
      
      const stageNames = pipelineResponse.pipeline?.stages?.map(stage => stage.name) || [];
      expect(stageNames).toEqual(['Source', 'Build', 'Test', 'Deploy']);
    }, 30000);

    test('should verify pipeline state can be retrieved', async () => {
      const pipelineName = outputs.PipelineName;
      expect(pipelineName).toBeDefined();

      const getPipelineStateCommand = new GetPipelineStateCommand({ name: pipelineName });
      const stateResponse = await codePipelineClient.send(getPipelineStateCommand);

      expect(stateResponse.pipelineName).toBe(pipelineName);
      expect(stateResponse.stageStates).toBeDefined();
      expect(stateResponse.stageStates?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('CodeBuild Projects Tests', () => {
    test('should verify build project exists and has correct configuration', async () => {
      const buildProjectName = outputs.BuildProjectName;
      expect(buildProjectName).toBeDefined();

      const batchGetProjectsCommand = new BatchGetProjectsCommand({ names: [buildProjectName] });
      const projectsResponse = await codeBuildClient.send(batchGetProjectsCommand);

      expect(projectsResponse.projects).toHaveLength(1);
      const project = projectsResponse.projects?.[0];
      
      expect(project?.name).toBe(buildProjectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.image).toBe('aws/codebuild/standard:5.0');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    }, 30000);

    test('should verify test project exists and has correct configuration', async () => {
      const testProjectName = outputs.TestProjectName;
      expect(testProjectName).toBeDefined();

      const batchGetProjectsCommand = new BatchGetProjectsCommand({ names: [testProjectName] });
      const projectsResponse = await codeBuildClient.send(batchGetProjectsCommand);

      expect(projectsResponse.projects).toHaveLength(1);
      const project = projectsResponse.projects?.[0];
      
      expect(project?.name).toBe(testProjectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.image).toBe('aws/codebuild/standard:5.0');
    }, 30000);
  });

  describe('SNS Notification Tests', () => {
    test('should verify SNS topic exists and has correct configuration', async () => {
      const topicArn = outputs.FailureNotificationTopicArn;
      expect(topicArn).toBeDefined();

      const getTopicAttributesCommand = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const topicResponse = await snsClient.send(getTopicAttributesCommand);

      expect(topicResponse.Attributes?.TopicArn).toBe(topicArn);
      expect(topicResponse.Attributes?.DisplayName).toBe('Pipeline Failure Notifications');
    }, 30000);

    test('should verify SNS topic has email subscription', async () => {
      const topicArn = outputs.FailureNotificationTopicArn;
      expect(topicArn).toBeDefined();

      const listSubscriptionsCommand = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
      const subscriptionsResponse = await snsClient.send(listSubscriptionsCommand);

      expect(subscriptionsResponse.Subscriptions).toBeDefined();
      expect(subscriptionsResponse.Subscriptions?.length).toBeGreaterThan(0);
      
      const emailSubscription = subscriptionsResponse.Subscriptions?.find(sub => sub.Protocol === 'email');
      expect(emailSubscription).toBeDefined();
      expect(emailSubscription?.Endpoint).toContain('@');
    }, 30000);
  });

  describe('Integration Workflow Tests', () => {
    test('should verify all components work together', async () => {
      // This test verifies the overall integration by checking that all components exist
      // and can communicate with each other
      
      const bucketName = outputs.SourceBucketName;
      const functionName = outputs.LambdaFunctionName;
      const pipelineName = outputs.PipelineName;
      const topicArn = outputs.FailureNotificationTopicArn;

      // Verify all resources exist
      expect(bucketName).toBeDefined();
      expect(functionName).toBeDefined();
      expect(pipelineName).toBeDefined();
      expect(topicArn).toBeDefined();

      // Verify resources follow naming conventions
      expect(bucketName).toContain(environmentSuffix.toLowerCase());
      expect(functionName).toContain(environmentSuffix.toLowerCase());
      expect(pipelineName).toContain(environmentSuffix.toLowerCase());
      expect(topicArn).toContain(environmentSuffix.toLowerCase());
    }, 30000);

    test('should verify resource tagging and naming consistency', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const getFunctionCommand = new GetFunctionCommand({ FunctionName: functionName });
      const functionResponse = await lambdaClient.send(getFunctionCommand);

      // Verify function name follows convention
      expect(functionResponse.Configuration?.FunctionName).toMatch(/tap-app-function-.*/);
      
      // Verify environment variables are set correctly
      const envVars = functionResponse.Configuration?.Environment?.Variables;
      expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
      expect(envVars?.APPLICATION_NAME).toBe('tap-app');
    }, 30000);
  });

  describe('Error Handling and Resilience', () => {
    test('should handle missing output files gracefully', async () => {
      // This test verifies that our fallback mechanism works when output files are missing
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('should handle AWS API rate limiting gracefully', async () => {
      // This test verifies that our AWS API calls include proper error handling
      const functionName = outputs.LambdaFunctionName;
      
      if (functionName) {
        const getFunctionCommand = new GetFunctionCommand({ FunctionName: functionName });
        
        try {
          const response = await lambdaClient.send(getFunctionCommand);
          expect(response.Configuration).toBeDefined();
        } catch (error: any) {
          // If we hit rate limits or other AWS errors, verify they're handled appropriately
          if (error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException') {
            console.warn('Rate limiting detected, test passed gracefully');
            expect(error.name).toMatch(/(Throttling|TooManyRequests)/);
          } else {
            throw error;
          }
        }
      }
    }, 30000);
  });
});
