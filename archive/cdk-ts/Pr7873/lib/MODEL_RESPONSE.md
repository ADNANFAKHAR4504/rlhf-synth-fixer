# MODEL RESPONSE: CI/CD Pipeline for Node.js Application (With Training Issues)

This implementation has 3 intentional issues for training purposes. See MODEL_FAILURES.md for details.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

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

    // ISSUE 1: Missing environmentSuffix in repository name
    // Create CodeCommit repository for source control
    const repository = new codecommit.Repository(this, 'NodejsWebappRepo', {
      repositoryName: 'nodejs-webapp',  // Should include environmentSuffix
      description: 'Node.js web application source repository',
    });

    // Create S3 bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `nodejs-webapp-site-${environmentSuffix}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ISSUE 2: Missing build cache bucket
    // Build cache is a requirement but not implemented

    // Create CodeBuild project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `nodejs-webapp-build-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // Node.js 18
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          NODE_ENV: {
            value: 'production',
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
          },
        },
      },
      // ISSUE 2 (continued): No cache configuration
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm install'],
          },
          pre_build: {
            commands: ['npm test'],
          },
          build: {
            commands: ['npm run build'],
          },
        },
        artifacts: {
          files: ['**/*'],
          'base-directory': 'build',
        },
      }),
    });

    // Grant CodeBuild access to the repository
    repository.grantRead(buildProject);

    // Grant CodeBuild access to deploy to S3
    websiteBucket.grantReadWrite(buildProject);

    // Create artifact buckets for pipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `nodejs-webapp-pipeline-${environmentSuffix}`,
      restartExecutionOnUpdate: true,
    });

    // ISSUE 3: Wrong trigger type - using POLL instead of EVENTS
    // Add Source stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: repository,
          branch: 'main',
          output: sourceOutput,
          trigger: codepipeline_actions.CodeCommitTrigger.POLL,  // Should be EVENTS
        }),
      ],
    });

    // Add Build stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'CodeBuild',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Add Deploy stage
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.S3DeployAction({
          actionName: 'S3_Deploy',
          input: buildOutput,
          bucket: websiteBucket,
          extract: true,
        }),
      ],
    });

    // Output the website URL
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'URL of the static website',
      exportName: `WebsiteURL-${environmentSuffix}`,
    });

    // Output the pipeline ARN
    new cdk.CfnOutput(this, 'PipelineARN', {
      value: pipeline.pipelineArn,
      description: 'ARN of the CodePipeline',
      exportName: `PipelineARN-${environmentSuffix}`,
    });

    // Output the repository clone URL
    new cdk.CfnOutput(this, 'RepositoryCloneURL', {
      value: repository.repositoryCloneUrlHttp,
      description: 'HTTP clone URL for the CodeCommit repository',
      exportName: `RepositoryCloneURL-${environmentSuffix}`,
    });
  }
}
```

## Intentional Issues Summary

This implementation contains 3 realistic issues that developers commonly make:

1. **Missing environmentSuffix in Repository Name**: The CodeCommit repository name is hardcoded as 'nodejs-webapp' instead of including the environmentSuffix. This violates the requirement that all resources must include environmentSuffix for uniqueness.

2. **Missing Build Cache Configuration**: The task explicitly requires build caching to be enabled, but this implementation doesn't create a cache bucket or configure caching in CodeBuild. This is a common oversight when developers focus on the main functionality and miss optimization requirements.

3. **Wrong Pipeline Trigger Type**: The CodeCommitSourceAction uses `CodeCommitTrigger.POLL` instead of `CodeCommitTrigger.EVENTS`. While both work, POLL checks for changes periodically instead of triggering immediately on commits, which doesn't meet the "automatic triggering on commits" requirement.

These are realistic issues that:
- Would pass CDK synthesis
- Would deploy successfully
- Would partially work but not meet all requirements
- Represent common developer mistakes (forgetting suffixes, missing optimizations, using suboptimal settings)

See MODEL_FAILURES.md for detailed descriptions of how to detect and fix these issues.