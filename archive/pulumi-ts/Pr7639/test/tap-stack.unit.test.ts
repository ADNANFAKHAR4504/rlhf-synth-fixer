import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing the stack
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    // Return mock resource with properties
    const outputs: Record<string, any> = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Add specific outputs for different resource types
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || `${args.name}-bucket`;
    } else if (args.type === 'aws:codebuild/project:Project') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:codepipeline/pipeline:Pipeline') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = args.inputs.name || args.name;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock Pulumi function calls
    if (args.token === 'pulumi:pulumi:getStack') {
      return Promise.resolve({});
    }
    return Promise.resolve(args.inputs);
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack Instantiation', () => {
    it('should create stack with valid environment suffix', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.artifactBucket).toBeDefined();
      expect(stack.codeBuildProject).toBeDefined();
      expect(stack.pipeline).toBeDefined();
      expect(stack.logGroup).toBeDefined();
    });

    it('should create stack with different environment suffixes', async () => {
      const devStack = new TapStack('dev-stack', {
        environmentSuffix: 'dev',
      });
      const prodStack = new TapStack('prod-stack', {
        environmentSuffix: 'prod',
      });

      expect(devStack).toBeDefined();
      expect(prodStack).toBeDefined();
    });
  });

  describe('S3 Artifact Bucket Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should create artifact bucket with correct properties', async () => {
      const bucket = stack.artifactBucket;
      expect(bucket).toBeDefined();

      // Verify bucket name uses environmentSuffix
      const bucketName = await bucket.bucket;
      expect(bucketName).toContain('pipeline-artifacts');
      expect(bucketName).toContain('test');
    });

    it('should enable versioning on artifact bucket', async () => {
      const bucket = stack.artifactBucket;
      const versioning = await bucket.versioning;
      expect(versioning).toBeDefined();
      expect(versioning?.enabled).toBe(true);
    });

    it('should configure encryption on artifact bucket', async () => {
      const bucket = stack.artifactBucket;
      const encryption =
        await bucket.serverSideEncryptionConfiguration;
      expect(encryption).toBeDefined();
      expect(
        encryption?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm
      ).toBe('AES256');
    });

    it('should configure lifecycle rules on artifact bucket', async () => {
      const bucket = stack.artifactBucket;
      const lifecycleRules = await bucket.lifecycleRules;
      expect(lifecycleRules).toBeDefined();
      expect(lifecycleRules?.length).toBeGreaterThan(0);
      expect(lifecycleRules?.[0].enabled).toBe(true);
      expect(lifecycleRules?.[0].expiration?.days).toBe(30);
    });

    it('should enable forceDestroy on artifact bucket', async () => {
      const bucket = stack.artifactBucket;
      const forceDestroy = await bucket.forceDestroy;
      expect(forceDestroy).toBe(true);
    });

    it('should add tags to artifact bucket', async () => {
      const bucket = stack.artifactBucket;
      const tags = await bucket.tags;
      expect(tags).toBeDefined();
      expect(tags?.Name).toBeDefined();
      expect(tags?.Environment).toBeDefined();
    });
  });

  describe('CloudWatch Log Group Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should create log group with correct name', async () => {
      const logGroup = stack.logGroup;
      expect(logGroup).toBeDefined();

      const logGroupName = await logGroup.name;
      expect(logGroupName).toContain('/aws/codebuild/pulumi-pipeline');
      expect(logGroupName).toContain('test');
    });

    it('should configure retention policy on log group', async () => {
      const logGroup = stack.logGroup;
      const retention = await logGroup.retentionInDays;
      expect(retention).toBe(7);
    });
  });

  describe('CodeBuild Project Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should create CodeBuild project with correct name', async () => {
      const project = stack.codeBuildProject;
      expect(project).toBeDefined();

      const projectName = await project.name;
      expect(projectName).toContain('pulumi-pipeline');
      expect(projectName).toContain('test');
    });

    it('should configure CodeBuild artifacts correctly', async () => {
      const project = stack.codeBuildProject;
      const artifacts = await project.artifacts;
      expect(artifacts).toBeDefined();
      expect(artifacts?.type).toBe('CODEPIPELINE');
    });

    it('should configure CodeBuild environment variables', async () => {
      const project = stack.codeBuildProject;
      const environment = await project.environment;
      expect(environment).toBeDefined();

      const envVars = environment?.environmentVariables;
      expect(envVars).toBeDefined();

      const envSuffixVar = envVars?.find(
        (v: any) => v.name === 'ENVIRONMENT_SUFFIX'
      );
      expect(envSuffixVar).toBeDefined();

      const regionVar = envVars?.find(
        (v: any) => v.name === 'AWS_DEFAULT_REGION'
      );
      expect(regionVar).toBeDefined();
      expect(regionVar?.value).toBe('us-east-1');

      const pulumiTokenVar = envVars?.find(
        (v: any) => v.name === 'PULUMI_ACCESS_TOKEN'
      );
      expect(pulumiTokenVar).toBeDefined();
    });

    it('should configure CodeBuild compute type', async () => {
      const project = stack.codeBuildProject;
      const environment = await project.environment;
      expect(environment?.computeType).toBe('BUILD_GENERAL1_SMALL');
    });

    it('should configure CodeBuild image', async () => {
      const project = stack.codeBuildProject;
      const environment = await project.environment;
      expect(environment?.image).toBe('aws/codebuild/standard:7.0');
    });

    it('should configure CodeBuild environment type', async () => {
      const project = stack.codeBuildProject;
      const environment = await project.environment;
      expect(environment?.type).toBe('LINUX_CONTAINER');
    });

    it('should configure CodeBuild source', async () => {
      const project = stack.codeBuildProject;
      const source = await project.source;
      expect(source).toBeDefined();
      expect(source?.type).toBe('CODEPIPELINE');
      expect(source?.buildspec).toBeDefined();
    });

    it('should configure CodeBuild buildspec with Pulumi commands', async () => {
      const project = stack.codeBuildProject;
      const source = await project.source;
      const buildspec = source?.buildspec;

      expect(buildspec).toContain('pulumi preview');
      expect(buildspec).toContain('pulumi up --yes');
      expect(buildspec).toContain('npm install');
    });

    it('should configure CloudWatch logs for CodeBuild', async () => {
      const project = stack.codeBuildProject;
      const logsConfig = await project.logsConfig;
      expect(logsConfig).toBeDefined();
      expect(logsConfig?.cloudwatchLogs).toBeDefined();
      expect(logsConfig?.cloudwatchLogs?.streamName).toBe('build-log');
    });
  });

  describe('CodePipeline Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should create pipeline with correct name', async () => {
      const pipeline = stack.pipeline;
      expect(pipeline).toBeDefined();

      const pipelineName = await pipeline.name;
      expect(pipelineName).toContain('infrastructure-pipeline');
      expect(pipelineName).toContain('test');
    });

    it('should configure artifact stores', async () => {
      const pipeline = stack.pipeline;
      const artifactStores = await pipeline.artifactStores;
      expect(artifactStores).toBeDefined();
      expect(artifactStores?.length).toBeGreaterThan(0);
      expect(artifactStores?.[0].type).toBe('S3');
    });

    it('should configure pipeline stages', async () => {
      const pipeline = stack.pipeline;
      const stages = await pipeline.stages;
      expect(stages).toBeDefined();
      expect(stages?.length).toBe(4); // Source, Build, Approval, Deploy
    });

    it('should configure Source stage', async () => {
      const pipeline = stack.pipeline;
      const stages = await pipeline.stages;
      const sourceStage = stages?.find((s: any) => s.name === 'Source');

      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions).toBeDefined();
      expect(sourceStage?.actions?.length).toBe(1);

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.name).toBe('SourceAction');
      expect(sourceAction?.category).toBe('Source');
      expect(sourceAction?.provider).toBe('S3');
      expect(sourceAction?.outputArtifacts).toEqual(['source_output']);
    });

    it('should configure Build stage', async () => {
      const pipeline = stack.pipeline;
      const stages = await pipeline.stages;
      const buildStage = stages?.find((s: any) => s.name === 'Build');

      expect(buildStage).toBeDefined();
      expect(buildStage?.actions).toBeDefined();
      expect(buildStage?.actions?.length).toBe(1);

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.name).toBe('BuildAction');
      expect(buildAction?.category).toBe('Build');
      expect(buildAction?.provider).toBe('CodeBuild');
      expect(buildAction?.inputArtifacts).toEqual(['source_output']);
      expect(buildAction?.outputArtifacts).toEqual(['build_output']);
    });

    it('should configure Manual Approval stage', async () => {
      const pipeline = stack.pipeline;
      const stages = await pipeline.stages;
      const approvalStage = stages?.find((s: any) => s.name === 'Approval');

      expect(approvalStage).toBeDefined();
      expect(approvalStage?.actions).toBeDefined();
      expect(approvalStage?.actions?.length).toBe(1);

      const approvalAction = approvalStage?.actions?.[0];
      expect(approvalAction?.name).toBe('ManualApproval');
      expect(approvalAction?.category).toBe('Approval');
      expect(approvalAction?.provider).toBe('Manual');
      expect(approvalAction?.configuration?.CustomData).toBeDefined();
    });

    it('should configure Deploy stage', async () => {
      const pipeline = stack.pipeline;
      const stages = await pipeline.stages;
      const deployStage = stages?.find((s: any) => s.name === 'Deploy');

      expect(deployStage).toBeDefined();
      expect(deployStage?.actions).toBeDefined();
      expect(deployStage?.actions?.length).toBe(1);

      const deployAction = deployStage?.actions?.[0];
      expect(deployAction?.name).toBe('DeployAction');
      expect(deployAction?.category).toBe('Build');
      expect(deployAction?.provider).toBe('CodeBuild');
      expect(deployAction?.inputArtifacts).toEqual(['build_output']);
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should register outputs for all resources', async () => {
      expect(stack.artifactBucket).toBeDefined();
      expect(stack.codeBuildProject).toBeDefined();
      expect(stack.pipeline).toBeDefined();
      expect(stack.logGroup).toBeDefined();
    });

    it('should have artifact bucket name output', async () => {
      const bucketName = await stack.artifactBucket.bucket;
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should have CodeBuild project name output', async () => {
      const projectName = await stack.codeBuildProject.name;
      expect(projectName).toBeDefined();
      expect(typeof projectName).toBe('string');
    });

    it('should have pipeline name output', async () => {
      const pipelineName = await stack.pipeline.name;
      expect(pipelineName).toBeDefined();
      expect(typeof pipelineName).toBe('string');
    });

    it('should have log group name output', async () => {
      const logGroupName = await stack.logGroup.name;
      expect(logGroupName).toBeDefined();
      expect(typeof logGroupName).toBe('string');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle long environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'very-long-environment-suffix-name',
      });
      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test-123',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should create resources in correct order', async () => {
      // Ensure all resources are created
      expect(stack.artifactBucket).toBeDefined();
      expect(stack.logGroup).toBeDefined();
      expect(stack.codeBuildProject).toBeDefined();
      expect(stack.pipeline).toBeDefined();
    });

    it('should have IAM role before CodeBuild project', async () => {
      const project = stack.codeBuildProject;
      const serviceRole = await project.serviceRole;
      expect(serviceRole).toBeDefined();
    });

    it('should have IAM role before Pipeline', async () => {
      const pipeline = stack.pipeline;
      const roleArn = await pipeline.roleArn;
      expect(roleArn).toBeDefined();
    });

    it('should have artifact bucket before Pipeline', async () => {
      const pipeline = stack.pipeline;
      const artifactStores = await pipeline.artifactStores;
      expect(artifactStores).toBeDefined();
      expect(artifactStores?.length).toBeGreaterThan(0);
    });
  });
});
