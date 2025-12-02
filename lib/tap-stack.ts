/**
 * tap-stack.ts
 *
 * This module defines the TapStack class for creating a complete CI/CD build pipeline
 * infrastructure using AWS CodeBuild, S3, CloudWatch Logs, and IAM.
 *
 * The stack creates:
 * - S3 bucket for storing build artifacts with versioning enabled
 * - CodeBuild project for building Node.js applications from GitHub
 * - IAM service role with least-privilege permissions
 * - CloudWatch Logs log group for build logging
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * A suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Used in resource naming for uniqueness.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the CI/CD Build Pipeline.
 *
 * This component creates all necessary AWS resources for a complete build pipeline:
 * artifact storage, build project, security roles, and logging infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly codeBuildRoleArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Create S3 bucket for build artifacts with versioning enabled
    const artifactBucket = new aws.s3.Bucket(
      `codebuild-artifacts-${environmentSuffix}`,
      {
        bucket: `codebuild-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        forceDestroy: true, // Allow clean destruction for testing
        tags: tags,
      },
      { parent: this }
    );

    // 2. Create CloudWatch Logs log group for build logs
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // 3. Create IAM role for CodeBuild with trust relationship
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-service-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // 4. Create IAM policy for CodeBuild with least-privilege permissions
    const codeBuildPolicy = new aws.iam.Policy(
      `codebuild-policy-${environmentSuffix}`,
      {
        name: `codebuild-policy-${environmentSuffix}`,
        policy: pulumi
          .all([artifactBucket.arn, logGroup.name])
          .apply(([bucketArn, logGroupName]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:PutObject',
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `arn:aws:logs:*:*:log-group:${logGroupName}:*`,
                },
              ],
            })
          ),
        tags: tags,
      },
      { parent: this }
    );

    // 5. Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `codebuild-policy-attachment-${environmentSuffix}`,
      {
        role: codeBuildRole.name,
        policyArn: codeBuildPolicy.arn,
      },
      { parent: this }
    );

    // 6. Create CodeBuild project for Node.js application builds
    const codeBuildProject = new aws.codebuild.Project(
      `nodejs-build-${environmentSuffix}`,
      {
        name: `nodejs-build-project-${environmentSuffix}`,
        description: 'CI/CD build project for Node.js applications',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactBucket.bucket,
          packaging: 'ZIP',
          name: 'build-output',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'NODE_VERSION',
              value: '18',
            },
          ],
        },
        source: {
          type: 'GITHUB',
          location: 'https://github.com/example/repo.git',
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
  base-directory: dist
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 15,
        tags: tags,
      },
      { parent: this, dependsOn: [codeBuildRole, artifactBucket, logGroup] }
    );

    // Expose outputs
    this.codeBuildProjectName = codeBuildProject.name;
    this.artifactBucketName = artifactBucket.bucket;
    this.codeBuildRoleArn = codeBuildRole.arn;
    this.logGroupName = logGroup.name;

    // Register the outputs of this component
    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketName: this.artifactBucketName,
      codeBuildRoleArn: this.codeBuildRoleArn,
      logGroupName: this.logGroupName,
    });
  }
}
