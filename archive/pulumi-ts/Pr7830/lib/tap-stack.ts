import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly deployBucketName: pulumi.Output<string>;
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly codePipelineName: pulumi.Output<string>;
  public readonly codeBuildLogGroupName: pulumi.Output<string>;
  public readonly codeBuildRoleArn: pulumi.Output<string>;
  public readonly codePipelineRoleArn: pulumi.Output<string>;
  public readonly eventRuleArn: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:resource:TapStack', name, {}, opts);

    const { environmentSuffix } = props;

    const tags = {
      Environment: 'production',
      ManagedBy: 'pulumi',
    };

    // S3 Bucket for Build Artifacts
    const artifactBucket = new aws.s3.Bucket(
      `artifact-bucket-${environmentSuffix}`,
      {
        bucket: `artifact-bucket-${environmentSuffix}`,
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
            id: 'delete-old-artifacts',
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

    // S3 Bucket for Deployment
    const deployBucket = new aws.s3.Bucket(
      `deploy-bucket-${environmentSuffix}`,
      {
        bucket: `deploy-bucket-${environmentSuffix}`,
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

    // CloudWatch Log Group for CodeBuild
    const codeBuildLogGroup = new aws.cloudwatch.LogGroup(
      `codebuild-log-group-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(
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
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        name: `codebuild-policy-${environmentSuffix}`,
        role: codeBuildRole.id,
        policy: pulumi
          .all([artifactBucket.arn, deployBucket.arn, codeBuildLogGroup.arn])
          .apply(([artifactBucketArn, deployBucketArn, logGroupArn]) =>
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
                  Resource: [logGroupArn, `${logGroupArn}:*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject',
                  ],
                  Resource: [`${artifactBucketArn}/*`, `${deployBucketArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ListBucket'],
                  Resource: [artifactBucketArn, deployBucketArn],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodeBuild Project
    const codeBuildProject = new aws.codebuild.Project(
      `nodejs-build-${environmentSuffix}`,
      {
        name: `nodejs-build-${environmentSuffix}`,
        description: 'CodeBuild project for Node.js application',
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
              name: 'NODE_ENV',
              value: 'production',
              type: 'PLAINTEXT',
            },
            {
              name: 'BUILD_NUMBER',
              value: '#{CODEBUILD_BUILD_NUMBER}',
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
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Building Node.js application..."
      - npm run build || echo "No build script found"
      - echo "Build completed on \`date\`"
  post_build:
    commands:
      - echo "Creating artifact..."

artifacts:
  files:
    - '**/*'
  name: BuildArtifact
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
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for CodePipeline
    const codePipelinePolicy = new aws.iam.RolePolicy(
      `codepipeline-policy-${environmentSuffix}`,
      {
        name: `codepipeline-policy-${environmentSuffix}`,
        role: codePipelineRole.id,
        policy: pulumi
          .all([artifactBucket.arn, deployBucket.arn, codeBuildProject.arn])
          .apply(([artifactBucketArn, deployBucketArn, codeBuildArn]) =>
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
                    artifactBucketArn,
                    `${artifactBucketArn}/*`,
                    deployBucketArn,
                    `${deployBucketArn}/*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                  Resource: codeBuildArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CodePipeline
    const codePipeline = new aws.codepipeline.Pipeline(
      `nodejs-pipeline-${environmentSuffix}`,
      {
        name: `nodejs-pipeline-${environmentSuffix}`,
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
                owner: 'AWS',
                provider: 'S3',
                version: '1',
                outputArtifacts: ['SourceOutput'],
                configuration: {
                  S3Bucket: artifactBucket.bucket,
                  S3ObjectKey: 'source.zip',
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
                inputArtifacts: ['SourceOutput'],
                outputArtifacts: ['BuildOutput'],
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
                provider: 'S3',
                version: '1',
                inputArtifacts: ['BuildOutput'],
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
      { parent: this, dependsOn: [codePipelinePolicy] }
    );

    // IAM Role for EventBridge
    const eventBridgeRole = new aws.iam.Role(
      `eventbridge-role-${environmentSuffix}`,
      {
        name: `eventbridge-role-${environmentSuffix}`,
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
        tags: tags,
      },
      { parent: this }
    );

    // IAM Policy for EventBridge to trigger CodePipeline
    const eventBridgePolicy = new aws.iam.RolePolicy(
      `eventbridge-policy-${environmentSuffix}`,
      {
        name: `eventbridge-policy-${environmentSuffix}`,
        role: eventBridgeRole.id,
        policy: codePipeline.arn.apply(pipelineArn =>
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

    // EventBridge Rule for S3 Object Creation (Pipeline Trigger)
    const s3TriggerRule = new aws.cloudwatch.EventRule(
      `s3-trigger-rule-${environmentSuffix}`,
      {
        name: `s3-trigger-rule-${environmentSuffix}`,
        description: 'Trigger pipeline when source artifact is uploaded',
        eventPattern: artifactBucket.bucket.apply(bucketName =>
          JSON.stringify({
            source: ['aws.s3'],
            'detail-type': ['Object Created'],
            detail: {
              bucket: {
                name: [bucketName],
              },
              object: {
                key: [{ prefix: 'source' }],
              },
            },
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge Target for Pipeline Trigger
    new aws.cloudwatch.EventTarget(
      `s3-trigger-target-${environmentSuffix}`,
      {
        rule: s3TriggerRule.name,
        arn: codePipeline.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this, dependsOn: [eventBridgePolicy] }
    );

    // EventBridge Rule for Build Failures
    const buildFailureRule = new aws.cloudwatch.EventRule(
      `build-failure-rule-${environmentSuffix}`,
      {
        name: `build-failure-rule-${environmentSuffix}`,
        description: 'Capture CodeBuild build failures',
        eventPattern: codeBuildProject.name.apply(projectName =>
          JSON.stringify({
            source: ['aws.codebuild'],
            'detail-type': ['CodeBuild Build State Change'],
            detail: {
              'build-status': ['FAILED'],
              'project-name': [projectName],
            },
          })
        ),
        tags: tags,
      },
      { parent: this }
    );

    // CloudWatch Log Group for Build Failure Events
    const buildFailureLogGroup = new aws.cloudwatch.LogGroup(
      `build-failure-log-group-${environmentSuffix}`,
      {
        name: `/aws/events/codebuild-failures-${environmentSuffix}`,
        retentionInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // EventBridge Target for Build Failures (Log to CloudWatch)
    new aws.cloudwatch.EventTarget(
      `build-failure-target-${environmentSuffix}`,
      {
        rule: buildFailureRule.name,
        arn: buildFailureLogGroup.arn.apply(arn => arn.replace(':*', '')),
      },
      { parent: this }
    );

    // Enable EventBridge notifications for S3 bucket
    new aws.s3.BucketNotification(
      `artifact-bucket-notification-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        eventbridge: true,
      },
      { parent: this }
    );

    // Exports
    this.artifactBucketName = artifactBucket.bucket;
    this.deployBucketName = deployBucket.bucket;
    this.codeBuildProjectName = codeBuildProject.name;
    this.codePipelineName = codePipeline.name;
    this.codeBuildLogGroupName = codeBuildLogGroup.name;
    this.codeBuildRoleArn = codeBuildRole.arn;
    this.codePipelineRoleArn = codePipelineRole.arn;
    this.eventRuleArn = buildFailureRule.arn;

    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      deployBucketName: this.deployBucketName,
      codeBuildProjectName: this.codeBuildProjectName,
      codePipelineName: this.codePipelineName,
      codeBuildLogGroupName: this.codeBuildLogGroupName,
      codeBuildRoleArn: this.codeBuildRoleArn,
      codePipelineRoleArn: this.codePipelineRoleArn,
      eventRuleArn: this.eventRuleArn,
    });
  }
}
