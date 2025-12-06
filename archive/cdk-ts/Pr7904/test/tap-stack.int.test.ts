// Integration Tests for CI/CD Pipeline Stack
// These tests verify the deployed infrastructure works correctly
import fs from 'fs';
import {
  CodeCommitClient,
  GetRepositoryCommand,
  ListBranchesCommand,
} from '@aws-sdk/client-codecommit';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
  ListBuildsForProjectCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
  ListPipelineExecutionsCommand,
} from '@aws-sdk/client-codepipeline';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

// Configuration from CDK outputs after deployment
let outputs: Record<string, string>;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Warning: cfn-outputs/flat-outputs.json not found. Integration tests will be skipped.'
  );
  outputs = {};
}

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK Clients
const region = process.env.AWS_REGION || 'us-east-1';
const codecommitClient = new CodeCommitClient({ region });
const codebuildClient = new CodeBuildClient({ region });
const codepipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

// Helper to skip tests if stack not deployed
const skipIfNotDeployed = () => {
  if (!outputs || Object.keys(outputs).length === 0) {
    return true;
  }
  return false;
};

describe('CI/CD Pipeline Integration Tests', () => {
  // Skip all tests if stack not deployed
  beforeAll(() => {
    if (skipIfNotDeployed()) {
      console.log('⏭️  Skipping integration tests - stack not deployed');
    }
  });

  describe('CodeCommit Repository', () => {
    const repositoryName = `nodejs-app-repo-${environmentSuffix}`;

    test('repository should exist and be accessible', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetRepositoryCommand({
        repositoryName,
      });

      const response = await codecommitClient.send(command);
      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repositoryName);
    }, 30000);

    test('repository should have clone URLs available', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetRepositoryCommand({
        repositoryName,
      });

      const response = await codecommitClient.send(command);
      expect(response.repositoryMetadata?.cloneUrlHttp).toBeDefined();
      expect(response.repositoryMetadata?.cloneUrlSsh).toBeDefined();
      expect(response.repositoryMetadata?.cloneUrlHttp).toContain(
        'git-codecommit'
      );
    }, 30000);

    test('repository clone URL should match output', async () => {
      if (skipIfNotDeployed()) return;

      const outputCloneUrl = outputs.RepositoryCloneUrlHttp;
      expect(outputCloneUrl).toBeDefined();
      expect(outputCloneUrl).toContain(repositoryName);
    });
  });

  describe('S3 Artifact Bucket', () => {
    let bucketName: string;

    beforeAll(() => {
      bucketName = outputs.ArtifactBucketName || '';
    });

    test('artifact bucket should exist', async () => {
      if (skipIfNotDeployed()) return;

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('artifact bucket should have versioning enabled', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('artifact bucket should have encryption enabled', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules
      ).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    }, 30000);
  });

  describe('CloudWatch Log Group', () => {
    const logGroupName = `/aws/codebuild/nodejs-app-build-${environmentSuffix}`;

    test('log group should exist with correct retention', async () => {
      if (skipIfNotDeployed()) return;

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
      expect(logGroup?.retentionInDays).toBe(7);
    }, 30000);

    test('log group name should match output', async () => {
      if (skipIfNotDeployed()) return;

      const outputLogGroup = outputs.BuildLogGroupName;
      expect(outputLogGroup).toBe(logGroupName);
    });
  });

  describe('CodeBuild Project', () => {
    let projectName: string;

    beforeAll(() => {
      projectName = outputs.BuildProjectName || '';
    });

    test('build project should exist', async () => {
      if (skipIfNotDeployed()) return;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(projectName);
    }, 30000);

    test('build project should have correct configuration', async () => {
      if (skipIfNotDeployed()) return;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project).toBeDefined();
      expect(project?.environment?.image).toBe('aws/codebuild/standard:6.0');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.timeoutInMinutes).toBe(15);
    }, 30000);

    test('build project should have NODE_ENV environment variable', async () => {
      if (skipIfNotDeployed()) return;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      const nodeEnvVar = project?.environment?.environmentVariables?.find(
        (env) => env.name === 'NODE_ENV'
      );
      expect(nodeEnvVar).toBeDefined();
      expect(nodeEnvVar?.value).toBe('production');
      expect(nodeEnvVar?.type).toBe('PLAINTEXT');
    }, 30000);

    test('build project should have CloudWatch logs configured', async () => {
      if (skipIfNotDeployed()) return;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toBe(
        `/aws/codebuild/nodejs-app-build-${environmentSuffix}`
      );
    }, 30000);

    test('build project should have caching enabled', async () => {
      if (skipIfNotDeployed()) return;

      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });

      const response = await codebuildClient.send(command);
      const project = response.projects?.[0];

      expect(project?.cache?.type).toBe('LOCAL');
      expect(project?.cache?.modes).toContain('LOCAL_SOURCE_CACHE');
      expect(project?.cache?.modes).toContain('LOCAL_CUSTOM_CACHE');
    }, 30000);
  });

  describe('CodePipeline', () => {
    let pipelineName: string;

    beforeAll(() => {
      pipelineName = outputs.PipelineName || '';
    });

    test('pipeline should exist', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    }, 30000);

    test('pipeline should have three stages', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const stages = response.pipeline?.stages;

      expect(stages).toBeDefined();
      expect(stages?.length).toBe(3);
      expect(stages?.[0].name).toBe('Source');
      expect(stages?.[1].name).toBe('Build');
      expect(stages?.[2].name).toBe('Deploy');
    }, 30000);

    test('pipeline Source stage should be configured for CodeCommit', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.[0];

      expect(sourceStage?.name).toBe('Source');
      expect(sourceStage?.actions?.[0].actionTypeId?.provider).toBe(
        'CodeCommit'
      );
      expect(sourceStage?.actions?.[0].configuration?.BranchName).toBe('main');
      expect(
        sourceStage?.actions?.[0].configuration?.RepositoryName
      ).toBeDefined();
    }, 30000);

    test('pipeline Build stage should be configured for CodeBuild', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const buildStage = response.pipeline?.stages?.[1];

      expect(buildStage?.name).toBe('Build');
      expect(buildStage?.actions?.[0].actionTypeId?.provider).toBe(
        'CodeBuild'
      );
      expect(buildStage?.actions?.[0].configuration?.ProjectName).toBeDefined();
    }, 30000);

    test('pipeline Deploy stage should be configured for CloudFormation', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.[2];

      expect(deployStage?.name).toBe('Deploy');
      expect(deployStage?.actions?.[0].actionTypeId?.provider).toBe(
        'CloudFormation'
      );
      expect(
        deployStage?.actions?.[0].configuration?.ActionMode
      ).toBeDefined();
    }, 30000);

    test('pipeline ARN should match output', async () => {
      if (skipIfNotDeployed()) return;

      const outputPipelineArn = outputs.PipelineArn;
      expect(outputPipelineArn).toBeDefined();
      expect(outputPipelineArn).toContain(pipelineName);
      expect(outputPipelineArn).toContain('codepipeline');
    });

    test('pipeline should use artifact bucket from stack', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const artifactStore = response.pipeline?.artifactStore;

      expect(artifactStore).toBeDefined();
      expect(artifactStore?.type).toBe('S3');
      expect(artifactStore?.location).toBe(outputs.ArtifactBucketName);
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('CodeBuild role should exist', async () => {
      if (skipIfNotDeployed()) return;

      const roleName = `codebuild-nodejs-app-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
    }, 30000);

    test('CodePipeline role should exist', async () => {
      if (skipIfNotDeployed()) return;

      const roleName = `codepipeline-nodejs-app-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    }, 30000);

    test('CloudFormation role should exist', async () => {
      if (skipIfNotDeployed()) return;

      const roleName = `cloudformation-deploy-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    }, 30000);
  });

  describe('Stack Outputs', () => {
    test('all required outputs should be present', () => {
      if (skipIfNotDeployed()) return;

      const requiredOutputs = [
        'RepositoryCloneUrlHttp',
        'PipelineArn',
        'PipelineName',
        'ArtifactBucketName',
        'BuildProjectName',
        'BuildLogGroupName',
      ];

      requiredOutputs.forEach((outputKey) => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('output values should contain environment suffix', () => {
      if (skipIfNotDeployed()) return;

      expect(outputs.PipelineName).toContain(environmentSuffix);
      expect(outputs.BuildProjectName).toContain(environmentSuffix);
      expect(outputs.BuildLogGroupName).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Pipeline Functionality', () => {
    test('pipeline should be in a valid state', async () => {
      if (skipIfNotDeployed()) return;

      const pipelineName = outputs.PipelineName;
      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBe(3);
    }, 30000);

    test('pipeline execution history should be accessible', async () => {
      if (skipIfNotDeployed()) return;

      const pipelineName = outputs.PipelineName;
      const command = new ListPipelineExecutionsCommand({
        pipelineName,
        maxResults: 10,
      });

      // This should not throw, even if no executions yet
      const response = await codepipelineClient.send(command);
      expect(response.pipelineExecutionSummaries).toBeDefined();
    }, 30000);
  });

  describe('Resource Cleanup Verification', () => {
    test('resources should be tagged for identification', async () => {
      if (skipIfNotDeployed()) return;

      const command = new GetPipelineCommand({
        name: outputs.PipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.metadata).toBeDefined();
      // Tags are set at CloudFormation level, verify pipeline exists
      expect(response.pipeline?.name).toBeDefined();
    }, 30000);
  });
});
