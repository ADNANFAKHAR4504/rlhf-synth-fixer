import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  notificationEmail?: string;
  approverEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Email addresses for notifications
    const notificationEmail =
      props?.notificationEmail || 'devops@yourcompany.com';
    const approverEmail = props?.approverEmail || 'approver@yourcompany.com';

    // Create KMS key for encryption
    const pipelineKmsKey = new kms.Key(
      this,
      `PipelineKmsKey-${environmentSuffix}`,
      {
        alias: `tap-pipeline-key-${environmentSuffix}`,
        description: `KMS key for TAP CI/CD pipeline encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      }
    );

    // Create S3 bucket for source code (pipeline trigger)
    const sourceBucket = new s3.Bucket(
      this,
      `SourceBucket-${environmentSuffix}`,
      {
        bucketName: `tap-source-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: pipelineKmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      }
    );

    // Create S3 bucket for build artifacts
    const artifactsBucket = new s3.Bucket(
      this,
      `ArtifactsBucket-${environmentSuffix}`,
      {
        bucketName: `tap-artifacts-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: pipelineKmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'DeleteOldArtifacts',
            enabled: true,
            expiration: cdk.Duration.days(30),
            noncurrentVersionExpiration: cdk.Duration.days(7),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      }
    );

    // Create SNS topics for notifications
    const pipelineNotificationsTopic = new sns.Topic(
      this,
      `PipelineNotifications-${environmentSuffix}`,
      {
        topicName: `tap-pipeline-notifications-${environmentSuffix}`,
        displayName: `TAP Pipeline Notifications - ${environmentSuffix}`,
        masterKey: pipelineKmsKey,
      }
    );

    // Subscribe email to SNS topic
    pipelineNotificationsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(notificationEmail)
    );

    // Create approval SNS topic
    const approvalTopic = new sns.Topic(
      this,
      `ApprovalTopic-${environmentSuffix}`,
      {
        topicName: `tap-approval-${environmentSuffix}`,
        displayName: `TAP Approval Notifications - ${environmentSuffix}`,
        masterKey: pipelineKmsKey,
      }
    );

    approvalTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(approverEmail)
    );

    // Create IAM role for CodeBuild
    const codeBuildRole = new iam.Role(
      this,
      `CodeBuildRole-${environmentSuffix}`,
      {
        roleName: `tap-codebuild-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        inlinePolicies: {
          CodeBuildPolicy: new iam.PolicyDocument({
            statements: [
              // CloudWatch Logs permissions
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [
                  `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/tap-*`,
                ],
              }),
              // S3 permissions for artifacts
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:PutObject',
                ],
                resources: [
                  `${artifactsBucket.bucketArn}/*`,
                  `${sourceBucket.bucketArn}/*`,
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:ListBucket'],
                resources: [artifactsBucket.bucketArn, sourceBucket.bucketArn],
              }),
              // KMS permissions
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
                resources: [pipelineKmsKey.keyArn],
              }),
              // SNS permissions for notifications
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sns:Publish'],
                resources: [pipelineNotificationsTopic.topicArn],
              }),
            ],
          }),
        },
      }
    );

    // Create CodeBuild project
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
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '18',
              },
              commands: ['echo Installing dependencies...', 'npm ci'],
            },
            pre_build: {
              commands: [
                'echo Running pre-build commands...',
                'npm run lint || true', // Continue even if linting fails
              ],
            },
            build: {
              commands: [
                'echo Running tests...',
                'npm test',
                'echo Building application...',
                'npm run build',
              ],
            },
            post_build: {
              commands: [
                'echo Build completed on `date`',
                // Send success notification
                `aws sns publish --topic-arn ${pipelineNotificationsTopic.topicArn} --message "Build succeeded for ${environmentSuffix} environment" --subject "TAP Build Success - ${environmentSuffix}" || true`,
              ],
            },
          },
          artifacts: {
            files: ['**/*'],
            'exclude-paths': [
              'node_modules/**/*',
              '.git/**/*',
              '.gitignore',
              'README.md',
            ],
          },
        }),
        encryptionKey: pipelineKmsKey,
      }
    );

    // Create IAM role for CodePipeline
    const pipelineRole = new iam.Role(
      this,
      `PipelineRole-${environmentSuffix}`,
      {
        roleName: `tap-pipeline-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        inlinePolicies: {
          PipelinePolicy: new iam.PolicyDocument({
            statements: [
              // S3 permissions
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetObject',
                  's3:GetObjectVersion',
                  's3:PutObject',
                  's3:GetBucketVersioning',
                ],
                resources: [
                  `${artifactsBucket.bucketArn}/*`,
                  `${sourceBucket.bucketArn}/*`,
                  artifactsBucket.bucketArn,
                  sourceBucket.bucketArn,
                ],
              }),
              // CodeBuild permissions
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
                resources: [buildProject.projectArn],
              }),
              // CodeDeploy permissions
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'codedeploy:CreateDeployment',
                  'codedeploy:GetDeployment',
                  'codedeploy:GetDeploymentConfig',
                  'codedeploy:RegisterApplicationRevision',
                ],
                resources: ['*'], // CodeDeploy requires wildcard for some operations
              }),
              // KMS permissions
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
                resources: [pipelineKmsKey.keyArn],
              }),
              // SNS permissions
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sns:Publish'],
                resources: [
                  pipelineNotificationsTopic.topicArn,
                  approvalTopic.topicArn,
                ],
              }),
            ],
          }),
        },
      }
    );

    // Create CodeDeploy application
    const deployApplication = new codedeploy.ServerApplication(
      this,
      `DeployApplication-${environmentSuffix}`,
      {
        applicationName: `tap-deploy-${environmentSuffix}`,
      }
    );

    // Create artifacts for pipeline stages
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(
      this,
      `Pipeline-${environmentSuffix}`,
      {
        pipelineName: `tap-pipeline-${environmentSuffix}`,
        role: pipelineRole,
        artifactBucket: artifactsBucket,
        stages: [
          // Source stage
          {
            stageName: 'Source',
            actions: [
              new codepipelineActions.S3SourceAction({
                actionName: 'S3Source',
                bucket: sourceBucket,
                bucketKey: 'source.zip',
                output: sourceOutput,
                trigger: codepipelineActions.S3Trigger.EVENTS,
              }),
            ],
          },
          // Build and Test stage
          {
            stageName: 'BuildAndTest',
            actions: [
              new codepipelineActions.CodeBuildAction({
                actionName: 'BuildAndTest',
                project: buildProject,
                input: sourceOutput,
                outputs: [buildOutput],
              }),
            ],
          },
          // Manual Approval stage (only for production)
          ...(environmentSuffix === 'prod'
            ? [
                {
                  stageName: 'ManualApproval',
                  actions: [
                    new codepipelineActions.ManualApprovalAction({
                      actionName: 'ManualApproval',
                      notificationTopic: approvalTopic,
                      additionalInformation: `Please review and approve deployment to ${environmentSuffix} environment`,
                      externalEntityLink: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/tap-pipeline-${environmentSuffix}/view`,
                    }),
                  ],
                },
              ]
            : []),
          // Deploy stage
          {
            stageName: 'Deploy',
            actions: [
              new codepipelineActions.CodeDeployServerDeployAction({
                actionName: 'Deploy',
                input: buildOutput,
                deploymentGroup: new codedeploy.ServerDeploymentGroup(
                  this,
                  `DeploymentGroup-${environmentSuffix}`,
                  {
                    application: deployApplication,
                    deploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
                    deploymentConfig:
                      codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
                  }
                ),
              }),
            ],
          },
        ],
      }
    );

    // Create Lambda function for pipeline state notifications
    const notificationFunction = new lambda.Function(
      this,
      `NotificationFunction-${environmentSuffix}`,
      {
        functionName: `tap-pipeline-notifications-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();

        exports.handler = async (event) => {
          console.log('Pipeline state change event:', JSON.stringify(event, null, 2));
          
          const detail = event.detail;
          const state = detail.state;
          const pipelineName = detail.pipeline;
          const stage = detail.stage || 'Unknown';
          
          let message = '';
          let subject = '';
          
          switch (state) {
            case 'SUCCEEDED':
              message = \`Pipeline \${pipelineName} stage '\${stage}' completed successfully.\`;
              subject = \`✅ TAP Pipeline Success - \${stage}\`;
              break;
            case 'FAILED':
              message = \`Pipeline \${pipelineName} stage '\${stage}' failed. Please check the pipeline for details.\`;
              subject = \`❌ TAP Pipeline Failure - \${stage}\`;
              break;
            case 'STARTED':
              message = \`Pipeline \${pipelineName} stage '\${stage}' has started.\`;
              subject = \`🚀 TAP Pipeline Started - \${stage}\`;
              break;
            default:
              message = \`Pipeline \${pipelineName} stage '\${stage}' state changed to \${state}.\`;
              subject = \`TAP Pipeline Update - \${stage}\`;
          }
          
          const params = {
            TopicArn: '${pipelineNotificationsTopic.topicArn}',
            Message: message,
            Subject: subject
          };
          
          try {
            await sns.publish(params).promise();
            console.log('Notification sent successfully');
          } catch (error) {
            console.error('Error sending notification:', error);
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify('Notification processed')
          };
        };
      `),
        environment: {
          SNS_TOPIC_ARN: pipelineNotificationsTopic.topicArn,
        },
      }
    );

    // Grant permissions to the notification function
    pipelineNotificationsTopic.grantPublish(notificationFunction);

    // Create EventBridge rule for pipeline state changes
    const pipelineStateRule = new events.Rule(
      this,
      `PipelineStateRule-${environmentSuffix}`,
      {
        ruleName: `tap-pipeline-state-${environmentSuffix}`,
        eventPattern: {
          source: ['aws.codepipeline'],
          detailType: [
            'CodePipeline Pipeline Execution State Change',
            'CodePipeline Stage Execution State Change',
          ],
          detail: {
            pipeline: [pipeline.pipelineName],
          },
        },
      }
    );

    pipelineStateRule.addTarget(
      new targets.LambdaFunction(notificationFunction)
    );

    // Output important resources
    new cdk.CfnOutput(this, `SourceBucketName-${environmentSuffix}`, {
      value: sourceBucket.bucketName,
      description: 'S3 bucket for source code uploads',
      exportName: `tap-source-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PipelineName-${environmentSuffix}`, {
      value: pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `tap-pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ArtifactsBucketName-${environmentSuffix}`, {
      value: artifactsBucket.bucketName,
      description: 'S3 bucket for build artifacts',
      exportName: `tap-artifacts-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `KmsKeyId-${environmentSuffix}`, {
      value: pipelineKmsKey.keyId,
      description: 'KMS key for pipeline encryption',
      exportName: `tap-kms-key-${environmentSuffix}`,
    });
  }
}
