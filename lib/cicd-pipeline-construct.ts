import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface CicdPipelineConstructProps {
  environmentSuffix: string;
}

export class CicdPipelineConstruct extends Construct {
  public readonly repository: codecommit.Repository;
  public readonly buildProject: codebuild.Project;
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: CicdPipelineConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create CodeCommit repository
    this.repository = new codecommit.Repository(this, 'Repository', {
      repositoryName: `nodejs-app-${environmentSuffix}`,
      description: 'Node.js application source code repository',
    });

    // Create S3 bucket for build artifacts with versioning
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `build-artifacts-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create CloudWatch Log Group for build logs
    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/aws/codebuild/nodejs-build-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for CodeBuild with least-privilege permissions
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild with least-privilege permissions',
    });

    // Grant CodeBuild permissions to write logs
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [buildLogGroup.logGroupArn],
      })
    );

    // Grant CodeBuild permissions to access artifacts bucket
    this.artifactsBucket.grantReadWrite(codeBuildRole);

    // Grant CodeBuild permissions to access CodeCommit repository
    this.repository.grantPullPush(codeBuildRole);

    // Create CodeBuild project
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `nodejs-build-${environmentSuffix}`,
      description: 'Build project for Node.js application',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // Node.js 18 runtime
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          NODE_ENV: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: 'production',
          },
          ARTIFACTS_BUCKET: {
            type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            value: this.artifactsBucket.bucketName,
          },
        },
      },
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['echo Installing dependencies...', 'npm install'],
          },
          pre_build: {
            commands: ['echo Running tests...', 'npm test'],
          },
          build: {
            commands: ['echo Building application...', 'npm run build'],
          },
          post_build: {
            commands: [
              'echo Build completed successfully',
              'echo Uploading artifacts to S3...',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
          name: 'build-artifacts',
        },
      }),
    });

    // Create IAM role for CodePipeline with least-privilege permissions
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `codepipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline with least-privilege permissions',
    });

    // Grant pipeline permissions to access artifacts bucket
    this.artifactsBucket.grantReadWrite(pipelineRole);

    // Grant pipeline permissions to access CodeCommit repository
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codecommit:GetBranch',
          'codecommit:GetCommit',
          'codecommit:UploadArchive',
          'codecommit:GetUploadArchiveStatus',
          'codecommit:CancelUploadArchive',
        ],
        resources: [this.repository.repositoryArn],
      })
    );

    // Grant pipeline permissions to trigger CodeBuild
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:BatchGetBuilds',
          'codebuild:StartBuild',
          'codebuild:StopBuild',
        ],
        resources: [this.buildProject.projectArn],
      })
    );

    // Define pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create CodePipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `nodejs-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: this.artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        // Source Stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit-Source',
              repository: this.repository,
              branch: 'main',
              output: sourceOutput,
              trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
            }),
          ],
        },
        // Build Stage
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build-And-Test',
              project: this.buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        // Deploy Stage (placeholder)
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.S3DeployAction({
              actionName: 'Deploy-To-S3',
              bucket: this.artifactsBucket,
              input: buildOutput,
              objectKey: 'deployed-artifacts',
            }),
          ],
        },
      ],
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Team', 'backend');

    // Stack outputs
    new cdk.CfnOutput(this, 'RepositoryName', {
      value: this.repository.repositoryName,
      description: 'CodeCommit repository name',
      exportName: `repository-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: this.repository.repositoryCloneUrlHttp,
      description: 'CodeCommit repository clone URL (HTTPS)',
      exportName: `repository-clone-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: this.buildProject.projectName,
      description: 'CodeBuild project name',
      exportName: `build-project-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'S3 artifacts bucket name',
      exportName: `artifacts-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildLogGroupName', {
      value: buildLogGroup.logGroupName,
      description: 'CloudWatch log group for build logs',
      exportName: `build-log-group-${environmentSuffix}`,
    });
  }
}
