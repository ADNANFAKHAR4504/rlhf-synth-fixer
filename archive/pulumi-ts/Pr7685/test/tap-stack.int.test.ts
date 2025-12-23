/**
 * Integration tests for the TapStack CI/CD Pipeline infrastructure
 *
 * These tests validate the deployed AWS resources by reading from
 * cfn-outputs/flat-outputs.json and verifying resources in AWS.
 */
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CI/CD Pipeline Integration Tests', () => {
  let outputs: any;
  let s3Client: AWS.S3;
  let ecrClient: AWS.ECR;
  let codePipelineClient: AWS.CodePipeline;
  let codeBuildClient: AWS.CodeBuild;
  let snsClient: AWS.SNS;
  let cloudWatchEventsClient: AWS.CloudWatchEvents;
  let iamClient: AWS.IAM;

  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Read outputs from deployment
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the infrastructure first using 'pulumi up'.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    s3Client = new AWS.S3({ region });
    ecrClient = new AWS.ECR({ region });
    codePipelineClient = new AWS.CodePipeline({ region });
    codeBuildClient = new AWS.CodeBuild({ region });
    snsClient = new AWS.SNS({ region });
    cloudWatchEventsClient = new AWS.CloudWatchEvents({ region });
    iamClient = new AWS.IAM({ region });
  });

  describe('S3 Artifact Bucket', () => {
    it('should exist and be accessible', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.headBucket({ Bucket: bucketName }).promise();
      expect(response.$response.httpResponse.statusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.artifactBucketName;
      const versioning = await s3Client.getBucketVersioning({ Bucket: bucketName }).promise();

      expect(versioning.Status).toBe('Enabled');
    });

    it('should have encryption configured', async () => {
      const bucketName = outputs.artifactBucketName;
      const encryption = await s3Client.getBucketEncryption({ Bucket: bucketName }).promise();

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    it('should have lifecycle policy configured', async () => {
      const bucketName = outputs.artifactBucketName;
      const lifecycle = await s3Client.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();

      expect(lifecycle.Rules).toBeDefined();
      const deleteRule = lifecycle.Rules?.find(r => r.ID === 'delete-old-artifacts');
      expect(deleteRule).toBeDefined();
      expect(deleteRule?.Status).toBe('Enabled');
      expect(deleteRule?.Expiration?.Days).toBe(30);
    });

    it('should have public access blocked', async () => {
      const bucketName = outputs.artifactBucketName;
      const publicAccessBlock = await s3Client.getPublicAccessBlock({ Bucket: bucketName }).promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration).toBeDefined();
      expect(publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    it('should have proper tags', async () => {
      const bucketName = outputs.artifactBucketName;
      const tagging = await s3Client.getBucketTagging({ Bucket: bucketName }).promise();

      expect(tagging.TagSet).toBeDefined();
      const projectTag = tagging.TagSet!.find(t => t.Key === 'Project');
      const managedByTag = tagging.TagSet!.find(t => t.Key === 'ManagedBy');

      expect(projectTag?.Value).toBe('CICD-Pipeline');
      expect(managedByTag?.Value).toBe('Pulumi');
    });
  });

  describe('ECR Repository', () => {
    let repositoryName: string;

    beforeAll(() => {
      // Extract repository name from URI
      const repoUri = outputs.ecrRepositoryUri;
      repositoryName = repoUri.split('/').pop();
    });

    it('should exist and be accessible', async () => {
      const response = await ecrClient.describeRepositories({
        repositoryNames: [repositoryName],
      }).promise();

      expect(response.repositories).toHaveLength(1);
      expect(response.repositories![0].repositoryName).toBe(repositoryName);
    });

    it('should have image scanning enabled', async () => {
      const response = await ecrClient.describeRepositories({
        repositoryNames: [repositoryName],
      }).promise();

      const repo = response.repositories![0];
      expect(repo.imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    it('should have lifecycle policy to retain last 10 images', async () => {
      const response = await ecrClient.getLifecyclePolicy({
        repositoryName,
      }).promise();

      expect(response.lifecyclePolicyText).toBeDefined();
      const policy = JSON.parse(response.lifecyclePolicyText!);

      expect(policy.rules).toHaveLength(1);
      expect(policy.rules[0].selection.countNumber).toBe(10);
      expect(policy.rules[0].action.type).toBe('expire');
    });

    it('should have KMS encryption enabled', async () => {
      const response = await ecrClient.describeRepositories({
        repositoryNames: [repositoryName],
      }).promise();

      const repo = response.repositories![0];
      expect(repo.encryptionConfiguration?.encryptionType).toBe('KMS');
    });
  });

  describe('CodeBuild Project', () => {
    let projectName: string;

    beforeAll(() => {
      // Extract project name from outputs or construct it
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      projectName = `docker-build-${environmentSuffix}`;
    });

    it('should exist and be accessible', async () => {
      const response = await codeBuildClient.batchGetProjects({
        names: [projectName],
      }).promise();

      expect(response.projects).toHaveLength(1);
      expect(response.projects![0].name).toBe(projectName);
    });

    it('should have correct build configuration', async () => {
      const response = await codeBuildClient.batchGetProjects({
        names: [projectName],
      }).promise();

      const project = response.projects![0];
      expect(project.environment?.type).toBe('LINUX_CONTAINER');
      expect(project.environment?.privilegedMode).toBe(true);
      expect(project.environment?.image).toContain('aws/codebuild/standard');
    });

    it('should have CloudWatch logging enabled', async () => {
      const response = await codeBuildClient.batchGetProjects({
        names: [projectName],
      }).promise();

      const project = response.projects![0];
      expect(project.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
    });

    it('should have proper service role', async () => {
      const response = await codeBuildClient.batchGetProjects({
        names: [projectName],
      }).promise();

      const project = response.projects![0];
      expect(project.serviceRole).toBeDefined();
      expect(project.serviceRole).toContain('codebuild-role');
    });
  });

  describe('CodePipeline', () => {
    let pipelineName: string;

    beforeAll(() => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      pipelineName = `app-pipeline-${environmentSuffix}`;
    });

    it('should exist and be accessible', async () => {
      const response = await codePipelineClient.getPipeline({
        name: pipelineName,
      }).promise();

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline!.name).toBe(pipelineName);
    });

    it('should have three stages (Source, Build, Deploy)', async () => {
      const response = await codePipelineClient.getPipeline({
        name: pipelineName,
      }).promise();

      const stages = response.pipeline!.stages;
      expect(stages).toHaveLength(3);
      expect(stages![0].name).toBe('Source');
      expect(stages![1].name).toBe('Build');
      expect(stages![2].name).toBe('Deploy');
    });

    it('should have manual approval in Deploy stage', async () => {
      const response = await codePipelineClient.getPipeline({
        name: pipelineName,
      }).promise();

      const deployStage = response.pipeline!.stages!.find(s => s.name === 'Deploy');
      expect(deployStage).toBeDefined();

      const approvalAction = deployStage!.actions!.find(a => a.actionTypeId?.category === 'Approval');
      expect(approvalAction).toBeDefined();
      expect(approvalAction!.actionTypeId?.provider).toBe('Manual');
    });

    it('should have artifact store configured with encryption', async () => {
      const response = await codePipelineClient.getPipeline({
        name: pipelineName,
      }).promise();

      const artifactStore = response.pipeline!.artifactStore || response.pipeline!.artifactStores![0];
      expect(artifactStore.type).toBe('S3');
      expect(artifactStore.encryptionKey).toBeDefined();
      expect(artifactStore.encryptionKey!.type).toBe('KMS');
    });
  });

  describe('SNS Topic', () => {
    let topicArn: string;

    beforeAll(() => {
      topicArn = outputs.snsTopicArn;
    });

    it('should exist and be accessible', async () => {
      const response = await snsClient.getTopicAttributes({
        TopicArn: topicArn,
      }).promise();

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    it('should have KMS encryption enabled', async () => {
      const response = await snsClient.getTopicAttributes({
        TopicArn: topicArn,
      }).promise();

      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
    });

    it('should have display name set', async () => {
      const response = await snsClient.getTopicAttributes({
        TopicArn: topicArn,
      }).promise();

      expect(response.Attributes!.DisplayName).toBe('Pipeline State Change Notifications');
    });
  });

  describe('CloudWatch Event Rules', () => {
    let environmentSuffix: string;

    beforeAll(() => {
      environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    });

    it('should have pipeline state change rule', async () => {
      const ruleName = `pipeline-state-change-${environmentSuffix}`;
      const response = await cloudWatchEventsClient.describeRule({
        Name: ruleName,
      }).promise();

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();
    });

    it('should have build failure rule', async () => {
      const ruleName = `build-failure-${environmentSuffix}`;
      const response = await cloudWatchEventsClient.describeRule({
        Name: ruleName,
      }).promise();

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();
    });

    it('should have SNS targets configured', async () => {
      const ruleName = `pipeline-state-change-${environmentSuffix}`;
      const response = await cloudWatchEventsClient.listTargetsByRule({
        Rule: ruleName,
      }).promise();

      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
      expect(response.Targets![0].Arn).toContain('sns');
    });
  });

  describe('IAM Roles', () => {
    let environmentSuffix: string;

    beforeAll(() => {
      environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    });

    it('should have CodeBuild role with proper permissions', async () => {
      const roleName = `codebuild-role-${environmentSuffix}`;
      const response = await iamClient.getRole({
        RoleName: roleName,
      }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);

      // Check trust policy
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement[0].Principal.Service).toContain('codebuild.amazonaws.com');
    });

    it('should have CodePipeline role with proper permissions', async () => {
      const roleName = `codepipeline-role-${environmentSuffix}`;
      const response = await iamClient.getRole({
        RoleName: roleName,
      }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);

      // Check trust policy
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement[0].Principal.Service).toContain('codepipeline.amazonaws.com');
    });

    it('should have CloudWatch Events role', async () => {
      const roleName = `events-role-${environmentSuffix}`;
      const response = await iamClient.getRole({
        RoleName: roleName,
      }).promise();

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);
    });
  });

  describe('Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.pipelineUrl).toBeDefined();
      expect(outputs.ecrRepositoryUri).toBeDefined();
      expect(outputs.artifactBucketName).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
    });

    it('should have valid pipeline URL format', () => {
      expect(outputs.pipelineUrl).toMatch(/^https:\/\/console\.aws\.amazon\.com\/codesuite\/codepipeline\/pipelines\/.+\/view/);
    });

    it('should have valid ECR repository URI format', () => {
      expect(outputs.ecrRepositoryUri).toMatch(/^\d+\.dkr\.ecr\..+\.amazonaws\.com\/.+/);
    });

    it('should have valid SNS topic ARN format', () => {
      expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:.+:\d+:.+/);
    });
  });
});
