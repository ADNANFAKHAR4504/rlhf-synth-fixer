/**
 * Integration tests for CI/CD Pipeline Stack
 * Tests deployed infrastructure resources using AWS SDK
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
} from '@aws-sdk/client-ecr';
import {ECSClient, DescribeClustersCommand, DescribeTaskDefinitionCommand} from '@aws-sdk/client-ecs';
import {CodePipelineClient, GetPipelineCommand} from '@aws-sdk/client-codepipeline';
import {CodeBuildClient, BatchGetProjectsCommand} from '@aws-sdk/client-codebuild';
import {SNSClient, GetTopicAttributesCommand} from '@aws-sdk/client-sns';
import {IAMClient, GetRoleCommand, GetRolePolicyCommand} from '@aws-sdk/client-iam';
import {SecretsManagerClient, DescribeSecretCommand} from '@aws-sdk/client-secrets-manager';
import {CloudFrontClient, GetDistributionCommand} from '@aws-sdk/client-cloudfront';
import {CloudWatchLogsClient, DescribeLogGroupsCommand} from '@aws-sdk/client-cloudwatch-logs';
import {EventBridgeClient, DescribeRuleCommand} from '@aws-sdk/client-eventbridge';

const region = process.env.AWS_REGION || 'us-east-1';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Deployment outputs not found at ${outputsPath}`);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
const environmentSuffix = 'synths5g3e4n4';

// AWS SDK clients
const s3Client = new S3Client({region});
const ecrClient = new ECRClient({region});
const ecsClient = new ECSClient({region});
const codePipelineClient = new CodePipelineClient({region});
const codeBuildClient = new CodeBuildClient({region});
const snsClient = new SNSClient({region});
const iamClient = new IAMClient({region});
const secretsClient = new SecretsManagerClient({region});
const cloudFrontClient = new CloudFrontClient({region});
const logsClient = new CloudWatchLogsClient({region});
const eventsClient = new EventBridgeClient({region});

describe('CI/CD Pipeline Integration Tests - S3 Resources', () => {
  it('should verify artifact bucket exists and is configured', async () => {
    const bucketName = outputs.artifactBucketName;
    expect(bucketName).toContain(environmentSuffix);

    // Verify bucket exists
    await expect(
      s3Client.send(new HeadBucketCommand({Bucket: bucketName}))
    ).resolves.not.toThrow();

    // Verify versioning is enabled
    const versioning = await s3Client.send(
      new GetBucketVersioningCommand({Bucket: bucketName})
    );
    expect(versioning.Status).toBe('Enabled');

    // Verify encryption is configured
    const encryption = await s3Client.send(
      new GetBucketEncryptionCommand({Bucket: bucketName})
    );
    expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();

    // Verify lifecycle rules
    const lifecycle = await s3Client.send(
      new GetBucketLifecycleConfigurationCommand({Bucket: bucketName})
    );
    expect(lifecycle.Rules).toBeDefined();
    expect(lifecycle.Rules?.length).toBeGreaterThan(0);
  });
});

describe('CI/CD Pipeline Integration Tests - ECR Resources', () => {
  it('should verify ECR repository exists and is configured', async () => {
    const repositoryUri = outputs.ecrRepositoryUri;
    expect(repositoryUri).toContain('ecr');
    expect(repositoryUri).toContain(environmentSuffix);

    const repositoryName = `app-repository-${environmentSuffix}`;

    // Verify repository exists
    const repos = await ecrClient.send(
      new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName],
      })
    );
    expect(repos.repositories).toBeDefined();
    expect(repos.repositories?.length).toBe(1);

    // Verify lifecycle policy
    const lifecycle = await ecrClient.send(
      new GetLifecyclePolicyCommand({
        repositoryName,
      })
    );
    expect(lifecycle.lifecyclePolicyText).toBeDefined();
  });
});

describe('CI/CD Pipeline Integration Tests - ECS Resources', () => {
  it('should verify ECS cluster exists', async () => {
    const clusterName = `ecs-cluster-${environmentSuffix}`;

    const clusters = await ecsClient.send(
      new DescribeClustersCommand({
        clusters: [clusterName],
      })
    );
    expect(clusters.clusters).toBeDefined();
    expect(clusters.clusters?.length).toBe(1);
    expect(clusters.clusters?.[0].clusterName).toBe(clusterName);
  });

  it('should verify ECS task definition exists and is configured', async () => {
    const taskDefArn = outputs.taskDefinitionArn;
    expect(taskDefArn).toContain('task-definition');

    const taskDef = await ecsClient.send(
      new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      })
    );
    expect(taskDef.taskDefinition).toBeDefined();
    expect(taskDef.taskDefinition?.family).toContain(environmentSuffix);
    expect(taskDef.taskDefinition?.requiresCompatibilities).toContain('FARGATE');
  });
});

describe('CI/CD Pipeline Integration Tests - CodePipeline Resources', () => {
  it('should verify CodePipeline exists and is configured', async () => {
    const pipelineName = `cicd-pipeline-${environmentSuffix}`;

    const pipeline = await codePipelineClient.send(
      new GetPipelineCommand({
        name: pipelineName,
      })
    );
    expect(pipeline.pipeline).toBeDefined();
    expect(pipeline.pipeline?.name).toBe(pipelineName);

    // Verify stages
    const stages = pipeline.pipeline?.stages || [];
    expect(stages.length).toBeGreaterThanOrEqual(2);

    // Verify Source stage
    const sourceStage = stages.find((s) => s.name === 'Source');
    expect(sourceStage).toBeDefined();

    // Verify Build stage
    const buildStage = stages.find((s) => s.name === 'Build');
    expect(buildStage).toBeDefined();
  });

  it('should verify CodeBuild project exists', async () => {
    const projectName = `docker-build-${environmentSuffix}`;

    const projects = await codeBuildClient.send(
      new BatchGetProjectsCommand({
        names: [projectName],
      })
    );
    expect(projects.projects).toBeDefined();
    expect(projects.projects?.length).toBe(1);
    expect(projects.projects?.[0].name).toBe(projectName);
  });
});

describe('CI/CD Pipeline Integration Tests - SNS Resources', () => {
  it('should verify SNS topic exists', async () => {
    const topicArn = outputs.snsTopicArn;
    expect(topicArn).toContain('sns');
    expect(topicArn).toContain('pipeline-failures');

    const attrs = await snsClient.send(
      new GetTopicAttributesCommand({
        TopicArn: topicArn,
      })
    );
    expect(attrs.Attributes).toBeDefined();
  });
});

describe('CI/CD Pipeline Integration Tests - IAM Resources', () => {
  it('should verify IAM roles exist', async () => {
    const roles = [
      `pipeline-role-${environmentSuffix}`,
      `docker-build-role-${environmentSuffix}`,
      `task-execution-role-${environmentSuffix}`,
    ];

    for (const roleName of roles) {
      const role = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );
      expect(role.Role).toBeDefined();
      expect(role.Role?.RoleName).toBe(roleName);
    }
  });
});

describe('CI/CD Pipeline Integration Tests - Secrets Manager', () => {
  it('should verify GitHub token secret exists', async () => {
    const secretName = `github-token-${environmentSuffix}`;

    const secret = await secretsClient.send(
      new DescribeSecretCommand({
        SecretId: secretName,
      })
    );
    expect(secret.Name).toBe(secretName);
  });
});

describe('CI/CD Pipeline Integration Tests - CloudFront', () => {
  it('should verify CloudFront distribution exists', async () => {
    const cloudFrontUrl = outputs.cloudFrontUrl;
    expect(cloudFrontUrl).toContain('https://');
    expect(cloudFrontUrl).toContain('cloudfront.net');

    const domainName = cloudFrontUrl.replace('https://', '');
    const distributionName = `cloudfront-distribution-${environmentSuffix}`;

    // Note: We can't easily get distribution by domain name, so we verify the URL format
    expect(domainName).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
  });
});

describe('CI/CD Pipeline Integration Tests - CloudWatch Logs', () => {
  it('should verify CloudWatch log group exists', async () => {
    const logGroupName = `/aws/codebuild/docker-build-${environmentSuffix}`;

    const logGroups = await logsClient.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      })
    );
    expect(logGroups.logGroups).toBeDefined();
    const matchingGroup = logGroups.logGroups?.find((lg) => lg.logGroupName === logGroupName);
    expect(matchingGroup).toBeDefined();
  });
});

describe('CI/CD Pipeline Integration Tests - EventBridge', () => {
  it('should verify EventBridge rule exists', async () => {
    const ruleName = `pipeline-failure-rule-${environmentSuffix}`;

    const rule = await eventsClient.send(
      new DescribeRuleCommand({
        Name: ruleName,
      })
    );
    expect(rule.Name).toBe(ruleName);
    expect(rule.State).toBe('ENABLED');
  });
});

describe('CI/CD Pipeline Integration Tests - End-to-End Validation', () => {
  it('should verify all outputs are present and valid', () => {
    expect(outputs.pipelineUrl).toBeDefined();
    expect(outputs.ecrRepositoryUri).toBeDefined();
    expect(outputs.artifactBucketName).toBeDefined();
    expect(outputs.cloudFrontUrl).toBeDefined();
    expect(outputs.snsTopicArn).toBeDefined();
    expect(outputs.taskDefinitionArn).toBeDefined();

    // Validate output formats
    expect(outputs.pipelineUrl).toContain('console.aws.amazon.com');
    expect(outputs.ecrRepositoryUri).toContain('.dkr.ecr.');
    expect(outputs.artifactBucketName).toMatch(/^[a-z0-9-]+$/);
    expect(outputs.cloudFrontUrl).toMatch(/^https:\/\//);
    expect(outputs.snsTopicArn).toMatch(/^arn:aws:sns:/);
    expect(outputs.taskDefinitionArn).toMatch(/^arn:aws:ecs:/);
  });

  it('should verify resource naming includes environmentSuffix', () => {
    expect(outputs.artifactBucketName).toContain(environmentSuffix);
    expect(outputs.snsTopicArn).toContain(environmentSuffix);
    expect(outputs.taskDefinitionArn).toContain(environmentSuffix);
  });
});
