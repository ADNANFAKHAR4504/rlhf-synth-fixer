# CI/CD Pipeline Infrastructure - Model Response

This document contains the generated infrastructure code for a CI/CD pipeline using Pulumi TypeScript.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Infrastructure for automated deployment
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
   * GitHub repository owner
   */
  githubOwner?: string;

  /**
   * GitHub repository name
   */
  githubRepo?: string;

  /**
   * GitHub OAuth token ARN in Secrets Manager
   */
  githubTokenArn?: string;

  /**
   * Pulumi access token ARN in Secrets Manager
   */
  pulumiTokenArn?: string;
}

/**
 * Represents the main Pulumi component resource for the CI/CD pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      ...(args.tags || {}),
    };

    // S3 bucket for pipeline artifacts
    const artifactBucket = new aws.s3.Bucket(`pipeline-artifacts`, {
      bucket: `pipeline-artifacts-${environmentSuffix}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 30,
        },
      }],
      tags: defaultTags,
    }, { parent: this });

    // IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(`codepipeline-role-${environmentSuffix}`, {
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

    // IAM policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(`codepipeline-policy-${environmentSuffix}`, {
      role: pipelineRole.id,
      policy: artifactBucket.arn.apply(bucketArn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
            ],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'codebuild:BatchGetBuilds',
              'codebuild:StartBuild',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this });

    // IAM role for CodeBuild
    const buildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
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

    // IAM policy for CodeBuild
    const buildPolicy = new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
      role: buildRole.id,
      policy: artifactBucket.arn.apply(bucketArn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
            ],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
            ],
            Resource: args.pulumiTokenArn || '*',
          },
        ],
      })),
    }, { parent: this });

    // CloudWatch Log Group for CodeBuild
    const buildLogGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${environmentSuffix}`, {
      name: `/aws/codebuild/pulumi-deploy-${environmentSuffix}`,
      retentionInDays: 7,
      tags: defaultTags,
    }, { parent: this });

    // CodeBuild Project
    const buildProject = new aws.codebuild.Project(`pulumi-deploy-${environmentSuffix}`, {
      serviceRole: buildRole.arn,
      artifacts: {
        type: 'CODEPIPELINE',
      },
      environment: {
        computeType: 'BUILD_GENERAL1_SMALL',
        image: 'aws/codebuild/standard:5.0',
        type: 'LINUX_CONTAINER',
        environmentVariables: [
          {
            name: 'PULUMI_ACCESS_TOKEN',
            value: args.pulumiTokenArn || 'arn:aws:secretsmanager:us-east-1:123456789012:secret:pulumi-token',
            type: 'SECRETS_MANAGER',
          },
          {
            name: 'ENVIRONMENT',
            value: environmentSuffix,
          },
        ],
      },
      source: {
        type: 'CODEPIPELINE',
        buildspec: `version: 0.2
phases:
  install:
    commands:
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
  pre_build:
    commands:
      - pulumi login
      - pulumi stack select \${ENVIRONMENT}
  build:
    commands:
      - pulumi preview
      - pulumi up --yes
artifacts:
  files:
    - '**/*'`,
      },
      logsConfig: {
        cloudwatchLogs: {
          groupName: buildLogGroup.name,
        },
      },
      tags: defaultTags,
    }, { parent: this, dependsOn: [buildPolicy] });

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(`infrastructure-pipeline-${environmentSuffix}`, {
      roleArn: pipelineRole.arn,
      artifactStore: {
        location: artifactBucket.bucket,
        type: 'S3',
      },
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
              Owner: args.githubOwner || 'default-owner',
              Repo: args.githubRepo || 'default-repo',
              Branch: 'main',
              OAuthToken: '{{resolve:secretsmanager:github-token}}',
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
            inputArtifacts: ['source_output'],
            outputArtifacts: ['build_output'],
            version: '1',
            configuration: {
              ProjectName: buildProject.name,
            },
          }],
        },
        {
          name: 'Approval',
          actions: [{
            name: 'ManualApproval',
            category: 'Approval',
            owner: 'AWS',
            provider: 'Manual',
            version: '1',
          }],
        },
      ],
      tags: defaultTags,
    }, { parent: this, dependsOn: [pipelinePolicy] });

    this.pipelineArn = pipeline.arn;
    this.artifactBucketName = artifactBucket.bucket;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: buildProject.name,
    });
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi program creates a complete CI/CD pipeline for automated infrastructure deployment using AWS CodePipeline, CodeBuild, and related services.

## Architecture

The infrastructure includes:
- S3 bucket for pipeline artifacts with versioning and lifecycle policies
- CodeBuild project configured to run Pulumi commands
- CodePipeline with source (GitHub), build, and manual approval stages
- IAM roles and policies with least privilege access
- CloudWatch Logs for build execution monitoring

## Prerequisites

1. AWS account with appropriate permissions
2. Pulumi CLI installed
3. Node.js 18+ and npm
4. GitHub repository with OAuth connection
5. Pulumi access token stored in AWS Secrets Manager

## Configuration

Set the following configuration values:

```bash
pulumi config set githubOwner <your-github-username>
pulumi config set githubRepo <your-repo-name>
pulumi config set githubTokenArn <secrets-manager-arn>
pulumi config set pulumiTokenArn <secrets-manager-arn>
pulumi config set environmentSuffix <dev|staging|prod>
```

## Deployment

```bash
npm install
pulumi stack select <stack-name>
pulumi up
```

## Resources Created

- S3 Bucket: `pipeline-artifacts-{environmentSuffix}`
- CodeBuild Project: `pulumi-deploy-{environmentSuffix}`
- CodePipeline: `infrastructure-pipeline-{environmentSuffix}`
- IAM Roles: CodePipeline and CodeBuild service roles
- CloudWatch Log Group: `/aws/codebuild/pulumi-deploy-{environmentSuffix}`

## Cost Optimization

- CodeBuild uses BUILD_GENERAL1_SMALL compute type
- S3 artifacts expire after 30 days
- CloudWatch logs retained for 7 days

## Security

- S3 bucket encrypted at rest with SSE-S3
- IAM policies follow least privilege principle
- Sensitive tokens stored in AWS Secrets Manager
- CloudWatch logging enabled for audit trail
```
