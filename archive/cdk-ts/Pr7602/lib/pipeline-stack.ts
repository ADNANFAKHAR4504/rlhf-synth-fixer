import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface PipelineStackProps {
  environmentSuffix: string;
  ecsCluster: ecs.Cluster;
  ecsService: ecs.FargateService;
}

export class PipelineStack extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly repository: codecommit.Repository;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id);

    // Create CodeCommit repository
    this.repository = new codecommit.Repository(this, 'HealthcareRepo', {
      repositoryName: `healthcare-app-${props.environmentSuffix}`,
      description: 'Healthcare application source code repository',
    });

    // Create S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `healthcare-artifacts-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create CodeBuild project for building Docker images
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `healthcare-build-${props.environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Required for Docker builds
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/healthcare-app',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $REPOSITORY_URI:latest .',
              'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker images...',
              'docker push $REPOSITORY_URI:latest',
              'docker push $REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing image definitions file...',
              'printf \'[{"name":"healthcare-app-%s","imageUri":"%s"}]\' "$ENVIRONMENT_SUFFIX" "$REPOSITORY_URI:$IMAGE_TAG" > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
      environmentVariables: {
        AWS_DEFAULT_REGION: {
          value: cdk.Stack.of(this).region,
        },
        AWS_ACCOUNT_ID: {
          value: cdk.Stack.of(this).account,
        },
        ENVIRONMENT_SUFFIX: {
          value: props.environmentSuffix,
        },
      },
    });

    // Grant ECR permissions to CodeBuild
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
        ],
        resources: ['*'],
      })
    );

    // Create artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'HealthcarePipeline', {
      pipelineName: `healthcare-pipeline-${props.environmentSuffix}`,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Add source stage
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit',
          repository: this.repository,
          branch: 'main',
          output: sourceOutput,
          trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
        }),
      ],
    });

    // Add build stage
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'DockerBuild',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Add deploy stage
    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'DeployToEcs',
          service: props.ecsService,
          input: buildOutput,
        }),
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      exportName: `healthcare-pipeline-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: this.repository.repositoryCloneUrlHttp,
      exportName: `healthcare-repo-url-${props.environmentSuffix}`,
    });
  }
}
