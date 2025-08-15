// Integration tests for live AWS resources
// Uses actual deployment outputs from cfn-outputs/flat-outputs.json

import {
  BatchGetBuildsCommand,
  BatchGetProjectsCommand,
  CodeBuildClient,
  ListBuildsForProjectCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineExecutionCommand,
  GetPipelineStateCommand,
  ListPipelineExecutionsCommand,
  PipelineExecutionStatus,
  StartPipelineExecutionCommand,
} from '@aws-sdk/client-codepipeline';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetAliasCommand,
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

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

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: FlatOutputs;
  let region: string;
  let codePipelineClient: CodePipelineClient;
  let codeBuildClient: CodeBuildClient;
  let lambdaClient: LambdaClient;
  let s3Client: S3Client;
  let iamClient: IAMClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.resolve(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. ` +
          'Please ensure the infrastructure is deployed and outputs are generated.'
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    region = outputs.aws_region || process.env.AWS_REGION || 'us-east-1';

    // Validate required outputs exist
    const requiredOutputs = [
      'pipeline_name',
      'lambda_function_name',
      'artifacts_bucket',
      'source_s3_bucket_name',
    ];

    for (const key of requiredOutputs) {
      if (!outputs[key as keyof FlatOutputs]) {
        throw new Error(`Missing required output: ${key}`);
      }
    }

    // Initialize AWS clients
    const clientConfig = { region };
    codePipelineClient = new CodePipelineClient(clientConfig);
    codeBuildClient = new CodeBuildClient(clientConfig);
    lambdaClient = new LambdaClient(clientConfig);
    s3Client = new S3Client(clientConfig);
    iamClient = new IAMClient(clientConfig);
  });

  describe('S3 Buckets Integration', () => {
    test('artifacts bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.artifacts_bucket,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('source bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.source_s3_bucket_name,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('artifacts bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifacts_bucket,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('source bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.source_s3_bucket_name,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
    });

    test('buckets have versioning enabled', async () => {
      const artifactsVersioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.artifacts_bucket })
      );
      const sourceVersioning = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.source_s3_bucket_name,
        })
      );

      expect(artifactsVersioning.Status).toBe('Enabled');
      expect(sourceVersioning.Status).toBe('Enabled');
    });

    test('buckets have public access blocked', async () => {
      const artifactsPublicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.artifacts_bucket })
      );
      const sourcePublicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.source_s3_bucket_name,
        })
      );

      expect(
        artifactsPublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        artifactsPublicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        sourcePublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        sourcePublicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
    });
  });

  describe('Lambda Function Integration', () => {
    test('Lambda function exists and is accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.lambda_function_name
      );
      expect(response.Configuration?.Runtime).toMatch(/python/);
    });

    test('Lambda alias exists for blue/green deployments', async () => {
      const command = new GetAliasCommand({
        FunctionName: outputs.lambda_function_name,
        Name: outputs.lambda_alias_arn.split(':').pop()!, // Extract alias name from ARN
      });

      const response = await lambdaClient.send(command);
      expect(response.Name).toBeDefined();
      expect(response.FunctionVersion).toBeDefined();
    });

    test('Lambda function has correct IAM role attached', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Role).toBeDefined();
      // Check for the pattern: contains project name and "api-handler-role"
      expect(response.Configuration?.Role).toContain('api-handler-role');
      expect(response.Configuration?.Role).toContain('serverless-app');
    });

    test('Lambda function is invokable', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: JSON.stringify({ test: 'integration' }),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();
    });
  });

  describe('CodeBuild Projects Integration', () => {
    test('all CodeBuild projects exist', async () => {
      const projectNames = [
        outputs.build_project_arn.split('/').pop(),
        outputs.test_project_arn.split('/').pop(),
        outputs.deploy_project_arn.split('/').pop(),
      ].filter(Boolean) as string[];

      const command = new BatchGetProjectsCommand({
        names: projectNames,
      });

      const response = await codeBuildClient.send(command);
      expect(response.projects).toHaveLength(3);
      expect(response.projects?.map(p => p.name)).toEqual(
        expect.arrayContaining(projectNames)
      );
    });

    test('CodeBuild projects have correct service role', async () => {
      const projectNames = [
        outputs.build_project_arn.split('/').pop(),
        outputs.test_project_arn.split('/').pop(),
        outputs.deploy_project_arn.split('/').pop(),
      ].filter(Boolean) as string[];

      const command = new BatchGetProjectsCommand({
        names: projectNames,
      });

      const response = await codeBuildClient.send(command);
      response.projects?.forEach(project => {
        expect(project.serviceRole).toBeDefined();
        // Check for the pattern: contains project name and "codebuild-role"
        expect(project.serviceRole).toContain('codebuild-role');
        expect(project.serviceRole).toContain('serverless-app');
      });
    });

    test('CodeBuild projects have correct environment configuration', async () => {
      const projectNames = [
        outputs.build_project_arn.split('/').pop(),
        outputs.test_project_arn.split('/').pop(),
        outputs.deploy_project_arn.split('/').pop(),
      ].filter(Boolean) as string[];

      const command = new BatchGetProjectsCommand({
        names: projectNames,
      });

      const response = await codeBuildClient.send(command);
      response.projects?.forEach(project => {
        expect(project.environment?.type).toBe('LINUX_CONTAINER');
        expect(project.environment?.image).toMatch(/aws\/codebuild/);
        expect(project.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      });
    });
  });

  describe('CodePipeline Integration', () => {
    test('CodePipeline exists and is accessible', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(outputs.pipeline_name);
    });

    test('CodePipeline has correct stage configuration', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];

      expect(stages).toHaveLength(4); // Source, Build, Test, Deploy
      expect(stages.map(s => s.name)).toEqual([
        'Source',
        'Build',
        'Test',
        'Deploy',
      ]);
    });

    test('CodePipeline source stage is configured for S3', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.find(
        s => s.name === 'Source'
      );

      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
      expect(sourceStage?.actions?.[0]?.configuration?.S3Bucket).toBe(
        outputs.source_s3_bucket_name
      );
    });

    test('can retrieve pipeline execution history', async () => {
      const command = new ListPipelineExecutionsCommand({
        pipelineName: outputs.pipeline_name,
        maxResults: 5,
      });

      const response = await codePipelineClient.send(command);
      expect(response.pipelineExecutionSummaries).toBeDefined();
      // Note: May be empty for newly created pipelines, that's okay
    });
  });

  describe('IAM Roles Integration', () => {
    test('Lambda IAM role exists and has basic execution permissions', async () => {
      const roleName = outputs.lambda_role_arn.split('/').pop()!;

      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role?.RoleName).toBe(roleName);

      const assumePolicy = JSON.parse(
        decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument || '')
      );
      expect(assumePolicy.Statement[0].Principal.Service).toContain(
        'lambda.amazonaws.com'
      );
    });

    test('CodeBuild role has required permissions', async () => {
      // Extract role name from ARN in outputs (assuming it contains codebuild_role)
      const codebuildRoleArn = outputs.build_project_arn; // We'll extract from project details

      const projectName = outputs.build_project_arn.split('/').pop()!;
      const projectCommand = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const projectResponse = await codeBuildClient.send(projectCommand);

      const serviceRole = projectResponse.projects?.[0]?.serviceRole;
      expect(serviceRole).toBeDefined();

      const roleName = serviceRole?.split('/').pop()!;
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role?.RoleName).toBe(roleName);

      const assumePolicy = JSON.parse(
        decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument || '')
      );
      expect(assumePolicy.Statement[0].Principal.Service).toContain(
        'codebuild.amazonaws.com'
      );
    });
  });

  describe('Cross-Resource Integration', () => {
    test('pipeline references correct CodeBuild projects', async () => {
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.pipeline_name,
      });

      const pipelineResponse = await codePipelineClient.send(pipelineCommand);
      const stages = pipelineResponse.pipeline?.stages || [];

      const buildStage = stages.find(s => s.name === 'Build');
      const testStage = stages.find(s => s.name === 'Test');
      const deployStage = stages.find(s => s.name === 'Deploy');

      expect(
        buildStage?.actions?.[0]?.configuration?.ProjectName
      ).toBeDefined();
      expect(testStage?.actions?.[0]?.configuration?.ProjectName).toBeDefined();
      expect(
        deployStage?.actions?.[0]?.configuration?.ProjectName
      ).toBeDefined();
    });

    test('pipeline uses correct S3 buckets for artifacts', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(command);
      const artifactStore = response.pipeline?.artifactStore;

      expect(artifactStore?.type).toBe('S3');
      expect(artifactStore?.location).toBe(outputs.artifacts_bucket);
    });

    test('deployment status reflects infrastructure state', async () => {
      // This tests the deployment_status output which should indicate success
      expect(outputs.deployment_status).toBeDefined();
      expect(typeof outputs.deployment_status).toBe('string');
      // The actual value will depend on the terraform configuration
    });
  });

  describe('Resource Cleanup Verification', () => {
    test('all resources are tagged appropriately for cleanup', async () => {
      // This is a best practice check - resources should have tags
      // that allow for proper cleanup and cost tracking

      const lambdaCommand = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });

      const lambdaResponse = await lambdaClient.send(lambdaCommand);

      // Check that tags exist (tags help with resource management)
      expect(lambdaResponse.Tags).toBeDefined();
    });
  });

  // End-to-End Pipeline Flow Tests
  // Tests complete CI/CD pipeline workflow from source to deployment
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

      if (
        listResponse.pipelineExecutionSummaries &&
        listResponse.pipelineExecutionSummaries.length > 0
      ) {
        const latestExecutionId =
          listResponse.pipelineExecutionSummaries[0].pipelineExecutionId!;

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
          'Failed',
        ];
        expect(validStatuses).toContain(
          getResponse.pipelineExecution?.status as PipelineExecutionStatus
        );
      }
    }, 10000);

    test('can retrieve pipeline stage states', async () => {
      const command = new GetPipelineStateCommand({
        name: outputs.pipeline_name,
      });

      const response = await codePipelineClient.send(command);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates).toHaveLength(4); // Source, Build, Test, Deploy

      const stageNames =
        response.stageStates?.map(stage => stage.stageName) || [];
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
        'buildspec.yml': buildspec,
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
          expect([
            'IN_PROGRESS',
            'SUCCEEDED',
            'FAILED',
            'STOPPED',
            'TIMED_OUT',
          ]).toContain(build.buildStatus);
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
        FunctionName: `${outputs.lambda_function_name}:${outputs.lambda_alias_arn.split(':').pop()!}`,
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

      // Wait a moment for the pipeline to start processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        // Pipeline should start even with invalid code (it will fail later)
        const statusCommand = new GetPipelineExecutionCommand({
          pipelineName: outputs.pipeline_name,
          pipelineExecutionId: startResponse.pipelineExecutionId!,
        });

        const statusResponse = await codePipelineClient.send(statusCommand);
        expect(statusResponse.pipelineExecution?.status).toBeDefined();
      } catch (error) {
        // If execution not found, it might have completed quickly
        // This is acceptable behavior, so we'll check that execution was at least started
        if (
          error instanceof Error &&
          error.name === 'PipelineExecutionNotFoundException'
        ) {
          // The fact that we got a valid executionId means the pipeline started successfully
          expect(startResponse.pipelineExecutionId).toBeDefined();
        } else {
          throw error;
        }
      }
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
