/**
 * tap-stack.ts
 *
 * Self-managed CI/CD pipeline for deploying Pulumi stacks across multiple AWS accounts
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
  githubToken: pulumi.Input<string>;
  ecrImageUri: pulumi.Input<string>;
  devAccountId?: string;
  stagingAccountId?: string;
  prodAccountId?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly devPipelineArn: pulumi.Output<string>;
  public readonly stagingPipelineArn: pulumi.Output<string>;
  public readonly prodPipelineArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const environmentSuffixLower = environmentSuffix.toLowerCase();
    const tags = args.tags || {};
    const githubBranch = args.githubBranch || 'main';

    // Multi-account configuration
    const accounts = {
      dev: args.devAccountId || '123456789012',
      staging: args.stagingAccountId || '234567890123',
      prod: args.prodAccountId || '345678901234',
    };

    // Create KMS key for artifact encryption with rotation enabled
    const artifactKmsKey = new aws.kms.Key(
      `pipeline-artifact-key-${environmentSuffix}`,
      {
        description: `KMS key for pipeline artifacts encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `pipeline-artifact-key-alias-${environmentSuffix}`,
      {
        name: `alias/pipeline-artifact-${environmentSuffix}`,
        targetKeyId: artifactKmsKey.keyId,
      },
      { parent: this }
    );

    // Create S3 bucket for pipeline artifacts
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${environmentSuffixLower}`,
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: artifactKmsKey.keyId,
            },
            bucketKeyEnabled: true,
          },
        },
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 90,
            },
            noncurrentVersionExpiration: {
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

    // Create S3 buckets for Pulumi state (one per environment)
    const stateBuckets: { [key: string]: aws.s3.Bucket } = {};

    ['dev', 'staging', 'prod'].forEach(env => {
      stateBuckets[env] = new aws.s3.Bucket(
        `pulumi-state-${env}-${environmentSuffix}`,
        {
          bucket: `pulumi-state-${env}-${environmentSuffixLower}`,
          forceDestroy: true,
          serverSideEncryptionConfiguration: {
            rule: {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: artifactKmsKey.keyId,
              },
              bucketKeyEnabled: true,
            },
          },
          versioning: {
            enabled: true,
          },
          lifecycleRules: [
            {
              enabled: true,
              noncurrentVersionExpiration: {
                days: 90,
              },
            },
          ],
          tags: { ...tags, Environment: env },
        },
        { parent: this }
      );

      new aws.s3.BucketPublicAccessBlock(
        `pulumi-state-pab-${env}-${environmentSuffix}`,
        {
          bucket: stateBuckets[env].id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        { parent: this }
      );
    });

    // Create CloudWatch Log Group for build logs (30 days retention)
    const buildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/pulumi-pipeline-${environmentSuffix}`,
        retentionInDays: 30,
        tags: tags,
      },
      { parent: this }
    );

    // Create IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      `pipeline-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Policy for CodePipeline role
    new aws.iam.RolePolicy(
      `pipeline-policy-${environmentSuffix}`,
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, artifactKmsKey.arn])
          .apply(([bucketArn, keyArn]) =>
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
                  Action: [
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                    'kms:DescribeKey',
                  ],
                  Resource: keyArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create IAM role for CodeBuild with cross-account assume permissions
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // Policy for CodeBuild role with least-privilege access
    new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([
            artifactBucket.arn,
            artifactKmsKey.arn,
            buildLogGroup.arn,
            stateBuckets.dev.arn,
            stateBuckets.staging.arn,
            stateBuckets.prod.arn,
          ])
          .apply(
            ([
              bucketArn,
              keyArn,
              logArn,
              devBucketArn,
              stagingBucketArn,
              prodBucketArn,
            ]) =>
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
                      's3:ListBucket',
                    ],
                    Resource: [
                      bucketArn,
                      `${bucketArn}/*`,
                      devBucketArn,
                      `${devBucketArn}/*`,
                      stagingBucketArn,
                      `${stagingBucketArn}/*`,
                      prodBucketArn,
                      `${prodBucketArn}/*`,
                    ],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'kms:Decrypt',
                      'kms:Encrypt',
                      'kms:ReEncrypt*',
                      'kms:GenerateDataKey*',
                      'kms:DescribeKey',
                    ],
                    Resource: keyArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: 'sts:AssumeRole',
                    Resource: [
                      `arn:aws:iam::${accounts.dev}:role/PulumiDeploymentRole`,
                      `arn:aws:iam::${accounts.staging}:role/PulumiDeploymentRole`,
                      `arn:aws:iam::${accounts.prod}:role/PulumiDeploymentRole`,
                    ],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'ecr:GetAuthorizationToken',
                      'ecr:BatchCheckLayerAvailability',
                      'ecr:GetDownloadUrlForLayer',
                      'ecr:BatchGetImage',
                    ],
                    Resource: '*',
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // Create SNS topic for pipeline notifications
    const notificationTopic = new aws.sns.Topic(
      `pipeline-notifications-${environmentSuffix}`,
      {
        displayName: `Pipeline Notifications - ${environmentSuffix}`,
        kmsMasterKeyId: artifactKmsKey.id,
        tags: tags,
      },
      { parent: this }
    );

    // Create CodeBuild projects for preview and deploy stages
    const createCodeBuildProject = (
      projectName: string,
      environment: string,
      command: string
    ): aws.codebuild.Project => {
      return new aws.codebuild.Project(
        projectName,
        {
          name: projectName,
          description: `Pulumi ${command} for ${environment} environment`,
          serviceRole: codeBuildRole.arn,
          artifacts: {
            type: 'CODEPIPELINE',
          },
          environment: {
            computeType: 'BUILD_GENERAL1_LARGE',
            image: args.ecrImageUri,
            type: 'LINUX_CONTAINER',
            imagePullCredentialsType: 'SERVICE_ROLE',
            environmentVariables: [
              {
                name: 'PULUMI_BACKEND_URL',
                value: pulumi.interpolate`s3://${stateBuckets[environment].bucket}`,
              },
              {
                name: 'ENVIRONMENT',
                value: environment,
              },
              {
                name: 'AWS_ACCOUNT_ID',
                value: accounts[environment as keyof typeof accounts],
              },
              {
                name: 'PULUMI_COMMAND',
                value: command,
              },
            ],
          },
          source: {
            type: 'CODEPIPELINE',
            buildspec: `version: 0.2

phases:
  pre_build:
    commands:
      - echo "Logging into Pulumi backend"
      - pulumi login $PULUMI_BACKEND_URL
      - echo "Installing dependencies"
      - npm ci

  build:
    commands:
      - echo "Running Pulumi $PULUMI_COMMAND"
      - |
        if [ "$PULUMI_COMMAND" = "preview" ]; then
          pulumi stack select $ENVIRONMENT || pulumi stack init $ENVIRONMENT
          pulumi preview --non-interactive --diff
        else
          pulumi stack select $ENVIRONMENT || pulumi stack init $ENVIRONMENT
          pulumi up --yes --non-interactive --skip-preview
        fi

  post_build:
    commands:
      - echo "Pulumi $PULUMI_COMMAND completed successfully"
      - pulumi stack output --json > stack-outputs.json || echo "{}" > stack-outputs.json

artifacts:
  files:
    - '**/*'
    - stack-outputs.json
`,
          },
          logsConfig: {
            cloudwatchLogs: {
              groupName: buildLogGroup.name,
              streamName: `${environment}-${command}`,
            },
          },
          tags: { ...tags, Environment: environment },
        },
        { parent: this }
      );
    };

    // Create preview and deploy projects for each environment
    const previewProjects: { [key: string]: aws.codebuild.Project } = {};
    const deployProjects: { [key: string]: aws.codebuild.Project } = {};

    ['dev', 'staging', 'prod'].forEach(env => {
      previewProjects[env] = createCodeBuildProject(
        `pulumi-preview-${env}-${environmentSuffix}`,
        env,
        'preview'
      );

      deployProjects[env] = createCodeBuildProject(
        `pulumi-deploy-${env}-${environmentSuffix}`,
        env,
        'up'
      );
    });

    // Create CodePipeline for each environment
    const createPipeline = (
      pipelineName: string,
      environment: string,
      includeManualApproval: boolean
    ): aws.codepipeline.Pipeline => {
      const stages: aws.types.input.codepipeline.PipelineStage[] = [
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
                OAuthToken: args.githubToken,
                PollForSourceChanges: 'false',
              },
            },
          ],
        },
        {
          name: 'Build',
          actions: [
            {
              name: 'PulumiPreview',
              category: 'Build',
              owner: 'AWS',
              provider: 'CodeBuild',
              version: '1',
              inputArtifacts: ['source_output'],
              outputArtifacts: ['build_output'],
              configuration: {
                ProjectName: previewProjects[environment].name,
              },
            },
          ],
        },
      ];

      // Add manual approval for production
      if (includeManualApproval) {
        stages.push({
          name: 'Approval',
          actions: [
            {
              name: 'ManualApproval',
              category: 'Approval',
              owner: 'AWS',
              provider: 'Manual',
              version: '1',
              configuration: {
                NotificationArn: notificationTopic.arn,
                CustomData: `Please review and approve deployment to ${environment} environment`,
              },
            },
          ],
        });
      }

      stages.push({
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
              ProjectName: deployProjects[environment].name,
            },
          },
        ],
      });

      return new aws.codepipeline.Pipeline(
        pipelineName,
        {
          name: pipelineName,
          roleArn: pipelineRole.arn,
          artifactStores: [
            {
              location: artifactBucket.bucket,
              type: 'S3',
              encryptionKey: {
                id: artifactKmsKey.arn,
                type: 'KMS',
              },
            },
          ],
          stages: stages,
          tags: { ...tags, Environment: environment },
        },
        {
          parent: this,
          dependsOn: [
            previewProjects[environment],
            deployProjects[environment],
          ],
        }
      );
    };

    // Create pipelines for each environment
    const devPipeline = createPipeline(
      `pulumi-pipeline-dev-${environmentSuffix}`,
      'dev',
      false
    );

    const stagingPipeline = createPipeline(
      `pulumi-pipeline-staging-${environmentSuffix}`,
      'staging',
      false
    );

    const prodPipeline = createPipeline(
      `pulumi-pipeline-prod-${environmentSuffix}`,
      'prod',
      true // Include manual approval for production
    );

    // Create EventBridge rule to trigger pipeline on GitHub push
    const githubWebhookRule = new aws.cloudwatch.EventRule(
      `github-push-rule-${environmentSuffix}`,
      {
        description: `Trigger pipelines on GitHub push to ${args.githubRepo}`,
        eventPattern: JSON.stringify({
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['STARTED', 'SUCCEEDED', 'FAILED'],
          },
        }),
        tags: tags,
      },
      { parent: this }
    );

    // Create EventBridge target to send notifications
    new aws.cloudwatch.EventTarget(
      `pipeline-notification-target-${environmentSuffix}`,
      {
        rule: githubWebhookRule.name,
        arn: notificationTopic.arn,
      },
      { parent: this }
    );

    // Create SNS topic policy to allow EventBridge to publish
    new aws.sns.TopicPolicy(
      `notification-topic-policy-${environmentSuffix}`,
      {
        arn: notificationTopic.arn,
        policy: pulumi
          .all([notificationTopic.arn, githubWebhookRule.arn])
          .apply(([topicArn, ruleArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'events.amazonaws.com' },
                  Action: 'sns:Publish',
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
      { parent: this }
    );

    // Store outputs
    this.devPipelineArn = devPipeline.arn;
    this.stagingPipelineArn = stagingPipeline.arn;
    this.prodPipelineArn = prodPipeline.arn;

    this.registerOutputs({
      devPipelineArn: this.devPipelineArn,
      stagingPipelineArn: this.stagingPipelineArn,
      prodPipelineArn: this.prodPipelineArn,
      artifactBucketName: artifactBucket.id,
      devStateBucketName: stateBuckets.dev.id,
      stagingStateBucketName: stateBuckets.staging.id,
      prodStateBucketName: stateBuckets.prod.id,
      kmsKeyId: artifactKmsKey.id,
      notificationTopicArn: notificationTopic.arn,
      buildLogGroupName: buildLogGroup.name,
    });
  }
}
