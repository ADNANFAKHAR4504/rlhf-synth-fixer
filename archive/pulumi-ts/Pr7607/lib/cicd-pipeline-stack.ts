/**
 * cicd-pipeline-stack.ts
 *
 * Defines the CI/CD Pipeline infrastructure stack for containerized applications.
 * Implements a complete pipeline with S3 artifacts, ECR repository, CodeBuild projects,
 * CodePipeline orchestration, and SNS notifications.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CicdPipelineStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CicdPipelineStack extends pulumi.ComponentResource {
  public readonly pipelineUrl: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly dockerBuildProjectName: pulumi.Output<string>;
  public readonly pulumiDeployProjectName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CicdPipelineStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CicdPipelineStack', name, args, opts);

    const { environmentSuffix, tags = {} } = args;
    const region = aws.getRegionOutput().name;
    const accountId = aws.getCallerIdentityOutput().accountId;

    // Default tags for all resources
    const defaultTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'cicd-pipeline',
      ManagedBy: 'pulumi',
    }));

    // S3 Bucket for Pipeline Artifacts with lifecycle rules
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
              sseAlgorithm: 'aws:kms', // AWS managed KMS key for encryption
            },
          },
        },
        lifecycleRules: [
          {
            id: 'delete-old-artifacts',
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Block public access to the artifact bucket
    new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-public-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ECR Repository for Docker Images
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

    // ECR Lifecycle Policy - Keep only last 10 images
    new aws.ecr.LifecyclePolicy(
      `app-repository-lifecycle-${environmentSuffix}`,
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

    // SNS Topic for Pipeline Failure Notifications
    const snsTopicForFailures = new aws.sns.Topic(
      `pipeline-failures-${environmentSuffix}`,
      {
        name: `pipeline-failures-${environmentSuffix}`,
        displayName: 'CI/CD Pipeline Failure Notifications',
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild (Docker Build)
    const dockerBuildRole = new aws.iam.Role(
      `docker-build-role-${environmentSuffix}`,
      {
        name: `docker-build-role-${environmentSuffix}`,
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

    // IAM Policy for Docker Build - Least Privilege
    const dockerBuildPolicy = new aws.iam.Policy(
      `docker-build-policy-${environmentSuffix}`,
      {
        name: `docker-build-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            artifactBucket.arn,
            ecrRepository.arn,
            region,
            accountId,
            environmentSuffix,
          ])
          .apply(([bucketArn, repoArn, reg, accId, envSuffix]) =>
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
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/docker-build-${envSuffix}`,
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/docker-build-${envSuffix}:*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                  Resource: bucketArn,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `docker-build-policy-attachment-${environmentSuffix}`,
      {
        role: dockerBuildRole.name,
        policyArn: dockerBuildPolicy.arn,
      },
      { parent: this }
    );

    // CodeBuild Project for Docker Build
    const dockerBuildProject = new aws.codebuild.Project(
      `docker-build-${environmentSuffix}`,
      {
        name: `docker-build-${environmentSuffix}`,
        description: 'Build Docker images and push to ECR',
        serviceRole: dockerBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          privilegedMode: true,
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
              type: 'PLAINTEXT',
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: accountId,
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
      },
      { parent: this }
    );

    // IAM Role for CodeBuild (Pulumi Deploy)
    const pulumiDeployRole = new aws.iam.Role(
      `pulumi-deploy-role-${environmentSuffix}`,
      {
        name: `pulumi-deploy-role-${environmentSuffix}`,
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

    // IAM Policy for Pulumi Deploy - Least Privilege with necessary permissions
    const pulumiDeployPolicy = new aws.iam.Policy(
      `pulumi-deploy-policy-${environmentSuffix}`,
      {
        name: `pulumi-deploy-policy-${environmentSuffix}`,
        policy: pulumi
          .all([artifactBucket.arn, region, accountId, environmentSuffix])
          .apply(([bucketArn, reg, accId, envSuffix]) =>
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
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/pulumi-deploy-${envSuffix}`,
                    `arn:aws:logs:${reg}:${accId}:log-group:/aws/codebuild/pulumi-deploy-${envSuffix}:*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:GetBucketLocation', 's3:ListBucket'],
                  Resource: bucketArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'cloudformation:DescribeStacks',
                    'cloudformation:CreateStack',
                    'cloudformation:UpdateStack',
                    'cloudformation:DeleteStack',
                    'cloudformation:DescribeStackEvents',
                    'cloudformation:DescribeStackResources',
                    'cloudformation:GetTemplate',
                  ],
                  Resource: `arn:aws:cloudformation:${reg}:${accId}:stack/pulumi-*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'iam:GetRole',
                    'iam:CreateRole',
                    'iam:DeleteRole',
                    'iam:AttachRolePolicy',
                    'iam:DetachRolePolicy',
                    'iam:PutRolePolicy',
                    'iam:DeleteRolePolicy',
                    'iam:GetRolePolicy',
                  ],
                  Resource: `arn:aws:iam::${accId}:role/pulumi-*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'lambda:CreateFunction',
                    'lambda:DeleteFunction',
                    'lambda:UpdateFunctionCode',
                    'lambda:UpdateFunctionConfiguration',
                    'lambda:GetFunction',
                  ],
                  Resource: `arn:aws:lambda:${reg}:${accId}:function:pulumi-*`,
                },
              ],
            })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `pulumi-deploy-policy-attachment-${environmentSuffix}`,
      {
        role: pulumiDeployRole.name,
        policyArn: pulumiDeployPolicy.arn,
      },
      { parent: this }
    );

    // CodeBuild Project for Pulumi Deployment
    const pulumiDeployProject = new aws.codebuild.Project(
      `pulumi-deploy-${environmentSuffix}`,
      {
        name: `pulumi-deploy-${environmentSuffix}`,
        description: 'Deploy infrastructure using Pulumi',
        serviceRole: pulumiDeployRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          type: 'LINUX_CONTAINER',
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          environmentVariables: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
              type: 'PLAINTEXT',
            },
            {
              name: 'PULUMI_ACCESS_TOKEN',
              value: 'PLACEHOLDER_TOKEN',
              type: 'PLAINTEXT',
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
      - pulumi version
  pre_build:
    commands:
      - echo Pulumi deployment preparation...
      - npm install
  build:
    commands:
      - echo Deploying infrastructure with Pulumi...
      - pulumi stack select dev || pulumi stack init dev
      - pulumi up --yes --skip-preview
  post_build:
    commands:
      - echo Deployment completed on \`date\`
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            status: 'ENABLED',
            groupName: `/aws/codebuild/pulumi-deploy-${environmentSuffix}`,
          },
        },
        buildTimeout: 30,
        tags: defaultTags,
      },
      { parent: this }
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline - Least Privilege
    const codePipelinePolicy = new aws.iam.Policy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        name: `codepipeline-policy-${environmentSuffix}`,
        policy: pulumi
          .all([
            artifactBucket.arn,
            dockerBuildProject.arn,
            pulumiDeployProject.arn,
          ])
          .apply(([bucketArn, dockerBuildArn, pulumiDeployArn]) =>
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
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: [dockerBuildArn, pulumiDeployArn],
                },
              ],
            })
          ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `codepipeline-policy-attachment-${environmentSuffix}`,
      {
        role: codePipelineRole.name,
        policyArn: codePipelinePolicy.arn,
      },
      { parent: this }
    );

    // CodePipeline with Source, Build, Approval, and Deploy stages
    const pipeline = new aws.codepipeline.Pipeline(
      `cicd-pipeline-${environmentSuffix}`,
      {
        name: `cicd-pipeline-${environmentSuffix}`,
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
                name: 'SourceAction',
                category: 'Source',
                owner: 'AWS',
                provider: 'S3',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  S3Bucket: artifactBucket.bucket,
                  S3ObjectKey: 'source.zip',
                  PollForSourceChanges: 'true',
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
                    'Please review the build artifacts before Pulumi deployment',
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
                inputArtifacts: ['source_output'],
                configuration: {
                  ProjectName: pulumiDeployProject.name,
                },
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // CloudWatch Event Rule for Pipeline Failures
    const pipelineFailureRule = new aws.cloudwatch.EventRule(
      `pipeline-failure-${environmentSuffix}`,
      {
        name: `pipeline-failure-${environmentSuffix}`,
        description: 'Capture pipeline execution failures',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codepipeline"],
  "detail-type": ["CodePipeline Pipeline Execution State Change"],
  "detail": {
    "pipeline": ["${pipeline.name}"],
    "state": ["FAILED"]
  }
}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // SNS Topic Policy to allow EventBridge to publish
    const snsTopicPolicy = new aws.sns.TopicPolicy(
      `pipeline-failures-topic-policy-${environmentSuffix}`,
      {
        arn: snsTopicForFailures.arn,
        policy: pulumi
          .all([snsTopicForFailures.arn, accountId, region])
          .apply(([topicArn, _accId, _reg]) =>
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

    // Event Target - SNS Topic for Failures
    new aws.cloudwatch.EventTarget(
      `pipeline-failure-target-${environmentSuffix}`,
      {
        rule: pipelineFailureRule.name,
        arn: snsTopicForFailures.arn,
        inputTransformer: {
          inputPaths: {
            pipeline: '$.detail.pipeline',
            state: '$.detail.state',
            executionId: '$.detail.execution-id',
          },
          inputTemplate:
            '"Pipeline <pipeline> has <state>. Execution ID: <executionId>"',
        },
      },
      { parent: this, dependsOn: [snsTopicPolicy] }
    );

    // Outputs
    this.pipelineUrl = pulumi.interpolate`https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.name}/view`;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.artifactBucketName = artifactBucket.id;
    this.dockerBuildProjectName = dockerBuildProject.name;
    this.pulumiDeployProjectName = pulumiDeployProject.name;
    this.snsTopicArn = snsTopicForFailures.arn;

    this.registerOutputs({
      pipelineUrl: this.pipelineUrl,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      dockerBuildProjectName: this.dockerBuildProjectName,
      pulumiDeployProjectName: this.pulumiDeployProjectName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
