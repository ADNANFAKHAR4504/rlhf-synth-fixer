import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

interface CiCdPipelineStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class CiCdPipelineStack extends cdk.Stack {
  public readonly artifactsBucket: s3.Bucket;
  public readonly buildProject: codebuild.Project;
  public readonly pipeline: codepipeline.Pipeline;
  public readonly pipelineDashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: CiCdPipelineStackProps) {
    super(scope, id, props);

    // Company tagging policy
    const tags = {
      Environment: 'Production',
      Project: 'CI_CD_Pipeline',
    };

    // Apply tags to all constructs in this stack
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // S3 Bucket for artifacts storage with versioning
    this.artifactsBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `ci-cd-pipeline-artifacts-${props.environmentSuffix}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Add lifecycle rule to manage old artifact versions and expire old artifacts
    this.artifactsBucket.addLifecycleRule({
      id: 'DeleteOldVersions',
      enabled: true,
      expiration: cdk.Duration.days(90), // Expire current objects after 90 days
      noncurrentVersionExpiration: cdk.Duration.days(30), // Expire noncurrent versions after 30 days
    });

    // IAM Role for CodeBuild service
    const codeBuildRole = new iam.Role(this, 'CodeBuildServiceRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Service role for CodeBuild project',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSCodeBuildDeveloperAccess'
        ),
      ],
    });

    // Enhanced permissions for CodeBuild debugging and operations
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          'codebuild:BatchGetProjects',
          'codebuild:StartDebugSession',
        ],
        resources: [
          `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/codebuild/*`,
          `${this.artifactsBucket.bucketArn}/*`,
        ],
      })
    );

    // CodeBuild project with enhanced debugging capabilities
    this.buildProject = new codebuild.Project(this, 'WebAppBuildProject', {
      projectName: `web-app-build-${props.environmentSuffix}`,
      role: codeBuildRole,
      description: 'Build and test project for web application',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ARTIFACTS_BUCKET: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.artifactsBucket.bucketName,
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
              'echo Installing dependencies...',
              'npm install',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Running tests...',
              'npm test',
              'echo Building the application...',
              'npm run build',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Uploading artifacts to S3...',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
          'base-directory': 'dist',
        },
        cache: {
          paths: ['node_modules/**/*'],
        },
      }),
    });

    // Grant necessary permissions to access the artifacts bucket
    this.artifactsBucket.grantReadWrite(this.buildProject);

    // IAM Role for CodePipeline service
    const pipelineRole = new iam.Role(this, 'PipelineServiceRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'Service role for CodePipeline',
    });

    // CodePipeline permissions
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetBucketLocation',
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          'codebuild:BatchGetBuilds',
          'codebuild:StartBuild',
          'iam:PassRole',
        ],
        resources: [
          this.artifactsBucket.bucketArn,
          `${this.artifactsBucket.bucketArn}/*`,
          this.buildProject.projectArn,
          codeBuildRole.roleArn,
        ],
      })
    );

    // Create source bucket for pipeline input
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `ci-cd-source-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Source artifact
    const sourceOutput = new codepipeline.Artifact('Source');
    const buildOutput = new codepipeline.Artifact('Build');

    // Grant permissions to pipeline role for source bucket
    sourceBucket.grantRead(pipelineRole);

    // CodePipeline V2 with parallel execution mode
    this.pipeline = new codepipeline.Pipeline(this, 'WebAppPipeline', {
      pipelineName: `web-app-pipeline-${props.environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: this.artifactsBucket,
      pipelineType: codepipeline.PipelineType.V2,
      executionMode: codepipeline.ExecutionMode.PARALLEL,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.S3SourceAction({
              actionName: 'S3_Source',
              bucket: sourceBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
              trigger: codepipelineActions.S3Trigger.POLL,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Build_and_Test',
              project: this.buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.S3DeployAction({
              actionName: 'Deploy_to_S3',
              bucket: this.artifactsBucket,
              input: buildOutput,
              objectKey: 'deployments/',
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // CloudWatch Dashboard for pipeline metrics
    this.pipelineDashboard = new cloudwatch.Dashboard(
      this,
      'PipelineDashboard',
      {
        dashboardName: `CI-CD-Pipeline-${props.environmentSuffix}-Dashboard`,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'Pipeline Success Rate',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/CodePipeline',
                  metricName: 'PipelineExecutionSuccess',
                  dimensionsMap: {
                    PipelineName: this.pipeline.pipelineName,
                  },
                  statistic: 'Sum',
                }),
              ],
              width: 12,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'Build Duration',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/CodeBuild',
                  metricName: 'Duration',
                  dimensionsMap: {
                    ProjectName: this.buildProject.projectName,
                  },
                  statistic: 'Average',
                }),
              ],
              width: 12,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'Build Failures',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/CodeBuild',
                  metricName: 'FailedBuilds',
                  dimensionsMap: {
                    ProjectName: this.buildProject.projectName,
                  },
                  statistic: 'Sum',
                }),
              ],
              width: 12,
            }),
          ],
        ],
      }
    );

    // SNS topic for pipeline notifications
    const pipelineNotificationsTopic = new sns.Topic(
      this,
      'PipelineNotifications',
      {
        topicName: `ci-cd-pipeline-notifications-${props.environmentSuffix}`,
        displayName: 'CI/CD Pipeline Notifications',
      }
    );

    // SQS queue for event processing
    const pipelineEventsQueue = new sqs.Queue(this, 'PipelineEventsQueue', {
      queueName: `ci-cd-pipeline-events-${props.environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
    });

    // Lambda function for processing pipeline events
    const eventProcessorFunction = new lambda.Function(
      this,
      'EventProcessorFunction',
      {
        functionName: `pipeline-event-processor-${props.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
        const sns = new SNSClient({});
        
        exports.handler = async (event) => {
          console.log('Received pipeline event:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            const message = JSON.parse(record.body);
            const detail = message.detail;
            
            if (detail && detail.state) {
              const notificationMessage = {
                pipeline: detail.pipeline,
                state: detail.state,
                timestamp: new Date().toISOString(),
                executionId: detail['execution-id'],
                region: process.env.AWS_REGION
              };
              
              await sns.send(new PublishCommand({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Message: JSON.stringify(notificationMessage, null, 2),
                Subject: \`Pipeline \${detail.pipeline} - \${detail.state}\`
              }));
            }
          }
          
          return { statusCode: 200, body: 'Events processed successfully' };
        };
      `),
        environment: {
          SNS_TOPIC_ARN: pipelineNotificationsTopic.topicArn,
        },
        timeout: cdk.Duration.seconds(60),
      }
    );

    // Grant permissions to Lambda function
    pipelineNotificationsTopic.grantPublish(eventProcessorFunction);
    pipelineEventsQueue.grantConsumeMessages(eventProcessorFunction);

    // EventBridge rule to capture CodePipeline state changes
    new events.Rule(this, 'PipelineStateRule', {
      ruleName: `pipeline-state-changes-${props.environmentSuffix}`,
      description: 'Capture CodePipeline state changes',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [this.pipeline.pipelineName],
        },
      },
      targets: [new eventsTargets.SqsQueue(pipelineEventsQueue)],
    });

    // Add Lambda event source mapping for SQS (replaces EventBridge Pipes)
    eventProcessorFunction.addEventSource(
      new SqsEventSource(pipelineEventsQueue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
      })
    );

    // CloudWatch Alarms for pipeline monitoring
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: `CI-CD-Pipeline-Failure-${props.environmentSuffix}`,
        alarmDescription: 'Alarm when pipeline fails',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionFailure',
          dimensionsMap: {
            PipelineName: this.pipeline.pipelineName,
          },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Add SNS notification to alarm
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationsTopic)
    );

    const buildFailureAlarm = new cloudwatch.Alarm(this, 'BuildFailureAlarm', {
      alarmName: `CI-CD-Build-Failure-${props.environmentSuffix}`,
      alarmDescription: 'Alarm when build fails',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'FailedBuilds',
        dimensionsMap: {
          ProjectName: this.buildProject.projectName,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add SNS notification to build alarm
    buildFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationsTopic)
    );

    // Outputs
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'Name of the S3 source bucket for pipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'Name of the S3 bucket for pipeline artifacts',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Name of the CodePipeline',
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: this.buildProject.projectName,
      description: 'Name of the CodeBuild project',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'ARN of the CodePipeline',
    });

    new cdk.CfnOutput(this, 'BuildProjectArn', {
      value: this.buildProject.projectArn,
      description: 'ARN of the CodeBuild project',
    });

    new cdk.CfnOutput(this, 'PipelineDashboardName', {
      value: this.pipelineDashboard.dashboardName!,
      description: 'Name of the CloudWatch Dashboard for pipeline monitoring',
    });

    new cdk.CfnOutput(this, 'PipelineDashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#dashboards:name=${this.pipelineDashboard.dashboardName}`,
      description: 'URL of the CloudWatch Dashboard for pipeline monitoring',
    });

    new cdk.CfnOutput(this, 'PipelineNotificationsTopic', {
      value: pipelineNotificationsTopic.topicArn,
      description: 'ARN of the SNS topic for pipeline notifications',
    });

    new cdk.CfnOutput(this, 'EventProcessorFunctionName', {
      value: eventProcessorFunction.functionName,
      description: 'Name of the Lambda function processing pipeline events',
    });

    new cdk.CfnOutput(this, 'PipelineEventsQueueUrl', {
      value: pipelineEventsQueue.queueUrl,
      description: 'URL of the SQS queue for pipeline events',
    });
  }
}
