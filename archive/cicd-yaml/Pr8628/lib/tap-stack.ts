/**
 * tap-stack.ts
 *
 * CI/CD Pipeline for Docker Image Builds and ECR Pushes
 *
 * This stack creates a complete CI/CD pipeline that automates Docker image builds
 * and pushes them to Amazon ECR using CodePipeline, CodeBuild, S3, and CloudWatch.
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
   * GitHub repository owner/organization
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
   * GitHub OAuth token for authentication
   * Should be stored in Pulumi config as a secret
   */
  githubToken?: pulumi.Input<string>;
}

/**
 * TapStack - Main Pulumi component for CI/CD Pipeline
 *
 * Creates a complete CI/CD pipeline with:
 * - S3 bucket for artifacts
 * - ECR repository for Docker images
 * - CodeBuild project for building images
 * - CodePipeline for orchestrating the workflow
 * - IAM roles and policies
 * - CloudWatch Logs for monitoring
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketArn: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly pipelineArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const githubBranch = args.githubBranch || 'main';

    // Default tags
    const defaultTags = {
      Environment: 'production',
      Team: 'devops',
      ManagedBy: 'Pulumi',
      ...(args.tags as any),
    };

    // Get current AWS account and region
    const current = aws.getCallerIdentityOutput();
    const region = aws.getRegionOutput();

    // 1. Create S3 bucket for pipeline artifacts
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
        forceDestroy: true, // Allow destruction with objects inside
        tags: defaultTags,
      },
      { parent: this }
    );

    // Block public access to S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-public-access-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 2. Create ECR repository for Docker images
    const ecrRepository = new aws.ecr.Repository(
      `app-images-${environmentSuffix}`,
      {
        name: `app-images-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        encryptionConfigurations: [
          {
            encryptionType: 'AES256',
          },
        ],
        forceDelete: true, // Allow destruction with images inside
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR lifecycle policy to manage image cleanup
    new aws.ecr.LifecyclePolicy(
      `app-images-lifecycle-${environmentSuffix}`,
      {
        repository: ecrRepository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Keep last 10 images',
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

    // 3. Create CloudWatch Log Group for CodeBuild
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/docker-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-docker-role-${environmentSuffix}`,
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

    // CodeBuild policy for CloudWatch Logs
    const codeBuildLogsPolicy = new aws.iam.RolePolicy(
      `codebuild-logs-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([codeBuildLogGroup.arn, region.name])
          .apply(([logGroupArn, _regionName]) =>
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

    // CodeBuild policy for S3 access (artifacts)
    const codeBuildS3Policy = new aws.iam.RolePolicy(
      `codebuild-s3-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: artifactBucket.arn.apply(bucketArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
                Resource: [`${bucketArn}/*`],
              },
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: [bucketArn],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodeBuild policy for ECR access (push images)
    const codeBuildECRPolicy = new aws.iam.RolePolicy(
      `codebuild-ecr-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([ecrRepository.arn, current.accountId, region.name])
          .apply(([repoArn, _accountId, _regionName]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
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

    // 5. Create CodeBuild project
    const codeBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        description: 'Build Docker images and push to ECR',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL', // Standard small compute
          image: 'aws/codebuild/standard:7.0',
          privilegedMode: true, // Required for Docker builds
          imagePullCredentialsType: 'CODEBUILD',
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: region.name,
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: current.accountId,
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
      },
      {
        parent: this,
        dependsOn: [codeBuildLogsPolicy, codeBuildS3Policy, codeBuildECRPolicy],
      }
    );

    // 6. Create IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
      {
        name: `codepipeline-docker-role-${environmentSuffix}`,
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

    // CodePipeline policy for S3 access
    const pipelineS3Policy = new aws.iam.RolePolicy(
      `pipeline-s3-policy-${environmentSuffix}`,
      {
        role: pipelineRole.id,
        policy: artifactBucket.arn.apply(bucketArn =>
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
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodePipeline policy for CodeBuild access
    const pipelineCodeBuildPolicy = new aws.iam.RolePolicy(
      `pipeline-codebuild-policy-${environmentSuffix}`,
      {
        role: pipelineRole.id,
        policy: codeBuildProject.arn.apply(projectArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                Resource: projectArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // 7. Create CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `docker-pipeline-${environmentSuffix}`,
      {
        name: `docker-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStores: [
          {
            type: 'S3',
            location: artifactBucket.bucket,
          },
        ],
        stages: [
          // Source stage - GitHub
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
                  Owner: args.githubOwner || pulumi.getStack(),
                  Repo: args.githubRepo || 'app-repo',
                  Branch: githubBranch,
                  OAuthToken:
                    args.githubToken || pulumi.output('CHANGE_ME_GITHUB_TOKEN'),
                  PollForSourceChanges: 'false', // Use webhook instead
                },
              },
            ],
          },
          // Build stage - CodeBuild
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
          // Deploy stage - Manual Approval
          {
            name: 'Deploy',
            actions: [
              {
                name: 'ManualApproval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  CustomData: 'Please review the build and approve deployment',
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [pipelineS3Policy, pipelineCodeBuildPolicy] }
    );

    // 8. Create GitHub webhook for pipeline trigger
    const webhook = new aws.codepipeline.Webhook(
      `github-webhook-${environmentSuffix}`,
      {
        name: `github-webhook-${environmentSuffix}`,
        targetPipeline: pipeline.name,
        targetAction: 'Source',
        authentication: 'GITHUB_HMAC',
        authenticationConfiguration: {
          secretToken:
            args.githubToken || pulumi.output('CHANGE_ME_GITHUB_TOKEN'),
        },
        filters: [
          {
            jsonPath: '$.ref',
            matchEquals: `refs/heads/${githubBranch}`,
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // Export outputs
    this.artifactBucketArn = artifactBucket.arn;
    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;
    this.codeBuildProjectName = codeBuildProject.name;
    this.pipelineArn = pipeline.arn;

    // Register outputs
    this.registerOutputs({
      artifactBucketArn: this.artifactBucketArn,
      artifactBucketName: artifactBucket.bucket,
      ecrRepositoryUrl: this.ecrRepositoryUrl,
      ecrRepositoryArn: ecrRepository.arn,
      codeBuildProjectName: this.codeBuildProjectName,
      codeBuildProjectArn: codeBuildProject.arn,
      pipelineArn: this.pipelineArn,
      pipelineName: pipeline.name,
      webhookUrl: webhook.url,
      logGroupName: codeBuildLogGroup.name,
    });
  }
}
