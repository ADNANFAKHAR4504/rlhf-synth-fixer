# IDEAL_RESPONSE: CI/CD Build Environment with AWS CodeBuild (Production-Ready)

This document contains the corrected, production-ready implementation for the CI/CD build environment using Pulumi TypeScript.

## File: lib/cicd-stack.ts

```typescript
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
        tags: pulumi.output(tags).apply((t) => ({
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
        policy: pulumi
          .all([artifactBucket.arn])
          .apply(([bucketArn]) =>
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
        policy: pulumi
          .all([logGroup.arn])
          .apply(([logGroupArn]) =>
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
        tags: pulumi.output(tags).apply((t) => ({
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
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CICDStack } from './cicd-stack';

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
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketArn: pulumi.Output<string>;

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

    // Instantiate CI/CD Stack
    const cicdStack = new CICDStack(
      'cicd-stack',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.codeBuildProjectName = cicdStack.codeBuildProjectName;
    this.artifactBucketArn = cicdStack.artifactBucketArn;

    // Register the outputs of this component.
    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketArn: this.artifactBucketArn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Get the environment suffix from environment variables, defaulting to 'dev'.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const codeBuildProjectName = stack.codeBuildProjectName;
export const artifactBucketArn = stack.artifactBucketArn;
```

## Summary of Production-Ready Features

1. **S3 Bucket Security**: Added BucketPublicAccessBlock for security best practices
2. **S3 Bucket Destroyability**: Added forceDestroy flag to allow clean deletion
3. **Enhanced IAM Permissions**: Added additional S3 permissions for versioning and bucket operations
4. **Updated CodeBuild Image**: Using standard:7.0 (latest) instead of 5.0 for better Node.js 18 support
5. **Build Optimization**:
   - Added gitCloneDepth for shallow clones
   - Added npm ci for reproducible installs
   - Added build caching (LOCAL_SOURCE_CACHE and LOCAL_CUSTOM_CACHE)
   - Added node_modules caching
6. **Queue Timeout**: Added queuedTimeout configuration
7. **Enhanced Buildspec**:
   - Using npm ci instead of npm install
   - Added version checking commands
   - Added artifact naming with build number
   - Added base-directory for artifacts
8. **Tag Handling**: Properly handling pulumi.Input types with pulumi.output().apply()
9. **CloudWatch Logs**: Enhanced permissions to include logGroupArn as well as wildcard
