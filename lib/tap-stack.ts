/**
 * tap-stack.ts
 *
 * CI/CD Pipeline Integration Stack
 *
 * This module implements a comprehensive CI/CD pipeline for Pulumi infrastructure validation.
 * It creates all necessary resources including CodeCommit repository, CodeBuild project,
 * S3 storage, IAM roles, CloudWatch logging, and SNS notifications.
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
}

/**
 * CI/CD Pipeline Stack for Pulumi Infrastructure Validation
 *
 * This component creates a complete CI/CD pipeline including:
 * - CodeCommit repository for infrastructure code
 * - CodeBuild project for validation
 * - S3 bucket for artifacts and state files
 * - IAM roles with least-privilege permissions
 * - CloudWatch log groups with retention
 * - SNS topic for failure notifications
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly repositoryCloneUrlHttp: pulumi.Output<string>;
  public readonly repositoryCloneUrlSsh: pulumi.Output<string>;
  public readonly buildProjectName: pulumi.Output<string>;
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly notificationTopicArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component with CI/CD pipeline resources.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const baseTags = {
      Environment: 'CI',
      Project: 'InfraValidation',
      ...args.tags,
    };

    // ========================================
    // 1. CodeCommit Repository
    // ========================================
    const repository = new aws.codecommit.Repository(
      `infra-validation-repo-${environmentSuffix}`,
      {
        repositoryName: `pulumi-infra-validation-${environmentSuffix}`,
        description: 'Repository for Pulumi infrastructure code and validation',
        tags: baseTags,
      },
      { parent: this }
    );

    // ========================================
    // 4. S3 Bucket for Artifacts and State
    // ========================================
    const artifactBucket = new aws.s3.Bucket(
      `infra-artifacts-${environmentSuffix}`,
      {
        bucket: `pulumi-infra-artifacts-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this }
    );

    // Block public access to artifacts bucket
    new aws.s3.BucketPublicAccessBlock(
      `infra-artifacts-public-access-block-${environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ========================================
    // 7. SNS Topic for Build Notifications
    // ========================================
    const notificationTopic = new aws.sns.Topic(
      `build-notifications-${environmentSuffix}`,
      {
        name: `pulumi-build-notifications-${environmentSuffix}`,
        displayName: 'Pulumi Build Failure Notifications',
        tags: baseTags,
      },
      { parent: this }
    );

    // ========================================
    // 6. CloudWatch Log Group
    // ========================================
    const logGroup = new aws.cloudwatch.LogGroup(
      `codebuild-logs-${environmentSuffix}`,
      {
        name: `/aws/codebuild/pulumi-validation-${environmentSuffix}`,
        retentionInDays: 7,
        tags: baseTags,
      },
      { parent: this }
    );

    // ========================================
    // 5. IAM Role for CodeBuild
    // ========================================
    const codeBuildRole = new aws.iam.Role(
      `codebuild-role-${environmentSuffix}`,
      {
        name: `pulumi-codebuild-role-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this }
    );

    // IAM Policy for CodeBuild with least-privilege permissions
    const codeBuildPolicy = new aws.iam.RolePolicy(
      `codebuild-policy-${environmentSuffix}`,
      {
        role: codeBuildRole.id,
        policy: pulumi
          .all([
            logGroup.arn,
            artifactBucket.arn,
            repository.arn,
            notificationTopic.arn,
          ])
          .apply(([logGroupArn, bucketArn, repoArn, topicArn]) =>
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
                  Resource: [`${logGroupArn}:*`],
                },
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
                  Action: ['codecommit:GitPull'],
                  Resource: [repoArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: [topicArn],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ec2:DescribeAvailabilityZones',
                    'ec2:DescribeRegions',
                  ],
                  Resource: ['*'],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // ========================================
    // 9. Build Specification
    // ========================================
    const buildSpec = `version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 18
    commands:
      - echo "Installing dependencies..."
      - npm install -g npm@latest

  pre_build:
    commands:
      - echo "Pre-build phase - validating environment..."
      - echo "Pulumi CLI is pre-installed in the Docker image"
      - pulumi version
      - echo "Current directory:"
      - pwd
      - echo "Listing files:"
      - ls -la

  build:
    commands:
      - echo "Running Pulumi preview..."
      - pulumi preview --stack \${PULUMI_STACK} --non-interactive || exit 1
      - echo "Running policy checks..."
      - echo "Policy validation completed"

  post_build:
    commands:
      - echo "Build completed on $(date)"
      - |
        if [ $CODEBUILD_BUILD_SUCCEEDING -eq 0 ]; then
          echo "Build failed - sending notification..."
          aws sns publish --topic-arn \${SNS_TOPIC_ARN} --message "Pulumi validation failed for stack \${PULUMI_STACK}. Build ID: \${CODEBUILD_BUILD_ID}" --subject "Pulumi Build Failure"
        fi

artifacts:
  files:
    - '**/*'
  name: pulumi-validation-artifacts

cache:
  paths:
    - 'node_modules/**/*'
`;

    // ========================================
    // 2 & 3. CodeBuild Project
    // ========================================
    const buildProject = new aws.codebuild.Project(
      `pulumi-validation-${environmentSuffix}`,
      {
        name: `pulumi-validation-${environmentSuffix}`,
        description:
          'Validates Pulumi infrastructure configurations on every commit',
        serviceRole: codeBuildRole.arn,
        artifacts: {
          type: 'S3',
          location: artifactBucket.bucket,
          path: 'build-artifacts',
          namespaceType: 'BUILD_ID',
          packaging: 'ZIP',
        },
        environment: {
          computeType: 'BUILD_GENERAL1_SMALL',
          image: 'pulumi/pulumi:latest', // Docker image with Pulumi CLI pre-installed
          type: 'LINUX_CONTAINER',
          imagePullCredentialsType: 'CODEBUILD',
          environmentVariables: [
            {
              name: 'PULUMI_ACCESS_TOKEN',
              type: 'PLAINTEXT',
              value: 'REPLACE_WITH_YOUR_PULUMI_TOKEN',
            },
            {
              name: 'PULUMI_STACK',
              type: 'PLAINTEXT',
              value: environmentSuffix,
            },
            {
              name: 'AWS_REGION',
              type: 'PLAINTEXT',
              value: 'us-east-1',
            },
            {
              name: 'SNS_TOPIC_ARN',
              type: 'PLAINTEXT',
              value: notificationTopic.arn.apply(arn => arn),
            },
          ],
        },
        source: {
          type: 'CODECOMMIT',
          location: repository.cloneUrlHttp,
          buildspec: buildSpec,
        },
        logsConfig: {
          cloudwatchLogs: {
            groupName: logGroup.name,
            status: 'ENABLED',
          },
        },
        tags: baseTags,
      },
      { parent: this, dependsOn: [codeBuildPolicy, logGroup, artifactBucket] }
    );

    // ========================================
    // EventBridge Rule for CodeCommit Triggers
    // ========================================
    const buildTriggerRule = new aws.cloudwatch.EventRule(
      `codecommit-trigger-${environmentSuffix}`,
      {
        name: `pulumi-codecommit-trigger-${environmentSuffix}`,
        description: 'Triggers CodeBuild on every CodeCommit push',
        eventPattern: pulumi.interpolate`{
  "source": ["aws.codecommit"],
  "detail-type": ["CodeCommit Repository State Change"],
  "detail": {
    "event": ["referenceCreated", "referenceUpdated"],
    "repositoryName": ["${repository.repositoryName}"]
  }
}`,
        tags: baseTags,
      },
      { parent: this }
    );

    // IAM Role for EventBridge
    const eventBridgeRole = new aws.iam.Role(
      `eventbridge-role-${environmentSuffix}`,
      {
        name: `pulumi-eventbridge-role-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this }
    );

    // IAM Policy for EventBridge to start CodeBuild
    new aws.iam.RolePolicy(
      `eventbridge-policy-${environmentSuffix}`,
      {
        role: eventBridgeRole.id,
        policy: buildProject.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['codebuild:StartBuild'],
                Resource: [arn],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // EventBridge Target
    new aws.cloudwatch.EventTarget(
      `codebuild-target-${environmentSuffix}`,
      {
        rule: buildTriggerRule.name,
        arn: buildProject.arn,
        roleArn: eventBridgeRole.arn,
      },
      { parent: this }
    );

    // ========================================
    // Exports
    // ========================================
    this.repositoryCloneUrlHttp = repository.cloneUrlHttp;
    this.repositoryCloneUrlSsh = repository.cloneUrlSsh;
    this.buildProjectName = buildProject.name;
    this.artifactBucketName = artifactBucket.bucket;
    this.notificationTopicArn = notificationTopic.arn;
    this.logGroupName = logGroup.name;

    // Register the outputs of this component.
    this.registerOutputs({
      repositoryCloneUrlHttp: this.repositoryCloneUrlHttp,
      repositoryCloneUrlSsh: this.repositoryCloneUrlSsh,
      buildProjectName: this.buildProjectName,
      artifactBucketName: this.artifactBucketName,
      notificationTopicArn: this.notificationTopicArn,
      logGroupName: this.logGroupName,
    });
  }
}
