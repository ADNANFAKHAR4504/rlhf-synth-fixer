import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubRepo?: string;
  githubBranch?: string;
  githubOwner?: string;
  githubToken?: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = {
      Environment: 'production',
      Project: 'nodejs-app',
      ...(args.tags || {}),
    };

    // S3 Bucket for CodePipeline artifacts
    const artifactBucket = new aws.s3.Bucket(
      `codepipeline-artifacts-${environmentSuffix}`,
      {
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
        tags: tags,
      },
      { parent: this }
    );

    // ECR Repository for Docker images
    const ecrRepository = new aws.ecr.Repository(
      `nodejs-app-${environmentSuffix}`,
      {
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // ECR Lifecycle Policy to retain only last 10 images
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

    // CloudWatch Logs Group for CodeBuild
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-app-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
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
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, ecrRepository.arn, codeBuildLogGroup.arn])
          .apply(([bucketArn, repoArn, logGroupArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetObjectVersion',
                  ],
                  Resource: [`${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ListBucket'],
                  Resource: [bucketArn],
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
                  Resource: [repoArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: [`${logGroupArn}:*`],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(
      `nodejs-app-build-${environmentSuffix}`,
      {
        name: `nodejs-app-build-${environmentSuffix}`,
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
              name: 'ECR_REPOSITORY_URI',
              value: ecrRepository.repositoryUrl,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: 'us-east-1',
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
      - printf '[{"name":"nodejs-app","imageUri":"%s"}]' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

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
        tags: tags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM Role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
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
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: codePipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, codeBuildProject.arn])
          .apply(([bucketArn, buildArn]) =>
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
                  Resource: [buildArn],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ecs:DescribeServices',
                    'ecs:DescribeTaskDefinition',
                    'ecs:DescribeTasks',
                    'ecs:ListTasks',
                    'ecs:RegisterTaskDefinition',
                    'ecs:UpdateService',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['iam:PassRole'],
                  Resource: '*',
                  Condition: {
                    StringEqualsIfExists: {
                      'iam:PassedToService': ['ecs-tasks.amazonaws.com'],
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `nodejs-app-pipeline-${environmentSuffix}`,
      {
        name: `nodejs-app-pipeline-${environmentSuffix}`,
        roleArn: codePipelineRole.arn,
        artifactStores: [
          {
            type: 'S3',
            location: artifactBucket.bucket,
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
                  Owner: args.githubOwner || 'your-github-org',
                  Repo: args.githubRepo || 'nodejs-app',
                  Branch: args.githubBranch || 'main',
                  OAuthToken: args.githubToken || 'placeholder-token',
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
                  ClusterName: `nodejs-app-cluster-${environmentSuffix}`,
                  ServiceName: `nodejs-app-service-${environmentSuffix}`,
                  FileName: 'imagedefinitions.json',
                },
              },
            ],
          },
        ],
        tags: tags,
      },
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // Export outputs
    this.pipelineArn = pipeline.arn;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: artifactBucket.bucket,
      codeBuildProjectName: codeBuildProject.name,
    });
  }
}
