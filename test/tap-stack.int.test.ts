/**
 * Integration tests for CI/CD Pipeline Stack
 *
 * These tests validate the actual deployed infrastructure resources
 * and their configurations in AWS.
 */
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const REGION = 'ap-southeast-1';
const OUTPUTS_FILE = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);

// AWS Clients
AWS.config.update({ region: REGION });
const s3Client = new AWS.S3();
const ecrClient = new AWS.ECR();
const codeBuildClient = new AWS.CodeBuild();
const codePipelineClient = new AWS.CodePipeline();
const lambdaClient = new AWS.Lambda();
const cloudwatchClient = new AWS.CloudWatch();
const cloudwatchLogsClient = new AWS.CloudWatchLogs();
const iamClient = new AWS.IAM();
const eventsClient = new AWS.CloudWatchEvents();

// Load outputs from deployment
let outputs: any = {};

beforeAll(() => {
  if (fs.existsSync(OUTPUTS_FILE)) {
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, 'utf-8');
    outputs = JSON.parse(outputsContent);
  } else {
    console.warn('Outputs file not found. Some tests may fail.');
  }
});

describe('CI/CD Pipeline Integration Tests', () => {
  describe('S3 Artifact Bucket', () => {
    it('should exist with correct configuration', async () => {
      const bucketName = outputs.artifactBucketName;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const bucketResponse = await s3Client
        .headBucket({ Bucket: bucketName })
        .promise();
      expect(bucketResponse.$response.httpResponse.statusCode).toBe(200);

      // Check versioning
      const versioningResponse = await s3Client
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionResponse = await s3Client
        .getBucketEncryption({ Bucket: bucketName })
        .promise();
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');

      // Check lifecycle rules
      const lifecycleResponse = await s3Client
        .getBucketLifecycleConfiguration({ Bucket: bucketName })
        .promise();
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules?.length).toBeGreaterThan(0);
      expect(lifecycleResponse.Rules?.[0]?.Expiration?.Days).toBe(30);

      // Check tags (do not assert specific environment values)
      const tagsResponse = await s3Client
        .getBucketTagging({ Bucket: bucketName })
        .promise();
      const tags = tagsResponse.TagSet || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const teamTag = tags.find((t) => t.Key === 'Team');
      expect(envTag).toBeDefined();
      expect(teamTag?.Value).toBe('devops');
    });
  });

  describe('ECR Repository', () => {
    it('should exist with correct configuration', async () => {
      const repoUrl = outputs.ecrRepositoryUrl;
      expect(repoUrl).toBeDefined();

      // Extract repository name from URL
      const repoName = repoUrl.split('/').pop();

      // Check repository exists
      const repoResponse = await ecrClient
        .describeRepositories({ repositoryNames: [repoName] })
        .promise();
      expect(repoResponse.repositories?.length).toBe(1);

      const repo = repoResponse.repositories?.[0];

      // Check image scanning
      expect(repo?.imageScanningConfiguration?.scanOnPush).toBe(true);

      // Check lifecycle policy
      const lifecycleResponse = await ecrClient
        .getLifecyclePolicy({ repositoryName: repoName })
        .promise();
      expect(lifecycleResponse.lifecyclePolicyText).toBeDefined();

      const lifecyclePolicy = JSON.parse(
        lifecycleResponse.lifecyclePolicyText || '{}'
      );
      expect(lifecyclePolicy.rules).toBeDefined();
      expect(lifecyclePolicy.rules[0].selection.countNumber).toBe(10);

      // Check tags (do not assert specific environment values)
      const tagsResponse = await ecrClient
        .listTagsForResource({ resourceArn: repo?.repositoryArn })
        .promise();
      const tags = tagsResponse.tags || [];
      const envTag = tags.find((t) => t.Key === 'Environment');
      const teamTag = tags.find((t) => t.Key === 'Team');
      expect(envTag).toBeDefined();
      expect(teamTag?.Value).toBe('devops');
    });
  });

  describe('CodeBuild Project', () => {
    it('should exist with correct configuration', async () => {
      const projectName = outputs.codeBuildProjectName;
      expect(projectName).toBeDefined();

      const response = await codeBuildClient
        .batchGetProjects({ names: [projectName] })
        .promise();
      expect(response.projects?.length).toBe(1);

      const project = response.projects?.[0];

      // Check environment
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.privilegedMode).toBe(true);

      // Check region environment variable
      const regionEnvVar = project?.environment?.environmentVariables?.find(
        (v) => v.name === 'AWS_DEFAULT_REGION'
      );
      expect(regionEnvVar?.value).toBe(REGION);

      // Check artifacts
      expect(project?.artifacts?.type).toBe('CODEPIPELINE');

      // Check logs configuration
      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toContain(
        '/aws/codebuild/'
      );

      // Check tags (do not assert specific environment values)
      const tags = project?.tags || [];
      const envTag = tags.find((t) => t.key === 'Environment');
      const teamTag = tags.find((t) => t.key === 'Team');
      expect(envTag).toBeDefined();
      expect(teamTag?.value).toBe('devops');
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should exist with correct retention', async () => {
      const projectName = outputs.codeBuildProjectName;
      const logGroupName = `/aws/codebuild/${projectName}`;

      const response = await cloudwatchLogsClient
        .describeLogGroups({ logGroupNamePrefix: logGroupName })
        .promise();

      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(7);
    });
  });

  describe('Lambda Function', () => {
    it('should exist with correct configuration', async () => {
      const functionName = outputs.lambdaFunctionName;
      expect(functionName).toBeDefined();

      const response = await lambdaClient
        .getFunction({ FunctionName: functionName })
        .promise();

      const config = response.Configuration;
      expect(config?.Runtime).toBe('python3.9');
      expect(config?.Handler).toBe('index.handler');
      expect(config?.Timeout).toBe(60);

      // Check environment variables
      expect(config?.Environment?.Variables?.ECR_REPOSITORY_NAME).toBeDefined();

      // Check tags (do not assert specific environment values)
      const tagsResponse = await lambdaClient
        .listTags({ Resource: config?.FunctionArn || '' })
        .promise();
      const tags = tagsResponse.Tags || {};
      expect(tags['Environment']).toBeDefined();
      expect(tags['Team']).toBe('devops');
    });

    it('should have proper IAM permissions', async () => {
      const functionName = outputs.lambdaFunctionName;
      const response = await lambdaClient
        .getFunction({ FunctionName: functionName })
        .promise();

      const roleArn = response.Configuration?.Role;
      expect(roleArn).toBeDefined();

      // Role should exist
      const roleName = roleArn?.split('/').pop();
      const roleResponse = await iamClient
        .getRole({ RoleName: roleName || '' })
        .promise();
      expect(roleResponse.Role).toBeDefined();
    });
  });

  describe('CodePipeline', () => {
    it('should exist with correct stages', async () => {
      const pipelineName = outputs.pipelineName;
      expect(pipelineName).toBeDefined();

      const response = await codePipelineClient
        .getPipeline({ name: pipelineName })
        .promise();

      const pipeline = response.pipeline;
      expect(pipeline?.stages?.length).toBe(3);

      // Stage 1: Source
      const sourceStage = pipeline?.stages?.[0];
      expect(sourceStage?.name).toBe('Source');
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe('GitHub');

      // Stage 2: Build
      const buildStage = pipeline?.stages?.[1];
      expect(buildStage?.name).toBe('Build');
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'CodeBuild'
      );

      // Stage 3: Deploy
      const deployStage = pipeline?.stages?.[2];
      expect(deployStage?.name).toBe('Deploy');
      expect(deployStage?.actions?.[0]?.actionTypeId?.provider).toBe('Lambda');

      // Check artifact store
      expect(pipeline?.artifactStore?.type).toBe('S3');
      expect(pipeline?.artifactStore?.location).toBe(
        outputs.artifactBucketName
      );

      // Check tags (do not assert specific environment values)
      const tagsResponse = await codePipelineClient
        .listTagsForResource({ resourceArn: response.metadata?.pipelineArn })
        .promise();
      const tags = tagsResponse.tags || [];
      const envTag = tags.find((t) => t.key === 'Environment');
      const teamTag = tags.find((t) => t.key === 'Team');
      expect(envTag).toBeDefined();
      expect(teamTag?.value).toBe('devops');
    });
  });

  describe('CloudWatch Event Rule', () => {
    it('should exist for pipeline triggering', async () => {
      const pipelineName = outputs.pipelineName;

      // List rules and find the one for our pipeline
      const rulesResponse = await eventsClient.listRules().promise();
      const pipelineRule = rulesResponse.Rules?.find((r) =>
        r.Name?.includes('pipeline-trigger')
      );

      expect(pipelineRule).toBeDefined();
      expect(pipelineRule?.State).toBe('ENABLED');

      // Check event pattern
      if (pipelineRule?.EventPattern) {
        const eventPattern = JSON.parse(pipelineRule.EventPattern);
        expect(eventPattern.source).toContain('aws.codepipeline');
        expect(eventPattern['detail-type']).toContain(
          'CodePipeline Pipeline Execution State Change'
        );
      }

      // Check targets
      const targetsResponse = await eventsClient
        .listTargetsByRule({ Rule: pipelineRule?.Name || '' })
        .promise();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should have CodeBuild role with proper permissions', async () => {
      const projectName = outputs.codeBuildProjectName;
      const response = await codeBuildClient
        .batchGetProjects({ names: [projectName] })
        .promise();

      const roleArn = response.projects?.[0]?.serviceRole;
      expect(roleArn).toBeDefined();

      const roleName = roleArn?.split('/').pop();
      const roleResponse = await iamClient
        .getRole({ RoleName: roleName || '' })
        .promise();
      expect(roleResponse.Role).toBeDefined();

      // Check attached policies
      const policiesResponse = await iamClient
        .listRolePolicies({ RoleName: roleName || '' })
        .promise();
      expect(policiesResponse.PolicyNames?.length).toBeGreaterThan(0);
    });

    it('should have Lambda role with proper permissions', async () => {
      const functionName = outputs.lambdaFunctionName;
      const response = await lambdaClient
        .getFunction({ FunctionName: functionName })
        .promise();

      const roleArn = response.Configuration?.Role;
      const roleName = roleArn?.split('/').pop();
      const roleResponse = await iamClient
        .getRole({ RoleName: roleName || '' })
        .promise();
      expect(roleResponse.Role).toBeDefined();

      // Check attached policies
      const policiesResponse = await iamClient
        .listRolePolicies({ RoleName: roleName || '' })
        .promise();
      expect(policiesResponse.PolicyNames?.length).toBeGreaterThan(0);
    });

    it('should have Pipeline role with proper permissions', async () => {
      const pipelineName = outputs.pipelineName;
      const response = await codePipelineClient
        .getPipeline({ name: pipelineName })
        .promise();

      const roleArn = response.pipeline?.roleArn;
      const roleName = roleArn?.split('/').pop();
      const roleResponse = await iamClient
        .getRole({ RoleName: roleName || '' })
        .promise();
      expect(roleResponse.Role).toBeDefined();

      // Check attached policies
      const policiesResponse = await iamClient
        .listRolePolicies({ RoleName: roleName || '' })
        .promise();
      expect(policiesResponse.PolicyNames?.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environmentSuffix in resource names', () => {
      // All output names should contain a suffix pattern (do not assert specific environment names)
      expect(outputs.artifactBucketName).toMatch(/-\w+$/);
      expect(outputs.ecrRepositoryUrl).toMatch(/-\w+/);
      expect(outputs.pipelineName).toMatch(/-\w+$/);
      expect(outputs.codeBuildProjectName).toMatch(/-\w+$/);
      expect(outputs.lambdaFunctionName).toMatch(/-\w+$/);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all components connected properly', async () => {
      // This test validates the connections between components

      // 1. Pipeline should reference CodeBuild project
      const pipelineName = outputs.pipelineName;
      const pipelineResponse = await codePipelineClient
        .getPipeline({ name: pipelineName })
        .promise();

      const buildAction = pipelineResponse.pipeline?.stages
        ?.find((s) => s.name === 'Build')
        ?.actions?.[0];
      expect(buildAction?.configuration?.ProjectName).toBe(
        outputs.codeBuildProjectName
      );

      // 2. Pipeline should reference Lambda function
      const deployAction = pipelineResponse.pipeline?.stages
        ?.find((s) => s.name === 'Deploy')
        ?.actions?.[0];
      expect(deployAction?.configuration?.FunctionName).toBe(
        outputs.lambdaFunctionName
      );

      // 3. Pipeline should use S3 artifact bucket
      expect(pipelineResponse.pipeline?.artifactStore?.location).toBe(
        outputs.artifactBucketName
      );

      // 4. Lambda should reference ECR repository
      const lambdaResponse = await lambdaClient
        .getFunction({ FunctionName: outputs.lambdaFunctionName })
        .promise();
      const ecrRepoName =
        lambdaResponse.Configuration?.Environment?.Variables
          ?.ECR_REPOSITORY_NAME;
      expect(ecrRepoName).toBeDefined();

      // 5. CodeBuild should reference ECR repository in environment
      const codeBuildResponse = await codeBuildClient
        .batchGetProjects({ names: [outputs.codeBuildProjectName] })
        .promise();
      const repoEnvVar = codeBuildResponse.projects?.[0]?.environment?.environmentVariables?.find(
        (v) => v.name === 'IMAGE_REPO_NAME'
      );
      expect(repoEnvVar?.value).toBeDefined();
    });
  });
});
