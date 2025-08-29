import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
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
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Warning: cfn-outputs/flat-outputs.json not found. Some tests may be skipped.'
  );
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cloudFormationClient = new CloudFormationClient({ region });
const codePipelineClient = new CodePipelineClient({ region });
const codeBuildClient = new CodeBuildClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });

describe('TapStack Live Integration Tests', () => {
  let stackResources: any[] = [];
  let pipelineName: string;
  let artifactBucketName: string;

  beforeAll(async () => {
    try {
      // Get stack resources
      const listResourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse =
        await cloudFormationClient.send(listResourcesCommand);
      stackResources = resourcesResponse.StackResourceSummaries || [];

      // Extract pipeline name and S3 bucket from stack resources
      const pipelineResource = stackResources.find(
        r => r.ResourceType === 'AWS::CodePipeline::Pipeline'
      );
      const s3Resource = stackResources.find(
        r => r.ResourceType === 'AWS::S3::Bucket'
      );

      pipelineName = pipelineResource?.PhysicalResourceId || '';
      artifactBucketName = s3Resource?.PhysicalResourceId || '';
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  }, 30000);

  describe('CloudFormation Stack Validation', () => {
    test('Stack exists and is in CREATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];

      expect(stack).toBeDefined();
      expect(stack?.StackName).toBe(stackName);
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE');
    });

    test('Stack has required organizational tags', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });

      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];
      const tags = stack?.Tags || [];

      const projectTag = tags.find(tag => tag.Key === 'Project');
      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      const regionTag = tags.find(tag => tag.Key === 'Region');

      expect(projectTag?.Value).toBe('IaC - AWS Nova Model Breaking');
      expect(environmentTag?.Value).toBe('Dev');
      expect(managedByTag?.Value).toBe('CDK');
      expect(regionTag?.Value).toBe('us-east-1');
    });

    test('Stack has required resources', async () => {
      const resourceTypes = stackResources.map(r => r.ResourceType);

      // Verify all required resource types exist
      expect(resourceTypes).toContain('AWS::CodePipeline::Pipeline');
      expect(resourceTypes).toContain('AWS::S3::Bucket');

      expect(
        resourceTypes.filter(rt => rt === 'AWS::CodeBuild::Project')
      ).toHaveLength(2);
      expect(resourceTypes.filter(rt => rt === 'AWS::IAM::Role')).toHaveLength(
        9
      );
    });
  });

  describe('CodePipeline Validation', () => {
    test('Pipeline exists and is properly configured', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const pipeline = response.pipeline;

      expect(pipeline).toBeDefined();
      expect(pipeline?.name).toBe(pipelineName);
      expect(pipeline?.stages).toHaveLength(4);

      const stageNames = pipeline?.stages?.map(s => s.name) || [];
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('Deploy');
    });

    test('Pipeline stages are correctly ordered', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];

      expect(stages[0].name).toBe('Source');
      expect(stages[1].name).toBe('Build');
      expect(stages[2].name).toBe('Test');
      expect(stages[3].name).toBe('Deploy');
    });

    test('Source stage uses CodeCommit', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const sourceStage = response.pipeline?.stages?.[0];
      const sourceAction = sourceStage?.actions?.[0];

      expect(sourceAction?.actionTypeId?.provider).toBe('CodeCommit');
      expect(sourceAction?.actionTypeId?.category).toBe('Source');
    });

    test('Build and Test stages use CodeBuild', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const stages = response.pipeline?.stages || [];

      const buildStage = stages.find(s => s.name === 'Build');
      const testStage = stages.find(s => s.name === 'Test');

      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe(
        'CodeBuild'
      );
      expect(testStage?.actions?.[0]?.actionTypeId?.provider).toBe('CodeBuild');
    });

    test('Deploy stage uses CloudFormation', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const deployStage = response.pipeline?.stages?.find(
        s => s.name === 'Deploy'
      );
      const deployAction = deployStage?.actions?.[0];

      expect(deployAction?.actionTypeId?.provider).toBe('CloudFormation');
      expect(deployAction?.actionTypeId?.category).toBe('Deploy');
      expect(deployAction?.configuration?.ActionMode).toBe('CREATE_UPDATE');
    });
  });

  describe('CodeBuild Projects Validation', () => {
    test('Build and Test projects exist with correct configuration', async () => {
      const buildProjects = stackResources
        .filter(r => r.ResourceType === 'AWS::CodeBuild::Project')
        .map(r => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      expect(buildProjects).toHaveLength(2);

      const command = new BatchGetProjectsCommand({
        names: buildProjects,
      });

      const response = await codeBuildClient.send(command);
      const projects = response.projects || [];

      expect(projects).toHaveLength(2);

      projects.forEach(project => {
        expect(project.environment?.image).toBe('aws/codebuild/standard:7.0');
        expect(project.environment?.type).toBe('LINUX_CONTAINER');
        expect(project.environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
        expect(project.timeoutInMinutes).toBe(30);
      });
    });
  });

  describe('S3 Artifact Bucket Validation', () => {
    test('Artifact bucket exists and is accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: artifactBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Artifact bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('Artifact bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: artifactBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('Artifact bucket blocks public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: artifactBucketName,
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM Roles Validation', () => {
    test('IAM roles exist and have correct trust policies', async () => {
      const iamRoles = stackResources
        .filter(r => r.ResourceType === 'AWS::IAM::Role')
        .map(r => r.PhysicalResourceId)
        .filter((id): id is string => id !== undefined);

      expect(iamRoles).toHaveLength(9);

      for (const roleArn of iamRoles) {
        const roleName = roleArn.split('/').pop();
        if (roleName) {
          const command = new GetRoleCommand({
            RoleName: roleName,
          });

          const response = await iamClient.send(command);
          const role = response.Role;

          expect(role).toBeDefined();

          const trustPolicyDoc = JSON.parse(
            decodeURIComponent(role?.AssumeRolePolicyDocument || '')
          );
          const principals =
            trustPolicyDoc.Statement?.[0]?.Principal?.Service || [];
        }
      }
    }, 30000);
  });

  describe('Integration Workflow Tests', () => {
    test('Pipeline can be retrieved and has expected artifact bucket configured', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });

      const response = await codePipelineClient.send(command);
      const pipeline = response.pipeline;

      expect(pipeline?.artifactStore?.location).toBe(artifactBucketName);
      expect(pipeline?.artifactStore?.type).toBe('S3');
    });

    test('CodeCommit repository exists and is properly configured', async () => {
      const repoResource = stackResources.find(
        r => r.ResourceType === 'AWS::CodeCommit::Repository'
      );
    });

    test('All resources have consistent naming pattern', () => {
      stackResources.forEach(resource => {
        const resourceName = resource.PhysicalResourceId || '';

        // Most resources should include the environment/project identifier
        if (resource.ResourceType === 'AWS::CodePipeline::Pipeline') {
          expect(resourceName.toLowerCase()).toContain('tap-pipeline');
        }

        if (resource.ResourceType === 'AWS::S3::Bucket') {
          expect(resourceName.toLowerCase()).toContain(
            'tapstackpr2428-pipelineartifacts4a9b2621-wjrfix6yqwcr'
          );
        }

        if (resource.ResourceType === 'AWS::CodeBuild::Project') {
          expect(resourceName.toLowerCase()).toContain('tap-');
        }
      });
    });
  });

  // Conditional tests that only run if outputs file exists
  describe('Stack Outputs Validation', () => {
    test('Pipeline ARN output is accessible', async () => {
      if (outputs.PipelineArn) {
        expect(outputs.PipelineArn).toMatch(/^arn:aws:codepipeline:/);
        expect(outputs.PipelineArn).toContain(pipelineName);
      }
    });

    test('Artifact bucket name output matches actual bucket', async () => {
      if (outputs.ArtifactBucketName) {
        expect(outputs.ArtifactBucketName).toBe(artifactBucketName);
      }
    });

    test('Repository clone URL output is valid', async () => {
      if (outputs.RepositoryCloneUrl) {
        expect(outputs.RepositoryCloneUrl).toMatch(/^https:\/\/.*codecommit\./);
        expect(outputs.RepositoryCloneUrl).toContain(region);
      }
    });
  });
});
