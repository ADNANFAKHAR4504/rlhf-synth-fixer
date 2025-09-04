import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from "@aws-sdk/client-codebuild";
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from "@aws-sdk/client-codepipeline";
import {
  EventBridgeClient,
  ListRulesCommand,
} from "@aws-sdk/client-eventbridge";
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand
} from "@aws-sdk/client-iam";
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";

const outputs = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";
const region = process.env.AWS_REGION || "us-east-1";

// Extract outputs with proper key mapping
const sourceBucketName = outputs.SourceBucketName || outputs[`SourceBucketName`];
const artifactsBucketName = outputs.ArtifactsBucketName || outputs[`ArtifactsBucketName`];
const pipelineName = outputs.PipelineName || outputs[`PipelineName`];
const buildProjectName = outputs.BuildProjectName || outputs[`BuildProjectName`];
const stackName = `TapStack${environmentSuffix}`;

describe("TapStack Integration Tests", () => {
  const s3 = new S3Client({ region });
  const codepipeline = new CodePipelineClient({ region });
  const codebuild = new CodeBuildClient({ region });
  const cloudformation = new CloudFormationClient({ region });
  const iam = new IAMClient({ region });
  const logs = new CloudWatchLogsClient({ region });
  const eventbridge = new EventBridgeClient({ region });

  // ----------------------------
  // S3 Bucket Tests
  // ----------------------------
  describe("S3 Buckets", () => {
    it("should have created the source bucket with proper configuration", async () => {
      const headResult = await s3.send(new HeadBucketCommand({ Bucket: sourceBucketName }));
      expect(headResult.$metadata.httpStatusCode).toBe(200);

      // Test versioning
      const versioningResult = await s3.send(
        new GetBucketVersioningCommand({ Bucket: sourceBucketName })
      );
      expect(versioningResult.Status).toBe("Enabled");

      // Test encryption
      const encryptionResult = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: sourceBucketName })
      );
      expect(encryptionResult.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(
        encryptionResult.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe("AES256");
    });

    it("should have created the artifacts bucket with lifecycle policy", async () => {
      const headResult = await s3.send(new HeadBucketCommand({ Bucket: artifactsBucketName }));
      expect(headResult.$metadata.httpStatusCode).toBe(200);

      // Test versioning
      const versioningResult = await s3.send(
        new GetBucketVersioningCommand({ Bucket: artifactsBucketName })
      );
      expect(versioningResult.Status).toBe("Enabled");

      // Test lifecycle policy
      const lifecycleResult = await s3.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: artifactsBucketName })
      );
      expect(lifecycleResult.Rules).toHaveLength(1);
      expect(lifecycleResult.Rules?.[0]?.ID).toBe("DeleteOldVersions");
      expect(lifecycleResult.Rules?.[0]?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(30);
      expect(lifecycleResult.Rules?.[0]?.Status).toBe("Enabled");
    });
  });

  // ----------------------------
  // CodePipeline Tests
  // ----------------------------
  describe("CodePipeline", () => {
    it("should exist and have correct stages with proper configuration", async () => {
      const result = await codepipeline.send(
        new GetPipelineCommand({ name: pipelineName })
      );

      expect(result.pipeline?.name).toBe(pipelineName);
      expect(result.pipeline?.stages?.map((s) => s.name)).toEqual([
        "Source",
        "Build",
        "Deploy-US-East-1",
        "Deploy-US-West-2",
      ]);

      // Validate Source stage
      const sourceStage = result.pipeline?.stages?.find(s => s.name === "Source");
      expect(sourceStage?.actions?.[0]?.actionTypeId?.provider).toBe("S3");
      expect(sourceStage?.actions?.[0]?.configuration?.S3ObjectKey).toBe("source.zip");

      // Validate Build stage
      const buildStage = result.pipeline?.stages?.find(s => s.name === "Build");
      expect(buildStage?.actions?.[0]?.actionTypeId?.provider).toBe("CodeBuild");

      // Validate Deploy stages
      const deployEast = result.pipeline?.stages?.find(s => s.name === "Deploy-US-East-1");
      expect(deployEast?.actions?.[0]?.actionTypeId?.provider).toBe("CloudFormation");
      expect(deployEast?.actions?.[0]?.region).toBe("us-east-1");

      const deployWest = result.pipeline?.stages?.find(s => s.name === "Deploy-US-West-2");
      expect(deployWest?.actions?.[0]?.actionTypeId?.provider).toBe("CloudFormation");
      expect(deployWest?.actions?.[0]?.region).toBe("us-west-2");
    });

    it("should have a pipeline state that can be queried", async () => {
      const stateResult = await codepipeline.send(
        new GetPipelineStateCommand({ name: pipelineName })
      );

      expect(stateResult.pipelineName).toBe(pipelineName);
      expect(stateResult.stageStates).toBeDefined();
      expect(stateResult.stageStates?.length).toBe(4);
    });
  });

  // ----------------------------
  // CodeBuild Project Tests
  // ----------------------------
  describe("CodeBuild", () => {
    it("should have a build project with correct configuration", async () => {
      const result = await codebuild.send(
        new BatchGetProjectsCommand({ names: [buildProjectName] })
      );

      const project = result.projects?.[0];
      expect(project?.name).toBe(buildProjectName);
      expect(project?.environment?.computeType).toBe("BUILD_GENERAL1_SMALL");
      expect(project?.environment?.image).toBe("aws/codebuild/standard:7.0");
      expect(project?.environment?.privilegedMode).toBe(false);
      expect(project?.timeoutInMinutes).toBe(60);

      // Check environment variables
      const envVars = project?.environment?.environmentVariables;
      expect(envVars?.find(v => v.name === "BUILD_ENV")?.value).toBe("production");
      expect(envVars?.find(v => v.name === "AWS_DEFAULT_REGION")?.value).toBe(region);
      expect(envVars?.find(v => v.name === "PROJECT_NAME")?.value).toContain("nova-model-breaking");

      // Check cache configuration
      expect(project?.cache?.type).toBe("LOCAL");
      expect(project?.cache?.modes).toContain("LOCAL_SOURCE_CACHE");

      // Check source configuration
      expect(project?.source?.type).toBe("S3");
      expect(project?.source?.location).toContain(sourceBucketName);
    });
  });

  // ----------------------------
  // IAM Role Tests
  // ----------------------------
  describe("IAM Roles", () => {
    let stackResources: any[];

    beforeAll(async () => {
      const resourcesResult = await cloudformation.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );
      stackResources = resourcesResult.StackResources || [];
    });

    it("should have CodePipeline IAM role with correct trust policy", async () => {
      const pipelineRole = stackResources.find(
        r => r.ResourceType === "AWS::IAM::Role" && r.LogicalResourceId?.includes("CodePipelineRole")
      );
      expect(pipelineRole).toBeDefined();

      if (pipelineRole?.PhysicalResourceId) {
        const roleResult = await iam.send(
          new GetRoleCommand({ RoleName: pipelineRole.PhysicalResourceId })
        );

        expect(roleResult.Role?.Description).toBe("Role for CodePipeline to execute pipeline operations");

        const trustPolicy = JSON.parse(decodeURIComponent(roleResult.Role?.AssumeRolePolicyDocument || '{}'));
        expect(trustPolicy.Statement[0].Principal.Service).toBe("codepipeline.amazonaws.com");
      }
    });

    it("should have CodeBuild IAM role with correct permissions", async () => {
      const buildRole = stackResources.find(
        r => r.ResourceType === "AWS::IAM::Role" && r.LogicalResourceId?.includes("CodeBuildRole")
      );
      expect(buildRole).toBeDefined();

      if (buildRole?.PhysicalResourceId) {
        const roleResult = await iam.send(
          new GetRoleCommand({ RoleName: buildRole.PhysicalResourceId })
        );

        expect(roleResult.Role?.Description).toBe("Role for CodeBuild to execute build operations");

        const trustPolicy = JSON.parse(decodeURIComponent(roleResult.Role?.AssumeRolePolicyDocument || '{}'));
        expect(trustPolicy.Statement[0].Principal.Service).toBe("codebuild.amazonaws.com");
      }
    });

    it("should have CloudFormation deployment role with PowerUserAccess", async () => {
      const deployRole = stackResources.find(
        r => r.ResourceType === "AWS::IAM::Role" && r.LogicalResourceId?.includes("CloudFormationDeploymentRole")
      );
      expect(deployRole).toBeDefined();

      if (deployRole?.PhysicalResourceId) {
        const roleResult = await iam.send(
          new GetRoleCommand({ RoleName: deployRole.PhysicalResourceId })
        );

        expect(roleResult.Role?.Description).toBe("Role for CloudFormation to deploy resources");

        const attachedPoliciesResult = await iam.send(
          new ListAttachedRolePoliciesCommand({ RoleName: deployRole.PhysicalResourceId })
        );

        const powerUserPolicy = attachedPoliciesResult.AttachedPolicies?.find(
          p => p.PolicyName === "PowerUserAccess"
        );
        expect(powerUserPolicy).toBeDefined();
      }
    });
  });

  // ----------------------------
  // CloudWatch Logs Tests
  // ----------------------------
  describe("CloudWatch Logs", () => {
    it("should have build log group with correct retention", async () => {
      const buildLogGroupName = `/aws/codebuild/nova-model-build-${environmentSuffix}`;

      const result = await logs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: buildLogGroupName
        })
      );

      const logGroup = result.logGroups?.find(lg => lg.logGroupName === buildLogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    it("should have pipeline log group with correct retention", async () => {
      const pipelineLogGroupName = `/aws/codepipeline/nova-model-pipeline-${environmentSuffix}`;

      const result = await logs.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: pipelineLogGroupName
        })
      );

      const logGroup = result.logGroups?.find(lg => lg.logGroupName === pipelineLogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  // ----------------------------
  // EventBridge Rules Tests
  // ----------------------------
  describe("EventBridge Rules", () => {
    it("should have pipeline monitoring rule", async () => {
      const result = await eventbridge.send(
        new ListRulesCommand({ NamePrefix: stackName })
      );

      const pipelineRule = result.Rules?.find(r =>
        r.Description === "Capture pipeline state changes"
      );

      expect(pipelineRule).toBeDefined();
      expect(pipelineRule?.State).toBe("ENABLED");

      // Check event pattern
      if (pipelineRule?.EventPattern) {
        const eventPattern = JSON.parse(pipelineRule.EventPattern);
        expect(eventPattern.source).toContain("aws.codepipeline");
        expect(eventPattern["detail-type"]).toContain("CodePipeline Pipeline Execution State Change");
        expect(eventPattern.detail.pipeline).toContain(pipelineName);
      }
    });
  });

  // ----------------------------
  // CloudFormation Stack Tests
  // ----------------------------
  describe("CloudFormation Stack", () => {
    it("should exist and be in a successful state", async () => {
      const result = await cloudformation.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      expect(result.Stacks?.[0]?.StackStatus).toMatch(/(CREATE_COMPLETE|UPDATE_COMPLETE)/);
      expect(result.Stacks?.[0]?.StackName).toBe(stackName);
    });

    it("should have all expected outputs", async () => {
      const result = await cloudformation.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const outputs = result.Stacks?.[0]?.Outputs || [];
      const outputKeys = outputs.map(o => o.OutputKey);

      expect(outputKeys).toContain("SourceBucketName");
      expect(outputKeys).toContain("ArtifactsBucketName");
      expect(outputKeys).toContain("PipelineName");
      expect(outputKeys).toContain("BuildProjectName");
      expect(outputKeys).toContain("PipelineConsoleUrl");

      // Validate specific output values
      const pipelineNameOutput = outputs.find(o => o.OutputKey === "PipelineName");
      expect(pipelineNameOutput?.OutputValue).toBe(pipelineName);

      const sourceBucketOutput = outputs.find(o => o.OutputKey === "SourceBucketName");
      expect(sourceBucketOutput?.OutputValue).toBe(sourceBucketName);

      const artifactsBucketOutput = outputs.find(o => o.OutputKey === "ArtifactsBucketName");
      expect(artifactsBucketOutput?.OutputValue).toBe(artifactsBucketName);

      const buildProjectOutput = outputs.find(o => o.OutputKey === "BuildProjectName");
      expect(buildProjectOutput?.OutputValue).toBe(buildProjectName);

      const consoleUrlOutput = outputs.find(o => o.OutputKey === "PipelineConsoleUrl");
      expect(consoleUrlOutput?.OutputValue).toContain("console.aws.amazon.com");
      expect(consoleUrlOutput?.OutputValue).toContain(pipelineName);
    });
  });

  // ----------------------------
  // Resource Integration Tests
  // ----------------------------
  describe("Resource Integration", () => {
    it("should validate pipeline source configuration", async () => {
      const pipelineResult = await codepipeline.send(
        new GetPipelineCommand({ name: pipelineName })
      );

      const sourceStage = pipelineResult.pipeline?.stages?.find(s => s.name === "Source");
      const sourceAction = sourceStage?.actions?.[0];

      expect(sourceAction?.configuration?.S3Bucket).toBe(sourceBucketName);
      expect(sourceAction?.configuration?.S3ObjectKey).toBe("source.zip");
    });

    it("should validate build project environment variables", async () => {
      const buildResult = await codebuild.send(
        new BatchGetProjectsCommand({ names: [buildProjectName] })
      );

      const project = buildResult.projects?.[0];
      const envVars = project?.environment?.environmentVariables || [];

      const artifactsBucketVar = envVars.find(v => v.name === "ARTIFACTS_BUCKET");
      expect(artifactsBucketVar?.value).toBe(artifactsBucketName);
    });
  });
});