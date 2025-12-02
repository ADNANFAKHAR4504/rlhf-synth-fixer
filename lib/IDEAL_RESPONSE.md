# CI/CD Pipeline Implementation - Corrected Version

Complete CI/CD pipeline infrastructure using Pulumi with TypeScript for Node.js application with proper security, naming, and deployment configurations.

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
  public readonly bucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
  public readonly notificationTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:app:TapStack", name, {}, opts);

    const tags = {
      Environment: "production",
      Project: "nodejs-app",
    };

    // S3 bucket for artifacts with environmentSuffix
    const artifactsBucket = new aws.s3.BucketV2(`artifacts-bucket-${args.environmentSuffix}`, {
      forceDestroy: true,
      tags: tags,
    }, { parent: this });

    const bucketVersioning = new aws.s3.BucketVersioningV2(`artifacts-bucket-versioning-${args.environmentSuffix}`, {
      bucket: artifactsBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    }, { parent: this });

    // ECR repository with environmentSuffix and lifecycle policy
    const ecrRepo = new aws.ecr.Repository(`nodejs-app-repo-${args.environmentSuffix}`, {
      forceDelete: true,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      tags: tags,
    }, { parent: this });

    // ECR lifecycle policy to prevent unlimited image accumulation
    new aws.ecr.LifecyclePolicy(`ecr-lifecycle-${args.environmentSuffix}`, {
      repository: ecrRepo.name,
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
    }, { parent: this });

    // CloudWatch Log Group with environmentSuffix
    const logGroup = new aws.cloudwatch.LogGroup(`build-logs-${args.environmentSuffix}`, {
      retentionInDays: 7,
      tags: tags,
    }, { parent: this });

    // SNS Topic for notifications with environmentSuffix
    const notificationTopic = new aws.sns.Topic(`pipeline-notifications-${args.environmentSuffix}`, {
      tags: tags,
    }, { parent: this });

    // IAM Role for CodeBuild with least-privilege
    const codeBuildRole = new aws.iam.Role(`codebuild-role-${args.environmentSuffix}`, {
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

    // Least-privilege policy for CodeBuild
    new aws.iam.RolePolicy(`codebuild-policy-${args.environmentSuffix}`, {
      role: codeBuildRole.id,
      policy: pulumi.all([artifactsBucket.arn, ecrRepo.arn, logGroup.arn]).apply(([bucketArn, repoArn, logArn]) =>
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
              Resource: [`${logArn}:*`],
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
            {
              Effect: "Allow",
              Action: [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:PutObject",
              ],
              Resource: `${bucketArn}/*`,
            },
          ],
        })
      ),
    }, { parent: this });

    // CodeBuild Project with environmentSuffix
    const codeBuildProject = new aws.codebuild.Project(`docker-build-project-${args.environmentSuffix}`, {
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
            value: aws.getCallerIdentity().then(id => id.accountId),
          },
          {
            name: "IMAGE_REPO_NAME",
            value: ecrRepo.name,
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
      - IMAGE_TAG_HASH=$IMAGE_TAG-$COMMIT_HASH
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:$IMAGE_TAG .
      - docker tag $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:$IMAGE_TAG_HASH
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - docker push $REPOSITORY_URI:$IMAGE_TAG_HASH
      - echo Writing image definitions file...
      - printf '[{"name":"nodejs-app","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json`,
      },
      logsConfig: {
        cloudwatchLogs: {
          groupName: logGroup.name,
        },
      },
      tags: tags,
    }, { parent: this });

    // IAM Role for CodePipeline with least-privilege
    const codePipelineRole = new aws.iam.Role(`codepipeline-role-${args.environmentSuffix}`, {
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

    // Least-privilege policy for CodePipeline
    new aws.iam.RolePolicy(`codepipeline-policy-${args.environmentSuffix}`, {
      role: codePipelineRole.id,
      policy: pulumi.all([artifactsBucket.arn, codeBuildProject.arn]).apply(([bucketArn, buildArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:GetBucketVersioning",
                "s3:PutObject",
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
              Resource: notificationTopic.arn,
            },
          ],
        })
      ),
    }, { parent: this });

    // CodePipeline with environmentSuffix
    const pipeline = new aws.codepipeline.Pipeline(`cicd-pipeline-${args.environmentSuffix}`, {
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
              PollForSourceChanges: "false",
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
        {
          name: "Deploy",
          actions: [{
            name: "Deploy",
            category: "Build",
            owner: "AWS",
            provider: "CodeBuild",
            version: "1",
            inputArtifacts: ["build_output"],
            configuration: {
              ProjectName: codeBuildProject.name,
            },
          }],
        },
      ],
      tags: tags,
    }, { parent: this });

    // GitHub webhook for automatic triggers
    const webhook = new aws.codepipeline.Webhook(`github-webhook-${args.environmentSuffix}`, {
      authentication: "GITHUB_HMAC",
      targetAction: "Source",
      targetPipeline: pipeline.name,
      authenticationConfiguration: {
        secretToken: args.githubToken,
      },
      filters: [{
        jsonPath: "$.ref",
        matchEquals: pulumi.interpolate`refs/heads/${args.githubBranch}`,
      }],
      tags: tags,
    }, { parent: this });

    // SNS notification rule for pipeline failures
    const notificationRule = new aws.codestarnotifications.NotificationRule(`pipeline-failure-notification-${args.environmentSuffix}`, {
      detailType: "FULL",
      eventTypeIds: [
        "codepipeline-pipeline-pipeline-execution-failed",
        "codepipeline-pipeline-pipeline-execution-canceled",
        "codepipeline-pipeline-pipeline-execution-superseded",
      ],
      name: pulumi.interpolate`pipeline-failures-${args.environmentSuffix}`,
      resource: pipeline.arn,
      targets: [{
        address: notificationTopic.arn,
      }],
      tags: tags,
    }, { parent: this });

    // Allow CodeStar Notifications to publish to SNS
    new aws.sns.TopicPolicy(`notification-topic-policy-${args.environmentSuffix}`, {
      arn: notificationTopic.arn,
      policy: notificationTopic.arn.apply(arn =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Principal: {
              Service: "codestar-notifications.amazonaws.com",
            },
            Action: "SNS:Publish",
            Resource: arn,
          }],
        })
      ),
    }, { parent: this });

    // Export outputs
    this.bucketName = artifactsBucket.bucket;
    this.ecrRepositoryUrl = ecrRepo.repositoryUrl;
    this.pipelineName = pipeline.name;
    this.notificationTopicArn = notificationTopic.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
      notificationTopicArn: this.notificationTopicArn,
      webhookUrl: webhook.url,
    });
  }
}
```
