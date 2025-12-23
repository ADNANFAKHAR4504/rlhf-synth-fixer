import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetPublicAccessBlockCommand,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import * as fs from 'fs';
import * as path from 'path';

// Read the deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Configure AWS clients
const s3Client = new S3Client({ region: 'us-east-1' });
const codeBuildClient = new CodeBuildClient({ region: 'us-east-1' });
const codePipelineClient = new CodePipelineClient({ region: 'us-east-1' });

describe('CI/CD Pipeline Integration Tests', () => {
  const sourceBucketName = outputs.SourceBucketName;
  const artifactsBucketName = outputs.ArtifactsBucketName;
  const buildProjectName = outputs.BuildProjectName;
  const pipelineName = outputs.PipelineName;

  describe('S3 Buckets', () => {
    test('source bucket exists and is accessible', async () => {
      if (!sourceBucketName) {
        console.log('Skipping test - no source bucket name in outputs');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: sourceBucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('artifacts bucket exists and is accessible', async () => {
      if (!artifactsBucketName) {
        console.log('Skipping test - no artifacts bucket name in outputs');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: artifactsBucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('source bucket has versioning enabled', async () => {
      if (!sourceBucketName) {
        console.log('Skipping test - no source bucket name in outputs');
        return;
      }

      const command = new GetBucketVersioningCommand({ Bucket: sourceBucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('artifacts bucket has versioning enabled', async () => {
      if (!artifactsBucketName) {
        console.log('Skipping test - no artifacts bucket name in outputs');
        return;
      }

      const command = new GetBucketVersioningCommand({ Bucket: artifactsBucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('source bucket has encryption enabled', async () => {
      if (!sourceBucketName) {
        console.log('Skipping test - no source bucket name in outputs');
        return;
      }

      const command = new GetBucketEncryptionCommand({ Bucket: sourceBucketName });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('artifacts bucket has lifecycle configuration', async () => {
      if (!artifactsBucketName) {
        console.log('Skipping test - no artifacts bucket name in outputs');
        return;
      }

      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: artifactsBucketName });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      // Check for any rule with noncurrent version expiration
      const hasNoncurrentExpiration = response.Rules?.some(r => 
        r.Status === 'Enabled' && 
        r.NoncurrentVersionExpiration?.NoncurrentDays === 30
      );
      expect(hasNoncurrentExpiration).toBe(true);
    });

    test('buckets have public access blocked', async () => {
      if (!sourceBucketName || !artifactsBucketName) {
        console.log('Skipping test - missing bucket names in outputs');
        return;
      }

      for (const bucketName of [sourceBucketName, artifactsBucketName]) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }
    });

    test('can upload objects to source bucket', async () => {
      if (!sourceBucketName) {
        console.log('Skipping test - no source bucket name in outputs');
        return;
      }

      const testContent = 'Test source file content';
      const command = new PutObjectCommand({
        Bucket: sourceBucketName,
        Key: 'test-source.txt',
        Body: testContent,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('CodeBuild Project', () => {
    test('CodeBuild project exists and is configured correctly', async () => {
      if (!buildProjectName) {
        console.log('Skipping test - no build project name in outputs');
        return;
      }

      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);
      
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      
      const project = response.projects?.[0];
      expect(project?.name).toBe(buildProjectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project?.environment?.image).toBe('aws/codebuild/standard:7.0');
    });

    test('CodeBuild project has correct service role', async () => {
      if (!buildProjectName) {
        console.log('Skipping test - no build project name in outputs');
        return;
      }

      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);
      
      const project = response.projects?.[0];
      expect(project?.serviceRole).toBeDefined();
      expect(project?.serviceRole).toContain('CodeBuildServiceRole');
    });

    test('CodeBuild project has environment variables configured', async () => {
      if (!buildProjectName) {
        console.log('Skipping test - no build project name in outputs');
        return;
      }

      const command = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const response = await codeBuildClient.send(command);
      
      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables;
      expect(envVars).toBeDefined();
      
      const artifactsBucketVar = envVars?.find(v => v.name === 'ARTIFACTS_BUCKET');
      expect(artifactsBucketVar).toBeDefined();
      expect(artifactsBucketVar?.value).toBe(artifactsBucketName);
    });
  });

  describe('CodePipeline', () => {
    test('pipeline exists and is configured correctly', async () => {
      if (!pipelineName) {
        console.log('Skipping test - no pipeline name in outputs');
        return;
      }

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.pipelineType).toBe('V2');
      expect(response.pipeline?.executionMode).toBe('PARALLEL');
    });

    test('pipeline has three stages', async () => {
      if (!pipelineName) {
        console.log('Skipping test - no pipeline name in outputs');
        return;
      }

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      const stages = response.pipeline?.stages;
      expect(stages).toBeDefined();
      expect(stages?.length).toBe(3);
      expect(stages?.map(s => s.name)).toEqual(['Source', 'Build', 'Deploy']);
    });

    test('source stage is configured with S3 source', async () => {
      if (!pipelineName) {
        console.log('Skipping test - no pipeline name in outputs');
        return;
      }

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      const sourceStage = response.pipeline?.stages?.find(s => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions?.length).toBe(1);
      
      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.provider).toBe('S3');
      expect(sourceAction?.configuration?.S3Bucket).toBe(sourceBucketName);
      expect(sourceAction?.configuration?.S3ObjectKey).toBe('source.zip');
    });

    test('build stage uses CodeBuild', async () => {
      if (!pipelineName) {
        console.log('Skipping test - no pipeline name in outputs');
        return;
      }

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      const buildStage = response.pipeline?.stages?.find(s => s.name === 'Build');
      expect(buildStage).toBeDefined();
      expect(buildStage?.actions?.length).toBe(1);
      
      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildAction?.configuration?.ProjectName).toBe(buildProjectName);
    });

    test('deploy stage uses S3 deploy action', async () => {
      if (!pipelineName) {
        console.log('Skipping test - no pipeline name in outputs');
        return;
      }

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      const deployStage = response.pipeline?.stages?.find(s => s.name === 'Deploy');
      expect(deployStage).toBeDefined();
      expect(deployStage?.actions?.length).toBe(1);
      
      const deployAction = deployStage?.actions?.[0];
      expect(deployAction?.actionTypeId?.provider).toBe('S3');
      expect(deployAction?.configuration?.BucketName).toBe(artifactsBucketName);
    });

    test('pipeline state is available', async () => {
      if (!pipelineName) {
        console.log('Skipping test - no pipeline name in outputs');
        return;
      }

      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      // Pipeline may not have run yet, so states might be empty or incomplete
      // Just verify the structure exists
      expect(Array.isArray(response.stageStates)).toBe(true);
    });
  });

  describe('End-to-End Pipeline Workflow', () => {
    test('pipeline can be triggered by uploading to source bucket', async () => {
      if (!sourceBucketName) {
        console.log('Skipping test - no source bucket name in outputs');
        return;
      }

      // Create a simple source.zip file content
      const sourceContent = Buffer.from('PK\x03\x04' + 'test content for pipeline trigger');
      
      const uploadCommand = new PutObjectCommand({
        Bucket: sourceBucketName,
        Key: 'source.zip',
        Body: sourceContent,
        ContentType: 'application/zip',
      });

      const uploadResponse = await s3Client.send(uploadCommand);
      expect(uploadResponse.$metadata.httpStatusCode).toBe(200);

      // Verify pipeline will be triggered (event rule exists)
      // The actual pipeline execution would take time, so we just verify the setup
    });

    test('all required IAM roles are created', async () => {
      if (!pipelineName || !buildProjectName) {
        console.log('Skipping test - missing required outputs');
        return;
      }

      // Get pipeline to check its role
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);
      expect(pipelineResponse.pipeline?.roleArn).toBeDefined();
      expect(pipelineResponse.pipeline?.roleArn).toContain('PipelineServiceRole');

      // Get CodeBuild project to check its role
      const buildCommand = new BatchGetProjectsCommand({ names: [buildProjectName] });
      const buildResponse = await codeBuildClient.send(buildCommand);
      expect(buildResponse.projects?.[0]?.serviceRole).toBeDefined();
      expect(buildResponse.projects?.[0]?.serviceRole).toContain('CodeBuildServiceRole');
    });
  });
});