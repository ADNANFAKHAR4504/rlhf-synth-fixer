# Ideal Response

This document contains the complete implementation of the CI/CD pipeline stack.

## bin/tap.ts

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
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
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

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      Team: 'platform-engineering',
      CostCenter: 'engineering-001',
    };

    // 🔹 VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'MicroservicesVpc', {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // 🔹 S3 Artifact Bucket with 30-day retention
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-artifacts',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(artifactBucket).add(key, value);
    });

    // 🔹 ECR Repository
    const ecrRepository = new ecr.Repository(this, 'MicroserviceRepo', {
      repositoryName: `microservice-app-${environmentSuffix}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
        },
      ],
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(ecrRepository).add(key, value);
    });

    // 🔹 ECS Cluster
    const cluster = new ecs.Cluster(this, 'MicroservicesCluster', {
      clusterName: `microservices-cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true,
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(cluster).add(key, value);
    });

    // 🔹 CloudWatch Log Group
    const taskLogGroup = new logs.LogGroup(this, 'TaskLogGroup', {
      logGroupName: `/ecs/microservice-app-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 IAM Roles for ECS
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });
    taskExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/microservice-${environmentSuffix}/*`,
        ],
      })
    );

    // 🔹 ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: `microservice-app-${environmentSuffix}`,
      memoryLimitMiB: 1024,
      cpu: 512,
      executionRole: taskExecutionRole,
      taskRole,
    });

    const container = taskDefinition.addContainer('app', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository, 'latest'),
      containerName: `microservice-app-${environmentSuffix}`,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'app',
        logGroup: taskLogGroup,
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // 🔹 Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ServiceALB', {
      loadBalancerName: `microservices-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(alb).add(key, value);
    });

    // Blue and Green Target Groups
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BlueTargetGroup',
      {
        targetGroupName: `microservices-blue-tg-${environmentSuffix}`,
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    const greenTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'GreenTargetGroup',
      {
        targetGroupName: `microservices-green-tg-${environmentSuffix}`,
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [blueTargetGroup],
    });

    // 🔹 ECS Service
    const service = new ecs.FargateService(this, 'MicroserviceService', {
      serviceName: `microservice-app-${environmentSuffix}`,
      cluster,
      taskDefinition,
      desiredCount: 0, // Start with 0 to allow stack deployment without image
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    service.attachToApplicationTargetGroup(blueTargetGroup);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(service).add(key, value);
    });

    // 🔹 S3 Source Bucket
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `microservice-source-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(sourceBucket).add(key, value);
    });

    // 🔹 SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      topicName: `microservice-pipeline-notifications-${environmentSuffix}`,
    });
    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('devops-team@example.com')
    );
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(notificationTopic).add(key, value);
    });

    // 🔹 SSM Parameters
    new ssm.StringParameter(this, 'ImageTagParam', {
      parameterName: `/microservice-${environmentSuffix}/image-tag`,
      stringValue: 'latest',
    });

    new ssm.StringParameter(this, 'EndpointUrlParam', {
      parameterName: `/microservice-${environmentSuffix}/endpoint-url`,
      stringValue: `http://${alb.loadBalancerDnsName}`,
    });

    // 🔹 IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
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

    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
        resources: [`${artifactBucket.bucketArn}/*`],
      })
    );

    codeBuildRole.addToPolicy(
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
      })
    );

    codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/microservice-${environmentSuffix}/*`,
        ],
      })
    );

    // 🔹 CodeBuild Projects
    const dockerBuildProject = new codebuild.PipelineProject(
      this,
      'DockerBuildProject',
      {
        projectName: `microservice-docker-build-${environmentSuffix}`,
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          computeType: codebuild.ComputeType.SMALL,
          privileged: true,
        },
        environmentVariables: {
          AWS_DEFAULT_REGION: { value: this.region },
          AWS_ACCOUNT_ID: { value: this.account },
          IMAGE_REPO_NAME: { value: ecrRepository.repositoryName },
          IMAGE_TAG: { value: 'latest' },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              ],
            },
            build: {
              commands: [
                'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
                'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              ],
            },
            post_build: {
              commands: [
                'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
                `printf '[{"name":"microservice-app-${environmentSuffix}","imageUri":"%s"}]' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json`,
              ],
            },
          },
          artifacts: {
            files: ['imagedefinitions.json', 'appspec.yaml', 'taskdef.json'],
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'DockerBuildLogGroup', {
              logGroupName: `/aws/codebuild/microservice-docker-build-${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_WEEK,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
        },
      }
    );
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(dockerBuildProject).add(key, value);
    });

    const unitTestProject = new codebuild.PipelineProject(
      this,
      'UnitTestProject',
      {
        projectName: `microservice-unit-tests-${environmentSuffix}`,
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
              commands: ['npm run test:unit'],
            },
          },
          artifacts: {
            files: ['coverage/**/*', 'test-results.xml'],
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'UnitTestLogGroup', {
              logGroupName: `/aws/codebuild/microservice-unit-tests-${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_WEEK,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
        },
      }
    );
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(unitTestProject).add(key, value);
    });

    const securityScanProject = new codebuild.PipelineProject(
      this,
      'SecurityScanProject',
      {
        projectName: `microservice-security-scan-${environmentSuffix}`,
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          computeType: codebuild.ComputeType.MEDIUM,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: [
                'wget https://github.com/jeremylong/DependencyCheck/releases/download/v7.4.4/dependency-check-7.4.4-release.zip',
                'unzip dependency-check-7.4.4-release.zip',
              ],
            },
            build: {
              commands: [
                './dependency-check/bin/dependency-check.sh --updateonly',
                './dependency-check/bin/dependency-check.sh --scan . --format JSON --out ./dependency-check-report || true',
              ],
            },
          },
          artifacts: {
            files: ['dependency-check-report/**/*'],
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'SecurityScanLogGroup', {
              logGroupName: `/aws/codebuild/microservice-security-scan-${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_WEEK,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
        },
      }
    );
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(securityScanProject).add(key, value);
    });

    const integrationTestProject = new codebuild.PipelineProject(
      this,
      'IntegrationTestProject',
      {
        projectName: `microservice-integration-tests-${environmentSuffix}`,
        role: codeBuildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        environmentVariables: {
          ENDPOINT_URL_PARAM: {
            value: `/microservice-${environmentSuffix}/endpoint-url`,
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: ['npm ci'],
            },
            pre_build: {
              commands: [
                'export ENDPOINT_URL=$(aws ssm get-parameter --name $ENDPOINT_URL_PARAM --query "Parameter.Value" --output text)',
              ],
            },
            build: {
              commands: ['npm run test:integration'],
            },
          },
          artifacts: {
            files: ['integration-test-results.xml'],
          },
        }),
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'IntegrationTestLogGroup', {
              logGroupName: `/aws/codebuild/microservice-integration-tests-${environmentSuffix}`,
              retention: logs.RetentionDays.ONE_WEEK,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          },
        },
      }
    );
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(integrationTestProject).add(key, value);
    });

    // 🔹 CodePipeline
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    });

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          's3:GetBucketLocation',
          's3:ListBucket',
        ],
        resources: [artifactBucket.bucketArn, `${artifactBucket.bucketArn}/*`],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:ListBucket',
        ],
        resources: [sourceBucket.bucketArn, `${sourceBucket.bucketArn}/*`],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
        resources: [
          dockerBuildProject.projectArn,
          unitTestProject.projectArn,
          securityScanProject.projectArn,
          integrationTestProject.projectArn,
        ],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:DescribeServices',
          'ecs:DescribeTaskDefinition',
          'ecs:RegisterTaskDefinition',
          'ecs:UpdateService',
        ],
        resources: ['*'],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [
          taskExecutionRole.roleArn,
          taskRole.roleArn,
        ],
      })
    );

    pipelineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sns:Publish'],
        resources: [notificationTopic.topicArn],
      })
    );

    const pipeline = new codepipeline.Pipeline(this, 'MicroservicePipeline', {
      pipelineName: `microservice-cicd-pipeline-${environmentSuffix}`,
      role: pipelineRole,
      artifactBucket,
    });

    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Stage 1: Source
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3_Source',
          bucket: sourceBucket,
          bucketKey: 'source.zip',
          output: sourceOutput,
        }),
      ],
    });

    // Stage 2: Build
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Docker_Build',
          project: dockerBuildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Stage 3: Unit Tests
    pipeline.addStage({
      stageName: 'UnitTests',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Run_Unit_Tests',
          project: unitTestProject,
          input: sourceOutput,
        }),
      ],
    });

    // Stage 4: Security Scan
    pipeline.addStage({
      stageName: 'SecurityScan',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'OWASP_Dependency_Check',
          project: securityScanProject,
          input: sourceOutput,
        }),
      ],
    });

    // Stage 5: Deploy to Staging
    pipeline.addStage({
      stageName: 'DeployToStaging',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'Deploy_ECS_Staging',
          service: service,
          input: buildOutput,
        }),
      ],
    });

    // Stage 6: Integration Tests
    pipeline.addStage({
      stageName: 'IntegrationTests',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Run_Integration_Tests',
          project: integrationTestProject,
          input: sourceOutput,
        }),
      ],
    });

    // Stage 7: Manual Approval
    pipeline.addStage({
      stageName: 'ManualApproval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Approve_Production_Deployment',
          notificationTopic,
        }),
      ],
    });

    // Stage 8: Deploy to Production
    pipeline.addStage({
      stageName: 'DeployToProduction',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'Deploy_ECS_Production',
          service: service,
          input: buildOutput,
        }),
      ],
    });

    // Pipeline failure notifications
    pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(notificationTopic),
      eventPattern: {
        detail: {
          state: ['FAILED'],
        },
      },
    });

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(pipeline).add(key, value);
    });

    // 🔹 Stack Outputs
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
    });

    new cdk.CfnOutput(this, 'ALBEndpoint', {
      value: `http://${alb.loadBalancerDnsName}`,
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: ecrRepository.repositoryUri,
    });
  }
}
```
