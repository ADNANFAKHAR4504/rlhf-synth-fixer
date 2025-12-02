# CI/CD Pipeline for Containerized Applications

This implementation creates a complete CI/CD pipeline using Pulumi TypeScript with AWS services for containerized application deployment.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackProps {
  environmentSuffix: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;

  constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
    super("custom:resource:TapStack", name, {}, opts);

    const { environmentSuffix } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: "ci",
      Project: "container-pipeline",
    };

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new aws.s3.Bucket(
      `artifact-bucket`,
      {
        bucket: pulumi.interpolate`artifact-bucket-${environmentSuffix}`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    // ECR Repository for Docker Images
    const ecrRepository = new aws.ecr.Repository(
      `ecr-repo`,
      {
        name: pulumi.interpolate`ecr-repo-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: "MUTABLE",
        forceDelete: true,
        tags: commonTags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy
    const lifecyclePolicy = new aws.ecr.LifecyclePolicy(
      `ecr-lifecycle`,
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

    // CloudWatch Log Group for CodeBuild
    const buildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs`,
      {
        name: pulumi.interpolate`/aws/codebuild/build-project-${environmentSuffix}`,
        retentionInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role`,
      {
        name: pulumi.interpolate`codebuild-role-${environmentSuffix}`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn, ecrRepository.arn, buildLogGroup.arn]).apply(
          ([bucketArn, repoArn, logGroupArn]) =>
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
                  Resource: [`${logGroupArn}:*`],
                },
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                  ],
                  Resource: [`${bucketArn}/*`],
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
                    "ecr:CompleteLayerUpload",
                    "ecr:InitiateLayerUpload",
                    "ecr:PutImage",
                    "ecr:UploadLayerPart",
                  ],
                  Resource: repoArn,
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      `build-project`,
      {
        name: pulumi.interpolate`build-project-${environmentSuffix}`,
        description: "Build Docker images for containerized applications",
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: "CODEPIPELINE",
        },
        environment: {
          computeType: "BUILD_GENERAL1_SMALL",
          image: "aws/codebuild/standard:7.0",
          type: "LINUX_CONTAINER",
          privilegedMode: true,
          environmentVariables: [
            {
              name: "AWS_DEFAULT_REGION",
              value: "us-east-1",
              type: "PLAINTEXT",
            },
            {
              name: "AWS_ACCOUNT_ID",
              value: pulumi.output(aws.getCallerIdentity()).accountId,
              type: "PLAINTEXT",
            },
            {
              name: "IMAGE_REPO_NAME",
              value: ecrRepository.name,
              type: "PLAINTEXT",
            },
            {
              name: "IMAGE_TAG",
              value: "latest",
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
      - printf '[{"name":"app","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: buildLogGroup.name,
            status: "ENABLED",
          },
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // SNS Topic for Pipeline Notifications
    const pipelineTopic = new aws.sns.Topic(
      `pipeline-topic`,
      {
        name: pulumi.interpolate`pipeline-notifications-${environmentSuffix}`,
        displayName: "CI/CD Pipeline Notifications",
        tags: commonTags,
      },
      { parent: this }
    );

    // IAM Role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      `pipeline-role`,
      {
        name: pulumi.interpolate`pipeline-role-${environmentSuffix}`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(
      `pipeline-policy`,
      {
        role: pipelineRole.id,
        policy: pulumi.all([artifactBucket.arn, buildProject.arn]).apply(
          ([bucketArn, projectArn]) =>
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
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: "Allow",
                  Action: [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild",
                  ],
                  Resource: projectArn,
                },
                {
                  Effect: "Allow",
                  Action: ["sns:Publish"],
                  Resource: "*",
                },
              ],
            })
        ),
      },
      { parent: this }
    );

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `ci-pipeline`,
      {
        name: pulumi.interpolate`ci-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStore: {
          location: artifactBucket.bucket,
          type: "S3",
        },
        stages: [
          {
            name: "Source",
            actions: [
              {
                name: "SourceAction",
                category: "Source",
                owner: "ThirdParty",
                provider: "GitHub",
                version: "1",
                outputArtifacts: ["source_output"],
                configuration: {
                  Owner: "example-owner",
                  Repo: "example-repo",
                  Branch: "main",
                  OAuthToken: "placeholder-token",
                },
              },
            ],
          },
          {
            name: "Build",
            actions: [
              {
                name: "BuildAction",
                category: "Build",
                owner: "AWS",
                provider: "CodeBuild",
                version: "1",
                inputArtifacts: ["source_output"],
                outputArtifacts: ["build_output"],
                configuration: {
                  ProjectName: buildProject.name,
                },
              },
            ],
          },
          {
            name: "ManualApproval",
            actions: [
              {
                name: "ApprovalAction",
                category: "Approval",
                owner: "AWS",
                provider: "Manual",
                version: "1",
                configuration: {
                  CustomData: "Please review the build and approve for deployment",
                  NotificationArn: pipelineTopic.arn,
                },
              },
            ],
          },
        ],
        tags: commonTags,
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    // CloudWatch Event Rule for Pipeline State Changes
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `pipeline-events`,
      {
        name: pulumi.interpolate`pipeline-events-${environmentSuffix}`,
        description: "Capture CodePipeline state changes",
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"]
  }
}`,
        tags: commonTags,
      },
      { parent: this }
    );

    // CloudWatch Event Target
    const pipelineEventTarget = new aws.cloudwatch.EventTarget(
      `pipeline-event-target`,
      {
        rule: pipelineEventRule.name,
        arn: pipelineTopic.arn,
      },
      { parent: this }
    );

    // SNS Topic Policy for CloudWatch Events
    const topicPolicy = new aws.sns.TopicPolicy(
      `pipeline-topic-policy`,
      {
        arn: pipelineTopic.arn,
        policy: pulumi.all([pipelineTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: "events.amazonaws.com",
                },
                Action: "SNS:Publish",
                Resource: topicArn,
              },
              {
                Effect: "Allow",
                Principal: {
                  Service: "codepipeline.amazonaws.com",
                },
                Action: "SNS:Publish",
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Exports
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=us-east-1`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "./tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const stack = new TapStack("tap-stack", {
  environmentSuffix: environmentSuffix,
});

export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
```

## File: lib/README.md

```markdown
# CI/CD Pipeline for Containerized Applications

This Pulumi TypeScript project deploys a complete CI/CD pipeline for containerized applications using AWS services.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores pipeline artifacts with versioning enabled
- **ECR Repository**: Private Docker image registry with lifecycle policies
- **CodeBuild Project**: Builds Docker images from GitHub source
- **CodePipeline**: Orchestrates the CI/CD workflow with three stages:
  - Source: Pulls code from GitHub
  - Build: Executes CodeBuild to create Docker images
  - Manual Approval: Requires human approval before deployment
- **CloudWatch Logs**: Captures build logs with 7-day retention
- **SNS Topic**: Sends notifications for pipeline state changes
- **IAM Roles**: Service roles with least privilege permissions

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- GitHub repository with Dockerfile
- GitHub OAuth token for source integration

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <unique-suffix>
```

## Deployment

Deploy the infrastructure:

```bash
npm install
pulumi up
```

## Outputs

After deployment, the stack outputs:

- `pipelineUrl`: URL to view the CodePipeline in AWS Console
- `ecrRepositoryUri`: URI for the ECR repository to push Docker images

## GitHub Configuration

Update the CodePipeline source stage configuration:

1. Replace `example-owner` with your GitHub username/organization
2. Replace `example-repo` with your repository name
3. Update `OAuthToken` with your GitHub personal access token
4. Adjust `Branch` if using a different default branch

## Buildspec

The CodeBuild project uses an inline buildspec that:

1. Authenticates with ECR
2. Builds a Docker image from the repository
3. Tags the image with commit hash and latest
4. Pushes images to ECR
5. Creates imagedefinitions.json for deployment

Ensure your repository contains a Dockerfile at the root.

## Cleanup

Remove all resources:

```bash
pulumi destroy
```

All resources are configured to be fully destroyable without manual intervention.

## Security

- IAM roles follow least privilege principle
- S3 bucket encrypted with AES256
- ECR images scanned on push
- CloudWatch Logs for audit trail
- All resources tagged for compliance tracking

## Cost Optimization

- CloudWatch Logs retention set to 7 days
- ECR lifecycle policy keeps only last 10 images
- Serverless and managed services minimize operational costs
- Small compute instance for CodeBuild

## Monitoring

- CloudWatch Logs capture all build output
- SNS notifications for pipeline state changes
- ECR scan findings available in AWS Console
- Pipeline execution history in CodePipeline

## Tagging

All resources are tagged with:
- Environment: ci
- Project: container-pipeline
```