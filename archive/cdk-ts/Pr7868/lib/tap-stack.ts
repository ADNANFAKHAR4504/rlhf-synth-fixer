import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // S3 Bucket for Pipeline Artifacts
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `pipeline-artifacts-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
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

    // ECR Repository for Docker Images
    const ecrRepository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: `container-repo-${environmentSuffix}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
          rulePriority: 1,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secrets Manager Secret for GitHub OAuth Token
    const githubToken = secretsmanager.Secret.fromSecretNameV2(
      this,
      'GitHubToken',
      'github-oauth-token'
    );

    // SNS Topic for Pipeline Failure Notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotificationTopic', {
      topicName: `pipeline-notifications-${environmentSuffix}`,
      displayName: 'Pipeline Failure Notifications',
    });

    // Add email subscription (configurable via parameter)
    const devOpsEmail = new cdk.CfnParameter(this, 'DevOpsEmail', {
      type: 'String',
      description: 'Email address for DevOps notifications',
      default: 'devops@example.com',
    });

    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(devOpsEmail.valueAsString)
    );

    // IAM Role for CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `pipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'IAM role for CodePipeline execution',
    });

    // Grant permissions to pipeline role
    artifactBucket.grantReadWrite(pipelineRole);
    githubToken.grantRead(pipelineRole);

    // Add CodeBuild permissions to pipeline role
    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:BatchGetBuilds',
          'codebuild:StartBuild',
          'codebuild:StopBuild',
        ],
        resources: ['*'], // Will be restricted to specific projects after creation
      })
    );

    // IAM Role for CodeBuild
    const buildRole = new iam.Role(this, 'BuildRole', {
      roleName: `build-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild projects',
    });

    // Grant permissions to build role
    artifactBucket.grantReadWrite(buildRole);
    ecrRepository.grantPullPush(buildRole);

    // Add ECR authentication permissions
    buildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    // Add CloudWatch Logs permissions for CodeBuild
    buildRole.addToPolicy(
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

    // CodeBuild Project for Docker Image Build
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `docker-build-${environmentSuffix}`,
      description: 'Build Docker images from source code',
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Required for Docker builds
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: ecrRepository.repositoryUri,
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
              'echo "Logging in to Amazon ECR..."',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
              'echo "Image tag:" $IMAGE_TAG',
            ],
          },
          build: {
            commands: [
              'echo "Building Docker image..."',
              'docker build -t $ECR_REPOSITORY_URI:$IMAGE_TAG .',
              'echo "Tagging image as latest..."',
              'docker tag $ECR_REPOSITORY_URI:$IMAGE_TAG $ECR_REPOSITORY_URI:latest',
            ],
          },
          post_build: {
            commands: [
              'echo "Pushing Docker image to ECR..."',
              'docker push $ECR_REPOSITORY_URI:$IMAGE_TAG',
              'docker push $ECR_REPOSITORY_URI:latest',
              'echo "Creating imagetag file..."',
              'echo $IMAGE_TAG > imagetag.txt',
              'printf \'{"ImageURI":"%s"}\' $ECR_REPOSITORY_URI:$IMAGE_TAG > imageDetail.json',
            ],
          },
        },
        artifacts: {
          files: ['imagetag.txt', 'imageDetail.json', '**/*'],
        },
      }),
      timeout: cdk.Duration.minutes(30),
    });

    // CodeBuild Project for Security Scanning with Trivy
    const securityScanProject = new codebuild.Project(
      this,
      'SecurityScanProject',
      {
        projectName: `security-scan-${environmentSuffix}`,
        description: 'Scan Docker images for vulnerabilities using Trivy',
        role: buildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          privileged: true,
          computeType: codebuild.ComputeType.SMALL,
          environmentVariables: {
            ECR_REPOSITORY_URI: {
              value: ecrRepository.repositoryUri,
            },
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: [
                'echo "Installing Trivy..."',
                'wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -',
                'echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee -a /etc/apt/sources.list.d/trivy.list',
                'apt-get update',
                'apt-get install -y trivy',
              ],
            },
            pre_build: {
              commands: [
                'echo "Logging in to ECR..."',
                'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI',
              ],
            },
            build: {
              commands: [
                'echo "Scanning image with Trivy..."',
                'IMAGE_TAG=$(cat imagetag.txt)',
                'trivy image --severity HIGH,CRITICAL --exit-code 0 $ECR_REPOSITORY_URI:$IMAGE_TAG',
                'echo "Security scan completed"',
              ],
            },
          },
          artifacts: {
            files: ['**/*'],
          },
        }),
        timeout: cdk.Duration.minutes(15),
      }
    );

    // Source Output Artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    // Build Output Artifact
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Security Scan Output Artifact
    const scanOutput = new codepipeline.Artifact('ScanOutput');

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `container-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Stage 1: Source
    const sourceStage = pipeline.addStage({
      stageName: 'Source',
    });

    sourceStage.addAction(
      new codepipeline_actions.GitHubSourceAction({
        actionName: 'GitHub_Source',
        owner: 'your-github-username', // Should be parameterized
        repo: 'your-repo-name', // Should be parameterized
        branch: 'main',
        oauthToken: githubToken.secretValue,
        output: sourceOutput,
        trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
      })
    );

    // Stage 2: Build
    const buildStage = pipeline.addStage({
      stageName: 'Build',
    });

    buildStage.addAction(
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Docker_Build',
        project: buildProject,
        input: sourceOutput,
        outputs: [buildOutput],
      })
    );

    // Stage 3: Security Scan
    const scanStage = pipeline.addStage({
      stageName: 'SecurityScan',
    });

    scanStage.addAction(
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Trivy_Scan',
        project: securityScanProject,
        input: buildOutput,
        outputs: [scanOutput],
      })
    );

    // Stage 4: Manual Approval
    const approvalStage = pipeline.addStage({
      stageName: 'ManualApproval',
    });

    approvalStage.addAction(
      new codepipeline_actions.ManualApprovalAction({
        actionName: 'Approve_Deployment',
        notificationTopic: notificationTopic,
        additionalInformation:
          'Please review security scan results before deploying to ECR',
      })
    );

    // Stage 5: Deploy to ECR (Semantic Versioning)
    const deployStage = pipeline.addStage({
      stageName: 'Deploy',
    });

    // Note: Actual ECR deployment with semantic versioning would require a custom action
    // or Lambda function. This is a placeholder for the deployment logic.
    const deployProject = new codebuild.Project(this, 'DeployProject', {
      projectName: `ecr-deploy-${environmentSuffix}`,
      description: 'Tag and push images to ECR with semantic versioning',
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          ECR_REPOSITORY_URI: {
            value: ecrRepository.repositoryUri,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo "Logging in to ECR..."',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI',
            ],
          },
          build: {
            commands: [
              'echo "Applying semantic version tags..."',
              'IMAGE_TAG=$(cat imagetag.txt)',
              'SEMANTIC_VERSION="1.0.0" # This should be calculated based on commit history',
              'docker tag $ECR_REPOSITORY_URI:$IMAGE_TAG $ECR_REPOSITORY_URI:$SEMANTIC_VERSION',
              'docker push $ECR_REPOSITORY_URI:$SEMANTIC_VERSION',
              'echo "Image deployed with version $SEMANTIC_VERSION"',
            ],
          },
        },
      }),
      timeout: cdk.Duration.minutes(10),
    });

    deployStage.addAction(
      new codepipeline_actions.CodeBuildAction({
        actionName: 'Tag_And_Push',
        project: deployProject,
        input: scanOutput,
      })
    );

    // CloudWatch Events Rule to trigger pipeline on repository changes
    const pipelineEventRule = new events.Rule(this, 'PipelineEventRule', {
      ruleName: `pipeline-trigger-${environmentSuffix}`,
      description: 'Trigger pipeline on source repository changes',
      eventPattern: {
        source: ['aws.codecommit'],
        detailType: ['CodeCommit Repository State Change'],
      },
      enabled: true,
    });

    pipelineEventRule.addTarget(new events_targets.CodePipeline(pipeline));

    // Pipeline Failure Notifications via CloudWatch Events
    const pipelineFailureRule = new events.Rule(this, 'PipelineFailureRule', {
      ruleName: `pipeline-failure-${environmentSuffix}`,
      description: 'Notify on pipeline failures',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['FAILED'],
          pipeline: [pipeline.pipelineName],
        },
      },
    });

    pipelineFailureRule.addTarget(
      new events_targets.SnsTopic(notificationTopic, {
        message: events.RuleTargetInput.fromText(
          `Pipeline ${pipeline.pipelineName} has failed. Please check the AWS Console for details.`
        ),
      })
    );

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: artifactBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
      exportName: `${environmentSuffix}-artifact-bucket`,
    });

    new cdk.CfnOutput(this, 'TopicArn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic ARN for notifications',
      exportName: `${environmentSuffix}-notification-topic-arn`,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'ECR repository URI',
      exportName: `${environmentSuffix}-ecr-repository-uri`,
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name',
      exportName: `${environmentSuffix}-pipeline-name`,
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'CodeBuild project name for Docker builds',
      exportName: `${environmentSuffix}-build-project-name`,
    });

    new cdk.CfnOutput(this, 'SecurityScanProjectName', {
      value: securityScanProject.projectName,
      description: 'CodeBuild project name for security scanning',
      exportName: `${environmentSuffix}-security-scan-project-name`,
    });
  }
}
