# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This implementation creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, S3, IAM, and CloudWatch Logs. All resources are configured for automatic triggering via GitHub webhooks and include proper monitoring and security.

## File: lib/tap-stack.ts

```typescript
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
  public readonly s3WebsiteEndpoint: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const githubBranch = args.githubBranch || 'main';
    const tags = args.tags || {};
    const region = aws.getRegionOutput().name;

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}-${pulumi.getStack()}`,
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
        bucket: `deploy-target-${environmentSuffix}-${pulumi.getStack()}`,
        forceDestroy: true,
        website: {
          indexDocument: 'index.html',
          errorDocument: 'error.html',
        },
        tags: {
          ...tags,
          Name: `deploy-target-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Make deploy bucket publicly readable for website hosting
    const deployBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `deploy-public-access-${environmentSuffix}`,
      {
        bucket: deployBucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      { parent: this }
    );

    const deployBucketPolicy = new aws.s3.BucketPolicy(
      `deploy-bucket-policy-${environmentSuffix}`,
      {
        bucket: deployBucket.id,
        policy: deployBucket.arn.apply((arn) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `${arn}/*`,
              },
            ],
          })
        ),
      },
      { parent: this, dependsOn: [deployBucketPublicAccessBlock] }
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
          .apply(([bucketArn, logGroupArn, reg]) =>
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
                  Resource: [
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
                  Resource: [
                    logGroupArn,
                    `${logGroupArn}:*`,
                  ],
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
          .all([
            artifactBucket.arn,
            deployBucket.arn,
            codeBuildProject.arn,
          ])
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
                  Action: [
                    'codebuild:BatchGetBuilds',
                    'codebuild:StartBuild',
                  ],
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
        artifactStore: {
          location: artifactBucket.bucket,
          type: 'S3',
        },
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
    const githubWebhook = new aws.codepipeline.Webhook(
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
    this.pipelineUrl = pipeline.name.apply(
      (name) =>
        `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${name}/view?region=${region}`
    );
    this.s3WebsiteEndpoint = deployBucket.websiteEndpoint;

    // Register outputs
    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      deployBucketName: this.deployBucketName,
      codeBuildProjectName: this.codeBuildProjectName,
      pipelineUrl: this.pipelineUrl,
      s3WebsiteEndpoint: this.s3WebsiteEndpoint,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';
const githubOwner = config.require('githubOwner');
const githubRepo = config.require('githubRepo');
const githubBranch = config.get('githubBranch') || 'main';
const githubToken = config.requireSecret('githubToken');

const stack = new TapStack('tap-cicd-stack', {
  environmentSuffix,
  githubOwner,
  githubRepo,
  githubBranch,
  githubToken,
  tags: {
    Project: 'TAP',
    ManagedBy: 'Pulumi',
  },
});

export const artifactBucket = stack.artifactBucketName;
export const deployBucket = stack.deployBucketName;
export const codeBuildProject = stack.codeBuildProjectName;
export const pipelineExecutionUrl = stack.pipelineUrl;
export const s3WebsiteEndpoint = stack.s3WebsiteEndpoint;
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, S3, IAM, and CloudWatch Logs.

## Architecture

The infrastructure includes:

- **S3 Artifact Bucket**: Stores pipeline artifacts with versioning enabled
- **S3 Deploy Bucket**: Target for deployments, configured for static website hosting
- **CodeBuild Project**: Builds the application using Node.js 18 runtime
- **CodePipeline**: Three-stage pipeline (Source → Build → Deploy)
- **IAM Roles**: Least-privilege roles for CodePipeline and CodeBuild
- **CloudWatch Logs**: Build logs with 30-day retention
- **GitHub Webhook**: Automatic triggering on repository changes

## Prerequisites

1. AWS account with appropriate permissions
2. Pulumi CLI installed
3. Node.js 18+ installed
4. GitHub repository with a Node.js application
5. GitHub OAuth token with repo permissions

## Configuration

Set the following configuration values:

```bash
pulumi config set environmentSuffix dev
pulumi config set githubOwner your-github-username
pulumi config set githubRepo your-repo-name
pulumi config set githubBranch main
pulumi config set --secret githubToken ghp_your_github_token
```

## Deployment

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

- `artifactBucket`: S3 bucket name for pipeline artifacts
- `deployBucket`: S3 bucket name for deployment target
- `codeBuildProject`: CodeBuild project name
- `pipelineExecutionUrl`: URL to view pipeline execution history
- `s3WebsiteEndpoint`: S3 static website endpoint for deployed application

## Build Process

The CodeBuild project executes:

1. `npm install` - Install dependencies
2. `npm test` - Run tests
3. `npm run build` - Build application

Build output from the `build/` directory is deployed to the S3 website bucket.

## Pipeline Stages

1. **Source**: Pulls code from GitHub repository
2. **Build**: Runs CodeBuild project with Node.js 18 environment
3. **Deploy**: Deploys build artifacts to S3 bucket

## Security

- IAM roles follow least-privilege principle
- CodeBuild can only access artifact bucket and CloudWatch Logs
- CodePipeline can only access artifact/deploy buckets and start builds
- GitHub webhook uses HMAC authentication
- All resources are tagged for tracking

## Cleanup

```bash
pulumi destroy
```

All resources are configured with `forceDestroy: true` to enable complete cleanup.

## Monitoring

- CloudWatch Logs: `/aws/codebuild/build-project-{environmentSuffix}`
- Log retention: 30 days
- Pipeline execution history available in AWS Console

## Notes

- Build environment uses AWS Standard Linux 5.0 image
- Node.js 18 runtime is configured
- S3 website hosting is enabled on deploy bucket
- GitHub webhook triggers pipeline on branch commits
```

## File: package.json

```json
{
  "name": "tap-cicd-pipeline",
  "version": "1.0.0",
  "description": "Complete CI/CD pipeline infrastructure using Pulumi TypeScript",
  "main": "bin/tap.js",
  "scripts": {
    "build": "tsc",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./bin",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["lib/**/*", "bin/**/*"],
  "exclude": ["node_modules"]
}
```
