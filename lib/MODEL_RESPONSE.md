# CI/CD Pipeline Implementation

I'll create a complete CI/CD pipeline infrastructure using Pulumi with TypeScript for your Node.js application.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackArgs {
  environmentSuffix: pulumi.Input<string>;
  githubToken: pulumi.Input<string>;
  githubOwner: pulumi.Input<string>;
  githubRepo: pulumi.Input<string>;
  githubBranch: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:app:TapStack", name, {}, opts);

    const tags = {
      Environment: "production",
      Project: "nodejs-app",
    };

    // S3 bucket for artifacts
    const artifactsBucket = new aws.s3.Bucket(`artifacts-bucket`, {
      versioning: {
        enabled: true,
      },
      tags: tags,
    }, { parent: this });

    // ECR repository
    const ecrRepo = new aws.ecr.Repository(`nodejs-app-repo`, {
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      tags: tags,
    }, { parent: this });

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(`build-logs`, {
      retentionInDays: 7,
      tags: tags,
    }, { parent: this });

    // SNS Topic for notifications
    const notificationTopic = new aws.sns.Topic(`pipeline-notifications`, {
      tags: tags,
    }, { parent: this });

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(`codebuild-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "codebuild.amazonaws.com",
          },
        }],
      }),
      tags: tags,
    }, { parent: this });

    // Attach policies to CodeBuild role
    new aws.iam.RolePolicyAttachment(`codebuild-policy-attachment`, {
      role: codeBuildRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess",
    }, { parent: this });

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(`docker-build-project`, {
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
            name: "ECR_REPOSITORY_URI",
            value: ecrRepo.repositoryUrl,
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
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
  build:
    commands:
      - echo Build started on \`date\`
      - docker build -t $ECR_REPOSITORY_URI:latest .
      - docker push $ECR_REPOSITORY_URI:latest
  post_build:
    commands:
      - echo Build completed on \`date\``,
      },
      logsConfig: {
        cloudwatchLogs: {
          groupName: logGroup.name,
        },
      },
      tags: tags,
    }, { parent: this });

    // IAM Role for CodePipeline
    const codePipelineRole = new aws.iam.Role(`codepipeline-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "codepipeline.amazonaws.com",
          },
        }],
      }),
      tags: tags,
    }, { parent: this });

    // Inline policy for CodePipeline
    new aws.iam.RolePolicy(`codepipeline-policy`, {
      role: codePipelineRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: ["codebuild:*"],
            Resource: "*",
          },
        ],
      }),
    }, { parent: this });

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(`cicd-pipeline`, {
      roleArn: codePipelineRole.arn,
      artifactStore: {
        location: artifactsBucket.bucket,
        type: "S3",
      },
      stages: [
        {
          name: "Source",
          actions: [{
            name: "Source",
            category: "Source",
            owner: "ThirdParty",
            provider: "GitHub",
            version: "1",
            outputArtifacts: ["source_output"],
            configuration: {
              Owner: args.githubOwner,
              Repo: args.githubRepo,
              Branch: args.githubBranch,
              OAuthToken: args.githubToken,
            },
          }],
        },
        {
          name: "Build",
          actions: [{
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
          }],
        },
      ],
      tags: tags,
    }, { parent: this });

    // Export outputs
    this.registerOutputs({
      bucketName: artifactsBucket.bucket,
      ecrRepositoryUrl: ecrRepo.repositoryUrl,
      pipelineName: pipeline.name,
      notificationTopicArn: notificationTopic.arn,
    });
  }
}
