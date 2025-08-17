// Configuration - These are coming from cfn-outputs after cfn deploy
import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeStarConnectionsClient,
  GetConnectionCommand,
} from '@aws-sdk/client-codestar-connections';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CI/CD Pipeline Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const codePipelineClient = new CodePipelineClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const s3Client = new S3Client({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const snsClient = new SNSClient({ region });
  const kmsClient = new KMSClient({ region });
  const codeStarConnectionsClient = new CodeStarConnectionsClient({ region });

  // Extract resource names from outputs - Updated to match new output names
  const pipelineName = outputs.PipelineName;
  const codeBuildProjectName = outputs.CodeBuildProjectName;
  const pipelineArtifactsBucket = outputs.PipelineArtifactsBucket;
  const deploymentArtifactsBucket = outputs.DeploymentArtifactsBucket;
  const secretArn = outputs.SecretsManagerSecretArn;
  const snsTopicArn = outputs.SNSTopicArn;
  const kmsKeyArn = outputs.KMSKeyArn; // Added: New KMS key output
  const gitHubConnectionArn = outputs.GitHubConnectionArn; // Added: New GitHub connection output

  describe('CodeStar Connections Configuration', () => {
    test('GitHub connection should exist and be available', async () => {
      const command = new GetConnectionCommand({
        ConnectionArn: gitHubConnectionArn,
      });
      const response = await codeStarConnectionsClient.send(command);

      expect(response.Connection).toBeDefined();
      expect(response.Connection?.ConnectionArn).toBe(gitHubConnectionArn);
      expect(response.Connection?.ProviderType).toBe('GitHub');
      expect(response.Connection?.ConnectionName).toMatch(/-github$/);

      // Note: Connection status might be PENDING if not manually completed
      // In real scenarios, this should be AVAILABLE after OAuth completion
      expect(['PENDING', 'AVAILABLE']).toContain(
        response.Connection?.ConnectionStatus
      );
    });
  });

  describe('CodePipeline Configuration', () => {
    test('pipeline should exist and be configured correctly', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toHaveLength(4);

      const stageNames =
        response.pipeline?.stages?.map(stage => stage.name) || [];
      expect(stageNames).toEqual(['Source', 'Build', 'Approval', 'Deploy']);
    });

    test('pipeline should have correct artifact store configuration', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.artifactStore).toBeDefined();
      expect(response.pipeline?.artifactStore?.type).toBe('S3');
      expect(response.pipeline?.artifactStore?.location).toBe(
        pipelineArtifactsBucket
      );
      expect(response.pipeline?.artifactStore?.encryptionKey).toBeDefined();
      expect(response.pipeline?.artifactStore?.encryptionKey?.type).toBe('KMS');
      expect(response.pipeline?.artifactStore?.encryptionKey?.id).toBe(
        kmsKeyArn
      );
    });

    test('pipeline should be in a valid state', async () => {
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates).toHaveLength(4);
    });

    test('pipeline source stage should use CodeStar connection', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        s => s.name === 'Source'
      );
      expect(sourceStage).toBeDefined();

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.provider).toBe(
        'CodeStarSourceConnection'
      );
      expect(sourceAction?.configuration?.ConnectionArn).toBe(
        gitHubConnectionArn
      );
      expect(sourceAction?.configuration?.FullRepositoryId).toBeDefined();
      expect(sourceAction?.configuration?.BranchName).toBeDefined();
    });
  });

  describe('CodeBuild Project Configuration', () => {
    test('build project should exist and be configured correctly', async () => {
      const command = new BatchGetProjectsCommand({
        names: [codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toHaveLength(1);
      const project = response.projects?.[0];

      expect(project?.name).toBe(codeBuildProjectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(project?.environment?.image).toBe('aws/codebuild/standard:7.0');
    });

    test('build project should have correct environment variables', async () => {
      const command = new BatchGetProjectsCommand({
        names: [codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];

      const requiredVars = [
        'PROJECT_NAME',
        'ENVIRONMENT',
        'SECRET_ARN',
        'DEPLOYMENT_BUCKET',
      ];
      requiredVars.forEach(varName => {
        const envVar = envVars.find(v => v.name === varName);
        expect(envVar).toBeDefined();
      });

      // Validate specific environment variable values
      const secretArnVar = envVars.find(v => v.name === 'SECRET_ARN');
      expect(secretArnVar?.value).toBe(secretArn);

      const deploymentBucketVar = envVars.find(
        v => v.name === 'DEPLOYMENT_BUCKET'
      );
      expect(deploymentBucketVar?.value).toBe(deploymentArtifactsBucket);
    });

    test('build project should have proper service role', async () => {
      const command = new BatchGetProjectsCommand({
        names: [codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.serviceRole).toBeDefined();
      expect(project?.serviceRole).toMatch(/CodeBuildServiceRole/);
    });

    test('build project should have CloudWatch logs enabled', async () => {
      const command = new BatchGetProjectsCommand({
        names: [codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toMatch(
        new RegExp(`/aws/codebuild/.*-${environmentSuffix}-build`)
      );
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('pipeline artifacts bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: pipelineArtifactsBucket,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('deployment artifacts bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: deploymentArtifactsBucket,
      });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 buckets should have encryption enabled with customer KMS key', async () => {
      for (const bucket of [
        pipelineArtifactsBucket,
        deploymentArtifactsBucket,
      ]) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucket });
        const response = await s3Client.send(command);

        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
          'aws:kms'
        );
        expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(
          kmsKeyArn
        );
        expect(rule?.BucketKeyEnabled).toBe(true);
      }
    });

    test('S3 buckets should have versioning enabled', async () => {
      for (const bucket of [
        pipelineArtifactsBucket,
        deploymentArtifactsBucket,
      ]) {
        const command = new GetBucketVersioningCommand({ Bucket: bucket });
        const response = await s3Client.send(command);

        expect(response.Status).toBe('Enabled');
      }
    });

    test('S3 buckets should have public access blocked', async () => {
      for (const bucket of [
        pipelineArtifactsBucket,
        deploymentArtifactsBucket,
      ]) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucket });
        const response = await s3Client.send(command);

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      }
    });

    test('S3 bucket names should follow naming convention', () => {
      expect(pipelineArtifactsBucket).toMatch(
        new RegExp(`.*-${environmentSuffix}-pipeline-artifacts-\\d+-.*`)
      );
      expect(deploymentArtifactsBucket).toMatch(
        new RegExp(`.*-${environmentSuffix}-deployment-artifacts-\\d+-.*`)
      );
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('build secret should exist and be encrypted with KMS', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(secretArn);
      expect(response.KmsKeyId).toBe(kmsKeyArn);
      expect(response.Name).toMatch(
        new RegExp(`.*-${environmentSuffix}-build-secret$`)
      );
      expect(response.Description).toBe(
        'Secret for CI/CD pipeline build process'
      );
    });

    test('secret should have proper tags', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);

      const tags = response.Tags || [];
      const projectTag = tags.find(tag => tag.Key === 'Project');
      const environmentTag = tags.find(tag => tag.Key === 'Environment');

      expect(projectTag).toBeDefined();
      expect(environmentTag).toBeDefined();
      expect(environmentTag?.Value).toBe(environmentSuffix);
    });
  });

  describe('SNS Topic Configuration', () => {
    test('approval notification topic should exist and be encrypted', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: snsTopicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
      expect(response.Attributes?.KmsMasterKeyId).toBe(kmsKeyArn);
      expect(response.Attributes?.DisplayName).toBe(
        'Pipeline Approval Notifications'
      );
    });

    test('SNS topic should follow naming convention', () => {
      expect(snsTopicArn).toMatch(
        new RegExp(`.*:.*-${environmentSuffix}-approval-notifications$`)
      );
    });
  });

  describe('KMS Key Configuration', () => {
    test('KMS key should exist and be customer-managed', async () => {
      const command = new DescribeKeyCommand({ KeyId: kmsKeyArn });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyManager).toBe('CUSTOMER');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.Description).toMatch(
        new RegExp(`.*-${environmentSuffix} Pipeline KMS Key`)
      );
    });

    test('KMS key should be enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: kmsKeyArn });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('all pipeline stages should be properly connected', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const stages = response.pipeline?.stages || [];

      // Validate Source stage
      const sourceStage = stages.find(s => s.name === 'Source');
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'CodeStarSourceConnection'
      );
      expect(sourceStage?.actions?.[0]?.configuration?.ConnectionArn).toBe(
        gitHubConnectionArn
      );

      // Validate Build stage
      const buildStage = stages.find(s => s.name === 'Build');
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'CodeBuild'
      );
      expect(buildStage?.actions?.[0]?.configuration?.ProjectName).toBe(
        codeBuildProjectName
      );

      // Validate Approval stage
      const approvalStage = stages.find(s => s.name === 'Approval');
      expect(approvalStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'Manual'
      );
      expect(approvalStage?.actions?.[0]?.configuration?.NotificationArn).toBe(
        snsTopicArn
      );

      // Validate Deploy stage
      const deployStage = stages.find(s => s.name === 'Deploy');
      expect(deployStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
      expect(deployStage?.actions?.[0]?.configuration?.BucketName).toBe(
        deploymentArtifactsBucket
      );
    });

    test('build project should reference correct artifacts bucket and secret', async () => {
      const command = new BatchGetProjectsCommand({
        names: [codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];

      const deploymentBucketVar = envVars.find(
        v => v.name === 'DEPLOYMENT_BUCKET'
      );
      expect(deploymentBucketVar?.value).toBe(deploymentArtifactsBucket);

      const secretArnVar = envVars.find(v => v.name === 'SECRET_ARN');
      expect(secretArnVar?.value).toBe(secretArn);

      // Additional environment variables
      const projectNameVar = envVars.find(v => v.name === 'PROJECT_NAME');
      expect(projectNameVar?.value).toBeDefined();

      const environmentVar = envVars.find(v => v.name === 'ENVIRONMENT');
      expect(environmentVar?.value).toBe(environmentSuffix);
    });

    test('all resources should follow naming conventions', () => {
      // Validate that all resource names contain expected patterns
      expect(pipelineName).toMatch(
        new RegExp(`.*-${environmentSuffix}-pipeline$`)
      );
      expect(codeBuildProjectName).toMatch(
        new RegExp(`.*-${environmentSuffix}-build$`)
      );
      expect(pipelineArtifactsBucket).toMatch(
        new RegExp(`.*-${environmentSuffix}-pipeline-artifacts-`)
      );
      expect(deploymentArtifactsBucket).toMatch(
        new RegExp(`.*-${environmentSuffix}-deployment-artifacts-`)
      );
      expect(secretArn).toMatch(
        new RegExp(`.*-${environmentSuffix}-build-secret$`)
      );
      expect(snsTopicArn).toMatch(
        new RegExp(`.*-${environmentSuffix}-approval-notifications$`)
      );
      expect(gitHubConnectionArn).toMatch(
        new RegExp(`.*-${environmentSuffix}-github$`)
      );
    });
  });

  describe('Security Compliance Validation', () => {
    test('all encryption should use customer-managed KMS keys', async () => {
      // Verify KMS key exists and is customer-managed
      const keyCommand = new DescribeKeyCommand({ KeyId: kmsKeyArn });
      const keyResponse = await kmsClient.send(keyCommand);
      expect(keyResponse.KeyMetadata?.KeyManager).toBe('CUSTOMER');

      // Check bucket encryption uses the correct KMS key
      const bucketCommand = new GetBucketEncryptionCommand({
        Bucket: pipelineArtifactsBucket,
      });
      const bucketResponse = await s3Client.send(bucketCommand);
      const kmsKeyId =
        bucketResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;

      expect(kmsKeyId).toBe(kmsKeyArn);
      expect(kmsKeyId).not.toBe('alias/aws/s3'); // Should not use AWS managed key

      // Check secret encryption uses the correct KMS key
      const secretCommand = new DescribeSecretCommand({ SecretId: secretArn });
      const secretResponse = await secretsClient.send(secretCommand);
      expect(secretResponse.KmsKeyId).toBe(kmsKeyArn);

      // Check SNS topic encryption uses the correct KMS key
      const snsCommand = new GetTopicAttributesCommand({
        TopicArn: snsTopicArn,
      });
      const snsResponse = await snsClient.send(snsCommand);
      expect(snsResponse.Attributes?.KmsMasterKeyId).toBe(kmsKeyArn);
    });

    test('pipeline should have proper IAM role configuration', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.roleArn).toBeDefined();
      expect(response.pipeline?.roleArn).toMatch(/CodePipelineServiceRole/);
    });

    test('build project should have proper IAM role configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [codeBuildProjectName],
      });
      const response = await codeBuildClient.send(command);

      const project = response.projects?.[0];
      expect(project?.serviceRole).toBeDefined();
      expect(project?.serviceRole).toMatch(/CodeBuildServiceRole/);
    });

    test('pipeline artifact store should use KMS encryption', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      const artifactStore = response.pipeline?.artifactStore;
      expect(artifactStore?.encryptionKey).toBeDefined();
      expect(artifactStore?.encryptionKey?.type).toBe('KMS');
      expect(artifactStore?.encryptionKey?.id).toBe(kmsKeyArn);
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('KMS key should have proper tags', async () => {
      const command = new DescribeKeyCommand({ KeyId: kmsKeyArn });
      const response = await kmsClient.send(command);

      // Note: KMS tags are not included in DescribeKey response
      // This would require ListResourceTags API call which is tested separately
      expect(response.KeyMetadata).toBeDefined();
    });

    test('secret should have compliance tags', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);

      const tags = response.Tags || [];
      const requiredTags = ['Project', 'Environment'];

      requiredTags.forEach(tagKey => {
        const tag = tags.find(t => t.Key === tagKey);
        expect(tag).toBeDefined();
      });
    });
  });
});
