/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, implementing a complete CI/CD pipeline
 * for containerized applications using AWS services.
 *
 * Architecture:
 * - S3 bucket for pipeline artifacts with versioning and lifecycle policies
 * - ECR repository with image scanning and lifecycle policies
 * - CodeBuild project for Docker image builds
 * - CodePipeline with Source, Build, and Deploy (manual approval) stages
 * - IAM roles and policies with least-privilege access
 * - SNS topic for pipeline notifications
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment.
   * Used to ensure resource uniqueness across deployments.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * GitHub repository owner (organization or username)
   */
  githubOwner?: string;

  /**
   * GitHub repository name
   */
  githubRepo?: string;

  /**
   * GitHub branch to trigger pipeline (default: main)
   */
  githubBranch?: string;

  /**
   * GitHub OAuth token for source integration (stored in Secrets Manager)
   */
  githubToken?: pulumi.Input<string>;
}

/**
 * Represents the main Pulumi component resource for the CI/CD pipeline.
 *
 * Creates a complete automated pipeline for containerized applications including:
 * - Artifact storage with lifecycle management
 * - Container registry with security scanning
 * - Build automation with CodeBuild
 * - Multi-stage pipeline with manual approval
 * - Notification system for pipeline events
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || pulumi.getStack();
    const tags = args.tags || {};
    const githubOwner = args.githubOwner || 'your-github-owner';
    const githubRepo = args.githubRepo || 'your-repo';
    const githubBranch = args.githubBranch || 'main';

    // Merge standard tags with user-provided tags
    const resourceTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: 'production',
      ManagedBy: 'pulumi',
    }));

    // 1. Create S3 bucket for pipeline artifacts
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
        forceDestroy: true, // Allow destruction for testing
        tags: resourceTags,
      },
      { parent: this }
    );

    // Block public access to artifact bucket
    new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-${environmentSuffix}-public-access-block`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: artifactBucket }
    );

    // 2. Create ECR repository with image scanning
    const ecrRepository = new aws.ecr.Repository(
      `app-repository-${environmentSuffix}`,
      {
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true, // Allow destruction for testing
        tags: resourceTags,
      },
      { parent: this }
    );

    // ECR lifecycle policy to retain only last 10 images
    new aws.ecr.LifecyclePolicy(
      `app-repository-${environmentSuffix}-lifecycle`,
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
      { parent: ecrRepository }
    );

    // 3. Create SNS topic for pipeline notifications
    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        displayName: 'Pipeline State Change Notifications',
        tags: resourceTags,
      },
      { parent: this }
    );

    // 4. Create IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'codebuild.amazonaws.com',
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    // CodeBuild policy - least privilege access
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) =>
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
                Action: ['s3:GetObject', 's3:PutObject'],
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
            ],
          })
        ),
      },
      { parent: codeBuildRole }
    );

    // 5. Create CodeBuild project
    const codeBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:5.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: true, // Required for Docker builds
          environmentVariables: [
            {
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: aws.getRegionOutput().name,
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
        tags: resourceTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // 6. Create IAM role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'codepipeline.amazonaws.com',
        }),
        tags: resourceTags,
      },
      { parent: this }
    );

    // CodePipeline policy - least privilege access
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, codeBuildProject.arn, snsTopic.arn])
          .apply(([bucketArn, buildArn, topicArn]) =>
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
                  Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                  Resource: bucketArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: buildArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { parent: codePipelineRole }
    );

    // 7. Create CodePipeline with three stages
    const pipeline = new aws.codepipeline.Pipeline(
      `app-pipeline-${environmentSuffix}`,
      {
        roleArn: codePipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
            region: aws.getRegionOutput().name,
          },
        ],
        stages: [
          {
            name: 'Source',
            actions: [
              {
                name: 'GitHub_Source',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  Owner: githubOwner,
                  Repo: githubRepo,
                  Branch: githubBranch,
                  OAuthToken: args.githubToken || 'PLACEHOLDER_TOKEN',
                },
              },
            ],
          },
          {
            name: 'Build',
            actions: [
              {
                name: 'Docker_Build',
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
                name: 'Manual_Approval',
                category: 'Approval',
                owner: 'AWS',
                provider: 'Manual',
                version: '1',
                configuration: {
                  CustomData: 'Please review the build and approve deployment',
                  NotificationArn: snsTopic.arn,
                },
              },
            ],
          },
        ],
        tags: resourceTags,
      },
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // 8. Create EventBridge rule for pipeline state changes
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `pipeline-state-change-${environmentSuffix}`,
      {
        description: 'Capture pipeline state change events',
        eventPattern: pipeline.name.apply(pipelineName =>
          JSON.stringify({
            source: ['aws.codepipeline'],
            'detail-type': ['CodePipeline Pipeline Execution State Change'],
            detail: {
              pipeline: [pipelineName],
            },
          })
        ),
        tags: resourceTags,
      },
      { parent: this }
    );

    // Allow EventBridge to publish to SNS
    const snsTopicPolicy = new aws.sns.TopicPolicy(
      `pipeline-notifications-${environmentSuffix}-policy`,
      {
        arn: snsTopic.arn,
        policy: pulumi
          .all([snsTopic.arn, pipelineEventRule.arn])
          .apply(([topicArn, ruleArn]) =>
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
                  Condition: {
                    ArnEquals: {
                      'aws:SourceArn': ruleArn,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: snsTopic }
    );

    // EventBridge target to send notifications to SNS
    new aws.cloudwatch.EventTarget(
      `pipeline-notification-target-${environmentSuffix}`,
      {
        rule: pipelineEventRule.name,
        arn: snsTopic.arn,
        inputTransformer: {
          inputPaths: {
            pipeline: '$.detail.pipeline',
            state: '$.detail.state',
            time: '$.time',
          },
          inputTemplate:
            '"Pipeline <pipeline> changed state to <state> at <time>"',
        },
      },
      { parent: pipelineEventRule, dependsOn: [snsTopicPolicy] }
    );

    // Register outputs
    this.artifactBucketName = artifactBucket.id;
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
