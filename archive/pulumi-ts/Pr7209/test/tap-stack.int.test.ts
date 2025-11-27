import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListPipelinesCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  LambdaClient,
  GetFunctionCommand,
  ListFunctionsCommand,
} from '@aws-sdk/client-lambda';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
  ListApplicationsCommand,
} from '@aws-sdk/client-codedeploy';

// Load deployment outputs
const outputsPath = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);

let outputs: Record<string, string> = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('TapStack Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  // AWS SDK Clients
  const s3Client = new S3Client({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const pipelineClient = new CodePipelineClient({ region });
  const codebuildClient = new CodeBuildClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const iamClient = new IAMClient({ region });
  const snsClient = new SNSClient({ region });
  const cloudwatchClient = new CloudWatchClient({ region });
  const codedeployClient = new CodeDeployClient({ region });

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      console.warn(
        'Warning: cfn-outputs/flat-outputs.json not found. Integration tests will use resource discovery.'
      );
    }
  });

  describe('S3 Artifact Bucket', () => {
    let bucketName: string;

    beforeAll(async () => {
      bucketName =
        outputs.ArtifactBucketName || `pipeline-artifacts-${environmentSuffix}`;
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have server-side encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
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

    it('should have lifecycle rules configured', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const lifecycleRule = response.Rules?.find((rule) =>
        rule.NoncurrentVersionExpiration
      );
      expect(lifecycleRule).toBeDefined();
      expect(lifecycleRule?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(
        30
      );
    });

    it('should include environment suffix in name', () => {
      expect(bucketName).toContain(environmentSuffix);
    });
  });

  describe('DynamoDB Deployment History Table', () => {
    let tableName: string;

    beforeAll(() => {
      tableName =
        outputs.DeploymentTableName ||
        `deployment-history-${environmentSuffix}`;
    });

    it('should exist and be active', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    it('should use PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    it('should have deploymentId as hash key', async () => {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);
      const hashKey = response.Table?.KeySchema?.find(
        (key) => key.KeyType === 'HASH'
      );
      expect(hashKey?.AttributeName).toBe('deploymentId');
    });

    it('should have point-in-time recovery enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: tableName,
      });
      const response = await dynamoClient.send(command);
      expect(
        response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    it('should include environment suffix in name', () => {
      expect(tableName).toContain(environmentSuffix);
    });
  });

  describe('CodePipeline', () => {
    let pipelineName: string;

    beforeAll(async () => {
      pipelineName =
        outputs.PipelineName ||
        `payment-processor-pipeline-${environmentSuffix}`;
    });

    it('should exist and be accessible', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('should have 4 stages', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);
      expect(response.pipeline?.stages?.length).toBe(4);

      const stageNames =
        response.pipeline?.stages?.map((stage) => stage.name) || [];
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy-Blue');
      expect(stageNames).toContain('Switch-Traffic');
    });

    it('should have artifact store configured', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);
      expect(
        response.pipeline?.artifactStore || response.pipeline?.artifactStores
      ).toBeDefined();
    });

    it('should include environment suffix in name', () => {
      expect(pipelineName).toContain(environmentSuffix);
    });
  });

  describe('CodeBuild Project', () => {
    let projectName: string;

    beforeAll(() => {
      projectName =
        outputs.CodeBuildProjectName ||
        `payment-processor-build-${environmentSuffix}`;
    });

    it('should exist with correct configuration', async () => {
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codebuildClient.send(command);
      expect(response.projects).toBeDefined();
      expect(response.projects?.length).toBe(1);
      expect(response.projects?.[0]?.name).toBe(projectName);
    });

    it('should use BUILD_GENERAL1_SMALL compute type', async () => {
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codebuildClient.send(command);
      expect(response.projects?.[0]?.environment?.computeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
    });

    it('should have CODEPIPELINE artifact type', async () => {
      const command = new BatchGetProjectsCommand({
        names: [projectName],
      });
      const response = await codebuildClient.send(command);
      expect(response.projects?.[0]?.artifacts?.type).toBe('CODEPIPELINE');
    });

    it('should include environment suffix in name', () => {
      expect(projectName).toContain(environmentSuffix);
    });
  });

  describe('Lambda Functions', () => {
    const blueFunctionName = `payment-processor-blue-${environmentSuffix}`;
    const greenFunctionName = `payment-processor-green-${environmentSuffix}`;

    describe('Blue Lambda', () => {
      it('should exist and be active', async () => {
        const command = new GetFunctionCommand({
          FunctionName: blueFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(blueFunctionName);
      });

      it('should use Node.js 18 runtime', async () => {
        const command = new GetFunctionCommand({
          FunctionName: blueFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.Runtime).toMatch(/nodejs18/);
      });

      it('should have 512MB memory', async () => {
        const command = new GetFunctionCommand({
          FunctionName: blueFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.MemorySize).toBe(512);
      });

      it('should have environment variables configured', async () => {
        const command = new GetFunctionCommand({
          FunctionName: blueFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(
          response.Configuration?.Environment?.Variables
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.DEPLOYMENT_TABLE
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.VERSION
        ).toBe('blue');
      });
    });

    describe('Green Lambda', () => {
      it('should exist and be active', async () => {
        const command = new GetFunctionCommand({
          FunctionName: greenFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration?.FunctionName).toBe(greenFunctionName);
      });

      it('should use Node.js 18 runtime', async () => {
        const command = new GetFunctionCommand({
          FunctionName: greenFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.Runtime).toMatch(/nodejs18/);
      });

      it('should have 512MB memory', async () => {
        const command = new GetFunctionCommand({
          FunctionName: greenFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(response.Configuration?.MemorySize).toBe(512);
      });

      it('should have environment variables configured', async () => {
        const command = new GetFunctionCommand({
          FunctionName: greenFunctionName,
        });
        const response = await lambdaClient.send(command);
        expect(
          response.Configuration?.Environment?.Variables
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.DEPLOYMENT_TABLE
        ).toBeDefined();
        expect(
          response.Configuration?.Environment?.Variables?.VERSION
        ).toBe('green');
      });
    });
  });

  describe('IAM Roles', () => {
    it('should have Lambda execution role', async () => {
      const roleName = `lambda-execution-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have CodeBuild service role', async () => {
      const roleName = `codebuild-service-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have CodePipeline service role', async () => {
      const roleName = `pipeline-service-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have CodeDeploy service role', async () => {
      const roleName = `codedeploy-service-role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });
  });

  describe('SNS Topic', () => {
    let topicArn: string;

    beforeAll(async () => {
      // Find topic by name pattern
      const listCommand = new ListTopicsCommand({});
      const listResponse = await snsClient.send(listCommand);
      const topic = listResponse.Topics?.find((t) =>
        t.TopicArn?.includes(`deployment-alarms-${environmentSuffix}`)
      );
      topicArn = topic?.TopicArn || '';
    });

    it('should exist', async () => {
      expect(topicArn).toBeTruthy();
      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    it('should include environment suffix in name', () => {
      expect(topicArn).toContain(environmentSuffix);
    });
  });

  describe('CloudWatch Alarm', () => {
    let alarmName: string;

    beforeAll(() => {
      alarmName = `lambda-errors-${environmentSuffix}`;
    });

    it('should exist and be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0]?.AlarmName).toBe(alarmName);
    });

    it('should monitor Lambda errors', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms?.[0]?.MetricName).toBe('Errors');
      expect(response.MetricAlarms?.[0]?.Namespace).toBe('AWS/Lambda');
    });

    it('should have 2 evaluation periods', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms?.[0]?.EvaluationPeriods).toBe(2);
    });

    it('should have threshold of 5', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms?.[0]?.Threshold).toBe(5);
    });
  });

  describe('CodeDeploy Application', () => {
    let applicationName: string;

    beforeAll(() => {
      applicationName = `payment-processor-app-${environmentSuffix}`;
    });

    it('should exist', async () => {
      const command = new GetApplicationCommand({
        applicationName,
      });
      const response = await codedeployClient.send(command);
      expect(response.application).toBeDefined();
      expect(response.application?.applicationName).toBe(applicationName);
    });

    it('should use Lambda compute platform', async () => {
      const command = new GetApplicationCommand({
        applicationName,
      });
      const response = await codedeployClient.send(command);
      expect(response.application?.computePlatform).toBe('Lambda');
    });

    it('should include environment suffix in name', () => {
      expect(applicationName).toContain(environmentSuffix);
    });
  });

  describe('CodeDeploy Deployment Group', () => {
    let applicationName: string;
    let deploymentGroupName: string;

    beforeAll(() => {
      applicationName = `payment-processor-app-${environmentSuffix}`;
      deploymentGroupName = `payment-processor-dg-${environmentSuffix}`;
    });

    it('should exist', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });
      const response = await codedeployClient.send(command);
      expect(response.deploymentGroupInfo).toBeDefined();
      expect(response.deploymentGroupInfo?.deploymentGroupName).toBe(
        deploymentGroupName
      );
    });

    it('should use LINEAR_10PERCENT_EVERY_10MINUTES config', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });
      const response = await codedeployClient.send(command);
      expect(
        response.deploymentGroupInfo?.deploymentConfigName
      ).toBe('CodeDeployDefault.LambdaLinear10PercentEvery10Minutes');
    });

    it('should have auto rollback enabled', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });
      const response = await codedeployClient.send(command);
      expect(
        response.deploymentGroupInfo?.autoRollbackConfiguration?.enabled
      ).toBe(true);
    });

    it('should have alarm configuration enabled', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });
      const response = await codedeployClient.send(command);
      expect(
        response.deploymentGroupInfo?.alarmConfiguration?.enabled
      ).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    it('should have pipelineUrl output', () => {
      if (Object.keys(outputs).length > 0) {
        expect(outputs.PipelineUrl || outputs.pipelineUrl).toBeDefined();
      }
    });

    it('should have deploymentTableName output', () => {
      if (Object.keys(outputs).length > 0) {
        expect(
          outputs.DeploymentTableName || outputs.deploymentTableName
        ).toBeDefined();
      }
    });
  });
});
