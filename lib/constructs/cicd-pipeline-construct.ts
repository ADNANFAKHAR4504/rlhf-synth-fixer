import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface CicdPipelineConstructProps {
  environmentSuffix: string;
  environment: string;
  projectName: string;
  crossAccountRoleArn?: string;
  notificationTopic: sns.ITopic;
  approvalTopic: sns.ITopic;
  tags: { [key: string]: string };
}

export class CicdPipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CicdPipelineConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      environment,
      projectName,
      crossAccountRoleArn,
      notificationTopic,
      approvalTopic,
      tags,
    } = props;

    // Create S3 bucket for artifacts with versioning
    this.artifactBucket = new s3.Bucket(
      this,
      `ArtifactBucket-${environmentSuffix}`,
      {
        bucketName: `${projectName}-artifacts-${environmentSuffix}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
      }
    );

    // Apply tags to bucket
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this.artifactBucket).add(key, value);
    });

    // Create CodeBuild project for building
    const buildProject = new codebuild.PipelineProject(
      this,
      `BuildProject-${environmentSuffix}`,
      {
        projectName: `${projectName}-build-${environmentSuffix}`,
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
              commands: ['echo Pre-build phase...', 'npm run lint || true'],
            },
            build: {
              commands: [
                'echo Build phase started...',
                'npm run build',
                'echo Build completed',
              ],
            },
          },
          artifacts: {
            files: ['**/*'],
          },
        }),
      }
    );

    // Create CodeBuild project for testing
    const testProject = new codebuild.PipelineProject(
      this,
      `TestProject-${environmentSuffix}`,
      {
        projectName: `${projectName}-test-${environmentSuffix}`,
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
              commands: ['echo Installing test dependencies...', 'npm ci'],
            },
            pre_build: {
              commands: ['echo Running pre-test setup...'],
            },
            build: {
              commands: [
                'echo Running unit tests...',
                'npm test',
                'echo Tests completed',
              ],
            },
          },
          reports: {
            TestReport: {
              files: ['test-results/**/*'],
              'file-format': 'JUNITXML',
            },
          },
        }),
      }
    );

    // Apply tags to CodeBuild projects
    [buildProject, testProject].forEach(project => {
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(project).add(key, value);
      });
    });

    // Create Lambda function for integration tests
    const integrationTestFunction = new lambda.Function(
      this,
      `IntegrationTestFunction-${environmentSuffix}`,
      {
        functionName: `${projectName}-integration-test-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { CodePipelineClient, PutJobSuccessResultCommand, PutJobFailureResultCommand } = require('@aws-sdk/client-codepipeline');

exports.handler = async (event) => {
  console.log('Integration test Lambda triggered', JSON.stringify(event));

  const codepipeline = new CodePipelineClient({});
  const jobId = event['CodePipeline.job'].id;

  try {
    // Simulate integration tests
    console.log('Running integration tests...');

    // Add your integration test logic here
    const testsPassed = true; // Simulated result

    if (testsPassed) {
      console.log('Integration tests passed');
      await codepipeline.send(new PutJobSuccessResultCommand({
        jobId: jobId
      }));
      return { status: 'success' };
    } else {
      throw new Error('Integration tests failed');
    }
  } catch (error) {
    console.error('Integration tests failed:', error);
    await codepipeline.send(new PutJobFailureResultCommand({
      jobId: jobId,
      failureDetails: {
        message: error.message,
        type: 'JobFailed'
      }
    }));
    throw error;
  }
};
      `),
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
      }
    );

    // Grant Lambda permissions to interact with CodePipeline
    integrationTestFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'codepipeline:PutJobSuccessResult',
          'codepipeline:PutJobFailureResult',
        ],
        resources: ['*'],
      })
    );

    // Apply tags to Lambda
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(integrationTestFunction).add(key, value);
    });

    // Create the pipeline
    this.pipeline = new codepipeline.Pipeline(
      this,
      `Pipeline-${environmentSuffix}`,
      {
        pipelineName: `${projectName}-${environment}-${environmentSuffix}`,
        artifactBucket: this.artifactBucket,
        restartExecutionOnUpdate: true,
      }
    );

    // Apply tags to pipeline
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this.pipeline).add(key, value);
    });

    // Define artifacts
    const sourceOutput = new codepipeline.Artifact('SourceArtifact');
    const buildOutput = new codepipeline.Artifact('BuildArtifact');

    // Create a source bucket for pipeline input (simulates GitHub repo)
    const sourceBucket = new s3.Bucket(
      this,
      `SourceBucket-${environmentSuffix}`,
      {
        bucketName: `${projectName}-source-${environmentSuffix}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Apply tags to source bucket
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(sourceBucket).add(key, value);
    });

    // Source stage - S3 (testable without external dependencies)
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'S3_Source',
      bucket: sourceBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
      trigger: codepipeline_actions.S3Trigger.NONE, // Manual trigger for testing
    });

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Test stage
    const testAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Unit_Tests',
      project: testProject,
      input: buildOutput,
    });

    this.pipeline.addStage({
      stageName: 'Test',
      actions: [testAction],
    });

    // Integration test stage with Lambda
    const integrationTestAction = new codepipeline_actions.LambdaInvokeAction({
      actionName: 'Integration_Tests',
      lambda: integrationTestFunction,
      userParameters: {
        environment: environment,
        projectName: projectName,
      },
    });

    this.pipeline.addStage({
      stageName: 'IntegrationTest',
      actions: [integrationTestAction],
    });

    // Manual approval stage (only for staging and prod)
    if (environment === 'staging' || environment === 'prod') {
      const approvalAction = new codepipeline_actions.ManualApprovalAction({
        actionName: 'Manual_Approval',
        notificationTopic: approvalTopic,
        additionalInformation: `Please review and approve deployment to ${environment}`,
        externalEntityLink: 'https://console.aws.amazon.com/codepipeline/home',
      });

      this.pipeline.addStage({
        stageName: 'Approval',
        actions: [approvalAction],
      });
    }

    // Deploy stage
    const deployActions: codepipeline_actions.Action[] = [];

    // If cross-account deployment is configured
    if (crossAccountRoleArn) {
      const crossAccountRole = iam.Role.fromRoleArn(
        this,
        'CrossAccountRole',
        crossAccountRoleArn
      );

      // Deploy action with cross-account role
      const deployAction = new codepipeline_actions.CodeBuildAction({
        actionName: 'Deploy',
        project: this.createDeployProject(
          environment,
          environmentSuffix,
          projectName,
          tags
        ),
        input: buildOutput,
        role: crossAccountRole,
      });

      deployActions.push(deployAction);
    } else {
      // Standard deploy action
      const deployAction = new codepipeline_actions.CodeBuildAction({
        actionName: 'Deploy',
        project: this.createDeployProject(
          environment,
          environmentSuffix,
          projectName,
          tags
        ),
        input: buildOutput,
      });

      deployActions.push(deployAction);
    }

    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: deployActions,
    });

    // Setup pipeline notifications using EventBridge
    this.setupPipelineNotifications(notificationTopic);
  }

  private createDeployProject(
    environment: string,
    environmentSuffix: string,
    projectName: string,
    tags: { [key: string]: string }
  ): codebuild.PipelineProject {
    const deployProject = new codebuild.PipelineProject(
      this,
      `DeployProject-${environmentSuffix}`,
      {
        projectName: `${projectName}-deploy-${environmentSuffix}`,
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
            },
            build: {
              commands: [
                `echo Deploying to ${environment} environment...`,
                'echo Deployment completed successfully',
              ],
            },
          },
        }),
      }
    );

    // Apply tags
    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(deployProject).add(key, value);
    });

    return deployProject;
  }

  private setupPipelineNotifications(notificationTopic: sns.ITopic) {
    // Create EventBridge rule for pipeline state changes
    const rule = new cdk.aws_events.Rule(this, 'PipelineStateChangeRule', {
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [this.pipeline.pipelineName],
        },
      },
    });

    // Add SNS topic as target
    rule.addTarget(new cdk.aws_events_targets.SnsTopic(notificationTopic));
  }
}
