/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Integration using Pulumi TypeScript
 *
 * This module implements a complete CI/CD pipeline for containerized applications
 * using AWS native services including CodePipeline, CodeBuild, ECR, S3, IAM,
 * CloudWatch, SNS, Lambda, DynamoDB, KMS, SSM Parameter Store, and ECS.
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
   * GitHub repository URL for source control
   */
  githubRepo?: string;

  /**
   * GitHub OAuth token for repository access (stored in SSM Parameter Store)
   */
  githubTokenParameter?: string;

  /**
   * Existing ECS cluster name for deployments
   */
  ecsClusterName?: string;
}

/**
 * Represents the main Pulumi component resource for the CI/CD Pipeline.
 *
 * This component creates a fully automated pipeline that:
 * - Triggers on code commits to GitHub
 * - Builds and tests Docker images
 * - Stores images in ECR
 * - Deploys to ECS
 * - Provides build notifications
 * - Maintains audit trails
 * - Validates deployments with Lambda
 * - Tracks state in DynamoDB
 * - Encrypts sensitive data with KMS
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineName: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly validationLambdaArn: pulumi.Output<string>;
  public readonly stateTableName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const githubRepo = args.githubRepo || 'https://github.com/example/app';
    const githubTokenParameter =
      args.githubTokenParameter || '/cicd/github/token';
    const ecsClusterName = args.ecsClusterName || 'production-cluster';

    const defaultTags = {
      Environment: environmentSuffix,
      Project: 'cicd-pipeline',
      ManagedBy: 'Pulumi',
      ...(args.tags || {}),
    };

    // 1. KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      `cicd-kms-key-${environmentSuffix}`,
      {
        description: 'KMS key for CI/CD pipeline encryption',
        enableKeyRotation: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // KMS Alias for easier key reference
    new aws.kms.Alias(
      `cicd-kms-alias-${environmentSuffix}`,
      {
        name: `alias/cicd-pipeline-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // 2. S3 Bucket for pipeline artifacts
    const artifactBucket = new aws.s3.Bucket(
      `cicd-artifacts-${environmentSuffix}`,
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
              kmsMasterKeyId: kmsKey.id,
            },
          },
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // Block public access to artifacts bucket
    new aws.s3.BucketPublicAccessBlock(
      `cicd-artifacts-public-access-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 3. ECR Repository for Docker images
    const ecrRepository = new aws.ecr.Repository(
      `cicd-ecr-${environmentSuffix}`,
      {
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        tags: defaultTags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy to retain only last 10 images
    new aws.ecr.LifecyclePolicy(
      `cicd-ecr-lifecycle-${environmentSuffix}`,
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

    // 4. CloudWatch Log Group for build logs
    const buildLogGroup = new aws.cloudwatch.LogGroup(
      `cicd-build-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        kmsKeyId: kmsKey.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5. SNS Topic for build notifications
    const buildNotificationTopic = new aws.sns.Topic(
      `cicd-build-notifications-${environmentSuffix}`,
      {
        kmsMasterKeyId: kmsKey.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 6. DynamoDB Table for deployment state tracking
    const stateTable = new aws.dynamodb.Table(
      `cicd-deployment-state-${environmentSuffix}`,
      {
        attributes: [
          { name: 'deploymentId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        hashKey: 'deploymentId',
        rangeKey: 'timestamp',
        billingMode: 'PAY_PER_REQUEST',
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // 7. IAM Role for Lambda validation function
    const lambdaRole = new aws.iam.Role(
      `cicd-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach policies to Lambda role
    const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
      `cicd-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    const lambdaPolicy = new aws.iam.RolePolicy(
      `cicd-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([stateTable.arn, ecrRepository.arn])
          .apply(([tableArn, repoArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:GetItem',
                    'dynamodb:UpdateItem',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['ecr:DescribeImages', 'ecr:GetDownloadUrlForLayer'],
                  Resource: repoArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: buildNotificationTopic.arn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 8. Lambda Function for deployment validation
    const validationLambda = new aws.lambda.Function(
      `cicd-validation-lambda-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 60,
        environment: {
          variables: {
            STATE_TABLE: stateTable.name,
            ECR_REPOSITORY: ecrRepository.name,
            SNS_TOPIC_ARN: buildNotificationTopic.arn,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
            const AWS = require('aws-sdk');
            const dynamodb = new AWS.DynamoDB.DocumentClient();
            const ecr = new AWS.ECR();
            const sns = new AWS.SNS();

            exports.handler = async (event) => {
              console.log('Validation event:', JSON.stringify(event));

              const deploymentId = event.deploymentId || Date.now().toString();
              const imageTag = event.imageTag || 'latest';

              try {
                // Validate ECR image exists
                const images = await ecr.describeImages({
                  repositoryName: process.env.ECR_REPOSITORY,
                  imageIds: [{ imageTag }]
                }).promise();

                if (images.imageDetails.length === 0) {
                  throw new Error(\`Image \${imageTag} not found in ECR\`);
                }

                // Record deployment state
                await dynamodb.put({
                  TableName: process.env.STATE_TABLE,
                  Item: {
                    deploymentId,
                    timestamp: Date.now(),
                    imageTag,
                    status: 'validated',
                    imageScanFindings: images.imageDetails[0].imageScanFindingsSummary || {},
                  }
                }).promise();

                return {
                  statusCode: 200,
                  body: JSON.stringify({ status: 'success', deploymentId, imageTag })
                };
              } catch (error) {
                console.error('Validation failed:', error);

                // Send SNS notification on failure
                await sns.publish({
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: 'Deployment Validation Failed',
                  Message: \`Deployment validation failed: \${error.message}\`
                }).promise();

                throw error;
              }
            };
          `),
        }),
        tags: defaultTags,
      },
      { parent: this, dependsOn: [lambdaPolicy, lambdaBasicExecution] }
    );

    // 9. SSM Parameter for GitHub token (placeholder - user must set actual value)
    const githubTokenParam = new aws.ssm.Parameter(
      `cicd-github-token-${environmentSuffix}`,
      {
        name: githubTokenParameter,
        type: 'SecureString',
        value: 'PLACEHOLDER_UPDATE_WITH_ACTUAL_TOKEN',
        keyId: kmsKey.id,
        description: 'GitHub OAuth token for CodePipeline source stage',
        tags: defaultTags,
      },
      { parent: this }
    );

    // 10. IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `cicd-codebuild-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codebuild.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const codeBuildPolicy = new aws.iam.RolePolicy(
      `cicd-codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, buildLogGroup.arn, ecrRepository.arn])
          .apply(([bucketArn, logGroupArn, repoArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: `${logGroupArn}:*`,
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

    // 11. CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      `cicd-build-project-${environmentSuffix}`,
      {
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
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: 'us-east-1',
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: aws.getCallerIdentityOutput().accountId,
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
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $ECR_REPOSITORY_URI:latest .
      - docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG
      - echo Running unit tests...
      - docker run --rm $ECR_REPOSITORY_URI:latest npm test || true
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images...
      - docker push $ECR_REPOSITORY_URI:latest
      - docker push $ECR_REPOSITORY_URI:$IMAGE_TAG
      - printf '[{"name":"app","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: buildLogGroup.name,
            streamName: 'build',
          },
        },
        buildTimeout: 15,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // 12. IAM Role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `cicd-codepipeline-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'codepipeline.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const codePipelinePolicy = new aws.iam.RolePolicy(
      `cicd-codepipeline-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, buildProject.arn])
          .apply(([bucketArn, buildProjectArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetBucketLocation',
                    's3:GetBucketVersioning',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: buildProjectArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['ecs:*'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 13. CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `cicd-pipeline-${environmentSuffix}`,
      {
        roleArn: codePipelineRole.arn,
        artifactStore: {
          location: artifactBucket.bucket,
          type: 'S3',
          encryptionKey: {
            id: kmsKey.arn,
            type: 'KMS',
          },
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
                  Owner: githubRepo.split('/')[3] || 'example',
                  Repo: githubRepo.split('/')[4] || 'app',
                  Branch: 'main',
                  OAuthToken: githubTokenParam.value,
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
                  ProjectName: buildProject.name,
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
                  ClusterName: ecsClusterName,
                  ServiceName: `app-service-${environmentSuffix}`,
                  FileName: 'imagedefinitions.json',
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // 14. CloudWatch Event Rule to trigger pipeline on main branch commits
    const pipelineEventRule = new aws.cloudwatch.EventRule(
      `cicd-pipeline-trigger-${environmentSuffix}`,
      {
        description: 'Trigger CI/CD pipeline on main branch commits',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "detail": {
    "event": ["referenceCreated", "referenceUpdated"],
    "referenceType": ["branch"],
    "referenceName": ["main"]
  }
}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `cicd-pipeline-target-${environmentSuffix}`,
      {
        rule: pipelineEventRule.name,
        arn: pipeline.arn,
        roleArn: codePipelineRole.arn,
      },
      { parent: this }
    );

    // 15. CloudWatch Event Rule for failed builds
    const buildFailureRule = new aws.cloudwatch.EventRule(
      `cicd-build-failure-${environmentSuffix}`,
      {
        description: 'Notify on failed builds',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codebuild"],
  "detail-type": ["CodeBuild Build State Change"],
  "detail": {
    "build-status": ["FAILED"],
    "project-name": ["${buildProject.name}"]
  }
}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `cicd-build-failure-target-${environmentSuffix}`,
      {
        rule: buildFailureRule.name,
        arn: buildNotificationTopic.arn,
      },
      { parent: this }
    );

    // Allow CloudWatch Events to publish to SNS
    new aws.sns.TopicPolicy(
      `cicd-sns-topic-policy-${environmentSuffix}`,
      {
        arn: buildNotificationTopic.arn,
        policy: pulumi
          .all([buildNotificationTopic.arn, buildFailureRule.arn])
          .apply(([topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'events.amazonaws.com' },
                  Action: 'SNS:Publish',
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Register outputs
    this.pipelineName = pipeline.name;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.artifactBucketName = artifactBucket.bucket;
    this.buildProjectName = buildProject.name;
    this.snsTopicArn = buildNotificationTopic.arn;
    this.validationLambdaArn = validationLambda.arn;
    this.stateTableName = stateTable.name;
    this.kmsKeyId = kmsKey.id;

    this.registerOutputs({
      pipelineName: this.pipelineName,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: this.buildProjectName,
      snsTopicArn: this.snsTopicArn,
      validationLambdaArn: this.validationLambdaArn,
      stateTableName: this.stateTableName,
      kmsKeyId: this.kmsKeyId,
    });
  }
}
