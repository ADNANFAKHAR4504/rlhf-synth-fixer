import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface PipelineStackProps extends cdk.StackProps {
  sourceS3Bucket: s3.IBucket;
  sourceS3Key: string;
  environmentSuffix: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const envSuffix = props.environmentSuffix;

    // Create artifact stores
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');

    // Create CodeBuild project for building
    const buildProject = new codebuild.PipelineProject(
      this,
      'TapBuildProject',
      {
        projectName: `tap-build-${envSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.MEDIUM,
          privileged: true,
        },
        environmentVariables: {
          AWS_ACCOUNT_ID: {
            value: cdk.Aws.ACCOUNT_ID,
          },
          AWS_DEFAULT_REGION: {
            value: cdk.Aws.REGION,
          },
        },
        cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE),
      }
    );

    // Create CodeBuild project for testing
    const testProject = new codebuild.PipelineProject(this, 'TapTestProject', {
      projectName: `tap-test-${envSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 18,
            },
            commands: ['npm ci'],
          },
          build: {
            commands: [
              'npm run test',
              'npm run test:security', // Security compliance tests
              'npm run test:integration', // Integration tests
            ],
          },
        },
        reports: {
          'test-reports': {
            files: ['test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }),
    });

    // Create deployment role for cross-region deployment
    const deployRole = new iam.Role(this, 'TapDeployRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        DeployPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: ['arn:aws:iam::*:role/cdk-*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudformation:*',
                'lambda:*',
                'codedeploy:*',
                's3:*',
                'iam:*',
                'sqs:*',
                'secretsmanager:*',
                'cloudwatch:*',
                'sns:*',
                'logs:*',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create CodeBuild project for deployment
    const deployProject = new codebuild.PipelineProject(
      this,
      'TapDeployProject',
      {
        projectName: `tap-deploy-${envSuffix}`,
        role: deployRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.MEDIUM,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: 18,
              },
              commands: ['npm install -g aws-cdk@latest', 'npm ci'],
            },
            build: {
              commands: [
                'npm run build',
                'npm run cdk -- synth',
                'npm run cdk -- deploy TapStack --require-approval never',
              ],
            },
          },
        }),
      }
    );

    // Create Pipeline
    const pipeline = new codepipeline.Pipeline(this, 'TapPipeline', {
      pipelineName: `tap-cicd-pipeline-${envSuffix}`,
      restartExecutionOnUpdate: true,
      crossAccountKeys: true, // Enable cross-account deployment
    });

    // Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3Source',
          bucket: props.sourceS3Bucket,
          bucketKey: props.sourceS3Key,
          output: sourceOutput,
          trigger: codepipeline_actions.S3Trigger.EVENTS, // Trigger on S3 events
        }),
      ],
    });

    // Build Stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAction',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Test Stage
    pipeline.addStage({
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'TestAction',
          project: testProject,
          input: buildOutput,
          outputs: [testOutput],
        }),
      ],
    });

    // Deploy Stage (Multi-region deployment can be added here)
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'DeployAction',
          project: deployProject,
          input: testOutput,
          runOrder: 1,
        }),
      ],
    });

    // Output pipeline ARN
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'ARN of the CI/CD pipeline',
    });
  }
}
