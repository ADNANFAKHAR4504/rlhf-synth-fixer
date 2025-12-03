# IDEAL RESPONSE - CI/CD Pipeline with Enhanced Monitoring and Security

Improved Pulumi TypeScript implementation with production-ready fixes and best practices applied.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CodeBuildPipelineStack } from './codebuild-pipeline-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  notificationEmail?: string;
}

export class TapStack extends pulumi.ComponentResource {
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

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    const pipelineStack = new CodeBuildPipelineStack('codebuild-pipeline', {
      environmentSuffix: environmentSuffix,
      tags: tags,
      notificationEmail: args.notificationEmail,
    }, { parent: this });

    this.repositoryCloneUrl = pipelineStack.repositoryCloneUrl;
    this.buildProjectName = pipelineStack.buildProjectName;
    this.buildProjectArn = pipelineStack.buildProjectArn;
    this.artifactsBucketName = pipelineStack.artifactsBucketName;
    this.logGroupName = pipelineStack.logGroupName;
    this.serviceRoleArn = pipelineStack.serviceRoleArn;
    this.snsTopicArn = pipelineStack.snsTopicArn;
    this.kmsKeyArn = pipelineStack.kmsKeyArn;
    this.eventBridgeRuleArn = pipelineStack.eventBridgeRuleArn;
    this.dashboardUrl = pipelineStack.dashboardUrl;

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
```

## File: lib/codebuild-pipeline-stack.ts

```typescript
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

  constructor(name: string, args: CodeBuildPipelineStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:codebuild:CodeBuildPipelineStack', name, args, opts);

    const { environmentSuffix, tags = {}, notificationEmail } = args;

    const region = process.env.AWS_REGION || 'us-east-1';

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
    const kmsKey = new aws.kms.Key(`codebuild-key-${environmentSuffix}`, {
      description: `KMS key for CodeBuild encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: commonTags,
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`alias-codebuild-${environmentSuffix}`, {
      name: `alias/codebuild-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // 2. CodeCommit Repository
    const repository = new aws.codecommit.Repository(`app-repo-${environmentSuffix}`, {
      repositoryName: `app-repo-${environmentSuffix}`,
      description: 'Application source code repository',
      tags: commonTags,
    }, { parent: this });

    // 3. S3 Bucket for Build Artifacts
    const artifactsBucket = new aws.s3.BucketV2(`build-artifacts-${environmentSuffix}`, {
      bucket: `build-artifacts-${environmentSuffix}`,
      tags: commonTags,
    }, { parent: this });

    const bucketVersioning = new aws.s3.BucketVersioningV2(`artifacts-versioning-${environmentSuffix}`, {
      bucket: artifactsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this });

    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`artifacts-encryption-${environmentSuffix}`, {
      bucket: artifactsBucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: kmsKey.arn,
        },
        bucketKeyEnabled: true,
      }],
    }, { parent: this });

    const bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(`artifacts-lifecycle-${environmentSuffix}`, {
      bucket: artifactsBucket.id,
      rules: [{
        id: 'delete-old-artifacts',
        status: 'Enabled',
        expiration: {
          days: 30,
        },
      }],
    }, { parent: this });

    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`artifacts-public-access-block-${environmentSuffix}`, {
      bucket: artifactsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // 4. SNS Topic for Notifications
    const snsTopic = new aws.sns.Topic(`build-notifications-${environmentSuffix}`, {
      name: `build-notifications-${environmentSuffix}`,
      displayName: 'CodeBuild Notifications',
      kmsMasterKeyId: kmsKey.id,
      tags: commonTags,
    }, { parent: this });

    if (notificationEmail) {
      new aws.sns.TopicSubscription(`email-subscription-${environmentSuffix}`, {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: notificationEmail,
      }, { parent: this });
    }

    // 5. CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(`/aws/codebuild/build-project-${environmentSuffix}`, {
      name: `/aws/codebuild/build-project-${environmentSuffix}`,
      retentionInDays: 7,
      kmsKeyId: kmsKey.arn,
      tags: commonTags,
    }, { parent: this });

    // 6. IAM Role for CodeBuild
    const codeBuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
      name: `codebuild-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'codebuild.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: commonTags,
    }, { parent: this });

    const codeBuildPolicy = new aws.iam.RolePolicy(`codebuild-policy-${environmentSuffix}`, {
      role: codeBuildRole.id,
      policy: pulumi.all([
        repository.arn,
        artifactsBucket.arn,
        logGroup.arn,
        snsTopic.arn,
        kmsKey.arn,
      ]).apply(([repoArn, bucketArn, logArn, topicArn, keyArn]) => JSON.stringify({
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
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `${logArn}:*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'sns:Publish',
            ],
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
      })),
    }, { parent: this });

    // 7. CodeBuild Project
    const buildProject = new aws.codebuild.Project(`build-project-${environmentSuffix}`, {
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
    }, { parent: this, dependsOn: [codeBuildPolicy, bucketPublicAccessBlock] });

    // 8. EventBridge Rule for automatic triggers
    const eventBridgeRole = new aws.iam.Role(`eventbridge-role-${environmentSuffix}`, {
      name: `eventbridge-codebuild-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'events.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: commonTags,
    }, { parent: this });

    const eventBridgePolicy = new aws.iam.RolePolicy(`eventbridge-policy-${environmentSuffix}`, {
      role: eventBridgeRole.id,
      policy: buildProject.arn.apply(arn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: 'codebuild:StartBuild',
          Resource: arn,
        }],
      })),
    }, { parent: this });

    const eventBridgeRule = new aws.cloudwatch.EventRule(`codecommit-trigger-${environmentSuffix}`, {
      name: `codecommit-build-trigger-${environmentSuffix}`,
      description: 'Trigger CodeBuild on CodeCommit main branch changes',
      eventPattern: repository.arn.apply(repoArn => JSON.stringify({
        source: ['aws.codecommit'],
        'detail-type': ['CodeCommit Repository State Change'],
        detail: {
          event: ['referenceCreated', 'referenceUpdated'],
          referenceType: ['branch'],
          referenceName: ['main'],
        },
        resources: [repoArn],
      })),
      tags: commonTags,
    }, { parent: this });

    const eventTarget = new aws.cloudwatch.EventTarget(`codebuild-target-${environmentSuffix}`, {
      rule: eventBridgeRule.name,
      arn: buildProject.arn,
      roleArn: eventBridgeRole.arn,
    }, { parent: this, dependsOn: [eventBridgePolicy] });

    // 9. CloudWatch Alarms
    const failureAlarm = new aws.cloudwatch.MetricAlarm(`build-failure-alarm-${environmentSuffix}`, {
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
    }, { parent: this });

    const durationAlarm = new aws.cloudwatch.MetricAlarm(`build-duration-alarm-${environmentSuffix}`, {
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
    }, { parent: this });

    const dailyFailureAlarm = new aws.cloudwatch.MetricAlarm(`daily-failure-alarm-${environmentSuffix}`, {
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
    }, { parent: this });

    // 10. CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(`codebuild-dashboard-${environmentSuffix}`, {
      dashboardName: `codebuild-dashboard-${environmentSuffix}`,
      dashboardBody: pulumi.all([buildProject.name, currentRegion]).apply(([projectName, reg]) => JSON.stringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['AWS/CodeBuild', 'SuccessfulBuilds', { ProjectName: projectName, stat: 'Sum', label: 'Successful' }],
                ['.', 'FailedBuilds', { ProjectName: projectName, stat: 'Sum', label: 'Failed' }],
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
                ['AWS/CodeBuild', 'Duration', { ProjectName: projectName, stat: 'Average' }],
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
                ['AWS/CodeBuild', 'FailedBuilds', { ProjectName: projectName, stat: 'Sum' }],
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
                ['AWS/CodeBuild', 'Builds', { ProjectName: projectName, stat: 'Sum' }],
              ],
              period: 300,
              stat: 'Sum',
              region: reg.name,
              title: 'Active Builds Count',
              view: 'timeSeries',
            },
          },
        ],
      })),
    }, { parent: this });

    // 11. EventBridge Rules for Build State Notifications
    const buildStateRule = new aws.cloudwatch.EventRule(`build-state-${environmentSuffix}`, {
      name: `codebuild-state-change-${environmentSuffix}`,
      description: 'Notify on CodeBuild state changes',
      eventPattern: buildProject.name.apply(projName => JSON.stringify({
        source: ['aws.codebuild'],
        'detail-type': ['CodeBuild Build State Change'],
        detail: {
          'build-status': ['IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'STOPPED'],
          'project-name': [projName],
        },
      })),
      tags: commonTags,
    }, { parent: this });

    const buildStateTarget = new aws.cloudwatch.EventTarget(`build-state-target-${environmentSuffix}`, {
      rule: buildStateRule.name,
      arn: snsTopic.arn,
    }, { parent: this });

    const snsTopicPolicy = new aws.sns.TopicPolicy(`sns-topic-policy-${environmentSuffix}`, {
      arn: snsTopic.arn,
      policy: snsTopic.arn.apply(arn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'events.amazonaws.com',
          },
          Action: 'SNS:Publish',
          Resource: arn,
        }],
      })),
    }, { parent: this });

    // KMS Key Policy
    const kmsKeyPolicy = new aws.kms.KeyPolicy(`kms-key-policy-${environmentSuffix}`, {
      keyId: kmsKey.id,
      policy: pulumi.all([
        kmsKey.arn,
        codeBuildRole.arn,
        current,
        currentRegion,
      ]).apply(([keyArn, roleArn, identity, reg]) => JSON.stringify({
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
            Action: [
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:GenerateDataKey',
            ],
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
            Action: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this });

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
    this.dashboardUrl = pulumi.all([dashboard.dashboardName, currentRegion]).apply(
      ([name, reg]) => `https://console.aws.amazon.com/cloudwatch/home?region=${reg.name}#dashboards:name=${name}`
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
```

## File: bin/tap.ts

```typescript
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();
const notificationEmail = process.env.NOTIFICATION_EMAIL;

const defaultTags = {
  Environment: 'production',
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
    notificationEmail: notificationEmail,
  },
  { provider }
);

export const repositoryCloneUrl = stack.repositoryCloneUrl;
export const buildProjectName = stack.buildProjectName;
export const buildProjectArn = stack.buildProjectArn;
export const artifactsBucketName = stack.artifactsBucketName;
export const logGroupName = stack.logGroupName;
export const serviceRoleArn = stack.serviceRoleArn;
export const snsTopicArn = stack.snsTopicArn;
export const kmsKeyArn = stack.kmsKeyArn;
export const eventBridgeRuleArn = stack.eventBridgeRuleArn;
export const dashboardUrl = stack.dashboardUrl;
```

## File: lib/README.md

```markdown
# CodeBuild CI/CD Pipeline with Enhanced Monitoring

Production-ready Pulumi TypeScript infrastructure for AWS CodeBuild and CodeCommit CI/CD pipeline with comprehensive monitoring, alerting, and security features.

## Features

### Core Infrastructure
- **CodeCommit Repository**: Source code version control
- **CodeBuild Project**: Automated build system with Node.js 18
- **S3 Bucket**: Versioned artifact storage with lifecycle policies
- **IAM Roles**: Least-privilege access policies

### Security Features
- **KMS Encryption**: All data encrypted at rest (S3, CloudWatch Logs, SNS)
- **Automatic Key Rotation**: KMS keys rotate annually
- **Public Access Blocking**: S3 buckets secured from public access
- **Least Privilege IAM**: Minimal required permissions

### Monitoring & Alerting
- **CloudWatch Alarms**:
  - Build failure detection (2 consecutive failures)
  - Duration threshold monitoring (>10 minutes)
  - Daily failure count tracking (>5 failures/day)
- **SNS Notifications**: Email alerts for build events
- **CloudWatch Dashboard**: Real-time build metrics visualization

### Automation
- **EventBridge Integration**: Automatic build triggers on code commits
- **Build Caching**: Improved build performance with S3 caching
- **Lifecycle Policies**: 30-day artifact retention

## Architecture

```
CodeCommit (main branch)
    ↓
EventBridge Rule (detects changes)
    ↓
CodeBuild Project (builds code)
    ↓
S3 Bucket (stores artifacts)
    ↓
CloudWatch Logs (captures logs)
    ↓
CloudWatch Alarms → SNS Topic → Email Notifications
```

## Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS credentials configured
- Environment variables:
  - `ENVIRONMENT_SUFFIX`: Deployment environment (e.g., 'prod', 'staging')
  - `NOTIFICATION_EMAIL`: Email for build notifications (optional)

## Deployment

```bash
# Install dependencies
npm install

# Configure stack
pulumi stack init dev

# Set environment suffix
export ENVIRONMENT_SUFFIX="prod"

# Set notification email (optional)
export NOTIFICATION_EMAIL="team@example.com"

# Deploy infrastructure
pulumi up
```

## Outputs

The stack exports the following outputs:

- `repositoryCloneUrl`: HTTPS URL to clone the CodeCommit repository
- `buildProjectName`: Name of the CodeBuild project
- `buildProjectArn`: ARN of the CodeBuild project
- `artifactsBucketName`: Name of the S3 artifacts bucket
- `logGroupName`: CloudWatch Log Group name
- `serviceRoleArn`: IAM role ARN for CodeBuild
- `snsTopicArn`: SNS topic ARN for notifications
- `kmsKeyArn`: KMS key ARN for encryption
- `eventBridgeRuleArn`: EventBridge rule ARN
- `dashboardUrl`: CloudWatch Dashboard URL

## Configuration

### Build Specifications

The CodeBuild project uses an inline buildspec with:
- Node.js 18 runtime
- npm-based build process
- Build caching enabled
- 15-minute timeout
- SMALL compute type

### Monitoring Thresholds

Adjust alarm thresholds in `lib/codebuild-pipeline-stack.ts`:
- `failureAlarm`: Consecutive failure count
- `durationAlarm`: Build duration limit (milliseconds)
- `dailyFailureAlarm`: Daily failure threshold

### Retention Policies

- CloudWatch Logs: 7 days
- S3 Artifacts: 30 days (lifecycle policy)
- KMS Key Deletion: 7-day window

## Resource Naming

All resources include the `environmentSuffix` for multi-environment support:
- Repository: `app-repo-${environmentSuffix}`
- Build Project: `build-project-${environmentSuffix}`
- Artifacts Bucket: `build-artifacts-${environmentSuffix}`
- SNS Topic: `build-notifications-${environmentSuffix}`
- KMS Key: `alias/codebuild-${environmentSuffix}`

## Tagging Strategy

All resources are tagged with:
- `Environment`: production
- `Team`: devops
- `Project`: ci-cd-pipeline
- `ManagedBy`: pulumi

## Security Considerations

1. **Encryption**: All data encrypted with KMS (S3, Logs, SNS)
2. **IAM Policies**: Follow least privilege principle
3. **Public Access**: S3 buckets block all public access
4. **Key Rotation**: KMS keys rotate automatically
5. **Secure Transport**: HTTPS for all communications

## Cost Optimization

- **Build Caching**: Reduces build time and costs
- **Lifecycle Policies**: Automatically deletes old artifacts after 30 days
- **SMALL Compute**: Uses minimal compute resources
- **Log Retention**: 7-day retention prevents log accumulation

## Monitoring

### CloudWatch Dashboard

Access the dashboard via the `dashboardUrl` output. It displays:
- Build success/failure rates
- Duration trends
- Failure counts
- Active builds

### Alarms

Three CloudWatch alarms monitor build health:
1. **Failure Alarm**: Triggers after 2 consecutive failures
2. **Duration Alarm**: Triggers when builds exceed 10 minutes
3. **Daily Failure Alarm**: Triggers when >5 builds fail in 24 hours

### Notifications

SNS sends email notifications for:
- Build started (IN_PROGRESS)
- Build succeeded (SUCCEEDED)
- Build failed (FAILED)
- Build stopped (STOPPED)

## Testing

The infrastructure supports:
- Automated deployments via EventBridge
- Manual build triggers via AWS Console or CLI
- Build status tracking in CloudWatch
- Artifact versioning in S3

## Cleanup

```bash
# Destroy all resources
pulumi destroy

# Remove stack
pulumi stack rm dev
```

## Troubleshooting

### Build Failures
- Check CloudWatch Logs: `/aws/codebuild/build-project-${environmentSuffix}`
- Review SNS email notifications
- Verify CodeCommit repository has code

### Permission Errors
- Ensure IAM role has correct policies
- Check KMS key policy allows CodeBuild, CloudWatch, SNS
- Verify EventBridge role can start builds

### No Notifications
- Confirm SNS subscription email address
- Check spam folder for subscription confirmation
- Verify EventBridge rule is enabled

## AWS Services Used

1. AWS CodeCommit
2. AWS CodeBuild
3. Amazon S3
4. AWS IAM
5. Amazon CloudWatch Logs
6. Amazon SNS
7. AWS KMS
8. Amazon EventBridge
9. Amazon CloudWatch (Alarms & Dashboard)
```
