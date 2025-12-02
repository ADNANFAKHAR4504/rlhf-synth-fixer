/**
 * ci-cd-stack.ts
 *
 * Defines the CI/CD pipeline infrastructure including:
 * - S3 bucket for build artifacts
 * - ECR repository for Docker images
 * - CodeBuild project for building and pushing images
 * - CodePipeline for orchestrating the CI/CD workflow
 * - IAM roles with least-privilege permissions
 * - CloudWatch Logs with retention policies
 * - SNS topic for pipeline notifications
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface CICDStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubToken?: pulumi.Input<string>;
  githubRepo?: string;
  githubBranch?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;
}

export class CICDStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly ecrRepositoryUrl: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: CICDStackArgs, opts?: ResourceOptions) {
    super('tap:cicd:CICDStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const defaultTags = {
      ...tags,
      Environment: 'Production',
      ManagedBy: 'Pulumi',
    };

    // 1. Create S3 bucket for storing build artifacts with versioning enabled
    const artifactBucket = new aws.s3.Bucket(
      `cicd-artifacts-${environmentSuffix}`,
      {
        bucket: `cicd-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Block public access to artifact bucket
    new aws.s3.BucketPublicAccessBlock(
      `cicd-artifacts-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 2. Set up ECR repository with lifecycle policy to retain only last 10 images
    const ecrRepository = new aws.ecr.Repository(
      `app-repository-${environmentSuffix}`,
      {
        name: `app-repository-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Lifecycle policy to retain only last 10 images
    new aws.ecr.LifecyclePolicy(
      `app-repository-lifecycle-${environmentSuffix}`,
      {
        repository: ecrRepository.name,
        policy: JSON.stringify({
          rules: [
            {
              rulePriority: 1,
              description: 'Retain only last 10 images',
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

    // 8. SNS topic for pipeline notifications
    const snsTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        name: `pipeline-notifications-${environmentSuffix}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 7. CloudWatch Log Group for CodeBuild with 7-day retention
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/app-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5. IAM role for CodeBuild with least-privilege permissions
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // CodeBuild policy for logs
    new aws.iam.RolePolicy(
      `codebuild-logs-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([codeBuildLogGroup.arn]).apply(([logGroupArn]) =>
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

    // CodeBuild policy for S3 artifact access
    new aws.iam.RolePolicy(
      `codebuild-s3-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
                Resource: `${bucketArn}/*`,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodeBuild policy for ECR
    new aws.iam.RolePolicy(
      `codebuild-ecr-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi.all([ecrRepository.arn]).apply(([repoArn]) =>
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

    // 3. CodeBuild project that builds Docker images and pushes to ECR
    const codeBuildProject = new aws.codebuild.Project(
      `app-build-${environmentSuffix}`,
      {
        name: `app-build-${environmentSuffix}`,
        description: 'Build Docker images and push to ECR',
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
            groupName: codeBuildLogGroup.name,
            status: 'ENABLED',
          },
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM role for CodePipeline with least-privilege permissions
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // CodePipeline policy for S3
    new aws.iam.RolePolicy(
      `codepipeline-s3-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) =>
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

    // CodePipeline policy for CodeBuild
    new aws.iam.RolePolicy(
      `codepipeline-codebuild-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi.all([codeBuildProject.arn]).apply(([buildArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                Resource: buildArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodePipeline policy for ECS
    new aws.iam.RolePolicy(
      `codepipeline-ecs-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ecs:DescribeServices',
                'ecs:DescribeTaskDefinition',
                'ecs:DescribeTasks',
                'ecs:ListTasks',
                'ecs:RegisterTaskDefinition',
                'ecs:UpdateService',
                'iam:PassRole',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // CodePipeline policy for SNS notifications
    new aws.iam.RolePolicy(
      `codepipeline-sns-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi.all([snsTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // 4. CodePipeline with Source (GitHub), Build (CodeBuild), and Deploy (ECS) stages
    const pipeline = new aws.codepipeline.Pipeline(
      `app-pipeline-${environmentSuffix}`,
      {
        name: `app-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStores: [
          {
            location: artifactBucket.bucket,
            type: 'S3',
          },
        ],
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
                  Owner: args.githubRepo?.split('/')[0] || 'owner',
                  Repo: args.githubRepo?.split('/')[1] || 'repo',
                  Branch: args.githubBranch || 'main',
                  OAuthToken: args.githubToken || 'PLACEHOLDER_TOKEN',
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
                provider: 'ECS',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  ClusterName: args.ecsClusterName || 'app-cluster',
                  ServiceName: args.ecsServiceName || 'app-service',
                  FileName: 'imagedefinitions.json',
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // EventBridge rule for pipeline failures
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `pipeline-failure-rule-${environmentSuffix}`,
      {
        name: `pipeline-failure-rule-${environmentSuffix}`,
        description: 'Capture pipeline failures',
        eventPattern: pulumi.all([pipeline.name]).apply(([pipelineName]) =>
          JSON.stringify({
            source: ['aws.codepipeline'],
            'detail-type': ['CodePipeline Pipeline Execution State Change'],
            detail: {
              state: ['FAILED'],
              pipeline: [pipelineName],
            },
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    // EventBridge target to send failures to SNS
    new aws.cloudwatch.EventTarget(
      `pipeline-failure-target-${environmentSuffix}`,
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
            '"Pipeline <pipeline> has <state>. Execution ID: <execution>"',
        },
      },
      { parent: this }
    );

    // SNS topic policy to allow EventBridge to publish
    new aws.sns.TopicPolicy(
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
                Action: 'sns:Publish',
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Set outputs
    this.artifactBucketName = artifactBucket.bucket;
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
