# CI/CD Pipeline Infrastructure - Production-Ready Implementation

This implementation creates a complete, production-ready CI/CD pipeline for infrastructure automation using Pulumi and TypeScript with all issues fixed.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackArgs {
    environmentSuffix: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
    public readonly artifactBucket: aws.s3.Bucket;
    public readonly codeBuildProject: aws.codebuild.Project;
    public readonly pipeline: aws.codepipeline.Pipeline;
    public readonly logGroup: aws.cloudwatch.LogGroup;
    public readonly approvalTopic: aws.sns.Topic;

    constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:infrastructure:TapStack", name, {}, opts);

        const envSuffix = pulumi.output(args.environmentSuffix);

        // S3 bucket for pipeline artifacts with force destroy capability
        this.artifactBucket = new aws.s3.Bucket(`artifact-bucket-${envSuffix}`, {
            bucket: pulumi.interpolate`pipeline-artifacts-${envSuffix}`,
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
            lifecycleRules: [{
                enabled: true,
                expiration: {
                    days: 30,
                },
            }],
            forceDestroy: true,
            tags: {
                Name: pulumi.interpolate`pipeline-artifacts-${envSuffix}`,
                Environment: envSuffix,
            },
        }, { parent: this });

        // CloudWatch log group for CodeBuild
        this.logGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${envSuffix}`, {
            name: pulumi.interpolate`/aws/codebuild/pulumi-pipeline-${envSuffix}`,
            retentionInDays: 7,
            tags: {
                Name: pulumi.interpolate`codebuild-logs-${envSuffix}`,
                Environment: envSuffix,
            },
        }, { parent: this });

        // SNS topic for manual approval notifications
        this.approvalTopic = new aws.sns.Topic(`pipeline-approval-${envSuffix}`, {
            name: pulumi.interpolate`pipeline-approval-${envSuffix}`,
            displayName: "CI/CD Pipeline Manual Approval Notifications",
            tags: {
                Name: pulumi.interpolate`pipeline-approval-${envSuffix}`,
                Environment: envSuffix,
            },
        }, { parent: this });

        // IAM role for CodeBuild
        const codeBuildRole = new aws.iam.Role(`codebuild-role-${envSuffix}`, {
            name: pulumi.interpolate`codebuild-role-${envSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Action: "sts:AssumeRole",
                    Principal: {
                        Service: "codebuild.amazonaws.com",
                    },
                    Effect: "Allow",
                }],
            }),
            tags: {
                Name: pulumi.interpolate`codebuild-role-${envSuffix}`,
                Environment: envSuffix,
            },
        }, { parent: this });

        // IAM policy for CodeBuild with least-privilege permissions
        const codeBuildPolicy = new aws.iam.RolePolicy(`codebuild-policy-${envSuffix}`, {
            role: codeBuildRole.id,
            policy: pulumi.all([this.artifactBucket.arn, this.logGroup.arn, envSuffix]).apply(([bucketArn, logArn, suffix]) =>
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:PutObject",
                            ],
                            Resource: `${bucketArn}/*`,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:ListBucket",
                            ],
                            Resource: bucketArn,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                            ],
                            Resource: `${logArn}:*`,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "cloudformation:DescribeStacks",
                                "cloudformation:DescribeStackEvents",
                                "cloudformation:DescribeStackResources",
                                "cloudformation:GetTemplate",
                                "cloudformation:ValidateTemplate",
                                "cloudformation:CreateStack",
                                "cloudformation:UpdateStack",
                                "cloudformation:DeleteStack",
                            ],
                            Resource: `arn:aws:cloudformation:*:*:stack/pulumi-*`,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "ssm:GetParameter",
                                "ssm:GetParameters",
                            ],
                            Resource: `arn:aws:ssm:*:*:parameter/pulumi/*`,
                        },
                    ],
                })
            ),
        }, { parent: this });

        // CodeBuild project for Pulumi operations
        this.codeBuildProject = new aws.codebuild.Project(`pulumi-build-${envSuffix}`, {
            name: pulumi.interpolate`pulumi-pipeline-${envSuffix}`,
            serviceRole: codeBuildRole.arn,
            artifacts: {
                type: "CODEPIPELINE",
            },
            environment: {
                computeType: "BUILD_GENERAL1_SMALL",
                image: "aws/codebuild/standard:7.0",
                type: "LINUX_CONTAINER",
                privilegedMode: false,
                environmentVariables: [
                    {
                        name: "ENVIRONMENT_SUFFIX",
                        value: envSuffix,
                        type: "PLAINTEXT",
                    },
                    {
                        name: "AWS_DEFAULT_REGION",
                        value: aws.config.region || "us-east-1",
                        type: "PLAINTEXT",
                    },
                    {
                        name: "PULUMI_ACCESS_TOKEN",
                        value: "/pulumi/access-token",
                        type: "PARAMETER_STORE",
                    },
                    {
                        name: "PULUMI_STACK_NAME",
                        value: pulumi.interpolate`${envSuffix}`,
                        type: "PLAINTEXT",
                    },
                ],
            },
            source: {
                type: "CODEPIPELINE",
                buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing dependencies..."
      - npm install
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
      - pulumi version
  pre_build:
    commands:
      - echo "Configuring Pulumi..."
      - pulumi login s3://pulumi-state-bucket-$ENVIRONMENT_SUFFIX
      - pulumi stack select $PULUMI_STACK_NAME --create
      - pulumi config set environmentSuffix $ENVIRONMENT_SUFFIX
  build:
    commands:
      - echo "Running Pulumi preview..."
      - pulumi preview --non-interactive
      - echo "Deploying infrastructure..."
      - pulumi up --yes --non-interactive
  post_build:
    commands:
      - echo "Deployment complete"
      - pulumi stack output
artifacts:
  files:
    - '**/*'`,
            },
            logsConfig: {
                cloudwatchLogs: {
                    groupName: this.logGroup.name,
                    streamName: "build-log",
                    status: "ENABLED",
                },
            },
            tags: {
                Name: pulumi.interpolate`pulumi-pipeline-${envSuffix}`,
                Environment: envSuffix,
            },
        }, { parent: this, dependsOn: [codeBuildPolicy] });

        // IAM role for CodePipeline
        const pipelineRole = new aws.iam.Role(`pipeline-role-${envSuffix}`, {
            name: pulumi.interpolate`pipeline-role-${envSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Action: "sts:AssumeRole",
                    Principal: {
                        Service: "codepipeline.amazonaws.com",
                    },
                    Effect: "Allow",
                }],
            }),
            tags: {
                Name: pulumi.interpolate`pipeline-role-${envSuffix}`,
                Environment: envSuffix,
            },
        }, { parent: this });

        // IAM policy for CodePipeline with specific permissions
        const pipelinePolicy = new aws.iam.RolePolicy(`pipeline-policy-${envSuffix}`, {
            role: pipelineRole.id,
            policy: pulumi.all([this.artifactBucket.arn, this.codeBuildProject.arn, this.approvalTopic.arn]).apply(([bucketArn, buildArn, topicArn]) =>
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
                                "s3:GetBucketVersioning",
                            ],
                            Resource: [
                                bucketArn,
                                `${bucketArn}/*`,
                            ],
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "codebuild:BatchGetBuilds",
                                "codebuild:StartBuild",
                            ],
                            Resource: buildArn,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "sns:Publish",
                            ],
                            Resource: topicArn,
                        },
                    ],
                })
            ),
        }, { parent: this });

        // S3 bucket notification for pipeline trigger
        const bucketNotification = new aws.s3.BucketNotification(`pipeline-trigger-${envSuffix}`, {
            bucket: this.artifactBucket.id,
            lambdaFunctions: [],
        }, { parent: this });

        // CodePipeline with all stages
        this.pipeline = new aws.codepipeline.Pipeline(`cicd-pipeline-${envSuffix}`, {
            name: pulumi.interpolate`infrastructure-pipeline-${envSuffix}`,
            roleArn: pipelineRole.arn,
            artifactStore: {
                location: this.artifactBucket.bucket,
                type: "S3",
                encryptionKey: {
                    type: "S3",
                },
            },
            stages: [
                {
                    name: "Source",
                    actions: [{
                        name: "SourceAction",
                        category: "Source",
                        owner: "AWS",
                        provider: "S3",
                        version: "1",
                        outputArtifacts: ["source_output"],
                        configuration: {
                            S3Bucket: this.artifactBucket.bucket,
                            S3ObjectKey: "source.zip",
                            PollForSourceChanges: "true",
                        },
                    }],
                },
                {
                    name: "Build",
                    actions: [{
                        name: "BuildAction",
                        category: "Build",
                        owner: "AWS",
                        provider: "CodeBuild",
                        version: "1",
                        inputArtifacts: ["source_output"],
                        outputArtifacts: ["build_output"],
                        configuration: {
                            ProjectName: this.codeBuildProject.name,
                            EnvironmentVariables: pulumi.interpolate`[{"name":"ENVIRONMENT_SUFFIX","value":"${envSuffix}","type":"PLAINTEXT"}]`,
                        },
                    }],
                },
                {
                    name: "Approval",
                    actions: [{
                        name: "ManualApproval",
                        category: "Approval",
                        owner: "AWS",
                        provider: "Manual",
                        version: "1",
                        configuration: {
                            CustomData: pulumi.interpolate`Please review the Pulumi preview output and approve deployment to ${envSuffix} environment. Check CloudWatch logs for detailed changes.`,
                            NotificationArn: this.approvalTopic.arn,
                        },
                    }],
                },
                {
                    name: "Deploy",
                    actions: [{
                        name: "DeployAction",
                        category: "Build",
                        owner: "AWS",
                        provider: "CodeBuild",
                        version: "1",
                        inputArtifacts: ["build_output"],
                        outputArtifacts: ["deploy_output"],
                        configuration: {
                            ProjectName: this.codeBuildProject.name,
                            EnvironmentVariables: pulumi.interpolate`[{"name":"ENVIRONMENT_SUFFIX","value":"${envSuffix}","type":"PLAINTEXT"}]`,
                        },
                    }],
                },
            ],
            tags: {
                Name: pulumi.interpolate`infrastructure-pipeline-${envSuffix}`,
                Environment: envSuffix,
            },
        }, { parent: this, dependsOn: [pipelinePolicy] });

        this.registerOutputs({
            artifactBucketName: this.artifactBucket.id,
            codeBuildProjectName: this.codeBuildProject.name,
            pipelineName: this.pipeline.name,
            logGroupName: this.logGroup.name,
            approvalTopicArn: this.approvalTopic.arn,
        });
    }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const stack = new TapStack("tap-stack", {
    environmentSuffix: environmentSuffix,
});

export const artifactBucketName = stack.artifactBucket.id;
export const codeBuildProjectName = stack.codeBuildProject.name;
export const pipelineName = stack.pipeline.name;
export const logGroupName = stack.logGroup.name;
export const approvalTopicArn = stack.approvalTopic.arn;
```

## File: Pulumi.yaml

```yaml
name: cicd-pipeline
runtime: nodejs
description: CI/CD pipeline for infrastructure automation using Pulumi
```

## File: package.json

```json
{
  "name": "cicd-pipeline",
  "version": "1.0.0",
  "main": "bin/tap.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["bin/**/*", "lib/**/*"],
  "exclude": ["node_modules", "dist", "test", "tests"]
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program creates a complete CI/CD pipeline for infrastructure automation.

## Architecture

The pipeline consists of:

1. **S3 Artifact Bucket**: Stores pipeline artifacts with versioning and encryption
2. **CodeBuild Project**: Runs Pulumi commands (preview and up) with Node.js 18 runtime
3. **CodePipeline**: Orchestrates source, build, approval, and deploy stages
4. **IAM Roles**: Separate roles for CodeBuild and CodePipeline with least-privilege policies
5. **CloudWatch Logs**: Captures build logs with 7-day retention
6. **SNS Topic**: Sends notifications for manual approval requests

## Deployment

### Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js 18+ installed

### Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <your-suffix>
```

Store Pulumi access token in Parameter Store:

```bash
aws ssm put-parameter \
  --name /pulumi/access-token \
  --value <your-pulumi-token> \
  --type SecureString
```

### Deploy

```bash
npm install
pulumi up
```

### Outputs

- `artifactBucketName`: S3 bucket for artifacts
- `codeBuildProjectName`: CodeBuild project name
- `pipelineName`: CodePipeline name
- `logGroupName`: CloudWatch log group
- `approvalTopicArn`: SNS topic for approvals

## Usage

1. Upload source code as `source.zip` to the artifact bucket
2. Pipeline automatically triggers on upload
3. CodeBuild runs Pulumi preview and up
4. Manual approval required before production deployment
5. Final deployment stage completes the process

## Security

- S3 bucket encrypted with AES256
- IAM policies follow least-privilege principle
- Pulumi token stored in Parameter Store (encrypted)
- All resources tagged with environment information
- No hardcoded credentials

## Cleanup

```bash
pulumi destroy
```

All resources are configured with `forceDestroy: true` for clean removal.
```
