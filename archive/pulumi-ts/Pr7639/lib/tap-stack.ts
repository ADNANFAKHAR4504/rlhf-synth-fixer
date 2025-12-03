import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucket: aws.s3.Bucket;
  public readonly codeBuildProject: aws.codebuild.Project;
  public readonly pipeline: aws.codepipeline.Pipeline;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const envSuffix = pulumi.output(args.environmentSuffix);

    // S3 bucket for pipeline artifacts
    this.artifactBucket = new aws.s3.Bucket(
      'artifact-bucket',
      {
        bucket: pulumi.interpolate`pipeline-artifacts-${envSuffix}`,
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
        tags: {
          Name: pulumi.interpolate`pipeline-artifacts-${envSuffix}`,
          Environment: envSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch log group for CodeBuild
    this.logGroup = new aws.cloudwatch.LogGroup(
      'codebuild-logs',
      {
        name: pulumi.interpolate`/aws/codebuild/pulumi-pipeline-${envSuffix}`,
        retentionInDays: 7,
      },
      { parent: this }
    );

    // IAM role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      'codebuild-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
      },
      { parent: this }
    );

    // IAM policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      'codebuild-policy',
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([this.artifactBucket.arn, this.logGroup.arn])
          .apply(([bucketArn, logArn]) =>
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
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `${logArn}:*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['cloudformation:*'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodeBuild project
    this.codeBuildProject = new aws.codebuild.Project(
      'pulumi-build',
      {
        name: pulumi.interpolate`pulumi-pipeline-${envSuffix}`,
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'ENVIRONMENT_SUFFIX',
              value: envSuffix,
            },
            {
              name: 'AWS_DEFAULT_REGION',
              value: 'us-east-1',
            },
            {
              name: 'PULUMI_ACCESS_TOKEN',
              value: 'placeholder-token',
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
      - npm install
      - curl -fsSL https://get.pulumi.com | sh
      - export PATH=$PATH:$HOME/.pulumi/bin
  build:
    commands:
      - pulumi preview
      - pulumi up --yes
artifacts:
  files:
    - '**/*'`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: this.logGroup.name,
            streamName: 'build-log',
          },
        },
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      'pipeline-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
      },
      { parent: this }
    );

    // IAM policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(
      'pipeline-policy',
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([this.artifactBucket.arn, this.codeBuildProject.arn])
          .apply(([bucketArn, buildArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:*'],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
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

    // CodePipeline
    this.pipeline = new aws.codepipeline.Pipeline(
      'cicd-pipeline',
      {
        name: pulumi.interpolate`infrastructure-pipeline-${envSuffix}`,
        roleArn: pipelineRole.arn,
        artifactStores: [
          {
            location: this.artifactBucket.bucket,
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
                  S3Bucket: this.artifactBucket.bucket,
                  S3ObjectKey: 'source.zip',
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
                version: '1',
                inputArtifacts: ['source_output'],
                outputArtifacts: ['build_output'],
                configuration: {
                  ProjectName: this.codeBuildProject.name,
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
                  CustomData: 'Please review and approve the deployment',
                },
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
                version: '1',
                inputArtifacts: ['build_output'],
                configuration: {
                  ProjectName: this.codeBuildProject.name,
                },
              },
            ],
          },
        ],
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    this.registerOutputs({
      artifactBucketName: this.artifactBucket.id,
      codeBuildProjectName: this.codeBuildProject.name,
      pipelineName: this.pipeline.name,
      logGroupName: this.logGroup.name,
    });
  }
}
