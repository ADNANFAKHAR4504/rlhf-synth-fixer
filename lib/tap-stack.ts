import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const notificationEmail =
  config.get('notificationEmail') || 'devops@example.com';

// Tags to apply to all resources
const tags = {
  Environment: 'Production',
  Team: 'DevOps',
};

// S3 Bucket for Build Artifacts
const artifactsBucket = new aws.s3.BucketV2(
  `artifacts-bucket-${environmentSuffix}`,
  {
    bucket: `codebuild-artifacts-${environmentSuffix}`,
    tags: tags,
  }
);

// Enable versioning on the bucket
new aws.s3.BucketVersioningV2(
  `artifacts-bucket-versioning-${environmentSuffix}`,
  {
    bucket: artifactsBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  }
);

// Lifecycle rule to delete artifacts older than 30 days
new aws.s3.BucketLifecycleConfigurationV2(
  `artifacts-bucket-lifecycle-${environmentSuffix}`,
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
  }
);

// CloudWatch Log Group for CodeBuild
const logGroup = new aws.cloudwatch.LogGroup(
  `codebuild-logs-${environmentSuffix}`,
  {
    name: `/aws/codebuild/project-${environmentSuffix}`,
    retentionInDays: 7,
    tags: tags,
  }
);

// IAM Role for CodeBuild
const codebuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
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
});

// IAM Policy for CodeBuild
const codebuildPolicy = new aws.iam.RolePolicy(
  `codebuild-policy-${environmentSuffix}`,
  {
    name: `codebuild-policy-${environmentSuffix}`,
    role: codebuildRole.id,
    policy: pulumi
      .all([artifactsBucket.arn, logGroup.name])
      .apply(([bucketArn, logGroupName]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
              Resource: [`${bucketArn}/*`],
            },
            {
              Effect: 'Allow',
              Action: ['s3:ListBucket'],
              Resource: [bucketArn],
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: [
                `arn:aws:logs:us-east-1:*:log-group:${logGroupName}`,
                `arn:aws:logs:us-east-1:*:log-group:${logGroupName}:*`,
              ],
            },
          ],
        })
      ),
  }
);

// CodeBuild Project
const codebuildProject = new aws.codebuild.Project(
  `codebuild-project-${environmentSuffix}`,
  {
    name: `codebuild-project-${environmentSuffix}`,
    description: 'CI/CD build project for Node.js 18 applications',
    serviceRole: codebuildRole.arn,
    artifacts: {
      type: 'S3',
      location: artifactsBucket.bucket,
      packaging: 'ZIP',
      name: 'build-output',
    },
    environment: {
      computeType: 'BUILD_GENERAL1_MEDIUM', // 3GB memory, 2 vCPUs
      image: 'aws/codebuild/standard:7.0', // Supports Node.js 18
      type: 'LINUX_CONTAINER',
      imagePullCredentialsType: 'CODEBUILD',
    },
    source: {
      type: 'NO_SOURCE',
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
      - echo "Running build..."
      - npm run build
  post_build:
    commands:
      - echo "Build completed"
artifacts:
  files:
    - '**/*'
`,
    },
    logsConfig: {
      cloudwatchLogs: {
        groupName: logGroup.name,
        status: 'ENABLED',
      },
    },
    buildTimeout: 20, // 20 minutes
    queuedTimeout: 5, // 5 minutes
    badgeEnabled: false, // Badges not supported with NO_SOURCE
    tags: tags,
  },
  { dependsOn: [codebuildPolicy] }
);

// SNS Topic for Build Notifications
const buildNotificationTopic = new aws.sns.Topic(
  `build-notifications-${environmentSuffix}`,
  {
    name: `codebuild-notifications-${environmentSuffix}`,
    displayName: 'CodeBuild Build Notifications',
    tags: tags,
  }
);

// SNS Email Subscription
new aws.sns.TopicSubscription(`build-email-subscription-${environmentSuffix}`, {
  topic: buildNotificationTopic.arn,
  protocol: 'email',
  endpoint: notificationEmail,
});

// IAM Role for CloudWatch Events
const eventsRole = new aws.iam.Role(`events-role-${environmentSuffix}`, {
  name: `codebuild-events-role-${environmentSuffix}`,
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
});

// IAM Policy for CloudWatch Events to publish to SNS
const eventsPolicy = new aws.iam.RolePolicy(
  `events-policy-${environmentSuffix}`,
  {
    name: `events-sns-policy-${environmentSuffix}`,
    role: eventsRole.id,
    policy: buildNotificationTopic.arn.apply(topicArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'sns:Publish',
            Resource: topicArn,
          },
        ],
      })
    ),
  }
);

// CloudWatch Events Rule for Build State Changes - SUCCEEDED
const buildSucceededRule = new aws.cloudwatch.EventRule(
  `build-succeeded-rule-${environmentSuffix}`,
  {
    name: `codebuild-succeeded-${environmentSuffix}`,
    description: 'Trigger notifications when CodeBuild succeeds',
    eventPattern: pulumi.interpolate`{
  "source": ["aws.codebuild"],
  "detail-type": ["CodeBuild Build State Change"],
  "detail": {
    "build-status": ["SUCCEEDED"],
    "project-name": ["${codebuildProject.name}"]
  }
}`,
    tags: tags,
  }
);

new aws.cloudwatch.EventTarget(
  `build-succeeded-target-${environmentSuffix}`,
  {
    rule: buildSucceededRule.name,
    arn: buildNotificationTopic.arn,
    roleArn: eventsRole.arn,
    inputTransformer: {
      inputPaths: {
        buildId: '$.detail.build-id',
        projectName: '$.detail.project-name',
        buildStatus: '$.detail.build-status',
      },
      inputTemplate:
        '"Build <buildId> for project <projectName> has <buildStatus>."',
    },
  },
  { dependsOn: [eventsPolicy] }
);

// CloudWatch Events Rule for Build State Changes - FAILED
const buildFailedRule = new aws.cloudwatch.EventRule(
  `build-failed-rule-${environmentSuffix}`,
  {
    name: `codebuild-failed-${environmentSuffix}`,
    description: 'Trigger notifications when CodeBuild fails',
    eventPattern: pulumi.interpolate`{
  "source": ["aws.codebuild"],
  "detail-type": ["CodeBuild Build State Change"],
  "detail": {
    "build-status": ["FAILED"],
    "project-name": ["${codebuildProject.name}"]
  }
}`,
    tags: tags,
  }
);

new aws.cloudwatch.EventTarget(
  `build-failed-target-${environmentSuffix}`,
  {
    rule: buildFailedRule.name,
    arn: buildNotificationTopic.arn,
    roleArn: eventsRole.arn,
    inputTransformer: {
      inputPaths: {
        buildId: '$.detail.build-id',
        projectName: '$.detail.project-name',
        buildStatus: '$.detail.build-status',
      },
      inputTemplate:
        '"Build <buildId> for project <projectName> has <buildStatus>."',
    },
  },
  { dependsOn: [eventsPolicy] }
);

// CloudWatch Events Rule for Build State Changes - STOPPED
const buildStoppedRule = new aws.cloudwatch.EventRule(
  `build-stopped-rule-${environmentSuffix}`,
  {
    name: `codebuild-stopped-${environmentSuffix}`,
    description: 'Trigger notifications when CodeBuild is stopped',
    eventPattern: pulumi.interpolate`{
  "source": ["aws.codebuild"],
  "detail-type": ["CodeBuild Build State Change"],
  "detail": {
    "build-status": ["STOPPED"],
    "project-name": ["${codebuildProject.name}"]
  }
}`,
    tags: tags,
  }
);

new aws.cloudwatch.EventTarget(
  `build-stopped-target-${environmentSuffix}`,
  {
    rule: buildStoppedRule.name,
    arn: buildNotificationTopic.arn,
    roleArn: eventsRole.arn,
    inputTransformer: {
      inputPaths: {
        buildId: '$.detail.build-id',
        projectName: '$.detail.project-name',
        buildStatus: '$.detail.build-status',
      },
      inputTemplate:
        '"Build <buildId> for project <projectName> has <buildStatus>."',
    },
  },
  { dependsOn: [eventsPolicy] }
);

// Exports
export const artifactsBucketName = artifactsBucket.bucket;
export const artifactsBucketArn = artifactsBucket.arn;
export const codebuildProjectName = codebuildProject.name;
export const codebuildProjectArn = codebuildProject.arn;
export const buildBadgeUrl = codebuildProject.badgeUrl;
export const logGroupName = logGroup.name;
export const snsTopicArn = buildNotificationTopic.arn;
export const codebuildRoleArn = codebuildRole.arn;
