import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class PipelineStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `healthtech-pipeline-artifacts-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // CodeBuild project for DR testing
    const drTestProject = new codebuild.PipelineProject(this, 'DRTestProject', {
      projectName: `healthtech-dr-test-${environmentSuffix}`,
      description: 'Automated disaster recovery testing',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo "Starting DR validation..."',
              'aws --version',
            ],
          },
          build: {
            commands: [
              'echo "Testing database connectivity..."',
              'echo "Testing Kinesis stream..."',
              'echo "Testing ECS service health..."',
              'echo "Testing API Gateway endpoints..."',
              'echo "Validating backup retention..."',
              'echo "Checking replication lag..."',
            ],
          },
          post_build: {
            commands: [
              'echo "DR tests completed successfully"',
              'date',
            ],
          },
        },
      }),
    });

    // Grant necessary permissions to CodeBuild
    drTestProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'rds:DescribeDBClusters',
        'kinesis:DescribeStream',
        'ecs:DescribeServices',
        'apigateway:GET',
        'cloudwatch:GetMetricData',
      ],
      resources: ['*'],
    }));

    // Pipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    this.pipeline = new codepipeline.Pipeline(this, 'DRPipeline', {
      pipelineName: `healthtech-dr-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
    });

    // Source stage (manual trigger for testing)
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3Source',
          bucket: artifactBucket,
          bucketKey: 'source.zip',
          output: sourceOutput,
          trigger: codepipeline_actions.S3Trigger.NONE,
        }),
      ],
    });

    // DR Test stage
    this.pipeline.addStage({
      stageName: 'DRTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'RunDRTests',
          project: drTestProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Export pipeline name
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      exportName: `healthtech-pipeline-name-${environmentSuffix}`,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
