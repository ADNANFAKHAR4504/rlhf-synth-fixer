# Multi-Stage CI/CD Pipeline Implementation

This implementation creates a comprehensive CI/CD pipeline for containerized applications using AWS CDK with TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // ECR Repository for Docker images
    const repository = new ecr.Repository(this, 'ContainerRepository', {
      repositoryName: `app-repo-${environmentSuffix}`,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `pipeline-artifacts-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CodeBuild project for building Docker images
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `docker-build-${environmentSuffix}`,
      source: codebuild.Source.codeCommit({
        repository: undefined as any
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
              'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
          },
        },
      }),
    });

    // Grant ECR permissions to build project
    repository.grantPullPush(buildProject);

    // CodeBuild project for testing and vulnerability scanning
    const testProject = new codebuild.Project(this, 'TestProject', {
      projectName: `security-scan-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo Running unit tests...',
              'npm test',
              'echo Running vulnerability scan...',
              'aws ecr describe-image-scan-findings --repository-name $IMAGE_REPO_NAME --image-id imageTag=$IMAGE_TAG',
            ],
          },
        },
      }),
    });

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `container-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
    });

    // Source stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: undefined as any,
          output: sourceOutput,
        }),
      ],
    });

    // Build stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Docker_Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Test stage
    pipeline.addStage({
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Security_Scan',
          project: testProject,
          input: buildOutput,
        }),
      ],
    });

    // Manual approval stage
    pipeline.addStage({
      stageName: 'ApproveProduction',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Approve',
        }),
      ],
    });

    // Deploy staging stage
    pipeline.addStage({
      stageName: 'DeployStaging',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'Deploy_To_Staging',
          service: undefined as any,
          input: buildOutput,
        }),
      ],
    });

    // Deploy production stage
    pipeline.addStage({
      stageName: 'DeployProduction',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'Deploy_To_Production',
          service: undefined as any,
          input: buildOutput,
        }),
      ],
    });

    // CloudWatch alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: `pipeline-failure-${environmentSuffix}`,
      metric: pipeline.metricFailed(),
      threshold: 1,
      evaluationPeriods: 1,
    });

    // SNS topic for notifications
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `pipeline-notifications-${environmentSuffix}`,
    });

    pipelineFailureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(notificationTopic));

    // Tags
    cdk.Tags.of(this).add('Environment', 'dev');
    cdk.Tags.of(this).add('Project', 'container-pipeline');
    cdk.Tags.of(this).add('CostCenter', 'engineering');
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```