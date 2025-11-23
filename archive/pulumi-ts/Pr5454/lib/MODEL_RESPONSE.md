# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This implementation creates a complete CI/CD pipeline for containerized applications using AWS native services. The solution includes S3 artifact storage, ECR container registry, CodeBuild for Docker image building, and CodePipeline for orchestration with manual approval gates.

## Architecture Overview

The infrastructure consists of:
- S3 bucket for pipeline artifacts with versioning enabled
- ECR repository with lifecycle policies (retain last 10 images)
- CodeBuild project for Docker image builds
- CodePipeline with 3 stages: Source (GitHub v2), Build, Manual Approval
- IAM roles and policies following least privilege
- CloudWatch Events for pipeline state notifications
- Comprehensive tagging and outputs

## File: lib/cicd-pipeline-stack.ts

```typescript
/**
 * cicd-pipeline-stack.ts
 *
 * Defines the CI/CD Pipeline infrastructure stack for containerized applications.
 * Includes S3 artifacts, ECR repository, CodeBuild project, and CodePipeline with manual approval.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CicdPipelineStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubConnectionArn?: string;
  githubRepo?: string;
  githubBranch?: string;
}

export class CicdPipelineStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;

  constructor(name: string, args: CicdPipelineStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:cicd:CicdPipelineStack', name, args, opts);

    const { environmentSuffix, tags = {} } = args;
    const githubConnectionArn = args.githubConnectionArn || pulumi.output('arn:aws:codestar-connections:ap-southeast-1:123456789012:connection/sample');
    const githubRepo = args.githubRepo || 'owner/repository';
    const githubBranch = args.githubBranch || 'main';

    // Default tags for all resources
    const defaultTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'cicd-pipeline',
      ManagedBy: 'pulumi',
    }));

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new aws.s3.Bucket(`pipeline-artifacts-${environmentSuffix}`, {
      bucket: `pipeline-artifacts-${environmentSuffix}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256', // AWS managed S3 key (SSE-S3)
          },
        },
      },
      forceDestroy: true,
      tags: defaultTags,
    }, { parent: this });

    // Block public access to the artifact bucket
    new aws.s3.BucketPublicAccessBlock(`pipeline-artifacts-public-block-${environmentSuffix}`, {
      bucket: artifactBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // ECR Repository for Docker Images
    const ecrRepository = new aws.ecr.Repository(`app-repository-${environmentSuffix}`, {
      name: `app-repository-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      forceDelete: true,
      tags: defaultTags,
    }, { parent: this });

    // ECR Lifecycle Policy - Keep only last 10 images
    new aws.ecr.LifecyclePolicy(`app-repository-lifecycle-${environmentSuffix}`, {
      repository: ecrRepository.name,
      policy: JSON.stringify({
        rules: [{
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
        }],
      }),
    }, { parent: this });

    // IAM Role for CodeBuild
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

    // IAM Policy for CodeBuild - Least Privilege
    const codeBuildPolicy = new aws.iam.Policy(`codebuild-policy-${environmentSuffix}`, {
      name: `codebuild-policy-${environmentSuffix}`,
      policy: pulumi.all([artifactBucket.arn, ecrRepository.arn]).apply(([bucketArn, repoArn]) =>
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
              Resource: [
                `arn:aws:logs:ap-southeast-1:*:log-group:/aws/codebuild/docker-build-${environmentSuffix}`,
                `arn:aws:logs:ap-southeast-1:*:log-group:/aws/codebuild/docker-build-${environmentSuffix}:*`,
              ],
            },
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
        })
      ),
      tags: defaultTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`codebuild-policy-attachment-${environmentSuffix}`, {
      role: codeBuildRole.name,
      policyArn: codeBuildPolicy.arn,
    }, { parent: this });

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(`docker-build-${environmentSuffix}`, {
      name: `docker-build-${environmentSuffix}`,
      description: 'Build Docker images and push to ECR',
      serviceRole: codeBuildRole.arn,
      artifacts: {
        type: 'CODEPIPELINE',
      },
      environment: {
        type: 'LINUX_CONTAINER',
        computeType: 'BUILD_GENERAL1_SMALL',
        image: 'aws/codebuild/standard:5.0',
        privilegedMode: true,
        environmentVariables: [
          {
            name: 'AWS_DEFAULT_REGION',
            value: 'ap-southeast-1',
            type: 'PLAINTEXT',
          },
          {
            name: 'AWS_ACCOUNT_ID',
            value: aws.getCallerIdentity({}).then(id => id.accountId),
            type: 'PLAINTEXT',
          },
          {
            name: 'ECR_REPOSITORY_URI',
            value: ecrRepository.repositoryUrl,
            type: 'PLAINTEXT',
          },
          {
            name: 'IMAGE_TAG',
            value: 'latest',
            type: 'PLAINTEXT',
          },
        ],
      },
      source: {
        type: 'CODEPIPELINE',
        buildspec: `version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $ECR_REPOSITORY_URI:latest .
      - docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $ECR_REPOSITORY_URI:latest
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"app","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
`,
      },
      logsConfig: {
        cloudwatchLogs: {
          status: 'ENABLED',
          groupName: `/aws/codebuild/docker-build-${environmentSuffix}`,
        },
      },
      buildTimeout: 20,
      tags: defaultTags,
    }, { parent: this });

    // IAM Role for CodePipeline
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

    // IAM Policy for CodePipeline - Least Privilege
    const codePipelinePolicy = new aws.iam.Policy(`codepipeline-policy-${environmentSuffix}`, {
      name: `codepipeline-policy-${environmentSuffix}`,
      policy: pulumi.all([artifactBucket.arn, codeBuildProject.arn]).apply(([bucketArn, buildArn]) =>
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
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              Resource: bucketArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
              Resource: buildArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'codestar-connections:UseConnection',
              ],
              Resource: githubConnectionArn,
            },
          ],
        })
      ),
      tags: defaultTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`codepipeline-policy-attachment-${environmentSuffix}`, {
      role: codePipelineRole.name,
      policyArn: codePipelinePolicy.arn,
    }, { parent: this });

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(`cicd-pipeline-${environmentSuffix}`, {
      name: `cicd-pipeline-${environmentSuffix}`,
      roleArn: codePipelineRole.arn,
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
            owner: 'AWS',
            provider: 'CodeStarSourceConnection',
            version: '1',
            outputArtifacts: ['source_output'],
            configuration: {
              ConnectionArn: githubConnectionArn,
              FullRepositoryId: githubRepo,
              BranchName: githubBranch,
              OutputArtifactFormat: 'CODE_ZIP',
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
          name: 'Approval',
          actions: [{
            name: 'ManualApproval',
            category: 'Approval',
            owner: 'AWS',
            provider: 'Manual',
            version: '1',
            configuration: {
              CustomData: 'Please review the build artifacts before deployment',
            },
          }],
        },
      ],
      tags: defaultTags,
    }, { parent: this });

    // CloudWatch Event Rule for Pipeline State Changes
    const pipelineEventRule = new aws.cloudwatch.EventRule(`pipeline-state-change-${environmentSuffix}`, {
      name: `pipeline-state-change-${environmentSuffix}`,
      description: 'Capture pipeline state changes',
      eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"]
  }
}`,
      tags: defaultTags,
    }, { parent: this });

    // CloudWatch Log Group for Event Rule Target
    const eventLogGroup = new aws.cloudwatch.LogGroup(`pipeline-events-${environmentSuffix}`, {
      name: `/aws/events/pipeline-${environmentSuffix}`,
      retentionInDays: 7,
      tags: defaultTags,
    }, { parent: this });

    // Event Target - CloudWatch Logs
    new aws.cloudwatch.EventTarget(`pipeline-event-target-${environmentSuffix}`, {
      rule: pipelineEventRule.name,
      arn: eventLogGroup.arn,
    }, { parent: this });

    // Outputs
    this.pipelineUrl = pulumi.interpolate`https://ap-southeast-1.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.artifactBucketName = artifactBucket.id;
    this.buildProjectName = codeBuildProject.name;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: this.buildProjectName,
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
import { CicdPipelineStack } from './cicd-pipeline-stack';

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
   * GitHub connection ARN for CodePipeline source
   */
  githubConnectionArn?: string;

  /**
   * GitHub repository in format owner/repo
   */
  githubRepo?: string;

  /**
   * GitHub branch to track
   */
  githubBranch?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;

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

    // Instantiate CI/CD Pipeline Stack
    const cicdStack = new CicdPipelineStack('cicd-pipeline', {
      environmentSuffix: environmentSuffix,
      tags: tags,
      githubConnectionArn: args.githubConnectionArn,
      githubRepo: args.githubRepo,
      githubBranch: args.githubBranch,
    }, { parent: this });

    // Expose outputs from nested components
    this.pipelineUrl = cicdStack.pipelineUrl;
    this.ecrRepositoryUri = cicdStack.ecrRepositoryUri;
    this.artifactBucketName = cicdStack.artifactBucketName;
    this.buildProjectName = cicdStack.buildProjectName;

    // Register the outputs of this component
    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: this.buildProjectName,
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
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// GitHub configuration for CodePipeline
const githubConnectionArn = config.get('githubConnectionArn');
const githubRepo = config.get('githubRepo') || 'owner/repository';
const githubBranch = config.get('githubBranch') || 'main';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: 'cicd-pipeline',
  ManagedBy: 'pulumi',
};

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
  githubConnectionArn: githubConnectionArn,
  githubRepo: githubRepo,
  githubBranch: githubBranch,
});

// Export stack outputs
export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
export const artifactBucketName = stack.artifactBucketName;
export const buildProjectName = stack.buildProjectName;
```

## Implementation Notes

### Resource Naming
All resources use the `environmentSuffix` pattern for multi-environment support:
- S3 Bucket: `pipeline-artifacts-${environmentSuffix}`
- ECR Repository: `app-repository-${environmentSuffix}`
- CodeBuild Project: `docker-build-${environmentSuffix}`
- CodePipeline: `cicd-pipeline-${environmentSuffix}`
- IAM Roles: `codebuild-role-${environmentSuffix}`, `codepipeline-role-${environmentSuffix}`

### Security Features
- S3 bucket public access blocked completely
- S3 encryption using AWS managed keys (SSE-S3) as required
- ECR image scanning enabled on push
- IAM policies follow least privilege (no wildcard actions)
- CloudWatch logging for build and event tracking

### Cost Optimization
- CodeBuild uses BUILD_GENERAL1_SMALL compute type
- CloudWatch logs retention set to 7 days
- ECR lifecycle policy limits images to 10 (automatic cleanup)
- S3 bucket set to force destroy for easy cleanup

### Pipeline Configuration
- Source stage uses GitHub v2 connection (CodeStarSourceConnection)
- Build stage compiles Docker images with commit hash tagging
- Manual approval gate before deployment
- Build timeout: 20 minutes maximum

### Tagging Strategy
All resources tagged with:
- Environment: `${environmentSuffix}`
- Project: `cicd-pipeline`
- ManagedBy: `pulumi`

### Stack Outputs
- `pipelineUrl`: Console URL for the pipeline
- `ecrRepositoryUri`: ECR repository URI for Docker push/pull
- `artifactBucketName`: S3 bucket name for artifacts
- `buildProjectName`: CodeBuild project name

### Region Configuration
All resources deployed to `ap-southeast-1` as specified in the requirements.

### GitHub Integration
The pipeline requires:
- CodeStar Connection ARN (for GitHub v2 integration)
- Repository in format `owner/repository`
- Branch name (defaults to `main`)

These can be configured via Pulumi config:
```bash
pulumi config set githubConnectionArn arn:aws:codestar-connections:ap-southeast-1:123456789012:connection/xxx
pulumi config set githubRepo myorg/myrepo
pulumi config set githubBranch main
```

### Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure AWS region:
```bash
pulumi config set aws:region ap-southeast-1
```

3. Set GitHub connection (create CodeStar connection first in AWS Console):
```bash
pulumi config set githubConnectionArn arn:aws:codestar-connections:ap-southeast-1:ACCOUNT_ID:connection/CONNECTION_ID
pulumi config set githubRepo owner/repository
```

4. Deploy:
```bash
pulumi up
```

5. Access outputs:
```bash
pulumi stack output pipelineUrl
pulumi stack output ecrRepositoryUri
```
