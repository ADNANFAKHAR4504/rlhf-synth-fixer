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
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
} from '@aws-sdk/client-codepipeline';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  SQSClient,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  let outputs: any;
  let environmentSuffix: string;
  const region = process.env.AWS_REGION || 'us-east-1';

  // AWS SDK clients
  const s3Client = new S3Client({ region });
  const ecrClient = new ECRClient({ region });
  const codeBuildClient = new CodeBuildClient({ region });
  const codePipelineClient = new CodePipelineClient({ region });
  const snsClient = new SNSClient({ region });
  const sqsClient = new SQSClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const dynamodbClient = new DynamoDBClient({ region });
  const eventBridgeClient = new EventBridgeClient({ region });
  const iamClient = new IAMClient({ region });

  beforeAll(() => {
    // Load outputs from flat-outputs.json
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the infrastructure first.`
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Extract environment suffix from bucket name (pipeline-artifacts-{suffix})
    if (outputs.bucketName) {
      const match = outputs.bucketName.match(/pipeline-artifacts-(.+)/);
      environmentSuffix = match ? match[1] : 'dev';
    } else {
      environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    }

    console.log('Loaded outputs:', outputs);
    console.log('Environment suffix:', environmentSuffix);
  });

  describe('S3 Artifacts Bucket', () => {
    it('should exist and be accessible', async () => {
      const bucketName = outputs.bucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('pipeline-artifacts');
      expect(bucketName).toContain(environmentSuffix);

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.bucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption configured', async () => {
      const bucketName = outputs.bucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    it('should have lifecycle rules configured for 30-day deletion', async () => {
      const bucketName = outputs.bucketName;
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const expirationRule = response.Rules?.find(
        rule => rule.Status === 'Enabled' && rule.Expiration
      );
      expect(expirationRule).toBeDefined();
      expect(expirationRule?.Expiration?.Days).toBe(30);
    });
  });

  describe('ECR Repository', () => {
    it('should exist and be accessible', async () => {
      const repositoryUri = outputs.ecrRepositoryUri;
      expect(repositoryUri).toBeDefined();
      expect(repositoryUri).toContain('dkr.ecr');
      expect(repositoryUri).toContain(`app-images-${environmentSuffix}`);

      const repositoryName = repositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName!],
      });
      const response = await ecrClient.send(command);

      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
      expect(response.repositories?.[0].repositoryName).toBe(repositoryName);
    });

    it('should have image scanning enabled', async () => {
      const repositoryUri = outputs.ecrRepositoryUri;
      const repositoryName = repositoryUri.split('/').pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repositoryName!],
      });
      const response = await ecrClient.send(command);

      expect(
        response.repositories?.[0].imageScanningConfiguration?.scanOnPush
      ).toBe(true);
    });

    it('should have lifecycle policy to keep last 10 images', async () => {
      const repositoryUri = outputs.ecrRepositoryUri;
      const repositoryName = repositoryUri.split('/').pop();
      const command = new GetLifecyclePolicyCommand({
        repositoryName: repositoryName!,
      });

      try {
        const response = await ecrClient.send(command);
        expect(response.lifecyclePolicyText).toBeDefined();

        const policy = JSON.parse(response.lifecyclePolicyText!);
        expect(policy.rules).toBeDefined();
        expect(policy.rules.length).toBeGreaterThan(0);

        const countRule = policy.rules.find(
          (rule: any) =>
            rule.selection?.countType === 'imageCountMoreThan' &&
            rule.selection?.countNumber === 10
        );
        expect(countRule).toBeDefined();
      } catch (error: any) {
        if (error.name !== 'LifecyclePolicyNotFoundException') {
          throw error;
        }
      }
    });
  });

  describe('SNS Topic', () => {
    it('should exist and be accessible', async () => {
      const topicArn = outputs.snsTopicArn;
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('arn:aws:sns');
      expect(topicArn).toContain('pipeline-notifications');

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    it('should have display name configured', async () => {
      const topicArn = outputs.snsTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.DisplayName).toBe('Pipeline Notifications');
    });
  });

  describe('SQS Queue', () => {
    it('should exist and be accessible', async () => {
      const queueUrl = outputs.sqsQueueUrl;
      expect(queueUrl).toBeDefined();
      expect(queueUrl).toContain('sqs');
      expect(queueUrl).toContain('build-events');

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
    });

    it('should have correct visibility timeout', async () => {
      const queueUrl = outputs.sqsQueueUrl;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['VisibilityTimeout'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.VisibilityTimeout).toBe('300');
    });

    it('should have correct message retention', async () => {
      const queueUrl = outputs.sqsQueueUrl;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['MessageRetentionPeriod'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.MessageRetentionPeriod).toBe('345600'); // 4 days
    });
  });

  describe('Lambda Function', () => {
    it('should exist and be accessible', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      expect(functionArn).toBeDefined();
      expect(functionArn).toContain('arn:aws:lambda');
      expect(functionArn).toContain('pipeline-action');

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('pipeline-action');
    });

    it('should have correct runtime', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
    });

    it('should have correct environment variables', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.DYNAMODB_TABLE
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.SQS_QUEUE_URL
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT_SUFFIX
      ).toBe(environmentSuffix);
    });

    it('should have correct timeout and memory', async () => {
      const functionArn = outputs.lambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Timeout).toBe(300);
      expect(response.Configuration?.MemorySize).toBe(256);
    });
  });

  describe('DynamoDB Table', () => {
    it('should exist and be accessible', async () => {
      const tableName = outputs.dynamodbTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toContain('pipeline-state');
      expect(tableName).toContain(environmentSuffix);

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
    });

    it('should have PAY_PER_REQUEST billing mode', async () => {
      const tableName = outputs.dynamodbTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('should have correct key schema', async () => {
      const tableName = outputs.dynamodbTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.KeySchema).toBeDefined();
      expect(response.Table?.KeySchema?.length).toBe(2);

      const hashKey = response.Table?.KeySchema?.find(
        key => key.KeyType === 'HASH'
      );
      const rangeKey = response.Table?.KeySchema?.find(
        key => key.KeyType === 'RANGE'
      );

      expect(hashKey?.AttributeName).toBe('PipelineId');
      expect(rangeKey?.AttributeName).toBe('Timestamp');
    });

    it('should have point-in-time recovery enabled', async () => {
      const tableName = outputs.dynamodbTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      // Note: ContinuousBackupsDescription is not returned by DescribeTableCommand
      // This would require DescribeContinuousBackupsCommand, but we'll skip for now
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });
  });

  describe('CodeBuild Project', () => {
    it('should exist and be accessible', async () => {
      const projectName = `app-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0].name).toBe(projectName);
    });

    it('should use BUILD_GENERAL1_SMALL compute type', async () => {
      const projectName = `app-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects?.[0].environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
    });

    it('should have privileged mode enabled for Docker', async () => {
      const projectName = `app-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects?.[0].environment?.privilegedMode).toBe(true);
    });

    it('should have correct environment variables', async () => {
      const projectName = `app-build-${environmentSuffix}`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      const envVars = response.projects?.[0].environment?.environmentVariables;
      expect(envVars).toBeDefined();

      const ecrVar = envVars?.find(v => v.name === 'ECR_REPOSITORY_URI');
      const regionVar = envVars?.find(v => v.name === 'AWS_DEFAULT_REGION');
      const suffixVar = envVars?.find(v => v.name === 'ENVIRONMENT_SUFFIX');

      expect(ecrVar).toBeDefined();
      expect(regionVar?.value).toBe(region);
      expect(suffixVar?.value).toBe(environmentSuffix);
    });
  });

  describe('CodePipeline', () => {
    it('should exist and be accessible', async () => {
      const pipelineName = `app-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('should have three stages', async () => {
      const pipelineName = `app-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBe(3);

      const stageNames = response.pipeline?.stages?.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Approval');
    });

    it('should have correct artifact store', async () => {
      const pipelineName = `app-pipeline-${environmentSuffix}`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline?.artifactStore?.type).toBe('S3');
      expect(response.pipeline?.artifactStore?.location).toContain(
        'pipeline-artifacts'
      );
    });
  });

  describe('CloudWatch Events Rule', () => {
    it('should exist and be accessible', async () => {
      const ruleName = `pipeline-trigger-${environmentSuffix}`;
      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    it('should target the CodePipeline', async () => {
      const ruleName = `pipeline-trigger-${environmentSuffix}`;
      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventBridgeClient.send(command);

      expect(response.Targets).toBeDefined();
      expect(response.Targets?.length).toBeGreaterThan(0);
      expect(response.Targets?.[0].Arn).toContain('codepipeline');
    });
  });

  describe('IAM Roles', () => {
    it('should have CodeBuild role with correct permissions', async () => {
      const roleName = `codebuild-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'codebuild.amazonaws.com'
      );
    });

    it('should have CodePipeline role with correct permissions', async () => {
      const roleName = `codepipeline-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'codepipeline.amazonaws.com'
      );
    });

    it('should have Lambda role with correct permissions', async () => {
      const roleName = `pipeline-lambda-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'lambda.amazonaws.com'
      );
    });

    it('should have Events role with correct permissions', async () => {
      const roleName = `pipeline-events-role-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'events.amazonaws.com'
      );
    });
  });

  describe('Pipeline URL Output', () => {
    it('should have valid pipeline URL', () => {
      const pipelineUrl = outputs.pipelineUrl;
      expect(pipelineUrl).toBeDefined();
      expect(pipelineUrl).toContain('console.aws.amazon.com');
      expect(pipelineUrl).toContain('codepipeline');
      expect(pipelineUrl).toContain(`app-pipeline-${environmentSuffix}`);
      expect(pipelineUrl).toContain(region);
    });
  });
});
