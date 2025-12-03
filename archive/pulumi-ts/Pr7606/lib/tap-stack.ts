/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Infrastructure for automated deployment
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
   * GitHub repository owner
   */
  githubOwner?: string;

  /**
   * GitHub repository name
   */
  githubRepo?: string;

  /**
   * GitHub OAuth token ARN in Secrets Manager
   */
  githubTokenArn?: string;

  /**
   * Pulumi access token ARN in Secrets Manager
   */
  pulumiTokenArn?: string;

  /**
   * AWS region for deployment
   */
  awsRegion?: string;
}

/**
 * Represents the main Pulumi component resource for the CI/CD pipeline.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs = {}, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.awsRegion || 'us-east-1';
    const defaultTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'TAP',
      ...(args.tags || {}),
    };

    // S3 bucket for pipeline artifacts
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
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
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

    // IAM role for CodePipeline
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // IAM policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        name: `codepipeline-policy-${environmentSuffix}`,
        role: pipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, pulumi.output(region)])
          .apply(([bucketArn, reg]) =>
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
                  Resource: `arn:aws:codebuild:${reg}:*:project/pulumi-deploy-${environmentSuffix}`,
                },
                {
                  Effect: 'Allow',
                  Action: ['iam:PassRole'],
                  Resource: '*',
                  Condition: {
                    StringEqualsIfExists: {
                      'iam:PassedToService': ['codebuild.amazonaws.com'],
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM role for CodeBuild
    const buildRole = new aws.iam.Role(
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

    // IAM policy for CodeBuild
    const buildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        name: `codebuild-policy-${environmentSuffix}`,
        role: buildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, region, args.pulumiTokenArn])
          .apply(([bucketArn, reg, tokenArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                    's3:ListBucket',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: `arn:aws:logs:${reg}:*:log-group:/aws/codebuild/pulumi-deploy-${environmentSuffix}:*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource:
                    tokenArn ||
                    `arn:aws:secretsmanager:${reg}:*:secret:pulumi-token-*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ec2:*',
                    's3:*',
                    'lambda:*',
                    'iam:*',
                    'cloudwatch:*',
                    'logs:*',
                    'dynamodb:*',
                    'rds:*',
                    'elasticloadbalancing:*',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const buildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/pulumi-deploy-${environmentSuffix}`,
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      `pulumi-deploy-${environmentSuffix}`,
      {
        name: `pulumi-deploy-${environmentSuffix}`,
        serviceRole: buildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          privilegedMode: false,
          environmentVariables: [
            {
              name: 'PULUMI_ACCESS_TOKEN',
              value:
                args.pulumiTokenArn ||
                `arn:aws:secretsmanager:${region}:123456789012:secret:pulumi-token`,
              type: 'SECRETS_MANAGER',
            },
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
              type: 'PLAINTEXT',
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: region,
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
      - echo "Installing Pulumi CLI..."
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
      - pulumi version
      - echo "Installing Node.js dependencies..."
      - npm ci

  pre_build:
    commands:
      - echo "Authenticating with Pulumi..."
      - pulumi login
      - echo "Selecting Pulumi stack..."
      - pulumi stack select $ENVIRONMENT || pulumi stack init $ENVIRONMENT
      - echo "Refreshing stack state..."
      - pulumi refresh --yes

  build:
    commands:
      - echo "Running Pulumi preview..."
      - pulumi preview --diff
      - echo "Deploying infrastructure..."
      - pulumi up --yes --skip-preview

  post_build:
    commands:
      - echo "Deployment completed successfully"
      - pulumi stack output

artifacts:
  files:
    - '**/*'
  name: build-output`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: buildLogGroup.name,
            status: 'ENABLED',
          },
        },
        buildTimeout: 20,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [buildPolicy, buildLogGroup] }
    );

    // CodePipeline
    const pipeline = new aws.codepipeline.Pipeline(
      `infrastructure-pipeline-${environmentSuffix}`,
      {
        name: `infrastructure-pipeline-${environmentSuffix}`,
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
                name: 'SourceAction',
                category: 'Source',
                owner: 'ThirdParty',
                provider: 'GitHub',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  Owner: args.githubOwner || 'default-owner',
                  Repo: args.githubRepo || 'default-repo',
                  Branch: 'main',
                  OAuthToken: args.githubTokenArn
                    ? pulumi.interpolate`{{resolve:secretsmanager:${args.githubTokenArn}}}`
                    : '{{resolve:secretsmanager:github-token}}',
                  PollForSourceChanges: 'true',
                },
              },
            ],
          },
          {
            name: 'Build',
            actions: [
              {
                name: 'BuildAction',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['build_output'],
                version: '1',
                configuration: {
                  ProjectName: buildProject.name,
                },
                runOrder: 1,
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
                    'Please review the infrastructure changes before deploying to production.',
                },
                runOrder: 1,
              },
            ],
          },
          {
            name: 'Deploy',
            actions: [
              {
                name: 'DeployAction',
                category: 'Build',
                owner: 'AWS',
                provider: 'CodeBuild',
                inputArtifacts: ['build_output'],
                version: '1',
                configuration: {
                  ProjectName: buildProject.name,
                },
                runOrder: 1,
              },
            ],
          },
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [pipelinePolicy, artifactBucket] }
    );

    this.pipelineArn = pipeline.arn;
    this.artifactBucketName = artifactBucket.bucket;
    this.buildProjectName = buildProject.name;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      pipelineName: pipeline.name,
      artifactBucketName: this.artifactBucketName,
      buildProjectName: this.buildProjectName,
      buildLogGroupName: buildLogGroup.name,
      region: pulumi.output(region),
    });
  }
}
