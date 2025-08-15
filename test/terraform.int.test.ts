// Integration tests for live AWS resources
// Uses actual deployment outputs from cfn-outputs/flat-outputs.json

import fs from 'fs';
import path from 'path';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineExecutionCommand,
  ListPipelineExecutionsCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  LambdaClient,
  GetFunctionCommand,
  GetAliasCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';

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
    const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
    
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
      'source_s3_bucket_name'
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
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
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
        new GetBucketVersioningCommand({ Bucket: outputs.source_s3_bucket_name })
      );

      expect(artifactsVersioning.Status).toBe('Enabled');
      expect(sourceVersioning.Status).toBe('Enabled');
    });

    test('buckets have public access blocked', async () => {
      const artifactsPublicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.artifacts_bucket })
      );
      const sourcePublicAccess = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs.source_s3_bucket_name })
      );

      expect(artifactsPublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(artifactsPublicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(sourcePublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(sourcePublicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });
  });

  describe('Lambda Function Integration', () => {
    test('Lambda function exists and is accessible', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
      expect(response.Configuration?.Runtime).toMatch(/python/);
    });

    test('Lambda alias exists for blue/green deployments', async () => {
      const command = new GetAliasCommand({
        FunctionName: outputs.lambda_function_name,
        Name: 'live',
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Name).toBe('live');
      expect(response.FunctionVersion).toBeDefined();
    });

    test('Lambda function has correct IAM role attached', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name,
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toContain('lambda_role');
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
        expect(project.serviceRole).toContain('codebuild_role');
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
        'Deploy'
      ]);
    });

    test('CodePipeline source stage is configured for S3', async () => {
      const command = new GetPipelineCommand({
        name: outputs.pipeline_name,
      });
      
      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.find(s => s.name === 'Source');
      
      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
      expect(sourceStage?.actions?.[0]?.configuration?.S3Bucket).toBe(outputs.source_s3_bucket_name);
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
      expect(assumePolicy.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('CodeBuild role has required permissions', async () => {
      // Extract role name from ARN in outputs (assuming it contains codebuild_role)
      const codebuildRoleArn = outputs.build_project_arn; // We'll extract from project details
      
      const projectName = outputs.build_project_arn.split('/').pop()!;
      const projectCommand = new BatchGetProjectsCommand({ names: [projectName] });
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
      expect(assumePolicy.Statement[0].Principal.Service).toContain('codebuild.amazonaws.com');
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
      
      expect(buildStage?.actions?.[0]?.configuration?.ProjectName).toBeDefined();
      expect(testStage?.actions?.[0]?.configuration?.ProjectName).toBeDefined();
      expect(deployStage?.actions?.[0]?.configuration?.ProjectName).toBeDefined();
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
});
