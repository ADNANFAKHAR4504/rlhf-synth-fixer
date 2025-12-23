import fs from 'fs';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import {
  CodeCommitClient,
  GetRepositoryCommand,
} from '@aws-sdk/client-codecommit';
import {
  ECRClient,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthj7w9z6y6';
const region = process.env.AWS_REGION || 'us-east-1';

const codePipelineClient = new CodePipelineClient({ region });
const codeBuildClient = new CodeBuildClient({ region });
const codeDeployClient = new CodeDeployClient({ region });
const codeCommitClient = new CodeCommitClient({ region });
const ecrClient = new ECRClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('CI/CD Pipeline Integration Tests', () => {
  describe('CodePipeline Verification', () => {
    test('pipeline should exist and be configured correctly', async () => {
      const pipelineArn = outputs.PipelineArn;
      expect(pipelineArn).toBeDefined();
      expect(pipelineArn).toContain('codepipeline');
      expect(pipelineArn).toContain(environmentSuffix);

      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBe(5);
    });

    test('pipeline should have correct stage configuration', async () => {
      const pipelineArn = outputs.PipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages || [];
      const stageNames = stages.map(stage => stage.name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('DeployToStaging');
      expect(stageNames).toContain('ManualApproval');
      expect(stageNames).toContain('DeployToProduction');
    });

    test('pipeline state should be accessible', async () => {
      const pipelineArn = outputs.PipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
    });

    test('pipeline execution role should exist', async () => {
      const roleArn = outputs.PipelineExecutionRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('codepipeline-service-role');
      expect(roleArn).toContain(environmentSuffix);

      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });
  });

  describe('CodeBuild Project Verification', () => {
    test('build project should exist and be configured correctly', async () => {
      const projectName = outputs.CodeBuildProjectName;
      expect(projectName).toBeDefined();
      expect(projectName).toContain(environmentSuffix);

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(projectName);
    });

    test('build project should use BUILD_GENERAL1_SMALL compute type', async () => {
      const projectName = outputs.CodeBuildProjectName;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('build project should have privileged mode enabled', async () => {
      const projectName = outputs.CodeBuildProjectName;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.environment?.privilegedMode).toBe(true);
    });

    test('build project should have CloudWatch logs configured', async () => {
      const projectName = outputs.CodeBuildProjectName;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
    });
  });

  describe('CodeDeploy Application Verification', () => {
    test('deployment application should exist', async () => {
      const appName = outputs.CodeDeployApplicationName;
      expect(appName).toBeDefined();
      expect(appName).toContain(environmentSuffix);

      const command = new GetApplicationCommand({ applicationName: appName });
      const response = await codeDeployClient.send(command);

      expect(response.application).toBeDefined();
      expect(response.application?.applicationName).toBe(appName);
    });

    test('staging deployment group should exist', async () => {
      const appName = outputs.CodeDeployApplicationName;
      const groupName = `staging-deployment-group-${environmentSuffix}`;

      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: groupName,
      });
      const response = await codeDeployClient.send(command);

      expect(response.deploymentGroupInfo).toBeDefined();
      expect(response.deploymentGroupInfo?.deploymentGroupName).toBe(groupName);
    });

    test('production deployment group should exist', async () => {
      const appName = outputs.CodeDeployApplicationName;
      const groupName = `production-deployment-group-${environmentSuffix}`;

      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: groupName,
      });
      const response = await codeDeployClient.send(command);

      expect(response.deploymentGroupInfo).toBeDefined();
      expect(response.deploymentGroupInfo?.deploymentGroupName).toBe(groupName);
    });
  });

  describe('CodeCommit Repository Verification', () => {
    test('repository should exist', async () => {
      const repoUrl = outputs.CodeCommitRepositoryCloneUrlHttp;
      expect(repoUrl).toBeDefined();

      const repoName = repoUrl.split('/').pop();
      const command = new GetRepositoryCommand({ repositoryName: repoName });
      const response = await codeCommitClient.send(command);

      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repoName);
    });

    test('repository name should include environment suffix', async () => {
      const repoUrl = outputs.CodeCommitRepositoryCloneUrlHttp;
      const repoName = repoUrl.split('/').pop();
      expect(repoName).toContain(environmentSuffix);
    });
  });

  describe('ECR Repository Verification', () => {
    test('ECR repository should exist', async () => {
      const repoUri = outputs.ECRRepositoryUri;
      expect(repoUri).toBeDefined();

      const repoName = repoUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
      expect(response.repositories?.[0].repositoryName).toBe(repoName);
    });

    test('ECR repository should have image scanning enabled', async () => {
      const repoUri = outputs.ECRRepositoryUri;
      const repoName = repoUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      const repo = response.repositories?.[0];
      expect(repo?.imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    test('ECR repository should have encryption configured', async () => {
      const repoUri = outputs.ECRRepositoryUri;
      const repoName = repoUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName],
      });
      const response = await ecrClient.send(command);

      const repo = response.repositories?.[0];
      expect(repo?.encryptionConfiguration).toBeDefined();
      expect(repo?.encryptionConfiguration?.encryptionType).toBe('AES256');
    });
  });

  describe('S3 Artifact Bucket Verification', () => {
    test('artifact bucket should exist', async () => {
      const bucketName = outputs.ArtifactBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(command);
      // If this doesn't throw, bucket exists
      expect(true).toBe(true);
    });

    test('artifact bucket should have encryption enabled', async () => {
      const bucketName = outputs.ArtifactBucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('artifact bucket should have versioning enabled', async () => {
      const bucketName = outputs.ArtifactBucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('SNS Topic Verification', () => {
    test('SNS topic should exist', async () => {
      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('pipeline-notifications');
      expect(topicArn).toContain(environmentSuffix);

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('SNS topic should have display name', async () => {
      const topicArn = outputs.SNSTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.DisplayName).toBeDefined();
      expect(response.Attributes?.DisplayName).toContain('Pipeline');
    });
  });

  describe('CloudWatch Logs Verification', () => {
    test('build log group should exist', async () => {
      const logGroupName = `/aws/codebuild/build-project-${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(logGroupName);
    });

    test('build log group should have retention policy', async () => {
      const logGroupName = `/aws/codebuild/build-project-${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.[0];
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('End-to-End Pipeline Integration', () => {
    test('all pipeline components should be interconnected', async () => {
      // Verify all outputs are present
      expect(outputs.PipelineArn).toBeDefined();
      expect(outputs.PipelineExecutionRoleArn).toBeDefined();
      expect(outputs.CodeBuildProjectName).toBeDefined();
      expect(outputs.CodeDeployApplicationName).toBeDefined();
      expect(outputs.CodeCommitRepositoryCloneUrlHttp).toBeDefined();
      expect(outputs.ECRRepositoryUri).toBeDefined();
      expect(outputs.ArtifactBucketName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('all resources should use consistent environment suffix', () => {
      const resourcesWithSuffix = [
        outputs.PipelineArn,
        outputs.PipelineExecutionRoleArn,
        outputs.CodeBuildProjectName,
        outputs.CodeDeployApplicationName,
        outputs.ArtifactBucketName,
        outputs.SNSTopicArn,
      ];

      resourcesWithSuffix.forEach(resource => {
        expect(resource).toContain(environmentSuffix);
      });
    });

    test('pipeline should reference correct artifact bucket', async () => {
      const pipelineArn = outputs.PipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const artifactStore = response.pipeline?.artifactStore;
      expect(artifactStore?.type).toBe('S3');
      expect(artifactStore?.location).toBe(outputs.ArtifactBucketName);
    });

    test('pipeline should reference correct build project', async () => {
      const pipelineArn = outputs.PipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const buildStage = response.pipeline?.stages?.find(
        stage => stage.name === 'Build'
      );
      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.configuration?.ProjectName).toBe(
        outputs.CodeBuildProjectName
      );
    });

    test('pipeline should reference correct CodeCommit repository', async () => {
      const pipelineArn = outputs.PipelineArn;
      const pipelineName = pipelineArn.split(':').pop();
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        stage => stage.name === 'Source'
      );
      const sourceAction = sourceStage?.actions?.[0];
      const repoName = outputs.CodeCommitRepositoryCloneUrlHttp.split('/').pop();
      expect(sourceAction?.configuration?.RepositoryName).toBe(repoName);
    });
  });
});
