# CI/CD Pipeline Infrastructure - Initial Implementation

This implementation creates a complete CI/CD pipeline for infrastructure automation using Pulumi and TypeScript.

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

    constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:infrastructure:TapStack", name, {}, opts);

        const envSuffix = pulumi.output(args.environmentSuffix);

        // S3 bucket for pipeline artifacts
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
        }, { parent: this });

        // CloudWatch log group for CodeBuild
        this.logGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${envSuffix}`, {
            name: pulumi.interpolate`/aws/codebuild/pulumi-pipeline-${envSuffix}`,
            retentionInDays: 7,
        }, { parent: this });

        // IAM role for CodeBuild
        const codeBuildRole = new aws.iam.Role(`codebuild-role-${envSuffix}`, {
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
        }, { parent: this });

        // IAM policy for CodeBuild
        const codeBuildPolicy = new aws.iam.RolePolicy(`codebuild-policy-${envSuffix}`, {
            role: codeBuildRole.id,
            policy: pulumi.all([this.artifactBucket.arn, this.logGroup.arn]).apply(([bucketArn, logArn]) =>
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:GetObject",
                                "s3:PutObject",
                            ],
                            Resource: `${bucketArn}/*`,
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
                                "cloudformation:*",
                            ],
                            Resource: "*",
                        },
                    ],
                })
            ),
        }, { parent: this });

        // CodeBuild project
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
                environmentVariables: [
                    {
                        name: "ENVIRONMENT_SUFFIX",
                        value: envSuffix,
                    },
                    {
                        name: "AWS_DEFAULT_REGION",
                        value: "us-east-1",
                    },
                    {
                        name: "PULUMI_ACCESS_TOKEN",
                        value: "placeholder-token",
                        type: "PLAINTEXT",
                    },
                ],
            },
            source: {
                type: "CODEPIPELINE",
                buildspec: `version: 0.2
phases:
  install:
    commands:
      - npm install
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
  build:
    commands:
      - pulumi preview
      - pulumi up --yes
artifacts:
  files:
    - '**/*'`,
            },
            logsConfig: {
                cloudwatchLogs: {
                    groupName: this.logGroup.name,
                    streamName: "build-log",
                },
            },
        }, { parent: this, dependsOn: [codeBuildPolicy] });

        // IAM role for CodePipeline
        const pipelineRole = new aws.iam.Role(`pipeline-role-${envSuffix}`, {
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
        }, { parent: this });

        // IAM policy for CodePipeline
        const pipelinePolicy = new aws.iam.RolePolicy(`pipeline-policy-${envSuffix}`, {
            role: pipelineRole.id,
            policy: pulumi.all([this.artifactBucket.arn, this.codeBuildProject.arn]).apply(([bucketArn, buildArn]) =>
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:*",
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
                    ],
                })
            ),
        }, { parent: this });

        // CodePipeline
        this.pipeline = new aws.codepipeline.Pipeline(`cicd-pipeline-${envSuffix}`, {
            name: pulumi.interpolate`infrastructure-pipeline-${envSuffix}`,
            roleArn: pipelineRole.arn,
            artifactStore: {
                location: this.artifactBucket.bucket,
                type: "S3",
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
                            CustomData: "Please review and approve the deployment",
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
                        configuration: {
                            ProjectName: this.codeBuildProject.name,
                        },
                    }],
                },
            ],
        }, { parent: this, dependsOn: [pipelinePolicy] });

        this.registerOutputs({
            artifactBucketName: this.artifactBucket.id,
            codeBuildProjectName: this.codeBuildProject.name,
            pipelineName: this.pipeline.name,
            logGroupName: this.logGroup.name,
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
```

## File: Pulumi.yaml

```yaml
name: cicd-pipeline
runtime: nodejs
description: CI/CD pipeline for infrastructure automation
```

## File: package.json

```json
{
  "name": "cicd-pipeline",
  "version": "1.0.0",
  "main": "bin/tap.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
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
    "rootDir": "."
  },
  "include": ["bin/**/*", "lib/**/*"],
  "exclude": ["node_modules"]
}
```
