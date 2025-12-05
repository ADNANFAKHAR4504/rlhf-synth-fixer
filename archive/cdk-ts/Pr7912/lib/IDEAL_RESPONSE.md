# CI/CD Pipeline Implementation - Ideal Response

This document contains the corrected and production-ready implementation for the CI/CD pipeline infrastructure.

## Architecture Overview

This implementation creates a complete CI/CD pipeline with:
- S3 bucket for pipeline artifacts (versioning enabled)
- CodeCommit repository integration
- CodeBuild projects for testing, staging, and production deployments
- CodePipeline orchestrating the workflow
- Manual approval action between staging and production
- CloudWatch Events for failure notifications
- IAM roles with least-privilege permissions
- CloudWatch Logs with 7-day retention

All requirements from PROMPT.md are satisfied.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `pipeline-artifacts-${environmentSuffix}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // CodeCommit Repository
    const repository = new codecommit.Repository(this, 'Repository', {
      repositoryName: `app-repo-${environmentSuffix}`,
      description: 'Node.js application repository',
    });

    // CloudWatch Log Groups for CodeBuild projects
    const testLogGroup = new logs.LogGroup(this, 'TestLogGroup', {
      logGroupName: `/aws/codebuild/test-project-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stagingLogGroup = new logs.LogGroup(this, 'StagingLogGroup', {
      logGroupName: `/aws/codebuild/staging-deploy-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const productionLogGroup = new logs.LogGroup(this, 'ProductionLogGroup', {
      logGroupName: `/aws/codebuild/production-deploy-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CodeBuild Project for Testing
    const testProject = new codebuild.Project(this, 'TestProject', {
      projectName: `test-project-${environmentSuffix}`,
      description: 'Run unit tests for Node.js application',
      source: codebuild.Source.codeCommit({ repository }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: ['npm install'],
          },
          build: {
            commands: ['npm test'],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: testLogGroup,
        },
      },
    });

    // CodeBuild Project for Staging Deployment
    const stagingProject = new codebuild.Project(this, 'StagingProject', {
      projectName: `staging-deploy-${environmentSuffix}`,
      description: 'Deploy to staging environment',
      source: codebuild.Source.codeCommit({ repository }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ENVIRONMENT: { value: 'staging' },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: ['npm install'],
          },
          build: {
            commands: ['npm run deploy:staging'],
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: stagingLogGroup,
        },
      },
    });

    // CodeBuild Project for Production Deployment
    const productionProject = new codebuild.Project(this, 'ProductionProject', {
      projectName: `production-deploy-${environmentSuffix}`,
      description: 'Deploy to production environment',
      source: codebuild.Source.codeCommit({ repository }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ENVIRONMENT: { value: 'production' },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: ['npm install'],
          },
          build: {
            commands: ['npm run deploy:production'],
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: productionLogGroup,
        },
      },
    });

    // SNS Topic for Pipeline Notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'CI/CD Pipeline Notifications',
    });

    // Define Pipeline Artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `app-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: repository,
          branch: 'main',
          output: sourceOutput,
          trigger: codepipeline_actions.CodeCommitTrigger.POLL,
        }),
      ],
    });

    // Build/Test Stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Run_Unit_Tests',
          project: testProject,
          input: sourceOutput,
          outputs: [testOutput],
        }),
      ],
    });

    // Staging Deploy Stage
    pipeline.addStage({
      stageName: 'Deploy_Staging',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Deploy_to_Staging',
          project: stagingProject,
          input: testOutput,
        }),
      ],
    });

    // Manual Approval Stage
    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Manual_Approval',
          notificationTopic: notificationTopic,
          additionalInformation: 'Please review staging deployment before promoting to production',
        }),
      ],
    });

    // Production Deploy Stage
    pipeline.addStage({
      stageName: 'Deploy_Production',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Deploy_to_Production',
          project: productionProject,
          input: testOutput,
        }),
      ],
    });

    // CloudWatch Events Rule for Pipeline Failures
    const failureRule = new events.Rule(this, 'PipelineFailureRule', {
      ruleName: `pipeline-failure-${environmentSuffix}`,
      description: 'Notify on pipeline failures',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['FAILED'],
          pipeline: [pipeline.pipelineName],
        },
      },
    });

    failureRule.addTarget(new events_targets.SnsTopic(notificationTopic));

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repository.repositoryCloneUrlHttp,
      description: 'CodeCommit repository clone URL (HTTP)',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic for pipeline notifications',
    });
  }
}
```

## Requirements Validation

### Requirement 1: S3 Bucket for Artifacts with Versioning
✓ Created with `versioned: true`
✓ Named `pipeline-artifacts-${environmentSuffix}`
✓ Fully destroyable with `autoDeleteObjects: true`

### Requirement 2: CodeBuild Project for Unit Tests with Node.js 18
✓ Project `test-project-${environmentSuffix}` created
✓ Node.js 18 runtime configured
✓ Runs `npm test` command

### Requirement 3: CodePipeline with Source, Build, and Deploy Stages
✓ Pipeline created with 5 stages: Source → Build → Deploy_Staging → Approval → Deploy_Production
✓ Named `app-pipeline-${environmentSuffix}`

### Requirement 4: Trigger on Main Branch Changes
✓ CodeCommit source action configured with `branch: 'main'`
✓ Trigger set to `POLL`

### Requirement 5: Manual Approval Between Staging and Production
✓ ManualApprovalAction added between Deploy_Staging and Deploy_Production stages
✓ Sends notifications to SNS topic

### Requirement 6: Separate CodeBuild Projects for Staging and Production
✓ `staging-deploy-${environmentSuffix}` project created
✓ `production-deploy-${environmentSuffix}` project created
✓ Each with appropriate environment variables

### Requirement 7: CloudWatch Events for Pipeline Failures
✓ EventBridge rule created to detect FAILED pipeline state
✓ Notifications sent to SNS topic

### Requirement 8: IAM Roles with Least-Privilege Permissions
✓ CDK automatically creates appropriate IAM roles
✓ Each service (CodePipeline, CodeBuild) gets minimal required permissions

### Requirement 9: Pipeline Parameters for Customization
✓ Environment variables in CodeBuild projects
✓ Configurable through buildSpec
✓ environmentSuffix parameter for resource naming

### Requirement 10: CloudWatch Logs with 7-Day Retention
✓ Log groups created for all 3 CodeBuild projects
✓ Retention set to `logs.RetentionDays.ONE_WEEK` (7 days)
✓ Log groups are destroyable with `removalPolicy: DESTROY`

## Additional Best Practices Implemented

1. **Encryption**: S3 bucket uses S3-managed encryption
2. **Outputs**: Key resource identifiers exported for reference
3. **Descriptions**: All resources include descriptive names
4. **Environment Suffix**: All resources include suffix for parallel deployments
5. **Resource Naming**: Consistent naming pattern across all resources
