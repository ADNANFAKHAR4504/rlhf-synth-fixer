# CodeBuild Automated Build Infrastructure - Pulumi TypeScript Implementation (IDEAL RESPONSE)

This document contains the corrected implementation of a CodeBuild-based automated build infrastructure using Pulumi with TypeScript. This ideal response fixes all critical failures identified in MODEL_FAILURES.md, particularly the missing entry point configuration and output exports.

## File: bin/tap.ts (CRITICAL - This file was missing/incomplete in MODEL_RESPONSE)

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
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
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
// This encapsulates all the resources for the platform.
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,  // CRITICAL: Pass environmentSuffix to stack
    tags: defaultTags,
  },
  { provider }
);

// CRITICAL: Export stack outputs for external consumption
// These exports are required for:
// - Integration tests to access deployed resource identifiers
// - CI/CD pipelines to retrieve outputs via `pulumi stack output`
// - External tools and scripts to reference deployed resources
export const artifactBucketName = stack.artifactBucketName;
export const codeBuildProjectName = stack.codeBuildProjectName;
export const snsTopicArn = stack.snsTopicArn;
```

## File: lib/tap-stack.ts (Same as MODEL_RESPONSE - No changes needed)

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the CodeBuild automated build infrastructure.
 * Orchestrates S3 artifact storage, CodeBuild project, IAM roles, CloudWatch Logs,
 * SNS notifications, and EventBridge rules for build failure detection.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ArtifactBucket } from './artifact-bucket';
import { CodeBuildProject } from './codebuild-project';
import { BuildNotifications } from './build-notifications';

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
 * Represents the main Pulumi component resource for the CodeBuild infrastructure.
 *
 * This component orchestrates the instantiation of:
 * - S3 bucket for build artifacts
 * - CodeBuild project with Node.js configuration
 * - IAM roles and policies
 * - CloudWatch Logs for build output
 * - SNS topic for notifications
 * - EventBridge rule for failure detection
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Environment: 'production',
      Team: 'devops',
    };

    // Create S3 bucket for build artifacts
    const artifactBucket = new ArtifactBucket(
      'artifact-bucket',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create CodeBuild project with IAM role and CloudWatch Logs
    const codeBuildProject = new CodeBuildProject(
      'codebuild-project',
      {
        environmentSuffix: environmentSuffix,
        artifactBucketName: artifactBucket.bucketName,
        artifactBucketArn: artifactBucket.bucketArn,
        tags: tags,
      },
      { parent: this }
    );

    // Create SNS topic and EventBridge rule for build failure notifications
    const buildNotifications = new BuildNotifications(
      'build-notifications',
      {
        environmentSuffix: environmentSuffix,
        codeBuildProjectArn: codeBuildProject.projectArn,
        tags: tags,
      },
      { parent: this }
    );

    // Export outputs
    this.artifactBucketName = artifactBucket.bucketName;
    this.codeBuildProjectName = codeBuildProject.projectName;
    this.snsTopicArn = buildNotifications.snsTopicArn;

    // Register the outputs of this component
    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      codeBuildProjectName: this.codeBuildProjectName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: lib/artifact-bucket.ts (With Lint Fixes)

```typescript
/**
 * artifact-bucket.ts
 *
 * Creates an S3 bucket for storing CodeBuild artifacts with versioning enabled.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ArtifactBucketArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ArtifactBucket extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ArtifactBucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:ArtifactBucket', name, {}, opts);

    // Create S3 bucket for artifacts
    const bucket = new aws.s3.Bucket(
      `artifacts-${args.environmentSuffix}`,
      {
        bucket: `codebuild-artifacts-${args.environmentSuffix}`,
        tags: args.tags,
        forceDestroy: true, // Enable destroyability - bucket can be deleted even with objects
      },
      { parent: this }
    );

    // Enable versioning on the bucket
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketVersioning = new aws.s3.BucketVersioningV2(
      `artifacts-versioning-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable server-side encryption
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `artifacts-encryption-${args.environmentSuffix}`,
        {
          bucket: bucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        },
        { parent: this }
      );

    // Block public access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `artifacts-public-access-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.bucketName = bucket.id;
    this.bucketArn = bucket.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
```

## File: lib/codebuild-project.ts (Same as MODEL_RESPONSE - No changes needed)

```typescript
/**
 * codebuild-project.ts
 *
 * Creates CodeBuild project with IAM role, CloudWatch Logs, and proper configuration
 * for Node.js application builds.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeBuildProjectArgs {
  environmentSuffix: string;
  artifactBucketName: pulumi.Output<string>;
  artifactBucketArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CodeBuildProject extends pulumi.ComponentResource {
  public readonly projectName: pulumi.Output<string>;
  public readonly projectArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeBuildProjectArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:codebuild:CodeBuildProject', name, {}, opts);

    // Create CloudWatch Logs group for build output
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${args.environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${args.environmentSuffix}`,
        retentionInDays: 7, // 7-day retention for cost optimization
        tags: args.tags,
      },
      { parent: this }
    );

    // Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${args.environmentSuffix}`,
      {
        name: `codebuild-role-${args.environmentSuffix}`,
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
        tags: args.tags,
      },
      { parent: this }
    );

    // Create IAM policy for S3 access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _s3Policy = new aws.iam.RolePolicy(
      `codebuild-s3-policy-${args.environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([args.artifactBucketArn]).apply(([bucketArn]) =>
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
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create IAM policy for CloudWatch Logs access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _logsPolicy = new aws.iam.RolePolicy(
      `codebuild-logs-policy-${args.environmentSuffix}`,
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

    // Create CodeBuild project
    const project = new aws.codebuild.Project(
      `nodejs-build-${args.environmentSuffix}`,
      {
        name: `nodejs-build-${args.environmentSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: args.artifactBucketName,
          namespaceType: 'BUILD_ID',
          packaging: 'ZIP',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL', // 3 GB memory
          image: 'aws/codebuild/standard:6.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'NODE_ENV',
              value: 'production',
              type: 'PLAINTEXT',
            },
            {
              name: 'BUILD_NUMBER',
              value: '#{CODEBUILD_BUILD_NUMBER}',
              type: 'PLAINTEXT',
            },
          ],
        },
        source: {
          type: 'NO_SOURCE',
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
      - echo "Building application..."
      - npm run build
  post_build:
    commands:
      - echo "Build completed on \`date\`"
artifacts:
  files:
    - '**/*'
  name: build-artifact-$BUILD_NUMBER
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 15, // 15 minutes timeout
        tags: args.tags,
      },
      {
        parent: this,
        dependsOn: [_s3Policy, _logsPolicy],
      }
    );

    this.projectName = project.name;
    this.projectArn = project.arn;

    this.registerOutputs({
      projectName: this.projectName,
      projectArn: this.projectArn,
    });
  }
}
```

## File: lib/build-notifications.ts (With Lint Fixes)

```typescript
/**
 * build-notifications.ts
 *
 * Creates SNS topic and EventBridge rule to detect and notify on CodeBuild failures.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BuildNotificationsArgs {
  environmentSuffix: string;
  codeBuildProjectArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class BuildNotifications extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: BuildNotificationsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:notifications:BuildNotifications', name, {}, opts);

    // Create SNS topic for build failure notifications
    const snsTopic = new aws.sns.Topic(
      `build-failures-${args.environmentSuffix}`,
      {
        name: `build-failures-${args.environmentSuffix}`,
        displayName: 'CodeBuild Failure Notifications',
        tags: args.tags,
      },
      { parent: this }
    );

    // Create EventBridge rule to detect build failures
    const eventRule = new aws.cloudwatch.EventRule(
      `build-failure-rule-${args.environmentSuffix}`,
      {
        name: `build-failure-rule-${args.environmentSuffix}`,
        description: 'Detect CodeBuild build failures',
        eventPattern: pulumi
          .all([args.codeBuildProjectArn])
          .apply(([projectArn]) => {
            const projectName = projectArn.split('/').pop();
            return JSON.stringify({
              source: ['aws.codebuild'],
              'detail-type': ['CodeBuild Build State Change'],
              detail: {
                'build-status': ['FAILED'],
                'project-name': [projectName],
              },
            });
          }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Create EventBridge target to send to SNS
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _eventTarget = new aws.cloudwatch.EventTarget(
      `build-failure-target-${args.environmentSuffix}`,
      {
        rule: eventRule.name,
        arn: snsTopic.arn,
        inputTransformer: {
          inputPaths: {
            buildId: '$.detail.build-id',
            projectName: '$.detail.project-name',
            buildStatus: '$.detail.build-status',
            region: '$.region',
            account: '$.account',
          },
          inputTemplate:
            '"Build <buildId> for project <projectName> has FAILED. Status: <buildStatus>. AWS Account: <account>, Region: <region>"',
        },
      },
      { parent: this }
    );

    // Allow EventBridge to publish to SNS topic
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _snsTopicPolicy = new aws.sns.TopicPolicy(
      `build-failures-policy-${args.environmentSuffix}`,
      {
        arn: snsTopic.arn,
        policy: pulumi
          .all([snsTopic.arn, eventRule.arn])
          .apply(([topicArn, ruleArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'events.amazonaws.com',
                  },
                  Action: 'SNS:Publish',
                  Resource: topicArn,
                  Condition: {
                    ArnEquals: {
                      'aws:SourceArn': ruleArn,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## Key Differences from MODEL_RESPONSE

### Critical Fixes

1. **bin/tap.ts Entry Point File** (CRITICAL FIX)
   - **Added**: Complete entry point file with environment variable integration
   - **Added**: `environmentSuffix` parameter passed to TapStack constructor
   - **Added**: Top-level exports for all stack outputs
   - **Impact**: Enables proper resource naming and integration testing

2. **Lint Compliance** (Code Quality Fix)
   - **Added**: `// eslint-disable-next-line @typescript-eslint/no-unused-vars` comments
   - **Added**: Underscore prefix for intentionally unused variables
   - **Impact**: Passes lint checks without code quality violations

3. **Prettier Formatting** (Minor Fix)
   - **Fixed**: Consistent quote usage
   - **Fixed**: Line wrapping
   - **Impact**: Passes format checks

### Architecture (Same as MODEL_RESPONSE)

The core architecture remains excellent with proper componentization, least-privilege IAM, and all required AWS services. The MODEL_RESPONSE got the infrastructure design right but missed the integration layer (entry point configuration and output exports) that makes Pulumi programs production-ready.
