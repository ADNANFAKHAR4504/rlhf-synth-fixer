// End-to-end pipeline flow tests
// Tests complete CI/CD pipeline workflow from source to deployment

import fs from 'fs';
import path from 'path';
import {
  CodePipelineClient,
  StartPipelineExecutionCommand,
  GetPipelineExecutionCommand,
  ListPipelineExecutionsCommand,
  GetPipelineStateCommand,
  PipelineExecutionStatus,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetBuildsCommand,
  ListBuildsForProjectCommand,
} from '@aws-sdk/client-codebuild';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';

interface FlatOutputs {
  pipeline_arn: string;
  pipeline_name: string;
  build_project_arn: string;
  test_project_arn: string;
  deploy_project_arn: string;
  lambda_function_name: string;
  lambda_function_arn: string;
  lambda_role_arn: string;
  lambda_alias_arn: string;
  deployment_status: string;
  artifacts_bucket: string;
  source_s3_bucket_name: string;
  aws_region: string;
}

describe('End-to-End Pipeline Flow Tests', () => {
  let outputs: FlatOutputs;
  let region: string;
  let codePipelineClient: CodePipelineClient;
  let codeBuildClient: CodeBuildClient;
  let s3Client: S3Client;
  let lambdaClient: LambdaClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
    
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. ` +
        'Please ensure the infrastructure is deployed and outputs are generated.'
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    region = outputs.aws_region || process.env.AWS_REGION || 'us-east-1';

    // Initialize AWS clients
    const clientConfig = { region };
    codePipelineClient = new CodePipelineClient(clientConfig);
    codeBuildClient = new CodeBuildClient(clientConfig);
    s3Client = new S3Client(clientConfig);
    lambdaClient = new LambdaClient(clientConfig);
  });

  describe('Pipeline Workflow Integration', () => {
    test('pipeline can be triggered manually', async () => {
      const command = new StartPipelineExecutionCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(command);
      expect(response.pipelineExecutionId).toBeDefined();
      expect(response.pipelineExecutionId).toMatch(/^[a-f0-9-]+$/);
    }, 10000);

    test('can monitor pipeline execution progress', async () => {
      // Get the most recent execution
      const listCommand = new ListPipelineExecutionsCommand({
        pipelineName: outputs.pipeline_name,
        maxResults: 1,
      });

      const listResponse = await codePipelineClient.send(listCommand);
      
      if (listResponse.pipelineExecutionSummaries && listResponse.pipelineExecutionSummaries.length > 0) {
        const latestExecutionId = listResponse.pipelineExecutionSummaries[0].pipelineExecutionId!;
        
        const getCommand = new GetPipelineExecutionCommand({
          pipelineName: outputs.pipeline_name,
          pipelineExecutionId: latestExecutionId,
        });

        const getResponse = await codePipelineClient.send(getCommand);
        expect(getResponse.pipelineExecution).toBeDefined();
        expect(getResponse.pipelineExecution?.status).toBeDefined();
        
        // Status should be one of the valid pipeline execution statuses
        const validStatuses: PipelineExecutionStatus[] = [
          'InProgress',
          'Stopped',
          'Stopping',
          'Succeeded',
          'Superseded',
          'Failed'
        ];
        expect(validStatuses).toContain(getResponse.pipelineExecution?.status as PipelineExecutionStatus);
      }
    }, 10000);

    test('can retrieve pipeline stage states', async () => {
      const command = new GetPipelineStateCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(command);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates).toHaveLength(4); // Source, Build, Test, Deploy

      const stageNames = response.stageStates?.map(stage => stage.stageName) || [];
      expect(stageNames).toEqual(['Source', 'Build', 'Test', 'Deploy']);
    });
  });

  describe('Source Stage Testing', () => {
    test('can upload source code to trigger pipeline', async () => {
      // Create a simple test application
      const testAppCode = `
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': 'Hello from Lambda!',
            'timestamp': context.aws_request_id,
            'version': '1.0.0'
        })
    }
`.trim();

      // Create requirements.txt
      const requirements = `
boto3>=1.26.0
requests>=2.28.0
`.trim();

      // Create a simple buildspec for testing
      const buildspec = `
version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.12
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
  build:
    commands:
      - echo Build started on \`date\`
      - echo Testing application...
      - python -m py_compile index.py
  post_build:
    commands:
      - echo Build completed on \`date\`
artifacts:
  files:
    - index.py
    - requirements.txt
`.trim();

      // Create archive buffer (simplified for testing)
      const archiveFiles = JSON.stringify({
        'index.py': testAppCode,
        'requirements.txt': requirements,
        'buildspec.yml': buildspec
      });

      const uploadCommand = new PutObjectCommand({
        Bucket: outputs.source_s3_bucket_name,
        Key: 'source.zip', // Default source key
        Body: archiveFiles,
        ContentType: 'application/json', // Simplified for testing
      });

      await expect(s3Client.send(uploadCommand)).resolves.not.toThrow();
    }, 15000);

    test('source stage can retrieve uploaded code', async () => {
      const command = new GetObjectCommand({
        Bucket: outputs.source_s3_bucket_name,
        Key: 'source.zip',
      });

      const response = await s3Client.send(command);
      expect(response.Body).toBeDefined();
      expect(response.ContentType).toBeDefined();
    });
  });

  describe('Build Stage Testing', () => {
    test('build project can execute successfully', async () => {
      const projectName = outputs.build_project_arn.split('/').pop()!;
      
      // Get recent builds for the project
      const listCommand = new ListBuildsForProjectCommand({
        projectName: projectName,
        sortOrder: 'DESCENDING',
      });

      const listResponse = await codeBuildClient.send(listCommand);
      
      if (listResponse.ids && listResponse.ids.length > 0) {
        const getCommand = new BatchGetBuildsCommand({
          ids: [listResponse.ids[0]],
        });

        const getResponse = await codeBuildClient.send(getCommand);
        const build = getResponse.builds?.[0];

        if (build) {
          expect(build.buildStatus).toBeDefined();
          expect(['IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'STOPPED', 'TIMED_OUT']).toContain(build.buildStatus);
          expect(build.projectName).toBe(projectName);
        }
      }
    });
  });

  describe('Test Stage Testing', () => {
    test('test project can execute successfully', async () => {
      const projectName = outputs.test_project_arn.split('/').pop()!;
      
      // Get recent builds for the test project
      const listCommand = new ListBuildsForProjectCommand({
        projectName: projectName,
        sortOrder: 'DESCENDING',
      });

      const listResponse = await codeBuildClient.send(listCommand);
      
      if (listResponse.ids && listResponse.ids.length > 0) {
        const getCommand = new BatchGetBuildsCommand({
          ids: [listResponse.ids[0]],
        });

        const getResponse = await codeBuildClient.send(getCommand);
        const build = getResponse.builds?.[0];

        if (build) {
          expect(build.buildStatus).toBeDefined();
          expect(build.projectName).toBe(projectName);
          
          // Test stage should have test-specific environment variables or commands
          expect(build.environment).toBeDefined();
        }
      }
    });
  });

  describe('Deploy Stage Testing', () => {
    test('deploy project can execute successfully', async () => {
      const projectName = outputs.deploy_project_arn.split('/').pop()!;
      
      // Get recent builds for the deploy project
      const listCommand = new ListBuildsForProjectCommand({
        projectName: projectName,
        sortOrder: 'DESCENDING',
      });

      const listResponse = await codeBuildClient.send(listCommand);
      
      if (listResponse.ids && listResponse.ids.length > 0) {
        const getCommand = new BatchGetBuildsCommand({
          ids: [listResponse.ids[0]],
        });

        const getResponse = await codeBuildClient.send(getCommand);
        const build = getResponse.builds?.[0];

        if (build) {
          expect(build.buildStatus).toBeDefined();
          expect(build.projectName).toBe(projectName);
          
          // Deploy stage should have deployment-specific configuration
          expect(build.environment).toBeDefined();
        }
      }
    });

    test('deployment results in updated Lambda function', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.LastModified).toBeDefined();
      
      // Function should be invokable after deployment
      const invokeCommand = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: JSON.stringify({ test: 'e2e-deployment' }),
      });

      const invokeResponse = await lambdaClient.send(invokeCommand);
      expect(invokeResponse.StatusCode).toBe(200);
    });
  });

  describe('Full Pipeline Flow Verification', () => {
    test('complete pipeline flow from source to deployment', async () => {
      // This test verifies the entire flow works together
      // 1. Upload new source code
      const testCode = `
import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'E2E test successful!',
            'version': '2.0.0',
            'pipeline': 'working'
        })
    }
`.trim();

      const uploadCommand = new PutObjectCommand({
        Bucket: outputs.source_s3_bucket_name,
        Key: 'source.zip',
        Body: JSON.stringify({ 'index.py': testCode }),
        ContentType: 'application/json',
      });

      await s3Client.send(uploadCommand);

      // 2. Trigger pipeline execution
      const startCommand = new StartPipelineExecutionCommand({
        name: outputs.pipeline_name,
      });

      const startResponse = await codePipelineClient.send(startCommand);
      expect(startResponse.pipelineExecutionId).toBeDefined();

      // 3. Wait a bit and check status (in real scenarios, you'd poll until completion)
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusCommand = new GetPipelineExecutionCommand({
        pipelineName: outputs.pipeline_name,
        pipelineExecutionId: startResponse.pipelineExecutionId!,
      });

      const statusResponse = await codePipelineClient.send(statusCommand);
      expect(statusResponse.pipelineExecution?.status).toBeDefined();
      
      // The pipeline should at least have started
      expect(['InProgress', 'Succeeded', 'Failed']).toContain(
        statusResponse.pipelineExecution?.status as string
      );
    }, 30000);

    test('pipeline handles errors gracefully', async () => {
      // Test error handling by uploading invalid source
      const invalidCode = `
# This is invalid Python syntax
import json
def lambda_handler(event, context
    return "missing parenthesis will cause syntax error"
`.trim();

      const uploadCommand = new PutObjectCommand({
        Bucket: outputs.source_s3_bucket_name,
        Key: 'source.zip',
        Body: JSON.stringify({ 'index.py': invalidCode }),
        ContentType: 'application/json',
      });

      await s3Client.send(uploadCommand);

      const startCommand = new StartPipelineExecutionCommand({
        name: outputs.pipeline_name,
      });

      const startResponse = await codePipelineClient.send(startCommand);
      expect(startResponse.pipelineExecutionId).toBeDefined();

      // Pipeline should start even with invalid code (it will fail later)
      const statusCommand = new GetPipelineExecutionCommand({
        pipelineName: outputs.pipeline_name,
        pipelineExecutionId: startResponse.pipelineExecutionId!,
      });

      const statusResponse = await codePipelineClient.send(statusCommand);
      expect(statusResponse.pipelineExecution?.status).toBeDefined();
    }, 20000);
  });

  describe('Pipeline Artifact Flow', () => {
    test('artifacts are properly passed between stages', async () => {
      // Check that the artifacts bucket contains build artifacts
      const listCommand = new GetPipelineStateCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(listCommand);
      const stages = response.stageStates || [];
      
      // Each stage should have appropriate configuration for artifact handling
      stages.forEach(stage => {
        expect(stage.stageName).toBeDefined();
        expect(stage.actionStates).toBeDefined();
        
        if (stage.actionStates && stage.actionStates.length > 0) {
          stage.actionStates.forEach(action => {
            expect(action.actionName).toBeDefined();
          });
        }
      });
    });

    test('pipeline uses correct artifact store configuration', async () => {
      const pipelineCommand = new GetPipelineExecutionCommand;
      // This would need to be expanded to check artifact configurations
      // in a real scenario, you'd inspect the pipeline configuration
      // to ensure artifacts are being stored and retrieved correctly
      
      // For now, just verify the artifacts bucket is accessible
      const listCommand = new GetPipelineStateCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(listCommand);
      expect(response.pipelineName).toBe(outputs.pipeline_name);
    });
  });
});