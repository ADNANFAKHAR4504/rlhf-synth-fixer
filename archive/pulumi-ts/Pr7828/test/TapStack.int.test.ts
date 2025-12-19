import { execSync } from "child_process";
import * as AWS from "aws-sdk";
import * as fs from "fs";
import * as path from "path";

/**
 * Integration tests for CI/CD Pipeline Infrastructure
 *
 * These tests verify that the actual AWS resources are created correctly
 * and can interact with each other as expected.
 */

describe("CI/CD Pipeline Integration Tests", () => {
    let stackOutputs: Record<string, string>;
    let s3Client: AWS.S3;
    let ecrClient: AWS.ECR;
    let codeBuildClient: AWS.CodeBuild;
    let codePipelineClient: AWS.CodePipeline;
    let cloudWatchLogsClient: AWS.CloudWatchLogs;
    let iamClient: AWS.IAM;

    const region = process.env.AWS_REGION || "us-east-1";

    beforeAll(() => {
        // Get the actual environment suffix from deployment
        let environmentSuffix = "dev";

        try {
            // Try to get stack name from Pulumi
            const stackInfo = execSync("pulumi stack --show-name 2>/dev/null || echo 'dev'", {
                encoding: "utf-8",
                cwd: path.join(__dirname, "..")
            }).trim();
            environmentSuffix = stackInfo || "dev";
        } catch (error) {
            console.log("Using default environment suffix: dev");
        }

        // Read stack outputs from Pulumi
        try {
            const outputJson = execSync("pulumi stack output --json 2>/dev/null || echo '{}'", {
                encoding: "utf-8",
                cwd: path.join(__dirname, "..")
            });
            stackOutputs = JSON.parse(outputJson);
        } catch (error) {
            console.error("Failed to get stack outputs:", error);
            stackOutputs = {};
        }

        // Initialize AWS clients
        s3Client = new AWS.S3({ region });
        ecrClient = new AWS.ECR({ region });
        codeBuildClient = new AWS.CodeBuild({ region });
        codePipelineClient = new AWS.CodePipeline({ region });
        cloudWatchLogsClient = new AWS.CloudWatchLogs({ region });
        iamClient = new AWS.IAM({ region });
    });

    describe("S3 Artifact Bucket", () => {
        it("should exist with correct configuration", async () => {
            const bucketName = stackOutputs.artifactBucketName;
            expect(bucketName).toBeDefined();

            const response = await s3Client.getBucketVersioning({ Bucket: bucketName }).promise();
            expect(response.Status).toBe("Enabled");
        });

        it("should have encryption enabled", async () => {
            const bucketName = stackOutputs.artifactBucketName;

            const response = await s3Client.getBucketEncryption({ Bucket: bucketName }).promise();
            expect(response.ServerSideEncryptionConfiguration).toBeDefined();
            expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
        });

        it("should block public access", async () => {
            const bucketName = stackOutputs.artifactBucketName;

            const response = await s3Client.getPublicAccessBlock({ Bucket: bucketName }).promise();
            expect(response.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
            expect(response.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
            expect(response.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
            expect(response.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
        });

        it("should have lifecycle policy configured", async () => {
            const bucketName = stackOutputs.artifactBucketName;

            const response = await s3Client.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
            expect(response.Rules).toBeDefined();
            expect(response.Rules.length).toBeGreaterThan(0);
        });
    });

    describe("ECR Repository", () => {
        it("should exist with correct name", async () => {
            const repoName = stackOutputs.ecrRepositoryName;
            expect(repoName).toBeDefined();

            const response = await ecrClient.describeRepositories({
                repositoryNames: [repoName]
            }).promise();

            expect(response.repositories).toHaveLength(1);
            expect(response.repositories[0].repositoryName).toBe(repoName);
        });

        it("should have image scanning enabled", async () => {
            const repoName = stackOutputs.ecrRepositoryName;

            const response = await ecrClient.describeRepositories({
                repositoryNames: [repoName]
            }).promise();

            expect(response.repositories[0].imageScanningConfiguration.scanOnPush).toBe(true);
        });

        it("should have lifecycle policy", async () => {
            const repoName = stackOutputs.ecrRepositoryName;

            const response = await ecrClient.getLifecyclePolicy({
                repositoryName: repoName
            }).promise();

            expect(response.lifecyclePolicyText).toBeDefined();
            const policy = JSON.parse(response.lifecyclePolicyText);
            expect(policy.rules).toBeDefined();
        });

        it("should be accessible via repository URL", async () => {
            const repoUrl = stackOutputs.ecrRepositoryUrl;
            expect(repoUrl).toBeDefined();
            expect(repoUrl).toContain(".dkr.ecr.");
            expect(repoUrl).toContain(".amazonaws.com/");
        });
    });

    describe("CodeBuild Project", () => {
        it("should exist with correct configuration", async () => {
            const projectName = stackOutputs.codeBuildProjectName;
            expect(projectName).toBeDefined();

            const response = await codeBuildClient.batchGetProjects({
                names: [projectName]
            }).promise();

            expect(response.projects).toHaveLength(1);
            expect(response.projects[0].name).toBe(projectName);
        });

        it("should have correct service role", async () => {
            const projectName = stackOutputs.codeBuildProjectName;

            const response = await codeBuildClient.batchGetProjects({
                names: [projectName]
            }).promise();

            const serviceRole = response.projects[0].serviceRole;
            expect(serviceRole).toBeDefined();
            expect(serviceRole).toContain("tap-codebuild-role-");
        });

        it("should have environment variables configured", async () => {
            const projectName = stackOutputs.codeBuildProjectName;

            const response = await codeBuildClient.batchGetProjects({
                names: [projectName]
            }).promise();

            const envVars = response.projects[0].environment.environmentVariables;
            expect(envVars).toBeDefined();
            expect(envVars.length).toBeGreaterThan(0);

            const varNames = envVars.map(v => v.name);
            expect(varNames).toContain("AWS_DEFAULT_REGION");
            expect(varNames).toContain("AWS_ACCOUNT_ID");
            expect(varNames).toContain("IMAGE_REPO_NAME");
        });

        it("should have CloudWatch logs configured", async () => {
            const projectName = stackOutputs.codeBuildProjectName;

            const response = await codeBuildClient.batchGetProjects({
                names: [projectName]
            }).promise();

            expect(response.projects[0].logsConfig.cloudWatchLogs.status).toBe("ENABLED");
        });
    });

    describe("CodePipeline", () => {
        it("should exist with correct stages", async () => {
            const pipelineName = stackOutputs.codePipelineName;
            expect(pipelineName).toBeDefined();

            const response = await codePipelineClient.getPipeline({
                name: pipelineName
            }).promise();

            expect(response.pipeline.stages).toBeDefined();
            expect(response.pipeline.stages.length).toBeGreaterThanOrEqual(2);

            const stageNames = response.pipeline.stages.map(s => s.name);
            expect(stageNames).toContain("Source");
            expect(stageNames).toContain("Build");
        });

        it("should use correct artifact store", async () => {
            const pipelineName = stackOutputs.codePipelineName;
            const bucketName = stackOutputs.artifactBucketName;

            const response = await codePipelineClient.getPipeline({
                name: pipelineName
            }).promise();

            expect(response.pipeline.artifactStore.type).toBe("S3");
            expect(response.pipeline.artifactStore.location).toBe(bucketName);
        });

        it("should have correct service role", async () => {
            const pipelineName = stackOutputs.codePipelineName;

            const response = await codePipelineClient.getPipeline({
                name: pipelineName
            }).promise();

            const roleArn = response.pipeline.roleArn;
            expect(roleArn).toBeDefined();
            expect(roleArn).toContain("tap-codepipeline-role-");
        });

        it("should reference CodeBuild project", async () => {
            const pipelineName = stackOutputs.codePipelineName;
            const projectName = stackOutputs.codeBuildProjectName;

            const response = await codePipelineClient.getPipeline({
                name: pipelineName
            }).promise();

            const buildStage = response.pipeline.stages.find(s => s.name === "Build");
            expect(buildStage).toBeDefined();

            const buildAction = buildStage.actions[0];
            expect(buildAction.configuration.ProjectName).toBe(projectName);
        });
    });

    describe("IAM Roles and Permissions", () => {
        it("should have CodeBuild role with correct trust policy", async () => {
            const roleArn = stackOutputs.codeBuildRoleArn;
            const roleName = roleArn.split("/").pop();

            const response = await iamClient.getRole({ RoleName: roleName }).promise();
            expect(response.Role).toBeDefined();

            const trustPolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
            expect(trustPolicy.Statement[0].Principal.Service).toContain("codebuild.amazonaws.com");
        });

        it("should have CodePipeline role with correct trust policy", async () => {
            const roleArn = stackOutputs.codePipelineRoleArn;
            const roleName = roleArn.split("/").pop();

            const response = await iamClient.getRole({ RoleName: roleName }).promise();
            expect(response.Role).toBeDefined();

            const trustPolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
            expect(trustPolicy.Statement[0].Principal.Service).toContain("codepipeline.amazonaws.com");
        });

        it("should have CodeBuild policies attached", async () => {
            const roleArn = stackOutputs.codeBuildRoleArn;
            const roleName = roleArn.split("/").pop();

            const response = await iamClient.listRolePolicies({ RoleName: roleName }).promise();
            expect(response.PolicyNames.length).toBeGreaterThan(0);
        });

        it("should have CodePipeline policies attached", async () => {
            const roleArn = stackOutputs.codePipelineRoleArn;
            const roleName = roleArn.split("/").pop();

            const response = await iamClient.listRolePolicies({ RoleName: roleName }).promise();
            expect(response.PolicyNames.length).toBeGreaterThan(0);
        });
    });

    describe("CloudWatch Logging", () => {
        it("should have CodeBuild log group", async () => {
            const logGroupName = stackOutputs.codeBuildLogGroupName;
            expect(logGroupName).toBeDefined();

            const response = await cloudWatchLogsClient.describeLogGroups({
                logGroupNamePrefix: logGroupName
            }).promise();

            expect(response.logGroups).toBeDefined();
            expect(response.logGroups.length).toBeGreaterThan(0);
        });

        it("should have CodePipeline log group", async () => {
            const logGroupName = stackOutputs.pipelineLogGroupName;
            expect(logGroupName).toBeDefined();

            const response = await cloudWatchLogsClient.describeLogGroups({
                logGroupNamePrefix: logGroupName
            }).promise();

            expect(response.logGroups).toBeDefined();
            expect(response.logGroups.length).toBeGreaterThan(0);
        });

        it("should have log retention configured", async () => {
            const logGroupName = stackOutputs.codeBuildLogGroupName;

            const response = await cloudWatchLogsClient.describeLogGroups({
                logGroupNamePrefix: logGroupName
            }).promise();

            expect(response.logGroups[0].retentionInDays).toBe(30);
        });
    });

    describe("Resource Integration", () => {
        it("should allow CodeBuild to access S3 bucket", async () => {
            const bucketName = stackOutputs.artifactBucketName;
            const roleArn = stackOutputs.codeBuildRoleArn;
            const roleName = roleArn.split("/").pop();

            const policies = await iamClient.listRolePolicies({ RoleName: roleName }).promise();
            expect(policies.PolicyNames.length).toBeGreaterThan(0);

            // Get the policy document
            const policyName = policies.PolicyNames[0];
            const policy = await iamClient.getRolePolicy({
                RoleName: roleName,
                PolicyName: policyName
            }).promise();

            const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument));
            const s3Actions = policyDoc.Statement.find(s =>
                s.Action.some(a => a.includes("s3:"))
            );
            expect(s3Actions).toBeDefined();
        });

        it("should allow CodeBuild to access ECR", async () => {
            const roleArn = stackOutputs.codeBuildRoleArn;
            const roleName = roleArn.split("/").pop();

            const policies = await iamClient.listRolePolicies({ RoleName: roleName }).promise();
            const policyName = policies.PolicyNames[0];
            const policy = await iamClient.getRolePolicy({
                RoleName: roleName,
                PolicyName: policyName
            }).promise();

            const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument));
            const ecrActions = policyDoc.Statement.find(s =>
                s.Action.some(a => a.includes("ecr:"))
            );
            expect(ecrActions).toBeDefined();
        });

        it("should allow CodePipeline to trigger CodeBuild", async () => {
            const roleArn = stackOutputs.codePipelineRoleArn;
            const roleName = roleArn.split("/").pop();

            const policies = await iamClient.listRolePolicies({ RoleName: roleName }).promise();
            const policyName = policies.PolicyNames[0];
            const policy = await iamClient.getRolePolicy({
                RoleName: roleName,
                PolicyName: policyName
            }).promise();

            const policyDoc = JSON.parse(decodeURIComponent(policy.PolicyDocument));
            const codeBuildActions = policyDoc.Statement.find(s =>
                s.Action.some(a => a.includes("codebuild:"))
            );
            expect(codeBuildActions).toBeDefined();
        });
    });

    describe("Stack Outputs", () => {
        it("should export all required outputs", () => {
            expect(stackOutputs.artifactBucketName).toBeDefined();
            expect(stackOutputs.artifactBucketArn).toBeDefined();
            expect(stackOutputs.ecrRepositoryUrl).toBeDefined();
            expect(stackOutputs.ecrRepositoryName).toBeDefined();
            expect(stackOutputs.ecrRepositoryArn).toBeDefined();
            expect(stackOutputs.codeBuildProjectName).toBeDefined();
            expect(stackOutputs.codeBuildProjectArn).toBeDefined();
            expect(stackOutputs.codeBuildRoleArn).toBeDefined();
            expect(stackOutputs.codePipelineName).toBeDefined();
            expect(stackOutputs.codePipelineArn).toBeDefined();
            expect(stackOutputs.codePipelineRoleArn).toBeDefined();
            expect(stackOutputs.codeBuildLogGroupName).toBeDefined();
            expect(stackOutputs.pipelineLogGroupName).toBeDefined();
        });

        it("should have valid ARN formats", () => {
            expect(stackOutputs.artifactBucketArn).toMatch(/^arn:aws:s3:::.+/);
            expect(stackOutputs.ecrRepositoryArn).toMatch(/^arn:aws:ecr:.+/);
            expect(stackOutputs.codeBuildProjectArn).toMatch(/^arn:aws:codebuild:.+/);
            expect(stackOutputs.codePipelineArn).toMatch(/^arn:aws:codepipeline:.+/);
            expect(stackOutputs.codeBuildRoleArn).toMatch(/^arn:aws:iam::.+/);
            expect(stackOutputs.codePipelineRoleArn).toMatch(/^arn:aws:iam::.+/);
        });
    });
});
