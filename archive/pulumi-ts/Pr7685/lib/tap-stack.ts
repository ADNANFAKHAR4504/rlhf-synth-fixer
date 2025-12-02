/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Infrastructure for Containerized Applications
 *
 * This module creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild,
 * ECR, and supporting services for containerized application deployment.
 *
 * Components:
 * - S3 bucket for pipeline artifacts
 * - ECR repository for container images
 * - CodeBuild project for Docker builds
 * - CodePipeline with Source, Build, and Deploy stages
 * - IAM roles with least-privilege permissions
 * - CloudWatch Events and SNS for pipeline notifications
 * - KMS encryption for artifacts
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
   * GitHub repository owner (username or organization)
   */
  githubOwner?: string;

  /**
   * GitHub repository name
   */
  githubRepo?: string;

  /**
   * GitHub branch to monitor
   */
  githubBranch?: string;
}

/**
 * Represents the main Pulumi component resource for the CI/CD Pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly snsTopic: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // GitHub configuration with defaults
    const githubOwner = args.githubOwner || 'example-org';
    const githubRepo = args.githubRepo || 'example-app';
    const githubBranch = args.githubBranch || 'main';

    // Enhanced tags with required metadata
    const resourceTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'CICD-Pipeline',
      ManagedBy: 'Pulumi',
    }));

    // ============================================
    // 1. KMS Key for Encryption
    // ============================================
    const kmsKey = new aws.kms.Key(
      `pipeline-kms-${environmentSuffix}`,
      {
        description: `KMS key for pipeline artifacts encryption - ${environmentSuffix}`,
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _kmsAlias = new aws.kms.Alias(
      `pipeline-kms-alias-${environmentSuffix}`,
      {
        name: `alias/pipeline-artifacts-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // ============================================
    // 2. S3 Bucket for Pipeline Artifacts
    // ============================================
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffix}`,
        tags: resourceTags,
        forceDestroy: true,
      },
      { parent: this }
    );

    // Enable versioning
    const bucketVersioning = new aws.s3.BucketVersioningV2(
      `pipeline-artifacts-versioning-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Server-side encryption
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `pipeline-artifacts-encryption-${environmentSuffix}`,
        {
          bucket: artifactBucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: kmsKey.arn,
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { parent: this }
      );

    // Block public access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-public-access-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Lifecycle rule to delete old artifacts after 30 days
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketLifecycleRule = new aws.s3.BucketLifecycleConfigurationV2(
      `pipeline-artifacts-lifecycle-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        rules: [
          {
            id: 'delete-old-artifacts',
            status: 'Enabled',
            expiration: {
              days: 30,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { parent: this, dependsOn: [bucketVersioning] }
    );

    // ============================================
    // 3. ECR Repository for Container Images
    // ============================================
    const ecrRepository = new aws.ecr.Repository(
      `app-repo-${environmentSuffix}`,
      {
        name: `app-repo-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        encryptionConfigurations: [
          {
            encryptionType: 'KMS',
            kmsKey: kmsKey.arn,
          },
        ],
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
        tags: resourceTags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy to retain only last 10 images
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(
      `app-repo-lifecycle-${environmentSuffix}`,
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

    // ============================================
    // 4. IAM Roles and Policies
    // ============================================

    // CodeBuild Service Role
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

    // CodeBuild Policy
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        name: `codebuild-policy-${environmentSuffix}`,
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, ecrRepository.arn, kmsKey.arn])
          .apply(([bucketArn, _repoArn, keyArn]) =>
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
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetObjectVersion',
                  ],
                  Resource: `${bucketArn}/*`,
                },
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
                    'kms:Decrypt',
                    'kms:DescribeKey',
                    'kms:Encrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                  ],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodePipeline Service Role
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
        tags: resourceTags,
      },
      { parent: this }
    );

    // CodePipeline Policy
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        name: `codepipeline-policy-${environmentSuffix}`,
        role: codePipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, kmsKey.arn])
          .apply(([bucketArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetObjectVersion',
                    's3:GetBucketVersioning',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:DescribeKey',
                    'kms:Encrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                  ],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Events Role
    const eventsRole = new aws.iam.Role(
      `events-role-${environmentSuffix}`,
      {
        name: `events-role-${environmentSuffix}`,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _eventsPolicy = new aws.iam.RolePolicy(
      `events-policy-${environmentSuffix}`,
      {
        name: `events-policy-${environmentSuffix}`,
        role: eventsRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'codepipeline:StartPipelineExecution',
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // ============================================
    // 5. CodeBuild Project
    // ============================================
    const codeBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        description: 'Builds Docker images from GitHub repository',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          imagePullCredentialsType: 'CODEBUILD',
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
            status: 'ENABLED',
            groupName: `/aws/codebuild/docker-build-${environmentSuffix}`,
          },
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // ============================================
    // 6. SNS Topic for Pipeline Notifications
    // ============================================
    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        name: `pipeline-notifications-${environmentSuffix}`,
        displayName: 'Pipeline State Change Notifications',
        kmsMasterKeyId: kmsKey.id,
        tags: resourceTags,
      },
      { parent: this }
    );

    // SNS Topic Policy
    const snsTopicPolicy = new aws.sns.TopicPolicy(
      `pipeline-notifications-policy-${environmentSuffix}`,
      {
        arn: snsTopic.arn,
        policy: pulumi.all([snsTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'events.amazonaws.com',
                },
                Action: 'SNS:Publish',
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // ============================================
    // 7. CodePipeline with GitHub Source
    // ============================================

    // Note: For GitHub integration, we'll use CodeStar connection
    // In a real scenario, you'd need to create the connection manually first
    // For this example, we'll use a placeholder connection ARN

    const pipeline = new aws.codepipeline.Pipeline(
      `app-pipeline-${environmentSuffix}`,
      {
        name: `app-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
            encryptionKey: {
              id: kmsKey.arn,
              type: 'KMS',
            },
          },
        ],
        stages: [
          // Source Stage - GitHub
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
                  OAuthToken:
                    '{{resolve:secretsmanager:github-token:SecretString:token}}',
                },
              },
            ],
          },
          // Build Stage - CodeBuild
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
          // Deploy Stage - Manual Approval
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
                  CustomData: 'Please review and approve the deployment',
                  NotificationArn: snsTopic.arn,
                },
              },
            ],
          },
        ],
        tags: resourceTags,
      },
      { parent: this, dependsOn: [codePipelinePolicy, snsTopicPolicy] }
    );

    // ============================================
    // 8. CloudWatch Event Rule for Pipeline State Changes
    // ============================================
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `pipeline-state-change-${environmentSuffix}`,
      {
        name: `pipeline-state-change-${environmentSuffix}`,
        description: 'Capture all pipeline state changes',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"]
  }
}`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _pipelineEventTarget = new aws.cloudwatch.EventTarget(
      `pipeline-state-change-target-${environmentSuffix}`,
      {
        rule: pipelineEventRule.name,
        arn: snsTopic.arn,
        inputTransformer: {
          inputPaths: {
            pipeline: '$.detail.pipeline',
            state: '$.detail.state',
            execution: '$.detail.execution-id',
          },
          inputTemplate:
            '"Pipeline <pipeline> changed state to <state>. Execution ID: <execution>"',
        },
      },
      { parent: this }
    );

    // Additional event rule for build failures
    const buildFailureRule = new aws.cloudwatch.EventRule(
      `build-failure-${environmentSuffix}`,
      {
        name: `build-failure-${environmentSuffix}`,
        description: 'Capture CodeBuild build failures',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codebuild"],
  "detail-type": ["CodeBuild Build State Change"],
  "detail": {
    "build-status": ["FAILED"],
    "project-name": ["${codeBuildProject.name}"]
  }
}`,
        tags: resourceTags,
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _buildFailureTarget = new aws.cloudwatch.EventTarget(
      `build-failure-target-${environmentSuffix}`,
      {
        rule: buildFailureRule.name,
        arn: snsTopic.arn,
        inputTransformer: {
          inputPaths: {
            project: '$.detail.project-name',
            status: '$.detail.build-status',
          },
          inputTemplate:
            '"Build project <project> failed with status <status>"',
        },
      },
      { parent: this }
    );

    // ============================================
    // 9. Outputs
    // ============================================
    this.pipelineUrl = pulumi.interpolate`https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view?region=${aws.getRegionOutput().name}`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.artifactBucketName = artifactBucket.bucket;
    this.snsTopic = snsTopic.arn;

    // Register outputs
    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      snsTopicArn: this.snsTopic,
      pipelineName: pipeline.name,
      codeBuildProjectName: codeBuildProject.name,
      kmsKeyId: kmsKey.keyId,
    });
  }
}
