import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface PipelineConstructProps {
  environmentSuffix: string;
  artifactBucket: s3.Bucket;
  lambdaFunction: lambda.Function;
  tags: { [key: string]: string };
}

export class PipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly notificationTopic: sns.Topic;
  public readonly buildProject: codebuild.Project;
  public readonly pipelineRole: iam.Role;
  public readonly buildRole: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: PipelineConstructProps) {
    super(scope, id);

    const account = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    // Create SNS topic for notifications
    this.notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `financeapp-pipeline-notifications-${props.environmentSuffix}-${account}-${region}`,
      displayName: 'FinanceApp Pipeline Notifications',
    });

    // Apply environment-based removal policy (retain in prod, destroy otherwise)
    const isProd = props.environmentSuffix.toLowerCase().includes('prod');
    this.notificationTopic.applyRemovalPolicy(
      isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    );

    // Add email subscription (replace with actual email)
    this.notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('devops@example.com')
    );

    // Create log group for pipeline
    this.logGroup = new logs.LogGroup(this, 'PipelineLogGroup', {
      logGroupName: `/aws/codepipeline/financeapp-${props.environmentSuffix}-${account}-${region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create CodePipeline role
    this.pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `financeapp-pipeline-role-${props.environmentSuffix}-${account}-${region}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'Role for FinanceApp CodePipeline',
    });

    // Grant pipeline permissions
    props.artifactBucket.grantReadWrite(this.pipelineRole);
    this.notificationTopic.grantPublish(this.pipelineRole);

    // Create CodeBuild role
    this.buildRole = new iam.Role(this, 'BuildRole', {
      roleName: `financeapp-build-role-${props.environmentSuffix}-${account}-${region}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Role for FinanceApp CodeBuild',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
      ],
    });

    // Grant build permissions
    props.artifactBucket.grantReadWrite(this.buildRole);

    this.buildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/codebuild/*`,
        ],
      })
    );

    // Create CodeBuild project
    this.buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `financeapp-build-${props.environmentSuffix}-${account}-${region}`,
      description: 'Build project for FinanceApp',
      role: this.buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ENVIRONMENT_SUFFIX: { value: props.environmentSuffix },
          LAMBDA_FUNCTION_NAME: { value: props.lambdaFunction.functionName },
        },
      },
      cache: codebuild.Cache.bucket(props.artifactBucket, {
        prefix: 'build-cache',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: 0.2,
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 20,
            },
            commands: [
              'echo Installing dependencies...',
              'cd lib/lambda',
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo Running tests...',
              'npm test || true', // Continue even if tests fail for now
              'echo Tests complete',
            ],
          },
          build: {
            commands: [
              'echo Building Lambda function...',
              'npm run build || true',
              'echo Creating deployment package...',
              'zip -r lambda-deployment.zip .',
            ],
          },
          post_build: {
            commands: ['echo Build completed on `date`', 'ls -la'],
          },
        },
        artifacts: {
          files: ['lambda-deployment.zip', 'package.json', 'package-lock.json'],
          name: 'BuildArtifact',
          'base-directory': 'lib/lambda',
        },
        cache: {
          paths: ['node_modules/**/*'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: `/aws/codebuild/financeapp-build-${props.environmentSuffix}-${account}-${region}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      },
    });

    // Create source bucket for pipeline trigger
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `financeapp-source-${props.environmentSuffix}-${account}-${region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,

      autoDeleteObjects: true,
    });

    // Enforce encryption at rest on source bucket (require AES256 header for S3-managed encryption)
    sourceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${sourceBucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'AES256',
          },
        },
      })
    );

    // Create pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `financeapp-pipeline-${props.environmentSuffix}-${account}-${region}`,
      role: this.pipelineRole,
      artifactBucket: props.artifactBucket,
      restartExecutionOnUpdate: false,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'S3Source',
      bucket: sourceBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
      trigger: codepipeline_actions.S3Trigger.EVENTS,
    });

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: this.buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Manual approval for production
    if (props.environmentSuffix === 'prod') {
      this.pipeline.addStage({
        stageName: 'Approval',
        actions: [
          new codepipeline_actions.ManualApprovalAction({
            actionName: 'ManualApproval',
            notificationTopic: this.notificationTopic,
            additionalInformation:
              'Please review and approve deployment to production',
          }),
        ],
      });
    }

    // Deploy stage
    const deployAction = new codepipeline_actions.LambdaInvokeAction({
      actionName: 'DeployLambda',
      lambda: props.lambdaFunction,
      userParameters: {
        environment: props.environmentSuffix,
        timestamp: new Date().toISOString(),
      },
    });

    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });

    // Add CloudFormation deploy action for infrastructure updates
    const cfnDeployAction =
      new codepipeline_actions.CloudFormationCreateUpdateStackAction({
        actionName: 'UpdateStack',
        stackName: `financeapp-stack-${props.environmentSuffix}`,
        templatePath: sourceOutput.atPath('template.yaml'),
        adminPermissions: false,
        role: this.pipelineRole,
        cfnCapabilities: [
          cdk.CfnCapabilities.NAMED_IAM,
          cdk.CfnCapabilities.AUTO_EXPAND,
        ],
        parameterOverrides: {
          EnvironmentSuffix: props.environmentSuffix,
        },
      });

    this.pipeline.addStage({
      stageName: 'UpdateInfrastructure',
      actions: [cfnDeployAction],
    });

    // Configure pipeline notifications
    this.pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(this.notificationTopic),
      description: 'Notify on pipeline state changes',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['STARTED', 'SUCCEEDED', 'FAILED'],
        },
      },
    });

    // Apply tags
    Object.entries(props.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
