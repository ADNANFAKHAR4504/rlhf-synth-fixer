# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This implementation creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, ECR, and S3, with Pulumi for infrastructure management.

## Architecture Overview

The infrastructure consists of:
- S3 bucket for pipeline artifacts with versioning and lifecycle policies
- ECR repository for Docker images with scanning and lifecycle policies
- Two CodeBuild projects: one for Docker builds, one for Pulumi deployments
- CodePipeline orchestrating Source, Build, Manual Approval, and Deploy stages
- IAM roles and policies following least privilege principles
- SNS topic for pipeline failure notifications
- KMS encryption for pipeline artifacts

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the CI/CD Pipeline infrastructure.
 * Orchestrates all AWS resources needed for automated container builds and Pulumi deployments.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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
 * Represents the main Pulumi component resource for the CI/CD Pipeline.
 *
 * This component creates all resources needed for a complete CI/CD pipeline
 * including S3, ECR, CodeBuild, CodePipeline, IAM, SNS, and KMS resources.
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

    const defaultTags = {
      ...tags,
      Environment: environmentSuffix,
      Project: 'cicd-pipeline',
      ManagedBy: 'Pulumi',
    };

    // Get current AWS account and region
    const current = aws.getCallerIdentity({});
    const region = aws.getRegion({});

    // 1. S3 Bucket for Pipeline Artifacts
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
            },
          },
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. ECR Repository for Docker Images
    const ecrRepository = new aws.ecr.Repository(
      `app-images-${environmentSuffix}`,
      {
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy to keep only last 10 images
    const ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(
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

    // 3. IAM Role for CodeBuild - Docker Build Project
    const codeBuildDockerRole = new aws.iam.Role(
      `codebuild-docker-role-${environmentSuffix}`,
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

    // IAM Policy for Docker Build CodeBuild
    const codeBuildDockerPolicy = new aws.iam.RolePolicy(
      `codebuild-docker-policy-${environmentSuffix}`,
      {
        role: codeBuildDockerRole.id,
        policy: pulumi.all([artifactBucket.arn, ecrRepository.arn]).apply(
          ([bucketArn, repoArn]) =>
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
                  Resource: `arn:aws:logs:eu-north-1:*:log-group:/aws/codebuild/*`,
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
      },
      { parent: this }
    );

    // 4. IAM Role for CodeBuild - Pulumi Deployment Project
    const codeBuildPulumiRole = new aws.iam.Role(
      `codebuild-pulumi-role-${environmentSuffix}`,
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

    // IAM Policy for Pulumi Deployment CodeBuild
    const codeBuildPulumiPolicy = new aws.iam.RolePolicy(
      `codebuild-pulumi-policy-${environmentSuffix}`,
      {
        role: codeBuildPulumiRole.id,
        policy: artifactBucket.arn.apply((bucketArn) =>
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
                Resource: `arn:aws:logs:eu-north-1:*:log-group:/aws/codebuild/*`,
              },
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:GetObjectVersion'],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeVpcs',
                  'ec2:DescribeSubnets',
                  'ec2:DescribeSecurityGroups',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // 5. CodeBuild Project for Docker Image Builds
    const dockerBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        serviceRole: codeBuildDockerRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: 'eu-north-1',
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: current.then((c) => c.accountId),
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
          buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
artifacts:
  files:
    - '**/*'`,
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codeBuildDockerPolicy] }
    );

    // 6. CodeBuild Project for Pulumi Deployments
    const pulumiDeployProject = new aws.codebuild.Project(
      `pulumi-deploy-${environmentSuffix}`,
      {
        serviceRole: codeBuildPulumiRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'PULUMI_ACCESS_TOKEN',
              value: 'PLACEHOLDER',
              type: 'PARAMETER_STORE',
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
  install:
    commands:
      - echo Installing Pulumi...
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
  pre_build:
    commands:
      - echo Configuring Pulumi...
      - pulumi login
  build:
    commands:
      - echo Deploying infrastructure with Pulumi...
      - pulumi stack select dev || pulumi stack init dev
      - pulumi up --yes
  post_build:
    commands:
      - echo Deployment completed on \`date\`
artifacts:
  files:
    - '**/*'`,
        },
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codeBuildPulumiPolicy] }
    );

    // 7. SNS Topic for Pipeline Notifications
    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        displayName: 'Pipeline Failure Notifications',
        tags: defaultTags,
      },
      { parent: this }
    );

    // 8. IAM Role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
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

    // IAM Policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([
            artifactBucket.arn,
            dockerBuildProject.arn,
            pulumiDeployProject.arn,
          ])
          .apply(([bucketArn, dockerProjectArn, pulumiProjectArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                    's3:GetBucketVersioning',
                  ],
                  Resource: [`${bucketArn}`, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'codebuild:BatchGetBuilds',
                    'codebuild:StartBuild',
                  ],
                  Resource: [dockerProjectArn, pulumiProjectArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: snsTopic.arn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 9. CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `cicd-pipeline-${environmentSuffix}`,
      {
        roleArn: pipelineRole.arn,
        artifactStore: {
          location: artifactBucket.bucket,
          type: 'S3',
          encryptionKey: {
            type: 'KMS',
            id: 'alias/aws/s3',
          },
        },
        stages: [
          {
            name: 'Source',
            actions: [
              {
                name: 'SourceAction',
                category: 'Source',
                owner: 'AWS',
                provider: 'S3',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  S3Bucket: artifactBucket.bucket,
                  S3ObjectKey: 'source.zip',
                  PollForSourceChanges: true,
                },
              },
            ],
          },
          {
            name: 'Build',
            actions: [
              {
                name: 'DockerBuild',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['build_output'],
                configuration: {
                  ProjectName: dockerBuildProject.name,
                },
              },
            ],
          },
          {
            name: 'Approval',
            actions: [
              {
                name: 'ManualApproval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  CustomData:
                    'Please review the build and approve for deployment',
                },
              },
            ],
          },
          {
            name: 'Deploy',
            actions: [
              {
                name: 'PulumiDeploy',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                version: '1',
                inputArtifacts: ['build_output'],
                outputArtifacts: ['deploy_output'],
                configuration: {
                  ProjectName: pulumiDeployProject.name,
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      {
        parent: this,
        dependsOn: [pipelinePolicy, artifactBucket],
      }
    );

    // Export outputs
    this.artifactBucketName = artifactBucket.bucket;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;
    this.pipelineName = pipeline.name;
    this.snsTopicArn = snsTopic.arn;

    // Register outputs
    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      pipelineName: this.pipelineName,
      snsTopicArn: this.snsTopicArn,
      dockerBuildProject: dockerBuildProject.name,
      pulumiDeployProject: pulumiDeployProject.name,
    });
  }
}
```

## Implementation Notes

1. **S3 Bucket**: Created with versioning enabled and lifecycle rule to delete objects after 30 days. Encrypted using AWS managed KMS keys.

2. **ECR Repository**: Image scanning enabled on push. Lifecycle policy configured to keep only the last 10 images.

3. **IAM Roles**: Separate roles for Docker build CodeBuild project, Pulumi deployment CodeBuild project, and CodePipeline. All policies follow least privilege principles.

4. **CodeBuild Projects**:
   - Docker build project uses privileged mode for Docker commands
   - Pulumi deployment project configured with Pulumi CLI installation
   - Both use BUILD_GENERAL1_SMALL compute type and standard:7.0 image

5. **CodePipeline**: Four stages (Source, Build, Approval, Deploy) with S3 source polling and manual approval before deployment.

6. **SNS Topic**: Created for pipeline notifications (subscription needs to be added separately).

7. **Resource Naming**: All resources include environmentSuffix for environment isolation.

8. **Encryption**: Pipeline artifacts encrypted using AWS managed KMS keys (alias/aws/s3).

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Pulumi:
   ```bash
   pulumi stack init dev
   pulumi config set aws:region eu-north-1
   ```

3. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

4. Upload source code to trigger pipeline:
   ```bash
   aws s3 cp source.zip s3://pipeline-artifacts-dev/source.zip
   ```

## Testing

Unit tests should verify:
- IAM policies have correct permissions
- CodeBuild projects use correct images and compute types
- Pipeline stages are correctly configured
- ECR lifecycle policy has correct rules
- S3 bucket has versioning and lifecycle rules
- All resources include environmentSuffix in names