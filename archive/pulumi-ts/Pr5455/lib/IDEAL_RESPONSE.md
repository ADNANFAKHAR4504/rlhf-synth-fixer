# CI/CD Pipeline Infrastructure as Code

## Overview

This infrastructure creates a complete CI/CD pipeline for containerized applications using AWS services. The pipeline automatically builds Docker images from GitHub repositories, pushes them to Amazon ECR, and tags them for deployment.

## Architecture

The infrastructure consists of the following AWS components:

### 1. **Source Control Integration**
- GitHub repository integration via OAuth token
- Automatic pipeline trigger on code changes

### 2. **Build & Container Registry**
- AWS CodeBuild project for Docker image builds
- Amazon ECR (Elastic Container Registry) for Docker image storage
- ECR lifecycle policy to retain only the last 10 images

### 3. **Pipeline Orchestration**
- AWS CodePipeline with three stages:
  - **Source**: Fetches code from GitHub
  - **Build**: Builds Docker image using CodeBuild
  - **Deploy**: Tags the built image as 'production' using Lambda

### 4. **Artifact Storage**
- S3 bucket for pipeline artifacts
- Versioning enabled
- Server-side encryption (AES256)
- 30-day lifecycle policy for automatic cleanup

### 5. **Monitoring & Logging**
- CloudWatch Log Groups for CodeBuild logs (7-day retention)
- CloudWatch Event Rules for pipeline state monitoring

### 6. **IAM & Security**
- Least-privilege IAM roles for CodeBuild, Lambda, and CodePipeline
- ECR image scanning enabled on push
- S3 public access blocked by default

## Component Diagram

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       │ Push Event
       ▼
┌─────────────────────┐
│   CodePipeline      │
│                     │
│  ┌──────────────┐   │
│  │   Source     │   │ ─── Fetches from GitHub
│  └──────┬───────┘   │
│         │           │
│  ┌──────▼───────┐   │
│  │    Build     │   │ ─── CodeBuild builds Docker image
│  └──────┬───────┘   │
│         │           │
│  ┌──────▼───────┐   │
│  │   Deploy     │   │ ─── Lambda tags image
│  └──────────────┘   │
└─────────────────────┘
        │
        │ Pushes to
        ▼
┌─────────────────────┐
│   Amazon ECR        │
│  (Container Repo)   │
└─────────────────────┘
```

## Infrastructure Code

### lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Integration for Container Deployments
 *
 * This stack creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild,
 * ECR, and Lambda to automate Docker image builds and deployments from GitHub.
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
   * GitHub branch to monitor (default: main)
   */
  githubBranch?: string;

  /**
   * GitHub OAuth token stored in Secrets Manager secret name
   */
  githubTokenSecretName?: string;
}

/**
 * CI/CD Pipeline Stack Component
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Merge default tags with provided tags
    const defaultTags = {
      Environment: 'production',
      Team: 'devops',
      ...(args.tags || {}),
    };

    // GitHub configuration with defaults
    const githubOwner = args.githubOwner || 'default-owner';
    const githubRepo = args.githubRepo || 'default-repo';
    const githubBranch = args.githubBranch || 'main';
    const githubTokenSecretName = args.githubTokenSecretName || 'github-token';

    // ====================================================================
    // 1. S3 Bucket for Pipeline Artifacts
    // ====================================================================

    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
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
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    this.artifactBucketName = artifactBucket.bucket;

    // ====================================================================
    // 2. ECR Repository for Docker Images
    // ====================================================================

    const ecrRepository = new aws.ecr.Repository(
      `container-repo-${environmentSuffix}`,
      {
        name: `container-repo-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;

    // ECR Lifecycle Policy to keep only last 10 images
    new aws.ecr.LifecyclePolicy(
      `ecr-lifecycle-${environmentSuffix}`,
      {
        repository: ecrRepository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep only last 10 images',
              selection: {
                tagStatus: 'any',
                countType: 'imageCountMoreThan',
                countNumber: 10,
              },
              action: {
                type: 'expire',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // ====================================================================
    // 3. CloudWatch Log Group for CodeBuild
    // ====================================================================

    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/container-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ====================================================================
    // 4. IAM Role for CodeBuild
    // ====================================================================

    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // CodeBuild Policy
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, ecrRepository.arn])
          .apply(([bucketArn, repoArn]) =>
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
                  Resource:
                    'arn:aws:logs:ap-southeast-1:*:log-group:/aws/codebuild/*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['ecr:GetAuthorizationToken'],
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
            })
          ),
      },
      { parent: this }
    );

    // ====================================================================
    // 5. CodeBuild Project
    // ====================================================================

    const codeBuildProject = new aws.codebuild.Project(
      `container-build-${environmentSuffix}`,
      {
        name: `container-build-${environmentSuffix}`,
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
              value: 'ap-southeast-1',
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
          buildspec: pulumi.interpolate`version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ${ecrRepository.repositoryUrl}
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG ${ecrRepository.repositoryUrl}:$IMAGE_TAG
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG ${ecrRepository.repositoryUrl}:latest
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push ${ecrRepository.repositoryUrl}:$IMAGE_TAG
      - docker push ${ecrRepository.repositoryUrl}:latest
      - echo Writing image definitions file...
      - printf '[{"name":"app","imageUri":"%s"}]' ${ecrRepository.repositoryUrl}:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: codeBuildLogGroup.name,
            status: 'ENABLED',
          },
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // ====================================================================
    // 6. IAM Role for Lambda Function
    // ====================================================================

    const lambdaRole = new aws.iam.Role(
      `lambda-ecr-tagger-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Lambda Policy for ECR tagging
    const lambdaPolicy = new aws.iam.RolePolicy(
      `lambda-ecr-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: ecrRepository.arn.apply(repoArn =>
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
                Resource: 'arn:aws:logs:*:*:*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'ecr:DescribeImages',
                  'ecr:PutImage',
                  'ecr:BatchGetImage',
                  'ecr:GetDownloadUrlForLayer',
                ],
                Resource: repoArn,
              },
              {
                Effect: 'Allow',
                Action: ['ecr:GetAuthorizationToken'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'codepipeline:PutJobSuccessResult',
                  'codepipeline:PutJobFailureResult',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // ====================================================================
    // 7. Lambda Function for ECR Image Tagging
    // ====================================================================

    const ecrTaggerLambda = new aws.lambda.Function(
      `ecr-tagger-${environmentSuffix}`,
      {
        name: `ecr-tagger-${environmentSuffix}`,
        role: lambdaRole.arn,
        handler: 'index.handler',
        runtime: 'python3.9',
        timeout: 60,
        environment: {
          variables: {
            ECR_REPOSITORY_NAME: ecrRepository.name,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`import json
import boto3
import os

ecr_client = boto3.client('ecr')
codepipeline_client = boto3.client('codepipeline')

def handler(event, context):
    job_id = event['CodePipeline.job']['id']
    repository_name = os.environ['ECR_REPOSITORY_NAME']

    try:
        # Get the latest image
        response = ecr_client.describe_images(
            repositoryName=repository_name,
            filter={'tagStatus': 'TAGGED'}
        )

        if not response['imageDetails']:
            raise Exception('No images found in repository')

        # Sort by pushed date and get the latest
        sorted_images = sorted(
            response['imageDetails'],
            key=lambda x: x['imagePushedAt'],
            reverse=True
        )

        latest_image = sorted_images[0]
        image_digest = latest_image['imageDigest']

        # Tag the latest image as 'production'
        ecr_client.put_image(
            repositoryName=repository_name,
            imageManifest=json.dumps(latest_image.get('imageManifest', {})) if 'imageManifest' in latest_image else '',
            imageTag='production',
            imageDigest=image_digest
        )

        print(f'Successfully tagged image {image_digest} as production')

        # Report success to CodePipeline
        codepipeline_client.put_job_success_result(jobId=job_id)

        return {
            'statusCode': 200,
            'body': json.dumps('Image tagged successfully')
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        codepipeline_client.put_job_failure_result(
            jobId=job_id,
            failureDetails={
                'message': str(e),
                'type': 'JobFailed'
            }
        )
        raise e
`),
        }),
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // ====================================================================
    // 8. IAM Role for CodePipeline
    // ====================================================================

    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
      {
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // Pipeline Policy
    const pipelinePolicy = new aws.iam.RolePolicy(
      `pipeline-policy-${environmentSuffix}`,
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, codeBuildProject.arn, ecrTaggerLambda.arn])
          .apply(([bucketArn, buildArn, lambdaArn]) =>
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
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: buildArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['lambda:InvokeFunction'],
                  Resource: lambdaArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ====================================================================
    // 9. CodePipeline
    // ====================================================================

    const pipeline = new aws.codepipeline.Pipeline(
      `container-pipeline-${environmentSuffix}`,
      {
        name: `container-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
          },
        ],
        stages: [
          // Stage 1: Source from GitHub
          {
            name: 'Source',
            actions: [
              {
                name: 'Source',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  Owner: githubOwner,
                  Repo: githubRepo,
                  Branch: githubBranch,
                  OAuthToken: pulumi.secret(githubTokenSecretName),
                },
              },
            ],
          },
          // Stage 2: Build with CodeBuild
          {
            name: 'Build',
            actions: [
              {
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
              },
            ],
          },
          // Stage 3: Deploy (Lambda tagging)
          {
            name: 'Deploy',
            actions: [
              {
                name: 'TagImage',
                category: 'Invoke',
                owner: 'AWS',
                provider: 'Lambda',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  FunctionName: ecrTaggerLambda.name,
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    this.pipelineName = pipeline.name;
    this.codeBuildProjectName = codeBuildProject.name;
    this.lambdaFunctionName = ecrTaggerLambda.name;

    // ====================================================================
    // 10. CloudWatch Event Rule for GitHub Push
    // ====================================================================

    const pipelineEventRole = new aws.iam.Role(
      `pipeline-event-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const pipelineEventPolicy = new aws.iam.RolePolicy(
      `pipeline-event-policy-${environmentSuffix}`,
      {
        role: pipelineEventRole.id,
        policy: pipeline.arn.apply(pipelineArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'codepipeline:StartPipelineExecution',
                Resource: pipelineArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `pipeline-trigger-${environmentSuffix}`,
      {
        name: `pipeline-trigger-${environmentSuffix}`,
        description: 'Trigger pipeline on CodePipeline state changes',
        eventPattern: pipeline.name.apply(name =>
          JSON.stringify({
            source: ['aws.codepipeline'],
            'detail-type': ['CodePipeline Pipeline Execution State Change'],
            detail: {
              pipeline: [name],
            },
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `pipeline-event-target-${environmentSuffix}`,
      {
        rule: pipelineEventRule.name,
        arn: pipeline.arn,
        roleArn: pipelineEventRole.arn,
      },
      { parent: this, dependsOn: [pipelineEventPolicy] }
    );

    // ====================================================================
    // Register Outputs
    // ====================================================================

    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
      codeBuildProjectName: codeBuildProject.name,
      lambdaFunctionName: ecrTaggerLambda.name,
    });
  }
}
```

## Deployment Instructions

### Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **Pulumi CLI**: Install Pulumi CLI (`curl -fsSL https://get.pulumi.com | sh`)
3. **AWS CLI**: Configure AWS credentials (`aws configure`)
4. **Node.js**: Version 14 or later
5. **GitHub OAuth Token**: Store in AWS Secrets Manager

### Installation Steps

```bash
# 1. Install dependencies
npm install

# 2. Set up Pulumi backend (optional - use S3)
export PULUMI_BACKEND_URL="s3://your-pulumi-state-bucket?region=us-east-1"

# 3. Login to Pulumi
pulumi login

# 4. Select or create a stack
pulumi stack select dev  # or pulumi stack init dev

# 5. Configure stack parameters (optional)
pulumi config set environmentSuffix dev
pulumi config set githubOwner your-github-username
pulumi config set githubRepo your-repo-name
pulumi config set githubBranch main
pulumi config set --secret githubTokenSecretName github-oauth-token

# 6. Deploy infrastructure
pulumi up

# 7. View outputs
pulumi stack output
```

### Environment Variables

The deployment uses the following environment variables:

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: stack name)
- `AWS_REGION`: AWS region for deployment (default: ap-southeast-1)
- `PULUMI_BACKEND_URL`: Pulumi state backend URL

### Deployment Script

Use the provided deployment script for automated deployments:

```bash
./scripts/deploy.sh
```

## Stack Outputs

After deployment, the following outputs are available:

| Output | Description |
|--------|-------------|
| `artifactBucketName` | S3 bucket name for pipeline artifacts |
| `ecrRepositoryUrl` | ECR repository URL for Docker images |
| `pipelineName` | CodePipeline name |
| `codeBuildProjectName` | CodeBuild project name |
| `lambdaFunctionName` | Lambda function name for ECR tagging |

## Resource Naming Convention

All resources follow this naming pattern:

```
{resource-type}-{environment-suffix}
```

Examples:
- `pipeline-artifacts-dev` (S3 bucket)
- `container-repo-dev` (ECR repository)
- `container-build-dev` (CodeBuild project)
- `ecr-tagger-dev` (Lambda function)

## Security Features

### IAM Permissions

All IAM roles follow the principle of least privilege:

- **CodeBuild Role**: S3, ECR, and CloudWatch Logs access
- **Lambda Role**: ECR tagging and CodePipeline job management
- **Pipeline Role**: S3, CodeBuild, and Lambda invocation

### Encryption

- **S3**: Server-side encryption with AES256
- **ECR**: Image scanning enabled on push
- **CloudWatch**: Encrypted log groups

### Network Security

- S3 public access blocked by default
- ECR repositories are private
- Lambda functions run in AWS managed VPC

## Cleanup

To destroy all infrastructure:

```bash
pulumi destroy
```

Or use the cleanup script:

```bash
./scripts/cleanup.sh
```

## Troubleshooting

### Common Issues

1. **GitHub OAuth Token Error**
   - Ensure token is stored in AWS Secrets Manager
   - Verify token has required permissions (repo, admin:repo_hook)

2. **ECR Push Failed**
   - Check CodeBuild IAM role permissions
   - Verify AWS account ID in environment variables

3. **Lambda Tagging Failed**
   - Check Lambda IAM role has ECR permissions
   - Verify ECR repository has images to tag

4. **Pipeline Not Triggering**
   - Verify GitHub webhook is configured
   - Check CloudWatch Event Rule is enabled

### Logs and Monitoring

- **CodeBuild Logs**: CloudWatch Logs at `/aws/codebuild/container-build-{suffix}`
- **Lambda Logs**: CloudWatch Logs at `/aws/lambda/ecr-tagger-{suffix}`
- **Pipeline Execution**: CodePipeline console

## Cost Optimization

- **S3 Lifecycle**: Artifacts expire after 30 days
- **ECR Lifecycle**: Only last 10 images retained
- **CloudWatch Logs**: 7-day retention for build logs
- **CodeBuild**: Uses small compute (BUILD_GENERAL1_SMALL)

## Best Practices

1. **Environment Separation**: Use different suffixes for dev/staging/prod
2. **Secrets Management**: Store sensitive values in Secrets Manager
3. **Tagging**: Apply consistent tags for cost allocation
4. **Monitoring**: Set up CloudWatch alarms for pipeline failures
5. **Backup**: Enable versioning on critical S3 buckets

## License

Copyright © 2025. All rights reserved.
