# IDEAL RESPONSE: CI/CD Pipeline for Node.js Application

This is the ideal, production-ready implementation of a complete CI/CD pipeline using AWS CDK with TypeScript.

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

    // Create CodeCommit repository for source control
    const repository = new codecommit.Repository(this, 'NodejsWebappRepo', {
      repositoryName: `nodejs-webapp-${environmentSuffix}`,
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

    // Create S3 bucket for build cache
    const cacheBucket = new s3.Bucket(this, 'BuildCacheBucket', {
      bucketName: `codebuild-cache-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

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
      cache: codebuild.Cache.bucket(cacheBucket, {
        prefix: 'codebuild-cache',
      }),
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

    // Add Source stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: repository,
          branch: 'main',
          output: sourceOutput,
          trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
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

## Implementation Details

### AWS Services Used

1. **AWS CodeCommit**: Source repository with automatic triggering on main branch commits
2. **AWS S3**: Two buckets - one for static website hosting, one for build cache
3. **AWS CodeBuild**: Build automation with Node.js 18, build caching, and environment variables
4. **AWS CodePipeline**: Three-stage pipeline (Source, Build, Deploy)
5. **AWS IAM**: Automatic role creation with least privilege permissions via CDK grants

### Key Features

1. **Automatic Triggering**: Pipeline triggers on commits to main branch via CodeCommit events
2. **Build Caching**: Separate S3 bucket for CodeBuild cache to speed up builds
3. **Environment Variables**: NODE_ENV=production configured in build environment
4. **Static Website**: S3 bucket with website hosting enabled and public read access
5. **Resource Naming**: All resources include environmentSuffix for unique identification
6. **Destroyability**: All resources use RemovalPolicy.DESTROY and autoDeleteObjects
7. **IAM Permissions**: Proper grants for CodeBuild to access repository and S3

### Build Process

The CodeBuild project executes:
1. `npm install` - Install dependencies
2. `npm test` - Run tests
3. `npm run build` - Build the application

Build artifacts from the `build` directory are deployed to S3.

### Outputs

- **WebsiteURL**: Public URL of the static website
- **PipelineARN**: ARN of the CodePipeline for reference
- **RepositoryCloneURL**: HTTP URL to clone the repository

### Security Considerations

- IAM roles automatically created by CDK with least privilege
- Build cache bucket is private (not public)
- Website bucket allows public read for static hosting
- All permissions granted using CDK's grant methods

### Compliance

- All resources include environmentSuffix parameter
- No RemovalPolicy.RETAIN or deletion protection
- Ready for automated deployment via CI/CD
- Compatible with GitHub Actions workflow in lib/ci-cd.yml