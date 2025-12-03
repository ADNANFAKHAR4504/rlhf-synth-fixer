/**
 * codebuild-stack.ts
 *
 * This module defines the CodeBuildStack component for creating AWS CodeBuild
 * projects with all necessary supporting resources including S3 buckets for
 * artifacts, IAM roles and policies, and CloudWatch log groups.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * CodeBuildStackArgs defines the input arguments for the CodeBuildStack component.
 */
export interface CodeBuildStackArgs {
  /**
   * GitHub repository URL for the source code
   */
  githubRepoUrl: string;

  /**
   * GitHub branch to trigger builds on (default: main)
   */
  githubBranch?: string;

  /**
   * Build timeout in minutes (default: 15)
   */
  buildTimeoutMinutes?: number;

  /**
   * CloudWatch Logs retention in days (default: 7)
   */
  logRetentionDays?: number;

  /**
   * Tags to apply to all resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * CodeBuildStack creates AWS CodeBuild infrastructure for CI/CD pipeline
 */
export class CodeBuildStack extends pulumi.ComponentResource {
  public readonly artifactBucketArn: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeBuildStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:codebuild:CodeBuildStack', name, args, opts);

    const githubBranch = args.githubBranch || 'main';
    const buildTimeoutMinutes = args.buildTimeoutMinutes || 15;
    const logRetentionDays = args.logRetentionDays || 7;
    const defaultTags = args.tags || {};

    // Merge required tags with provided tags
    const resourceTags = {
      ...defaultTags,
      Environment: 'Production',
      ManagedBy: 'Pulumi',
    };

    // Create S3 bucket for build artifacts with versioning enabled
    const artifactBucket = new aws.s3.Bucket(
      `${name}-artifacts`,
      {
        bucket: `codebuild-artifacts-${pulumi.getStack()}-${name}`,
        versioning: {
          enabled: true,
        },
        tags: resourceTags,
      },
      { parent: this }
    );

    // Block public access to the artifacts bucket
    new aws.s3.BucketPublicAccessBlock(
      `${name}-artifacts-public-access-block`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for build logs
    const logGroup = new aws.cloudwatch.LogGroup(
      `${name}-logs`,
      {
        name: `/aws/codebuild/${name}`,
        retentionInDays: logRetentionDays,
        tags: resourceTags,
      },
      { parent: this }
    );

    // Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `${name}-role`,
      {
        name: `codebuild-${name}-role`,
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // Create IAM policy for S3 access
    const s3Policy = new aws.iam.RolePolicy(
      `${name}-s3-policy`,
      {
        name: 'S3AccessPolicy',
        role: codeBuildRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:GetObjectVersion",
                "s3:ListBucket"
              ],
              "Resource": [
                "${artifactBucket.arn}",
                "${artifactBucket.arn}/*"
              ]
            }
          ]
        }`,
      },
      { parent: this }
    );

    // Create IAM policy for CloudWatch Logs access
    const logsPolicy = new aws.iam.RolePolicy(
      `${name}-logs-policy`,
      {
        name: 'CloudWatchLogsPolicy',
        role: codeBuildRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Resource": "${logGroup.arn}*"
            }
          ]
        }`,
      },
      { parent: this }
    );

    // Create CodeBuild project
    const codeBuildProject = new aws.codebuild.Project(
      `${name}-project`,
      {
        name: `${name}-nodejs-builder`,
        description:
          'CodeBuild project for Node.js microservices CI/CD pipeline',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactBucket.bucket,
          packaging: 'ZIP',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0', // Amazon Linux 2 with Node.js 18
          type: 'LINUX_CONTAINER',
          imagePullCredentialsType: 'CODEBUILD',
        },
        source: {
          type: 'GITHUB',
          location: args.githubRepoUrl,
          gitCloneDepth: 1,
          buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Building the application..."
      - npm run build
  post_build:
    commands:
      - echo "Build completed successfully"
artifacts:
  files:
    - '**/*'`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: buildTimeoutMinutes,
        tags: resourceTags,
      },
      {
        parent: this,
        dependsOn: [s3Policy, logsPolicy],
      }
    );

    // Note: Webhook creation commented out as it requires GitHub OAuth token
    // In a real deployment, you would configure the GitHub OAuth token in CodeBuild
    // and then uncomment this to enable automatic builds on push
    //
    // new aws.codebuild.Webhook(
    //   `${name}-webhook`,
    //   {
    //     projectName: codeBuildProject.name,
    //     filterGroups: [
    //       {
    //         filters: [
    //           {
    //             type: 'EVENT',
    //             pattern: 'PUSH',
    //           },
    //           {
    //             type: 'HEAD_REF',
    //             pattern: `^refs/heads/${githubBranch}$`,
    //           },
    //         ],
    //       },
    //     ],
    //   },
    //   {
    //     parent: this,
    //     dependsOn: [codeBuildProject],
    //   }
    // );

    // Export outputs
    this.artifactBucketArn = artifactBucket.arn;
    this.codeBuildProjectName = codeBuildProject.name;

    this.registerOutputs({
      artifactBucketArn: this.artifactBucketArn,
      codeBuildProjectName: this.codeBuildProjectName,
    });
  }
}
