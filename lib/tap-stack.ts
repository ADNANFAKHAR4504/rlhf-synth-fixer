import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

export interface CICDPipelineStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  notificationEmail: string;
  deploymentRegions: string[];
}

export class CICDPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CICDPipelineStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'PipelineEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for CI/CD pipeline encryption',
      alias: 'cicd-pipeline-key',
    });

    // S3 Bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `cicd-artifacts-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      lifecycleRules: [{
        id: 'delete-old-artifacts',
        expiration: cdk.Duration.days(30),
        noncurrentVersionExpiration: cdk.Duration.days(7),
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // DynamoDB table for build artifacts metadata
    const artifactsMetadataTable = new dynamodb.Table(this, 'ArtifactsMetadata', {
      tableName: 'cicd-artifacts-metadata',
      partitionKey: { 
        name: 'buildId', 
        type: dynamodb.AttributeType.STRING 
      },
      sortKey: { 
        name: 'timestamp', 
        type: dynamodb.AttributeType.STRING 
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'PipelineLogGroup', {
      logGroupName: '/aws/codepipeline/cicd-pipeline',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: 'cicd-pipeline-notifications',
      masterKey: encryptionKey,
    });

    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(props.notificationEmail)
    );

    // Secrets Manager for GitHub token
    const githubToken = new secretsmanager.Secret(this, 'GitHubToken', {
      secretName: 'github-oauth-token',
      description: 'GitHub OAuth token for repository access',
      encryptionKey: encryptionKey,
    });

    // Database credentials secret
    const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: 'app-database-credentials',
      description: 'Database credentials for the application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
      encryptionKey: encryptionKey,
    });

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'IAM role for CodeBuild projects',
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [`${artifactBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
              ],
              resources: [artifactsMetadataTable.tableArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    // CodeBuild Project for Building
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: 'cicd-build-project',
      role: codeBuildRole,
      encryptionKey: encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      environmentVariables: {
        AWS_DEFAULT_REGION: { value: this.region },
        AWS_ACCOUNT_ID: { value: this.account },
        ARTIFACTS_TABLE: { value: artifactsMetadataTable.tableName },
      },
      logging: {
        cloudWatch: {
          logGroup: logGroup,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Installing dependencies...',
              'npm ci',
              'echo Running linter...',
              'npm run lint',
            ],
          },
          build: {
            commands: [
              'echo Building application...',
              'npm run build',
              'echo Storing build metadata...',
              'BUILD_ID=$(echo $CODEBUILD_BUILD_ID | cut -d: -f2)',
              'TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")',
              'aws dynamodb put-item --table-name $ARTIFACTS_TABLE --item "{\"buildId\":{\"S\":\"$BUILD_ID\"},\"timestamp\":{\"S\":\"$TIMESTAMP\"},\"status\":{\"S\":\"BUILD_COMPLETE\"}}"',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
    });

    // CodeBuild Project for Unit Tests
    const unitTestProject = new codebuild.PipelineProject(this, 'UnitTestProject', {
      projectName: 'cicd-unit-test-project',
      role: codeBuildRole,
      encryptionKey: encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm ci',
            ],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm run test:unit -- --coverage',
            ],
          },
        },
        reports: {
          UnitTestReport: {
            files: ['coverage/lcov.info'],
            'file-format': 'SIMPLECOV',
          },
        },
      }),
    });

    // CodeBuild Project for Integration Tests
    const integrationTestProject = new codebuild.PipelineProject(this, 'IntegrationTestProject', {
      projectName: 'cicd-integration-test-project',
      role: codeBuildRole,
      encryptionKey: encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      environmentVariables: {
        DB_SECRET_ARN: { value: dbCredentials.secretArn },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo Setting up test environment...',
              'docker-compose -f docker-compose.test.yml up -d',
              'sleep 10',
            ],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
            ],
          },
          post_build: {
            commands: [
              'docker-compose -f docker-compose.test.yml down',
            ],
          },
        },
      }),
    });

    // Grant secret read permissions
    dbCredentials.grantRead(integrationTestProject);

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'CICDPipeline', {
      pipelineName: 'cicd-multi-stage-pipeline',
      artifactBucket: artifactBucket,
      encryptionKey: encryptionKey,
      restartExecutionOnUpdate: true,
    });

    // Source Artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    // Build Artifact
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: props.githubBranch,
          oauthToken: githubToken.secretValueFromJson('token'),
          output: sourceOutput,
        }),
      ],
    });

    // Build Stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build_Application',
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
          actionName: 'Unit_Tests',
          project: unitTestProject,
          input: buildOutput,
          runOrder: 1,
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Integration_Tests',
          project: integrationTestProject,
          input: buildOutput,
          runOrder: 2,
        }),
      ],
    });

    // Development Deployment Stage
    const devDeployRole = new iam.Role(this, 'DevCloudFormationRole', {
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
      ],
    });

    pipeline.addStage({
      stageName: 'Deploy_Development',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'Deploy_Dev_Stack',
          templatePath: buildOutput.atPath('infrastructure/dev-stack.yaml'),
          stackName: 'app-dev-stack',
          adminPermissions: false,
          deploymentRole: devDeployRole,
          capabilities: [cdk.CfnCapabilities.NAMED_IAM],
          runOrder: 1,
        }),
      ],
    });

    // Manual Approval for Production
    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Production_Approval',
      notificationTopic: notificationTopic,
      additionalInformation: 'Please review the deployment and approve for production',
      externalEntityLink: `https://github.com/${props.githubOwner}/${props.githubRepo}`,
    });

    // Production Deployment Stage
    const prodDeployRole = new iam.Role(this, 'ProdCloudFormationRole', {
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
      ],
    });

    // Production stage with multi-region deployment
    const productionActions: codepipeline.IAction[] = [manualApprovalAction];

    props.deploymentRegions.forEach((region, index) => {
      productionActions.push(
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: `Deploy_Prod_${region}`,
          templatePath: buildOutput.atPath('infrastructure/prod-stack.yaml'),
          stackName: `app-prod-stack-${region}`,
          adminPermissions: false,
          deploymentRole: prodDeployRole,
          capabilities: [cdk.CfnCapabilities.NAMED_IAM],
          region: region,
          runOrder: index + 2,
          parameterOverrides: {
            DeploymentRegion: region,
          },
        })
      );
    });

    pipeline.addStage({
      stageName: 'Deploy_Production',
      actions: productionActions,
    });

    // CloudWatch Alarms
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: 'cicd-pipeline-failure',
      metric: pipeline.metricPipelineFailed(),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(notificationTopic)
    );

    // Pipeline event notifications
    pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(notificationTopic),
      description: 'Notify on pipeline state changes',
    });

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD pipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactBucket.bucketName,
      description: 'Name of the artifacts bucket',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'ARN of the notification topic',
    });
  }
}