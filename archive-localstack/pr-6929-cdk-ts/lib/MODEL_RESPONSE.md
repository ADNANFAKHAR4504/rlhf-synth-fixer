### Reasoning Trace
---

This is a comprehensive request for a multi-stage CI/CD pipeline using AWS CDK v2 in TypeScript. I need to create a complete solution with two files:

1. `main.ts` - The CDK app entrypoint
2. `tapstack.ts` - The full pipeline stack implementation

Key requirements:
- CodeCommit repository as source
- CodePipeline with multiple stages
- CodeBuild for building Docker images, unit tests, and integration tests
- ECR with scanning and lifecycle policies (keep last 10 images)
- ECS Fargate with blue/green deployments via CodeDeploy
- ALB with blue/green target groups
- CloudWatch alarms with automatic rollback
- Slack notifications via Lambda
- Manual approval with SNS
- S3 artifact bucket with versioning and lifecycle
- SSM Parameter Store for secrets
- Least privilege IAM roles
- Proper monitoring and rollback capabilities

Let me structure this carefully with all the required components:

1. CodeCommit repository
2. S3 artifact bucket with versioning
3. ECR repository with scanning and lifecycle
4. CodeBuild projects (build, unit test, integration test)
5. ECS cluster, task definition, and Fargate service
6. ALB with target groups for blue/green
7. CodeDeploy application and deployment group
8. CodePipeline with all stages
9. CloudWatch alarms for service health
10. Lambda for Slack notifications
11. SNS topic for manual approval
12. SSM parameters for configuration
13. Proper IAM roles for all components

I'll make sure to:
- Use clear section headers
- Apply consistent tags
- Configure least privilege IAM
- Wire all components correctly
- Include proper outputs
- Follow CDK v2 best practices
### Answer 
---

```typescript
// main.ts
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();

new TapStack(app, 'PaymentServicePipelineStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  description: 'Multi-stage CI/CD pipeline for containerized payment processing service',
  tags: {
    Environment: 'Production',
    Service: 'Payments',
    ManagedBy: 'CDK'
  }
});

app.synth();
```

```typescript
// tapstack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🔹 VPC for ECS and optional CodeBuild
    const vpc = new ec2.Vpc(this, 'PipelineVpc', {
      maxAzs: 2,
      natGateways: 1,
      vpcName: 'payment-service-vpc'
    });

    // 🔹 CodeCommit
    const codeRepo = new codecommit.Repository(this, 'PaymentServiceRepo', {
      repositoryName: 'payment-service',
      description: 'Payment processing service repository'
    });

    // 🔹 Artifact Bucket
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: `payment-pipeline-artifacts-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'ExpireOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(30),
        enabled: true
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // 🔹 ECR
    const ecrRepo = new ecr.Repository(this, 'PaymentServiceECR', {
      repositoryName: 'payment-service',
      imageScanOnPush: true,
      lifecycleRules: [{
        description: 'Keep last 10 images',
        maxImageCount: 10,
        tagStatus: ecr.TagStatus.ANY,
        rulePriority: 1
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true
    });

    // 🔹 SSM Parameters
    const slackWebhookParam = new ssm.StringParameter(this, 'SlackWebhookUrl', {
      parameterName: '/payment-service/slack-webhook-url',
      stringValue: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      tier: ssm.ParameterTier.STANDARD,
      type: ssm.ParameterType.SECURE_STRING
    });

    const stagingEndpointParam = new ssm.StringParameter(this, 'StagingEndpoint', {
      parameterName: '/payment-service/staging-endpoint',
      stringValue: 'http://staging.example.com',
      tier: ssm.ParameterTier.STANDARD
    });

    // 🔹 SNS Topic for Approvals
    const approvalTopic = new sns.Topic(this, 'ApprovalTopic', {
      topicName: 'payment-pipeline-approvals',
      displayName: 'Payment Pipeline Production Approval'
    });

    approvalTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('approver@example.com')
    );

    // 🔹 IAM Roles
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      roleName: 'payment-pipeline-codebuild-role',
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
                'ecr:CompleteLayerUpload'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/payment-service/*`]
            })
          ]
        })
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess')
      ]
    });

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: 'payment-service-build',
      description: 'Build Docker image and push to ECR',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true,
        environmentVariables: {
          AWS_DEFAULT_REGION: { value: this.region },
          AWS_ACCOUNT_ID: { value: this.account },
          IMAGE_REPO_NAME: { value: ecrRepo.repositoryName },
          IMAGE_TAG: { value: 'latest' }
        }
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
              'IMAGE_TAG=${COMMIT_HASH:=latest}'
            ]
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
              'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG'
            ]
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              'printf "[{\"name\":\"payment-container\",\"imageUri\":\"%s\"}]" $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json'
            ]
          }
        },
        artifacts: {
          files: ['imagedefinitions.json']
        }
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: '/aws/codebuild/payment-service-build',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
          })
        }
      }
    });

    const unitTestProject = new codebuild.PipelineProject(this, 'UnitTestProject', {
      projectName: 'payment-service-unit-tests',
      description: 'Run pytest unit tests with coverage',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL
      },
      role: codeBuildRole,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'pip install -r requirements.txt',
              'pip install pytest pytest-cov'
            ]
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'pytest tests/unit --cov=src --cov-report=xml --cov-report=html --junitxml=test-results.xml'
            ]
          },
          post_build: {
            commands: [
              'echo Unit tests completed',
              'echo Coverage report generated'
            ]
          }
        },
        reports: {
          'pytest-reports': {
            files: ['test-results.xml'],
            'file-format': 'JUNITXML'
          },
          'coverage-reports': {
            files: ['coverage.xml'],
            'file-format': 'COBERTURAXML'
          }
        },
        artifacts: {
          files: ['coverage.xml', 'test-results.xml', 'htmlcov/**/*']
        }
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'UnitTestLogGroup', {
            logGroupName: '/aws/codebuild/payment-service-unit-tests',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
          })
        }
      }
    });

    const integrationTestProject = new codebuild.PipelineProject(this, 'IntegrationTestProject', {
      projectName: 'payment-service-integration-tests',
      description: 'Run integration tests against staging',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          STAGING_ENDPOINT: { 
            value: stagingEndpointParam.parameterName,
            type: codebuild.BuildEnvironmentVariableType.PARAMETER_STORE
          }
        }
      },
      role: codeBuildRole,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'pip install -r requirements.txt',
              'pip install pytest requests'
            ]
          },
          build: {
            commands: [
              'echo Running integration tests against $STAGING_ENDPOINT...',
              'pytest tests/integration --endpoint=$STAGING_ENDPOINT --junitxml=integration-results.xml'
            ]
          },
          post_build: {
            commands: ['echo Integration tests completed']
          }
        },
        reports: {
          'integration-reports': {
            files: ['integration-results.xml'],
            'file-format': 'JUNITXML'
          }
        },
        artifacts: {
          files: ['integration-results.xml']
        }
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'IntegrationTestLogGroup', {
            logGroupName: '/aws/codebuild/payment-service-integration-tests',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
          })
        }
      }
    });

    // Grant ECR permissions
    ecrRepo.grantPullPush(buildProject);
    artifactBucket.grantReadWrite(buildProject);
    artifactBucket.grantReadWrite(unitTestProject);
    artifactBucket.grantReadWrite(integrationTestProject);

    // 🔹 ECS + CodeDeploy
    const cluster = new ecs.Cluster(this, 'PaymentCluster', {
      clusterName: 'payment-service-cluster',
      vpc: vpc,
      containerInsights: true
    });

    const taskRole = new iam.Role(this, 'PaymentTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'payment-service-task-role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess')
      ]
    });

    const executionRole = new iam.Role(this, 'PaymentExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      roleName: 'payment-service-execution-role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'PaymentTaskDef', {
      family: 'payment-service',
      memoryLimitMiB: 2048,
      cpu: 1024,
      taskRole: taskRole,
      executionRole: executionRole
    });

    const container = taskDefinition.addContainer('payment-container', {
      image: ecs.ContainerImage.fromRegistry(`${ecrRepo.repositoryUri}:latest`),
      memoryLimitMiB: 2048,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logGroup: new logs.LogGroup(this, 'PaymentServiceLogGroup', {
          logGroupName: '/ecs/payment-service',
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY
        })
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60)
      }
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      vpc: vpc,
      internetFacing: true,
      loadBalancerName: 'payment-service-alb'
    });

    const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      vpc: vpc,
      port: 80,
      targetType: elbv2.TargetType.IP,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetGroupName: 'payment-blue-tg',
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3
      },
      deregistrationDelay: cdk.Duration.seconds(30)
    });

    const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      vpc: vpc,
      port: 80,
      targetType: elbv2.TargetType.IP,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetGroupName: 'payment-green-tg',
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3
      },
      deregistrationDelay: cdk.Duration.seconds(30)
    });

    const prodListener = alb.addListener('ProdListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [blueTargetGroup]
    });

    const testListener = alb.addListener('TestListener', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [greenTargetGroup]
    });

    const service = new ecs.FargateService(this, 'PaymentService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      serviceName: 'payment-service',
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY
      },
      assignPublicIp: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60)
    });

    service.attachToApplicationTargetGroup(blueTargetGroup);

    const codeDeployApp = new codedeploy.EcsApplication(this, 'PaymentCodeDeployApp', {
      applicationName: 'payment-service-app'
    });

    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      roleName: 'payment-codedeploy-role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployRoleForECS')
      ]
    });

    // 🔹 Alarms
    const targetResponseTimeAlarm = new cloudwatch.Alarm(this, 'TargetResponseTimeAlarm', {
      metric: blueTargetGroup.metricTargetResponseTime(),
      threshold: 2,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when target response time is too high'
    });

    const unhealthyHostAlarm = new cloudwatch.Alarm(this, 'UnhealthyHostAlarm', {
      metric: blueTargetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when unhealthy host count is too high'
    });

    const http5xxAlarm = new cloudwatch.Alarm(this, 'Http5xxAlarm', {
      metric: blueTargetGroup.metricHttpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
        { period: cdk.Duration.minutes(1) }
      ),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when 5xx errors are too high'
    });

    const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'PaymentDeploymentGroup', {
      application: codeDeployApp,
      deploymentGroupName: 'payment-service-dg',
      service: service,
      blueTargetGroup: blueTargetGroup,
      greenTargetGroup: greenTargetGroup,
      listener: prodListener,
      testListener: testListener,
      role: codeDeployRole,
      deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE_BLUE_GREEN,
      blueGreenDeploymentConfig: {
        terminateBlueInstancesOnDeploymentSuccess: true,
        terminationWaitTime: cdk.Duration.minutes(5),
        deploymentApprovalWaitTime: cdk.Duration.minutes(0)
      },
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true
      },
      alarms: [targetResponseTimeAlarm, unhealthyHostAlarm, http5xxAlarm]
    });

    // 🔹 Slack Notifier
    const slackNotifierRole = new iam.Role(this, 'SlackNotifierRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'payment-slack-notifier-role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        SSMPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['ssm:GetParameter'],
              resources: [slackWebhookParam.parameterArn]
            })
          ]
        })
      }
    });

    const slackNotifier = new lambda.Function(this, 'SlackNotifier', {
      functionName: 'payment-pipeline-slack-notifier',
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
        WEBHOOK_PARAM_NAME: slackWebhookParam.parameterName
      },
      role: slackNotifierRole,
      timeout: cdk.Duration.seconds(30)
    });

    // 🔹 Pipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      roleName: 'payment-pipeline-role',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipelineFullAccess')
      ]
    });

    const pipeline = new codepipeline.Pipeline(this, 'PaymentPipeline', {
      pipelineName: 'payment-service-pipeline',
      artifactBucket: artifactBucket,
      role: pipelineRole,
      restartExecutionOnUpdate: false
    });

    // Pipeline Stages
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const unitTestOutput = new codepipeline.Artifact('UnitTestOutput');

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'Source',
          repository: codeRepo,
          branch: 'main',
          output: sourceOutput
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildImage',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput]
        })
      ]
    });

    pipeline.addStage({
      stageName: 'UnitTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'RunUnitTests',
          project: unitTestProject,
          input: sourceOutput,
          outputs: [unitTestOutput]
        })
      ]
    });

    pipeline.addStage({
      stageName: 'DeployStaging',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'DeployToStaging',
          service: service,
          input: buildOutput,
          deploymentTimeout: cdk.Duration.minutes(60)
        })
      ]
    });

    pipeline.addStage({
      stageName: 'IntegrationTest',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'RunIntegrationTests',
          project: integrationTestProject,
          input: sourceOutput
        })
      ]
    });

    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'ProductionApproval',
          notificationTopic: approvalTopic,
          additionalInformation: 'Please review staging deployment and approve production release'
        })
      ]
    });

    const codeDeployDeployAction = new codepipeline_actions.CodeDeployEcsDeployAction({
      actionName: 'DeployToProduction',
      deploymentGroup: deploymentGroup,
      taskDefinitionTemplateInput: buildOutput,
      appSpecTemplateInput: buildOutput,
      containerImageInputs: [{
        input: buildOutput,
        taskDefinitionPlaceholder: 'IMAGE1_NAME'
      }]
    });

    pipeline.addStage({
      stageName: 'DeployProduction',
      actions: [codeDeployDeployAction]
    });

    // Pipeline state change events to Slack
    const pipelineStateRule = new events.Rule(this, 'PipelineStateRule', {
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName]
        }
      }
    });

    pipelineStateRule.addTarget(new events_targets.LambdaFunction(slackNotifier));

    // 🔹 Outputs
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name'
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: ecrRepo.repositoryUri,
      description: 'ECR repository URI'
    });

    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: codeDeployApp.applicationName,
      description: 'CodeDeploy application name'
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline name'
    });

    new cdk.CfnOutput(this, 'ProductionURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Production URL'
    });

    new cdk.CfnOutput(this, 'StagingURL', {
      value: `http://${alb.loadBalancerDnsName}:8080`,
      description: 'Staging URL (test listener)'
    });
  }
}
```