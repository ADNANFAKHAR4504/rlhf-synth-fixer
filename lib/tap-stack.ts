import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  environmentSuffix: pulumi.Input<string>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly pipelineArn: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly repositoryCloneUrl: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:resource:TapStack', name, {}, opts);

    const { environmentSuffix } = props;

    // CodeCommit Repository
    const repository = new aws.codecommit.Repository(
      'code-repository',
      {
        repositoryName: pulumi.interpolate`nodeapp-repo-${environmentSuffix}`,
        description: 'Source code repository for Node.js application',
        defaultBranch: 'main',
        tags: {
          Environment: 'Production',
          Project: 'NodeApp',
        },
      },
      { parent: this }
    );

    // S3 Bucket for Artifacts
    const artifactBucket = new aws.s3.Bucket(
      'artifact-bucket',
      {
        bucket: pulumi.interpolate`nodeapp-artifacts-${environmentSuffix}`,
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
        tags: {
          Environment: 'Production',
          Project: 'NodeApp',
        },
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
      'codebuild-role',
      {
        name: pulumi.interpolate`codebuild-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'codebuild.amazonaws.com',
        }),
        tags: {
          Environment: 'Production',
          Project: 'NodeApp',
        },
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      'codebuild-policy',
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, repository.arn])
          .apply(([bucketArn, repoArn]) =>
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
                  Resource: 'arn:aws:logs:*:*:*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetObjectVersion',
                  ],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['codecommit:GitPull'],
                  Resource: repoArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const buildLogGroup = new aws.cloudwatch.LogGroup(
      'build-log-group',
      {
        name: pulumi.interpolate`/aws/codebuild/nodeapp-build-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          Environment: 'Production',
          Project: 'NodeApp',
        },
      },
      { parent: this }
    );

    // CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      'build-project',
      {
        name: pulumi.interpolate`nodeapp-build-${environmentSuffix}`,
        description: 'Build project for Node.js application',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'CODEPIPELINE',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:5.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'ENVIRONMENT',
              value: 'production',
            },
          ],
        },
        source: {
          type: 'CODEPIPELINE',
          buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Running tests..."
      - npm test
      - echo "Building application..."
      - npm run build
  post_build:
    commands:
      - echo "Build completed on \`date\`"
artifacts:
  files:
    - '**/*'
  base-directory: .
`,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: buildLogGroup.name,
            status: 'ENABLED',
          },
        },
        tags: {
          Environment: 'Production',
          Project: 'NodeApp',
        },
      },
      { parent: this, dependsOn: [codeBuildPolicy] }
    );

    // IAM Role for CodePipeline
    const pipelineRole = new aws.iam.Role(
      'pipeline-role',
      {
        name: pulumi.interpolate`pipeline-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'codepipeline.amazonaws.com',
        }),
        tags: {
          Environment: 'Production',
          Project: 'NodeApp',
        },
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline
    const pipelinePolicy = new aws.iam.RolePolicy(
      'pipeline-policy',
      {
        role: pipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, repository.arn, buildProject.arn])
          .apply(([bucketArn, repoArn, buildArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:GetObjectVersion',
                    's3:GetBucketLocation',
                  ],
                  Resource: [bucketArn, `${bucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'codecommit:GetBranch',
                    'codecommit:GetCommit',
                    'codecommit:UploadArchive',
                    'codecommit:GetUploadArchiveStatus',
                  ],
                  Resource: repoArn,
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
    const pipeline = new aws.codepipeline.Pipeline(
      'cicd-pipeline',
      {
        name: pulumi.interpolate`nodeapp-pipeline-${environmentSuffix}`,
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
                owner: 'AWS',
                provider: 'CodeCommit',
                version: '1',
                outputArtifacts: ['source_output'],
                configuration: {
                  RepositoryName: repository.repositoryName,
                  BranchName: 'main',
                  PollForSourceChanges: 'false',
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
                  BucketName: artifactBucket.bucket,
                  Extract: 'true',
                },
              },
            ],
          },
        ],
        tags: {
          Environment: 'Production',
          Project: 'NodeApp',
        },
      },
      { parent: this, dependsOn: [pipelinePolicy] }
    );

    // Outputs
    this.pipelineArn = pipeline.arn;
    this.artifactBucketName = artifactBucket.bucket;
    this.repositoryCloneUrl = repository.cloneUrlHttp;

    this.registerOutputs({
      pipelineArn: this.pipelineArn,
      artifactBucketName: this.artifactBucketName,
      repositoryCloneUrl: this.repositoryCloneUrl,
    });
  }
}
