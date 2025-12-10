import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 🔹 VPC for ECS
    const vpc = new ec2.Vpc(this, 'PipelineVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // 🔹 CodeCommit (optional - reference existing repository if provided)
    // If CodeCommit is not enabled in the account, provide repository name via context:
    // cdk deploy --context codeCommitRepositoryName=your-existing-repo-name
    const existingRepoName = this.node.tryGetContext(
      'codeCommitRepositoryName'
    );
    let codeRepo: codecommit.IRepository | undefined;

    if (existingRepoName) {
      // Reference existing repository
      codeRepo = codecommit.Repository.fromRepositoryName(
        this,
        'PaymentServiceRepo',
        existingRepoName
      );
    }
    // If no existing repo name provided, we'll use S3 source instead

    // 🔹 Artifact Bucket
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `payment-artifacts-${this.account}-${environmentSuffix}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'ExpireOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: false,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 ECR
    const ecrRepo = new ecr.Repository(this, 'PaymentServiceECR', {
      repositoryName: `payment-service-${environmentSuffix}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
          rulePriority: 1,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // 🔹 SSM Parameters
    const slackWebhookParam = new ssm.StringParameter(this, 'SlackWebhookUrl', {
      parameterName: `/payment-service-${environmentSuffix}/slack-webhook-url`,
      stringValue: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      tier: ssm.ParameterTier.STANDARD,
    });

    const stagingEndpointParam = new ssm.StringParameter(
      this,
      'StagingEndpoint',
      {
        parameterName: `/payment-service-${environmentSuffix}/staging-endpoint`,
        stringValue: 'http://staging.example.com',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // 🔹 SNS Topic for Approvals
    const approvalTopic = new sns.Topic(this, 'ApprovalTopic', {
      topicName: `payment-pipeline-approvals-${environmentSuffix}`,
    });

    // 🔹 IAM Roles
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:PutImage',
                'ecr:InitiateLayerUpload',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/payment-service-${environmentSuffix}/*`,
              ],
            }),
          ],
        }),
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `payment-service-build-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true,
        environmentVariables: {
          AWS_DEFAULT_REGION: { value: this.region },
          AWS_ACCOUNT_ID: { value: this.account },
          IMAGE_REPO_NAME: { value: ecrRepo.repositoryName },
          IMAGE_TAG: { value: 'latest' },
        },
      },
      role: codeBuildRole,
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
              'printf "[{\"name\":\"payment-container\",\"imageUri\":\"%s\"}]" $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: `/aws/codebuild/payment-service-build-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      },
    });

    const unitTestProject = new codebuild.PipelineProject(
      this,
      'UnitTestProject',
      {
        projectName: `payment-service-unit-tests-${environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        role: codeBuildRole,
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: [
                'pip install -r requirements.txt',
                'pip install pytest pytest-cov',
              ],
            },
            build: {
              commands: [
                'echo Running unit tests...',
                'pytest tests/unit --cov=src --cov-report=xml --cov-report=html --junitxml=test-results.xml',
              ],
            },
            post_build: {
              commands: [
                'echo Unit tests completed',
                'echo Coverage report generated',
              ],
            },
          },
          reports: {
            'pytest-reports': {
              files: ['test-results.xml'],
              'file-format': 'JUNITXML',
            },
            'coverage-reports': {
              files: ['coverage.xml'],
              'file-format': 'COBERTURAXML',
            },
          },
          artifacts: {
            files: ['coverage.xml', 'test-results.xml', 'htmlcov/**/*'],
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'UnitTestLogGroup', {
              logGroupName: `/aws/codebuild/payment-service-unit-tests-${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_WEEK,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
        },
      }
    );

    const integrationTestProject = new codebuild.PipelineProject(
      this,
      'IntegrationTestProject',
      {
        projectName: `payment-service-integration-tests-${environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          environmentVariables: {
            STAGING_ENDPOINT: {
              value: stagingEndpointParam.parameterName,
              type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE,
            },
          },
        },
        role: codeBuildRole,
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: [
                'pip install -r requirements.txt',
                'pip install pytest requests',
              ],
            },
            build: {
              commands: [
                'echo Running integration tests against $STAGING_ENDPOINT...',
                'pytest tests/integration --endpoint=$STAGING_ENDPOINT --junitxml=integration-results.xml',
              ],
            },
            post_build: {
              commands: ['echo Integration tests completed'],
            },
          },
          reports: {
            'integration-reports': {
              files: ['integration-results.xml'],
              'file-format': 'JUNITXML',
            },
          },
          artifacts: {
            files: ['integration-results.xml'],
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'IntegrationTestLogGroup', {
              logGroupName: `/aws/codebuild/payment-service-integration-tests-${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_WEEK,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
        },
      }
    );

    ecrRepo.grantPullPush(buildProject);
    artifactBucket.grantReadWrite(buildProject);
    artifactBucket.grantReadWrite(unitTestProject);
    artifactBucket.grantReadWrite(integrationTestProject);

    // 🔹 ECS + CodeDeploy
    const cluster = new ecs.Cluster(this, 'PaymentCluster', {
      clusterName: `payment-service-cluster-${environmentSuffix}`,
      vpc: vpc,
      enableFargateCapacityProviders: true,
    });

    // Enable Container Insights via cluster settings
    const cfnCluster = cluster.node.defaultChild as ecs.CfnCluster;
    cfnCluster.clusterSettings = [
      {
        name: 'containerInsights',
        value: 'enabled',
      },
    ];

    const taskRole = new iam.Role(this, 'PaymentTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    const executionRole = new iam.Role(this, 'PaymentExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'PaymentTaskDef',
      {
        family: `payment-service-${environmentSuffix}`,
        memoryLimitMiB: 2048,
        cpu: 1024,
        taskRole: taskRole,
        executionRole: executionRole,
      }
    );

    // Use placeholder image initially - pipeline will update with real image
    // Using nginx as placeholder that will respond on port 80
    const placeholderImage =
      this.node.tryGetContext('ecsPlaceholderImage') ||
      'public.ecr.aws/nginx/nginx:1.21-alpine';

    const container = taskDefinition.addContainer('payment-container', {
      image: ecs.ContainerImage.fromRegistry(placeholderImage),
      memoryLimitMiB: 2048,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logGroup: new logs.LogGroup(this, 'PaymentServiceLogGroup', {
          logGroupName: `/ecs/payment-service-${environmentSuffix}`,
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 80, // nginx placeholder uses port 80
      protocol: ecs.Protocol.TCP,
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      vpc: vpc,
      internetFacing: true,
      loadBalancerName: `payment-service-alb-${environmentSuffix}`,
    });

    const blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BlueTargetGroup',
      {
        vpc: vpc,
        port: 80,
        targetType: elbv2.TargetType.IP,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetGroupName: `payment-blue-tg-${environmentSuffix}`,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    const greenTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'GreenTargetGroup',
      {
        vpc: vpc,
        port: 80,
        targetType: elbv2.TargetType.IP,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetGroupName: `payment-green-tg-${environmentSuffix}`,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    const prodListener = alb.addListener('ProdListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [blueTargetGroup],
    });

    const testListener = alb.addListener('TestListener', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [greenTargetGroup],
    });

    const service = new ecs.FargateService(this, 'PaymentService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      serviceName: `payment-service-${environmentSuffix}`,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
      assignPublicIp: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    service.attachToApplicationTargetGroup(blueTargetGroup);

    const codeDeployApp = new codedeploy.EcsApplication(
      this,
      'PaymentCodeDeployApp',
      {
        applicationName: `payment-service-app-${environmentSuffix}`,
      }
    );

    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployRoleForECS'),
      ],
    });

    // 🔹 Alarms
    const targetResponseTimeAlarm = new cloudwatch.Alarm(
      this,
      'TargetResponseTimeAlarm',
      {
        metric: blueTargetGroup.metrics.targetResponseTime(),
        threshold: 2,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alarm when target response time is too high',
      }
    );

    const unhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyHostAlarm',
      {
        metric: blueTargetGroup.metrics.unhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: 'Alarm when unhealthy host count is too high',
      }
    );

    // Use a custom metric to avoid Fn::Select issues with LocalStack
    const http5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensionsMap: {
        LoadBalancer: alb.loadBalancerFullName,
        TargetGroup: blueTargetGroup.targetGroupFullName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    const http5xxAlarm = new cloudwatch.Alarm(this, 'Http5xxAlarm', {
      metric: http5xxMetric,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when 5xx errors are too high',
    });

    const deploymentGroup = new codedeploy.EcsDeploymentGroup(
      this,
      'PaymentDeploymentGroup',
      {
        application: codeDeployApp,
        deploymentGroupName: `payment-service-dg-${environmentSuffix}`,
        service: service,
        role: codeDeployRole,
        blueGreenDeploymentConfig: {
          listener: prodListener,
          testListener: testListener,
          blueTargetGroup: blueTargetGroup,
          greenTargetGroup: greenTargetGroup,
          deploymentApprovalWaitTime: cdk.Duration.minutes(1),
          terminationWaitTime: cdk.Duration.minutes(5),
        },
        deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: true,
        },
        alarms: [targetResponseTimeAlarm, unhealthyHostAlarm, http5xxAlarm],
      }
    );

    // 🔹 Slack Notifier
    const slackNotifierRole = new iam.Role(this, 'SlackNotifierRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        SSMPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['ssm:GetParameter'],
              resources: [slackWebhookParam.parameterArn],
            }),
          ],
        }),
      },
    });

    // Create log group for Lambda with removal policy
    const slackNotifierLogGroup = new logs.LogGroup(
      this,
      'SlackNotifierLogGroup',
      {
        logGroupName: `/aws/lambda/payment-pipeline-slack-notifier-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const slackNotifier = new lambda.Function(this, 'SlackNotifier', {
      functionName: `payment-pipeline-slack-notifier-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const https = require('https');
        const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
        
        exports.handler = async (event) => {
          const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
          
          try {
            const webhookParam = await ssmClient.send(new GetParameterCommand({
              Name: process.env.WEBHOOK_PARAM_NAME,
              WithDecryption: true
            }));
            
            const webhookUrl = webhookParam.Parameter.Value;
            const detail = event.detail;
            
            const color = detail.state === 'SUCCEEDED' ? 'good' : 
                          detail.state === 'FAILED' ? 'danger' : 'warning';
            
            const message = {
              attachments: [{
                color: color,
                title: 'Payment Pipeline Status Update',
                text: \`Pipeline: \${detail.pipeline}\\nState: \${detail.state}\\nExecution: \${detail['execution-id']}\`,
                timestamp: Math.floor(Date.now() / 1000)
              }]
            };
            
            await postToSlack(webhookUrl, message);
            return { statusCode: 200 };
          } catch (error) {
            console.error('Error:', error);
            throw error;
          }
        };
        
        function postToSlack(webhookUrl, message) {
          return new Promise((resolve, reject) => {
            const url = new URL(webhookUrl);
            const options = {
              hostname: url.hostname,
              path: url.pathname,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            };
            
            const req = https.request(options, (res) => {
              res.on('data', () => {});
              res.on('end', () => resolve());
            });
            
            req.on('error', reject);
            req.write(JSON.stringify(message));
            req.end();
          });
        }
      `),
      environment: {
        WEBHOOK_PARAM_NAME: slackWebhookParam.parameterName,
      },
      role: slackNotifierRole,
      timeout: cdk.Duration.seconds(30),
      logGroup: slackNotifierLogGroup,
    });

    // 🔹 Pipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        CodePipelinePolicy: new iam.PolicyDocument({
          statements: [
            // S3 permissions for artifacts and source
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:GetObjectVersionAcl',
                's3:PutObject',
                's3:PutObjectAcl',
              ],
              resources: [
                artifactBucket.arnForObjects('*'),
                artifactBucket.bucketArn + '/*',
              ],
            }),
            new iam.PolicyStatement({
              actions: ['s3:ListBucket'],
              resources: [artifactBucket.bucketArn],
            }),
            // CodeBuild permissions
            new iam.PolicyStatement({
              actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              resources: [
                buildProject.projectArn,
                unitTestProject.projectArn,
                integrationTestProject.projectArn,
              ],
            }),
            // CodeDeploy permissions
            new iam.PolicyStatement({
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
            // ECS permissions
            new iam.PolicyStatement({
              actions: [
                'ecs:DescribeServices',
                'ecs:DescribeTaskDefinition',
                'ecs:DescribeTasks',
                'ecs:ListTasks',
                'ecs:RegisterTaskDefinition',
                'ecs:UpdateService',
              ],
              resources: ['*'],
            }),
            // IAM permissions for passing roles
            new iam.PolicyStatement({
              actions: ['iam:PassRole'],
              resources: [
                codeBuildRole.roleArn,
                codeDeployRole.roleArn,
                taskRole.roleArn,
                executionRole.roleArn,
              ],
            }),
            // CloudWatch Logs
            new iam.PolicyStatement({
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const pipeline = new codepipeline.Pipeline(this, 'PaymentPipeline', {
      pipelineName: `payment-service-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
      role: pipelineRole,
      restartExecutionOnUpdate: false,
    });

    // Pipeline Stages
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const unitTestOutput = new codepipeline.Artifact('UnitTestOutput');

    // Source stage - use CodeCommit if available, otherwise use S3
    if (codeRepo) {
      pipeline.addStage({
        stageName: 'Source',
        actions: [
          new codepipeline_actions.CodeCommitSourceAction({
            actionName: 'Source',
            repository: codeRepo,
            branch: 'main',
            output: sourceOutput,
          }),
        ],
      });
    } else {
      // Fallback to S3 source
      const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
        bucketName: `payment-source-${this.account}-${environmentSuffix}`,
        versioned: false,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Grant pipeline role permissions to access source bucket
      sourceBucket.grantRead(pipelineRole);

      pipeline.addStage({
        stageName: 'Source',
        actions: [
          new codepipeline_actions.S3SourceAction({
            actionName: 'Source',
            bucket: sourceBucket,
            bucketKey: 'source.zip',
            output: sourceOutput,
          }),
        ],
      });
    }

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildImage',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'UnitTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'RunUnitTests',
          project: unitTestProject,
          input: sourceOutput,
          outputs: [unitTestOutput],
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'DeployStaging',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'DeployToStaging',
          service: service,
          input: buildOutput,
          // deploymentTimeout removed for LocalStack compatibility
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'IntegrationTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'RunIntegrationTests',
          project: integrationTestProject,
          input: sourceOutput,
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'ProductionApproval',
          notificationTopic: approvalTopic,
          additionalInformation:
            'Please review staging deployment and approve production release',
        }),
      ],
    });

    const codeDeployDeployAction =
      new codepipeline_actions.CodeDeployEcsDeployAction({
        actionName: 'DeployToProduction',
        deploymentGroup: deploymentGroup,
        taskDefinitionTemplateInput: buildOutput,
        appSpecTemplateInput: buildOutput,
        containerImageInputs: [
          {
            input: buildOutput,
            taskDefinitionPlaceholder: 'IMAGE1_NAME',
          },
        ],
      });

    pipeline.addStage({
      stageName: 'DeployProduction',
      actions: [codeDeployDeployAction],
    });

    // Pipeline state change events to Slack
    const pipelineStateRule = new events.Rule(this, 'PipelineStateRule', {
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
        },
      },
    });

    pipelineStateRule.addTarget(
      new events_targets.LambdaFunction(slackNotifier)
    );

    // 🔹 Outputs
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: ecrRepo.repositoryUri,
      description: 'ECR repository URI',
    });

    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: codeDeployApp.applicationName,
      description: 'CodeDeploy application name',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name',
    });

    new cdk.CfnOutput(this, 'ProductionURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Production URL',
    });

    new cdk.CfnOutput(this, 'StagingURL', {
      value: `http://${alb.loadBalancerDnsName}:8080`,
      description: 'Staging URL (test listener)',
    });
  }
}
