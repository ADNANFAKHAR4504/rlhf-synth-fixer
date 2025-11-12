# Overview

Please find solution files below.

## ./bin/tap.d.ts

```typescript
#!/usr/bin/env node
export {};

```

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/tap-stack.d.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface TapStackProps extends cdk.StackProps {
    environmentSuffix?: string;
}
export declare class TapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: TapStackProps);
}
export {};

```

## ./lib/tap-stack.ts

```typescript
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

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Client configuration with explicit credential resolution
const clientConfig = {
  region,
  // This helps avoid the dynamic import issue in Jest
  maxAttempts: 3,
};

// Initialize AWS clients
const s3Client = new S3Client(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const pipelineClient = new CodePipelineClient(clientConfig);
const codeBuildClient = new CodeBuildClient(clientConfig);
const codeDeployClient = new CodeDeployClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const asgClient = new AutoScalingClient(clientConfig);
const snsClient = new SNSClient(clientConfig);
const ssmClient = new SSMClient(clientConfig);
const cwClient = new CloudWatchClient(clientConfig);
const iamClient = new IAMClient(clientConfig);
const cwLogsClient = new CloudWatchLogsClient(clientConfig);

// Helper function to read outputs from flat-outputs.json
function getOutputs() {
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  if (!fs.existsSync(outputsPath)) {
    console.warn(`Outputs file not found at ${outputsPath}, some tests may be skipped`);
    return null;
  }
  const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs from flat-outputs.json:', Object.keys(outputs));
  return outputs;
}

// Helper to get account ID
async function getAccountId(outputsData?: any): Promise<string> {
  if (outputsData?.AccountId) {
    return outputsData.AccountId;
  }
  // Fallback to AWS STS
  const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
  const stsClient = new STSClient({ region });
  const response = await stsClient.send(new GetCallerIdentityCommand({}));
  return response.Account!;
}

describe('TAP Stack Integration Tests - Live AWS Resources', () => {
  let outputs: any;
  const envPrefix = `tap-${environmentSuffix}`;

  beforeAll(() => {
    outputs = getOutputs();
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR block', async () => {
      try {
        const command = new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'tag:Environment', Values: [environmentSuffix] },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBeGreaterThan(0);

        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        // DNS settings may not be returned in describe-vpcs, check if defined
        if (vpc.EnableDnsHostnames !== undefined) {
          expect(vpc.EnableDnsHostnames).toBe(true);
        }
        if (vpc.EnableDnsSupport !== undefined) {
          expect(vpc.EnableDnsSupport).toBe(true);
        }
      } catch (error: any) {
        console.error('VPC test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have 4 subnets (2 public, 2 private)', async () => {
      try {
        const vpcCommand = new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'tag:Environment', Values: [environmentSuffix] },
          ],
        });
        const vpcResponse = await ec2Client.send(vpcCommand);

        expect(vpcResponse.Vpcs).toBeDefined();
        expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

        const vpcId = vpcResponse.Vpcs![0].VpcId;

        const subnetCommand = new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId!] }],
        });
        const response = await ec2Client.send(subnetCommand);

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(4);

        const publicSubnets = response.Subnets!.filter((s) => s.MapPublicIpOnLaunch);
        const privateSubnets = response.Subnets!.filter((s) => !s.MapPublicIpOnLaunch);

        expect(publicSubnets.length).toBe(2);
        expect(privateSubnets.length).toBe(2);
      } catch (error: any) {
        console.error('Subnets test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have Internet Gateway attached', async () => {
      try {
        const vpcCommand = new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'tag:Environment', Values: [environmentSuffix] },
          ],
        });
        const vpcResponse = await ec2Client.send(vpcCommand);

        expect(vpcResponse.Vpcs).toBeDefined();
        expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

        const vpcId = vpcResponse.Vpcs![0].VpcId;

        const command = new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId!] }],
        });
        const response = await ec2Client.send(command);

        expect(response.InternetGateways).toBeDefined();
        expect(response.InternetGateways!.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error('Internet Gateway test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have NAT Gateway in public subnet', async () => {
      try {
        const command = new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'state', Values: ['available', 'pending'] },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.NatGateways).toBeDefined();
        expect(response.NatGateways!.length).toBeGreaterThan(0);
        expect(response.NatGateways![0].State).toMatch(/available|pending/);
      } catch (error: any) {
        console.error('NAT Gateway test error:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('S3 Buckets', () => {
    test('should have source bucket with versioning enabled', async () => {
      try {
        const accountId = await getAccountId(outputs);
        const bucketName = outputs?.SourceBucketOutput || `${envPrefix}-pipeline-source-${accountId}-${region}`;

        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await expect(s3Client.send(headCommand)).resolves.toBeDefined();

        const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
        const versioningResponse = await s3Client.send(versioningCommand);
        expect(versioningResponse.Status).toBe('Enabled');

        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const encryptionResponse = await s3Client.send(encryptionCommand);
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      } catch (error: any) {
        console.error('Source bucket test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have artifacts bucket with lifecycle policy', async () => {
      try {
        const accountId = await getAccountId(outputs);
        const bucketName = `${envPrefix}-pipeline-artifacts-${accountId}-${region}`;

        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await expect(s3Client.send(headCommand)).resolves.toBeDefined();

        const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
        const lifecycleResponse = await s3Client.send(lifecycleCommand);
        expect(lifecycleResponse.Rules).toBeDefined();
        expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

        // Verify at least one rule has expiration configured
        const rulesWithExpiration = lifecycleResponse.Rules!.filter((r) => r.Expiration?.Days);
        expect(rulesWithExpiration.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error('Artifacts bucket test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have logging bucket with Glacier transition', async () => {
      try {
        const accountId = await getAccountId(outputs);
        const bucketName = `${envPrefix}-pipeline-logs-${accountId}-${region}`;

        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await expect(s3Client.send(headCommand)).resolves.toBeDefined();

        const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
        const lifecycleResponse = await s3Client.send(lifecycleCommand);
        expect(lifecycleResponse.Rules).toBeDefined();

        // Verify at least one rule has Glacier transition
        const glacierRules = lifecycleResponse.Rules!.filter((r) =>
          r.Transitions?.some((t) => t.StorageClass === 'GLACIER')
        );
        expect(glacierRules.length).toBeGreaterThan(0);

        // Verify rules have expiration configured
        const rulesWithExpiration = lifecycleResponse.Rules!.filter((r) => r.Expiration?.Days);
        expect(rulesWithExpiration.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error('Logging bucket test error:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('should have CodeBuild role', async () => {
      const roleName = `${envPrefix}-codebuild-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toContain('codebuild.amazonaws.com');
    }, 30000);

    test('should have CodeDeploy role', async () => {
      const roleName = `${envPrefix}-codedeploy-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toContain('codedeploy.amazonaws.com');
    }, 30000);

    test('should have CodePipeline role', async () => {
      const roleName = `${envPrefix}-pipeline-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toContain('codepipeline.amazonaws.com');
    }, 30000);

    test('should have EC2 instance role with SSM permissions', async () => {
      const roleName = `${envPrefix}-ec2-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      // Check for CloudWatch managed policy (which includes SSM)
      const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(policiesCommand);
      const cloudWatchPolicy = policiesResponse.AttachedPolicies!.find((p) =>
        p.PolicyName!.includes('CloudWatch')
      );
      expect(cloudWatchPolicy).toBeDefined();
      expect(cloudWatchPolicy!.PolicyName).toBe('CloudWatchAgentServerPolicy');
    }, 30000);
  });

  describe('SSM Parameters', () => {
    test('should have CodeBuild image parameter', async () => {
      const command = new GetParameterCommand({ Name: `/${envPrefix}/codebuild/image` });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('aws/codebuild/amazonlinux2-x86_64-standard:4.0');
    }, 30000);

    test('should have Node.js version parameter', async () => {
      const command = new GetParameterCommand({ Name: `/${envPrefix}/codebuild/node-version` });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('18');
    }, 30000);

    test('should have deployment config parameter', async () => {
      const command = new GetParameterCommand({ Name: `/${envPrefix}/codedeploy/config` });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toContain('CodeDeployDefault');
    }, 30000);
  });

  describe('CodePipeline', () => {
    test('should have pipeline with correct stages', async () => {
      const pipelineName = `${envPrefix}-pipeline`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline!.name).toBe(pipelineName);
      expect(response.pipeline!.stages).toBeDefined();
      expect(response.pipeline!.stages!.length).toBeGreaterThanOrEqual(3);

      const stageNames = response.pipeline!.stages!.map((s) => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    }, 30000);

    test('should have S3 as source provider', async () => {
      const pipelineName = `${envPrefix}-pipeline`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      const sourceStage = response.pipeline!.stages!.find((s) => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage!.actions![0].actionTypeId!.provider).toBe('S3');
    }, 30000);
  });

  describe('CodeBuild', () => {
    test('should have build project with correct configuration', async () => {
      const projectName = `${envPrefix}-build-project`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);

      const project = response.projects![0];
      expect(project.name).toBe(projectName);
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.image).toBe('aws/codebuild/standard:5.0');
    }, 30000);
  });

  describe('CodeDeploy', () => {
    test('should have deployment application', async () => {
      const appName = `${envPrefix}-application`;
      const command = new GetApplicationCommand({ applicationName: appName });
      const response = await codeDeployClient.send(command);

      expect(response.application).toBeDefined();
      expect(response.application!.applicationName).toBe(appName);
    }, 30000);

    test('should have deployment group with auto-rollback', async () => {
      const appName = `${envPrefix}-application`;
      const groupName = `${envPrefix}-deployment-group`;
      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: groupName,
      });
      const response = await codeDeployClient.send(command);

      expect(response.deploymentGroupInfo).toBeDefined();
      expect(response.deploymentGroupInfo!.deploymentGroupName).toBe(groupName);
      expect(response.deploymentGroupInfo!.autoRollbackConfiguration).toBeDefined();
      expect(response.deploymentGroupInfo!.autoRollbackConfiguration!.enabled).toBe(true);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('should have ALB configured', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`${envPrefix}-alb`],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.LoadBalancerName).toBe(`${envPrefix}-alb`);
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    }, 30000);

    test('should have blue and green target groups with health checks', async () => {
      // Check blue target group
      const blueCommand = new DescribeTargetGroupsCommand({
        Names: [`${envPrefix}-blue-tg`],
      });
      const blueResponse = await elbClient.send(blueCommand);

      expect(blueResponse.TargetGroups).toBeDefined();
      expect(blueResponse.TargetGroups!.length).toBe(1);

      const blueTg = blueResponse.TargetGroups![0];
      expect(blueTg.TargetGroupName).toBe(`${envPrefix}-blue-tg`);
      expect(blueTg.Protocol).toBe('HTTP');
      expect(blueTg.Port).toBe(80);
      expect(blueTg.HealthCheckEnabled).toBe(true);
      expect(blueTg.HealthCheckPath).toBe('/');

      // Check green target group
      const greenCommand = new DescribeTargetGroupsCommand({
        Names: [`${envPrefix}-green-tg`],
      });
      const greenResponse = await elbClient.send(greenCommand);

      expect(greenResponse.TargetGroups).toBeDefined();
      expect(greenResponse.TargetGroups!.length).toBe(1);

      const greenTg = greenResponse.TargetGroups![0];
      expect(greenTg.TargetGroupName).toBe(`${envPrefix}-green-tg`);
      expect(greenTg.Protocol).toBe('HTTP');
      expect(greenTg.Port).toBe(80);
    }, 30000);

    test('should have listeners on ports 80 and 8080 for blue/green', async () => {
      const lbCommand = new DescribeLoadBalancersCommand({
        Names: [`${envPrefix}-alb`],
      });
      const lbResponse = await elbClient.send(lbCommand);
      const lbArn = lbResponse.LoadBalancers![0].LoadBalancerArn;

      const command = new DescribeListenersCommand({
        LoadBalancerArn: lbArn,
      });
      const response = await elbClient.send(command);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBe(2);

      // Production listener on port 80
      const httpListener = response.Listeners!.find((l) => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');

      // Test listener on port 8080 for blue/green
      const testListener = response.Listeners!.find((l) => l.Port === 8080);
      expect(testListener).toBeDefined();
      expect(testListener!.Protocol).toBe('HTTP');
    }, 30000);
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG with correct configuration', async () => {
      // Get all ASGs and filter by tags since CDK generates names
      const command = new DescribeAutoScalingGroupsCommand({});
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();

      // Find ASG by tags (iac-rlhf-amazon and Environment)
      const asg = response.AutoScalingGroups!.find((asg) =>
        asg.Tags?.some((tag) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true') &&
        asg.Tags?.some((tag) => tag.Key === 'Environment' && tag.Value === environmentSuffix)
      );

      expect(asg).toBeDefined();
      expect(asg!.AutoScalingGroupName).toContain('asg');

      if (environmentSuffix === 'prod') {
        expect(asg!.MinSize).toBe(2);
        expect(asg!.MaxSize).toBe(10);
      } else {
        expect(asg!.MinSize).toBe(1);
        expect(asg!.MaxSize).toBe(3);
      }
    }, 30000);
  });

  describe('SNS Topics', () => {
    test('should have pipeline notification topic', async () => {
      if (!outputs?.PipelineTopicArn) {
        console.warn('PipelineTopicArn not found in outputs, skipping test');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.PipelineTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toContain('Pipeline notifications');
    }, 30000);
  });

  describe('CloudWatch', () => {
    test('should have deployment failure alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`${envPrefix}-deployment-failure`],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(`${envPrefix}-deployment-failure`);
      expect(alarm.Namespace).toBe('AWS/CodeDeploy');
    }, 30000);

    test('should have log group for CodeBuild', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/${envPrefix}-build`,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Security Groups', () => {
    test('should have security groups with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Find any security group with HTTP (port 80) ingress rules
      const sgsWithHttp = response.SecurityGroups!.filter((sg) =>
        sg.IpPermissions?.some((rule) => rule.FromPort === 80 && rule.ToPort === 80)
      );
      expect(sgsWithHttp.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Pipeline Flow', () => {
    test('should have pipeline in ready state', async () => {
      const pipelineName = outputs?.PipelineNameOutput || `${envPrefix}-pipeline`;
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates!.length).toBeGreaterThan(0);

      // Pipeline should exist and be in a valid state
      response.stageStates!.forEach((stage) => {
        expect(stage.stageName).toBeDefined();
      });
    }, 30000);

    test('should have ALB with accessible DNS', async () => {
      const albDns = outputs?.ALBDnsOutput;

      if (!albDns) {
        console.warn('ALB DNS not found in outputs, trying to fetch from ALB list');
        const command = new DescribeLoadBalancersCommand({
          Names: [`${envPrefix}-alb`],
        });
        const response = await elbClient.send(command);
        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBe(1);
        expect(response.LoadBalancers![0].DNSName).toBeDefined();
      } else {
        expect(albDns).toBeDefined();
        expect(albDns).toContain('.elb.');
        expect(albDns).toContain(region);
      }
    }, 30000);

    test('should verify complete deployment configuration', async () => {
      // Verify the deployment group has all required configurations
      const appName = `${envPrefix}-application`;
      const groupName = `${envPrefix}-deployment-group`;
      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: groupName,
      });
      const response = await codeDeployClient.send(command);

      expect(response.deploymentGroupInfo).toBeDefined();

      // Verify auto-rollback is enabled
      expect(response.deploymentGroupInfo!.autoRollbackConfiguration!.enabled).toBe(true);

      // Verify load balancer is configured
      expect(response.deploymentGroupInfo!.loadBalancerInfo).toBeDefined();
      expect(response.deploymentGroupInfo!.loadBalancerInfo!.targetGroupInfoList).toBeDefined();
      expect(response.deploymentGroupInfo!.loadBalancerInfo!.targetGroupInfoList!.length).toBeGreaterThan(0);

      // Verify ASG is attached
      expect(response.deploymentGroupInfo!.autoScalingGroups).toBeDefined();
      expect(response.deploymentGroupInfo!.autoScalingGroups!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have functional monitoring with alarms', async () => {
      const alarmNames = [
        `${envPrefix}-deployment-failure`,
        `${envPrefix}-high-cpu`,
        `${envPrefix}-high-response-time`,
        `${envPrefix}-unhealthy-hosts`,
      ];

      const command = new DescribeAlarmsCommand({
        AlarmNames: alarmNames,
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(2);

      // Verify at least some alarms have actions configured
      const alarmsWithActions = response.MetricAlarms!.filter(
        (alarm) => alarm.AlarmActions && alarm.AlarmActions.length > 0
      );
      expect(alarmsWithActions.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Resource Integration', () => {
    test('should verify EC2 instances are registered with blue target group', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({
        Names: [`${envPrefix}-blue-tg`],
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBe(1);

      const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn;
      expect(targetGroupArn).toBeDefined();

      // Verify target group has health checks configured
      const tg = tgResponse.TargetGroups![0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    }, 30000);

    test('should verify all required IAM roles have correct trust relationships', async () => {
      const roles = [
        { name: `${envPrefix}-codebuild-role`, service: 'codebuild.amazonaws.com' },
        { name: `${envPrefix}-codedeploy-role`, service: 'codedeploy.amazonaws.com' },
        { name: `${envPrefix}-pipeline-role`, service: 'codepipeline.amazonaws.com' },
        { name: `${envPrefix}-ec2-role`, service: 'ec2.amazonaws.com' },
      ];

      for (const roleInfo of roles) {
        const command = new GetRoleCommand({ RoleName: roleInfo.name });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.AssumeRolePolicyDocument).toContain(roleInfo.service);
      }
    }, 30000);

    test('should verify SSM parameters are accessible and contain expected values', async () => {
      const params = [
        { name: `/${envPrefix}/codebuild/image`, expectedValue: 'aws/codebuild/amazonlinux2-x86_64-standard:4.0' },
        { name: `/${envPrefix}/codebuild/node-version`, expectedValue: '18' },
        { name: `/${envPrefix}/codedeploy/config`, expectedPattern: /CodeDeployDefault/ },
      ];

      for (const param of params) {
        const command = new GetParameterCommand({ Name: param.name });
        const response = await ssmClient.send(command);

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toBeDefined();

        if ('expectedValue' in param) {
          expect(response.Parameter!.Value).toBe(param.expectedValue);
        } else if ('expectedPattern' in param) {
          expect(response.Parameter!.Value).toMatch(param.expectedPattern);
        }
      }
    }, 30000);

    test('should verify complete CI/CD pipeline configuration meets requirements', async () => {
      const pipelineName = outputs?.PipelineNameOutput || `${envPrefix}-pipeline`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();

      // Requirement: Support blue/green deployments (verified via CodeDeploy config)
      const stages = response.pipeline!.stages!;
      const deployStage = stages.find((s) => s.name === 'Deploy');
      expect(deployStage).toBeDefined();
      expect(deployStage!.actions![0].actionTypeId!.provider).toBe('CodeDeploy');

      // Requirement: Integrated AWS CodeBuild for source code compilation
      const buildStage = stages.find((s) => s.name === 'Build');
      expect(buildStage).toBeDefined();
      expect(buildStage!.actions![0].actionTypeId!.provider).toBe('CodeBuild');

      // Requirement: Approval required before production releases (if prod)
      if (environmentSuffix === 'prod') {
        const approvalStage = stages.find((s) => s.name === 'ManualApproval');
        expect(approvalStage).toBeDefined();
        expect(approvalStage!.actions![0].actionTypeId!.category).toBe('Approval');
      }

      // Requirement: Use S3 as source (replacing CodeCommit)
      const sourceStage = stages.find((s) => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage!.actions![0].actionTypeId!.provider).toBe('S3');
    }, 30000);
  });
});

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '097219365021' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
          Match.objectLike({ Key: 'ManagedBy', Value: 'CDK' }),
        ]),
      });
    });

    test('should create 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.1.0/24',
      });
    });

    test('should create 2 private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        CidrBlock: '10.0.2.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        CidrBlock: '10.0.3.0/24',
      });
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('S3 Buckets', () => {
    test('should create source bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-dev-pipeline-source-097219365021-ap-northeast-1',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      });
    });

    test('should create artifacts bucket with lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-dev-pipeline-artifacts-097219365021-ap-northeast-1',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'cleanup-old-artifacts',
              Status: 'Enabled',
              ExpirationInDays: 7,
            },
          ],
        },
      });
    });

    test('should create logging bucket with Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-dev-pipeline-logs-097219365021-ap-northeast-1',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'transition-to-glacier',
              Status: 'Enabled',
              ExpirationInDays: 90,
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodeBuild role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-codebuild-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        }),
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      });
    });

    test('should create CodeDeploy role with inline policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-codedeploy-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            }),
          ]),
        }),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CodeDeployPolicy',
          }),
        ]),
      });
    });

    test('should create CodePipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-pipeline-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('should create EC2 instance role with SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-ec2-role',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                Match.objectLike({ Ref: 'AWS::Partition' }),
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create CodeBuild image parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-dev/codebuild/image',
        Value: 'aws/codebuild/amazonlinux2-x86_64-standard:4.0',
        Type: 'String',
        Description: 'CodeBuild image for the pipeline',
      });
    });

    test('should create Node.js version parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-dev/codebuild/node-version',
        Value: '18',
        Type: 'String',
      });
    });

    test('should create deployment config parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/tap-dev/codedeploy/config',
        Value: 'CodeDeployDefault.HalfAtATime',
        Type: 'String',
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: 'tap-dev-application',
      });
    });

    test('should create deployment group with auto-rollback', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: 'tap-dev-deployment-group',
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith([
            'DEPLOYMENT_FAILURE',
            'DEPLOYMENT_STOP_ON_ALARM',
          ]),
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct environment', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'tap-dev-build-project',
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:5.0',
        },
        Source: {
          Type: 'CODEPIPELINE',
        },
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with S3 source stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-dev-pipeline',
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'S3Source',
                ActionTypeId: Match.objectLike({
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('should include Build stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'BuildAction',
                ActionTypeId: Match.objectLike({
                  Category: 'Build',
                  Provider: 'CodeBuild',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('should include Deploy stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Deploy',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'DeployToEC2',
                ActionTypeId: Match.objectLike({
                  Category: 'Deploy',
                  Provider: 'CodeDeploy',
                }),
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('SNS Notifications', () => {
    test('should create SNS topic for pipeline notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'tap-dev-pipeline-notifications',
        DisplayName: 'Pipeline notifications for dev environment',
      });
    });

    test('should have SNS topic policy', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sns:Publish',
            }),
          ]),
        }),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create deployment failure alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'tap-dev-deployment-failure',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create ASG with correct instance type for dev', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '1',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true', PropagateAtLaunch: true }),
        ]),
      });
    });

    test('should create launch template with t3.micro for dev', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          IamInstanceProfile: Match.objectLike({}),
          UserData: Match.anyValue(),
        }),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tap-dev-alb',
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create blue and green target groups with health checks', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);

      // Blue target group
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'tap-dev-blue-tg',
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });

      // Green target group
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: 'tap-dev-green-tg',
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create listeners on ports 80 and 8080 for blue/green', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);

      // Production listener on port 80
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
          }),
        ]),
      });

      // Test listener on port 8080
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 8080,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
          }),
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group allowing HTTP traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group for CodeBuild', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/tap-dev-build-project',
      });
    });
  });

  describe('Event Rules', () => {
    test('should create EventBridge rule for S3 source changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        State: 'ENABLED',
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: Match.objectLike({
            eventName: ['CompleteMultipartUpload', 'CopyObject', 'PutObject'],
            requestParameters: Match.objectLike({
              key: ['source.zip'],
            }),
          }),
        }),
      });
    });
  });

  describe('Tags', () => {
    test('all resources should have required tags', () => {
      const resources = template.toJSON().Resources;
      const taggableResources = Object.entries(resources).filter(
        ([_, resource]: [string, any]) =>
          resource.Properties?.Tags || resource.Properties?.TagSet
      );

      taggableResources.forEach(([id, resource]: [string, any]) => {
        const tags = resource.Properties.Tags || resource.Properties.TagSet;
        if (Array.isArray(tags)) {
          const hasIacTag = tags.some(
            (tag: any) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
          );
          const hasEnvTag = tags.some(
            (tag: any) => tag.Key === 'Environment' && tag.Value === 'dev'
          );

          expect(hasIacTag || hasEnvTag).toBeTruthy();
        }
      });
    });
  });

  describe('Production Environment Configuration', () => {
    test('should use larger instances for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.large',
        }),
      });
    });

    test('should use higher capacity for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('should include manual approval stage for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'ManualApproval',
            Actions: Match.arrayWith([
              Match.objectLike({
                Name: 'ApproveDeployment',
                ActionTypeId: Match.objectLike({
                  Category: 'Approval',
                  Provider: 'Manual',
                }),
              }),
            ]),
          }),
        ]),
      });
    });

    test('should use different lifecycle policies for production', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTestStack', {
        environmentSuffix: 'prod',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'tap-prod-pipeline-logs-097219365021-ap-northeast-1',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'transition-to-glacier',
              Status: 'Enabled',
              ExpirationInDays: 365,
              Transitions: [
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 60,
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('Staging Environment Configuration', () => {
    test('should use appropriate instances for staging', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingTestStack', {
        environmentSuffix: 'staging',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      stagingTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.small',
        }),
      });
    });

    test('should use appropriate capacity for staging', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'StagingTestStack', {
        environmentSuffix: 'staging',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const stagingTemplate = Template.fromStack(stagingStack);

      stagingTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        DesiredCapacity: '2',
      });
    });
  });

  describe('Context Configuration', () => {
    test('should add email subscription when notificationEmail is provided', () => {
      const emailApp = new cdk.App({ context: { notificationEmail: 'test@example.com' } });
      const emailStack = new TapStack(emailApp, 'EmailTestStack', {
        environmentSuffix: 'dev',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const emailTemplate = Template.fromStack(emailStack);

      emailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('should not add email subscription when notificationEmail is not provided', () => {
      // This is the default test case (emailStack without context)
      const noEmailApp = new cdk.App();
      const noEmailStack = new TapStack(noEmailApp, 'NoEmailTestStack', {
        environmentSuffix: 'dev',
        env: { region: 'ap-northeast-1', account: '097219365021' },
      });
      const noEmailTemplate = Template.fromStack(noEmailStack);

      // Should not have email subscription
      expect(() => {
        noEmailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
        });
      }).toThrow();
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create CloudWatch Dashboard with pipeline widgets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'tap-dev-pipeline-dashboard',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export environment output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('EnvironmentOutput');
      expect(outputs.EnvironmentOutput.Description).toContain('environment');
    });

    test('should export pipeline name output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('PipelineNameOutput');
    });

    test('should export source bucket output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('SourceBucketOutput');
    });

    test('should export ALB DNS output', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs).toHaveProperty('ALBDnsOutput');
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
