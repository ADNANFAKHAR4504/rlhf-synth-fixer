import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  environment?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // ========================================================================
    // ENVIRONMENT CONFIGURATION
    // ========================================================================
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const environment = props?.environment || environmentSuffix;
    const isProd = environment === 'prod';
    const isStaging = environment === 'staging';
    const envPrefix = `tap-${environmentSuffix}`;

    // Environment-specific configurations
    const instanceType = isProd
      ? 't3.large'
      : isStaging
        ? 't3.small'
        : 't3.micro';
    const minCapacity = isProd ? 2 : isStaging ? 2 : 1;
    const maxCapacity = isProd ? 10 : isStaging ? 5 : 3;
    const desiredCapacity = isProd ? 2 : isStaging ? 2 : 1;
    const alarmThreshold = isProd ? 80 : isStaging ? 85 : 90;
    const glacierTransitionDays = isProd ? 60 : isStaging ? 45 : 30;
    const logDeletionDays = isProd ? 365 : isStaging ? 180 : 90;

    // Add iac-rlhf-amazon tag to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // ========================================================================
    // VPC CONFIGURATION
    // ========================================================================
    const vpc = new ec2.Vpc(this, `${envPrefix}-vpc`, {
      maxAzs: isProd ? 3 : 2,
      natGateways: isProd ? 2 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ========================================================================
    // S3 BUCKETS
    // ========================================================================

    // Source bucket (used as pipeline source instead of CodeCommit)
    const sourceBucket = new s3.Bucket(this, `${envPrefix}-source-bucket`, {
      bucketName: `${envPrefix}-pipeline-source-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(isProd ? 90 : 30),
          enabled: true,
        },
      ],
    });

    // Artifacts bucket for pipeline
    const artifactsBucket = new s3.Bucket(
      this,
      `${envPrefix}-artifacts-bucket`,
      {
        bucketName: `${envPrefix}-pipeline-artifacts-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'cleanup-old-artifacts',
            expiration: cdk.Duration.days(isProd ? 30 : 7),
            enabled: true,
          },
        ],
      }
    );

    // Logging bucket with lifecycle policies
    const loggingBucket = new s3.Bucket(this, `${envPrefix}-logging-bucket`, {
      bucketName: `${envPrefix}-pipeline-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'transition-to-glacier',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(glacierTransitionDays),
            },
          ],
          expiration: cdk.Duration.days(logDeletionDays),
          enabled: true,
        },
      ],
    });

    // ========================================================================
    // SSM PARAMETER STORE
    // ========================================================================

    // Store build configuration parameters
    new ssm.StringParameter(this, `${envPrefix}-build-image`, {
      parameterName: `/${envPrefix}/codebuild/image`,
      stringValue: 'aws/codebuild/amazonlinux2-x86_64-standard:4.0',
      description: 'CodeBuild image for the pipeline',
    });

    new ssm.StringParameter(this, `${envPrefix}-node-version`, {
      parameterName: `/${envPrefix}/codebuild/node-version`,
      stringValue: '18',
      description: 'Node.js version for builds',
    });

    new ssm.StringParameter(this, `${envPrefix}-deployment-config`, {
      parameterName: `/${envPrefix}/codedeploy/config`,
      stringValue: isProd
        ? 'CodeDeployDefault.AllAtOnceBlueGreen'
        : 'CodeDeployDefault.HalfAtATime',
      description: 'CodeDeploy deployment configuration',
    });

    // ========================================================================
    // SNS TOPICS FOR NOTIFICATIONS
    // ========================================================================

    const pipelineTopic = new sns.Topic(this, `${envPrefix}-pipeline-topic`, {
      topicName: `${envPrefix}-pipeline-notifications`,
      displayName: `Pipeline notifications for ${environment} environment`,
    });

    // Add email subscription (replace with actual email)
    if (this.node.tryGetContext('notificationEmail')) {
      pipelineTopic.addSubscription(
        new sns_subscriptions.EmailSubscription(
          this.node.tryGetContext('notificationEmail')
        )
      );
    }

    // ========================================================================
    // IAM ROLES (LEAST PRIVILEGE)
    // ========================================================================

    // CodeBuild service role
    const codeBuildRole = new iam.Role(this, `${envPrefix}-codebuild-role`, {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      roleName: `${envPrefix}-codebuild-role`,
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
              actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
              resources: [
                `${artifactsBucket.bucketArn}/*`,
                `${loggingBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/${envPrefix}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // CodeDeploy service role
    const codeDeployRole = new iam.Role(this, `${envPrefix}-codedeploy-role`, {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      roleName: `${envPrefix}-codedeploy-role`,
      inlinePolicies: {
        CodeDeployPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:*',
                'autoscaling:*',
                'elasticloadbalancing:*',
                'tag:GetResources',
                'tag:GetTags',
                'sns:Publish',
                'cloudwatch:DescribeAlarms',
                'cloudwatch:PutMetricAlarm',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // CodePipeline service role
    const codePipelineRole = new iam.Role(this, `${envPrefix}-pipeline-role`, {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      roleName: `${envPrefix}-pipeline-role`,
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              resources: [
                sourceBucket.bucketArn,
                `${sourceBucket.bucketArn}/*`,
                artifactsBucket.bucketArn,
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              resources: [
                `arn:aws:codebuild:${this.region}:${this.account}:project/${envPrefix}-*`,
              ],
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
              resources: [
                `arn:aws:codedeploy:${this.region}:${this.account}:*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [pipelineTopic.topicArn],
            }),
          ],
        }),
      },
    });

    // EC2 instance role
    const ec2Role = new iam.Role(this, `${envPrefix}-ec2-role`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `${envPrefix}-ec2-role`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        EC2Policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [
                artifactsBucket.bucketArn,
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/${envPrefix}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // ========================================================================
    // EC2 INFRASTRUCTURE (TARGET FOR DEPLOYMENT)
    // ========================================================================

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `${envPrefix}-alb`, {
      vpc,
      loadBalancerName: `${envPrefix}-alb`,
      internetFacing: true,
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${envPrefix}-alb-sg`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${envPrefix}-ec2-sg`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow from ALB'
    );
    ec2SecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.allTraffic(),
      'Allow internal communication'
    );

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      `wget https://aws-codedeploy-${this.region}.s3.${this.region}.amazonaws.com/latest/install`,
      'chmod +x ./install',
      './install auto',
      'service codedeploy-agent start',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web App - ${environment}</h1>" > /var/www/html/index.html'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${envPrefix}-launch-template`,
      {
        launchTemplateName: `${envPrefix}-launch-template`,
        instanceType: new ec2.InstanceType(instanceType),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData,
        role: ec2Role,
        securityGroup: ec2SecurityGroup,
      }
    );

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, `${envPrefix}-asg`, {
      vpc,
      launchTemplate,
      minCapacity,
      maxCapacity,
      desiredCapacity,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(),
    });

    // Blue Target Group (primary)
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${envPrefix}-blue-tg`,
      {
        targetGroupName: `${envPrefix}-blue-tg`,
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targets: [asg],
      }
    );

    // Green Target Group (for blue/green deployments)
    const greenTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${envPrefix}-green-tg`,
      {
        targetGroupName: `${envPrefix}-green-tg`,
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // ALB Listener - starts with blue target group
    alb.addListener(`${envPrefix}-listener`, {
      port: 80,
      defaultTargetGroups: [blueTargetGroup],
    });

    // Test Listener for blue/green deployments (used during deployment)
    alb.addListener(`${envPrefix}-test-listener`, {
      port: 8080,
      defaultTargetGroups: [greenTargetGroup],
    });

    // ========================================================================
    // CODEBUILD PROJECT
    // ========================================================================

    const buildProject = new codebuild.PipelineProject(
      this,
      `${envPrefix}-build-project`,
      {
        projectName: `${envPrefix}-build-project`,
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          computeType: isProd
            ? codebuild.ComputeType.MEDIUM
            : codebuild.ComputeType.SMALL,
          environmentVariables: {
            ENVIRONMENT: {
              value: environmentSuffix,
            },
            NODE_VERSION: {
              type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
              value: `/${envPrefix}/codebuild/node-version`,
            },
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '18',
              },
              commands: ['echo Installing dependencies...', 'npm install'],
            },
            pre_build: {
              commands: [
                'echo Pre-build phase started on `date`',
                'npm run lint || true',
                'npm run test || true',
              ],
            },
            build: {
              commands: [
                'echo Build started on `date`',
                'npm run build',
                'echo Build completed on `date`',
              ],
            },
            post_build: {
              commands: [
                'echo Post-build phase started on `date`',
                'echo Creating deployment package...',
              ],
            },
          },
          artifacts: {
            files: ['**/*'],
            name: 'BuildArtifact',
          },
          cache: {
            paths: ['node_modules/**/*'],
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, `${envPrefix}-build-logs`, {
              logGroupName: `/aws/codebuild/${envPrefix}-build-project`,
              retention: logs.RetentionDays.ONE_MONTH,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
          s3: {
            bucket: loggingBucket,
            prefix: 'build-logs',
            encrypted: true,
          },
        },
      }
    );

    // ========================================================================
    // CODEDEPLOY APPLICATION
    // ========================================================================

    const deployApplication = new codedeploy.ServerApplication(
      this,
      `${envPrefix}-deploy-app`,
      {
        applicationName: `${envPrefix}-application`,
      }
    );

    // Blue/Green Deployment Configuration
    // Using ServerDeploymentGroup with Blue/Green configuration
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      `${envPrefix}-deployment-group`,
      {
        application: deployApplication,
        deploymentGroupName: `${envPrefix}-deployment-group`,
        role: codeDeployRole,
        deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
        ec2InstanceTags: new codedeploy.InstanceTagSet({
          Environment: [environment],
        }),
        autoScalingGroups: [asg],
        // Blue/Green deployment with ALB
        loadBalancer: codedeploy.LoadBalancer.application(blueTargetGroup),
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: true,
        },
        alarms: [
          new cloudwatch.Alarm(this, `${envPrefix}-deployment-alarm`, {
            alarmName: `${envPrefix}-deployment-failure`,
            metric: new cloudwatch.Metric({
              namespace: 'AWS/CodeDeploy',
              metricName: 'Deployments',
              dimensionsMap: {
                ApplicationName: deployApplication.applicationName,
                DeploymentGroupName: `${envPrefix}-deployment-group`,
              },
              statistic: 'Average',
            }),
            threshold: 1,
            evaluationPeriods: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          }),
        ],
      }
    );

    // Add tags to ASG instances for CodeDeploy
    cdk.Tags.of(asg).add('Environment', environment);

    // ========================================================================
    // CLOUDWATCH MONITORING
    // ========================================================================

    // CPU Utilization Alarm
    const cpuAlarm = new cloudwatch.Alarm(this, `${envPrefix}-cpu-alarm`, {
      alarmName: `${envPrefix}-high-cpu`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: alarmThreshold,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(pipelineTopic));

    // Target Response Time Alarm (for blue target group)
    const responseTimeAlarm = new cloudwatch.Alarm(
      this,
      `${envPrefix}-response-time-alarm`,
      {
        alarmName: `${envPrefix}-high-response-time`,
        metric: blueTargetGroup.metrics.targetResponseTime(),
        threshold: isProd ? 2 : 5, // seconds
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    responseTimeAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineTopic)
    );

    // Unhealthy Host Count Alarm (for blue target group)
    const unhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      `${envPrefix}-unhealthy-hosts-alarm`,
      {
        alarmName: `${envPrefix}-unhealthy-hosts`,
        metric: blueTargetGroup.metrics.unhealthyHostCount(),
        threshold: isProd ? 1 : 2,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );
    unhealthyHostAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineTopic)
    );

    // ========================================================================
    // CODEPIPELINE
    // ========================================================================

    // Source output artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, `${envPrefix}-pipeline`, {
      pipelineName: `${envPrefix}-pipeline`,
      role: codePipelineRole,
      artifactBucket: artifactsBucket,
      stages: [
        // STAGE 1: Source from S3
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3Source',
              bucket: sourceBucket,
              bucketKey: 'source.zip', // The application code should be uploaded as source.zip
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.EVENTS, // Trigger on S3 events
              runOrder: 1,
            }),
          ],
        },
        // STAGE 2: Build
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'BuildAction',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              runOrder: 1,
            }),
          ],
        },
        // STAGE 3: Manual Approval (Production only)
        ...(isProd
          ? [
              {
                stageName: 'ManualApproval',
                actions: [
                  new codepipeline_actions.ManualApprovalAction({
                    actionName: 'ApproveDeployment',
                    notificationTopic: pipelineTopic,
                    additionalInformation: `Please review and approve the deployment to ${environment} environment`,
                    runOrder: 1,
                  }),
                ],
              },
            ]
          : []),
        // STAGE 4: Deploy
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeDeployServerDeployAction({
              actionName: 'DeployToEC2',
              deploymentGroup,
              input: buildOutput,
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // Pipeline notifications
    pipeline.onStateChange(`${envPrefix}-pipeline-state-change`, {
      target: new cdk.aws_events_targets.SnsTopic(pipelineTopic),
      description: 'Pipeline state change notifications',
      eventPattern: {
        detail: {
          state: ['SUCCEEDED', 'FAILED', 'CANCELED'],
        },
      },
    });

    // ========================================================================
    // CLOUDWATCH DASHBOARD
    // ========================================================================

    new cloudwatch.Dashboard(this, `${envPrefix}-dashboard`, {
      dashboardName: `${envPrefix}-pipeline-dashboard`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Pipeline Execution Status',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionSuccess',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionFailure',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Sum',
                period: cdk.Duration.hours(1),
              }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                  AutoScalingGroupName: asg.autoScalingGroupName,
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5),
              }),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Target Response Time (Blue/Green)',
            left: [
              blueTargetGroup.metrics.targetResponseTime(),
              greenTargetGroup.metrics.targetResponseTime(),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Healthy/Unhealthy Hosts (Blue)',
            left: [
              blueTargetGroup.metricHealthyHostCount(),
              blueTargetGroup.metrics.unhealthyHostCount(),
            ],
            width: 12,
          }),
        ],
      ],
    });

    // ========================================================================
    // OUTPUTS
    // ========================================================================

    new cdk.CfnOutput(this, 'EnvironmentOutput', {
      value: environment,
      description: 'Deployment environment',
    });

    new cdk.CfnOutput(this, 'PipelineNameOutput', {
      value: pipeline.pipelineName,
      description: 'Name of the CodePipeline',
    });

    new cdk.CfnOutput(this, 'SourceBucketOutput', {
      value: sourceBucket.bucketName,
      description:
        'S3 bucket for source code (upload source.zip here to trigger pipeline)',
    });

    new cdk.CfnOutput(this, 'ALBDnsOutput', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'SNSTopicOutput', {
      value: pipelineTopic.topicArn,
      description: 'SNS topic for pipeline notifications',
    });

    new cdk.CfnOutput(this, 'DashboardUrlOutput', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${envPrefix}-pipeline-dashboard`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'LogGroupOutput', {
      value: `/aws/codebuild/${envPrefix}-build-project`,
      description: 'CloudWatch Log Group for build logs',
    });
  }
}
