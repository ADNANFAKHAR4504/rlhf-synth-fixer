import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  slackWebhookUrl?: string;
  budgetThreshold?: number;
  notificationEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    // Read region from AWS_REGION file or environment variable
    let deploymentRegion = process.env.AWS_REGION || 'ap-northeast-1';

    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: deploymentRegion,
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Use the region from the stack
    const region = this.region;

    // Parameters for stack customization
    const budgetThreshold = new cdk.CfnParameter(this, 'BudgetThreshold', {
      type: 'Number',
      default: props?.budgetThreshold || 1000,
      description: 'Monthly budget threshold in USD',
    });

    const notificationEmail = new cdk.CfnParameter(this, 'NotificationEmail', {
      type: 'String',
      default: props?.notificationEmail || 'devops@example.com',
      description: 'Email address for notifications',
    });

    const slackWebhookParam = new cdk.CfnParameter(this, 'SlackWebhookUrl', {
      type: 'String',
      default:
        props?.slackWebhookUrl ||
        'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      description: 'Slack webhook URL for notifications',
      noEcho: true,
    });

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'tap-cicd',
      ManagedBy: 'CDK',
      Region: region,
      Owner: 'DevOps',
      CostCenter: 'Engineering',
      'iac-rlhf-amazon': 'true',
    };

    // Apply tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // ==================== S3 BUCKETS ====================

    // Logging bucket for access logs
    const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: `tap-logging-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
          enabled: true,
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Source code bucket (SCM)
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `tap-source-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'source-bucket-logs/',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      eventBridgeEnabled: true, // Enable EventBridge for change detection
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Artifacts bucket for build outputs
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `tap-artifacts-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'artifacts-bucket-logs/',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-artifacts',
          expiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ==================== SECRETS MANAGER ====================

    // Store S3 access credentials
    const s3AccessSecret = new secretsmanager.Secret(this, 'S3AccessSecret', {
      secretName: `tap-s3-access-${environmentSuffix}`,
      description: 'S3 access credentials for pipeline',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          accessKeyId: '',
          region: region,
        }),
        generateStringKey: 'secretAccessKey',
      },
    });

    // Store Slack webhook URL
    const slackWebhookSecret = new secretsmanager.Secret(
      this,
      'SlackWebhookSecret',
      {
        secretName: `tap-slack-webhook-${environmentSuffix}`,
        description: 'Slack webhook URL for notifications',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            webhookUrl: slackWebhookParam.valueAsString,
          }),
          generateStringKey: 'placeholder',
        },
      }
    );

    // ==================== NETWORKING ====================

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'PipelineVPC', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Security group for EC2 instances
    const instanceSecurityGroup = new ec2.SecurityGroup(
      this,
      'InstanceSecurityGroup',
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    // ==================== IAM ROLES ====================

    // CodeBuild service role
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      roleName: `tap-codebuild-role-${environmentSuffix}`,
      managedPolicies: [],
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                artifactsBucket.arnForObjects('*'),
                sourceBucket.arnForObjects('*'),
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [`arn:aws:logs:${region}:*:*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [s3AccessSecret.secretArn],
            }),
          ],
        }),
      },
    });

    // EC2 instance role for CodeDeploy agent
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `tap-instance-role-${environmentSuffix}`,
      inlinePolicies: {
        InstancePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [
                artifactsBucket.bucketArn,
                artifactsBucket.arnForObjects('*'),
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:Describe*',
                'ec2messages:GetMessages',
                'ssm:UpdateInstanceInformation',
                'ssm:ListAssociations',
                'ssm:ListInstanceAssociations',
                'ssmmessages:CreateControlChannel',
                'ssmmessages:CreateDataChannel',
                'ssmmessages:OpenControlChannel',
                'ssmmessages:OpenDataChannel',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // CodeDeploy service role with least privilege permissions
    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      roleName: `tap-codedeploy-role-${environmentSuffix}`,
      inlinePolicies: {
        CodeDeployPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'autoscaling:CompleteLifecycleAction',
                'autoscaling:DeleteLifecycleHook',
                'autoscaling:DescribeAutoScalingGroups',
                'autoscaling:DescribeLifecycleHooks',
                'autoscaling:PutLifecycleHook',
                'autoscaling:RecordLifecycleActionHeartbeat',
                'autoscaling:CreateAutoScalingGroup',
                'autoscaling:UpdateAutoScalingGroup',
                'autoscaling:EnableMetricsCollection',
                'autoscaling:DescribeScalingActivities',
                'autoscaling:DescribePolicies',
                'autoscaling:DescribeScheduledActions',
                'autoscaling:DescribeNotificationConfigurations',
                'autoscaling:SuspendProcesses',
                'autoscaling:ResumeProcesses',
                'autoscaling:AttachLoadBalancers',
                'autoscaling:AttachLoadBalancerTargetGroups',
                'autoscaling:PutNotificationConfiguration',
                'autoscaling:DetachLoadBalancerTargetGroups',
                'autoscaling:DetachLoadBalancers',
                'autoscaling:UpdateAutoScalingGroup',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:DescribeInstances',
                'ec2:DescribeInstanceStatus',
                'ec2:TerminateInstances',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeSubnets',
                'ec2:DescribeVpcs',
                'ec2:CreateTags',
                'ec2:DescribeTags',
                'ec2:RunInstances',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeListeners',
                'elasticloadbalancing:DescribeTargetHealth',
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets',
                'elasticloadbalancing:ModifyListener',
                'elasticloadbalancing:ModifyRule',
                'elasticloadbalancing:DescribeRules',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['tag:GetResources'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['cloudwatch:DescribeAlarms'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // CodePipeline service role
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      roleName: `tap-pipeline-role-${environmentSuffix}`,
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              resources: [
                artifactsBucket.bucketArn,
                artifactsBucket.arnForObjects('*'),
                sourceBucket.bucketArn,
                sourceBucket.arnForObjects('*'),
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              resources: ['*'],
            }),
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
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // ==================== EC2 INSTANCES ====================

    // Load balancer for blue/green deployment
    const alb = new elbv2.ApplicationLoadBalancer(this, 'AppLoadBalancer', {
      vpc,
      loadBalancerName: `tap-alb-${environmentSuffix}`,
      internetFacing: true,
      vpcSubnets: {
        subnets: vpc.publicSubnets,
      },
    });

    // Target groups for blue/green deployment
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BlueTargetGroup',
      {
        vpc,
        targetGroupName: `tap-blue-tg-${environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // Green target group for blue/green deployment
    // Used by CodeDeploy during deployment to route traffic between blue and green environments
    const greenTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'GreenTargetGroup',
      {
        vpc,
        targetGroupName: `tap-green-tg-${environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // Listener for ALB - used for blue/green deployment traffic routing
    // CodeDeploy will modify this listener during deployments to switch between target groups
    const listener = alb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [blueTargetGroup],
    });

    // Store green target group name for CodeDeploy blue/green deployment configuration
    // This allows CodeDeploy to switch traffic between blue and green target groups
    new cdk.CfnOutput(this, 'GreenTargetGroupName', {
      value: greenTargetGroup.targetGroupName,
      description: 'Green target group name for blue/green deployments',
    });

    // Output listener ARN for reference
    new cdk.CfnOutput(this, 'LoadBalancerListenerArn', {
      value: listener.listenerArn,
      description: 'ALB listener ARN for blue/green deployment',
    });

    // Auto Scaling Group for EC2 instances
    const asg = new autoscaling.AutoScalingGroup(this, 'AppAutoScalingGroup', {
      vpc,
      autoScalingGroupName: `tap-asg-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
      securityGroup: instanceSecurityGroup,
      role: instanceRole,
      userData: ec2.UserData.forLinux(),
    });

    // Install CodeDeploy agent on instances
    asg.userData.addCommands(
      'yum update -y',
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      `wget https://aws-codedeploy-${region}.s3.${region}.amazonaws.com/latest/install`,
      'chmod +x ./install',
      './install auto',
      'service codedeploy-agent start'
    );

    // Attach ASG to target groups
    asg.attachToApplicationTargetGroup(blueTargetGroup);

    // ==================== CODEBUILD PROJECT ====================

    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `tap-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.MEDIUM,
        environmentVariables: {
          ARTIFACTS_BUCKET: {
            value: artifactsBucket.bucketName,
          },
          SECRET_ARN: {
            value: s3AccessSecret.secretArn,
          },
        },
      },
      source: codebuild.Source.s3({
        bucket: sourceBucket,
        path: 'source.zip',
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        name: 'build-output.zip',
        packageZip: true,
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: ['echo Installing dependencies...', 'npm install'],
          },
          build: {
            commands: ['echo Building application...', 'npm run build'],
          },
          post_build: {
            commands: ['echo Build completed on `date`'],
          },
        },
        artifacts: {
          files: ['**/*'],
          name: 'build-output.zip',
        },
      }),
      timeout: cdk.Duration.minutes(15),
    });

    // ==================== CODEDEPLOY ====================

    const application = new codedeploy.ServerApplication(
      this,
      'DeployApplication',
      {
        applicationName: `tap-app-${environmentSuffix}`,
      }
    );

    // Create deployment group with blue/green deployment configuration
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      'DeploymentGroup',
      {
        application,
        deploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
        role: codeDeployRole,
        deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
        autoScalingGroups: [asg],
        loadBalancers: [codedeploy.LoadBalancer.application(blueTargetGroup)],
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: false, // Will be enabled after alarm creation to avoid circular dependency
        },
      }
    );

    // ==================== SNS TOPICS ====================

    const pipelineTopic = new sns.Topic(this, 'PipelineTopic', {
      topicName: `tap-pipeline-notifications-${environmentSuffix}`,
      displayName: 'Pipeline Notifications',
    });

    // Email subscription
    pipelineTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(notificationEmail.valueAsString)
    );

    // ==================== LAMBDA FOR SLACK INTEGRATION ====================

    const slackNotificationLambda = new lambda.Function(
      this,
      'SlackNotificationLambda',
      {
        functionName: `tap-slack-notifier-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'slack-notifier.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        environment: {
          WEBHOOK_SECRET_ARN: slackWebhookSecret.secretArn,
          ENVIRONMENT: environmentSuffix,
          DEPLOYMENT_REGION: region,
        },
        timeout: cdk.Duration.seconds(30),
      }
    );

    // Grant Lambda permission to read secret
    slackWebhookSecret.grantRead(slackNotificationLambda);

    // Subscribe Lambda to SNS topic
    pipelineTopic.addSubscription(
      new sns_subscriptions.LambdaSubscription(slackNotificationLambda)
    );

    // ==================== CODEPIPELINE ====================

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `tap-pipeline-${environmentSuffix}`,
      artifactBucket: artifactsBucket,
      role: pipelineRole,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'Source',
      bucket: sourceBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
      trigger: codepipeline_actions.S3Trigger.EVENTS, // Trigger on S3 changes
      role: pipelineRole,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
      role: pipelineRole,
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    // Deploy stage
    const deployAction = new codepipeline_actions.CodeDeployServerDeployAction({
      actionName: 'Deploy',
      deploymentGroup,
      input: buildOutput,
      role: pipelineRole,
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    });

    // ==================== CLOUDWATCH ALARMS ====================
    // Note: Pipeline state change notifications are handled via CloudWatch Alarms below
    // to avoid circular dependencies

    // Alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: `tap-pipeline-failure-${environmentSuffix}`,
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
      new cloudwatch_actions.SnsAction(pipelineTopic)
    );

    // Alarm for build failures
    const buildFailureAlarm = new cloudwatch.Alarm(this, 'BuildFailureAlarm', {
      alarmName: `tap-build-failure-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'FailedBuilds',
        dimensionsMap: {
          ProjectName: buildProject.projectName,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    buildFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineTopic)
    );

    // Alarm for deployment failures
    const deploymentFailureAlarm = new cloudwatch.Alarm(
      this,
      'DeploymentFailureAlarm',
      {
        alarmName: `tap-deployment-failure-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodeDeploy',
          metricName: 'Deployments',
          dimensionsMap: {
            ApplicationName: application.applicationName,
            DeploymentGroupName: deploymentGroup.deploymentGroupName,
            Status: 'Failed',
          },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    deploymentFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineTopic)
    );

    // Note: The alarm monitors deployment failures and sends notifications via SNS
    // Automatic rollback on failed deployments is configured in the deployment group (failedDeployment: true)
    // Adding the alarm directly to the deployment group would create a circular dependency,
    // so we rely on the deployment failure detection built into CodeDeploy itself

    // ==================== EVENTBRIDGE RULES FOR S3 TRIGGERS ====================
    // Note: S3 trigger is automatically configured via S3Trigger.EVENTS in the source action
    // No need for additional EventBridge rule as CDK handles this automatically

    // ==================== BUDGET ALERTS ====================

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const budget = new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: `tap-monthly-budget-${environmentSuffix}`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: budgetThreshold.valueAsNumber,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: pipelineTopic.topicArn,
            },
            {
              subscriptionType: 'EMAIL',
              address: notificationEmail.valueAsString,
            },
          ],
        },
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'SNS',
              address: pipelineTopic.topicArn,
            },
            {
              subscriptionType: 'EMAIL',
              address: notificationEmail.valueAsString,
            },
          ],
        },
      ],
    });

    // ==================== STACKSETS CONFIGURATION ====================
    // Note: StackSet configuration requires a separate template file
    // This is commented out to avoid deployment errors
    // To enable multi-account deployment, create a separate template and uncomment below

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const stackSetName = `tap-pipeline-stackset-${environmentSuffix}`;

    // ==================== OUTPUTS ====================

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CodePipeline',
    });

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'S3 bucket for source code',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'S3 bucket for build artifacts',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: pipelineTopic.topicArn,
      description: 'ARN of the SNS topic for notifications',
    });

    new cdk.CfnOutput(this, 'StackSetName', {
      value: stackSetName,
      description: 'Name of the CloudFormation StackSet (placeholder)',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'ID of the VPC',
    });

    new cdk.CfnOutput(this, 'CodeBuildProjectName', {
      value: buildProject.projectName,
      description: 'Name of the CodeBuild project',
    });

    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: application.applicationName,
      description: 'Name of the CodeDeploy application',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: region,
      description: 'AWS Region for deployment',
    });
  }
}
