# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This document contains the complete Pulumi TypeScript infrastructure code for provisioning a CI/CD pipeline for a Node.js application.

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: nodejs
description: Pulumi infrastructure for CI/CD Pipeline
main: bin/tap.ts
```

## File: bin/tap.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const stack = new TapStack("tap-stack", {
  environmentSuffix,
});

export const artifactBucketName = stack.artifactBucketName;
export const deployBucketName = stack.deployBucketName;
export const codeBuildProjectName = stack.codeBuildProjectName;
export const codePipelineName = stack.codePipelineName;
export const codeBuildLogGroupName = stack.codeBuildLogGroupName;
export const codeBuildRoleArn = stack.codeBuildRoleArn;
export const codePipelineRoleArn = stack.codePipelineRoleArn;
export const eventRuleArn = stack.eventRuleArn;
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly deployBucketName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly codePipelineName: pulumi.Output<string>;
  public readonly codeBuildLogGroupName: pulumi.Output<string>;
  public readonly codeBuildRoleArn: pulumi.Output<string>;
  public readonly codePipelineRoleArn: pulumi.Output<string>;
  public readonly eventRuleArn: pulumi.Output<string>;

  constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:resource:TapStack", name, {}, opts);

    const { environmentSuffix } = props;
    const region = aws.getRegionOutput().name;
    const accountId = aws.getCallerIdentityOutput().accountId;

    const tags = {
      Environment: "production",
      ManagedBy: "pulumi",
    };

    // S3 Bucket for Build Artifacts
    const artifactBucket = new aws.s3.Bucket(
      `artifact-bucket-${environmentSuffix}`,
      {
        bucket: `artifact-bucket-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        },
        lifecycleRules: [
          {
            id: "delete-old-artifacts",
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // S3 Bucket for Deployment
    const deployBucket = new aws.s3.Bucket(
      `deploy-bucket-${environmentSuffix}`,
      {
        bucket: `deploy-bucket-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        },
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-log-group-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "codebuild.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        name: `codebuild-policy-${environmentSuffix}`,
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn, deployBucket.arn, codeBuildLogGroup.arn]).apply(
          ([artifactBucketArn, deployBucketArn, logGroupArn]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                  ],
                  Resource: [
                    logGroupArn,
                    `${logGroupArn}:*`,
                  ],
                },
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                  ],
                  Resource: [
                    `${artifactBucketArn}/*`,
                    `${deployBucketArn}/*`,
                  ],
                },
                {
                  Effect: "Allow",
                  Action: [
                    "s3:ListBucket",
                  ],
                  Resource: [
                    artifactBucketArn,
                    deployBucketArn,
                  ],
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(
      `nodejs-build-${environmentSuffix}`,
      {
        name: `nodejs-build-${environmentSuffix}`,
        description: "CodeBuild project for Node.js application",
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: "CODEPIPELINE",
        },
        environment: {
          computeType: "BUILD_GENERAL1_SMALL",
          image: "aws/codebuild/standard:5.0",
          type: "LINUX_CONTAINER",
          environmentVariables: [
            {
              name: "NODE_ENV",
              value: "production",
              type: "PLAINTEXT",
            },
            {
              name: "BUILD_NUMBER",
              value: "#{CODEBUILD_BUILD_NUMBER}",
              type: "PLAINTEXT",
            },
          ],
        },
        source: {
          type: "CODEPIPELINE",
          buildspec: `version: 0.2

phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Building Node.js application..."
      - npm run build || echo "No build script found"
      - echo "Build completed on \`date\`"
  post_build:
    commands:
      - echo "Creating artifact..."

artifacts:
  files:
    - '**/*'
  name: BuildArtifact
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: codeBuildLogGroup.name,
            status: "ENABLED",
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM Role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
      {
        name: `codepipeline-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "codepipeline.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        name: `codepipeline-policy-${environmentSuffix}`,
        role: codePipelineRole.id,
        policy: pulumi.all([
          artifactBucket.arn,
          deployBucket.arn,
          codeBuildProject.arn,
        ]).apply(
          ([artifactBucketArn, deployBucketArn, codeBuildArn]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:GetBucketLocation",
                    "s3:ListBucket",
                  ],
                  Resource: [
                    artifactBucketArn,
                    `${artifactBucketArn}/*`,
                    deployBucketArn,
                    `${deployBucketArn}/*`,
                  ],
                },
                {
                  Effect: "Allow",
                  Action: [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild",
                  ],
                  Resource: codeBuildArn,
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // CodePipeline
    const codePipeline = new aws.codepipeline.Pipeline(
      `nodejs-pipeline-${environmentSuffix}`,
      {
        name: `nodejs-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStore: {
          location: artifactBucket.bucket,
          type: "S3",
        },
        stages: [
          {
            name: "Source",
            actions: [
              {
                name: "Source",
                category: "Source",
                owner: "AWS",
                provider: "S3",
                version: "1",
                outputArtifacts: ["SourceOutput"],
                configuration: {
                  S3Bucket: artifactBucket.bucket,
                  S3ObjectKey: "source.zip",
                  PollForSourceChanges: "false",
                },
              },
            ],
          },
          {
            name: "Build",
            actions: [
              {
                name: "Build",
                category: "Build",
                owner: "AWS",
                provider: "CodeBuild",
                version: "1",
                inputArtifacts: ["SourceOutput"],
                outputArtifacts: ["BuildOutput"],
                configuration: {
                  ProjectName: codeBuildProject.name,
                },
              },
            ],
          },
          {
            name: "Deploy",
            actions: [
              {
                name: "Deploy",
                category: "Deploy",
                owner: "AWS",
                provider: "S3",
                version: "1",
                inputArtifacts: ["BuildOutput"],
                configuration: {
                  BucketName: deployBucket.bucket,
                  Extract: "true",
                },
              },
            ],
          },
        ],
        tags: tags,
      },
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // IAM Role for EventBridge
    const eventBridgeRole = new aws.iam.Role(
      `eventbridge-role-${environmentSuffix}`,
      {
        name: `eventbridge-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "events.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for EventBridge to trigger CodePipeline
    const eventBridgePolicy = new aws.iam.RolePolicy(
      `eventbridge-policy-${environmentSuffix}`,
      {
        name: `eventbridge-policy-${environmentSuffix}`,
        role: eventBridgeRole.id,
        policy: codePipeline.arn.apply((pipelineArn) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: "codepipeline:StartPipelineExecution",
                Resource: pipelineArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // EventBridge Rule for S3 Object Creation (Pipeline Trigger)
    const s3TriggerRule = new aws.cloudwatch.EventRule(
      `s3-trigger-rule-${environmentSuffix}`,
      {
        name: `s3-trigger-rule-${environmentSuffix}`,
        description: "Trigger pipeline when source artifact is uploaded",
        eventPattern: artifactBucket.bucket.apply((bucketName) =>
          JSON.stringify({
            source: ["aws.s3"],
            "detail-type": ["Object Created"],
            detail: {
              bucket: {
                name: [bucketName],
              },
              object: {
                key: [{ prefix: "source" }],
              },
            },
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge Target for Pipeline Trigger
    const s3TriggerTarget = new aws.cloudwatch.EventTarget(
      `s3-trigger-target-${environmentSuffix}`,
      {
        rule: s3TriggerRule.name,
        arn: codePipeline.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this, dependsOn: [eventBridgePolicy] }
    );

    // EventBridge Rule for Build Failures
    const buildFailureRule = new aws.cloudwatch.EventRule(
      `build-failure-rule-${environmentSuffix}`,
      {
        name: `build-failure-rule-${environmentSuffix}`,
        description: "Capture CodeBuild build failures",
        eventPattern: codeBuildProject.name.apply((projectName) =>
          JSON.stringify({
            source: ["aws.codebuild"],
            "detail-type": ["CodeBuild Build State Change"],
            detail: {
              "build-status": ["FAILED"],
              "project-name": [projectName],
            },
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Build Failure Events
    const buildFailureLogGroup = new aws.cloudwatch.LogGroup(
      `build-failure-log-group-${environmentSuffix}`,
      {
        name: `/aws/events/codebuild-failures-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge Target for Build Failures (Log to CloudWatch)
    const buildFailureTarget = new aws.cloudwatch.EventTarget(
      `build-failure-target-${environmentSuffix}`,
      {
        rule: buildFailureRule.name,
        arn: buildFailureLogGroup.arn.apply((arn) => arn.replace(":*", "")),
      },
      { parent: this }
    );

    // Enable EventBridge notifications for S3 bucket
    const bucketNotification = new aws.s3.BucketNotification(
      `artifact-bucket-notification-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        eventbridge: true,
      },
      { parent: this }
    );

    // Exports
    this.artifactBucketName = artifactBucket.bucket;
    this.deployBucketName = deployBucket.bucket;
    this.codeBuildProjectName = codeBuildProject.name;
    this.codePipelineName = codePipeline.name;
    this.codeBuildLogGroupName = codeBuildLogGroup.name;
    this.codeBuildRoleArn = codeBuildRole.arn;
    this.codePipelineRoleArn = codePipelineRole.arn;
    this.eventRuleArn = buildFailureRule.arn;

    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      deployBucketName: this.deployBucketName,
      codeBuildProjectName: this.codeBuildProjectName,
      codePipelineName: this.codePipelineName,
      codeBuildLogGroupName: this.codeBuildLogGroupName,
      codeBuildRoleArn: this.codeBuildRoleArn,
      codePipelineRoleArn: this.codePipelineRoleArn,
      eventRuleArn: this.eventRuleArn,
    });
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program provisions a complete CI/CD pipeline for a Node.js application on AWS.

## Architecture Overview

The infrastructure includes:

1. **S3 Buckets**
   - Artifact bucket with versioning and lifecycle rules (30-day expiration)
   - Deployment bucket with versioning
   - Both encrypted with AWS managed keys (AES256)

2. **CodeBuild Project**
   - Uses `aws/codebuild/standard:5.0` image
   - Environment variables: `NODE_ENV=production`, `BUILD_NUMBER`
   - Integrated with CloudWatch Logs (7-day retention)

3. **CodePipeline**
   - Three stages: Source (S3) → Build (CodeBuild) → Deploy (S3)
   - Automatically triggered on source artifact upload

4. **IAM Roles & Policies**
   - Least-privilege policies for CodeBuild and CodePipeline
   - EventBridge role for pipeline triggering

5. **CloudWatch & EventBridge**
   - Build failure notifications
   - S3 event-based pipeline triggering
   - Centralized logging with 7-day retention

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 20+ and npm installed
- AWS account with permissions for S3, CodeBuild, CodePipeline, IAM, CloudWatch, EventBridge

## Configuration

The infrastructure requires an `environmentSuffix` configuration parameter for resource naming:

```bash
pulumi config set environmentSuffix <your-suffix>
```

## Deployment

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set configuration**:
   ```bash
   pulumi config set environmentSuffix dev
   pulumi config set aws:region us-east-1
   ```

3. **Preview changes**:
   ```bash
   pulumi preview
   ```

4. **Deploy infrastructure**:
   ```bash
   pulumi up
   ```

## Testing the Pipeline

1. **Upload source artifact**:
   ```bash
   # Create a sample Node.js app
   mkdir sample-app && cd sample-app
   npm init -y
   echo "console.log('Hello from CI/CD');" > index.js

   # Create zip
   zip -r ../source.zip .
   cd ..

   # Upload to artifact bucket (triggers pipeline)
   aws s3 cp source.zip s3://artifact-bucket-<environmentSuffix>/source.zip
   ```

2. **Monitor pipeline**:
   ```bash
   aws codepipeline get-pipeline-state --name nodejs-pipeline-<environmentSuffix>
   ```

3. **Check build logs**:
   ```bash
   aws logs tail /aws/codebuild/nodejs-build-<environmentSuffix> --follow
   ```

4. **Verify deployment**:
   ```bash
   aws s3 ls s3://deploy-bucket-<environmentSuffix>/
   ```

## Resource Naming

All resources include the `environmentSuffix` parameter in their names:
- S3 Buckets: `artifact-bucket-${environmentSuffix}`, `deploy-bucket-${environmentSuffix}`
- CodeBuild Project: `nodejs-build-${environmentSuffix}`
- CodePipeline: `nodejs-pipeline-${environmentSuffix}`
- IAM Roles: `codebuild-role-${environmentSuffix}`, `codepipeline-role-${environmentSuffix}`
- CloudWatch Log Groups: `/aws/codebuild/nodejs-build-${environmentSuffix}`

## Outputs

The stack exports the following outputs:

- `artifactBucketName`: Name of the artifact storage bucket
- `deployBucketName`: Name of the deployment bucket
- `codeBuildProjectName`: Name of the CodeBuild project
- `codePipelineName`: Name of the CodePipeline
- `codeBuildLogGroupName`: CloudWatch log group for builds
- `codeBuildRoleArn`: ARN of CodeBuild IAM role
- `codePipelineRoleArn`: ARN of CodePipeline IAM role
- `eventRuleArn`: ARN of build failure event rule

## Security Features

- **Encryption**: All S3 buckets use server-side encryption (AES256)
- **Least Privilege**: IAM policies grant minimal required permissions
- **Logging**: Comprehensive CloudWatch logging with retention policies
- **Monitoring**: EventBridge rules for build failures and automated notifications

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Tags

All resources are tagged with:
- `Environment: production`
- `ManagedBy: pulumi`
```
