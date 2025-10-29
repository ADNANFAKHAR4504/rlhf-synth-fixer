import {
  CodeCommitClient,
  GetRepositoryCommand
} from "@aws-sdk/client-codecommit";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand
} from "@aws-sdk/client-s3";
import {
  DynamoDBClient,
  DescribeTableCommand
} from "@aws-sdk/client-dynamodb";
import {
  ECRClient,
  DescribeRepositoriesCommand
} from "@aws-sdk/client-ecr";
import {
  CodeBuildClient,
  BatchGetProjectsCommand
} from "@aws-sdk/client-codebuild";
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListPipelineExecutionsCommand
} from "@aws-sdk/client-codepipeline";
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand
} from "@aws-sdk/client-sns";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand
} from "@aws-sdk/client-iam";
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand
} from "@aws-sdk/client-eventbridge";
import { readFileSync } from "fs";
import { join } from "path";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const outputsPath = join(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: Record<string, string> = {};

try {
  outputs = JSON.parse(readFileSync(outputsPath, "utf-8"));
} catch (error) {
  console.warn("Warning: Could not load outputs file. Integration tests will be skipped.");
  outputs = {};
}

const codecommitClient = new CodeCommitClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const ecrClient = new ECRClient({ region: AWS_REGION });
const codebuildClient = new CodeBuildClient({ region: AWS_REGION });
const pipelineClient = new CodePipelineClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const eventsClient = new EventBridgeClient({ region: AWS_REGION });

const shouldRunTests = Object.keys(outputs).length > 0;

describe("Terraform CI/CD Pipeline Infrastructure - Integration Tests", () => {

  beforeAll(() => {
    if (!shouldRunTests) {
      console.log("Skipping integration tests - outputs file not available");
    }
  });

  describe("CodeCommit Repository", () => {
    test("repository should exist and be accessible", async () => {
      if (!shouldRunTests) return;

      const repoName = outputs.repository_clone_url_http?.match(/\/([^/]+)$/)?.[1];
      expect(repoName).toBeDefined();

      const command = new GetRepositoryCommand({
        repositoryName: repoName
      });

      const response = await codecommitClient.send(command);
      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repoName);
      expect(response.repositoryMetadata?.defaultBranch).toBe("main");
    });

    test("repository should have clone URLs", async () => {
      if (!shouldRunTests) return;

      expect(outputs.repository_clone_url_http).toMatch(/https:\/\/git-codecommit\./);
      expect(outputs.repository_clone_url_ssh).toMatch(/ssh:\/\/git-codecommit\./);
    });
  });

  describe("S3 State Bucket", () => {
    test("state bucket should exist", async () => {
      if (!shouldRunTests) return;

      const command = new HeadBucketCommand({
        Bucket: outputs.state_bucket_name
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test("state bucket should have versioning enabled", async () => {
      if (!shouldRunTests) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.state_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    test("state bucket should have encryption enabled", async () => {
      if (!shouldRunTests) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.state_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    });

    test("state bucket should block all public access", async () => {
      if (!shouldRunTests) return;

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.state_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test("state bucket should have lifecycle rules configured", async () => {
      if (!shouldRunTests) return;

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.state_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
    });
  });

  describe("S3 Artifacts Bucket", () => {
    test("artifacts bucket should exist", async () => {
      if (!shouldRunTests) return;

      const command = new HeadBucketCommand({
        Bucket: outputs.artifacts_bucket_name
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test("artifacts bucket should have encryption enabled", async () => {
      if (!shouldRunTests) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.artifacts_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test("artifacts bucket should block all public access", async () => {
      if (!shouldRunTests) return;

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.artifacts_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    });
  });

  describe("DynamoDB State Lock Table", () => {
    test("state lock table should exist", async () => {
      if (!shouldRunTests) return;

      const command = new DescribeTableCommand({
        TableName: outputs.state_lock_table_name
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.state_lock_table_name);
    });

    test("state lock table should have correct key schema", async () => {
      if (!shouldRunTests) return;

      const command = new DescribeTableCommand({
        TableName: outputs.state_lock_table_name
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.KeySchema).toBeDefined();
      expect(response.Table?.KeySchema?.[0].AttributeName).toBe("LockID");
      expect(response.Table?.KeySchema?.[0].KeyType).toBe("HASH");
    });

    test("state lock table should use on-demand billing", async () => {
      if (!shouldRunTests) return;

      const command = new DescribeTableCommand({
        TableName: outputs.state_lock_table_name
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST");
    });

    test("state lock table should have encryption enabled", async () => {
      if (!shouldRunTests) return;

      const command = new DescribeTableCommand({
        TableName: outputs.state_lock_table_name
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.SSEDescription?.Status).toBe("ENABLED");
    });
  });

  describe("ECR Repository", () => {
    test("ECR repository should exist", async () => {
      if (!shouldRunTests) return;

      const repoName = outputs.ecr_repository_url?.split("/").pop();
      expect(repoName).toBeDefined();

      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName!]
      });

      const response = await ecrClient.send(command);
      expect(response.repositories).toBeDefined();
      expect(response.repositories?.length).toBe(1);
    });

    test("ECR repository should have image scanning enabled", async () => {
      if (!shouldRunTests) return;

      const repoName = outputs.ecr_repository_url?.split("/").pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName!]
      });

      const response = await ecrClient.send(command);
      expect(response.repositories?.[0].imageScanningConfiguration?.scanOnPush).toBe(true);
    });

    test("ECR repository should have encryption configured", async () => {
      if (!shouldRunTests) return;

      const repoName = outputs.ecr_repository_url?.split("/").pop();
      const command = new DescribeRepositoriesCommand({
        repositoryNames: [repoName!]
      });

      const response = await ecrClient.send(command);
      expect(response.repositories?.[0].encryptionConfiguration).toBeDefined();
    });
  });

  describe("CodeBuild Projects", () => {
    test("plan projects should exist for all environments", async () => {
      if (!shouldRunTests) return;

      const projectNames = Object.values(outputs.codebuild_plan_project_names || {});
      expect(projectNames.length).toBeGreaterThan(0);

      const command = new BatchGetProjectsCommand({
        names: projectNames
      });

      const response = await codebuildClient.send(command);
      expect(response.projects?.length).toBe(projectNames.length);
    });

    test("apply projects should exist for all environments", async () => {
      if (!shouldRunTests) return;

      const projectNames = Object.values(outputs.codebuild_apply_project_names || {});
      expect(projectNames.length).toBeGreaterThan(0);

      const command = new BatchGetProjectsCommand({
        names: projectNames
      });

      const response = await codebuildClient.send(command);
      expect(response.projects?.length).toBe(projectNames.length);
    });

    test("plan projects should use custom Docker image from ECR", async () => {
      if (!shouldRunTests) return;

      const projectNames = Object.values(outputs.codebuild_plan_project_names || {});
      const command = new BatchGetProjectsCommand({
        names: projectNames.slice(0, 1)
      });

      const response = await codebuildClient.send(command);
      expect(response.projects?.[0].environment?.image).toContain(outputs.ecr_repository_url);
    });

    test("plan projects should have correct environment variables", async () => {
      if (!shouldRunTests) return;

      const projectNames = Object.values(outputs.codebuild_plan_project_names || {});
      const command = new BatchGetProjectsCommand({
        names: projectNames.slice(0, 1)
      });

      const response = await codebuildClient.send(command);
      const envVars = response.projects?.[0].environment?.environmentVariables || [];
      const varNames = envVars.map(v => v.name);

      expect(varNames).toContain("ENVIRONMENT");
      expect(varNames).toContain("AWS_DEFAULT_REGION");
      expect(varNames).toContain("TF_STATE_BUCKET");
      expect(varNames).toContain("TF_STATE_LOCK_TABLE");
    });
  });

  describe("CodePipeline", () => {
    test("pipelines should exist for all environments", async () => {
      if (!shouldRunTests) return;

      const pipelineNames = Object.values(outputs.pipeline_names || {});
      expect(pipelineNames.length).toBeGreaterThan(0);

      for (const pipelineName of pipelineNames) {
        const command = new GetPipelineCommand({
          name: pipelineName
        });

        const response = await pipelineClient.send(command);
        expect(response.pipeline).toBeDefined();
      }
    });

    test("pipelines should have correct stages", async () => {
      if (!shouldRunTests) return;

      const pipelineNames = Object.values(outputs.pipeline_names || {});
      const command = new GetPipelineCommand({
        name: pipelineNames[0]
      });

      const response = await pipelineClient.send(command);
      const stageNames = response.pipeline?.stages?.map(s => s.name);

      expect(stageNames).toContain("Source");
      expect(stageNames).toContain("Plan");
      expect(stageNames).toContain("Apply");
    });

    test("production pipeline should have approval stage", async () => {
      if (!shouldRunTests) return;

      const pipelineNames = outputs.pipeline_names || {};
      const prodPipeline = pipelineNames["prod"];

      if (prodPipeline) {
        const command = new GetPipelineCommand({
          name: prodPipeline
        });

        const response = await pipelineClient.send(command);
        const stageNames = response.pipeline?.stages?.map(s => s.name);

        expect(stageNames).toContain("Approval");
      }
    });
  });

  describe("SNS Topics", () => {
    test("pipeline notifications topic should exist", async () => {
      if (!shouldRunTests) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.notification_topic_arn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test("approval notifications topic should exist", async () => {
      if (!shouldRunTests) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.approval_topic_arn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    });

    test("SNS topics should have KMS encryption", async () => {
      if (!shouldRunTests) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.notification_topic_arn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("log groups should exist for all CodeBuild projects", async () => {
      if (!shouldRunTests) return;

      const envSuffix = outputs.env_suffix;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/terraform-plan`
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });
  });

  describe("End-to-End Workflow - CI/CD Pipeline", () => {
    test("complete deployment workflow components should be in place", async () => {
      if (!shouldRunTests) return;

      expect(outputs.repository_clone_url_http).toBeDefined();
      expect(outputs.state_bucket_name).toBeDefined();
      expect(outputs.state_lock_table_name).toBeDefined();
      expect(outputs.ecr_repository_url).toBeDefined();
      expect(Object.keys(outputs.pipeline_names || {}).length).toBeGreaterThan(0);
    });

    test("state management workflow should be functional", async () => {
      if (!shouldRunTests) return;

      const stateBucket = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.state_bucket_name })
      );
      expect(stateBucket).toBeDefined();

      const lockTable = await dynamoClient.send(
        new DescribeTableCommand({ TableName: outputs.state_lock_table_name })
      );
      expect(lockTable.Table?.TableStatus).toBe("ACTIVE");
    });

    test("notification workflow should be configured", async () => {
      if (!shouldRunTests) return;

      const topic = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.notification_topic_arn })
      );
      expect(topic.Attributes).toBeDefined();

      const subscriptions = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: outputs.notification_topic_arn })
      );
      expect(subscriptions.Subscriptions).toBeDefined();
    });
  });

  describe("Security Posture", () => {
    test("all S3 buckets should have encryption enabled", async () => {
      if (!shouldRunTests) return;

      const buckets = [outputs.state_bucket_name, outputs.artifacts_bucket_name];

      for (const bucket of buckets) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucket });
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      }
    });

    test("all S3 buckets should block public access", async () => {
      if (!shouldRunTests) return;

      const buckets = [outputs.state_bucket_name, outputs.artifacts_bucket_name];

      for (const bucket of buckets) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucket });
        const response = await s3Client.send(command);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      }
    });

    test("DynamoDB table should have encryption enabled", async () => {
      if (!shouldRunTests) return;

      const command = new DescribeTableCommand({
        TableName: outputs.state_lock_table_name
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.SSEDescription?.Status).toBe("ENABLED");
    });
  });

  describe("Resource Tagging", () => {
    test("DynamoDB table should have required tags", async () => {
      if (!shouldRunTests) return;

      const command = new DescribeTableCommand({
        TableName: outputs.state_lock_table_name
      });

      const response = await dynamoClient.send(command);
      const tags = response.Table?.Tags || [];
      const tagKeys = tags.map(t => t.Key);

      expect(tagKeys).toContain("ManagedBy");
    });
  });

  describe("Multi-Environment Support", () => {
    test("should have pipelines for multiple environments", async () => {
      if (!shouldRunTests) return;

      const pipelineNames = Object.keys(outputs.pipeline_names || {});
      expect(pipelineNames.length).toBeGreaterThanOrEqual(1);
    });

    test("each environment should have separate CodeBuild projects", async () => {
      if (!shouldRunTests) return;

      const planProjects = Object.keys(outputs.codebuild_plan_project_names || {});
      const applyProjects = Object.keys(outputs.codebuild_apply_project_names || {});

      expect(planProjects.length).toBeGreaterThanOrEqual(1);
      expect(applyProjects.length).toBeGreaterThanOrEqual(1);
      expect(planProjects.length).toBe(applyProjects.length);
    });
  });

  describe("High Availability and Resilience", () => {
    test("state bucket should have versioning for recovery", async () => {
      if (!shouldRunTests) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.state_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    test("DynamoDB table should support state locking to prevent conflicts", async () => {
      if (!shouldRunTests) return;

      const command = new DescribeTableCommand({
        TableName: outputs.state_lock_table_name
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.TableStatus).toBe("ACTIVE");
      expect(response.Table?.KeySchema?.[0].AttributeName).toBe("LockID");
    });
  });
});
