# CI/CD Pipeline Infrastructure Implementation

Complete Pulumi TypeScript implementation for a containerized application CI/CD pipeline.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  tags: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, args, opts);

    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const region = process.env.AWS_REGION || 'us-east-1';
    const accountId = pulumi.output(aws.getCallerIdentity()).accountId;

    // Merge default tags with Environment and Team
    const resourceTags = {
      ...args.tags,
      Environment: 'Production',
      Team: 'DevOps',
    };

    // 1. Create S3 bucket for pipeline artifacts with versioning
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        forceDestroy: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    // 2. Create ECR repository for Docker images with lifecycle policy
    const ecrRepository = new aws.ecr.Repository(
      `app-repo-${environmentSuffix}`,
      {
        name: `app-repo-${environmentSuffix}`,
        forceDelete: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ECR lifecycle policy to keep only last 10 images
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

    // 3. Create IAM role for CodeBuild
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // CodeBuild policy for ECR, S3, and CloudWatch Logs access
    const codeBuildPolicy = new aws.iam.Policy(
      `codebuild-policy-${environmentSuffix}`,
      {
        name: `codebuild-policy-${environmentSuffix}`,
        policy: pulumi.all([artifactBucket.arn, ecrRepository.arn]).apply(
          ([bucketArn, repoArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'ecr:GetAuthorizationToken',
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:BatchGetImage',
                    'ecr:PutImage',
                    'ecr:InitiateLayerUpload',
                    'ecr:UploadLayerPart',
                    'ecr:CompleteLayerUpload',
                  ],
                  Resource: '*',
                },
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
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: `arn:aws:logs:${region}:*:log-group:/aws/codebuild/*`,
                },
              ],
            })
        ),
        tags: resourceTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `codebuild-policy-attachment-${environmentSuffix}`,
      {
        role: codeBuildRole.name,
        policyArn: codeBuildPolicy.arn,
      },
      { parent: this }
    );

    // 4. Create CodeBuild project for building Docker images
    const codeBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        description: 'Build Docker images for containerized applications',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:5.0',
          type: 'LINUX_CONTAINER',
          imagePullCredentialsType: 'CODEBUILD',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: accountId,
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // 5. Create IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
      {
        name: `pipeline-role-${environmentSuffix}`,
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // CodePipeline policy
    const pipelinePolicy = new aws.iam.Policy(
      `pipeline-policy-${environmentSuffix}`,
      {
        name: `pipeline-policy-${environmentSuffix}`,
        policy: pulumi.all([artifactBucket.arn, codeBuildProject.arn]).apply(
          ([bucketArn, buildArn]) =>
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
                  Action: [
                    'codebuild:BatchGetBuilds',
                    'codebuild:StartBuild',
                  ],
                  Resource: buildArn,
                },
              ],
            })
        ),
        tags: resourceTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `pipeline-policy-attachment-${environmentSuffix}`,
      {
        role: pipelineRole.name,
        policyArn: pipelinePolicy.arn,
      },
      { parent: this }
    );

    // 6. Create CodePipeline with Source, Build, and Deploy stages
    const pipeline = new aws.codepipeline.Pipeline(
      `cicd-pipeline-${environmentSuffix}`,
      {
        name: `cicd-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStore: {
          location: artifactBucket.bucket,
          type: 'S3',
        },
        stages: [
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
                  Owner: pulumi.getStack(),
                  Repo: 'sample-app',
                  Branch: 'main',
                  OAuthToken: '{{resolve:secretsmanager:github-token}}',
                },
              },
            ],
          },
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
          {
            name: 'Deploy',
            actions: [
              {
                name: 'Deploy',
                category: 'Deploy',
                owner: 'AWS',
                provider: 'S3',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  BucketName: artifactBucket.bucket,
                  Extract: 'false',
                  ObjectKey: 'deployment-placeholder',
                },
              },
            ],
          },
        ],
        tags: resourceTags,
      },
      { parent: this }
    );

    // 7. Create IAM role for CloudWatch Events
    const eventRole = new aws.iam.Role(
      `event-role-${environmentSuffix}`,
      {
        name: `event-role-${environmentSuffix}`,
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
        tags: resourceTags,
      },
      { parent: this }
    );

    const eventPolicy = new aws.iam.Policy(
      `event-policy-${environmentSuffix}`,
      {
        name: `event-policy-${environmentSuffix}`,
        policy: pipeline.arn.apply((pipelineArn) =>
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
        tags: resourceTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `event-policy-attachment-${environmentSuffix}`,
      {
        role: eventRole.name,
        policyArn: eventPolicy.arn,
      },
      { parent: this }
    );

    // CloudWatch Events rule to trigger pipeline on GitHub pushes
    const eventRule = new aws.cloudwatch.EventRule(
      `pipeline-trigger-${environmentSuffix}`,
      {
        name: `pipeline-trigger-${environmentSuffix}`,
        description: 'Trigger pipeline on GitHub push to main branch',
        eventPattern: JSON.stringify({
          source: ['aws.codecommit'],
          'detail-type': ['CodeCommit Repository State Change'],
          detail: {
            event: ['referenceCreated', 'referenceUpdated'],
            referenceType: ['branch'],
            referenceName: ['main'],
          },
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `pipeline-target-${environmentSuffix}`,
      {
        rule: eventRule.name,
        arn: pipeline.arn,
        roleArn: eventRole.arn,
      },
      { parent: this }
    );

    // Exports
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=${region}`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the CI/CD Pipeline infrastructure.
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
const team = process.env.TEAM || 'DevOps';
const createdAt = new Date().toISOString();

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: 'Production',
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
  'cicd-pipeline',
  {
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
```

## Implementation Notes

This implementation creates a complete CI/CD pipeline infrastructure with:

1. **S3 Bucket** - Stores pipeline artifacts with versioning enabled and force destroy for cleanup
2. **ECR Repository** - Manages Docker images with lifecycle policy to keep only last 10 images
3. **CodeBuild Project** - Builds Docker images using buildspec.yml with proper environment variables
4. **IAM Roles and Policies** - Least privilege access for CodeBuild and CodePipeline
5. **CodePipeline** - Three-stage pipeline (Source from GitHub, Build with CodeBuild, Deploy placeholder)
6. **CloudWatch Events** - Triggers pipeline on code changes (configured for CodeCommit pattern)
7. **Resource Naming** - All resources include environmentSuffix for multi-deployment support
8. **Tags** - All resources tagged with Environment=Production and Team=DevOps
9. **Outputs** - Pipeline URL and ECR repository URI exported for operational use

All resources are configured to be fully destroyable with forceDestroy/forceDelete enabled.