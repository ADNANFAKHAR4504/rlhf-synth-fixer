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
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

// Load deployed outputs
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Warning: Could not load cfn-outputs/flat-outputs.json. Tests will use default values.');
}

// AWS SDK clients
const codepipelineClient = new CodePipelineClient({});
const codebuildClient = new CodeBuildClient({});
const s3Client = new S3Client({});
const ssmClient = new SSMClient({});
const kmsClient = new KMSClient({});
const logsClient = new CloudWatchLogsClient({});

describe('CI/CD Pipeline Integration Tests', () => {
  const pipelineName = outputs.PipelineName || `trainr241-${process.env.ENVIRONMENT_SUFFIX || 'dev'}-pipeline`;
  const artifactsBucketName = outputs.ArtifactsBucketName;
  const buildProjectName = outputs.BuildProjectName;
  const testProjectName = outputs.TestProjectName;

  describe('CodePipeline Validation', () => {
    test('should have deployed pipeline with correct configuration', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.pipelineType).toBe('V2');
      expect(response.pipeline?.executionMode).toBe('QUEUED');
    });

    test('should have all required stages in correct order', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      const stages = response.pipeline?.stages || [];
      expect(stages).toHaveLength(6);
      
      const stageNames = stages.map((s: any) => s.name);
      expect(stageNames).toEqual([
        'Source',
        'Build',
        'Test',
        'DeployStaging',
        'ApprovalGate',
        'DeployProduction'
      ]);
    });

    test('should have manual approval gate before production', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      const approvalStage = response.pipeline?.stages?.find((s: any) => s.name === 'ApprovalGate');
      expect(approvalStage).toBeDefined();
      
      const approvalAction = approvalStage?.actions?.[0];
      expect(approvalAction?.actionTypeId?.category).toBe('Approval');
      expect(approvalAction?.actionTypeId?.provider).toBe('Manual');
    });

    test('should use S3 as source provider', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      const sourceStage = response.pipeline?.stages?.find((s: any) => s.name === 'Source');
      const sourceAction = sourceStage?.actions?.[0];
      
      expect(sourceAction?.actionTypeId?.provider).toBe('S3');
      expect(sourceAction?.configuration?.S3Bucket).toBe(artifactsBucketName);
      expect(sourceAction?.configuration?.S3ObjectKey).toBe('source.zip');
    });

    test('pipeline should be in valid state', async () => {
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBeGreaterThan(0);
      
      // Check that pipeline was created successfully
      expect(response.created).toBeDefined();
    });
  });

  describe('CodeBuild Projects Validation', () => {
    test('should have deployed build project', async () => {
      const command = new BatchGetProjectsCommand({
        names: [buildProjectName]
      });
      const response = await codebuildClient.send(command);
      
      expect(response.projects).toHaveLength(1);
      const project = response.projects?.[0];
      
      expect(project?.name).toBe(buildProjectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.image).toBe('aws/codebuild/standard:7.0');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project?.environment?.privilegedMode).toBe(true);
    });

    test('should have deployed test project', async () => {
      const command = new BatchGetProjectsCommand({
        names: [testProjectName]
      });
      const response = await codebuildClient.send(command);
      
      expect(response.projects).toHaveLength(1);
      const project = response.projects?.[0];
      
      expect(project?.name).toBe(testProjectName);
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.image).toBe('aws/codebuild/standard:7.0');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('should have staging and production deployment projects', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const deployProjects = [
        `trainr241-${envSuffix}-deploy-staging`,
        `trainr241-${envSuffix}-deploy-prod`
      ];
      
      const command = new BatchGetProjectsCommand({
        names: deployProjects
      });
      const response = await codebuildClient.send(command);
      
      expect(response.projects).toHaveLength(2);
      expect(response.projects?.map((p: any) => p.name)).toEqual(expect.arrayContaining(deployProjects));
    });

    test('all CodeBuild projects should have encryption enabled', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const allProjects = [
        buildProjectName,
        testProjectName,
        `trainr241-${envSuffix}-deploy-staging`,
        `trainr241-${envSuffix}-deploy-prod`
      ];
      
      const command = new BatchGetProjectsCommand({
        names: allProjects
      });
      const response = await codebuildClient.send(command);
      
      response.projects?.forEach((project: any) => {
        expect(project.encryptionKey).toBeDefined();
        expect(project.encryptionKey).toContain('arn:aws:kms');
      });
    });
  });

  describe('S3 Artifacts Bucket Validation', () => {
    test('should have created artifacts bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: artifactsBucketName
      });
      
      // HeadBucket throws if bucket doesn't exist
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: artifactsBucketName
      });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('should have KMS encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: artifactsBucketName
      });
      const response = await s3Client.send(command);
      
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    });
  });

  describe('SSM Parameters Validation', () => {
    test('should have environment parameter', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const command = new GetParameterCommand({
        Name: `/trainr241/${envSuffix}/environment`
      });
      
      const response = await ssmClient.send(command);
      expect(response.Parameter?.Value).toBe(envSuffix);
    });

    test('should have pipeline name parameter', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const command = new GetParameterCommand({
        Name: `/trainr241/${envSuffix}/pipeline-name`
      });
      
      const response = await ssmClient.send(command);
      expect(response.Parameter?.Value).toBe(pipelineName);
    });
  });

  describe('CloudWatch Log Groups Validation', () => {
    test('should have created build log group', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const logGroupName = `/aws/codebuild/trainr241-${envSuffix}-build`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find((lg: any) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });

    test('should have created test log group', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      const logGroupName = `/aws/codebuild/trainr241-${envSuffix}-test`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);
      
      const logGroup = response.logGroups?.find((lg: any) => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('KMS Key Validation', () => {
    test('should have created and configured KMS key', async () => {
      // Get KMS key ARN from bucket encryption
      const bucketEncryption = new GetBucketEncryptionCommand({
        Bucket: artifactsBucketName
      });
      const encryptionResponse = await s3Client.send(bucketEncryption);
      const kmsKeyId = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      
      expect(kmsKeyId).toBeDefined();
      
      // Verify KMS key exists and is enabled
      if (kmsKeyId) {
        const command = new DescribeKeyCommand({
          KeyId: kmsKeyId
        });
        const response = await kmsClient.send(command);
        
        expect(response.KeyMetadata?.KeyState).toBe('Enabled');
        expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(response.KeyMetadata?.Description).toContain('trainr241');
        expect(response.KeyMetadata?.Description).toContain('CI/CD pipeline');
      }
    });
  });

  describe('End-to-End Pipeline Workflow', () => {
    test('should have correct action flow from source to production', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      // Verify Source -> Build flow
      const sourceStage = response.pipeline?.stages?.[0];
      const buildStage = response.pipeline?.stages?.[1];
      expect(sourceStage?.actions?.[0]?.outputArtifacts?.[0]?.name).toBe('SourceOutput');
      expect(buildStage?.actions?.[0]?.inputArtifacts?.[0]?.name).toBe('SourceOutput');
      
      // Verify Build -> Test flow
      const testStage = response.pipeline?.stages?.[2];
      expect(buildStage?.actions?.[0]?.outputArtifacts?.[0]?.name).toBe('BuildOutput');
      expect(testStage?.actions?.[0]?.inputArtifacts?.[0]?.name).toBe('BuildOutput');
      
      // Verify Test -> Staging flow
      const stagingStage = response.pipeline?.stages?.[3];
      expect(stagingStage?.actions?.[0]?.inputArtifacts?.[0]?.name).toBe('BuildOutput');
      
      // Verify Approval Gate exists before Production
      const approvalStage = response.pipeline?.stages?.[4];
      expect(approvalStage?.name).toBe('ApprovalGate');
      expect(approvalStage?.actions?.[0]?.actionTypeId?.category).toBe('Approval');
      
      // Verify Production deployment uses build artifacts
      const prodStage = response.pipeline?.stages?.[5];
      expect(prodStage?.actions?.[0]?.inputArtifacts?.[0]?.name).toBe('BuildOutput');
    });

    test('should have proper IAM roles configured for pipeline execution', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      // Check pipeline has a role
      expect(response.pipeline?.roleArn).toBeDefined();
      expect(response.pipeline?.roleArn).toContain(':role/');
      expect(response.pipeline?.roleArn).toContain('trainr241');
      
      // Check each stage action has appropriate role
      response.pipeline?.stages?.forEach((stage: any) => {
        stage.actions?.forEach((action: any) => {
          if (action.actionTypeId?.provider !== 'Manual') {
            expect(action.roleArn).toBeDefined();
            expect(action.roleArn).toContain(':role/');
          }
        });
      });
    });

    test('should enforce environment isolation', async () => {
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codepipelineClient.send(command);
      
      // Check staging deployment configuration
      const stagingStage = response.pipeline?.stages?.find((s: any) => s.name === 'DeployStaging');
      const stagingAction = stagingStage?.actions?.[0];
      expect(stagingAction?.configuration?.ProjectName).toContain('deploy-staging');
      
      // Check production deployment configuration
      const prodStage = response.pipeline?.stages?.find((s: any) => s.name === 'DeployProduction');
      const prodAction = prodStage?.actions?.[0];
      expect(prodAction?.configuration?.ProjectName).toContain('deploy-prod');
      
      // Ensure manual approval separates environments
      const stageOrder = response.pipeline?.stages?.map((s: any) => s.name) || [];
      const stagingIndex = stageOrder.indexOf('DeployStaging');
      const approvalIndex = stageOrder.indexOf('ApprovalGate');
      const prodIndex = stageOrder.indexOf('DeployProduction');
      
      expect(stagingIndex).toBeLessThan(approvalIndex);
      expect(approvalIndex).toBeLessThan(prodIndex);
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('all resources should follow naming convention', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      
      // Check pipeline name
      expect(pipelineName).toMatch(new RegExp(`^trainr241-${envSuffix}-pipeline$`));
      
      // Check CodeBuild project names
      expect(buildProjectName).toMatch(new RegExp(`^trainr241-${envSuffix}-build$`));
      expect(testProjectName).toMatch(new RegExp(`^trainr241-${envSuffix}-test$`));
      
      // Check S3 bucket name
      expect(artifactsBucketName).toMatch(new RegExp(`^trainr241-${envSuffix}-artifacts-`));
    });
  });
});