import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly codeBuildProjectArn: pulumi.Output<string>;
  public readonly ecrRepositoryUri: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:resource:TapStack', name, {}, opts);

    const config = pulumi.output({
      environmentSuffix: args.environmentSuffix,
      githubOwner: args.githubOwner || 'example-owner',
      githubRepo: args.githubRepo || 'example-repo',
      githubBranch: args.githubBranch || 'main',
      ecsClusterName: args.ecsClusterName || 'default-cluster',
      ecsServiceName: args.ecsServiceName || 'default-service',
    });

    const tags = {
      Environment: 'production',
      Project: 'nodejs-app',
    };

    // S3 bucket for pipeline artifacts
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${args.environmentSuffix}`,
      {
        bucket: pulumi.interpolate`pipeline-artifacts-${args.environmentSuffix}`,
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
        forceDestroy: true,
        tags: tags,
      },
      { parent: this }
    );

    // ECR repository for Docker images
    const ecrRepository = new aws.ecr.Repository(
      `nodejs-app-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`nodejs-app-${args.environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
        tags: tags,
      },
      { parent: this }
    );

    // ECR lifecycle policy
    new aws.ecr.LifecyclePolicy(
      `ecr-lifecycle-${args.environmentSuffix}`,
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

    // CloudWatch Log Group for CodeBuild
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/codebuild/nodejs-app-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`codebuild-role-${args.environmentSuffix}`,
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

    // IAM policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${args.environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, ecrRepository.arn, logGroup.arn])
          .apply(([bucketArn, repoArn, logArn]) =>
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
                  Resource: [`${logArn}:*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                  ],
                  Resource: [`${bucketArn}/*`],
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

    // CodeBuild project
    const codeBuildProject = new aws.codebuild.Project(
      `nodejs-app-build-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`nodejs-app-build-${args.environmentSuffix}`,
        description: 'Build Docker images for Node.js application',
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
              value: 'us-east-1',
            },
            {
              name: 'AWS_ACCOUNT_ID',
              value: aws.getCallerIdentity({}).then(id => id.accountId),
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
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        tags: tags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM role for CodePipeline
    const codePipelineRole = new aws.iam.Role(
      `codepipeline-role-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`codepipeline-role-${args.environmentSuffix}`,
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

    // IAM policy for CodePipeline
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${args.environmentSuffix}`,
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
                  Resource: buildArn,
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
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `nodejs-app-pipeline-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`nodejs-app-pipeline-${args.environmentSuffix}`,
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
                  Owner: config.githubOwner,
                  Repo: config.githubRepo,
                  Branch: config.githubBranch,
                  OAuthToken: pulumi.secret('placeholder-token'),
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
                  ClusterName: config.ecsClusterName,
                  ServiceName: config.ecsServiceName,
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

    // GitHub webhook
    new aws.codepipeline.Webhook(
      `pipeline-webhook-${args.environmentSuffix}`,
      {
        name: pulumi.interpolate`pipeline-webhook-${args.environmentSuffix}`,
        targetPipeline: pipeline.name,
        targetAction: 'Source',
        authentication: 'GITHUB_HMAC',
        authenticationConfiguration: {
          secretToken: pulumi.secret('placeholder-webhook-secret'),
        },
        filters: [
          {
            jsonPath: '$.ref',
            matchEquals: config.githubBranch.apply(
              branch => `refs/heads/${branch}`
            ),
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Exports
    this.pipelineArn = pipeline.arn;
    this.codeBuildProjectArn = codeBuildProject.arn;
    this.ecrRepositoryUri = ecrRepository.repositoryUrl;
    this.artifactBucketName = artifactBucket.bucket;
    this.logGroupName = logGroup.name;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      codeBuildProjectArn: this.codeBuildProjectArn,
      ecrRepositoryUri: this.ecrRepositoryUri,
      artifactBucketName: this.artifactBucketName,
      logGroupName: this.logGroupName,
    });
  }
}
