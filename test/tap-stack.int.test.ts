import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from "@aws-sdk/client-codebuild";
import {
  CodePipelineClient,
  GetPipelineCommand,
} from "@aws-sdk/client-codepipeline";
import {
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";

const outputs = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

const sourceBucketName = outputs[`SourceBucketName-${environmentSuffix}`];
const artifactsBucketName = outputs[`ArtifactsBucketName-${environmentSuffix}`];
const pipelineName = outputs[`PipelineName-${environmentSuffix}`];
const buildProjectName = outputs[`BuildProjectName-${environmentSuffix}`];

describe("TapStack Integration Tests", () => {
  const region = process.env.AWS_REGION || "us-east-1";

  const s3 = new S3Client({ region });
  const codepipeline = new CodePipelineClient({ region });
  const codebuild = new CodeBuildClient({ region });
  const cloudformation = new CloudFormationClient({ region });

  // ----------------------------
  // S3 Bucket Tests
  // ----------------------------
  describe("S3 Buckets", () => {
    it("should have created the source bucket", async () => {
      const result = await s3.send(new HeadBucketCommand({ Bucket: sourceBucketName }));
      expect(result.$metadata.httpStatusCode).toBe(200);
    });

    it("should have created the artifacts bucket", async () => {
      const result = await s3.send(new HeadBucketCommand({ Bucket: artifactsBucketName }));
      expect(result.$metadata.httpStatusCode).toBe(200);
    });
  });

  // ----------------------------
  // CodePipeline Tests
  // ----------------------------
  describe("CodePipeline", () => {
    it("should exist and have correct stages", async () => {
      const result = await codepipeline.send(
        new GetPipelineCommand({ name: pipelineName })
      );

      expect(result.pipeline?.stages?.map((s) => s.name)).toEqual([
        "Source",
        "Build",
        "Deploy-US-East-1",
        "Deploy-US-West-2",
      ]);
    });
  });

  // ----------------------------
  // CodeBuild Project Tests
  // ----------------------------
  describe("CodeBuild", () => {
    it("should have a build project with correct name", async () => {
      const result = await codebuild.send(
        new BatchGetProjectsCommand({ names: [buildProjectName] })
      );

      expect(result.projects?.[0]?.name).toBe(buildProjectName);
      expect(result.projects?.[0]?.environment?.computeType).toBe("BUILD_GENERAL1_SMALL");
    });
  });

  // ----------------------------
  // CloudFormation Stack Tests
  // ----------------------------
  describe("CloudFormation Stack", () => {
    it("should exist and be in CREATE_COMPLETE or UPDATE_COMPLETE state", async () => {
      const stackName = `TapStack-${environmentSuffix}`;

      const result = await cloudformation.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      expect(result.Stacks?.[0]?.StackStatus).toMatch(/(CREATE_COMPLETE|UPDATE_COMPLETE)/);
    });
  });
});
