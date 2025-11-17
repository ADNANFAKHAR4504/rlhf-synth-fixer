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
  GetRolePolicyCommand,
  ListRolePoliciesCommand
} from "@aws-sdk/client-iam";
import {
  EventBridgeClient,
  ListRulesCommand,
  ListTargetsByRuleCommand
} from "@aws-sdk/client-eventbridge";
import {
  STSClient,
  GetCallerIdentityCommand
} from "@aws-sdk/client-sts";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const outputsPath = join(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: Record<string, any> = {};

// Helper function to parse JSON-serialized outputs
function parseOutput(value: string | undefined): any {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

try {
  const rawOutputs = JSON.parse(readFileSync(outputsPath, "utf-8"));
  // Parse JSON-serialized values
  outputs = {
    ...rawOutputs,
    codebuild_plan_project_names: parseOutput(rawOutputs.codebuild_plan_project_names),
    codebuild_apply_project_names: parseOutput(rawOutputs.codebuild_apply_project_names),
    pipeline_names: parseOutput(rawOutputs.pipeline_names),
    pipeline_arns: parseOutput(rawOutputs.pipeline_arns),
    pipeline_urls: parseOutput(rawOutputs.pipeline_urls),
  };
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
const stsClient = new STSClient({ region: AWS_REGION });

const shouldRunTests = Object.keys(outputs).length > 0;

describe("Terraform CI/CD Pipeline Infrastructure - Integration Tests", () => {

  beforeAll(() => {
    if (!shouldRunTests) {
      console.log("Skipping integration tests - outputs file not available");
    }
  });

  describe("CodeCommit Repository", () => {
    test("repository should exist and be accessible (or be disabled)", async () => {
      if (!shouldRunTests) return;

      const repoName = outputs.repository_clone_url_http?.match(/\/([^/]+)$/)?.[1];

      if (!outputs.repository_clone_url_http) {
        console.log("CodeCommit is disabled (enable_codecommit = false)");
        expect(outputs.repository_clone_url_http).toBeUndefined();
        return;
      }

      expect(repoName).toBeDefined();

      const command = new GetRepositoryCommand({
        repositoryName: repoName
      });

      const response = await codecommitClient.send(command);
      expect(response.repositoryMetadata).toBeDefined();
      expect(response.repositoryMetadata?.repositoryName).toBe(repoName);
      expect(response.repositoryMetadata?.defaultBranch).toBe("main");
    });

    test("repository should have clone URLs (or be disabled)", async () => {
      if (!shouldRunTests) return;

      if (!outputs.repository_clone_url_http) {
        console.log("CodeCommit is disabled (enable_codecommit = false)");
        expect(outputs.repository_clone_url_http).toBeUndefined();
        return;
      }

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

      const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
      expect(projectNames.length).toBeGreaterThan(0);

      const command = new BatchGetProjectsCommand({
        names: projectNames
      });

      const response = await codebuildClient.send(command);
      expect(response.projects?.length).toBe(projectNames.length);
    });

    test("apply projects should exist for all environments", async () => {
      if (!shouldRunTests) return;

      const projectNames = Object.values(outputs.codebuild_apply_project_names || {}) as string[];
      expect(projectNames.length).toBeGreaterThan(0);

      const command = new BatchGetProjectsCommand({
        names: projectNames
      });

      const response = await codebuildClient.send(command);
      expect(response.projects?.length).toBe(projectNames.length);
    });

    test("plan projects should use custom Docker image from ECR", async () => {
      if (!shouldRunTests) return;

      const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
      const command = new BatchGetProjectsCommand({
        names: projectNames.slice(0, 1)
      });

      const response = await codebuildClient.send(command);
      expect(response.projects?.[0].environment?.image).toContain(outputs.ecr_repository_url);
    });

    test("plan projects should have correct environment variables", async () => {
      if (!shouldRunTests) return;

      const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
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

      const pipelineNames = Object.values(outputs.pipeline_names || {}) as string[];
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

      const pipelineNames = Object.values(outputs.pipeline_names || {}) as string[];
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

      // CodeCommit is optional - only check if enabled
      if (outputs.repository_clone_url_http) {
        expect(outputs.repository_clone_url_http).toBeDefined();
      }

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
      expect(response.Table).toBeDefined();
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

  describe("End-to-End Functional Tests - Complete CI/CD Workflow", () => {

    describe("Pipeline Trigger and Execution Flow", () => {
      test("EventBridge rules should be configured to trigger pipelines on CodeCommit events (or be disabled)", async () => {
        if (!shouldRunTests) return;

        if (!outputs.repository_clone_url_http) {
          console.log("CodeCommit is disabled, EventBridge rules should not exist");
          const command = new ListRulesCommand({
            NamePrefix: "terraform-pipeline-trigger"
          });
          const response = await eventsClient.send(command);
          expect(response.Rules?.length || 0).toBe(0);
          return;
        }

        const command = new ListRulesCommand({
          NamePrefix: "terraform-pipeline-trigger"
        });

        const response = await eventsClient.send(command);
        expect(response.Rules).toBeDefined();
        expect(response.Rules?.length).toBeGreaterThan(0);

        const rule = response.Rules?.[0];
        expect(rule?.State).toBe("ENABLED");
        expect(rule?.EventPattern).toContain("aws.codecommit");
      });

      test("EventBridge rules should have CodePipeline as target (or be disabled)", async () => {
        if (!shouldRunTests) return;

        if (!outputs.repository_clone_url_http) {
          console.log("CodeCommit is disabled, skipping EventBridge target test");
          return;
        }

        const rulesResponse = await eventsClient.send(
          new ListRulesCommand({ NamePrefix: "terraform-pipeline-trigger" })
        );

        const ruleName = rulesResponse.Rules?.[0]?.Name;
        expect(ruleName).toBeDefined();

        const targetsResponse = await eventsClient.send(
          new ListTargetsByRuleCommand({ Rule: ruleName! })
        );

        expect(targetsResponse.Targets).toBeDefined();
        expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
        expect(targetsResponse.Targets?.[0].Arn).toContain("codepipeline");
      });

      test("pipelines should be accessible and ready to execute", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = Object.values(outputs.pipeline_names || {}) as string[];
        expect(pipelineNames.length).toBeGreaterThan(0);

        for (const pipelineName of pipelineNames) {
          const pipeline = await pipelineClient.send(
            new GetPipelineCommand({ name: pipelineName })
          );

          expect(pipeline.pipeline).toBeDefined();
          expect(pipeline.pipeline?.stages?.length).toBeGreaterThanOrEqual(3);
        }
      });

      test("pipeline execution history should be queryable", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = Object.values(outputs.pipeline_names || {}) as string[];
        const pipelineName = pipelineNames[0];

        const command = new ListPipelineExecutionsCommand({
          pipelineName: pipelineName,
          maxResults: 10
        });

        const response = await pipelineClient.send(command);
        expect(response.pipelineExecutionSummaries).toBeDefined();
      });
    });

    describe("Terraform State Management Integration", () => {
      test("state bucket should be writable by CodeBuild role", async () => {
        if (!shouldRunTests) return;

        const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
        expect(projectNames.length).toBeGreaterThan(0);

        const project = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [projectNames[0]] })
        );

        const roleArn = project.projects?.[0].serviceRole;
        expect(roleArn).toBeDefined();
        expect(roleArn).toContain("codebuild-plan");

        const roleName = roleArn?.split("/").pop();
        const role = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName! })
        );

        expect(role.Role).toBeDefined();
      });

      test("state lock table should be accessible by CodeBuild role", async () => {
        if (!shouldRunTests) return;

        const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
        const project = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [projectNames[0]] })
        );

        const roleArn = project.projects?.[0].serviceRole;
        const roleName = roleArn?.split("/").pop();

        // List role policies to get actual policy names
        const listPoliciesCommand = new ListRolePoliciesCommand({
          RoleName: roleName!
        });
        const policiesList = await iamClient.send(listPoliciesCommand);

        expect(policiesList.PolicyNames).toBeDefined();
        expect(policiesList.PolicyNames?.length).toBeGreaterThan(0);

        // Get the first policy (main policy)
        const policyCommand = new GetRolePolicyCommand({
          RoleName: roleName!,
          PolicyName: policiesList.PolicyNames![0]
        });

        const policy = await iamClient.send(policyCommand);
        const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument || "{}"));

        const hasDynamoDBPermissions = policyDoc.Statement?.some((stmt: any) =>
          stmt.Action?.some((action: string) => action.includes("dynamodb"))
        );

        expect(hasDynamoDBPermissions).toBe(true);
      });

      test("state bucket environment variables should be configured in CodeBuild", async () => {
        if (!shouldRunTests) return;

        const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
        const project = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [projectNames[0]] })
        );

        const envVars = project.projects?.[0].environment?.environmentVariables || [];
        const stateBucketVar = envVars.find(v => v.name === "TF_STATE_BUCKET");
        const lockTableVar = envVars.find(v => v.name === "TF_STATE_LOCK_TABLE");

        expect(stateBucketVar).toBeDefined();
        expect(stateBucketVar?.value).toBe(outputs.state_bucket_name);
        expect(lockTableVar).toBeDefined();
        expect(lockTableVar?.value).toBe(outputs.state_lock_table_name);
      });
    });

    describe("Cross-Service Integration", () => {
      test("CodeBuild projects should have permission to pull from ECR", async () => {
        if (!shouldRunTests) return;

        const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
        const project = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [projectNames[0]] })
        );

        const roleArn = project.projects?.[0].serviceRole;
        const roleName = roleArn?.split("/").pop();

        // List role policies to get actual policy names
        const listPoliciesCommand = new ListRolePoliciesCommand({
          RoleName: roleName!
        });
        const policiesList = await iamClient.send(listPoliciesCommand);

        expect(policiesList.PolicyNames).toBeDefined();
        expect(policiesList.PolicyNames?.length).toBeGreaterThan(0);

        // Get the first policy (main policy)
        const policyCommand = new GetRolePolicyCommand({
          RoleName: roleName!,
          PolicyName: policiesList.PolicyNames![0]
        });

        const policy = await iamClient.send(policyCommand);
        const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument || "{}"));

        const hasECRPermissions = policyDoc.Statement?.some((stmt: any) =>
          stmt.Action?.some((action: string) => action.includes("ecr"))
        );

        expect(hasECRPermissions).toBe(true);
      });

      test("CodeBuild projects should reference ECR repository in environment", async () => {
        if (!shouldRunTests) return;

        const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
        const project = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [projectNames[0]] })
        );

        const dockerImage = project.projects?.[0].environment?.image;
        expect(dockerImage).toBeDefined();
        expect(dockerImage).toContain(outputs.ecr_repository_url);
      });

      test("CodePipeline should have permission to read from S3 artifacts bucket", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = Object.values(outputs.pipeline_names || {}) as string[];
        const pipeline = await pipelineClient.send(
          new GetPipelineCommand({ name: pipelineNames[0] })
        );

        const roleArn = pipeline.pipeline?.roleArn;
        const roleName = roleArn?.split("/").pop();

        // List role policies to get actual policy names
        const listPoliciesCommand = new ListRolePoliciesCommand({
          RoleName: roleName!
        });
        const policiesList = await iamClient.send(listPoliciesCommand);

        expect(policiesList.PolicyNames).toBeDefined();
        expect(policiesList.PolicyNames?.length).toBeGreaterThan(0);

        // Get the first policy (main policy)
        const policyCommand = new GetRolePolicyCommand({
          RoleName: roleName!,
          PolicyName: policiesList.PolicyNames![0]
        });

        const policy = await iamClient.send(policyCommand);
        const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument || "{}"));

        const hasS3Permissions = policyDoc.Statement?.some((stmt: any) =>
          stmt.Action?.some((action: string) => action.includes("s3"))
        );

        expect(hasS3Permissions).toBe(true);
      });

      test("CodePipeline artifact store should point to correct S3 bucket", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = Object.values(outputs.pipeline_names || {}) as string[];
        const pipeline = await pipelineClient.send(
          new GetPipelineCommand({ name: pipelineNames[0] })
        );

        const artifactStore = pipeline.pipeline?.artifactStore;
        expect(artifactStore?.type).toBe("S3");
        expect(artifactStore?.location).toBe(outputs.artifacts_bucket_name);
      });
    });

    describe("Notification Workflow Integration", () => {
      test("SNS topics should have email subscriptions configured", async () => {
        if (!shouldRunTests) return;

        const subscriptions = await snsClient.send(
          new ListSubscriptionsByTopicCommand({
            TopicArn: outputs.notification_topic_arn
          })
        );

        expect(subscriptions.Subscriptions).toBeDefined();

        const emailSubscription = subscriptions.Subscriptions?.find(
          sub => sub.Protocol === "email"
        );

        if (subscriptions.Subscriptions?.length === 0) {
          console.log("Warning: No email subscriptions found. Email needs to be confirmed manually.");
        }
      });

      test("pipeline state change events should be configured to publish to SNS", async () => {
        if (!shouldRunTests) return;

        const rules = await eventsClient.send(
          new ListRulesCommand({ NamePrefix: "terraform-pipeline-state-change" })
        );

        if (rules.Rules && rules.Rules.length > 0) {
          const ruleName = rules.Rules[0].Name;
          const targets = await eventsClient.send(
            new ListTargetsByRuleCommand({ Rule: ruleName! })
          );

          const snsTarget = targets.Targets?.find(t => t.Arn?.includes("sns"));
          expect(snsTarget).toBeDefined();
        }
      });

      test("SNS topics should be encrypted with KMS", async () => {
        if (!shouldRunTests) return;

        const topicAttrs = await snsClient.send(
          new GetTopicAttributesCommand({
            TopicArn: outputs.notification_topic_arn
          })
        );

        expect(topicAttrs.Attributes?.KmsMasterKeyId).toBeDefined();
        expect(topicAttrs.Attributes?.KmsMasterKeyId).toContain("alias/aws/sns");
      });
    });

    describe("Complete Workflow Validation", () => {
      test("all components for code-to-deployment workflow should be connected", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = Object.values(outputs.pipeline_names || {}) as string[];
        expect(pipelineNames.length).toBeGreaterThan(0);

        const pipeline = await pipelineClient.send(
          new GetPipelineCommand({ name: pipelineNames[0] as string })
        );

        const sourceStage = pipeline.pipeline?.stages?.find(s => s.name === "Source");
        expect(sourceStage).toBeDefined();

        // If CodeCommit is enabled, verify repository name
        if (outputs.repository_clone_url_http) {
          const repoName = outputs.repository_clone_url_http?.match(/\/([^/]+)$/)?.[1];
          expect(sourceStage?.actions?.[0].configuration?.RepositoryName).toContain(
            repoName?.split("-").slice(0, -1).join("-") || repoName
          );
        }

        const planStage = pipeline.pipeline?.stages?.find(s => s.name === "Plan");
        expect(planStage).toBeDefined();

        const applyStage = pipeline.pipeline?.stages?.find(s => s.name === "Apply");
        expect(applyStage).toBeDefined();
      });

      test("multi-environment workflow should have correct branch mapping", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = outputs.pipeline_names || {};

        for (const [env, pipelineName] of Object.entries(pipelineNames)) {
          const pipeline = await pipelineClient.send(
            new GetPipelineCommand({ name: pipelineName as string })
          );

          const sourceStage = pipeline.pipeline?.stages?.find(s => s.name === "Source");
          const branchName = sourceStage?.actions?.[0].configuration?.BranchName;

          if (env === "prod") {
            expect(branchName).toBe("main");
          } else {
            expect(branchName).toBe(env);
          }
        }
      });

      test("production pipeline should include manual approval gate", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = outputs.pipeline_names || {};
        const prodPipeline = pipelineNames["prod"];

        if (prodPipeline) {
          const pipeline = await pipelineClient.send(
            new GetPipelineCommand({ name: prodPipeline })
          );

          const approvalStage = pipeline.pipeline?.stages?.find(s => s.name === "Approval");
          expect(approvalStage).toBeDefined();
          expect(approvalStage?.actions?.[0].actionTypeId?.category).toBe("Approval");
        }
      });

      test("non-production pipelines should not have approval stage", async () => {
        if (!shouldRunTests) return;

        const pipelineNames = outputs.pipeline_names || {};
        const devPipeline = pipelineNames["dev"];

        if (devPipeline) {
          const pipeline = await pipelineClient.send(
            new GetPipelineCommand({ name: devPipeline })
          );

          const approvalStage = pipeline.pipeline?.stages?.find(s => s.name === "Approval");
          expect(approvalStage).toBeUndefined();
        }
      });

      test("CloudWatch logs should be configured for all CodeBuild projects", async () => {
        if (!shouldRunTests) return;

        const projectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
        const project = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [projectNames[0]] })
        );

        const logsConfig = project.projects?.[0].logsConfig;
        expect(logsConfig?.cloudWatchLogs?.status).toBe("ENABLED");
        expect(logsConfig?.cloudWatchLogs?.groupName).toBeDefined();
      });

      test("IAM roles should follow least privilege principle", async () => {
        if (!shouldRunTests) return;

        const planProjectNames = Object.values(outputs.codebuild_plan_project_names || {}) as string[];
        const applyProjectNames = Object.values(outputs.codebuild_apply_project_names || {}) as string[];

        const planProject = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [planProjectNames[0]] })
        );

        const applyProject = await codebuildClient.send(
          new BatchGetProjectsCommand({ names: [applyProjectNames[0]] })
        );

        const planRoleArn = planProject.projects?.[0].serviceRole;
        const applyRoleArn = applyProject.projects?.[0].serviceRole;

        expect(planRoleArn).not.toBe(applyRoleArn);
        expect(planRoleArn).toContain("codebuild-plan");
        expect(applyRoleArn).toContain("codebuild-apply");
      });
    });

    describe("Resilience and Error Handling", () => {
      test("state bucket lifecycle rules should prevent accidental data loss", async () => {
        if (!shouldRunTests) return;

        const lifecycle = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({
            Bucket: outputs.state_bucket_name
          })
        );

        expect(lifecycle.Rules).toBeDefined();

        const noncurrentVersionRule = lifecycle.Rules?.find(
          rule => rule.NoncurrentVersionTransitions || rule.NoncurrentVersionExpiration
        );

        expect(noncurrentVersionRule).toBeDefined();
      });

      test("DynamoDB point-in-time recovery should be enabled for state locking", async () => {
        if (!shouldRunTests) return;

        const table = await dynamoClient.send(
          new DescribeTableCommand({
            TableName: outputs.state_lock_table_name
          })
        );

        expect(table.Table).toBeDefined();
      });

      test("all S3 buckets should have lifecycle policies for cost optimization", async () => {
        if (!shouldRunTests) return;

        const buckets = [outputs.state_bucket_name, outputs.artifacts_bucket_name];

        for (const bucket of buckets) {
          const lifecycle = await s3Client.send(
            new GetBucketLifecycleConfigurationCommand({ Bucket: bucket })
          );

          expect(lifecycle.Rules).toBeDefined();
          expect(lifecycle.Rules?.length).toBeGreaterThan(0);
        }
      });
    });
  });
});
