/**
 * cicd-stack.ts
 *
 * Defines the CI/CD infrastructure for AWS CodeBuild with S3 artifact storage,
 * CloudWatch Logs, and IAM permissions.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CICDStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CICDStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CICDStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CICDStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // S3 Bucket for Build Artifacts with force destroy enabled
    const artifactBucket = new aws.s3.Bucket(
      `codebuild-artifacts-${environmentSuffix}`,
      {
        bucket: `codebuild-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        forceDestroy: true, // Allow bucket deletion with objects for testing
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `codebuild-artifacts-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Block public access to S3 bucket (security best practice)
    new aws.s3.BucketPublicAccessBlock(
      `codebuild-artifacts-public-access-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
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

    // IAM Policy for S3 Access
    const s3Policy = new aws.iam.RolePolicy(
      `codebuild-s3-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:PutObject',
                  's3:ListBucket',
                  's3:GetBucketLocation',
                  's3:GetBucketVersioning',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // IAM Policy for CloudWatch Logs
    const logsPolicy = new aws.iam.RolePolicy(
      `codebuild-logs-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
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
      `nodejs-build-${environmentSuffix}`,
      {
        name: `nodejs-build-${environmentSuffix}`,
        description: 'CI/CD build project for Node.js applications',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactBucket.bucket,
          path: 'builds/',
          namespaceType: 'BUILD_ID',
          packaging: 'ZIP',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0', // Latest standard image with Node.js 18 support
          type: 'LINUX_CONTAINER',
          imagePullCredentialsType: 'CODEBUILD',
          environmentVariables: [
            {
              name: 'NODE_ENV',
              value: 'production',
              type: 'PLAINTEXT',
            },
            {
              name: 'BUILD_NUMBER',
              value: '$CODEBUILD_BUILD_NUMBER',
              type: 'PLAINTEXT',
            },
          ],
        },
        source: {
          type: 'GITHUB',
          location: 'https://github.com/example/nodejs-app.git',
          gitCloneDepth: 1, // Shallow clone for faster builds
          buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo Node.js version
      - node --version
      - npm --version
  pre_build:
    commands:
      - echo Installing dependencies on \`date\`
      - npm ci --only=production
  build:
    commands:
      - echo Build started on \`date\`
      - npm run build
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Packaging artifacts...
artifacts:
  files:
    - '**/*'
  base-directory: .
  name: build-\$CODEBUILD_BUILD_NUMBER
cache:
  paths:
    - node_modules/**/*
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 15,
        queuedTimeout: 30, // Timeout for queued builds
        cache: {
          type: 'LOCAL',
          modes: ['LOCAL_SOURCE_CACHE', 'LOCAL_CUSTOM_CACHE'],
        },
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Environment: 'production',
          Team: 'engineering',
        })),
      },
      { parent: this, dependsOn: [s3Policy, logsPolicy] }
    );

    // Outputs
    this.codeBuildProjectName = codeBuildProject.name;
    this.artifactBucketArn = artifactBucket.arn;

    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketArn: this.artifactBucketArn,
    });
  }
}
