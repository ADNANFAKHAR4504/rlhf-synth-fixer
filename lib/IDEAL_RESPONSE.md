# AWS CodeBuild CI/CD Pipeline - Pulumi TypeScript Implementation

I'll help you create a complete AWS CodeBuild infrastructure for automated Node.js application builds.

## File: lib/codebuild-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeBuildStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CodeBuildStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeBuildStackArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super('tap:stack:CodeBuildStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create S3 bucket for build artifacts
    const artifactBucket = new aws.s3.Bucket(
      `codebuild-artifacts-${environmentSuffix}`,
      {
        bucket: `codebuild-artifacts-${environmentSuffix}`,
        tags: tags,
      },
      { parent: this },
    );

    // Enable versioning using separate resource (recommended approach)
    const bucketVersioning = new aws.s3.BucketVersioningV2(
      `codebuild-artifacts-versioning-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this },
    );

    // Create CloudWatch Logs group
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this },
    );

    // Create IAM role for CodeBuild
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
      { parent: this },
    );

    // Create IAM policy for S3 access with complete permissions
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
                    's3:PutObject',
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:GetBucketAcl',
                    's3:GetBucketLocation',
                  ],
                  Resource: [`${bucketArn}/*`, bucketArn],
                },
              ],
            }),
          ),
      },
      { parent: this },
    );

    // Create IAM policy for CloudWatch Logs
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
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `${logGroupArn}:*`,
                },
              ],
            }),
          ),
      },
      { parent: this },
    );

    // Create CodeBuild project
    const codeBuildProject = new aws.codebuild.Project(
      `nodejs-build-${environmentSuffix}`,
      {
        name: `nodejs-build-${environmentSuffix}`,
        description: 'Automated build for Node.js applications',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactBucket.id,
          packaging: 'ZIP',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: false,
        },
        source: {
          type: 'NO_SOURCE',
          buildspec: `version: 0.2
phases:
  install:
    commands:
      - npm install
  build:
    commands:
      - npm test
      - npm run build
artifacts:
  files:
    - '**/*'
  base-directory: dist`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 900,
        tags: tags,
      },
      { parent: this, dependsOn: [s3Policy, logsPolicy] },
    );

    this.codeBuildProjectName = codeBuildProject.name;
    this.artifactBucketName = artifactBucket.id;

    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketName: this.artifactBucketName,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CodeBuildStack } from './codebuild-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Environment: 'ci',
      ManagedBy: 'pulumi',
    };

    // Create CodeBuild stack
    const codeBuildStack = new CodeBuildStack(
      'codebuild',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this },
    );

    this.codeBuildProjectName = codeBuildStack.codeBuildProjectName;
    this.artifactBucketName = codeBuildStack.artifactBucketName;

    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketName: this.artifactBucketName,
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: 'ci',
    ManagedBy: 'pulumi',
  },
});

export const codeBuildProjectName = stack.codeBuildProjectName;
export const artifactBucketName = stack.artifactBucketName;
```

## Architecture Overview

This implementation creates:

1. **S3 Bucket**: Stores build artifacts with versioning enabled via BucketVersioningV2
2. **CloudWatch Logs**: Log group with 7-day retention for build logs
3. **IAM Role**: Service role for CodeBuild with least-privilege policies
4. **IAM Policies**: Separate policies for S3 access (including bucket-level permissions) and CloudWatch Logs
5. **CodeBuild Project**: Configured for Node.js with inline buildspec, using NO_SOURCE type

## Key Improvements

1. **S3 Versioning**: Uses `BucketVersioningV2` resource instead of deprecated inline versioning property
2. **Source Configuration**: Changed from GITHUB to NO_SOURCE since no actual repository is provided
3. **Build Timeout**: Correctly specified in seconds (900) instead of minutes (15)
4. **IAM Permissions**: Added `GetBucketAcl` and `GetBucketLocation` for complete S3 access
5. **Resource Targeting**: S3 policy now targets both bucket objects and bucket itself

The infrastructure follows AWS best practices with:
- Least-privilege IAM permissions
- Resource tagging for tracking
- Environment suffix for unique naming
- Destroyable resources (no retention policies)
- Modern AWS resource patterns (BucketVersioningV2)

All resources are properly organized in separate stack components for modularity and maintainability.
