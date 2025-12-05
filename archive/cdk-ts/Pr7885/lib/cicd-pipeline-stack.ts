import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface CicdPipelineStackProps extends cdk.StackProps {
  environmentSuffix: string;
  team?: string;
  costCenter?: string;
}

export class CicdPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactBucket: s3.Bucket;
  public readonly ecrRepository: ecr.Repository;
  public readonly notificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: CicdPipelineStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix;
    const team = props.team || 'DevOps';
    const costCenter = props.costCenter || 'Engineering';

    // Requirement 6: S3 bucket for artifacts with encryption and lifecycle policies
    const encryptionKey = new kms.Key(this, 'ArtifactEncryptionKey', {
      description: 'KMS key for encrypting pipeline artifacts',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `cicd-artifacts-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Requirement 9: Tag artifact bucket
    cdk.Tags.of(this.artifactBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(this.artifactBucket).add('Team', team);
    cdk.Tags.of(this.artifactBucket).add('CostCenter', costCenter);

    // Requirement 7: SNS topic for pipeline notifications
    this.notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'CI/CD Pipeline Notifications',
    });

    // Add Slack webhook subscription (webhook URL should be in SSM Parameter Store)
    // For testing purposes, we'll just create the topic
    // In production, add: this.notificationTopic.addSubscription(new sns_subscriptions.UrlSubscription(slackWebhookUrl));

    cdk.Tags.of(this.notificationTopic).add('Environment', environmentSuffix);
    cdk.Tags.of(this.notificationTopic).add('Team', team);
    cdk.Tags.of(this.notificationTopic).add('CostCenter', costCenter);

    // Requirement 2: ECR repository for Docker images
    this.ecrRepository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: `microservices-app-${environmentSuffix}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep only last 10 images',
          maxImageCount: 10,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(this.ecrRepository).add('Environment', environmentSuffix);
    cdk.Tags.of(this.ecrRepository).add('Team', team);
    cdk.Tags.of(this.ecrRepository).add('CostCenter', costCenter);

    // Requirement 8: IAM role for CodeBuild with least privilege
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild with least privilege access',
    });

    // Grant minimal permissions to CodeBuild
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`,
        ],
      })
    );

    // Grant ECR permissions
    this.ecrRepository.grantPullPush(codeBuildRole);

    // Grant S3 permissions for artifacts
    this.artifactBucket.grantReadWrite(codeBuildRole);
    encryptionKey.grantEncryptDecrypt(codeBuildRole);

    // Grant CodeBuild report permissions
    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:CreateReportGroup',
          'codebuild:CreateReport',
          'codebuild:UpdateReport',
          'codebuild:BatchPutTestCases',
          'codebuild:BatchPutCodeCoverages',
        ],
        resources: [
          `arn:aws:codebuild:${this.region}:${this.account}:report-group/*`,
        ],
      })
    );

    cdk.Tags.of(codeBuildRole).add('Environment', environmentSuffix);
    cdk.Tags.of(codeBuildRole).add('Team', team);
    cdk.Tags.of(codeBuildRole).add('CostCenter', costCenter);

    // Requirement 3: CodeBuild project for unit tests and Docker build
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `microservices-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Required for Docker builds
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: this.ecrRepository.repositoryUri,
          },
          AWS_DEFAULT_REGION: {
            value: this.region,
          },
          AWS_ACCOUNT_ID: {
            value: this.account,
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
              'echo Running unit tests...',
              'npm install',
              'npm test',
              'echo Building Docker image...',
              'docker build -t $ECR_REPOSITORY_URI:latest .',
              'docker tag $ECR_REPOSITORY_URI:latest $ECR_REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing Docker image to ECR...',
              'docker push $ECR_REPOSITORY_URI:latest',
              'docker push $ECR_REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing image definitions file...',
              'printf \'[{"name":"app","imageUri":"%s"}]\' $ECR_REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json',
            ],
          },
        },
        reports: {
          'test-reports': {
            files: ['test-results/**/*'],
            'file-format': 'JUNITXML',
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
    });

    cdk.Tags.of(buildProject).add('Environment', environmentSuffix);
    cdk.Tags.of(buildProject).add('Team', team);
    cdk.Tags.of(buildProject).add('CostCenter', costCenter);

    // Source repository (using CodeCommit as placeholder for GitHub)
    const sourceRepo = new codecommit.Repository(this, 'SourceRepo', {
      repositoryName: `microservices-app-${environmentSuffix}`,
      description: 'Microservices application source code',
    });

    cdk.Tags.of(sourceRepo).add('Environment', environmentSuffix);
    cdk.Tags.of(sourceRepo).add('Team', team);
    cdk.Tags.of(sourceRepo).add('CostCenter', costCenter);

    // Requirement 8: IAM role for CodePipeline with least privilege
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `codepipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline with least privilege access',
    });

    // Grant minimal permissions to CodePipeline
    this.artifactBucket.grantReadWrite(pipelineRole);
    encryptionKey.grantEncryptDecrypt(pipelineRole);
    sourceRepo.grantPull(pipelineRole);

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
        resources: [buildProject.projectArn],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecs:DescribeServices',
          'ecs:DescribeTaskDefinition',
          'ecs:DescribeTasks',
          'ecs:ListTasks',
          'ecs:RegisterTaskDefinition',
          'ecs:UpdateService',
        ],
        resources: ['*'], // ECS resources are specified at deployment time
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: ['*'],
        conditions: {
          StringEqualsIfExists: {
            'iam:PassedToService': ['ecs-tasks.amazonaws.com'],
          },
        },
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codedeploy:CreateDeployment',
          'codedeploy:GetApplication',
          'codedeploy:GetApplicationRevision',
          'codedeploy:GetDeployment',
          'codedeploy:GetDeploymentConfig',
          'codedeploy:RegisterApplicationRevision',
        ],
        resources: ['*'], // CodeDeploy resources are environment-specific
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [this.notificationTopic.topicArn],
      })
    );

    cdk.Tags.of(pipelineRole).add('Environment', environmentSuffix);
    cdk.Tags.of(pipelineRole).add('Team', team);
    cdk.Tags.of(pipelineRole).add('CostCenter', costCenter);

    // Pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Requirement 1: CodePipeline with multi-stage deployment
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `microservices-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: this.artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'Source',
              repository: sourceRepo,
              branch: 'main',
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'DeployToStaging',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'Deploy',
              service: ecs.BaseService.fromServiceArnWithCluster(
                this,
                'StagingService',
                `arn:aws:ecs:${this.region}:${this.account}:service/staging-cluster/staging-service`
              ),
              input: buildOutput,
              deploymentTimeout: cdk.Duration.minutes(30),
            }),
          ],
        },
        {
          stageName: 'ApproveProduction',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ManualApproval',
              notificationTopic: this.notificationTopic,
              additionalInformation:
                'Please review staging deployment before promoting to production',
            }),
          ],
        },
        {
          stageName: 'DeployToProduction',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'Deploy',
              service: ecs.BaseService.fromServiceArnWithCluster(
                this,
                'ProductionService',
                `arn:aws:ecs:${this.region}:${this.account}:service/production-cluster/production-service`
              ),
              input: buildOutput,
              deploymentTimeout: cdk.Duration.minutes(30),
            }),
          ],
        },
      ],
    });

    cdk.Tags.of(this.pipeline).add('Environment', environmentSuffix);
    cdk.Tags.of(this.pipeline).add('Team', team);
    cdk.Tags.of(this.pipeline).add('CostCenter', costCenter);

    // Requirement 7: Pipeline notifications
    this.pipeline.onStateChange('PipelineStateChange', {
      target: new events_targets.SnsTopic(this.notificationTopic),
      description: 'Notify on pipeline state changes',
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'Name of the CI/CD pipeline',
      exportName: `${environmentSuffix}-pipeline-name`,
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${environmentSuffix}-ecr-uri`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
      exportName: `${environmentSuffix}-artifact-bucket`,
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: this.notificationTopic.topicArn,
      description: 'SNS topic ARN for pipeline notifications',
      exportName: `${environmentSuffix}-notification-topic`,
    });
  }
}
