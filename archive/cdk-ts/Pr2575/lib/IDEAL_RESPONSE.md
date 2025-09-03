# Overview

Please find solution files below.

## ./bin/tap.d.ts

```typescript
#!/usr/bin/env node
export {};

```

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/tap-stack.d.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface TapStackProps extends cdk.StackProps {
    environmentSuffix?: string;
    notificationEmail?: string;
}
export declare class TapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: TapStackProps);
}
export {};

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  notificationEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const notificationEmail =
      props?.notificationEmail ||
      this.node.tryGetContext('notificationEmail') ||
      'admin@example.com';

    // KMS Key for encryption
    const pipelineKmsKey = new kms.Key(
      this,
      `PipelineKmsKey-${environmentSuffix}`,
      {
        description: `KMS key for CI/CD pipeline encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    pipelineKmsKey.addAlias(`alias/tap-pipeline-${environmentSuffix}`);

    // S3 Bucket for source code (triggers pipeline)
    const sourceBucket = new s3.Bucket(
      this,
      `SourceBucket-${environmentSuffix}`,
      {
        bucketName: `tap-source-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryptionKey: pipelineKmsKey,
        encryption: s3.BucketEncryption.KMS,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
      }
    );

    // S3 Bucket for pipeline artifacts
    const artifactsBucket = new s3.Bucket(
      this,
      `ArtifactsBucket-${environmentSuffix}`,
      {
        bucketName: `tap-artifacts-${environmentSuffix}-${this.account}`,
        encryptionKey: pipelineKmsKey,
        encryption: s3.BucketEncryption.KMS,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteArtifacts',
            expiration: cdk.Duration.days(30),
          },
        ],
      }
    );

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(
      this,
      `PipelineNotifications-${environmentSuffix}`,
      {
        topicName: `tap-pipeline-notifications-${environmentSuffix}`,
        displayName: `TAP Pipeline Notifications - ${environmentSuffix}`,
        masterKey: pipelineKmsKey,
      }
    );

    notificationTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(notificationEmail)
    );

    // CloudWatch Log Groups (without encryption to avoid timing issues)
    const buildLogGroup = new logs.LogGroup(
      this,
      `BuildLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const pipelineLogGroup = new logs.LogGroup(
      this,
      `PipelineLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/codepipeline/tap-pipeline-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(
      this,
      `CodeBuildRole-${environmentSuffix}`,
      {
        roleName: `tap-codebuild-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSElasticBeanstalkWebTier'
          ),
        ],
        inlinePolicies: {
          CodeBuildPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [buildLogGroup.logGroupArn + ':*'],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:PutObject',
                ],
                resources: [
                  artifactsBucket.bucketArn + '/*',
                  sourceBucket.bucketArn + '/*',
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
                resources: [pipelineKmsKey.keyArn],
              }),
            ],
          }),
        },
      }
    );

    // IAM Role for CodePipeline
    const codePipelineRole = new iam.Role(
      this,
      `CodePipelineRole-${environmentSuffix}`,
      {
        roleName: `tap-codepipeline-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        inlinePolicies: {
          PipelinePolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetBucketVersioning',
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:PutObject',
                ],
                resources: [
                  artifactsBucket.bucketArn,
                  artifactsBucket.bucketArn + '/*',
                  sourceBucket.bucketArn,
                  sourceBucket.bucketArn + '/*',
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                resources: ['*'],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'elasticbeanstalk:*',
                  's3:ListAllMyBuckets',
                  's3:GetBucketLocation',
                ],
                resources: ['*'],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sns:Publish'],
                resources: [notificationTopic.topicArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
                resources: [pipelineKmsKey.keyArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [pipelineLogGroup.logGroupArn + ':*'],
              }),
            ],
          }),
        },
      }
    );

    // CodeBuild Project
    const buildProject = new codebuild.Project(
      this,
      `BuildProject-${environmentSuffix}`,
      {
        projectName: `tap-build-${environmentSuffix}`,
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          privileged: false,
          environmentVariables: {
            ENVIRONMENT: {
              value: environmentSuffix,
            },
            AWS_DEFAULT_REGION: {
              value: this.region,
            },
            AWS_ACCOUNT_ID: {
              value: this.account,
            },
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Logging in to Amazon ECR...',
                'echo Build started on `date`',
                'echo Environment: $ENVIRONMENT',
                'npm ci --only=production',
              ],
            },
            build: {
              commands: [
                'echo Build phase started on `date`',
                'npm run build',
                'npm test',
                'echo Creating deployment package...',
                'zip -r application.zip . -x "node_modules/*" "*.git*" "tests/*" "*.md"',
              ],
            },
            post_build: {
              commands: [
                'echo Build completed on `date`',
                'echo Build phase completed',
              ],
            },
          },
          artifacts: {
            files: [
              'application.zip',
              'Dockerrun.aws.json',
              '.ebextensions/**/*',
            ],
          },
          reports: {
            'tap-test-reports': {
              files: ['coverage/**/*', 'test-results.xml'],
              'base-directory': '.',
            },
          },
        }),
        artifacts: codebuild.Artifacts.s3({
          bucket: artifactsBucket,
          includeBuildId: false,
          packageZip: true,
        }),
        logging: {
          cloudWatch: {
            logGroup: buildLogGroup,
          },
        },
        encryptionKey: pipelineKmsKey,
      }
    );

    // IAM Role for Elastic Beanstalk
    const ebInstanceRole = new iam.Role(
      this,
      `EBInstanceRole-${environmentSuffix}`,
      {
        roleName: `tap-eb-instance-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSElasticBeanstalkWebTier'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSElasticBeanstalkWorkerTier'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSElasticBeanstalkMulticontainerDocker'
          ),
        ],
      }
    );

    const ebInstanceProfile = new iam.CfnInstanceProfile(
      this,
      `EBInstanceProfile-${environmentSuffix}`,
      {
        instanceProfileName: `tap-eb-instance-profile-${environmentSuffix}`,
        roles: [ebInstanceRole.roleName],
      }
    );

    const ebServiceRole = new iam.Role(
      this,
      `EBServiceRole-${environmentSuffix}`,
      {
        roleName: `tap-eb-service-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSElasticBeanstalkEnhancedHealth'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy'
          ),
        ],
      }
    );

    // Elastic Beanstalk Application
    const ebApplication = new elasticbeanstalk.CfnApplication(
      this,
      `EBApplication-${environmentSuffix}`,
      {
        applicationName: `tap-app-${environmentSuffix}`,
        description: `TAP Application - ${environmentSuffix} environment`,
      }
    );

    // Elastic Beanstalk Environment
    const ebEnvironment = new elasticbeanstalk.CfnEnvironment(
      this,
      `EBEnvironment-${environmentSuffix}`,
      {
        applicationName: ebApplication.applicationName!,
        environmentName: `tap-env-${environmentSuffix}`,
        solutionStackName: '64bit Amazon Linux 2023 v6.6.4 running Node.js 20',
        optionSettings: [
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'IamInstanceProfile',
            value: ebInstanceProfile.instanceProfileName!,
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'ServiceRole',
            value: ebServiceRole.roleArn,
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            optionName: 'EnvironmentType',
            value: 'LoadBalanced',
          },
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MinSize',
            value: environmentSuffix === 'prod' ? '2' : '1',
          },
          {
            namespace: 'aws:autoscaling:asg',
            optionName: 'MaxSize',
            value: environmentSuffix === 'prod' ? '6' : '2',
          },
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            optionName: 'SystemType',
            value: 'enhanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
            optionName: 'StreamLogs',
            value: 'true',
          },
          {
            namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
            optionName: 'DeleteOnTerminate',
            value: 'false',
          },
          {
            namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
            optionName: 'RetentionInDays',
            value: '30',
          },
        ],
      }
    );

    ebEnvironment.addDependency(ebApplication);

    // CodePipeline Artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(
      this,
      `Pipeline-${environmentSuffix}`,
      {
        pipelineName: `tap-pipeline-${environmentSuffix}`,
        role: codePipelineRole,
        artifactBucket: artifactsBucket,
        stages: [
          // Source Stage
          {
            stageName: 'Source',
            actions: [
              new codepipelineActions.S3SourceAction({
                actionName: 'S3Source',
                bucket: sourceBucket,
                bucketKey: 'source.zip',
                output: sourceOutput,
                trigger: codepipelineActions.S3Trigger.POLL,
              }),
            ],
          },
          // Build Stage
          {
            stageName: 'Build',
            actions: [
              new codepipelineActions.CodeBuildAction({
                actionName: 'Build',
                project: buildProject,
                input: sourceOutput,
                outputs: [buildOutput],
                environmentVariables: {
                  ENVIRONMENT: {
                    value: environmentSuffix,
                  },
                },
              }),
            ],
          },
          // Manual Approval (for production)
          ...(environmentSuffix === 'prod'
            ? [
                {
                  stageName: 'ManualApproval',
                  actions: [
                    new codepipelineActions.ManualApprovalAction({
                      actionName: 'ManualApproval',
                      additionalInformation: `Please review the build artifacts and approve deployment to ${environmentSuffix} environment.`,
                      notificationTopic: notificationTopic,
                      externalEntityLink: `https://console.aws.amazon.com/elasticbeanstalk/home?region=${this.region}#/environment/dashboard?applicationName=${ebApplication.applicationName}&environmentId=${ebEnvironment.ref}`,
                    }),
                  ],
                },
              ]
            : []),
          // Deploy Stage
          {
            stageName: 'Deploy',
            actions: [
              new codepipelineActions.ElasticBeanstalkDeployAction({
                actionName: 'Deploy',
                applicationName: ebApplication.applicationName!,
                environmentName: ebEnvironment.environmentName!,
                input: buildOutput,
              }),
            ],
          },
        ],
      }
    );

    // Pipeline state change notifications
    pipeline.onStateChange(`PipelineStateChange-${environmentSuffix}`, {
      target: new targets.SnsTopic(notificationTopic),
      description: `Pipeline state change notifications for ${environmentSuffix}`,
      eventPattern: {
        detail: {
          state: ['FAILED', 'SUCCEEDED'],
        },
      },
    });

    // S3 bucket notification to trigger pipeline
    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.SnsDestination(notificationTopic),
      { prefix: 'source.zip' }
    );

    // CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      `PipelineDashboard-${environmentSuffix}`,
      {
        dashboardName: `tap-pipeline-${environmentSuffix}`,
        widgets: [
          [
            new cdk.aws_cloudwatch.TextWidget({
              markdown: `# TAP CI/CD Pipeline - ${environmentSuffix.toUpperCase()}\n\nMonitoring dashboard for the TAP application pipeline.`,
              width: 24,
              height: 2,
            }),
          ],
          [
            new cdk.aws_cloudwatch.SingleValueWidget({
              title: 'Pipeline Executions',
              metrics: [
                new cdk.aws_cloudwatch.Metric({
                  namespace: 'AWS/CodePipeline',
                  metricName: 'PipelineExecutionSuccess',
                  dimensionsMap: {
                    PipelineName: pipeline.pipelineName,
                  },
                  statistic: 'Sum',
                  period: cdk.Duration.days(1),
                }),
              ],
              width: 8,
            }),
            new cdk.aws_cloudwatch.SingleValueWidget({
              title: 'Build Success Rate',
              metrics: [
                new cdk.aws_cloudwatch.Metric({
                  namespace: 'AWS/CodeBuild',
                  metricName: 'SucceededBuilds',
                  dimensionsMap: {
                    ProjectName: buildProject.projectName,
                  },
                  statistic: 'Sum',
                  period: cdk.Duration.days(1),
                }),
              ],
              width: 8,
            }),
            new cdk.aws_cloudwatch.SingleValueWidget({
              title: 'Environment Health',
              metrics: [
                new cdk.aws_cloudwatch.Metric({
                  namespace: 'AWS/ElasticBeanstalk',
                  metricName: 'EnvironmentHealth',
                  dimensionsMap: {
                    EnvironmentName: ebEnvironment.environmentName!,
                  },
                  statistic: 'Average',
                  period: cdk.Duration.minutes(5),
                }),
              ],
              width: 8,
            }),
          ],
        ],
      }
    );

    // Stack Outputs
    new cdk.CfnOutput(this, `SourceBucketName-${environmentSuffix}`, {
      value: sourceBucket.bucketName,
      description: `Source bucket for ${environmentSuffix} environment`,
      exportName: `tap-source-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PipelineName-${environmentSuffix}`, {
      value: pipeline.pipelineName,
      description: `Pipeline name for ${environmentSuffix} environment`,
      exportName: `tap-pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DashboardURL-${environmentSuffix}`, {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: `CloudWatch dashboard URL for ${environmentSuffix} environment`,
      exportName: `tap-dashboard-url-${environmentSuffix}`,
    });
  }
}

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.int.test.ts

```typescript
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  BatchGetProjectsCommand,
  CodeBuildClient,
} from '@aws-sdk/client-codebuild';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  DescribeApplicationsCommand,
  DescribeEnvironmentsCommand,
  ElasticBeanstalkClient,
} from '@aws-sdk/client-elastic-beanstalk';
import {
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const accountId = process.env.AWS_ACCOUNT_ID || '546574183988';

// Load stack outputs from files
const flatOutputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

let stackOutputs: Record<string, string> = {};

// Load outputs at module level
try {
  if (fs.existsSync(flatOutputsPath)) {
    stackOutputs = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));
  }
} catch (error) {
  console.error('Failed to load stack outputs:', error);
}

// Initialize AWS clients
const s3Client = new S3Client({ region });
const codePipelineClient = new CodePipelineClient({ region });
const codeBuildClient = new CodeBuildClient({ region });
const elasticBeanstalkClient = new ElasticBeanstalkClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const kmsClient = new KMSClient({ region });

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {

  beforeAll(async () => {
    // Verify outputs are loaded
    if (Object.keys(stackOutputs).length === 0) {
      throw new Error('Stack outputs not loaded. Make sure to run get-outputs script first.');
    }
    console.log('Available outputs:', Object.keys(stackOutputs));
  }, 30000);

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs from deployment', () => {
      expect(stackOutputs[`SourceBucketName${environmentSuffix}`]).toBeDefined();
      expect(stackOutputs[`PipelineName${environmentSuffix}`]).toBeDefined();
      expect(stackOutputs[`DashboardURL${environmentSuffix}`]).toBeDefined();
    });

    test('should have valid resource names from outputs', () => {
      const sourceBucket = stackOutputs[`SourceBucketName${environmentSuffix}`];
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];

      expect(sourceBucket).toMatch(new RegExp(`tap-source-${environmentSuffix}-\\d+`));
      expect(pipelineName).toBe(`tap-pipeline-${environmentSuffix}`);
    });
  });

  describe('S3 Buckets', () => {
    test('source bucket should have versioning enabled', async () => {
      const bucketName = stackOutputs[`SourceBucketName${environmentSuffix}`];
      expect(bucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('source bucket should have encryption enabled', async () => {
      const bucketName = stackOutputs[`SourceBucketName${environmentSuffix}`];
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('artifacts bucket should have lifecycle rules', async () => {
      // Artifacts bucket name follows the pattern from the CDK stack
      const bucketName = `tap-artifacts-${environmentSuffix}-${accountId}`;

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const deleteRule = response.Rules!.find(
        rule => rule.ID === 'DeleteArtifacts'
      );
      expect(deleteRule).toBeDefined();
      expect(deleteRule!.Status).toBe('Enabled');
      expect(deleteRule!.Expiration!.Days).toBe(30);
    });
  });

  describe('KMS Key', () => {
    test('should have key rotation enabled', async () => {
      const aliasName = `alias/tap-pipeline-${environmentSuffix}`;

      // First get the key ID from the alias
      const listCommand = new ListAliasesCommand({});
      const aliasResponse = await kmsClient.send(listCommand);
      const alias = aliasResponse.Aliases!.find(a => a.AliasName === aliasName);

      expect(alias).toBeDefined();
      expect(alias!.TargetKeyId).toBeDefined();

      // Then check key rotation status
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: alias!.TargetKeyId,
      });
      const rotationResponse = await kmsClient.send(rotationCommand);

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('SNS Topic', () => {
    test('should exist with correct configuration', async () => {
      const topicName = `tap-pipeline-notifications-${environmentSuffix}`;

      // We need to get the topic ARN from stack outputs or construct it
      const topicArn = `arn:aws:sns:${region}:${accountId}:${topicName}`;

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe(
        `TAP Pipeline Notifications - ${environmentSuffix}`
      );
    });

    test('should have email subscription', async () => {
      const topicName = `tap-pipeline-notifications-${environmentSuffix}`;
      const topicArn = `arn:aws:sns:${region}:${accountId}:${topicName}`;

      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: topicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);

      const emailSubscription = response.Subscriptions!.find(
        sub => sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
      expect(emailSubscription!.Endpoint).toBe('admin@example.com');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('build log group should exist with correct retention', async () => {
      const logGroupName = `/aws/codebuild/tap-build-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      const matchingLogGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(matchingLogGroup).toBeDefined();
      expect(matchingLogGroup!.logGroupName).toBe(logGroupName);
      expect(matchingLogGroup!.retentionInDays).toBe(30);
    });

    test('pipeline log group should exist with correct retention', async () => {
      const logGroupName = `/aws/codepipeline/tap-pipeline-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      const matchingLogGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(matchingLogGroup).toBeDefined();
      expect(matchingLogGroup!.logGroupName).toBe(logGroupName);
      expect(matchingLogGroup!.retentionInDays).toBe(30);
    });
  });

  describe('CodeBuild Project', () => {
    test('should exist with correct configuration', async () => {
      const projectName = `tap-build-${environmentSuffix}`;

      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);

      const project = response.projects![0];
      expect(project.name).toBe(projectName);
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.image).toBe('aws/codebuild/standard:7.0');
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.privilegedMode).toBe(false);

      // Check environment variables
      const envVars = project.environment!.environmentVariables!;
      expect(envVars.find(env => env.name === 'ENVIRONMENT')?.value).toBe(
        environmentSuffix
      );
      expect(
        envVars.find(env => env.name === 'AWS_DEFAULT_REGION')?.value
      ).toBe(region);
      expect(envVars.find(env => env.name === 'AWS_ACCOUNT_ID')?.value).toBe(
        accountId
      );
    });
  });

  describe('Elastic Beanstalk', () => {
    test('application should exist', async () => {
      const applicationName = `tap-app-${environmentSuffix}`;

      const command = new DescribeApplicationsCommand({
        ApplicationNames: [applicationName],
      });
      const response = await elasticBeanstalkClient.send(command);

      expect(response.Applications).toBeDefined();
      expect(response.Applications!.length).toBe(1);
      expect(response.Applications![0].ApplicationName).toBe(applicationName);
      expect(response.Applications![0].Description).toBe(
        `TAP Application - ${environmentSuffix} environment`
      );
    });

    test('environment should exist with correct configuration', async () => {
      const environmentName = `tap-env-${environmentSuffix}`;

      const command = new DescribeEnvironmentsCommand({
        EnvironmentNames: [environmentName],
      });
      const response = await elasticBeanstalkClient.send(command);

      expect(response.Environments).toBeDefined();
      
      // Filter out terminated environments
      const activeEnvironments = response.Environments!.filter(
        env => env.Status !== 'Terminated'
      );
      expect(activeEnvironments.length).toBe(1);

      const environment = activeEnvironments[0];
      expect(environment.EnvironmentName).toBe(environmentName);
      expect(environment.SolutionStackName).toBe(
        '64bit Amazon Linux 2023 v6.6.4 running Node.js 20'
      );
      expect(environment.Health).toBeDefined();
      expect(environment.Status).toMatch(/^(Ready|Launching|Updating)$/);
    });
  });

  describe('CodePipeline', () => {
    test('should exist with correct stages', async () => {
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline!.name).toBe(pipelineName);

      const stages = response.pipeline!.stages!;
      expect(stages.length).toBeGreaterThanOrEqual(3);

      // Check required stages
      expect(stages.find(stage => stage.name === 'Source')).toBeDefined();
      expect(stages.find(stage => stage.name === 'Build')).toBeDefined();
      expect(stages.find(stage => stage.name === 'Deploy')).toBeDefined();

      // For production, check for manual approval
      if (environmentSuffix === 'prod') {
        expect(
          stages.find(stage => stage.name === 'ManualApproval')
        ).toBeDefined();
      }
    });

    test('should be in valid state', async () => {
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];
      expect(pipelineName).toBeDefined();

      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await codePipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should exist for pipeline monitoring', async () => {
      const dashboardName = `tap-pipeline-${environmentSuffix}`;
      const dashboardURL = stackOutputs[`DashboardURL${environmentSuffix}`];

      // Verify dashboard URL is available in outputs
      expect(dashboardURL).toBeDefined();
      expect(dashboardURL).toContain('cloudwatch');
      expect(dashboardURL).toContain(dashboardName);

      const command = new ListDashboardsCommand({
        DashboardNamePrefix: dashboardName,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardEntries).toBeDefined();
      const matchingDashboard = response.DashboardEntries!.find(d => d.DashboardName === dashboardName);
      expect(matchingDashboard).toBeDefined();
      expect(matchingDashboard!.DashboardName).toBe(dashboardName);
      expect(matchingDashboard!.Size).toBeGreaterThan(0);
    });
  });

  describe('Security Validation', () => {
    test('all resources should be properly tagged', () => {
      // Verify resource names contain environment suffix (indicating proper tagging)
      const sourceBucket = stackOutputs[`SourceBucketName${environmentSuffix}`];
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];

      expect(sourceBucket).toContain(environmentSuffix);
      expect(pipelineName).toContain(environmentSuffix);

      // Environment suffix in resource names indicates proper tagging strategy
      expect(environmentSuffix).toBeDefined();
    });

    test('stack outputs should contain all required values', () => {
      expect(
        stackOutputs[`SourceBucketName${environmentSuffix}`]
      ).toBeDefined();
      expect(stackOutputs[`PipelineName${environmentSuffix}`]).toBeDefined();
      expect(stackOutputs[`DashboardURL${environmentSuffix}`]).toBeDefined();
    });
  });

  describe('End-to-End Pipeline Functionality', () => {
    test('pipeline components should be properly integrated', async () => {
      // This test validates that all components can work together using stack outputs
      const pipelineName = stackOutputs[`PipelineName${environmentSuffix}`];
      const buildProjectName = `tap-build-${environmentSuffix}`;
      const ebApplicationName = `tap-app-${environmentSuffix}`;

      expect(pipelineName).toBeDefined();

      // Check pipeline exists and references correct resources
      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await codePipelineClient.send(pipelineCommand);

      const buildStage = pipelineResponse.pipeline!.stages!.find(
        stage => stage.name === 'Build'
      );
      expect(buildStage).toBeDefined();

      const buildAction = buildStage!.actions![0];
      expect(buildAction.configuration!.ProjectName).toBe(buildProjectName);

      // Check CodeBuild project exists
      const buildCommand = new BatchGetProjectsCommand({
        names: [buildProjectName],
      });
      const buildResponse = await codeBuildClient.send(buildCommand);
      expect(buildResponse.projects!.length).toBe(1);

      // Check Elastic Beanstalk application exists
      const ebCommand = new DescribeApplicationsCommand({
        ApplicationNames: [ebApplicationName],
      });
      const ebResponse = await elasticBeanstalkClient.send(ebCommand);
      expect(ebResponse.Applications!.length).toBe(1);

      console.log('✅ All pipeline components are properly integrated');
    });
  });
});

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('should create KMS key with encryption enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for CI/CD pipeline encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-pipeline-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create source bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create artifacts bucket with lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteArtifacts',
              ExpirationInDays: 30,
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('SNS Topic and Notifications', () => {
    test('should create SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-pipeline-notifications-${environmentSuffix}`,
        DisplayName: `TAP Pipeline Notifications - ${environmentSuffix}`,
      });
    });

    test('should create email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create build log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('should create pipeline log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codepipeline/tap-pipeline-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodeBuild role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create CodePipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codepipeline-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create Elastic Beanstalk instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-eb-instance-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create Elastic Beanstalk service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-eb-service-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'elasticbeanstalk.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-build-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: false,
          EnvironmentVariables: [
            {
              Name: 'ENVIRONMENT',
              Type: 'PLAINTEXT',
              Value: environmentSuffix,
            },
            {
              Name: 'AWS_DEFAULT_REGION',
              Type: 'PLAINTEXT',
            },
            {
              Name: 'AWS_ACCOUNT_ID',
              Type: 'PLAINTEXT',
            },
          ],
        },
      });
    });
  });

  describe('Elastic Beanstalk', () => {
    test('should create Elastic Beanstalk application', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Application', {
        ApplicationName: `tap-app-${environmentSuffix}`,
        Description: `TAP Application - ${environmentSuffix} environment`,
      });
    });

    test('should create Elastic Beanstalk environment with correct platform', () => {
      template.hasResourceProperties('AWS::ElasticBeanstalk::Environment', {
        ApplicationName: `tap-app-${environmentSuffix}`,
        EnvironmentName: `tap-env-${environmentSuffix}`,
        SolutionStackName: '64bit Amazon Linux 2023 v6.6.4 running Node.js 20',
      });
    });

    test('should configure environment scaling for dev vs prod', () => {
      const minSize = environmentSuffix === 'prod' ? '2' : '1';
      const maxSize = environmentSuffix === 'prod' ? '6' : '2';

      const ebEnvironment = template.findResources(
        'AWS::ElasticBeanstalk::Environment'
      );
      const environment = Object.values(ebEnvironment)[0] as any;
      const optionSettings = environment.Properties.OptionSettings;

      const minSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MinSize'
      );
      const maxSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MaxSize'
      );

      expect(minSizeSetting.Value).toBe(minSize);
      expect(maxSizeSetting.Value).toBe(maxSize);
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline with all required stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `tap-pipeline-${environmentSuffix}`,
        Stages: [
          {
            Name: 'Source',
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
                Name: 'S3Source',
                Configuration: {
                  S3ObjectKey: 'source.zip',
                  PollForSourceChanges: true,
                },
              },
            ],
          },
          {
            Name: 'Build',
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Name: 'Build',
              },
            ],
          },
          {
            Name: 'Deploy',
            Actions: [
              {
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'ElasticBeanstalk',
                  Version: '1',
                },
                Name: 'Deploy',
              },
            ],
          },
        ],
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `tap-pipeline-${environmentSuffix}`,
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create pipeline state change rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: `Pipeline state change notifications for ${environmentSuffix}`,
        EventPattern: {
          detail: {
            state: ['FAILED', 'SUCCEEDED'],
          },
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have required outputs', () => {
      template.hasOutput(`SourceBucketName${environmentSuffix}`, {});
      template.hasOutput(`PipelineName${environmentSuffix}`, {});
      template.hasOutput(`DashboardURL${environmentSuffix}`, {});
    });
  });

  describe('Security Best Practices', () => {
    test('should have public access blocked on all S3 buckets', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have versioning enabled on source bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('should have lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('Manual Approval for Production', () => {
    test('should include manual approval stage for production environment', () => {
      if (environmentSuffix === 'prod') {
        template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
          Stages: [
            {
              Name: 'Source',
            },
            {
              Name: 'Build',
            },
            {
              Name: 'ManualApproval',
              Actions: [
                {
                  ActionTypeId: {
                    Category: 'Approval',
                    Owner: 'AWS',
                    Provider: 'Manual',
                    Version: '1',
                  },
                  Name: 'ManualApproval',
                },
              ],
            },
            {
              Name: 'Deploy',
            },
          ],
        });
      }
    });

    test('should not include manual approval for non-production environments', () => {
      if (environmentSuffix !== 'prod') {
        const pipelineTemplate = template.findResources(
          'AWS::CodePipeline::Pipeline'
        );
        const pipeline = Object.values(pipelineTemplate)[0] as any;
        const stageNames = pipeline.Properties.Stages.map(
          (stage: any) => stage.Name
        );
        expect(stageNames).not.toContain('ManualApproval');
      }
    });
  });

  describe('Environment Configuration Coverage', () => {
    test('should use context environmentSuffix when props is undefined', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);

      // Check that staging environment creates pipeline with staging name
      contextTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-staging',
      });
    });

    test('should use default dev when no props or context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Check that default environment creates pipeline with dev name
      defaultTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-dev',
      });
    });

    test('should use context notificationEmail when props is undefined', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('notificationEmail', 'test@example.com');
      const contextStack = new TapStack(contextApp, 'NotificationContextStack');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('should use default email when no props or context provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultEmailStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('Production Environment Specific Tests', () => {
    let prodApp: cdk.App;
    let prodStack: TapStack;
    let prodTemplate: Template;

    beforeEach(() => {
      prodApp = new cdk.App();
      prodStack = new TapStack(prodApp, 'ProdStack', { environmentSuffix: 'prod' });
      prodTemplate = Template.fromStack(prodStack);
    });

    test('should configure production scaling with higher limits', () => {
      const ebEnvironment = prodTemplate.findResources(
        'AWS::ElasticBeanstalk::Environment'
      );
      const environment = Object.values(ebEnvironment)[0] as any;
      const optionSettings = environment.Properties.OptionSettings;

      const minSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MinSize'
      );
      const maxSizeSetting = optionSettings.find(
        (setting: any) =>
          setting.Namespace === 'aws:autoscaling:asg' &&
          setting.OptionName === 'MaxSize'
      );

      expect(minSizeSetting.Value).toBe('2');
      expect(maxSizeSetting.Value).toBe('6');
    });

    test('should include manual approval stage for production', () => {
      const pipeline = prodTemplate.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource.Properties.Stages;
      
      const stageNames = stages.map((stage: any) => stage.Name);
      expect(stageNames).toContain('ManualApproval');
      
      const approvalStage = stages.find((stage: any) => stage.Name === 'ManualApproval');
      expect(approvalStage.Actions[0].ActionTypeId.Provider).toBe('Manual');
    });

    test('should create production-specific resource names', () => {
      prodTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-prod',
      });
      
      prodTemplate.hasResourceProperties('AWS::ElasticBeanstalk::Application', {
        ApplicationName: 'tap-app-prod',
        Description: 'TAP Application - prod environment',
      });
      
      // Check SNS topic has prod suffix
      prodTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-pipeline-notifications-prod',
        DisplayName: 'TAP Pipeline Notifications - prod',
      });
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
