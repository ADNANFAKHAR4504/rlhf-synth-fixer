import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface PipelineStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environmentName: string;
  repositoryName: string;
  notificationTopic: sns.ITopic;
}

export class PipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      environmentName,
      repositoryName,
      notificationTopic,
    } = props;

    // CodeCommit repository
    const repository = codecommit.Repository.fromRepositoryName(
      this,
      'Repository',
      repositoryName
    );

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(
      this,
      `PipelineArtifacts-${environmentSuffix}`,
      {
        bucketName: `pipeline-artifacts-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // CodeBuild project for CDK synth
    const buildProject = new codebuild.PipelineProject(
      this,
      `BuildProject-${environmentSuffix}`,
      {
        projectName: `migration-build-${environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          privileged: true,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: ['npm install -g aws-cdk', 'npm ci'],
            },
            build: {
              commands: ['npm run build', 'npm run test', 'cdk synth'],
            },
          },
          artifacts: {
            'base-directory': 'cdk.out',
            files: '**/*',
          },
        }),
      }
    );

    // Pipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    this.pipeline = new codepipeline.Pipeline(
      this,
      `Pipeline-${environmentSuffix}`,
      {
        pipelineName: `migration-pipeline-${environmentSuffix}`,
        artifactBucket: artifactBucket,
        restartExecutionOnUpdate: true,
      }
    );

    // Source stage
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit',
          repository: repository,
          branch: environmentName === 'prod' ? 'main' : environmentName,
          output: sourceOutput,
        }),
      ],
    });

    // Build stage
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'CDK_Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Manual approval for production
    if (environmentName === 'prod') {
      this.pipeline.addStage({
        stageName: 'Approval',
        actions: [
          new codepipeline_actions.ManualApprovalAction({
            actionName: 'ManualApproval',
            additionalInformation:
              'Please review changes before deploying to production',
            notificationTopic: notificationTopic,
          }),
        ],
      });
    }

    // Deploy stage
    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'Deploy_Infrastructure',
          stackName: `MigrationStack-${environmentSuffix}`,
          templatePath: buildOutput.atPath('MigrationStack.template.json'),
          adminPermissions: true,
          parameterOverrides: {
            EnvironmentSuffix: environmentSuffix,
          },
        }),
      ],
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CodePipeline Name',
      exportName: `PipelineName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'CodePipeline ARN',
    });
  }
}
