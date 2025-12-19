import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;
  const region = 'us-east-1';

  const s3Client = new S3Client({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const codePipelineClient = new CodePipelineClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Run deployment first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    console.log('Loaded deployment outputs:', outputs);
  });

  describe('S3 Artifact Bucket', () => {
    it('should exist and be accessible', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.artifactBucketName;

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption configured', async () => {
      const bucketName = outputs.artifactBucketName;

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have lifecycle policy configured', async () => {
      const bucketName = outputs.artifactBucketName;

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
      expect(response.Rules?.[0].Status).toBe('Enabled');
      expect(response.Rules?.[0].Expiration?.Days).toBe(30);
    });

    it('should have proper tags', async () => {
      const bucketName = outputs.artifactBucketName;

      const command = new GetBucketTaggingCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.TagSet).toBeDefined();
      expect(response.TagSet?.length).toBeGreaterThan(0);

      const nameTag = response.TagSet?.find((tag) => tag.Key === 'Name');
      const envTag = response.TagSet?.find(
        (tag) => tag.Key === 'Environment'
      );

      expect(nameTag).toBeDefined();
      expect(envTag).toBeDefined();
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should exist and be accessible', async () => {
      const logGroupName = outputs.logGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
    });

    it('should have correct retention policy', async () => {
      const logGroupName = outputs.logGroupName;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );

      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('CodeBuild Project', () => {
    it('should exist and be accessible', async () => {
      const projectName = outputs.codeBuildProjectName;
      expect(projectName).toBeDefined();

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(projectName);
    });

    it('should have correct environment configuration', async () => {
      const projectName = outputs.codeBuildProjectName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.environment).toBeDefined();
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
      expect(project?.environment?.image).toBe(
        'aws/codebuild/standard:7.0'
      );
    });

    it('should have correct environment variables', async () => {
      const projectName = outputs.codeBuildProjectName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables;

      expect(envVars).toBeDefined();
      expect(envVars?.length).toBeGreaterThan(0);

      const envSuffixVar = envVars?.find(
        (v) => v.name === 'ENVIRONMENT_SUFFIX'
      );
      expect(envSuffixVar).toBeDefined();

      const regionVar = envVars?.find(
        (v) => v.name === 'AWS_DEFAULT_REGION'
      );
      expect(regionVar).toBeDefined();
      expect(regionVar?.value).toBe('us-east-1');

      const pulumiTokenVar = envVars?.find(
        (v) => v.name === 'PULUMI_ACCESS_TOKEN'
      );
      expect(pulumiTokenVar).toBeDefined();
    });

    it('should have correct source configuration', async () => {
      const projectName = outputs.codeBuildProjectName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.source).toBeDefined();
      expect(project?.source?.type).toBe('CODEPIPELINE');
      expect(project?.source?.buildspec).toBeDefined();
    });

    it('should have Pulumi commands in buildspec', async () => {
      const projectName = outputs.codeBuildProjectName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      const buildspec = project?.source?.buildspec;

      expect(buildspec).toBeDefined();
      expect(buildspec).toContain('pulumi preview');
      expect(buildspec).toContain('pulumi up');
      expect(buildspec).toContain('npm install');
    });

    it('should have CloudWatch logs configured', async () => {
      const projectName = outputs.codeBuildProjectName;
      const logGroupName = outputs.logGroupName;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.logsConfig?.cloudWatchLogs).toBeDefined();
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toBe(
        logGroupName
      );
    });
  });

  describe('CodePipeline', () => {
    it('should exist and be accessible', async () => {
      const pipelineName = outputs.pipelineName;
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('should have correct number of stages', async () => {
      const pipelineName = outputs.pipelineName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const pipeline = response.pipeline;
      expect(pipeline?.stages).toBeDefined();
      expect(pipeline?.stages?.length).toBe(4); // Source, Build, Approval, Deploy
    });

    it('should have Source stage configured correctly', async () => {
      const pipelineName = outputs.pipelineName;
      const bucketName = outputs.artifactBucketName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages;
      const sourceStage = stages?.find((s) => s.name === 'Source');

      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions).toBeDefined();
      expect(sourceStage?.actions?.length).toBe(1);

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.category).toBe('Source');
      expect(sourceAction?.actionTypeId?.provider).toBe('S3');
      expect(sourceAction?.configuration?.S3Bucket).toBe(bucketName);
      expect(sourceAction?.outputArtifacts).toBeDefined();
    });

    it('should have Build stage configured correctly', async () => {
      const pipelineName = outputs.pipelineName;
      const codeBuildProjectName = outputs.codeBuildProjectName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages;
      const buildStage = stages?.find((s) => s.name === 'Build');

      expect(buildStage).toBeDefined();
      expect(buildStage?.actions).toBeDefined();
      expect(buildStage?.actions?.length).toBe(1);

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.actionTypeId?.category).toBe('Build');
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildAction?.configuration?.ProjectName).toBe(
        codeBuildProjectName
      );
      expect(buildAction?.inputArtifacts).toBeDefined();
      expect(buildAction?.outputArtifacts).toBeDefined();
    });

    it('should have Manual Approval stage configured correctly', async () => {
      const pipelineName = outputs.pipelineName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages;
      const approvalStage = stages?.find((s) => s.name === 'Approval');

      expect(approvalStage).toBeDefined();
      expect(approvalStage?.actions).toBeDefined();
      expect(approvalStage?.actions?.length).toBe(1);

      const approvalAction = approvalStage?.actions?.[0];
      expect(approvalAction?.actionTypeId?.category).toBe('Approval');
      expect(approvalAction?.actionTypeId?.provider).toBe('Manual');
      expect(approvalAction?.configuration?.CustomData).toBeDefined();
    });

    it('should have Deploy stage configured correctly', async () => {
      const pipelineName = outputs.pipelineName;
      const codeBuildProjectName = outputs.codeBuildProjectName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages;
      const deployStage = stages?.find((s) => s.name === 'Deploy');

      expect(deployStage).toBeDefined();
      expect(deployStage?.actions).toBeDefined();
      expect(deployStage?.actions?.length).toBe(1);

      const deployAction = deployStage?.actions?.[0];
      expect(deployAction?.actionTypeId?.category).toBe('Build');
      expect(deployAction?.actionTypeId?.provider).toBe('CodeBuild');
      expect(deployAction?.configuration?.ProjectName).toBe(
        codeBuildProjectName
      );
      expect(deployAction?.inputArtifacts).toBeDefined();
    });

    it('should have artifact store configured', async () => {
      const pipelineName = outputs.pipelineName;
      const bucketName = outputs.artifactBucketName;

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const pipeline = response.pipeline;

      // CodePipeline can use either artifactStore (singular) or artifactStores (plural)
      const artifactStores = pipeline?.artifactStores || (pipeline as any)?.artifactStore;
      expect(artifactStores).toBeDefined();

      // Handle both single artifactStore and multiple artifactStores
      if (pipeline?.artifactStores) {
        // Multiple stores (region-specific)
        const artifactStore = Object.values(artifactStores)[0];
        expect(artifactStore).toBeDefined();
        expect(artifactStore?.type).toBe('S3');
        expect(artifactStore?.location).toBe(bucketName);
      } else if ((pipeline as any)?.artifactStore) {
        // Single store
        const artifactStore = (pipeline as any).artifactStore;
        expect(artifactStore.type).toBe('S3');
        expect(artifactStore.location).toBe(bucketName);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have all resources properly connected', async () => {
      // Verify S3 bucket exists
      const bucketName = outputs.artifactBucketName;
      const headBucketCommand = new HeadBucketCommand({
        Bucket: bucketName,
      });
      await s3Client.send(headBucketCommand);

      // Verify CodeBuild project references correct bucket and log group
      const codeBuildCommand = new BatchGetProjectsCommand({
        names: [outputs.codeBuildProjectName],
      });
      const codeBuildResponse =
        await codeBuildClient.send(codeBuildCommand);
      const project = codeBuildResponse.projects?.[0];
      expect(
        project?.logsConfig?.cloudWatchLogs?.groupName
      ).toBe(outputs.logGroupName);

      // Verify Pipeline references correct bucket and CodeBuild project
      const pipelineCommand = new GetPipelineCommand({
        name: outputs.pipelineName,
      });
      const pipelineResponse =
        await codePipelineClient.send(pipelineCommand);
      const pipeline = pipelineResponse.pipeline;

      const sourceStage = pipeline?.stages?.find(
        (s) => s.name === 'Source'
      );
      expect(
        sourceStage?.actions?.[0]?.configuration?.S3Bucket
      ).toBe(bucketName);

      const buildStage = pipeline?.stages?.find(
        (s) => s.name === 'Build'
      );
      expect(buildStage?.actions?.[0]?.configuration?.ProjectName).toBe(
        outputs.codeBuildProjectName
      );
    });

    it('should validate resource naming conventions', () => {
      const environmentSuffix = outputs.artifactBucketName.split('-').pop();

      expect(outputs.artifactBucketName).toContain('pipeline-artifacts');
      expect(outputs.artifactBucketName).toContain(environmentSuffix!);

      expect(outputs.codeBuildProjectName).toContain('pulumi-pipeline');
      expect(outputs.codeBuildProjectName).toContain(environmentSuffix!);

      expect(outputs.pipelineName).toContain('infrastructure-pipeline');
      expect(outputs.pipelineName).toContain(environmentSuffix!);

      expect(outputs.logGroupName).toContain(
        '/aws/codebuild/pulumi-pipeline'
      );
      expect(outputs.logGroupName).toContain(environmentSuffix!);
    });
  });
});
