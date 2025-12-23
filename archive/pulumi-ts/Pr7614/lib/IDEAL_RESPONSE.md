# CI/CD Pipeline Integration - Pulumi TypeScript Implementation

This implementation provides a complete CI/CD pipeline for containerized applications using AWS services orchestrated with Pulumi TypeScript.

## File: lib/ci-cd-stack.ts

```typescript
/**
 * ci-cd-stack.ts
 *
 * Defines the CI/CD pipeline infrastructure including:
 * - S3 bucket for build artifacts
 * - ECR repository for Docker images
 * - CodeBuild project for building and pushing images
 * - CodePipeline for orchestrating the CI/CD workflow
 * - IAM roles with least-privilege permissions
 * - CloudWatch Logs with retention policies
 * - SNS topic for pipeline notifications
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface CICDStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubToken?: pulumi.Input<string>;
  githubRepo?: string;
  githubBranch?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;
}

export class CICDStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: CICDStackArgs, opts?: ResourceOptions) {
    super('tap:cicd:CICDStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const defaultTags = {
      ...tags,
      Environment: 'Production',
      ManagedBy: 'Pulumi',
    };

    // 1. Create S3 bucket for storing build artifacts with versioning enabled
    const artifactBucket = new aws.s3.Bucket(`cicd-artifacts-${environmentSuffix}`, {
      bucket: `cicd-artifacts-${environmentSuffix}`,
      versioning: {
        enabled: true,
      },
      forceDestroy: true,
      tags: defaultTags,
    }, { parent: this });

    // Block public access to artifact bucket
    new aws.s3.BucketPublicAccessBlock(`cicd-artifacts-block-${environmentSuffix}`, {
      bucket: artifactBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // 2. Set up ECR repository with lifecycle policy to retain only last 10 images
    const ecrRepository = new aws.ecr.Repository(`app-repository-${environmentSuffix}`, {
      name: `app-repository-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      forceDelete: true,
      tags: defaultTags,
    }, { parent: this });

    // Lifecycle policy to retain only last 10 images
    new aws.ecr.LifecyclePolicy(`app-repository-lifecycle-${environmentSuffix}`, {
      repository: ecrRepository.name,
      policy: JSON.stringify({
        rules: [{
          rulePriority: 1,
          description: 'Retain only last 10 images',
          selection: {
            tagStatus: 'any',
            countType: 'imageCountMoreThan',
            countNumber: 10,
          },
          action: {
            type: 'expire',
          },
        }],
      }),
    }, { parent: this });

    // 8. SNS topic for pipeline notifications
    const snsTopic = new aws.sns.Topic(`pipeline-notifications-${environmentSuffix}`, {
      name: `pipeline-notifications-${environmentSuffix}`,
      tags: defaultTags,
    }, { parent: this });

    // 7. CloudWatch Log Group for CodeBuild with 7-day retention
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${environmentSuffix}`, {
      name: `/aws/codebuild/app-build-${environmentSuffix}`,
      retentionInDays: 7,
      tags: defaultTags,
    }, { parent: this });

    // 5. IAM role for CodeBuild with least-privilege permissions
    const codeBuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
      name: `codebuild-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'codebuild.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // CodeBuild policy for logs
    new aws.iam.RolePolicy(`codebuild-logs-policy-${environmentSuffix}`, {
      role: codeBuildRole.id,
      policy: pulumi.all([codeBuildLogGroup.arn]).apply(([logGroupArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          Resource: [
            logGroupArn,
            `${logGroupArn}:*`,
          ],
        }],
      })),
    }, { parent: this });

    // CodeBuild policy for S3 artifact access
    new aws.iam.RolePolicy(`codebuild-s3-policy-${environmentSuffix}`, {
      role: codeBuildRole.id,
      policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:PutObject',
          ],
          Resource: `${bucketArn}/*`,
        }],
      })),
    }, { parent: this });

    // CodeBuild policy for ECR
    new aws.iam.RolePolicy(`codebuild-ecr-policy-${environmentSuffix}`, {
      role: codeBuildRole.id,
      policy: pulumi.all([ecrRepository.arn]).apply(([repoArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ecr:GetAuthorizationToken',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ecr:BatchCheckLayerAvailability',
              'ecr:GetDownloadUrlForLayer',
              'ecr:BatchGetImage',
              'ecr:PutImage',
              'ecr:InitiateLayerUpload',
              'ecr:UploadLayerPart',
              'ecr:CompleteLayerUpload',
            ],
            Resource: repoArn,
          },
        ],
      })),
    }, { parent: this });

    // 3. CodeBuild project that builds Docker images and pushes to ECR
    const codeBuildProject = new aws.codebuild.Project(`app-build-${environmentSuffix}`, {
      name: `app-build-${environmentSuffix}`,
      description: 'Build Docker images and push to ECR',
      serviceRole: codeBuildRole.arn,
      artifacts: {
        type: 'CODEPIPELINE',
      },
      environment: {
        computeType: 'BUILD_GENERAL1_SMALL',
        image: 'aws/codebuild/standard:5.0',
        type: 'LINUX_CONTAINER',
        privilegedMode: true,
        environmentVariables: [
          {
            name: 'AWS_DEFAULT_REGION',
            value: aws.getRegionOutput().name,
          },
          {
            name: 'AWS_ACCOUNT_ID',
            value: aws.getCallerIdentityOutput().accountId,
          },
          {
            name: 'IMAGE_REPO_NAME',
            value: ecrRepository.name,
          },
          {
            name: 'IMAGE_TAG',
            value: 'latest',
          },
        ],
      },
      source: {
        type: 'CODEPIPELINE',
        buildspec: 'buildspec.yml',
      },
      logsConfig: {
        cloudwatchLogs: {
          groupName: codeBuildLogGroup.name,
          status: 'ENABLED',
        },
      },
      tags: defaultTags,
    }, { parent: this });

    // IAM role for CodePipeline with least-privilege permissions
    const codePipelineRole = new aws.iam.Role(`codepipeline-role-${environmentSuffix}`, {
      name: `codepipeline-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'codepipeline.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // CodePipeline policy for S3
    new aws.iam.RolePolicy(`codepipeline-s3-policy-${environmentSuffix}`, {
      role: codePipelineRole.id,
      policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:PutObject',
            's3:GetBucketLocation',
            's3:ListBucket',
          ],
          Resource: [
            bucketArn,
            `${bucketArn}/*`,
          ],
        }],
      })),
    }, { parent: this });

    // CodePipeline policy for CodeBuild
    new aws.iam.RolePolicy(`codepipeline-codebuild-policy-${environmentSuffix}`, {
      role: codePipelineRole.id,
      policy: pulumi.all([codeBuildProject.arn]).apply(([buildArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'codebuild:BatchGetBuilds',
            'codebuild:StartBuild',
          ],
          Resource: buildArn,
        }],
      })),
    }, { parent: this });

    // CodePipeline policy for ECS
    new aws.iam.RolePolicy(`codepipeline-ecs-policy-${environmentSuffix}`, {
      role: codePipelineRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'ecs:DescribeServices',
            'ecs:DescribeTaskDefinition',
            'ecs:DescribeTasks',
            'ecs:ListTasks',
            'ecs:RegisterTaskDefinition',
            'ecs:UpdateService',
            'iam:PassRole',
          ],
          Resource: '*',
        }],
      }),
    }, { parent: this });

    // CodePipeline policy for SNS notifications
    new aws.iam.RolePolicy(`codepipeline-sns-policy-${environmentSuffix}`, {
      role: codePipelineRole.id,
      policy: pulumi.all([snsTopic.arn]).apply(([topicArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'sns:Publish',
          ],
          Resource: topicArn,
        }],
      })),
    }, { parent: this });

    // 4. CodePipeline with Source (GitHub), Build (CodeBuild), and Deploy (ECS) stages
    const pipeline = new aws.codepipeline.Pipeline(`app-pipeline-${environmentSuffix}`, {
      name: `app-pipeline-${environmentSuffix}`,
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
          actions: [{
            name: 'Source',
            category: 'Source',
            owner: 'ThirdParty',
            provider: 'GitHub',
            version: '1',
            outputArtifacts: ['source_output'],
            configuration: {
              Owner: args.githubRepo?.split('/')[0] || 'owner',
              Repo: args.githubRepo?.split('/')[1] || 'repo',
              Branch: args.githubBranch || 'main',
              OAuthToken: args.githubToken || 'PLACEHOLDER_TOKEN',
            },
          }],
        },
        {
          name: 'Build',
          actions: [{
            name: 'Build',
            category: 'Build',
            owner: 'AWS',
            provider: 'CodeBuild',
            version: '1',
            inputArtifacts: ['source_output'],
            outputArtifacts: ['build_output'],
            configuration: {
              ProjectName: codeBuildProject.name,
            },
          }],
        },
        {
          name: 'Deploy',
          actions: [{
            name: 'Deploy',
            category: 'Deploy',
            owner: 'AWS',
            provider: 'ECS',
            version: '1',
            inputArtifacts: ['build_output'],
            configuration: {
              ClusterName: args.ecsClusterName || 'app-cluster',
              ServiceName: args.ecsServiceName || 'app-service',
              FileName: 'imagedefinitions.json',
            },
          }],
        },
      ],
      tags: defaultTags,
    }, { parent: this });

    // EventBridge rule for pipeline failures
    const pipelineEventRule = new aws.cloudwatch.EventRule(`pipeline-failure-rule-${environmentSuffix}`, {
      name: `pipeline-failure-rule-${environmentSuffix}`,
      description: 'Capture pipeline failures',
      eventPattern: pulumi.all([pipeline.name]).apply(([pipelineName]) => JSON.stringify({
        source: ['aws.codepipeline'],
        'detail-type': ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['FAILED'],
          pipeline: [pipelineName],
        },
      })),
      tags: defaultTags,
    }, { parent: this });

    // EventBridge target to send failures to SNS
    new aws.cloudwatch.EventTarget(`pipeline-failure-target-${environmentSuffix}`, {
      rule: pipelineEventRule.name,
      arn: snsTopic.arn,
      inputTransformer: {
        inputPaths: {
          pipeline: '$.detail.pipeline',
          state: '$.detail.state',
          execution: '$.detail.execution-id',
        },
        inputTemplate: '"Pipeline <pipeline> has <state>. Execution ID: <execution>"',
      },
    }, { parent: this });

    // SNS topic policy to allow EventBridge to publish
    new aws.sns.TopicPolicy(`pipeline-notifications-policy-${environmentSuffix}`, {
      arn: snsTopic.arn,
      policy: pulumi.all([snsTopic.arn]).apply(([topicArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'events.amazonaws.com',
          },
          Action: 'sns:Publish',
          Resource: topicArn,
        }],
      })),
    }, { parent: this });

    // Set outputs
    this.artifactBucketName = artifactBucket.bucket;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;
    this.pipelineName = pipeline.name;
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
      snsTopicArn: this.snsTopicArn,
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
import { CICDStack } from './ci-cd-stack';

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
   * GitHub personal access token for pipeline source
   */
  githubToken?: pulumi.Input<string>;

  /**
   * GitHub repository in format 'owner/repo'
   */
  githubRepo?: string;

  /**
   * GitHub branch to monitor
   */
  githubBranch?: string;

  /**
   * ECS cluster name for deployment
   */
  ecsClusterName?: string;

  /**
   * ECS service name for deployment
   */
  ecsServiceName?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
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
    const tags = args.tags || {};

    // Instantiate CI/CD Stack
    const cicdStack = new CICDStack('cicd', {
      environmentSuffix: environmentSuffix,
      tags: tags,
      githubToken: args.githubToken,
      githubRepo: args.githubRepo,
      githubBranch: args.githubBranch,
      ecsClusterName: args.ecsClusterName,
      ecsServiceName: args.ecsServiceName,
    }, { parent: this });

    // Expose outputs
    this.artifactBucketName = cicdStack.artifactBucketName;
    this.ecrRepositoryUrl = cicdStack.ecrRepositoryUrl;
    this.pipelineName = cicdStack.pipelineName;
    this.snsTopicArn = cicdStack.snsTopicArn;

    // Register the outputs of this component
    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
      snsTopicArn: this.snsTopicArn,
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

// Get GitHub configuration
const githubToken = process.env.GITHUB_TOKEN;
const githubRepo = process.env.GITHUB_REPO || 'owner/repo';
const githubBranch = process.env.GITHUB_BRANCH || 'main';
const ecsClusterName = process.env.ECS_CLUSTER_NAME || 'app-cluster';
const ecsServiceName = process.env.ECS_SERVICE_NAME || 'app-service';

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
    githubToken: githubToken,
    githubRepo: githubRepo,
    githubBranch: githubBranch,
    ecsClusterName: ecsClusterName,
    ecsServiceName: ecsServiceName,
  },
  { provider }
);

// Export stack outputs
export const artifactBucketName = stack.artifactBucketName;
export const ecrRepositoryUrl = stack.ecrRepositoryUrl;
export const pipelineName = stack.pipelineName;
export const snsTopicArn = stack.snsTopicArn;
```

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: nodejs
description: Pulumi infrastructure for TAP CI/CD Pipeline
main: bin/tap.ts
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates a complete CI/CD pipeline for containerized applications on AWS.

## Architecture

The infrastructure includes:

1. **S3 Bucket** - Stores build artifacts with versioning enabled
2. **ECR Repository** - Hosts Docker images with lifecycle policy (retain last 10 images)
3. **CodeBuild Project** - Builds Docker images from source code and pushes to ECR
4. **CodePipeline** - Three-stage pipeline: Source (GitHub) → Build (CodeBuild) → Deploy (ECS)
5. **IAM Roles** - Least-privilege permissions for CodeBuild and CodePipeline
6. **CloudWatch Logs** - CodeBuild logs with 7-day retention
7. **SNS Topic** - Notifications for pipeline failures
8. **Tags** - All resources tagged with Environment=Production and ManagedBy=Pulumi

## Prerequisites

- Node.js 18 or later
- Pulumi CLI installed
- AWS credentials configured
- GitHub personal access token

## Environment Variables

Set the following environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"              # Deployment environment
export AWS_REGION="us-east-1"                # AWS region
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"      # GitHub personal access token
export GITHUB_REPO="owner/repo"              # GitHub repository
export GITHUB_BRANCH="main"                  # Branch to monitor
export ECS_CLUSTER_NAME="app-cluster"        # ECS cluster name
export ECS_SERVICE_NAME="app-service"        # ECS service name
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
```

3. Deploy the infrastructure:
```bash
pulumi up
```

4. Review and confirm the changes.

## Outputs

After deployment, the following outputs are available:

- `artifactBucketName` - S3 bucket name for build artifacts
- `ecrRepositoryUrl` - ECR repository URL for Docker images
- `pipelineName` - CodePipeline name
- `snsTopicArn` - SNS topic ARN for notifications

## buildspec.yml

Your source repository should include a `buildspec.yml` file:

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"app-container","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
```

## Clean Up

To destroy all resources:

```bash
pulumi destroy
```

## Resource Naming

All resources use the `environmentSuffix` parameter for naming:
- S3 Bucket: `cicd-artifacts-{environmentSuffix}`
- ECR Repository: `app-repository-{environmentSuffix}`
- CodeBuild Project: `app-build-{environmentSuffix}`
- CodePipeline: `app-pipeline-{environmentSuffix}`
- SNS Topic: `pipeline-notifications-{environmentSuffix}`
- CloudWatch Log Group: `/aws/codebuild/app-build-{environmentSuffix}`

## Security Features

- S3 bucket has public access blocked
- ECR images are scanned on push
- IAM roles follow least-privilege principles
- All resources are tagged for governance
- CloudWatch Logs have retention policies
- Pipeline failures trigger SNS notifications
```

## Summary

This implementation provides:

1. ✓ S3 bucket for artifacts with versioning
2. ✓ ECR repository with lifecycle policy (10 images)
3. ✓ CodeBuild project with Docker support
4. ✓ Three-stage CodePipeline (Source/Build/Deploy)
5. ✓ Least-privilege IAM roles
6. ✓ buildspec.yml configuration
7. ✓ CloudWatch Logs (7-day retention)
8. ✓ SNS notifications for failures
9. ✓ All resources tagged (Environment=Production, ManagedBy=Pulumi)

All resources include `environmentSuffix` for uniqueness and are fully destroyable.
