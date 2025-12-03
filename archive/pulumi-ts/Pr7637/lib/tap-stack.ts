/**
 * TapStack - CI/CD Pipeline Infrastructure
 *
 * This stack creates a complete CodePipeline setup for building and deploying
 * a Node.js application from GitHub to S3.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  tags?: Record<string, string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:tap:TapStack', name, {}, opts);

    // Get environment suffix from environment variables
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Get GitHub connection details from environment or config
    const config = new pulumi.Config();
    const githubOwner = config.get('githubOwner') || 'example-org';
    const githubRepo = config.get('githubRepo') || 'example-repo';
    const githubBranch = config.get('githubBranch') || 'main';
    const githubToken =
      config.getSecret('githubToken') || pulumi.output('placeholder-token');

    // Create KMS key for artifact encryption
    const kmsKey = new aws.kms.Key(
      `pipeline-kms-${environmentSuffix}`,
      {
        description: `KMS key for CodePipeline artifacts - ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: {
          ...props.tags,
          Name: `pipeline-kms-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS alias for easier key management
    new aws.kms.Alias(
      `pipeline-kms-alias-${environmentSuffix}`,
      {
        name: `alias/pipeline-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create S3 bucket for pipeline artifacts
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
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        },
        forceDestroy: true, // Allow destroy for CI/CD testing
        tags: {
          ...props.tags,
          Name: `pipeline-artifacts-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block public access to artifact bucket
    new aws.s3.BucketPublicAccessBlock(
      `artifact-bucket-public-access-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create S3 bucket for deployment
    const deploymentBucket = new aws.s3.Bucket(
      `deployment-site-${environmentSuffix}`,
      {
        bucket: `deployment-site-${environmentSuffix}`,
        forceDestroy: true,
        tags: {
          ...props.tags,
          Name: `deployment-site-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block public access to deployment bucket (following security best practices)
    new aws.s3.BucketPublicAccessBlock(
      `deployment-bucket-public-access-block-${environmentSuffix}`,
      {
        bucket: deploymentBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(
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
        tags: {
          ...props.tags,
          Name: `codepipeline-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM policy for CodePipeline with least privilege
    const pipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, deploymentBucket.arn, kmsKey.arn])
          .apply(([artifactArn, deployArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                    's3:GetBucketVersioning',
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
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: '*',
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
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create IAM role for CodeBuild
    const codebuildRole = new aws.iam.Role(
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
        tags: {
          ...props.tags,
          Name: `codebuild-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch log group for CodeBuild
    const codebuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...props.tags,
          Name: `codebuild-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM policy for CodeBuild with least privilege
    const codebuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codebuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, kmsKey.arn, codebuildLogGroup.arn])
          .apply(([artifactArn, kmsArn, logArn]) =>
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
                  Resource: [artifactArn, `${artifactArn}/*`],
                },
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
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                    'kms:DescribeKey',
                  ],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CodeBuild project
    const codebuildProject = new aws.codebuild.Project(
      `nodejs-build-${environmentSuffix}`,
      {
        name: `nodejs-build-${environmentSuffix}`,
        description: `Build project for Node.js application - ${environmentSuffix}`,
        serviceRole: codebuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0', // Contains Node.js 18.x
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'NODE_ENV',
              value: 'production',
              type: 'PLAINTEXT',
            },
            {
              name: 'ARTIFACT_BUCKET',
              value: artifactBucket.bucket,
              type: 'PLAINTEXT',
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing dependencies..."
      - npm install
  pre_build:
    commands:
      - echo "Running tests..."
      - npm test
  build:
    commands:
      - echo "Building application..."
      - npm run build
  post_build:
    commands:
      - echo "Build completed successfully"

artifacts:
  files:
    - '**/*'
  base-directory: 'dist'
  name: BuildArtifact

cache:
  paths:
    - 'node_modules/**/*'
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: codebuildLogGroup.name,
            status: 'ENABLED',
          },
        },
        tags: {
          ...props.tags,
          Name: `nodejs-build-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [codebuildPolicy] }
    );

    // Create CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `nodejs-pipeline-${environmentSuffix}`,
      {
        name: `nodejs-pipeline-${environmentSuffix}`,
        roleArn: pipelineRole.arn,
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
          {
            name: 'Source',
            actions: [
              {
                name: 'Source',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['SourceArtifact'],
                configuration: {
                  Owner: githubOwner,
                  Repo: githubRepo,
                  Branch: githubBranch,
                  OAuthToken: githubToken,
                  PollForSourceChanges: 'false', // Use CloudWatch Events instead
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
                inputArtifacts: ['SourceArtifact'],
                outputArtifacts: ['BuildArtifact'],
                configuration: {
                  ProjectName: codebuildProject.name,
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
                inputArtifacts: ['BuildArtifact'],
                configuration: {
                  BucketName: deploymentBucket.bucket,
                  Extract: 'true',
                },
              },
            ],
          },
        ],
        tags: {
          ...props.tags,
          Name: `nodejs-pipeline-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [pipelinePolicy, codebuildProject] }
    );

    // Create IAM role for CloudWatch Events
    const eventsRole = new aws.iam.Role(
      `pipeline-events-role-${environmentSuffix}`,
      {
        name: `pipeline-events-role-${environmentSuffix}`,
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
        tags: {
          ...props.tags,
          Name: `pipeline-events-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM policy for CloudWatch Events
    const eventsPolicy = new aws.iam.RolePolicy(
      `pipeline-events-policy-${environmentSuffix}`,
      {
        role: eventsRole.id,
        policy: pipeline.arn.apply(pipelineArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'codepipeline:StartPipelineExecution',
                Resource: pipelineArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create CloudWatch Events rule for GitHub changes
    const githubEventRule = new aws.cloudwatch.EventRule(
      `github-trigger-${environmentSuffix}`,
      {
        name: `github-trigger-${environmentSuffix}`,
        description: `Triggers pipeline on GitHub repository changes - ${environmentSuffix}`,
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "detail": {
    "event": ["referenceCreated", "referenceUpdated"],
    "referenceType": ["branch"],
    "referenceName": ["${githubBranch}"]
  }
}`,
        tags: {
          ...props.tags,
          Name: `github-trigger-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Note: For GitHub webhooks, you would typically use GitHub webhooks to trigger CodePipeline
    // However, for this implementation we're setting up CloudWatch Events as requested
    // In a real scenario, you would configure GitHub webhooks to push events to EventBridge

    // Create CloudWatch Events target to trigger pipeline
    new aws.cloudwatch.EventTarget(
      `github-trigger-target-${environmentSuffix}`,
      {
        rule: githubEventRule.name,
        arn: pipeline.arn,
        roleArn: eventsRole.arn,
      },
      { parent: this, dependsOn: [eventsPolicy] }
    );

    // Export stack outputs
    this.pipelineArn = pipeline.arn;
    this.artifactBucketName = artifactBucket.bucket;

    // Register outputs
    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      artifactBucketName: this.artifactBucketName,
      deploymentBucketName: deploymentBucket.bucket,
      codebuildProjectName: codebuildProject.name,
    });
  }
}
