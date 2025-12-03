import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface CodeBuildStackArgs {
  environmentSuffix: string;
  notificationEmail: string;
}

export class CodeBuildStack extends pulumi.ComponentResource {
  public readonly projectName: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly topicArn: pulumi.Output<string>;

  constructor(name: string, args: CodeBuildStackArgs, opts?: ResourceOptions) {
    super('tap:codebuild:CodeBuildStack', name, args, opts);

    const { environmentSuffix, notificationEmail } = args;

    // S3 Bucket for Build Artifacts
    const artifactBucket = new aws.s3.Bucket(
      `codebuild-artifacts-${environmentSuffix}`,
      {
        bucket: `codebuild-artifacts-${environmentSuffix}`,
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
      },
      { parent: this }
    );

    // CloudWatch Log Group for CodeBuild
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/nodejs-project-${environmentSuffix}`,
        retentionInDays: 7,
      },
      { parent: this }
    );

    // IAM Role for CodeBuild
    const codebuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'codebuild.amazonaws.com',
        }),
      },
      { parent: this }
    );

    // IAM Policy for S3 Access
    const s3Policy = new aws.iam.RolePolicy(
      `codebuild-s3-policy-${environmentSuffix}`,
      {
        role: codebuildRole.id,
        policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:GetBucketAcl',
                  's3:GetBucketLocation',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // IAM Policy for CloudWatch Logs
    const logsPolicy = new aws.iam.RolePolicy(
      `codebuild-logs-policy-${environmentSuffix}`,
      {
        role: codebuildRole.id,
        policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) =>
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
            ],
          })
        ),
      },
      { parent: this }
    );

    // CodeBuild Project
    const codebuildProject = new aws.codebuild.Project(
      `nodejs-project-${environmentSuffix}`,
      {
        name: `nodejs-project-${environmentSuffix}`,
        description: 'CodeBuild project for Node.js application',
        buildTimeout: 15,
        serviceRole: codebuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactBucket.bucket,
          packaging: 'ZIP',
          name: 'build-output.zip',
        },
        cache: {
          type: 'S3',
          location: artifactBucket.bucket.apply(b => `${b}/cache`),
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'aws/codebuild/amazonlinux2-x86_64-standard:4.0',
          type: 'LINUX_CONTAINER',
          environmentVariables: [
            {
              name: 'NODE_VERSION',
              value: '18',
            },
          ],
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        source: {
          type: 'GITHUB',
          location: 'https://github.com/example/nodejs-app.git',
          buildspec: `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo Installing dependencies...
      - npm install
  build:
    commands:
      - echo Build started on \`date\`
      - npm run build
  post_build:
    commands:
      - echo Build completed on \`date\`

artifacts:
  files:
    - '**/*'
  base-directory: dist

cache:
  paths:
    - 'node_modules/**/*'
`,
        },
      },
      { parent: this, dependsOn: [s3Policy, logsPolicy] }
    );

    // SNS Topic for Build Notifications
    const notificationTopic = new aws.sns.Topic(
      `codebuild-notifications-${environmentSuffix}`,
      {
        name: `codebuild-notifications-${environmentSuffix}`,
        displayName: 'CodeBuild Build Notifications',
      },
      { parent: this }
    );

    // SNS Topic Subscription (Email)
    const emailSubscription = new aws.sns.TopicSubscription(
      `codebuild-email-sub-${environmentSuffix}`,
      {
        topic: notificationTopic.arn,
        protocol: 'email',
        endpoint: notificationEmail,
      },
      { parent: this }
    );
    void emailSubscription; // Used for subscription creation

    // SNS Topic Policy to allow CloudWatch Events
    const topicPolicy = new aws.sns.TopicPolicy(
      `codebuild-topic-policy-${environmentSuffix}`,
      {
        arn: notificationTopic.arn,
        policy: pulumi.all([notificationTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'events.amazonaws.com',
                },
                Action: 'sns:Publish',
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // IAM Role for CloudWatch Events
    const eventsRole = new aws.iam.Role(
      `codebuild-events-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'events.amazonaws.com',
        }),
      },
      { parent: this }
    );

    const eventsPolicy = new aws.iam.RolePolicy(
      `codebuild-events-policy-${environmentSuffix}`,
      {
        role: eventsRole.id,
        policy: pulumi.all([notificationTopic.arn]).apply(([topicArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['sns:Publish'],
                Resource: topicArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // CloudWatch Events Rule for Build State Changes
    const buildStateRule = new aws.cloudwatch.EventRule(
      `codebuild-state-${environmentSuffix}`,
      {
        name: `codebuild-state-${environmentSuffix}`,
        description: 'Capture CodeBuild build state changes',
        eventPattern: pulumi
          .all([codebuildProject.name])
          .apply(([projectName]) =>
            JSON.stringify({
              source: ['aws.codebuild'],
              'detail-type': ['CodeBuild Build State Change'],
              detail: {
                'build-status': ['SUCCEEDED', 'FAILED', 'STOPPED'],
                'project-name': [projectName],
              },
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Events Target
    const buildStateTarget = new aws.cloudwatch.EventTarget(
      `codebuild-target-${environmentSuffix}`,
      {
        rule: buildStateRule.name,
        arn: notificationTopic.arn,
        roleArn: eventsRole.arn,
        inputTransformer: {
          inputPaths: {
            buildId: '$.detail.build-id',
            projectName: '$.detail.project-name',
            buildStatus: '$.detail.build-status',
          },
          inputTemplate:
            '"Build <buildId> for project <projectName> has status: <buildStatus>"',
        },
      },
      { parent: this, dependsOn: [topicPolicy, eventsPolicy] }
    );
    void buildStateTarget; // Used for event target creation

    // Export outputs
    this.projectName = codebuildProject.name;
    this.bucketName = artifactBucket.bucket;
    this.topicArn = notificationTopic.arn;

    this.registerOutputs({
      projectName: this.projectName,
      bucketName: this.bucketName,
      topicArn: this.topicArn,
    });
  }
}
