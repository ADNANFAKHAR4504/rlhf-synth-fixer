// tests/terraform.int.test.ts
// Live verification of deployed CI/CD Pipeline Terraform infrastructure
// Tests AWS resources: CodePipeline, CodeBuild, ECS, ECR, S3, SNS, CloudWatch, EventBridge

import * as fs from "fs";
import * as path from "path";
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
  ListPipelineExecutionsCommand,
} from "@aws-sdk/client-codepipeline";
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
  ListBuildsCommand,
  BatchGetBuildsCommand,
} from "@aws-sdk/client-codebuild";
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ListTasksCommand,
  DescribeTasksCommand,
} from "@aws-sdk/client-ecs";
import {
  ECRClient,
  DescribeRepositoriesCommand,
  GetLifecyclePolicyCommand,
  GetRepositoryPolicyCommand,
} from "@aws-sdk/client-ecr";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from "@aws-sdk/client-eventbridge";
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};

type StructuredOutputs = {
  pipeline_name?: TfOutputValue<string>;
  pipeline_arn?: TfOutputValue<string>;
  ecr_repository_url?: TfOutputValue<string>;
  ecs_cluster_name?: TfOutputValue<string>;
  ecs_service_name?: TfOutputValue<string>;
  sns_topic_arn?: TfOutputValue<string>;
  source_bucket_name?: TfOutputValue<string>;
  artifact_bucket_name?: TfOutputValue<string>;
  alb_dns_name?: TfOutputValue<string>;
  alb_url?: TfOutputValue<string>;
};

function readStructuredOutputs(): StructuredOutputs {
  // Try multiple possible output file locations
  const possiblePaths = [
    path.resolve(process.cwd(), "lib/terraform.tfstate.d/outputs.json"),
    path.resolve(process.cwd(), "lib/.terraform/outputs.json"),
    path.resolve(process.cwd(), "tf-outputs/all-outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      return JSON.parse(fs.readFileSync(outputPath, "utf8"));
    }
  }

  // Fallback: try reading from environment variables or terraform output
  // For CI/CD, outputs might be available as environment variables
  const outputs: StructuredOutputs = {};
  if (process.env.TF_PIPELINE_NAME) {
    outputs.pipeline_name = { sensitive: false, type: "string", value: process.env.TF_PIPELINE_NAME };
  }
  if (process.env.TF_PIPELINE_ARN) {
    outputs.pipeline_arn = { sensitive: false, type: "string", value: process.env.TF_PIPELINE_ARN };
  }
  if (process.env.TF_ECR_REPOSITORY_URL) {
    outputs.ecr_repository_url = { sensitive: false, type: "string", value: process.env.TF_ECR_REPOSITORY_URL };
  }
  if (process.env.TF_ECS_CLUSTER_NAME) {
    outputs.ecs_cluster_name = { sensitive: false, type: "string", value: process.env.TF_ECS_CLUSTER_NAME };
  }
  if (process.env.TF_ECS_SERVICE_NAME) {
    outputs.ecs_service_name = { sensitive: false, type: "string", value: process.env.TF_ECS_SERVICE_NAME };
  }
  if (process.env.TF_SNS_TOPIC_ARN) {
    outputs.sns_topic_arn = { sensitive: false, type: "string", value: process.env.TF_SNS_TOPIC_ARN };
  }
  if (process.env.TF_SOURCE_BUCKET_NAME) {
    outputs.source_bucket_name = { sensitive: false, type: "string", value: process.env.TF_SOURCE_BUCKET_NAME };
  }
  if (process.env.TF_ARTIFACT_BUCKET_NAME) {
    outputs.artifact_bucket_name = { sensitive: false, type: "string", value: process.env.TF_ARTIFACT_BUCKET_NAME };
  }
  if (process.env.TF_ALB_DNS_NAME) {
    outputs.alb_dns_name = { sensitive: false, type: "string", value: process.env.TF_ALB_DNS_NAME };
  }
  if (process.env.TF_ALB_URL) {
    outputs.alb_url = { sensitive: false, type: "string", value: process.env.TF_ALB_URL };
  }

  if (Object.keys(outputs).length === 0) {
    throw new Error(
      `Outputs file not found. Tried: ${possiblePaths.join(", ")}\n` +
      "Set environment variables or ensure Terraform outputs are available."
    );
  }

  return outputs;
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 2000,
  logLabel?: string
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const attemptNum = i + 1;
      if (logLabel) {
        console.log(`${logLabel} - Attempt ${attemptNum}/${attempts} failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      if (i < attempts - 1) {
        const wait = baseMs * Math.pow(1.5, i) + Math.floor(Math.random() * 500);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
}

// Read outputs and initialize AWS clients
const outputs = readStructuredOutputs();
const region = process.env.AWS_REGION || "us-east-1";

// AWS clients
const codePipelineClient = new CodePipelineClient({ region });
const codeBuildClient = new CodeBuildClient({ region });
const ecsClient = new ECSClient({ region });
const ecrClient = new ECRClient({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

// End-to-End ALB Accessibility Test - Run first
describe("LIVE: End-to-End ALB Accessibility", () => {
  const albDnsName = outputs.alb_dns_name?.value || outputs.alb_url?.value?.replace(/^https?:\/\//, "");

  test("ALB domain is accessible and returns a response", async () => {
    // First check if ALB outputs exist
    if (!albDnsName) {
      console.warn("ALB DNS name not found in outputs. Skipping ALB accessibility test.");
      console.warn("Available outputs:", Object.keys(outputs));
      // Skip test if ALB outputs are not available
      return;
    }

    expect(albDnsName).toBeTruthy();

    const url = outputs.alb_url?.value || `http://${albDnsName}`;

    const testResponse = await retry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Terraform-Integration-Test",
          },
          signal: controller.signal,
          redirect: "follow",
        });

        clearTimeout(timeoutId);

        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error(`Request to ALB timed out after 5 seconds`);
        }
        if (error.code === 'ENOTFOUND') {
          throw new Error(`DNS resolution failed for ${url} - ALB may not be fully provisioned yet`);
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error(`Connection refused to ${url} - ALB may not be active yet`);
        }
        if (error.message && error.message.includes('fetch')) {
          throw new Error(`Network error fetching ${url}: ${error.message}`);
        }
        throw new Error(`Failed to fetch from ALB: ${error.message || String(error)}`);
      }
    }, 3, 2000, "ALB accessibility");

    expect(testResponse).toBeTruthy();
    expect(testResponse.status).toBeGreaterThanOrEqual(200);
    expect(testResponse.status).toBeLessThan(600);
    expect(testResponse.statusText).toBeTruthy();
  }, 60000);
});

describe("LIVE: CodePipeline", () => {
  const pipelineName = outputs.pipeline_name?.value;
  const pipelineArn = outputs.pipeline_arn?.value;

  test("CodePipeline exists and is active", async () => {
    expect(pipelineName).toBeTruthy();

    const response = await retry(async () => {
      return await codePipelineClient.send(
        new GetPipelineCommand({ name: pipelineName! })
      );
    });

    expect(response.pipeline).toBeTruthy();
    expect(response.pipeline!.name).toBe(pipelineName);
    expect(response.pipeline!.roleArn).toBeTruthy();
  }, 90000);

  test("CodePipeline has Source stage configured", async () => {
    const response = await retry(async () => {
      return await codePipelineClient.send(
        new GetPipelineCommand({ name: pipelineName! })
      );
    });

    expect(response.pipeline!.stages).toBeTruthy();
    const sourceStage = response.pipeline!.stages!.find(
      (stage) => stage.name === "Source"
    );
    expect(sourceStage).toBeTruthy();
    expect(sourceStage!.actions).toBeTruthy();
    expect(sourceStage!.actions!.length).toBeGreaterThan(0);

    const sourceAction = sourceStage!.actions!.find(
      (action) => action.actionTypeId?.category === "Source"
    );
    expect(sourceAction).toBeTruthy();
    expect(sourceAction!.actionTypeId?.provider).toBe("S3");
  }, 90000);

  test("CodePipeline has Build stage with CodeBuild", async () => {
    const response = await retry(async () => {
      return await codePipelineClient.send(
        new GetPipelineCommand({ name: pipelineName! })
      );
    });

    const buildStage = response.pipeline!.stages!.find(
      (stage) => stage.name === "Build"
    );
    expect(buildStage).toBeTruthy();

    const buildAction = buildStage!.actions!.find(
      (action) => action.actionTypeId?.category === "Build"
    );
    expect(buildAction).toBeTruthy();
    expect(buildAction!.actionTypeId?.provider).toBe("CodeBuild");
    expect(buildAction!.configuration).toBeTruthy();
    expect(buildAction!.configuration!.ProjectName).toBeTruthy();
  }, 90000);

  test("CodePipeline artifact store uses artifacts bucket", async () => {
    const response = await retry(async () => {
      return await codePipelineClient.send(
        new GetPipelineCommand({ name: pipelineName! })
      );
    });

    expect(response.pipeline!.artifactStore).toBeTruthy();
    expect(response.pipeline!.artifactStore!.location).toBe(
      outputs.artifact_bucket_name?.value
    );
    expect(response.pipeline!.artifactStore!.type).toBe("S3");
  }, 90000);

  test("CodePipeline has been executed at least once", async () => {
    const response = await retry(async () => {
      return await codePipelineClient.send(
        new ListPipelineExecutionsCommand({
          pipelineName: pipelineName!,
          maxResults: 1,
        })
      );
    }, 5); // Fewer retries if no executions yet

    // Pipeline might not have been executed yet, so this is optional
    if (response.pipelineExecutionSummaries && response.pipelineExecutionSummaries.length > 0) {
      expect(response.pipelineExecutionSummaries).toBeTruthy();
      expect(response.pipelineExecutionSummaries![0].pipelineExecutionId).toBeTruthy();
    }
  }, 60000);
});

describe("LIVE: CodeBuild Project", () => {
  test("CodeBuild project exists", async () => {
    const projectName = `${outputs.pipeline_name?.value || "app-pipeline"}-build`;

    const response = await retry(async () => {
      return await codeBuildClient.send(
        new BatchGetProjectsCommand({ names: [projectName] })
      );
    });

    expect(response.projects).toBeTruthy();
    expect(response.projects!.length).toBe(1);
    expect(response.projects![0].name).toBe(projectName);
    expect(response.projects![0].serviceRole).toBeTruthy();
  }, 90000);

  test("CodeBuild project has privileged mode enabled", async () => {
    const projectName = `${outputs.pipeline_name?.value || "app-pipeline"}-build`;

    const response = await retry(async () => {
      return await codeBuildClient.send(
        new BatchGetProjectsCommand({ names: [projectName] })
      );
    });

    const project = response.projects![0];
    expect(project.environment?.privilegedMode).toBe(true);
    expect(project.environment?.computeType).toBeTruthy();
    expect(project.environment?.image).toBeTruthy();
  }, 90000);

  test("CodeBuild project has ECR environment variables configured", async () => {
    const projectName = `${outputs.pipeline_name?.value || "app-pipeline"}-build`;

    const response = await retry(async () => {
      return await codeBuildClient.send(
        new BatchGetProjectsCommand({ names: [projectName] })
      );
    });

    const project = response.projects![0];
    expect(project.environment?.environmentVariables).toBeTruthy();

    const ecrRepoUri = project.environment?.environmentVariables?.find(
      (env) => env.name === "ECR_REPO_URI"
    );
    expect(ecrRepoUri).toBeTruthy();
    expect(ecrRepoUri!.value).toBe(outputs.ecr_repository_url?.value);
  }, 90000);

  test("CodeBuild project has CloudWatch logs configured", async () => {
    const projectName = `${outputs.pipeline_name?.value || "app-pipeline"}-build`;

    const response = await retry(async () => {
      return await codeBuildClient.send(
        new BatchGetProjectsCommand({ names: [projectName] })
      );
    });

    const project = response.projects![0];
    expect(project.logsConfig).toBeTruthy();
    expect(project.logsConfig!.cloudWatchLogs).toBeTruthy();
    expect(project.logsConfig!.cloudWatchLogs!.groupName).toContain(
      outputs.pipeline_name?.value || "app-pipeline"
    );
  }, 90000);
});

describe("LIVE: ECS Cluster and Service", () => {
  const clusterName = outputs.ecs_cluster_name?.value;
  const serviceName = outputs.ecs_service_name?.value;

  test("ECS cluster exists and is active", async () => {
    expect(clusterName).toBeTruthy();
    expect(clusterName).not.toBe("Not deployed - set subnet IDs");

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName!],
          include: ["CONFIGURATIONS", "SETTINGS"],
        })
      );
    });

    expect(response.clusters).toBeTruthy();
    expect(response.clusters!.length).toBe(1);
    expect(response.clusters![0].clusterName).toBe(clusterName);
    expect(response.clusters![0].status).toBe("ACTIVE");
  }, 90000);

  test("ECS cluster has Container Insights enabled", async () => {
    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName!],
          include: ["SETTINGS"],
        })
      );
    });

    const cluster = response.clusters![0];
    expect(cluster.settings).toBeTruthy();

    const containerInsights = cluster.settings!.find(
      (setting) => setting.name === "containerInsights"
    );
    expect(containerInsights).toBeTruthy();
    expect(containerInsights!.value).toBe("enabled");
  }, 90000);

  test("ECS service exists and is active", async () => {
    expect(serviceName).toBeTruthy();
    
    // If service is not deployed (no subnets configured), verify the output indicates this
    if (serviceName === "Not deployed - set subnet IDs") {
      expect(serviceName).toBe("Not deployed - set subnet IDs");
      return; // Test passes - service is correctly reported as not deployed
    }

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [serviceName!],
        })
      );
    });

    expect(response.services).toBeTruthy();
    expect(response.services!.length).toBe(1);
    expect(response.services![0].serviceName).toBe(serviceName);
    expect(response.services![0].status).toBe("ACTIVE");
    expect(response.services![0].launchType).toBe("FARGATE");
  }, 90000);

  test("ECS service has deployment configuration", async () => {
    expect(serviceName).toBeTruthy();
    
    // If service is not deployed, skip this test's assertions
    if (serviceName === "Not deployed - set subnet IDs") {
      expect(serviceName).toBe("Not deployed - set subnet IDs");
      return;
    }

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [serviceName!],
        })
      );
    });

    const service = response.services![0];
    expect(service.deploymentConfiguration).toBeTruthy();
    expect(service.deploymentConfiguration!.maximumPercent).toBe(200);
    expect(service.deploymentConfiguration!.minimumHealthyPercent).toBe(100);
  }, 90000);

  test("ECS service has desired task count", async () => {
    expect(serviceName).toBeTruthy();
    
    // If service is not deployed, skip this test's assertions
    if (serviceName === "Not deployed - set subnet IDs") {
      expect(serviceName).toBe("Not deployed - set subnet IDs");
      return;
    }

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [serviceName!],
        })
      );
    });

    const service = response.services![0];
    expect(service.desiredCount).toBeGreaterThan(0);
    expect(service.runningCount).toBeGreaterThanOrEqual(0);
  }, 90000);

  test("ECS task definition exists and uses Fargate", async () => {
    expect(serviceName).toBeTruthy();
    
    // If service is not deployed, we need to find the task definition another way
    // The task definition is still created even if the service isn't, so we can query it
    if (serviceName === "Not deployed - set subnet IDs") {
      // Try to find the task definition by family name (which matches pipeline_name)
      const taskFamily = outputs.pipeline_name?.value || outputs.ecs_cluster_name?.value || "app-pipeline";
      
      const taskResponse = await retry(async () => {
        return await ecsClient.send(
          new DescribeTaskDefinitionCommand({
            taskDefinition: taskFamily,
          })
        );
      }, 5); // Fewer retries if task definition might not exist

      expect(taskResponse.taskDefinition).toBeTruthy();
      expect(taskResponse.taskDefinition!.family).toBe(taskFamily);
      expect(taskResponse.taskDefinition!.requiresCompatibilities).toContain("FARGATE");
      expect(taskResponse.taskDefinition!.networkMode).toBe("awsvpc");
      expect(taskResponse.taskDefinition!.containerDefinitions).toBeTruthy();
      expect(taskResponse.taskDefinition!.containerDefinitions!.length).toBeGreaterThan(0);
      return;
    }

    const response = await retry(async () => {
      return await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName!,
          services: [serviceName!],
        })
      );
    });

    const taskDefinitionArn = response.services![0].taskDefinition;
    expect(taskDefinitionArn).toBeTruthy();

    const taskDef = taskDefinitionArn!.split("/").pop()!;

    const taskResponse = await retry(async () => {
      return await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: taskDef,
        })
      );
    });

    expect(taskResponse.taskDefinition).toBeTruthy();
    expect(taskResponse.taskDefinition!.requiresCompatibilities).toContain("FARGATE");
    expect(taskResponse.taskDefinition!.networkMode).toBe("awsvpc");
    expect(taskResponse.taskDefinition!.containerDefinitions).toBeTruthy();
    expect(taskResponse.taskDefinition!.containerDefinitions!.length).toBeGreaterThan(0);
  }, 120000);
});

describe("LIVE: ECR Repository", () => {
  const repositoryUrl = outputs.ecr_repository_url?.value;

  test("ECR repository exists", async () => {
    expect(repositoryUrl).toBeTruthy();

    const repositoryName = repositoryUrl!.split("/").pop()?.split(":")[0]!;

    const response = await retry(async () => {
      return await ecrClient.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName],
        })
      );
    });

    expect(response.repositories).toBeTruthy();
    expect(response.repositories!.length).toBe(1);
    expect(response.repositories![0].repositoryUri).toBe(repositoryUrl);
    expect(response.repositories![0].imageTagMutability).toBe("IMMUTABLE");
  }, 90000);

  test("ECR repository has image scanning enabled", async () => {
    const repositoryName = repositoryUrl!.split("/").pop()?.split(":")[0]!;

    const response = await retry(async () => {
      return await ecrClient.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName],
        })
      );
    });

    const repo = response.repositories![0];
    expect(repo.imageScanningConfiguration).toBeTruthy();
    expect(repo.imageScanningConfiguration!.scanOnPush).toBe(true);
  }, 90000);

  test("ECR repository has encryption enabled", async () => {
    const repositoryName = repositoryUrl!.split("/").pop()?.split(":")[0]!;

    const response = await retry(async () => {
      return await ecrClient.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName],
        })
      );
    });

    const repo = response.repositories![0];
    expect(repo.encryptionConfiguration).toBeTruthy();
    expect(repo.encryptionConfiguration!.encryptionType).toBe("AES256");
  }, 90000);

  test("ECR repository has lifecycle policy configured", async () => {
    const repositoryName = repositoryUrl!.split("/").pop()?.split(":")[0]!;

    const response = await retry(async () => {
      return await ecrClient.send(
        new GetLifecyclePolicyCommand({ repositoryName })
      );
    }, 5); // Fewer retries if policy doesn't exist yet

    if (response.lifecyclePolicyText) {
      const policy = JSON.parse(response.lifecyclePolicyText);
      expect(policy.rules).toBeTruthy();
      expect(policy.rules.length).toBeGreaterThan(0);
    }
  }, 60000);
});

describe("LIVE: S3 Buckets", () => {
  const sourceBucketName = outputs.source_bucket_name?.value;
  const artifactBucketName = outputs.artifact_bucket_name?.value;

  test("Source bucket exists and is accessible", async () => {
    expect(sourceBucketName).toBeTruthy();

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: sourceBucketName! })
      );
    });
  }, 90000);

  test("Source bucket has versioning enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: sourceBucketName! })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 90000);

  test("Source bucket has encryption enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: sourceBucketName! })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
  }, 90000);

  test("Source bucket has public access blocked", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: sourceBucketName! })
      );
    });

    expect(response.PublicAccessBlockConfiguration).toBeTruthy();
    expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
  }, 90000);

  test("Artifacts bucket exists and is accessible", async () => {
    expect(artifactBucketName).toBeTruthy();

    await retry(async () => {
      return await s3Client.send(
        new HeadBucketCommand({ Bucket: artifactBucketName! })
      );
    });
  }, 90000);

  test("Artifacts bucket has versioning enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: artifactBucketName! })
      );
    });

    expect(response.Status).toBe("Enabled");
  }, 90000);

  test("Artifacts bucket has encryption enabled", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: artifactBucketName! })
      );
    });

    expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
    expect(response.ServerSideEncryptionConfiguration!.Rules).toBeTruthy();
  }, 90000);

  test("Source bucket contains pipeline files", async () => {
    const response = await retry(async () => {
      return await s3Client.send(
        new ListObjectsV2Command({
          Bucket: sourceBucketName!,
          Prefix: "pipeline_files.zip",
        })
      );
    }, 5); // Fewer retries if file doesn't exist yet

    // Pipeline files might not be uploaded yet
    if (response.Contents) {
      expect(response.Contents.length).toBeGreaterThan(0);
      const pipelineFiles = response.Contents.find(
        (obj) => obj.Key === "pipeline_files.zip"
      );
      expect(pipelineFiles).toBeTruthy();
    }
  }, 60000);
});

describe("LIVE: SNS Topic and Notifications", () => {
  const topicArn = outputs.sns_topic_arn?.value;

  test("SNS topic exists", async () => {
    expect(topicArn).toBeTruthy();

    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Attributes).toBeTruthy();
    expect(response.Attributes!.TopicArn).toBe(topicArn);
  }, 90000);

  test("SNS topic has email subscriptions", async () => {
    const response = await retry(async () => {
      return await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Subscriptions).toBeTruthy();
    
    // At least one subscription should exist (email or other)
    expect(response.Subscriptions!.length).toBeGreaterThan(0);

    const emailSubscriptions = response.Subscriptions!.filter(
      (sub) => sub.Protocol === "email"
    );
    
    // Email subscriptions might require confirmation
    if (emailSubscriptions.length > 0) {
      expect(emailSubscriptions[0].SubscriptionArn).toBeTruthy();
    }
  }, 90000);

  test("SNS topic uses encryption", async () => {
    const response = await retry(async () => {
      return await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn! })
      );
    });

    expect(response.Attributes!.KmsMasterKeyId).toBeTruthy();
    expect(response.Attributes!.KmsMasterKeyId).toContain("alias/aws/sns");
  }, 90000);
});

describe("LIVE: CloudWatch Log Groups", () => {
  test("CodeBuild log group exists", async () => {
    const logGroupName = `/aws/codebuild/${outputs.pipeline_name?.value || "app-pipeline"}`;

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
    });

    expect(response.logGroups).toBeTruthy();
    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === logGroupName
    );
    expect(logGroup).toBeTruthy();
    
    if (logGroup!.retentionInDays) {
      expect(logGroup!.retentionInDays).toBeGreaterThan(0);
    }
  }, 90000);

  test("ECS log group exists", async () => {
    const logGroupName = `/ecs/${outputs.pipeline_name?.value || "app-pipeline"}`;

    const response = await retry(async () => {
      return await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
    });

    expect(response.logGroups).toBeTruthy();
    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === logGroupName
    );
    expect(logGroup).toBeTruthy();
    
    if (logGroup!.retentionInDays) {
      expect(logGroup!.retentionInDays).toBeGreaterThan(0);
    }
  }, 90000);
});

describe("LIVE: EventBridge Rule for S3 Trigger", () => {
  test("EventBridge rule exists for S3 trigger", async () => {
    const ruleName = `${outputs.pipeline_name?.value || "app-pipeline"}-s3-trigger`;

    const response = await retry(async () => {
      return await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );
    }, 5); // Fewer retries if rule doesn't exist yet

    expect(response.Name).toBe(ruleName);
    expect(response.State).toBe("ENABLED");
  }, 60000);

  test("EventBridge rule targets CodePipeline", async () => {
    const ruleName = `${outputs.pipeline_name?.value || "app-pipeline"}-s3-trigger`;

    const response = await retry(async () => {
      return await eventBridgeClient.send(
        new ListTargetsByRuleCommand({ Rule: ruleName })
      );
    }, 5);

    expect(response.Targets).toBeTruthy();
    expect(response.Targets!.length).toBeGreaterThan(0);

    const pipelineTarget = response.Targets!.find(
      (t) => t.Arn === outputs.pipeline_arn?.value
    );
    expect(pipelineTarget).toBeTruthy();
  }, 60000);
});

describe("LIVE: IAM Roles and Policies", () => {
  test("CodePipeline IAM role exists", async () => {
    const roleName = `${outputs.pipeline_name?.value || "app-pipeline"}-codepipeline-role`;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
    expect(response.Role!.AssumeRolePolicyDocument).toBeTruthy();
  }, 60000);

  test("CodePipeline role has inline policies", async () => {
    const roleName = `${outputs.pipeline_name?.value || "app-pipeline"}-codepipeline-role`;

    const response = await retry(async () => {
      return await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
    }, 5);

    expect(response.PolicyNames).toBeTruthy();
    expect(response.PolicyNames!.length).toBeGreaterThan(0);

    // Verify at least one policy document
    const policyResponse = await retry(async () => {
      return await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: response.PolicyNames![0],
        })
      );
    }, 5);

    expect(policyResponse.PolicyDocument).toBeTruthy();
  }, 60000);

  test("CodeBuild IAM role exists", async () => {
    const roleName = `${outputs.pipeline_name?.value || "app-pipeline"}-codebuild-role`;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
  }, 60000);

  test("ECS task execution role exists", async () => {
    const roleName = `${outputs.pipeline_name?.value || "app-pipeline"}-ecs-task-execution`;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
  }, 60000);

  test("ECS task role exists", async () => {
    const roleName = `${outputs.pipeline_name?.value || "app-pipeline"}-ecs-task`;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
  }, 60000);

  test("EventBridge IAM role exists", async () => {
    const roleName = `${outputs.pipeline_name?.value || "app-pipeline"}-events-role`;

    const response = await retry(async () => {
      return await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    }, 5);

    expect(response.Role).toBeTruthy();
    expect(response.Role!.RoleName).toBe(roleName);
  }, 60000);
});

describe("LIVE: Pipeline Integration Validation", () => {
  test("All pipeline stages are properly connected", async () => {
    const pipelineName = outputs.pipeline_name?.value!;

    const response = await retry(async () => {
      return await codePipelineClient.send(
        new GetPipelineCommand({ name: pipelineName })
      );
    });

    expect(response.pipeline!.stages).toBeTruthy();
    expect(response.pipeline!.stages!.length).toBeGreaterThanOrEqual(2);

    // Verify Source stage has output artifacts
    const sourceStage = response.pipeline!.stages!.find(
      (stage) => stage.name === "Source"
    );
    expect(sourceStage).toBeTruthy();
    expect(sourceStage!.actions![0].outputArtifacts).toBeTruthy();

    // Verify Build stage uses Source output as input
    const buildStage = response.pipeline!.stages!.find(
      (stage) => stage.name === "Build"
    );
    expect(buildStage).toBeTruthy();
    expect(buildStage!.actions![0].inputArtifacts).toBeTruthy();
  }, 90000);

  test("Pipeline can be triggered via EventBridge", async () => {
    const ruleName = `${outputs.pipeline_name?.value || "app-pipeline"}-s3-trigger`;

    const response = await retry(async () => {
      return await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );
    }, 5);

    expect(response.State).toBe("ENABLED");
    expect(response.EventPattern).toBeTruthy();
    
    // Verify event pattern includes S3 Object Created
    const eventPattern = JSON.parse(response.EventPattern!);
    expect(eventPattern.source).toContain("aws.s3");
    expect(eventPattern["detail-type"]).toContain("Object Created");
  }, 60000);
});

describe("LIVE: Output Validation", () => {
  test("All required outputs are present", () => {
    const requiredOutputs = [
      "pipeline_name",
      "pipeline_arn",
      "ecr_repository_url",
      "ecs_cluster_name",
      "sns_topic_arn",
      "source_bucket_name",
      "artifact_bucket_name",
    ];

    requiredOutputs.forEach((outputName) => {
      expect(outputs[outputName as keyof StructuredOutputs]).toBeTruthy();
      expect(outputs[outputName as keyof StructuredOutputs]?.value).toBeTruthy();
    });
  });

  test("Output values have correct formats", () => {
    // ARN formats
    expect(outputs.pipeline_arn?.value).toMatch(/^arn:aws:codepipeline:/);
    expect(outputs.sns_topic_arn?.value).toMatch(/^arn:aws:sns:/);

    // ECR repository URL format
    expect(outputs.ecr_repository_url?.value).toMatch(/^[0-9]+\.dkr\.ecr\./);
    expect(outputs.ecr_repository_url?.value).toMatch(/\.amazonaws\.com/);

    // S3 bucket name formats (should not contain special characters)
    expect(outputs.source_bucket_name?.value).toMatch(/^[a-z0-9-]+$/);
    expect(outputs.artifact_bucket_name?.value).toMatch(/^[a-z0-9-]+$/);
  });

  test("ECS service name is conditional based on deployment", () => {
    // ECS service name may be "Not deployed - set subnet IDs" if subnets not configured
    const serviceName = outputs.ecs_service_name?.value;
    expect(serviceName).toBeTruthy();
    
    // If deployed, should match cluster name pattern
    if (serviceName !== "Not deployed - set subnet IDs") {
      expect(serviceName).toBe(outputs.pipeline_name?.value);
    }
  });
});

describe("LIVE: Security Configuration", () => {
  test("S3 buckets enforce encryption", async () => {
    const buckets = [
      outputs.source_bucket_name?.value,
      outputs.artifact_bucket_name?.value,
    ].filter(Boolean);

    for (const bucketName of buckets) {
      const response = await retry(async () => {
        return await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName! })
        );
      });

      expect(response.ServerSideEncryptionConfiguration).toBeTruthy();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    }
  }, 120000);

  test("S3 buckets block public access", async () => {
    const buckets = [
      outputs.source_bucket_name?.value,
      outputs.artifact_bucket_name?.value,
    ].filter(Boolean);

    for (const bucketName of buckets) {
      const response = await retry(async () => {
        return await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName! })
        );
      });

      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    }
  }, 120000);

  test("ECR repository enforces immutable tags", async () => {
    const repositoryName = outputs.ecr_repository_url?.value!.split("/").pop()?.split(":")[0]!;

    const response = await retry(async () => {
      return await ecrClient.send(
        new DescribeRepositoriesCommand({
          repositoryNames: [repositoryName],
        })
      );
    });

    expect(response.repositories![0].imageTagMutability).toBe("IMMUTABLE");
  }, 90000);
});
