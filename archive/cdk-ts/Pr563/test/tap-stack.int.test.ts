import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListTagsForResourceCommand,
} from '@aws-sdk/client-codepipeline';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  const region = 'us-east-1';
  const codePipelineClient = new CodePipelineClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const s3Client = new S3Client({ region });

  let outputs: any;

  beforeAll(() => {
    // Load the deployment outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('CodePipeline Configuration', () => {
    test('pipeline exists and is configured correctly', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(outputs.PipelineName);
      expect(response.pipeline?.pipelineType).toBe('V2');
      expect(response.pipeline?.stages).toHaveLength(3);

      const stageNames = response.pipeline?.stages?.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    });

    test('pipeline has correct variables configured', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);
      const variables = response.pipeline?.variables;

      expect(variables).toBeDefined();
      expect(variables?.length).toBeGreaterThanOrEqual(2);

      const varNames = variables?.map(v => v.name);
      expect(varNames).toContain('DEPLOY_ENVIRONMENT');
      expect(varNames).toContain('COMMIT_ID');
    });

    test('deploy stage has parallel actions for multiple regions', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.find(
        s => s.name === 'Deploy'
      );

      expect(deployStage).toBeDefined();
      expect(deployStage?.actions).toHaveLength(2);

      const actionNames = deployStage?.actions?.map(a => a.name);
      expect(actionNames).toContain('Deploy-us-east-1');
      expect(actionNames).toContain('Deploy-eu-central-1');

      // Check that both actions have runOrder 1 (parallel execution)
      deployStage?.actions?.forEach(action => {
        expect(action.runOrder).toBe(1);
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('all required CodeBuild projects exist', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
      const projectNames = [
        `app-build-${environmentSuffix}`,
        `app-deploy-us-east-1-${environmentSuffix}`,
        `app-deploy-eu-central-1-${environmentSuffix}`,
      ];

      const command = new BatchGetProjectsCommand({
        names: projectNames,
      });

      const response = await codeBuildClient.send(command);

      expect(response.projects).toHaveLength(3);

      const retrievedNames = response.projects?.map(p => p.name);
      projectNames.forEach(name => {
        expect(retrievedNames).toContain(name);
      });
    });

    test('build project has correct configuration', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
      const command = new BatchGetProjectsCommand({
        names: [`app-build-${environmentSuffix}`],
      });

      const response = await codeBuildClient.send(command);
      const buildProject = response.projects?.[0];

      expect(buildProject).toBeDefined();
      expect(buildProject?.environment?.type).toBe('LINUX_CONTAINER');
      expect(buildProject?.environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
      expect(buildProject?.environment?.image).toBe(
        'aws/codebuild/standard:7.0'
      );
      expect(buildProject?.environment?.privilegedMode).toBe(true);
    });

    test('deployment projects have region-specific environment variables', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
      const deployProjects = [
        {
          name: `app-deploy-us-east-1-${environmentSuffix}`,
          region: 'us-east-1',
        },
        {
          name: `app-deploy-eu-central-1-${environmentSuffix}`,
          region: 'eu-central-1',
        },
      ];

      for (const project of deployProjects) {
        const command = new BatchGetProjectsCommand({
          names: [project.name],
        });

        const response = await codeBuildClient.send(command);
        const deployProject = response.projects?.[0];

        expect(deployProject).toBeDefined();

        const envVars = deployProject?.environment?.environmentVariables;
        const regionVar = envVars?.find(v => v.name === 'AWS_DEFAULT_REGION');

        expect(regionVar).toBeDefined();
        expect(regionVar?.value).toBe(project.region);
      }
    });
  });

  describe('S3 Artifact Buckets', () => {
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
    const bucketNames = [
      `cicd-artifacts-${environmentSuffix}-us-east-1-718240086340`,
      `cicd-artifacts-${environmentSuffix}-eu-central-1-718240086340`,
    ];

    test('artifact buckets exist with correct naming', async () => {
      for (const bucketName of bucketNames) {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 1,
        });

        // This will throw if bucket doesn't exist
        await expect(s3Client.send(command)).resolves.toBeDefined();
      }
    });

    test('buckets have versioning enabled', async () => {
      for (const bucketName of bucketNames) {
        const command = new GetBucketVersioningCommand({
          Bucket: bucketName,
        });

        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      }
    });

    test('buckets have lifecycle rules configured', async () => {
      for (const bucketName of bucketNames) {
        const command = new GetBucketLifecycleConfigurationCommand({
          Bucket: bucketName,
        });

        const response = await s3Client.send(command);
        expect(response.Rules).toBeDefined();
        expect(response.Rules?.length).toBeGreaterThan(0);

        const cleanupRule = response.Rules?.find(
          r => r.ID === 'cleanup-old-artifacts'
        );
        expect(cleanupRule).toBeDefined();
        expect(cleanupRule?.Status).toBe('Enabled');
        expect(cleanupRule?.Expiration?.Days).toBe(30);
      }
    });

    test('buckets have encryption enabled', async () => {
      for (const bucketName of bucketNames) {
        const command = new GetBucketEncryptionCommand({
          Bucket: bucketName,
        });

        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(
          1
        );

        const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
          'AES256'
        );
      }
    });

    test('buckets have correct tags for cost allocation', async () => {
      for (const bucketName of bucketNames) {
        const command = new GetBucketTaggingCommand({
          Bucket: bucketName,
        });

        const response = await s3Client.send(command);
        expect(response.TagSet).toBeDefined();

        const tagMap: { [key: string]: string } = {};
        response.TagSet?.forEach(tag => {
          if (tag.Key) tagMap[tag.Key] = tag.Value || '';
        });

        expect(tagMap['Environment']).toBe(environmentSuffix);
        expect(tagMap['CostCenter']).toBe('Engineering');
        expect(tagMap['Purpose']).toBe('CI/CD Artifacts');
        expect(tagMap['Region']).toBeDefined();
      }
    });
  });

  describe('Multi-Region Deployment Validation', () => {
    test('pipeline can deploy to multiple regions', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.find(
        s => s.name === 'Deploy'
      );

      // Verify both region deployment actions exist
      const usEast1Action = deployStage?.actions?.find(
        a => a.name === 'Deploy-us-east-1'
      );
      const euCentral1Action = deployStage?.actions?.find(
        a => a.name === 'Deploy-eu-central-1'
      );

      expect(usEast1Action).toBeDefined();
      expect(euCentral1Action).toBeDefined();

      // Verify they use CodeBuild as the provider
      expect(usEast1Action?.actionTypeId?.provider).toBe('CodeBuild');
      expect(euCentral1Action?.actionTypeId?.provider).toBe('CodeBuild');
    });

    test('pipeline has proper cross-region artifact handling', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);

      // Check that pipeline has artifact store configuration
      expect(response.pipeline?.artifactStore).toBeDefined();
      expect(response.pipeline?.artifactStore?.location).toContain(
        'cicd-artifacts'
      );
      expect(response.pipeline?.artifactStore?.type).toBe('S3');
    });
  });

  describe('Pipeline Workflow Integration', () => {
    test('source stage is properly configured', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.find(
        s => s.name === 'Source'
      );

      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions).toHaveLength(1);

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.provider).toBe('GitHub');
      expect(sourceAction?.outputArtifacts).toHaveLength(1);
    });

    test('build stage receives source artifacts and produces build artifacts', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);
      const buildStage = response.pipeline?.stages?.find(
        s => s.name === 'Build'
      );

      expect(buildStage).toBeDefined();
      expect(buildStage?.actions).toHaveLength(1);

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.inputArtifacts).toHaveLength(1);
      expect(buildAction?.outputArtifacts).toHaveLength(1);
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
    });

    test('deploy stage receives build artifacts', async () => {
      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codePipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.find(
        s => s.name === 'Deploy'
      );

      deployStage?.actions?.forEach(action => {
        expect(action.inputArtifacts).toHaveLength(1);
        // Deploy actions should use the build output as input
        expect(action.inputArtifacts?.[0]?.name).toBeDefined();
      });
    });
  });

  describe('Cost Allocation and Tagging', () => {
    test('pipeline has required tags', async () => {
      // Tags need to be fetched separately using ListTagsForResource
      const command = new ListTagsForResourceCommand({
        resourceArn: outputs.PipelineArn,
      });

      const response = await codePipelineClient.send(command);
      const tags = response.tags;

      expect(tags).toBeDefined();
      expect(tags?.length).toBeGreaterThan(0);

      const tagMap: { [key: string]: string } = {};
      tags?.forEach(tag => {
        if (tag.key) tagMap[tag.key] = tag.value || '';
      });

      // Verify required tags for cost allocation
      expect(tagMap['Environment']).toBeDefined();
      expect(tagMap['CostCenter']).toBe('Engineering');
      expect(tagMap['Purpose']).toBe('Multi-Region CI/CD');
      expect(tagMap['Owner']).toBe('DevOps Team');
    });

    test('CodeBuild projects have proper tags', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
      const projectNames = [
        `app-build-${environmentSuffix}`,
        `app-deploy-us-east-1-${environmentSuffix}`,
        `app-deploy-eu-central-1-${environmentSuffix}`,
      ];

      const command = new BatchGetProjectsCommand({
        names: projectNames,
      });

      const response = await codeBuildClient.send(command);

      response.projects?.forEach(project => {
        expect(project.tags).toBeDefined();

        const tagMap: { [key: string]: string } = {};
        project.tags?.forEach(tag => {
          if (tag.key) tagMap[tag.key] = tag.value || '';
        });

        expect(tagMap['Environment']).toBe(environmentSuffix);
        expect(tagMap['CostCenter']).toBe('Engineering');
        expect(tagMap['Purpose']).toBeDefined();
      });
    });
  });
});
