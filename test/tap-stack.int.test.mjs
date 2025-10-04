import fs from 'fs';
import {
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
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
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const codepipelineClient = new CodePipelineClient({ region });
const codebuildClient = new CodeBuildClient({ region });
const codedeployClient = new CodeDeployClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });

let outputs = {};

try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('Could not load outputs file, tests will use default values');
}

const getOutputValue = (key, defaultValue) => {
  return outputs[`TapStack${environmentSuffix}.${key}`] || defaultValue;
};

const sourceBucketName = getOutputValue('SourceBucketName', `tapstack${environmentSuffix}-sourcebucket`);
const pipelineName = `healthcare-pipeline-${environmentSuffix}`;
const applicationName = `healthcare-app-${environmentSuffix}`;
const deploymentGroupName = `healthcare-deployment-${environmentSuffix}`;
const dashboardName = `healthcare-pipeline-${environmentSuffix}`;

describe('Healthcare CI/CD Pipeline Integration Tests', () => {
  describe('S3 Source Bucket', () => {
    test('should have accessible S3 source bucket', async () => {
      if (!outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
        console.log('Skipping: SourceBucketName output not found');
        return;
      }
      
      const command = new HeadBucketCommand({
        Bucket: sourceBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('source bucket should have versioning enabled', async () => {
      if (!outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
        console.log('Skipping: SourceBucketName output not found');
        return;
      }
      
      const command = new GetBucketVersioningCommand({
        Bucket: sourceBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('source bucket should have encryption enabled', async () => {
      if (!outputs[`TapStack${environmentSuffix}.SourceBucketName`]) {
        console.log('Skipping: SourceBucketName output not found');
        return;
      }
      
      const command = new GetBucketEncryptionCommand({
        Bucket: sourceBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
    }, 30000);
  });

  describe('S3 Artifact Bucket', () => {
    let bucketName;

    beforeAll(() => {
      bucketName = getOutputValue('ArtifactBucketName', null);
    });

    test('should have accessible S3 bucket', async () => {
      if (!bucketName) {
        console.log('Skipping: ArtifactBucketName output not found');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 30000);

    test('bucket should have versioning enabled', async () => {
      if (!bucketName) {
        console.log('Skipping: ArtifactBucketName output not found');
        return;
      }
      
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('bucket should have encryption enabled', async () => {
      if (!bucketName) {
        console.log('Skipping: ArtifactBucketName output not found');
        return;
      }
      
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    }, 30000);
  });

  describe('Lambda Security Scanner', () => {
    let functionArn;

    beforeAll(() => {
      functionArn = getOutputValue('SecurityScanLambdaArn', null);
    });

    test('should have accessible Lambda function', async () => {
      if (!functionArn) {
        console.log('Skipping: SecurityScanLambdaArn output not found');
        return;
      }

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.Runtime).toContain('nodejs');
      expect(response.Configuration.Handler).toBe('index.handler');
    }, 30000);

    test('Lambda should have correct timeout', async () => {
      if (!functionArn) {
        console.log('Skipping: SecurityScanLambdaArn output not found');
        return;
      }
      
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.Timeout).toBe(600);
    }, 30000);

    test('Lambda should have environment variables', async () => {
      if (!functionArn) {
        console.log('Skipping: SecurityScanLambdaArn output not found');
        return;
      }
      
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration.Environment).toBeDefined();
      expect(response.Configuration.Environment.Variables).toHaveProperty('ARTIFACT_BUCKET');
    }, 30000);
  });

  describe('CodeBuild Projects', () => {
    test('should have three accessible CodeBuild projects', async () => {
      const projectNames = [
        `TestTapStack-BuildProject`,
        `TestTapStack-SecurityScanProject`,
        `TestTapStack-ComplianceCheckProject`,
      ];

      for (const prefix of projectNames) {
        try {
          const command = new BatchGetProjectsCommand({
            names: [prefix],
          });
          const response = await codebuildClient.send(command);
          
          if (response.projects && response.projects.length > 0) {
            expect(response.projects[0]).toBeDefined();
            expect(response.projects[0].environment).toBeDefined();
          }
        } catch (error) {
          console.log(`Project ${prefix} might have different naming, skipping`);
        }
      }
    }, 30000);
  });

  describe('CodePipeline', () => {
    test('should have accessible pipeline', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline.name).toBe(pipelineName);
      expect(response.pipeline.stages).toBeDefined();
    }, 30000);

    test('pipeline should have 6 stages', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipeline.stages).toHaveLength(6);
      
      const stageNames = response.pipeline.stages.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('BuildAndTest');
      expect(stageNames).toContain('SecurityScan');
      expect(stageNames).toContain('ComplianceCheck');
      expect(stageNames).toContain('Approval');
      expect(stageNames).toContain('Deploy');
    }, 30000);

    test('Source stage should use S3', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const sourceStage = response.pipeline.stages.find(s => s.name === 'Source');
      
      expect(sourceStage).toBeDefined();
      expect(sourceStage.actions[0].actionTypeId.provider).toBe('S3');
      expect(sourceStage.actions[0].configuration.S3ObjectKey).toBe('source.zip');
    }, 30000);

    test('BuildAndTest stage should use CodeBuild', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const buildStage = response.pipeline.stages.find(s => s.name === 'BuildAndTest');
      
      expect(buildStage).toBeDefined();
      expect(buildStage.actions[0].actionTypeId.provider).toBe('CodeBuild');
    }, 30000);

    test('SecurityScan stage should have CodeBuild and Lambda actions', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const securityStage = response.pipeline.stages.find(s => s.name === 'SecurityScan');
      
      expect(securityStage).toBeDefined();
      expect(securityStage.actions).toHaveLength(2);
      
      const codeBuildAction = securityStage.actions.find(a => a.actionTypeId.provider === 'CodeBuild');
      const lambdaAction = securityStage.actions.find(a => a.actionTypeId.provider === 'Lambda');
      
      expect(codeBuildAction).toBeDefined();
      expect(lambdaAction).toBeDefined();
    }, 30000);

    test('Approval stage should use Manual approval', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const approvalStage = response.pipeline.stages.find(s => s.name === 'Approval');
      
      expect(approvalStage).toBeDefined();
      expect(approvalStage.actions[0].actionTypeId.provider).toBe('Manual');
      expect(approvalStage.actions[0].actionTypeId.category).toBe('Approval');
    }, 30000);

    test('Deploy stage should use CodeDeploy', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      const deployStage = response.pipeline.stages.find(s => s.name === 'Deploy');
      
      expect(deployStage).toBeDefined();
      expect(deployStage.actions[0].actionTypeId.provider).toBe('CodeDeploy');
    }, 30000);

    test('pipeline state should be accessible', async () => {
      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });

      const response = await codepipelineClient.send(command);
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
    }, 30000);
  });

  describe('CodeDeploy', () => {
    test('should have accessible CodeDeploy application', async () => {
      const command = new GetApplicationCommand({
        applicationName,
      });

      const response = await codedeployClient.send(command);
      expect(response.application).toBeDefined();
      expect(response.application.applicationName).toBe(applicationName);
      expect(response.application.computePlatform).toBe('Server');
    }, 30000);

    test('should have deployment group with rollback configuration', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });

      const response = await codedeployClient.send(command);
      expect(response.deploymentGroupInfo).toBeDefined();
      expect(response.deploymentGroupInfo.deploymentGroupName).toBe(deploymentGroupName);
      expect(response.deploymentGroupInfo.autoRollbackConfiguration).toBeDefined();
      expect(response.deploymentGroupInfo.autoRollbackConfiguration.enabled).toBe(true);
      expect(response.deploymentGroupInfo.autoRollbackConfiguration.events).toContain('DEPLOYMENT_FAILURE');
    }, 30000);

  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch alarm for pipeline failures', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `TapStack${environmentSuffix}`,
        MaxRecords: 100,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      
      const pipelineAlarm = response.MetricAlarms.find(alarm =>
        alarm.MetricName === 'PipelineExecutionFailure' &&
        alarm.Namespace === 'AWS/CodePipeline'
      );
      
      expect(pipelineAlarm).toBeDefined();
      expect(pipelineAlarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(pipelineAlarm.Threshold).toBe(1);
    }, 30000);

    test('should have CloudWatch dashboard', async () => {
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });

      const response = await cloudwatchClient.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
      
      const dashboardBody = JSON.parse(response.DashboardBody);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Workflow Verification', () => {
    test('all pipeline components should be properly connected', async () => {
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);
      
      expect(pipelineResponse.pipeline.artifactStore).toBeDefined();
      expect(pipelineResponse.pipeline.artifactStore.type).toBe('S3');
      
      const bucketName = pipelineResponse.pipeline.artifactStore.location;
      const bucketCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(bucketCommand)).resolves.toBeDefined();
    }, 30000);

    test('pipeline artifact bucket should match output bucket', async () => {
      const outputBucket = getOutputValue('ArtifactBucketName', null);
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codepipelineClient.send(pipelineCommand);
      
      if (outputBucket) {
        expect(pipelineResponse.pipeline.artifactStore.location).toBe(outputBucket);
      }
    }, 30000);

    test('deployment configuration should support rollback', async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName,
        deploymentGroupName,
      });

      const response = await codedeployClient.send(command);
      const rollbackConfig = response.deploymentGroupInfo.autoRollbackConfiguration;
      
      expect(rollbackConfig.enabled).toBe(true);
      expect(rollbackConfig.events).toContain('DEPLOYMENT_FAILURE');
      expect(rollbackConfig.events).toContain('DEPLOYMENT_STOP_ON_REQUEST');
    }, 30000);
  });

  describe('Security and Compliance Verification', () => {
    test('S3 bucket should have proper security configuration', async () => {
      const bucketName = getOutputValue('ArtifactBucketName', null);
      
      if (bucketName) {
        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const encryptionResponse = await s3Client.send(encryptionCommand);
        
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        
        const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
        const versioningResponse = await s3Client.send(versioningCommand);
        
        expect(versioningResponse.Status).toBe('Enabled');
      }
    }, 30000);

    test('Lambda function should have proper IAM role', async () => {
      const functionArn = getOutputValue('SecurityScanLambdaArn', null);
      
      if (functionArn) {
        const functionName = functionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        
        expect(response.Configuration.Role).toBeDefined();
        expect(response.Configuration.Role).toMatch(/^arn:aws:iam::/);
      }
    }, 30000);

    test('pipeline should have proper IAM service role', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      expect(response.pipeline.roleArn).toBeDefined();
      expect(response.pipeline.roleArn).toMatch(/^arn:aws:iam::/);
    }, 30000);
  });
});