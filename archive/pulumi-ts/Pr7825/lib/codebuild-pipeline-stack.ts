import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeBuildPipelineStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  notificationEmail?: string;
}

export class CodeBuildPipelineStack extends pulumi.ComponentResource {
  public readonly repositoryCloneUrl: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;
  public readonly buildProjectArn: pulumi.Output<string>;
  public readonly artifactsBucketName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly serviceRoleArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly eventBridgeRuleArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeBuildPipelineStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:codebuild:CodeBuildPipelineStack', name, args, opts);

    const { environmentSuffix, tags = {}, notificationEmail } = args;

    const commonTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: 'production',
      Team: 'devops',
      Project: 'ci-cd-pipeline',
      ManagedBy: 'pulumi',
    }));

    // Get current AWS account ID and region
    const current = aws.getCallerIdentity({});
    const currentRegion = aws.getRegion({});

    // 1. KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      `codebuild-key-${environmentSuffix}`,
      {
        description: `KMS key for CodeBuild encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    void new aws.kms.Alias(
      `alias-codebuild-${environmentSuffix}`,
      {
        name: `alias/codebuild-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // 2. CodeCommit Repository
    const repository = new aws.codecommit.Repository(
      `app-repo-${environmentSuffix}`,
      {
        repositoryName: `app-repo-${environmentSuffix}`,
        description: 'Application source code repository',
        tags: commonTags,
      },
      { parent: this }
    );

    // 3. S3 Bucket for Build Artifacts
    const artifactsBucket = new aws.s3.BucketV2(
      `build-artifacts-${environmentSuffix}`,
      {
        bucket: `build-artifacts-${environmentSuffix}`,
        tags: commonTags,
      },
      { parent: this }
    );

    void new aws.s3.BucketVersioningV2(
      `artifacts-versioning-${environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    void new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `artifacts-encryption-${environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    void new aws.s3.BucketLifecycleConfigurationV2(
      `artifacts-lifecycle-${environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        rules: [
          {
            id: 'delete-old-artifacts',
            status: 'Enabled',
            expiration: {
              days: 30,
            },
          },
        ],
      },
      { parent: this }
    );

    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `artifacts-public-access-block-${environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // 4. SNS Topic for Notifications
    const snsTopic = new aws.sns.Topic(
      `build-notifications-${environmentSuffix}`,
      {
        name: `build-notifications-${environmentSuffix}`,
        displayName: 'CodeBuild Notifications',
        kmsMasterKeyId: kmsKey.id,
        tags: commonTags,
      },
      { parent: this }
    );

    if (notificationEmail) {
      new aws.sns.TopicSubscription(
        `email-subscription-${environmentSuffix}`,
        {
          topic: snsTopic.arn,
          protocol: 'email',
          endpoint: notificationEmail,
        },
        { parent: this }
      );
    }

    // 5. CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `/aws/codebuild/build-project-${environmentSuffix}`,
      {
        name: `/aws/codebuild/build-project-${environmentSuffix}`,
        retentionInDays: 7,
        kmsKeyId: kmsKey.arn,
        tags: commonTags,
      },
      { parent: this }
    );

    // 6. IAM Role for CodeBuild
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
        tags: commonTags,
      },
      { parent: this }
    );

    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([
            repository.arn,
            artifactsBucket.arn,
            logGroup.arn,
            snsTopic.arn,
            kmsKey.arn,
          ])
          .apply(([repoArn, bucketArn, logArn, topicArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'codecommit:GitPull',
                    'codecommit:GetBranch',
                    'codecommit:GetCommit',
                  ],
                  Resource: repoArn,
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
                  Action: [
                    's3:ListBucket',
                    's3:GetBucketLocation',
                    's3:GetBucketVersioning',
                  ],
                  Resource: bucketArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `${logArn}:*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey',
                  ],
                  Resource: keyArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 7. CodeBuild Project
    const buildProject = new aws.codebuild.Project(
      `build-project-${environmentSuffix}`,
      {
        name: `build-project-${environmentSuffix}`,
        description: 'CI/CD build project',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactsBucket.bucket,
          encryptionDisabled: false,
        },
        cache: {
          type: 'S3',
          location: pulumi.interpolate`${artifactsBucket.bucket}/cache`,
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/standard:7.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'ENVIRONMENT_SUFFIX',
              value: environmentSuffix,
              type: 'PLAINTEXT',
            },
          ],
        },
        source: {
          type: 'CODECOMMIT',
          location: repository.cloneUrlHttp,
          buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - npm install
  build:
    commands:
      - echo "Build started on $(date)"
      - npm run build
  post_build:
    commands:
      - echo "Build completed on $(date)"
artifacts:
  files:
    - '**/*'
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
        buildTimeout: 15,
        encryptionKey: kmsKey.arn,
        tags: commonTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy, bucketPublicAccessBlock] }
    );

    // 8. EventBridge Rule for automatic triggers
    const eventBridgeRole = new aws.iam.Role(
      `eventbridge-role-${environmentSuffix}`,
      {
        name: `eventbridge-codebuild-role-${environmentSuffix}`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    const eventBridgePolicy = new aws.iam.RolePolicy(
      `eventbridge-policy-${environmentSuffix}`,
      {
        role: eventBridgeRole.id,
        policy: buildProject.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'codebuild:StartBuild',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const eventBridgeRule = new aws.cloudwatch.EventRule(
      `codecommit-trigger-${environmentSuffix}`,
      {
        name: `codecommit-build-trigger-${environmentSuffix}`,
        description: 'Trigger CodeBuild on CodeCommit main branch changes',
        eventPattern: repository.arn.apply(repoArn =>
          JSON.stringify({
            source: ['aws.codecommit'],
            'detail-type': ['CodeCommit Repository State Change'],
            detail: {
              event: ['referenceCreated', 'referenceUpdated'],
              referenceType: ['branch'],
              referenceName: ['main'],
            },
            resources: [repoArn],
          })
        ),
        tags: commonTags,
      },
      { parent: this }
    );

    void new aws.cloudwatch.EventTarget(
      `codebuild-target-${environmentSuffix}`,
      {
        rule: eventBridgeRule.name,
        arn: buildProject.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this, dependsOn: [eventBridgePolicy] }
    );

    // 9. CloudWatch Alarms
    void new aws.cloudwatch.MetricAlarm(
      `build-failure-alarm-${environmentSuffix}`,
      {
        name: `codebuild-failure-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'FailedBuilds',
        namespace: 'AWS/CodeBuild',
        period: 300,
        statistic: 'Sum',
        threshold: 1,
        alarmDescription: 'Triggers when 2 consecutive builds fail',
        treatMissingData: 'notBreaching',
        dimensions: {
          ProjectName: buildProject.name,
        },
        alarmActions: [snsTopic.arn],
        tags: commonTags,
      },
      { parent: this }
    );

    void new aws.cloudwatch.MetricAlarm(
      `build-duration-alarm-${environmentSuffix}`,
      {
        name: `codebuild-duration-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Duration',
        namespace: 'AWS/CodeBuild',
        period: 300,
        statistic: 'Average',
        threshold: 600000, // 10 minutes in milliseconds
        alarmDescription: 'Triggers when build duration exceeds 10 minutes',
        treatMissingData: 'notBreaching',
        dimensions: {
          ProjectName: buildProject.name,
        },
        alarmActions: [snsTopic.arn],
        tags: commonTags,
      },
      { parent: this }
    );

    void new aws.cloudwatch.MetricAlarm(
      `daily-failure-alarm-${environmentSuffix}`,
      {
        name: `codebuild-daily-failure-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FailedBuilds',
        namespace: 'AWS/CodeBuild',
        period: 86400, // 24 hours
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Triggers when more than 5 builds fail in a day',
        treatMissingData: 'notBreaching',
        dimensions: {
          ProjectName: buildProject.name,
        },
        alarmActions: [snsTopic.arn],
        tags: commonTags,
      },
      { parent: this }
    );

    // 10. CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `codebuild-dashboard-${environmentSuffix}`,
      {
        dashboardName: `codebuild-dashboard-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([buildProject.name, currentRegion])
          .apply(([projectName, reg]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  x: 0,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/CodeBuild',
                        'SuccessfulBuilds',
                        'ProjectName',
                        projectName,
                      ],
                      ['.', 'FailedBuilds', 'ProjectName', projectName],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: reg.name,
                    title: 'Build Success Rate (24 Hours)',
                    yAxis: {
                      left: {
                        min: 0,
                      },
                    },
                    view: 'timeSeries',
                    stacked: false,
                  },
                },
                {
                  type: 'metric',
                  x: 12,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/CodeBuild', 'Duration', 'ProjectName', projectName],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: reg.name,
                    title: 'Build Duration Trends',
                    yAxis: {
                      left: {
                        label: 'Milliseconds',
                        min: 0,
                      },
                    },
                    view: 'timeSeries',
                  },
                },
                {
                  type: 'metric',
                  x: 0,
                  y: 6,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      [
                        'AWS/CodeBuild',
                        'FailedBuilds',
                        'ProjectName',
                        projectName,
                      ],
                    ],
                    period: 3600,
                    stat: 'Sum',
                    region: reg.name,
                    title: 'Build Failure Count',
                    view: 'timeSeries',
                  },
                },
                {
                  type: 'metric',
                  x: 12,
                  y: 6,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/CodeBuild', 'Builds', 'ProjectName', projectName],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: reg.name,
                    title: 'Active Builds Count',
                    view: 'timeSeries',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // 11. EventBridge Rules for Build State Notifications
    const buildStateRule = new aws.cloudwatch.EventRule(
      `build-state-${environmentSuffix}`,
      {
        name: `codebuild-state-change-${environmentSuffix}`,
        description: 'Notify on CodeBuild state changes',
        eventPattern: buildProject.name.apply(projName =>
          JSON.stringify({
            source: ['aws.codebuild'],
            'detail-type': ['CodeBuild Build State Change'],
            detail: {
              'build-status': ['IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'STOPPED'],
              'project-name': [projName],
            },
          })
        ),
        tags: commonTags,
      },
      { parent: this }
    );

    void new aws.cloudwatch.EventTarget(
      `build-state-target-${environmentSuffix}`,
      {
        rule: buildStateRule.name,
        arn: snsTopic.arn,
      },
      { parent: this }
    );

    void new aws.sns.TopicPolicy(
      `sns-topic-policy-${environmentSuffix}`,
      {
        arn: snsTopic.arn,
        policy: snsTopic.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'events.amazonaws.com',
                },
                Action: 'SNS:Publish',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // KMS Key Policy
    void new aws.kms.KeyPolicy(
      `kms-key-policy-${environmentSuffix}`,
      {
        keyId: kmsKey.id,
        policy: pulumi
          .all([kmsKey.arn, codeBuildRole.arn, current, currentRegion])
          .apply(([_keyArn, roleArn, identity, reg]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'Enable IAM User Permissions',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${identity.accountId}:root`,
                  },
                  Action: 'kms:*',
                  Resource: '*',
                },
                {
                  Sid: 'Allow CodeBuild to use the key',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: [
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:GenerateDataKey',
                    'kms:DescribeKey',
                  ],
                  Resource: '*',
                },
                {
                  Sid: 'Allow CloudWatch Logs',
                  Effect: 'Allow',
                  Principal: {
                    Service: `logs.${reg.name}.amazonaws.com`,
                  },
                  Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
                  Resource: '*',
                  Condition: {
                    ArnLike: {
                      'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${reg.name}:${identity.accountId}:log-group:*`,
                    },
                  },
                },
                {
                  Sid: 'Allow SNS',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'sns.amazonaws.com',
                  },
                  Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Outputs
    this.repositoryCloneUrl = repository.cloneUrlHttp;
    this.buildProjectName = buildProject.name;
    this.buildProjectArn = buildProject.arn;
    this.artifactsBucketName = artifactsBucket.bucket;
    this.logGroupName = logGroup.name;
    this.serviceRoleArn = codeBuildRole.arn;
    this.snsTopicArn = snsTopic.arn;
    this.kmsKeyArn = kmsKey.arn;
    this.eventBridgeRuleArn = eventBridgeRule.arn;
    this.dashboardUrl = pulumi
      .all([dashboard.dashboardName, currentRegion])
      .apply(
        ([name, reg]) =>
          `https://console.aws.amazon.com/cloudwatch/home?region=${reg.name}#dashboards:name=${name}`
      );

    this.registerOutputs({
      repositoryCloneUrl: this.repositoryCloneUrl,
      buildProjectName: this.buildProjectName,
      buildProjectArn: this.buildProjectArn,
      artifactsBucketName: this.artifactsBucketName,
      logGroupName: this.logGroupName,
      serviceRoleArn: this.serviceRoleArn,
      snsTopicArn: this.snsTopicArn,
      kmsKeyArn: this.kmsKeyArn,
      eventBridgeRuleArn: this.eventBridgeRuleArn,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
