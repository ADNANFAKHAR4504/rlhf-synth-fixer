/**
 * tap-stack.ts
 *
 * This module defines the TapStack class for a complete CI/CD pipeline infrastructure.
 * It creates CodePipeline, CodeBuild, S3 buckets, IAM roles, and CloudWatch logs.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * GitHub repository owner/organization name
   */
  githubOwner: string;

  /**
   * GitHub repository name
   */
  githubRepo: string;

  /**
   * GitHub branch to use for the pipeline (default: main)
   */
  githubBranch?: string;

  /**
   * GitHub OAuth token (stored in AWS Secrets Manager or provided as secret)
   */
  githubToken: pulumi.Input<string>;
}

/**
 * Represents the main Pulumi component resource for the CI/CD pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly deployBucketName: pulumi.Output<string>;
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const githubBranch = args.githubBranch || 'main';
    const tags = args.tags || {};
    const region = aws.getRegionOutput().name;

    // S3 Bucket for Pipeline Artifacts
    const stackName = pulumi.getStack().toLowerCase();
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}-${stackName}`,
        versioning: {
          enabled: true,
        },
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `pipeline-artifacts-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // S3 Bucket for Deployment (Deploy Stage Target)
    const deployBucket = new aws.s3.Bucket(
      `deploy-target-${environmentSuffix}`,
      {
        bucket: `deploy-target-${environmentSuffix}-${stackName}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `deploy-target-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/build-project-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `codebuild-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `codebuild-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild (Least Privilege)
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, codeBuildLogGroup.arn, region])
          .apply(([bucketArn, logGroupArn, _reg]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                  ],
                  Resource: [`${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: [logGroupArn, `${logGroupArn}:*`],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(
      `build-project-${environmentSuffix}`,
      {
        name: `build-project-${environmentSuffix}`,
        description: `Build project for CI/CD pipeline - ${environmentSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:5.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'ENVIRONMENT_SUFFIX',
              value: environmentSuffix,
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Running tests..."
      - npm test
      - echo "Building application..."
      - npm run build
artifacts:
  files:
    - '**/*'
  base-directory: build
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: codeBuildLogGroup.name,
            status: 'ENABLED',
          },
        },
        tags: {
          ...tags,
          Name: `build-project-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM Role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
      {
        name: `codepipeline-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `codepipeline-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline (Least Privilege)
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, deployBucket.arn, codeBuildProject.arn])
          .apply(([artifactArn, deployArn, buildArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                    's3:GetBucketLocation',
                    's3:ListBucket',
                  ],
                  Resource: [
                    artifactArn,
                    `${artifactArn}/*`,
                    deployArn,
                    `${deployArn}/*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: buildArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodePipeline with Source, Build, and Deploy Stages
    const pipeline = new aws.codepipeline.Pipeline(
      `pipeline-${environmentSuffix}`,
      {
        name: `pipeline-main-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
          },
        ],
        stages: [
          {
            name: 'Source',
            actions: [
              {
                name: 'GitHub-Source',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  Owner: args.githubOwner,
                  Repo: args.githubRepo,
                  Branch: githubBranch,
                  OAuthToken: args.githubToken,
                  PollForSourceChanges: 'false',
                },
              },
            ],
          },
          {
            name: 'Build',
            actions: [
              {
                name: 'CodeBuild',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['build_output'],
                configuration: {
                  ProjectName: codeBuildProject.name,
                },
              },
            ],
          },
          {
            name: 'Deploy',
            actions: [
              {
                name: 'S3-Deploy',
                category: 'Deploy',
                owner: 'AWS',
                provider: 'S3',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  BucketName: deployBucket.bucket,
                  Extract: 'true',
                },
              },
            ],
          },
        ],
        tags: {
          ...tags,
          Name: `pipeline-main-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // GitHub Webhook for automatic pipeline triggering
    new aws.codepipeline.Webhook(
      `github-webhook-${environmentSuffix}`,
      {
        name: `github-webhook-${environmentSuffix}`,
        authentication: 'GITHUB_HMAC',
        targetAction: 'GitHub-Source',
        targetPipeline: pipeline.name,
        authenticationConfiguration: {
          secretToken: args.githubToken,
        },
        filters: [
          {
            jsonPath: '$.ref',
            matchEquals: `refs/heads/${githubBranch}`,
          },
        ],
        tags: {
          ...tags,
          Name: `github-webhook-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Store outputs
    this.artifactBucketName = artifactBucket.bucket;
    this.deployBucketName = deployBucket.bucket;
    this.codeBuildProjectName = codeBuildProject.name;
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=${region}`;

    // Register outputs
    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      deployBucketName: this.deployBucketName,
      codeBuildProjectName: this.codeBuildProjectName,
      pipelineUrl: this.pipelineUrl,
    });
  }
}
