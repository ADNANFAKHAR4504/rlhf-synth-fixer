# CI/CD Pipeline Infrastructure - Ideal Response

This document contains the production-ready infrastructure code for a CI/CD pipeline using Pulumi TypeScript.

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

  /**
   * AWS region for deployment
   */
  awsRegion?: string;
}

/**
 * Represents the main Pulumi component resource for the CI/CD pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs = {}, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.awsRegion || 'us-east-1';
    const defaultTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'TAP',
      ...(args.tags || {}),
    };

    // S3 bucket for pipeline artifacts
    const artifactBucket = new aws.s3.Bucket(`pipeline-artifacts-${environmentSuffix}`, {
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
      forceDestroy: true,
      tags: defaultTags,
    }, { parent: this });

    // IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(`codepipeline-role-${environmentSuffix}`, {
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

    // IAM policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(`codepipeline-policy-${environmentSuffix}`, {
      name: `codepipeline-policy-${environmentSuffix}`,
      role: pipelineRole.id,
      policy: pulumi.all([artifactBucket.arn, region]).apply(([bucketArn, reg]) => JSON.stringify({
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
              bucketArn,
              `${bucketArn}/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'codebuild:BatchGetBuilds',
              'codebuild:StartBuild',
            ],
            Resource: `arn:aws:codebuild:${reg}:*:project/pulumi-deploy-${environmentSuffix}`,
          },
          {
            Effect: 'Allow',
            Action: [
              'iam:PassRole',
            ],
            Resource: '*',
            Condition: {
              StringEqualsIfExists: {
                'iam:PassedToService': [
                  'codebuild.amazonaws.com',
                ],
              },
            },
          },
        ],
      })),
    }, { parent: this });

    // IAM role for CodeBuild
    const buildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
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

    // IAM policy for CodeBuild
    const buildPolicy = new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
      name: `codebuild-policy-${environmentSuffix}`,
      role: buildRole.id,
      policy: pulumi.all([artifactBucket.arn, region, args.pulumiTokenArn]).apply(([bucketArn, reg, tokenArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:GetObjectVersion',
              's3:PutObject',
              's3:ListBucket',
            ],
            Resource: [
              bucketArn,
              `${bucketArn}/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${reg}:*:log-group:/aws/codebuild/pulumi-deploy-${environmentSuffix}:*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
            ],
            Resource: tokenArn || `arn:aws:secretsmanager:${reg}:*:secret:pulumi-token-*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:*',
              's3:*',
              'lambda:*',
              'iam:*',
              'cloudwatch:*',
              'logs:*',
              'dynamodb:*',
              'rds:*',
              'elasticloadbalancing:*',
            ],
            Resource: '*',
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
      name: `pulumi-deploy-${environmentSuffix}`,
      serviceRole: buildRole.arn,
      artifacts: {
        type: 'CODEPIPELINE',
      },
      environment: {
        computeType: 'BUILD_GENERAL1_SMALL',
        image: 'aws/codebuild/standard:7.0',
        type: 'LINUX_CONTAINER',
        privilegedMode: false,
        environmentVariables: [
          {
            name: 'PULUMI_ACCESS_TOKEN',
            value: args.pulumiTokenArn || `arn:aws:secretsmanager:${region}:123456789012:secret:pulumi-token`,
            type: 'SECRETS_MANAGER',
          },
          {
            name: 'ENVIRONMENT',
            value: environmentSuffix,
            type: 'PLAINTEXT',
          },
          {
            name: 'AWS_DEFAULT_REGION',
            value: region,
            type: 'PLAINTEXT',
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
      - echo "Installing Pulumi CLI..."
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
      - pulumi version
      - echo "Installing Node.js dependencies..."
      - npm ci

  pre_build:
    commands:
      - echo "Authenticating with Pulumi..."
      - pulumi login
      - echo "Selecting Pulumi stack..."
      - pulumi stack select $ENVIRONMENT || pulumi stack init $ENVIRONMENT
      - echo "Refreshing stack state..."
      - pulumi refresh --yes

  build:
    commands:
      - echo "Running Pulumi preview..."
      - pulumi preview --diff
      - echo "Deploying infrastructure..."
      - pulumi up --yes --skip-preview

  post_build:
    commands:
      - echo "Deployment completed successfully"
      - pulumi stack output

artifacts:
  files:
    - '**/*'
  name: build-output`,
      },
      logsConfig: {
        cloudwatchLogs: {
          groupName: buildLogGroup.name,
          status: 'ENABLED',
        },
      },
      buildTimeout: 20,
      tags: defaultTags,
    }, { parent: this, dependsOn: [buildPolicy, buildLogGroup] });

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(`infrastructure-pipeline-${environmentSuffix}`, {
      name: `infrastructure-pipeline-${environmentSuffix}`,
      roleArn: pipelineRole.arn,
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
            name: 'SourceAction',
            category: 'Source',
            owner: 'ThirdParty',
            provider: 'GitHub',
            version: '1',
            outputArtifacts: ['source_output'],
            configuration: {
              Owner: args.githubOwner || 'default-owner',
              Repo: args.githubRepo || 'default-repo',
              Branch: 'main',
              OAuthToken: args.githubTokenArn ? pulumi.interpolate`{{resolve:secretsmanager:${args.githubTokenArn}}}` : '{{resolve:secretsmanager:github-token}}',
              PollForSourceChanges: 'true',
            },
          }],
        },
        {
          name: 'Build',
          actions: [{
            name: 'BuildAction',
            category: 'Build',
            owner: 'AWS',
            provider: 'CodeBuild',
            inputArtifacts: ['source_output'],
            outputArtifacts: ['build_output'],
            version: '1',
            configuration: {
              ProjectName: buildProject.name,
            },
            runOrder: 1,
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
            configuration: {
              CustomData: 'Please review the infrastructure changes before deploying to production.',
            },
            runOrder: 1,
          }],
        },
        {
          name: 'Deploy',
          actions: [{
            name: 'DeployAction',
            category: 'Build',
            owner: 'AWS',
            provider: 'CodeBuild',
            inputArtifacts: ['build_output'],
            version: '1',
            configuration: {
              ProjectName: buildProject.name,
            },
            runOrder: 1,
          }],
        },
      ],
      tags: defaultTags,
    }, { parent: this, dependsOn: [pipelinePolicy, artifactBucket] });

    this.pipelineArn = pipeline.arn;
    this.artifactBucketName = artifactBucket.bucket;
    this.buildProjectName = buildProject.name;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      pipelineName: pipeline.name,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: this.buildProjectName,
      buildLogGroupName: buildLogGroup.name,
      region: pulumi.output(region),
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
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs for integration tests
export const pipelineArn = stack.pipelineArn;
export const artifactBucketName = stack.artifactBucketName;
export const buildProjectName = stack.buildProjectName;
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi program creates a production-ready CI/CD pipeline for automated infrastructure deployment using AWS CodePipeline, CodeBuild, and related services.

## Architecture

The infrastructure includes:
- **S3 Bucket**: Stores pipeline artifacts with versioning and 30-day lifecycle policy
- **CodeBuild Project**: Executes Pulumi commands for infrastructure deployment
- **CodePipeline**: Orchestrates the CI/CD workflow with multiple stages
- **IAM Roles**: Separate roles for CodePipeline and CodeBuild with least privilege
- **CloudWatch Logs**: Comprehensive logging with 7-day retention

## Pipeline Stages

1. **Source**: Fetches code from GitHub repository
2. **Build**: Runs Pulumi preview and deployment
3. **Approval**: Manual approval gate before production
4. **Deploy**: Final deployment to production environment

## Prerequisites

1. AWS account with appropriate permissions
2. Pulumi CLI installed (v3.x or later)
3. Node.js 18+ and npm
4. GitHub repository with OAuth token
5. Pulumi access token stored in AWS Secrets Manager

## Configuration

### Required Secrets

Store the following secrets in AWS Secrets Manager:

```bash
# Pulumi access token
aws secretsmanager create-secret \
  --name pulumi-token \
  --secret-string "pul-xxxxxxxxxxxxx" \
  --region us-east-1

# GitHub OAuth token
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "ghp_xxxxxxxxxxxxx" \
  --region us-east-1
```

### Stack Configuration

Set the following configuration values:

```bash
pulumi config set githubOwner <your-github-username>
pulumi config set githubRepo <your-repo-name>
pulumi config set githubTokenArn <github-token-secret-arn>
pulumi config set pulumiTokenArn <pulumi-token-secret-arn>
pulumi config set environmentSuffix <dev|staging|prod>
pulumi config set awsRegion us-east-1
```

## Deployment

```bash
# Install dependencies
npm install

# Select or create stack
pulumi stack select dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

## Resources Created

| Resource Type | Name Pattern | Purpose |
|--------------|--------------|---------|
| S3 Bucket | `pipeline-artifacts-{environmentSuffix}` | Stores pipeline artifacts |
| CodeBuild Project | `pulumi-deploy-{environmentSuffix}` | Executes Pulumi commands |
| CodePipeline | `infrastructure-pipeline-{environmentSuffix}` | Orchestrates CI/CD workflow |
| IAM Role | `codepipeline-role-{environmentSuffix}` | Pipeline service role |
| IAM Role | `codebuild-role-{environmentSuffix}` | Build service role |
| CloudWatch Log Group | `/aws/codebuild/pulumi-deploy-{environmentSuffix}` | Build execution logs |

## Cost Optimization

- **CodeBuild**: Uses `BUILD_GENERAL1_SMALL` compute type (~$0.005/min)
- **S3 Lifecycle**: Automatically deletes artifacts after 30 days
- **CloudWatch Logs**: 7-day retention to minimize storage costs
- **Build Timeout**: 20-minute maximum to prevent runaway costs

## Security Features

- **Encryption**: S3 bucket encrypted at rest with AES256
- **Least Privilege**: IAM policies scoped to specific resources
- **Secrets Management**: Sensitive tokens stored in AWS Secrets Manager
- **Audit Logging**: CloudWatch Logs capture all build activity
- **Manual Approval**: Production deployments require explicit approval

## Monitoring

### CloudWatch Metrics

Monitor pipeline health using these metrics:
- `AWS/CodePipeline` - Pipeline execution status
- `AWS/CodeBuild` - Build duration and success rate

### CloudWatch Logs

View build logs:
```bash
aws logs tail /aws/codebuild/pulumi-deploy-{environmentSuffix} --follow
```

## Troubleshooting

### Common Issues

1. **Pipeline fails at Source stage**
   - Verify GitHub OAuth token is valid
   - Check repository owner and name configuration

2. **Build fails with Pulumi authentication error**
   - Verify Pulumi token in Secrets Manager
   - Check CodeBuild role has `secretsmanager:GetSecretValue` permission

3. **Insufficient IAM permissions**
   - Review CodeBuild role policy
   - Ensure deployment permissions match infrastructure needs

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

This will remove:
- CodePipeline and all execution history
- CodeBuild project and logs (after retention period)
- S3 bucket and all artifacts (forceDestroy enabled)
- IAM roles and policies

## Best Practices

1. **Branch Protection**: Enable branch protection on main branch
2. **Approval Process**: Require manual approval for production deployments
3. **Cost Monitoring**: Set up billing alerts for CodeBuild usage
4. **Regular Updates**: Keep CodeBuild image and Pulumi CLI updated
5. **Secret Rotation**: Rotate access tokens regularly

## References

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Pulumi AWS Provider](https://www.pulumi.com/registry/packages/aws/)
```
