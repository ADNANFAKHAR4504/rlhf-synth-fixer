# MODEL RESPONSE - CodeBuild Infrastructure

This implementation creates a complete CI/CD build infrastructure using Pulumi TypeScript with AWS CodeBuild, including artifact management, caching, and notifications.

## File: lib/codebuild-stack.ts

```typescript
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
    const artifactBucket = new aws.s3.Bucket(`codebuild-artifacts-${environmentSuffix}`, {
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
    }, { parent: this });

    // CloudWatch Log Group for CodeBuild
    const logGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${environmentSuffix}`, {
      name: `/aws/codebuild/nodejs-project-${environmentSuffix}`,
      retentionInDays: 7,
    }, { parent: this });

    // IAM Role for CodeBuild
    const codebuildRole = new aws.iam.Role(`codebuild-role-${environmentSuffix}`, {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'codebuild.amazonaws.com',
      }),
    }, { parent: this });

    // IAM Policy for S3 Access
    const s3Policy = new aws.iam.RolePolicy(`codebuild-s3-policy-${environmentSuffix}`, {
      role: codebuildRole.id,
      policy: pulumi.all([artifactBucket.arn]).apply(([bucketArn]) => JSON.stringify({
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
            Resource: [
              bucketArn,
              `${bucketArn}/*`,
            ],
          },
        ],
      })),
    }, { parent: this });

    // IAM Policy for CloudWatch Logs
    const logsPolicy = new aws.iam.RolePolicy(`codebuild-logs-policy-${environmentSuffix}`, {
      role: codebuildRole.id,
      policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: [
              logGroupArn,
              `${logGroupArn}:*`,
            ],
          },
        ],
      })),
    }, { parent: this });

    // CodeBuild Project
    const codebuildProject = new aws.codebuild.Project(`nodejs-project-${environmentSuffix}`, {
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
    }, { parent: this, dependsOn: [s3Policy, logsPolicy] });

    // SNS Topic for Build Notifications
    const notificationTopic = new aws.sns.Topic(`codebuild-notifications-${environmentSuffix}`, {
      name: `codebuild-notifications-${environmentSuffix}`,
      displayName: 'CodeBuild Build Notifications',
    }, { parent: this });

    // SNS Topic Subscription (Email)
    const emailSubscription = new aws.sns.TopicSubscription(`codebuild-email-sub-${environmentSuffix}`, {
      topic: notificationTopic.arn,
      protocol: 'email',
      endpoint: notificationEmail,
    }, { parent: this });

    // SNS Topic Policy to allow CloudWatch Events
    const topicPolicy = new aws.sns.TopicPolicy(`codebuild-topic-policy-${environmentSuffix}`, {
      arn: notificationTopic.arn,
      policy: pulumi.all([notificationTopic.arn]).apply(([topicArn]) => JSON.stringify({
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
      })),
    }, { parent: this });

    // IAM Role for CloudWatch Events
    const eventsRole = new aws.iam.Role(`codebuild-events-role-${environmentSuffix}`, {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'events.amazonaws.com',
      }),
    }, { parent: this });

    const eventsPolicy = new aws.iam.RolePolicy(`codebuild-events-policy-${environmentSuffix}`, {
      role: eventsRole.id,
      policy: pulumi.all([notificationTopic.arn]).apply(([topicArn]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: topicArn,
          },
        ],
      })),
    }, { parent: this });

    // CloudWatch Events Rule for Build State Changes
    const buildStateRule = new aws.cloudwatch.EventRule(`codebuild-state-${environmentSuffix}`, {
      name: `codebuild-state-${environmentSuffix}`,
      description: 'Capture CodeBuild build state changes',
      eventPattern: pulumi.all([codebuildProject.name]).apply(([projectName]) => JSON.stringify({
        source: ['aws.codebuild'],
        'detail-type': ['CodeBuild Build State Change'],
        detail: {
          'build-status': ['SUCCEEDED', 'FAILED', 'STOPPED'],
          'project-name': [projectName],
        },
      })),
    }, { parent: this });

    // CloudWatch Events Target
    const buildStateTarget = new aws.cloudwatch.EventTarget(`codebuild-target-${environmentSuffix}`, {
      rule: buildStateRule.name,
      arn: notificationTopic.arn,
      roleArn: eventsRole.arn,
      inputTransformer: {
        inputPaths: {
          buildId: '$.detail.build-id',
          projectName: '$.detail.project-name',
          buildStatus: '$.detail.build-status',
        },
        inputTemplate: '"Build <buildId> for project <projectName> has status: <buildStatus>"',
      },
    }, { parent: this, dependsOn: [topicPolicy, eventsPolicy] });

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
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { CodeBuildStack } from './codebuild-stack';

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
   * Email address for build notifications
   */
  notificationEmail?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly codeBuildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const notificationEmail = args.notificationEmail || 'devops@example.com';

    // Instantiate CodeBuild Stack
    const codebuildStack = new CodeBuildStack('codebuild', {
      environmentSuffix: environmentSuffix,
      notificationEmail: notificationEmail,
    }, { parent: this });

    // Expose outputs from nested components
    this.codeBuildProjectName = codebuildStack.projectName;
    this.artifactBucketName = codebuildStack.bucketName;
    this.snsTopicArn = codebuildStack.topicArn;

    // Register the outputs of this component
    this.registerOutputs({
      codeBuildProjectName: this.codeBuildProjectName,
      artifactBucketName: this.artifactBucketName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const notificationEmail = config.get('notificationEmail') || 'devops@example.com';

// Create the main stack
const tapStack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  notificationEmail: notificationEmail,
});

// Export stack outputs
export const codeBuildProjectName = tapStack.codeBuildProjectName;
export const artifactBucketName = tapStack.artifactBucketName;
export const snsTopicArn = tapStack.snsTopicArn;
```

## File: lib/README.md

```markdown
# CodeBuild Infrastructure with Pulumi TypeScript

This infrastructure creates a complete CI/CD build system using AWS CodeBuild with artifact management, build caching, and notifications.

## Architecture

### Components

1. **S3 Artifact Bucket**
   - Stores build artifacts with versioning
   - 30-day lifecycle policy for automatic cleanup
   - Server-side encryption enabled

2. **CodeBuild Project**
   - Node.js 18 runtime on AWS Linux 2
   - 15-minute build timeout
   - BUILD_GENERAL1_SMALL compute type
   - GitHub source integration

3. **Build Caching**
   - S3-based caching for node_modules
   - Speeds up subsequent builds

4. **IAM Roles and Policies**
   - CodeBuild service role with S3 access
   - CloudWatch Logs write permissions
   - Events service role for SNS publishing

5. **CloudWatch Logs**
   - Dedicated log group for build logs
   - 7-day retention policy

6. **SNS Notifications**
   - Topic for build state notifications
   - Email subscription for alerts
   - CloudWatch Events integration

7. **CloudWatch Events**
   - Rule to capture build state changes
   - Triggers SNS on SUCCESS, FAILED, STOPPED

## Deployment

### Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js 18+ installed

### Deploy

```bash
# Install dependencies
npm install

# Set configuration
pulumi config set environmentSuffix <your-suffix>
pulumi config set notificationEmail <your-email>

# Deploy
pulumi up
```

### Outputs

After deployment, you'll receive:
- `codeBuildProjectName`: Name of the CodeBuild project
- `artifactBucketName`: S3 bucket for artifacts
- `snsTopicArn`: ARN of the notification topic

## Testing

Run unit tests:
```bash
npm test
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are configured with `forceDestroy` and no retention policies for easy cleanup.
```
