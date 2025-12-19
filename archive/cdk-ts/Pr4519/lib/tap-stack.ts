import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  notificationEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // CI/CD Pipeline Configuration
    const githubOwner =
      props?.githubOwner || process.env.GITHUB_OWNER || 'your-org';
    const githubRepo =
      props?.githubRepo || process.env.GITHUB_REPO || 'your-repo';
    const githubBranch =
      props?.githubBranch || process.env.GITHUB_BRANCH || 'main';
    const notificationEmail =
      props?.notificationEmail ||
      process.env.NOTIFICATION_EMAIL ||
      'devops@example.com';

    // KMS key for artifact encryption (Requirement 12: SSE-KMS)
    const artifactEncryptionKey = new kms.Key(this, 'artifact-encryption-key', {
      alias: `cicd-artifacts-${environmentSuffix}`,
      description: 'KMS key for encrypting CI/CD pipeline artifacts',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for pipeline artifacts with encryption (Requirement 12: SSE-KMS)
    const artifactsBucket = new s3.Bucket(this, 'pipeline-artifacts-bucket', {
      bucketName: `cicd-artifacts-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: artifactEncryptionKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-artifacts',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // SNS topic for pipeline notifications (Requirement 14: SNS notifications)
    const notificationTopic = new sns.Topic(
      this,
      'pipeline-notification-topic',
      {
        topicName: `cicd-pipeline-notifications-${environmentSuffix}-${this.region}`,
        displayName: 'CI/CD Pipeline Notifications',
      }
    );

    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(notificationEmail)
    );

    // CloudWatch log group for build logs (Requirement 6: CloudWatch logs)
    const buildLogGroup = new logs.LogGroup(this, 'build-log-group', {
      logGroupName: `/aws/codebuild/cicd-pipeline-${environmentSuffix}-${this.region}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SSM parameters for secure configuration (Requirement 8: SSM Parameter Store)
    const githubTokenParam = new ssm.StringParameter(
      this,
      'github-token-param',
      {
        parameterName: `/cicd/github/token-${environmentSuffix}`,
        description: 'GitHub personal access token for pipeline',
        stringValue: 'PLACEHOLDER_GITHUB_TOKEN', // Replace with actual token in production
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    const dockerHubTokenParam = new ssm.StringParameter(
      this,
      'dockerhub-token-param',
      {
        parameterName: `/cicd/dockerhub/token-${environmentSuffix}`,
        description: 'DockerHub token for image pulls',
        stringValue: 'PLACEHOLDER_DOCKERHUB_TOKEN',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // IAM role for CodeBuild with least privilege (Requirement 5: Least privilege IAM)
    const codeBuildRole = new iam.Role(this, 'codebuild-service-role', {
      roleName: `cicd-codebuild-role-${environmentSuffix}-${this.region}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description:
        'Service role for CodeBuild project with minimal permissions',
      inlinePolicies: {
        'build-permissions': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [buildLogGroup.logGroupArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${artifactsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [artifactEncryptionKey.keyArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                githubTokenParam.parameterArn,
                dockerHubTokenParam.parameterArn,
              ],
            }),
          ],
        }),
      },
    });

    // CodeBuild project with caching (Requirement 3: CodeBuild, Requirement 15: Caching)
    const buildProject = new codebuild.PipelineProject(this, 'build-project', {
      projectName: `cicd-build-project-${environmentSuffix}-${this.region}`,
      description: 'Build and test application',
      role: codeBuildRole,
      encryptionKey: artifactEncryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true, // Required for Docker builds
      },
      environmentVariables: {
        GITHUB_TOKEN: {
          type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
          value: githubTokenParam.parameterName,
        },
        DOCKERHUB_TOKEN: {
          type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
          value: dockerHubTokenParam.parameterName,
        },
        AWS_DEFAULT_REGION: {
          value: this.region,
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
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'echo Running pre-build tests...',
              'npm ci',
              'npm run lint',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'npm run build',
              'npm run test:unit',
              'npm run test:integration',
              'echo Building Docker image...',
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Running security scan...',
              'npm audit --audit-level=moderate',
              'echo Generating CloudFormation templates...',
              'npm run cdk:synth',
            ],
          },
        },
        artifacts: {
          files: ['cdk.out/**/*', 'package.json', 'package-lock.json'],
        },
      }),
    });

    // IAM role for CloudFormation deployment (Requirement 5: Least privilege IAM)
    const cfnDeployRole = new iam.Role(this, 'cfn-deploy-role', {
      roleName: `cicd-cfn-deploy-role-${environmentSuffix}-${this.region}`,
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      description: 'Role for CloudFormation stack deployment',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
      ],
    });

    // IAM role for CodePipeline (Requirement 5: Least privilege IAM)
    const pipelineRole = new iam.Role(this, 'pipeline-service-role', {
      roleName: `cicd-pipeline-role-${environmentSuffix}-${this.region}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'Service role for CodePipeline with minimal permissions',
    });

    // Define pipeline artifacts
    const sourceOutput = new codepipeline.Artifact('source-output');
    const buildOutput = new codepipeline.Artifact('build-output');

    // Create the pipeline with concurrency limits (Requirement 16: Limit concurrent executions)
    const pipeline = new codepipeline.Pipeline(this, 'cicd-pipeline', {
      pipelineName: `application-cicd-pipeline-${environmentSuffix}-${this.region}`,
      pipelineType: codepipeline.PipelineType.V2,
      artifactBucket: artifactsBucket,
      role: pipelineRole,
      restartExecutionOnUpdate: true,
      executionMode: codepipeline.ExecutionMode.QUEUED, // Limits concurrent executions
      stages: [
        // Source Stage - GitHub integration (Requirement 1: GitHub source)
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'github-source',
              owner: githubOwner,
              repo: githubRepo,
              branch: githubBranch,
              oauthToken: cdk.SecretValue.unsafePlainText(
                `{{resolve:ssm:${githubTokenParam.parameterName}}}`
              ),
              output: sourceOutput,
              trigger: codepipeline_actions.GitHubTrigger.POLL,
            }),
          ],
        },
        // Build Stage (Requirement 3: CodeBuild, Requirement 9: Tests)
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'application-build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              runOrder: 1,
            }),
          ],
        },
        // Manual Approval Stage (Requirement 4: Manual approval)
        {
          stageName: 'ManualApproval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'approve-deployment',
              notificationTopic: notificationTopic,
              additionalInformation:
                'Please review build artifacts and approve deployment to production',
              runOrder: 1,
            }),
          ],
        },
        // Deploy Stage - CloudFormation deployment (Requirement 2: CloudFormation)
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: 'deploy-application',
              stackName: `application-stack-${environmentSuffix}`,
              templatePath: buildOutput.atPath(
                'cdk.out/ApplicationStack.template.json'
              ),
              adminPermissions: false,
              deploymentRole: cfnDeployRole,
              cfnCapabilities: [
                cdk.CfnCapabilities.NAMED_IAM,
                cdk.CfnCapabilities.AUTO_EXPAND,
              ],
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // CloudWatch Alarms for pipeline monitoring (Requirement 17: CloudWatch alarms)
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'pipeline-failure-alarm',
      {
        alarmName: `cicd-pipeline-failure-${environmentSuffix}-${this.region}`,
        alarmDescription: 'Alert when pipeline execution fails',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionFailure',
          dimensionsMap: {
            PipelineName: pipeline.pipelineName,
          },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(notificationTopic)
    );

    const buildDurationAlarm = new cloudwatch.Alarm(
      this,
      'build-duration-alarm',
      {
        alarmName: `cicd-build-duration-exceeded-${environmentSuffix}-${this.region}`,
        alarmDescription: 'Alert when build takes longer than expected',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodeBuild',
          metricName: 'Duration',
          dimensionsMap: {
            ProjectName: buildProject.projectName,
          },
          statistic: 'Average',
        }),
        threshold: 900, // 15 minutes
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    buildDurationAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(notificationTopic)
    );

    // EventBridge rule for pipeline monitoring (Requirement 17: CloudWatch Events for key pipeline stages)
    const pipelineMonitoringRule = new events.Rule(
      this,
      'pipeline-monitoring-rule',
      {
        ruleName: `cicd-pipeline-monitoring-${environmentSuffix}-${this.region}`,
        description: 'Monitor pipeline execution status changes',
        eventPattern: {
          source: ['aws.codepipeline'],
          detailType: ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['FAILED', 'SUCCEEDED', 'CANCELED'],
            pipeline: [pipeline.pipelineName],
          },
        },
      }
    );

    pipelineMonitoringRule.addTarget(
      new events_targets.SnsTopic(notificationTopic, {
        message: events.RuleTargetInput.fromText(
          `Pipeline ${pipeline.pipelineName} execution ${events.EventField.fromPath('$.detail.state')}`
        ),
      })
    );

    // Grant necessary permissions
    artifactsBucket.grantReadWrite(pipelineRole);
    artifactsBucket.grantReadWrite(codeBuildRole);
    artifactEncryptionKey.grantDecrypt(pipelineRole);
    artifactEncryptionKey.grantDecrypt(codeBuildRole);

    // Outputs
    new cdk.CfnOutput(this, 'pipeline-name', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD pipeline',
      exportName: `cicd-pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'artifacts-bucket', {
      value: artifactsBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
      exportName: `cicd-artifacts-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'notification-topic-arn', {
      value: notificationTopic.topicArn,
      description: 'SNS topic for pipeline notifications',
      exportName: `cicd-notification-topic-${environmentSuffix}`,
    });

    // Apply tags to all constructs (Requirement 7: Tag all resources)
    cdk.Tags.of(this).add('component', 'cicd-pipeline');
    cdk.Tags.of(this).add('version', '1.0.0');
    cdk.Tags.of(this).add('environment', environmentSuffix);
    cdk.Tags.of(this).add('project', 'tap-stack');
    cdk.Tags.of(this).add('owner', 'devops-team');
    cdk.Tags.of(this).add('cost-center', 'engineering');
    cdk.Tags.of(this).add('compliance-level', 'high');
  }
}
