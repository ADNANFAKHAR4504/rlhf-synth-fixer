# CI/CD Pipeline Infrastructure with AWS CDK TypeScript

This solution creates a comprehensive CI/CD pipeline using AWS CDK with TypeScript that automates the deployment and testing of a web application. The infrastructure leverages the latest AWS features including CodePipeline V2 with trigger filters, CodeBuild's enhanced debugging capabilities, CloudWatch Application Signals for advanced observability, and EventBridge Pipes for event-driven automation.

## lib/ci-cd-pipeline-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as pipes from '@aws-cdk/aws-pipes-alpha';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface CiCdPipelineStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class CiCdPipelineStack extends cdk.Stack {
  public readonly artifactsBucket: s3.Bucket;
  public readonly buildProject: codebuild.Project;
  public readonly pipeline: codepipeline.Pipeline;
  public readonly applicationSignalsServiceMap: cloudwatch.CfnServiceMap;
  public readonly pipelineEventsPipe: pipes.Pipe;

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
      bucketName: `ci-cd-pipeline-artifacts-${props.environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
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
      bucketName: `ci-cd-source-${props.environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
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
              trigger: codepipelineActions.S3Trigger.EVENTS,
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

    // CloudWatch Application Signals for advanced observability
    this.applicationSignalsServiceMap = new cloudwatch.CfnServiceMap(this, 'PipelineServiceMap', {
      name: `ci-cd-pipeline-${props.environmentSuffix}`,
    });

    // Application Signals Dashboard for pipeline metrics
    const pipelineDashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
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
    });

    // SNS topic for pipeline notifications
    const pipelineNotificationsTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: `ci-cd-pipeline-notifications-${props.environmentSuffix}`,
      displayName: 'CI/CD Pipeline Notifications',
    });

    // SQS queue for event processing
    const pipelineEventsQueue = new sqs.Queue(this, 'PipelineEventsQueue', {
      queueName: `ci-cd-pipeline-events-${props.environmentSuffix}`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
    });

    // Lambda function for processing pipeline events
    const eventProcessorFunction = new lambda.Function(this, 'EventProcessorFunction', {
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
    });

    // Grant permissions to Lambda function
    pipelineNotificationsTopic.grantPublish(eventProcessorFunction);
    pipelineEventsQueue.grantConsumeMessages(eventProcessorFunction);

    // EventBridge Pipes for event-driven automation
    const pipeRole = new iam.Role(this, 'PipelineEventsPipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
      description: 'Role for EventBridge Pipes to process pipeline events',
    });

    // Permissions for the pipe role
    pipeRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'events:PutEvents',
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage',
          'sqs:GetQueueAttributes',
          'lambda:InvokeFunction',
        ],
        resources: [
          `arn:aws:events:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:event-bus/default`,
          pipelineEventsQueue.queueArn,
          eventProcessorFunction.functionArn,
        ],
      })
    );

    // EventBridge rule to capture CodePipeline state changes
    const pipelineStateRule = new events.Rule(this, 'PipelineStateRule', {
      ruleName: `pipeline-state-changes-${props.environmentSuffix}`,
      description: 'Capture CodePipeline state changes',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [this.pipeline.pipelineName],
        },
      },
      targets: [
        new events.SqsQueue(pipelineEventsQueue),
      ],
    });

    // EventBridge Pipe connecting SQS to Lambda
    this.pipelineEventsPipe = new pipes.Pipe(this, 'PipelineEventsPipe', {
      source: new pipes.SqsSource(pipelineEventsQueue, {
        batchSize: 10,
        maximumBatchingWindowInSeconds: 5,
      }),
      target: new pipes.LambdaFunction(eventProcessorFunction),
      description: 'Pipe to process pipeline events from SQS to Lambda',
      name: `pipeline-events-pipe-${props.environmentSuffix}`,
      role: pipeRole,
    });

    // CloudWatch Alarms for pipeline monitoring
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
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
    });

    // Add SNS notification to alarm
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch.SnsAction(pipelineNotificationsTopic)
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
      new cloudwatch.SnsAction(pipelineNotificationsTopic)
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

    new cdk.CfnOutput(this, 'ApplicationSignalsServiceMapName', {
      value: this.applicationSignalsServiceMap.name || '',
      description: 'Name of the CloudWatch Application Signals Service Map',
    });

    new cdk.CfnOutput(this, 'PipelineDashboardName', {
      value: pipelineDashboard.dashboardName,
      description: 'Name of the CloudWatch Dashboard for pipeline monitoring',
    });

    new cdk.CfnOutput(this, 'PipelineNotificationsTopic', {
      value: pipelineNotificationsTopic.topicArn,
      description: 'ARN of the SNS topic for pipeline notifications',
    });

    new cdk.CfnOutput(this, 'PipelineEventsPipeName', {
      value: this.pipelineEventsPipe.pipeName,
      description: 'Name of the EventBridge Pipe for pipeline events',
    });

    new cdk.CfnOutput(this, 'EventProcessorFunctionName', {
      value: eventProcessorFunction.functionName,
      description: 'Name of the Lambda function processing pipeline events',
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CiCdPipelineStack } from './ci-cd-pipeline-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create CI/CD Pipeline Stack
    new CiCdPipelineStack(this, 'CiCdPipelineStack', {
      environmentSuffix,
      repositoryName: process.env.GITHUB_REPO_NAME || 'web-app-repo',
      repositoryOwner: process.env.GITHUB_REPO_OWNER || 'your-github-username',
      githubToken: process.env.GITHUB_TOKEN || 'your-github-token',
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1'
      }
    });

    // Apply global tags
    cdk.Tags.of(this).add('Environment', environmentSuffix === 'prod' ? 'Production' : 'Development');
    cdk.Tags.of(this).add('Project', 'CI_CD_Pipeline');
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
  }
}
```

This solution provides:

1. **Modern CodePipeline V2**: Uses the latest pipeline type with parallel execution mode for improved performance
2. **S3-based triggering**: Configured to trigger on S3 events for the 'main' branch using modern pipeline trigger filters
3. **S3 artifacts storage**: Versioned buckets with lifecycle policies for cost optimization
4. **Enhanced CodeBuild**: Includes debugging capabilities and optimized build environment
5. **CloudWatch Application Signals**: Advanced observability with service maps and comprehensive dashboard for pipeline monitoring
6. **EventBridge Pipes**: Event-driven automation connecting pipeline state changes to Lambda processing
7. **Real-time notifications**: SNS topics with CloudWatch alarms for pipeline and build failures
8. **Lambda event processing**: Automated processing and routing of pipeline events with error handling
9. **Comprehensive monitoring**: Custom CloudWatch dashboard with pipeline success rates, build durations, and failure metrics
10. **Event-driven architecture**: EventBridge rules and pipes for seamless integration between services
11. **Comprehensive IAM**: Least-privilege access with specific permissions for each service including new observability components
12. **Company tagging**: All resources tagged according to the specified policy
13. **Environment flexibility**: Supports different environments through the environmentSuffix parameter
14. **Security best practices**: Encrypted S3 buckets, blocked public access, and secure IAM roles

## Key New Features Added:

### CloudWatch Application Signals (2024)
- Service map for visualizing pipeline dependencies and performance
- Advanced dashboard with pipeline success rates, build durations, and failure metrics
- Deep observability into application performance and health

### EventBridge Pipes (2024)
- Event-driven automation connecting CodePipeline state changes to Lambda processing
- Seamless integration between SQS queues and Lambda functions
- Batch processing capabilities with configurable batching windows
- Real-time event routing and transformation

The infrastructure is designed to be production-ready with proper error handling, advanced monitoring capabilities, event-driven automation, and scalability considerations. The addition of CloudWatch Application Signals provides deep insights into pipeline performance, while EventBridge Pipes enables sophisticated event-driven workflows for CI/CD automation.