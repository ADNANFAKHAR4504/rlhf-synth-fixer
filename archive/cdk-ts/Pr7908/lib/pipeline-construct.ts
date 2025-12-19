import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, SecretValue, Duration, Stack } from 'aws-cdk-lib';

export interface PipelineConstructProps {
  environmentSuffix: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  ecrRepository: ecr.Repository;
  ecsService: ecs.FargateService;
  ecsCluster: ecs.Cluster;
}

export class PipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly buildProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: PipelineConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      githubOwner,
      githubRepo,
      githubBranch,
      ecrRepository,
      ecsService,
    } = props;

    // Get AWS account and region from the stack
    const stack = Stack.of(this);
    const region = stack.region;
    const account = stack.account;

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `cicd-artifacts-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CodeBuild project for Docker builds
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `cicd-build-${environmentSuffix}`,
      description: 'Build Docker images for containerized application',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: ecrRepository.repositoryUri,
          },
          AWS_ACCOUNT_ID: {
            value: account,
          },
          AWS_DEFAULT_REGION: {
            value: region,
          },
          ENVIRONMENT_SUFFIX: {
            value: environmentSuffix,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $ECR_REPOSITORY_URI:latest .',
              'docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker images...',
              'docker push $ECR_REPOSITORY_URI:latest',
              'docker push $ECR_REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing image definitions file...',
              'printf \'[{"name":"cicd-app-container-' +
                environmentSuffix +
                '","imageUri":"%s"}]\' $ECR_REPOSITORY_URI:latest > imagedefinitions.json',
              'cat imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
        cache: {
          paths: ['/root/.docker/**/*'],
        },
      }),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
    });

    // Grant ECR permissions to CodeBuild
    ecrRepository.grantPullPush(this.buildProject);

    // Pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `cicd-pipeline-${environmentSuffix}`,
      artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: githubOwner,
      repo: githubRepo,
      branch: githubBranch,
      oauthToken: SecretValue.secretsManager('github-token'),
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
    });

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build_Docker_Image',
      project: this.buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Deploy stage
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy_to_ECS',
      service: ecsService,
      input: buildOutput,
      deploymentTimeout: Duration.minutes(30),
    });

    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });
  }
}
