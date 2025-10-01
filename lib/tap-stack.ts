import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logs_destinations from 'aws-cdk-lib/aws-logs-destinations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface CICDPipelineStackProps extends cdk.StackProps {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  notificationEmail: string;
  deploymentRegions: string[];
  environmentName?: string;
  projectName?: string;
  costCenter?: string;
  codeStarConnectionArn?: string;
}

export class CICDPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CICDPipelineStackProps) {
    super(scope, id, props);

    // Configuration from props and context
    const environmentName =
      props.environmentName || this.node.tryGetContext('environment') || 'dev';
    const projectName =
      props.projectName || this.node.tryGetContext('projectName') || 'iac-test';
    const costCenter =
      props.costCenter ||
      this.node.tryGetContext('costCenter') ||
      'engineering';

    // Helper function to create resource names
    const createResourceName = (resource: string) =>
      `${projectName}-${resource}-${environmentName}`;

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', environmentName);
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('CostCenter', costCenter);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // KMS Key for SNS encryption (S3 uses AWS managed encryption to avoid circular dependency)
    const encryptionKey = new kms.Key(this, 'PipelineEncryptionKey', {
      enableKeyRotation: true,
      description: `KMS key for ${projectName} CI/CD pipeline SNS encryption`,
      alias: createResourceName('pipeline-key'),
    });
    cdk.Tags.of(encryptionKey).add('iac-rlhf-amazon', 'true');

    // S3 Bucket for pipeline artifacts - using AWS managed encryption to avoid circular dependency
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `${createResourceName('artifacts')}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-artifacts',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    cdk.Tags.of(artifactBucket).add('iac-rlhf-amazon', 'true');

    // DynamoDB table for build artifacts metadata
    const artifactsMetadataTable = new dynamodb.Table(
      this,
      'ArtifactsMetadata',
      {
        tableName: createResourceName('artifacts-metadata'),
        partitionKey: {
          name: 'buildId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
      }
    );
    cdk.Tags.of(artifactsMetadataTable).add('iac-rlhf-amazon', 'true');

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'PipelineLogGroup', {
      logGroupName: `/aws/codepipeline/${createResourceName('pipeline')}`,
      retention: logs.RetentionDays.ONE_MONTH,
    });
    cdk.Tags.of(logGroup).add('iac-rlhf-amazon', 'true');

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: createResourceName('pipeline-notifications'),
      masterKey: encryptionKey,
    });
    cdk.Tags.of(notificationTopic).add('iac-rlhf-amazon', 'true');

    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(props.notificationEmail)
    );

    // Secrets Manager for GitHub token - must be manually populated
    const githubToken = new secretsmanager.Secret(this, 'GitHubToken', {
      secretName: createResourceName('github-oauth-token'),
      description: `GitHub OAuth token for ${projectName} repository access - store as plain text`,
      encryptionKey: encryptionKey,
    });
    cdk.Tags.of(githubToken).add('iac-rlhf-amazon', 'true');

    // Database credentials secret
    const dbCredentials = new secretsmanager.Secret(
      this,
      'DatabaseCredentials',
      {
        secretName: createResourceName('database-credentials'),
        description: `Database credentials for ${projectName} application`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
        encryptionKey: encryptionKey,
      }
    );
    cdk.Tags.of(dbCredentials).add('iac-rlhf-amazon', 'true');

    // IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: `IAM role for ${projectName} CodeBuild projects`,
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
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${artifactBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['dynamodb:PutItem', 'dynamodb:GetItem'],
              resources: [artifactsMetadataTable.tableArn],
            }),
            // KMS permissions removed since S3 now uses AWS managed encryption
          ],
        }),
      },
    });
    cdk.Tags.of(codeBuildRole).add('iac-rlhf-amazon', 'true');

    // CodeBuild Project for Building
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: createResourceName('build-project'),
      role: codeBuildRole,
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
            commands: ['echo Build completed on `date`'],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
    });
    cdk.Tags.of(buildProject).add('iac-rlhf-amazon', 'true');

    // CodeBuild Project for Unit Tests
    const unitTestProject = new codebuild.PipelineProject(
      this,
      'UnitTestProject',
      {
        projectName: createResourceName('unit-test-project'),
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: ['npm ci'],
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
      }
    );
    cdk.Tags.of(unitTestProject).add('iac-rlhf-amazon', 'true');

    // CodeBuild Project for Integration Tests
    const integrationTestProject = new codebuild.PipelineProject(
      this,
      'IntegrationTestProject',
      {
        projectName: createResourceName('integration-test-project'),
        role: codeBuildRole,
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
              commands: ['npm ci'],
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
              commands: ['docker-compose -f docker-compose.test.yml down'],
            },
          },
        }),
      }
    );
    cdk.Tags.of(integrationTestProject).add('iac-rlhf-amazon', 'true');

    // Grant secret read permissions
    dbCredentials.grantRead(integrationTestProject);

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'CICDPipeline', {
      pipelineName: createResourceName('multi-stage-pipeline'),
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });
    cdk.Tags.of(pipeline).add('iac-rlhf-amazon', 'true');

    // Source Artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    // Build Artifact
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Source Stage - Using CodeStar connection for better reliability or fallback to GitHub token
    const sourceAction = props.codeStarConnectionArn
      ? new codepipeline_actions.CodeStarConnectionsSourceAction({
          actionName: 'GitHub_Source',
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: props.githubBranch,
          connectionArn: props.codeStarConnectionArn,
          output: sourceOutput,
          triggerOnPush: true,
        })
      : new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: props.githubOwner,
          repo: props.githubRepo,
          branch: props.githubBranch,
          oauthToken: githubToken.secretValue,
          output: sourceOutput,
          trigger: codepipeline_actions.GitHubTrigger.POLL,
        });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
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
    cdk.Tags.of(devDeployRole).add('iac-rlhf-amazon', 'true');

    pipeline.addStage({
      stageName: 'Deploy_Development',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'Deploy_Dev_Stack',
          templatePath: buildOutput.atPath('infrastructure/dev-stack.yaml'),
          stackName: createResourceName('dev-stack'),
          adminPermissions: false,
          deploymentRole: devDeployRole,
          cfnCapabilities: [cdk.CfnCapabilities.NAMED_IAM],
          runOrder: 1,
        }),
      ],
    });

    // Manual Approval for Production
    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Production_Approval',
      notificationTopic: notificationTopic,
      additionalInformation:
        'Please review the deployment and approve for production',
      externalEntityLink: `https://github.com/${props.githubOwner}/${props.githubRepo}`,
    });

    // Production Deployment Stage
    const prodDeployRole = new iam.Role(this, 'ProdCloudFormationRole', {
      assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess'),
      ],
    });
    cdk.Tags.of(prodDeployRole).add('iac-rlhf-amazon', 'true');

    // Production stage with multi-region deployment
    const productionActions: codepipeline.IAction[] = [manualApprovalAction];

    props.deploymentRegions.forEach((region, index) => {
      productionActions.push(
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: `Deploy_Prod_${region}`,
          templatePath: buildOutput.atPath('infrastructure/prod-stack.yaml'),
          stackName: `${createResourceName('prod-stack')}-${region}`,
          adminPermissions: false,
          deploymentRole: prodDeployRole,
          cfnCapabilities: [cdk.CfnCapabilities.NAMED_IAM],
          region: region,
          account: this.account, // Explicit account required for cross-region support
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
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: createResourceName('pipeline-failure'),
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
    cdk.Tags.of(pipelineFailureAlarm).add('iac-rlhf-amazon', 'true');

    // Lambda function for cost monitoring and log processing
    const costMonitoringLambda = new lambda.Function(
      this,
      'CostMonitoringLambda',
      {
        functionName: createResourceName('cost-monitoring'),
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'cost-monitoring.lambda_handler',
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        environment: {
          SNS_TOPIC_ARN: notificationTopic.topicArn,
          PROJECT_NAME: projectName,
          ENVIRONMENT: environmentName,
          TABLE_NAME: artifactsMetadataTable.tableName,
        },
        code: lambda.Code.fromAsset('lambda'),
      }
    );

    // Grant necessary permissions to the Lambda
    notificationTopic.grantPublish(costMonitoringLambda);
    artifactsMetadataTable.grantReadWriteData(costMonitoringLambda);
    logGroup.grantRead(costMonitoringLambda);

    // Add managed policy for CloudWatch access
    costMonitoringLambda.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchReadOnlyAccess')
    );

    cdk.Tags.of(costMonitoringLambda).add('iac-rlhf-amazon', 'true');

    // CloudWatch log subscription to trigger cost monitoring
    const logSubscription = new logs.SubscriptionFilter(
      this,
      'CostMonitoringLogFilter',
      {
        logGroup: logGroup,
        destination: new logs_destinations.LambdaDestination(
          costMonitoringLambda
        ),
        filterPattern: logs.FilterPattern.anyTerm(
          'SUCCEEDED',
          'FAILED',
          'Duration:',
          'Memory:',
          'CPU:'
        ),
      }
    );
    cdk.Tags.of(logSubscription).add('iac-rlhf-amazon', 'true');

    // EventBridge rule for pipeline state changes
    const pipelineEventRule = new events.Rule(this, 'PipelineEventRule', {
      ruleName: createResourceName('pipeline-events'),
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
          state: ['FAILED', 'SUCCEEDED'],
        },
      },
      targets: [new events_targets.LambdaFunction(costMonitoringLambda)],
    });
    cdk.Tags.of(pipelineEventRule).add('iac-rlhf-amazon', 'true');

    // Pipeline event notifications
    pipeline.onStateChange('PipelineStateChange', {
      target: new events_targets.SnsTopic(notificationTopic),
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

    new cdk.CfnOutput(this, 'GitHubTokenSecretName', {
      value: githubToken.secretName,
      description:
        'Name of the GitHub token secret - must be manually populated with valid GitHub personal access token',
    });

    // Output instructions for setting up GitHub credentials
    new cdk.CfnOutput(this, 'GitHubSetupInstructions', {
      value: props.codeStarConnectionArn
        ? 'Using CodeStar connection for GitHub integration'
        : `Pipeline uses polling (no webhook). Set GitHub token: aws secretsmanager put-secret-value --secret-id ${githubToken.secretName} --secret-string 'your-github-personal-access-token'. For webhooks, switch trigger to WEBHOOK after setting valid token.`,
      description: 'Instructions for configuring GitHub integration',
    });
  }
}
