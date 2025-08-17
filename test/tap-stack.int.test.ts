// Configuration - These are coming from cfn-outputs after cfn deploy
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
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';

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

  // Extract resource names from outputs
  const pipelineName = outputs.PipelineName;
  const codeBuildProjectName = outputs.CodeBuildProjectName;
  const pipelineArtifactsBucket = outputs.PipelineArtifactsBucket;
  const deploymentArtifactsBucket = outputs.DeploymentArtifactsBucket;
  const secretArn = outputs.SecretsManagerSecretArn;
  const snsTopicArn = outputs.SNSTopicArn;

  describe('CodePipeline Configuration', () => {
    test('pipeline should exist and be configured correctly', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toHaveLength(4);
      
      const stageNames = response.pipeline?.stages?.map(stage => stage.name) || [];
      expect(stageNames).toEqual(['Source', 'Build', 'Approval', 'Deploy']);
    });

    test('pipeline should have correct artifact store configuration', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipeline?.artifactStore).toBeDefined();
      expect(response.pipeline?.artifactStore?.type).toBe('S3');
      expect(response.pipeline?.artifactStore?.location).toBe(pipelineArtifactsBucket);
      expect(response.pipeline?.artifactStore?.encryptionKey).toBeDefined();
    });

    test('pipeline should be in a valid state', async () => {
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates).toHaveLength(4);
    });
  });

  describe('CodeBuild Project Configuration', () => {
    test('build project should exist and be configured correctly', async () => {
      const command = new BatchGetProjectsCommand({ names: [codeBuildProjectName] });
      const response = await codeBuildClient.send(command);
      
      expect(response.projects).toHaveLength(1);
      const project = response.projects?.[0];
      
      expect(project?.name).toBe(codeBuildProjectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(project?.environment?.image).toBe('aws/codebuild/standard:7.0');
    });

    test('build project should have correct environment variables', async () => {
      const command = new BatchGetProjectsCommand({ names: [codeBuildProjectName] });
      const response = await codeBuildClient.send(command);
      
      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];
      
      const requiredVars = ['PROJECT_NAME', 'ENVIRONMENT', 'SECRET_ARN', 'DEPLOYMENT_BUCKET'];
      requiredVars.forEach(varName => {
        const envVar = envVars.find(v => v.name === varName);
        expect(envVar).toBeDefined();
      });
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('pipeline artifacts bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: pipelineArtifactsBucket });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('deployment artifacts bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: deploymentArtifactsBucket });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 buckets should have encryption enabled', async () => {
      for (const bucket of [pipelineArtifactsBucket, deploymentArtifactsBucket]) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucket });
        const response = await s3Client.send(command);
        
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      }
    });

    test('S3 buckets should have versioning enabled', async () => {
      for (const bucket of [pipelineArtifactsBucket, deploymentArtifactsBucket]) {
        const command = new GetBucketVersioningCommand({ Bucket: bucket });
        const response = await s3Client.send(command);
        
        expect(response.Status).toBe('Enabled');
      }
    });

    test('S3 buckets should have public access blocked', async () => {
      for (const bucket of [pipelineArtifactsBucket, deploymentArtifactsBucket]) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucket });
        const response = await s3Client.send(command);
        
        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      }
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('build secret should exist and be encrypted', async () => {
      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsClient.send(command);
      
      expect(response.ARN).toBe(secretArn);
      expect(response.KmsKeyId).toBeDefined();
      expect(response.Name).toMatch(/build-secret$/);
    });
  });

  describe('SNS Topic Configuration', () => {
    test('approval notification topic should exist and be encrypted', async () => {
      const command = new GetTopicAttributesCommand({ TopicArn: snsTopicArn });
      const response = await snsClient.send(command);
      
      expect(response.Attributes?.TopicArn).toBe(snsTopicArn);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(response.Attributes?.DisplayName).toBe('Pipeline Approval Notifications');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('all pipeline stages should be properly connected', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      const stages = response.pipeline?.stages || [];
      
      // Validate Source stage
      const sourceStage = stages.find(s => s.name === 'Source');
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('CodeStarSourceConnection');
      
      // Validate Build stage
      const buildStage = stages.find(s => s.name === 'Build');
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe('CodeBuild');
      expect(buildStage?.actions?.[0]?.configuration?.ProjectName).toBe(codeBuildProjectName);
      
      // Validate Approval stage
      const approvalStage = stages.find(s => s.name === 'Approval');
      expect(approvalStage?.actions?.[0]?.actionTypeId?.provider).toBe('Manual');
      expect(approvalStage?.actions?.[0]?.configuration?.NotificationArn).toBe(snsTopicArn);
      
      // Validate Deploy stage
      const deployStage = stages.find(s => s.name === 'Deploy');
      expect(deployStage?.actions?.[0]?.actionTypeId?.provider).toBe('S3');
      expect(deployStage?.actions?.[0]?.configuration?.BucketName).toBe(deploymentArtifactsBucket);
    });

    test('build project should reference correct artifacts bucket', async () => {
      const command = new BatchGetProjectsCommand({ names: [codeBuildProjectName] });
      const response = await codeBuildClient.send(command);
      
      const project = response.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];
      
      const deploymentBucketVar = envVars.find(v => v.name === 'DEPLOYMENT_BUCKET');
      expect(deploymentBucketVar?.value).toBe(deploymentArtifactsBucket);
      
      const secretArnVar = envVars.find(v => v.name === 'SECRET_ARN');
      expect(secretArnVar?.value).toBe(secretArn);
    });

    test('all resources should follow naming conventions', () => {
      // Validate that all resource names contain expected patterns
      expect(pipelineName).toMatch(/-pipeline$/);
      expect(codeBuildProjectName).toMatch(/-build$/);
      expect(pipelineArtifactsBucket).toMatch(/-pipeline-artifacts-/);
      expect(deploymentArtifactsBucket).toMatch(/-deployment-artifacts-/);
      expect(secretArn).toMatch(/-build-secret$/);
      expect(snsTopicArn).toMatch(/-approval-notifications$/);
    });
  });

  describe('Security Compliance Validation', () => {
    test('all encryption should use customer-managed KMS keys', async () => {
      // Check bucket encryption uses custom KMS key
      const bucketCommand = new GetBucketEncryptionCommand({ Bucket: pipelineArtifactsBucket });
      const bucketResponse = await s3Client.send(bucketCommand);
      const kmsKeyId = bucketResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId).not.toBe('alias/aws/s3'); // Should not use AWS managed key
      
      // Verify KMS key exists and is customer-managed
      if (kmsKeyId) {
        const keyCommand = new DescribeKeyCommand({ KeyId: kmsKeyId });
        const keyResponse = await kmsClient.send(keyCommand);
        expect(keyResponse.KeyMetadata?.KeyManager).toBe('CUSTOMER');
      }
    });

    test('pipeline should have proper IAM role configuration', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);
      
      expect(response.pipeline?.roleArn).toBeDefined();
      expect(response.pipeline?.roleArn).toMatch(/CodePipelineServiceRole/);
    });
  });
});