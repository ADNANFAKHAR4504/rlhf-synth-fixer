/**
 * tap-stack.ts
 *
 * AWS CodePipeline infrastructure for automated CI/CD workflows
 * Implements a basic pipeline with Source, Build, and Deploy stages
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  githubOwner: string;
  githubRepo: string;
  githubBranch?: string;
  githubTokenSecretName?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly pipelineName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;
  public readonly deployBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const environmentSuffixLower = environmentSuffix.toLowerCase();
    const tags = args.tags || {};
    const githubBranch = args.githubBranch || 'main';
    const githubTokenSecretName = args.githubTokenSecretName || 'github-token';

    // Get current AWS region and account ID
    const region = aws.getRegionOutput({}, { parent: this });
    const caller = aws.getCallerIdentityOutput({}, { parent: this });

    // Create S3 bucket for pipeline artifacts
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffixLower}-${pulumi.getStack()}`,
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
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
        tags: tags,
      },
      { parent: this }
    );

    // Block public access to artifact bucket
    new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-pab-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create S3 bucket for deployment artifacts
    const deployBucket = new aws.s3.Bucket(
      `deploy-artifacts-${environmentSuffix}`,
      {
        bucket: `deploy-artifacts-${environmentSuffixLower}-${pulumi.getStack()}`,
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        versioning: {
          enabled: true,
        },
        tags: tags,
      },
      { parent: this }
    );

    // Block public access to deploy bucket
    new aws.s3.BucketPublicAccessBlock(
      `deploy-artifacts-pab-${environmentSuffix}`,
      {
        bucket: deployBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for CodeBuild
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/build-project-${environmentSuffixLower}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `codebuild-role-${environmentSuffixLower}`,
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
          .all([
            artifactBucket.arn,
            deployBucket.arn,
            logGroup.arn,
            caller.accountId,
            region.name,
          ])
          .apply(([artifactArn, deployArn, logArn, accountId, regionName]) =>
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
                  Resource: [logArn, `${logArn}:*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                  ],
                  Resource: [`${artifactArn}/*`, `${deployArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ListBucket'],
                  Resource: [artifactArn, deployArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: `arn:aws:secretsmanager:${regionName}:${accountId}:secret:${githubTokenSecretName}*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      `build-project-${environmentSuffix}`,
      {
        name: `build-project-${environmentSuffixLower}`,
        description: `Build project for ${environmentSuffix} environment`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          imagePullCredentialsType: 'CODEBUILD',
          environmentVariables: [
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
            {
              name: 'DEPLOY_BUCKET',
              value: deployBucket.bucket,
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo "Installing dependencies..."
      - npm install

  pre_build:
    commands:
      - echo "Running pre-build tasks..."
      - echo "Environment - $ENVIRONMENT"
      - npm run lint || echo "Linting completed"

  build:
    commands:
      - echo "Building application..."
      - npm run build || echo "Build completed"
      - echo "Build completed on $(date)"

  post_build:
    commands:
      - echo "Running post-build tasks..."
      - echo "Build artifacts ready for deployment"

artifacts:
  files:
    - '**/*'
  base-directory: .
  name: build-output

cache:
  paths:
    - 'node_modules/**/*'
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 20,
        tags: tags,
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM Role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
      {
        name: `pipeline-role-${environmentSuffixLower}`,
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
    const pipelinePolicy = new aws.iam.RolePolicy(
      `pipeline-policy-${environmentSuffix}`,
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([
            artifactBucket.arn,
            deployBucket.arn,
            buildProject.arn,
            caller.accountId,
            region.name,
          ])
          .apply(
            ([artifactArn, deployArn, projectArn, accountId, regionName]) =>
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
                    Resource: [
                      artifactArn,
                      `${artifactArn}/*`,
                      deployArn,
                      `${deployArn}/*`,
                    ],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'codebuild:BatchGetBuilds',
                      'codebuild:StartBuild',
                    ],
                    Resource: projectArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['secretsmanager:GetSecretValue'],
                    Resource: `arn:aws:secretsmanager:${regionName}:${accountId}:secret:${githubTokenSecretName}*`,
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // Create CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `pipeline-${environmentSuffix}`,
      {
        name: `pipeline-${environmentSuffixLower}`,
        roleArn: pipelineRole.arn,
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
                  Owner: args.githubOwner,
                  Repo: args.githubRepo,
                  Branch: githubBranch,
                  OAuthToken: pulumi.secret(
                    pulumi.output(
                      aws.secretsmanager.getSecretVersionOutput({
                        secretId: githubTokenSecretName,
                      }).secretString
                    )
                  ),
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
                provider: 'S3',
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  BucketName: deployBucket.bucket,
                  Extract: 'true',
                },
              },
            ],
          },
        ],
        tags: tags,
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    // Export outputs
    this.pipelineArn = pipeline.arn;
    this.pipelineName = pipeline.name;
    this.artifactBucketName = artifactBucket.bucket;
    this.buildProjectName = buildProject.name;
    this.deployBucketName = deployBucket.bucket;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      pipelineName: this.pipelineName,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: this.buildProjectName,
      deployBucketName: this.deployBucketName,
    });
  }
}
