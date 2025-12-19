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
    // Note: Account-level Block Public Access prevents public buckets
    // Using private bucket to demonstrate CI/CD pipeline deployment
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `nodejs-webapp-site-${environmentSuffix}`,
      versioned: true,
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

    // Output the website bucket name
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'Name of the deployment bucket',
      exportName: `WebsiteBucketName-${environmentSuffix}`,
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
