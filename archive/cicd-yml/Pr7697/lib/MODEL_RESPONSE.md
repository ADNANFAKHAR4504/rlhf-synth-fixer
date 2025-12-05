# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This document contains the complete Pulumi TypeScript implementation for an automated CI/CD pipeline that deploys containerized applications to ECS.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: { [key: string]: string };
  githubRepo?: string;
  githubBranch?: string;
  githubToken?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super("tap:stack:TapStack", name, args, opts);

    const environmentSuffix = args.environmentSuffix || "dev";
    const defaultTags = {
      Environment: "Production",
      ManagedBy: "Pulumi",
      ...(args.tags || {}),
    };

    // S3 Bucket for Pipeline Artifacts with Versioning
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR Repository for Docker Images
    const ecrRepository = new aws.ecr.Repository(
      `container-registry-${environmentSuffix}`,
      {
        name: `container-registry-${environmentSuffix}`,
        imageTagMutability: "MUTABLE",
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy - Retain last 10 images
    new aws.ecr.LifecyclePolicy(
      `ecr-lifecycle-${environmentSuffix}`,
      {
        repository: ecrRepository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: "Keep last 10 images",
              selection: {
                tagStatus: "any",
                countType: "imageCountMoreThan",
                countNumber: 10,
              },
              action: {
                type: "expire",
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild - Least Privilege
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn, ecrRepository.arn]).apply(([bucketArn, repoArn]) =>
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
                Resource: "arn:aws:logs:*:*:*",
              },
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
                  "ecr:GetAuthorizationToken",
                ],
                Resource: "*",
              },
              {
                Effect: "Allow",
                Action: [
                  "ecr:BatchCheckLayerAvailability",
                  "ecr:GetDownloadUrlForLayer",
                  "ecr:BatchGetImage",
                  "ecr:PutImage",
                  "ecr:InitiateLayerUpload",
                  "ecr:UploadLayerPart",
                  "ecr:CompleteLayerUpload",
                ],
                Resource: repoArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodeBuild Project with Inline Buildspec
    const codeBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: "CODEPIPELINE",
        },
        environment: {
          computeType: "BUILD_GENERAL1_SMALL",
          image: "aws/codebuild/standard:5.0",
          type: "LINUX_CONTAINER",
          privilegedMode: true,
          environmentVariables: [
            {
              name: "AWS_DEFAULT_REGION",
              value: "us-east-1",
            },
            {
              name: "AWS_ACCOUNT_ID",
              value: aws.getCallerIdentity().then((id) => id.accountId),
            },
            {
              name: "IMAGE_REPO_NAME",
              value: ecrRepository.name,
            },
            {
              name: "IMAGE_TAG",
              value: "latest",
            },
          ],
        },
        source: {
          type: "CODEPIPELINE",
          buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"app-container","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
`,
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM Role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
      {
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline - Least Privilege
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi.all([artifactBucket.arn, codeBuildProject.arn]).apply(([bucketArn, buildArn]) =>
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
                  "s3:GetBucketLocation",
                  "s3:ListBucket",
                ],
                Resource: bucketArn,
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
                  "ecs:DescribeServices",
                  "ecs:DescribeTaskDefinition",
                  "ecs:DescribeTasks",
                  "ecs:ListTasks",
                  "ecs:RegisterTaskDefinition",
                  "ecs:UpdateService",
                ],
                Resource: "*",
              },
              {
                Effect: "Allow",
                Action: [
                  "iam:PassRole",
                ],
                Resource: "*",
                Condition: {
                  StringEqualsIfExists: {
                    "iam:PassedToService": [
                      "ecs-tasks.amazonaws.com",
                    ],
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodePipeline with 3 Stages: Source, Build, Deploy
    const pipeline = new aws.codepipeline.Pipeline(
      `ecs-pipeline-${environmentSuffix}`,
      {
        name: `ecs-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStore: {
          location: artifactBucket.bucket,
          type: "S3",
        },
        stages: [
          // Stage 1: Source (GitHub)
          {
            name: "Source",
            actions: [
              {
                name: "Source",
                category: "Source",
                owner: "ThirdParty",
                provider: "GitHub",
                version: "1",
                outputArtifacts: ["source_output"],
                configuration: {
                  Owner: args.githubRepo?.split("/")[0] || "owner",
                  Repo: args.githubRepo?.split("/")[1] || "repo",
                  Branch: args.githubBranch || "main",
                  OAuthToken: args.githubToken || "placeholder-token",
                },
              },
            ],
          },
          // Stage 2: Build (CodeBuild)
          {
            name: "Build",
            actions: [
              {
                name: "Build",
                category: "Build",
                owner: "AWS",
                provider: "CodeBuild",
                version: "1",
                inputArtifacts: ["source_output"],
                outputArtifacts: ["build_output"],
                configuration: {
                  ProjectName: codeBuildProject.name,
                },
              },
            ],
          },
          // Stage 3: Deploy (ECS)
          {
            name: "Deploy",
            actions: [
              {
                name: "Deploy",
                category: "Deploy",
                owner: "AWS",
                provider: "ECS",
                version: "1",
                inputArtifacts: ["build_output"],
                configuration: {
                  ClusterName: `ecs-cluster-${environmentSuffix}`,
                  ServiceName: `ecs-service-${environmentSuffix}`,
                  FileName: "imagedefinitions.json",
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // Exports
    this.artifactBucketName = artifactBucket.bucket;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;
    this.pipelineName = pipeline.name;

    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "./lib/tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.get("environmentSuffix") || process.env.ENVIRONMENT_SUFFIX || "dev";

const stack = new TapStack("tap-stack", {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: "Production",
    ManagedBy: "Pulumi",
  },
  githubRepo: config.get("githubRepo"),
  githubBranch: config.get("githubBranch") || "main",
  githubToken: config.getSecret("githubToken"),
});

export const artifactBucketName = stack.artifactBucketName;
export const ecrRepositoryUrl = stack.ecrRepositoryUrl;
export const pipelineName = stack.pipelineName;
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates an automated CI/CD pipeline for deploying containerized applications to ECS.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores pipeline artifacts with versioning enabled
- **ECR Repository**: Docker image registry with lifecycle policy (retains last 10 images)
- **CodeBuild Project**: Builds Docker images with inline buildspec
- **CodePipeline**: 3-stage pipeline (Source → Build → Deploy)
- **IAM Roles**: Least-privilege permissions for CodeBuild and CodePipeline

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured
- Node.js 14+ and npm
- GitHub personal access token (for pipeline source)

## Configuration

Set these configuration values:

\`\`\`bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set githubRepo <owner/repo>
pulumi config set githubBranch <branch-name>
pulumi config set --secret githubToken <your-github-token>
\`\`\`

Or use environment variables:

\`\`\`bash
export ENVIRONMENT_SUFFIX=dev
\`\`\`

## Deployment

Install dependencies:

\`\`\`bash
npm install
\`\`\`

Deploy the infrastructure:

\`\`\`bash
pulumi up
\`\`\`

## Outputs

After deployment:

- \`artifactBucketName\`: S3 bucket name for artifacts
- \`ecrRepositoryUrl\`: ECR repository URL for Docker images
- \`pipelineName\`: CodePipeline name

## Pipeline Flow

1. **Source Stage**: Triggers on GitHub commits
2. **Build Stage**: CodeBuild builds Docker image and pushes to ECR
3. **Deploy Stage**: Updates ECS service with new image

## Resource Naming

All resources include environmentSuffix for uniqueness:
- S3: \`pipeline-artifacts-{environmentSuffix}\`
- ECR: \`container-registry-{environmentSuffix}\`
- CodeBuild: \`docker-build-{environmentSuffix}\`
- CodePipeline: \`ecs-pipeline-{environmentSuffix}\`

## Tags

All resources tagged with:
- Environment: Production
- ManagedBy: Pulumi

## Cleanup

To destroy all resources:

\`\`\`bash
pulumi destroy
\`\`\`
\`\`\`

## Implementation Notes

### Key Features

1. **S3 Versioning**: Enabled for artifact history and rollback capability
2. **ECR Lifecycle**: Automatically removes images older than the last 10
3. **Inline Buildspec**: Build specification embedded in CodeBuild project
4. **Least Privilege IAM**: Roles have only required permissions
5. **Environment Suffix**: All resources uniquely named
6. **Proper Tagging**: Environment and ManagedBy tags on all resources

### Security Considerations

- IAM roles follow least-privilege principle
- S3 bucket has server-side encryption
- ECR scanning enabled on push
- CodeBuild runs with necessary privileges for Docker

### Pipeline Stages

1. **Source**: Monitors GitHub repository for changes
2. **Build**: Builds Docker image, pushes to ECR, creates imagedefinitions.json
3. **Deploy**: Updates ECS service with new image

### Dependencies

The implementation has proper dependency management:
- CodeBuild depends on IAM policy attachment
- CodePipeline depends on IAM policy attachment
- All resources properly parented to TapStack component
