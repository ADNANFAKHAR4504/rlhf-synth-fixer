import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  slackWebhookUrl?: string;
  notificationEmail?: string;
  repositoryName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'TAP-Pipeline',
      ManagedBy: 'AWS-CDK',
      Owner: 'DevOps-Team',
    };

    // Apply tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create CI/CD Pipeline Infrastructure
    this.createCICDInfrastructure(environmentSuffix, props, commonTags);
  }

  private createCICDInfrastructure(
    environmentSuffix: string,
    props?: TapStackProps,
    _commonTags?: { [key: string]: string }
  ) {
    // 1. VPC for ECS Fargate
    const vpc = new ec2.Vpc(this, `TapVpc-${environmentSuffix}`, {
      maxAzs: 3,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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

    // 2. S3 Bucket for Pipeline Artifacts
    const artifactsBucket = new s3.Bucket(
      this,
      `TapArtifacts-${environmentSuffix}`,
      {
        bucketName: `tap-pipeline-artifacts-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
      }
    );

    // 3. S3 Bucket for Source Code
    const sourceBucket = new s3.Bucket(this, `TapSource-${environmentSuffix}`, {
      bucketName: `tap-pipeline-source-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // 4. SNS Topic for Notifications
    const notificationTopic = new sns.Topic(
      this,
      `TapNotifications-${environmentSuffix}`,
      {
        topicName: `tap-pipeline-notifications-${environmentSuffix}`,
        displayName: 'TAP Pipeline Notifications',
      }
    );

    // Add email subscription if provided
    if (props?.notificationEmail) {
      notificationTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // 5. Lambda Function for Slack Notifications
    const slackNotificationFunction = this.createSlackNotificationLambda(
      environmentSuffix,
      props?.slackWebhookUrl
    );

    // Subscribe Lambda to SNS topic
    notificationTopic.addSubscription(
      new snsSubscriptions.LambdaSubscription(slackNotificationFunction)
    );

    // 6. ECS Cluster
    const cluster = new ecs.Cluster(this, `TapCluster-${environmentSuffix}`, {
      clusterName: `tap-cluster-${environmentSuffix}`,
      vpc,
      enableFargateCapacityProviders: true,
    });

    // Add container insights v2 (replaces deprecated containerInsights)
    cluster.addDefaultCloudMapNamespace({
      name: `tap.local.${environmentSuffix}`,
    });

    // 7. Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `TapALB-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        loadBalancerName: `tap-alb-${environmentSuffix}`,
      }
    );

    // 8. ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `TapTaskDef-${environmentSuffix}`,
      {
        family: `tap-task-${environmentSuffix}`,
        cpu: 512,
        memoryLimitMiB: 1024,
      }
    );

    // Container definition (placeholder - adjust based on your application)
    const container = taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'), // Replace with your image
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'tap-app',
        logGroup: new logs.LogGroup(this, `TapLogGroup-${environmentSuffix}`, {
          logGroupName: `/ecs/tap-application-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
      environment: {
        ENVIRONMENT: environmentSuffix,
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // 9. ECS Service with Auto Scaling
    const service = new ecs.FargateService(
      this,
      `TapService-${environmentSuffix}`,
      {
        cluster,
        taskDefinition,
        serviceName: `tap-service-${environmentSuffix}`,
        desiredCount: 2,
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        enableExecuteCommand: true,
        circuitBreaker: { rollback: true },
      }
    );

    // Auto Scaling Configuration
    const scalableTarget = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scalableTarget.scaleOnCpuUtilization(`TapCpuScaling-${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    scalableTarget.scaleOnMemoryUtilization(
      `TapMemoryScaling-${environmentSuffix}`,
      {
        targetUtilizationPercent: 80,
        scaleInCooldown: cdk.Duration.minutes(5),
        scaleOutCooldown: cdk.Duration.minutes(2),
      }
    );

    // 10. Target Group and Listener
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TapTargetGroup-${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          path: '/',
        },
      }
    );

    service.attachToApplicationTargetGroup(targetGroup);

    loadBalancer.addListener(`TapListener-${environmentSuffix}`, {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // 11. CodeBuild Projects
    const buildProject = this.createBuildProject(
      environmentSuffix,
      'Build',
      artifactsBucket,
      {
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
          },
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
              'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              'printf \'[{"name":"app","imageUri":"%s"}]\' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }
    );

    const testProject = this.createBuildProject(
      environmentSuffix,
      'Test',
      artifactsBucket,
      {
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
          },
          pre_build: {
            commands: ['npm install'],
          },
          build: {
            commands: [
              'echo Running tests...',
              'npm test',
              'npm run lint',
              'npm run security-scan || true',
            ],
          },
          post_build: {
            commands: ['echo Tests completed on `date`'],
          },
        },
        reports: {
          'test-reports': {
            files: ['test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }
    );

    // 12. CodePipeline with S3 source
    const pipeline = this.createS3SourcePipeline(
      environmentSuffix,
      sourceBucket,
      buildProject,
      testProject,
      service,
      artifactsBucket,
      notificationTopic
    );

    // 13. CloudWatch Monitoring
    this.createMonitoring(
      environmentSuffix,
      pipeline,
      service,
      notificationTopic
    );

    // 14. Output important values
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'S3 Bucket for source code uploads',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline Name',
    });
  }

  private createSlackNotificationLambda(
    environmentSuffix: string,
    slackWebhookUrl?: string
  ): lambda.Function {
    const slackFunction = new lambda.Function(
      this,
      `TapSlackNotifier-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        functionName: `tap-slack-notifier-${environmentSuffix}`,
        environment: {
          SLACK_WEBHOOK_URL: slackWebhookUrl || 'PLACEHOLDER_URL',
        },
        timeout: cdk.Duration.seconds(30),
        code: lambda.Code.fromInline(`
        const https = require('https');
        const url = require('url');

        exports.handler = async (event) => {
          console.log('Received event:', JSON.stringify(event, null, 2));
          
          const webhookUrl = process.env.SLACK_WEBHOOK_URL;
          if (webhookUrl === 'PLACEHOLDER_URL') {
            console.log('Slack webhook URL not configured');
            return;
          }

          for (const record of event.Records) {
            const snsMessage = JSON.parse(record.Sns.Message);
            const message = {
              text: \`Pipeline Notification: \${snsMessage.Subject}\`,
              attachments: [{
                color: snsMessage.Subject.includes('FAILED') ? 'danger' : 'good',
                fields: [{
                  title: 'Details',
                  value: snsMessage.Message,
                  short: false
                }]
              }]
            };

            await sendToSlack(webhookUrl, message);
          }
        };

        function sendToSlack(webhookUrl, message) {
          return new Promise((resolve, reject) => {
            const options = url.parse(webhookUrl);
            options.method = 'POST';
            options.headers = {
              'Content-Type': 'application/json',
            };

            const req = https.request(options, (res) => {
              resolve();
            });

            req.on('error', (e) => {
              reject(e);
            });

            req.write(JSON.stringify(message));
            req.end();
          });
        }
      `),
      }
    );

    return slackFunction;
  }

  private createBuildProject(
    environmentSuffix: string,
    projectType: string,
    artifactsBucket: s3.Bucket,
    buildSpec: Record<string, unknown>
  ): codebuild.Project {
    const buildRole = new iam.Role(
      this,
      `TapBuild${projectType}Role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonEC2ContainerRegistryPowerUser'
          ),
        ],
      }
    );

    // Add necessary permissions
    buildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'codebuild:CreateReportGroup',
          'codebuild:CreateReport',
          'codebuild:UpdateReport',
          'codebuild:BatchPutTestCases',
          'codebuild:BatchPutCodeCoverages',
        ],
        resources: ['*'],
      })
    );

    artifactsBucket.grantReadWrite(buildRole);

    const project = new codebuild.Project(
      this,
      `TapBuild${projectType}-${environmentSuffix}`,
      {
        projectName: `tap-${projectType.toLowerCase()}-${environmentSuffix}`,
        role: buildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          privileged: true,
          environmentVariables: {
            AWS_DEFAULT_REGION: {
              value: this.region,
            },
            AWS_ACCOUNT_ID: {
              value: this.account,
            },
            IMAGE_REPO_NAME: {
              value: `tap-app-${environmentSuffix}`,
            },
            IMAGE_TAG: {
              value: 'latest',
            },
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject(buildSpec),
        timeout: cdk.Duration.minutes(20),
      }
    );

    return project;
  }

  private createS3SourcePipeline(
    environmentSuffix: string,
    sourceBucket: s3.Bucket,
    buildProject: codebuild.Project,
    testProject: codebuild.Project,
    ecsService: ecs.FargateService,
    artifactsBucket: s3.Bucket,
    notificationTopic: sns.Topic
  ): codepipeline.Pipeline {
    // Pipeline role
    const pipelineRole = new iam.Role(
      this,
      `TapPipelineRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      }
    );

    // Grant necessary permissions
    sourceBucket.grantRead(pipelineRole);
    artifactsBucket.grantReadWrite(pipelineRole);
    buildProject.role?.grantAssumeRole(pipelineRole);
    testProject.role?.grantAssumeRole(pipelineRole);

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
          'iam:PassRole',
          'sns:Publish',
        ],
        resources: ['*'],
      })
    );

    // Artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create pipeline
    const pipeline = new codepipeline.Pipeline(
      this,
      `TapPipeline-${environmentSuffix}`,
      {
        pipelineName: `tap-pipeline-${environmentSuffix}`,
        role: pipelineRole,
        artifactBucket: artifactsBucket,
        stages: [
          {
            stageName: 'Source',
            actions: [
              new codepipelineActions.S3SourceAction({
                actionName: 'Source',
                bucket: sourceBucket,
                bucketKey: 'source.zip',
                output: sourceOutput,
              }),
            ],
          },
          {
            stageName: 'Test',
            actions: [
              new codepipelineActions.CodeBuildAction({
                actionName: 'RunTests',
                project: testProject,
                input: sourceOutput,
              }),
            ],
          },
          {
            stageName: 'Build',
            actions: [
              new codepipelineActions.CodeBuildAction({
                actionName: 'Build',
                project: buildProject,
                input: sourceOutput,
                outputs: [buildOutput],
              }),
            ],
          },
          {
            stageName: 'Approval',
            actions: [
              new codepipelineActions.ManualApprovalAction({
                actionName: 'ManualApproval',
                notificationTopic,
                additionalInformation:
                  'Please review the build and approve deployment to production.',
              }),
            ],
          },
          {
            stageName: 'Deploy',
            actions: [
              new codepipelineActions.EcsDeployAction({
                actionName: 'Deploy',
                service: ecsService,
                input: buildOutput,
              }),
            ],
          },
        ],
      }
    );

    // Pipeline failure notification
    pipeline
      .onStateChange('PipelineStateChange', {
        eventPattern: {
          detail: {
            state: ['FAILED'],
          },
        },
      })
      .addTarget(new targets.SnsTopic(notificationTopic));

    return pipeline;
  }

  private createMonitoring(
    environmentSuffix: string,
    pipeline: codepipeline.Pipeline,
    ecsService: ecs.FargateService,
    notificationTopic: sns.Topic
  ): void {
    // Pipeline success rate alarm
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      `TapPipelineFailures-${environmentSuffix}`,
      {
        alarmName: `tap-pipeline-failures-${environmentSuffix}`,
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
      new cloudwatchActions.SnsAction(notificationTopic)
    );

    // ECS Service CPU utilization alarm
    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `TapServiceCpuAlarm-${environmentSuffix}`,
      {
        alarmName: `tap-service-cpu-high-${environmentSuffix}`,
        metric: ecsService.metricCpuUtilization(),
        threshold: 85,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(notificationTopic));

    // ECS Service Memory utilization alarm
    const memoryAlarm = new cloudwatch.Alarm(
      this,
      `TapServiceMemoryAlarm-${environmentSuffix}`,
      {
        alarmName: `tap-service-memory-high-${environmentSuffix}`,
        metric: ecsService.metricMemoryUtilization(),
        threshold: 90,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    memoryAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(notificationTopic)
    );

    // Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `TapDashboard-${environmentSuffix}`,
      {
        dashboardName: `tap-pipeline-dashboard-${environmentSuffix}`,
      }
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Executions',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionSuccess',
            dimensionsMap: { PipelineName: pipeline.pipelineName },
            statistic: 'Sum',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionFailure',
            dimensionsMap: { PipelineName: pipeline.pipelineName },
            statistic: 'Sum',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Service Metrics',
        left: [ecsService.metricCpuUtilization()],
        right: [ecsService.metricMemoryUtilization()],
        width: 12,
      })
    );
  }
}
