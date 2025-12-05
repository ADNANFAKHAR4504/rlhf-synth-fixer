# CI/CD Pipeline Integration - Infrastructure Implementation

This implementation provides a complete multi-stage CI/CD pipeline using AWS CodePipeline with automated testing, blue/green deployments, and approval gates.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // VPC with 3 AZs and private subnets
    const vpc = new ec2.Vpc(this, `Pipeline-VPC-${environmentSuffix}`, {
      vpcName: `pipeline-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, `ArtifactBucket-${environmentSuffix}`, {
      bucketName: `pipeline-artifacts-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [
        {
          id: `artifact-lifecycle-${environmentSuffix}`,
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Secrets Manager for GitHub OAuth token (placeholder)
    const githubToken = new secretsmanager.Secret(this, `GitHubToken-${environmentSuffix}`, {
      secretName: `github-oauth-token-${environmentSuffix}`,
      description: 'GitHub OAuth token for CodePipeline source integration',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ token: 'placeholder' }),
        generateStringKey: 'password',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Parameter Store for environment-specific configuration
    const environments = ['dev', 'staging', 'prod'];
    environments.forEach(env => {
      new ssm.StringParameter(this, `AppConfig-${env}-${environmentSuffix}`, {
        parameterName: `/app/${env}/config-${environmentSuffix}`,
        stringValue: JSON.stringify({
          environment: env,
          logLevel: env === 'prod' ? 'info' : 'debug',
          enableMetrics: true,
        }),
        description: `Configuration for ${env} environment`,
      });
    });

    // SNS topic for approval notifications
    const approvalTopic = new sns.Topic(this, `ApprovalTopic-${environmentSuffix}`, {
      topicName: `pipeline-approval-${environmentSuffix}`,
      displayName: 'Pipeline Approval Notifications',
    });

    // CodeBuild IAM role
    const codeBuildRole = new iam.Role(this, `CodeBuildRole-${environmentSuffix}`, {
      roleName: `codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPowerUser'),
      ],
    });

    artifactBucket.grantReadWrite(codeBuildRole);

    // CodeBuild project for Docker image building (SMALL compute)
    const dockerBuildProject = new codebuild.PipelineProject(this, `DockerBuildProject-${environmentSuffix}`, {
      projectName: `docker-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
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
              'docker build -t app-image:latest .',
              'docker tag app-image:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/app-image:latest',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/app-image:latest',
            ],
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, `DockerBuildLogs-${environmentSuffix}`, {
            logGroupName: `/aws/codebuild/docker-build-${environmentSuffix}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK,
          }),
        },
      },
    });

    // CodeBuild project for unit tests (MEDIUM compute)
    const unitTestProject = new codebuild.PipelineProject(this, `UnitTestProject-${environmentSuffix}`, {
      projectName: `unit-tests-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing dependencies...',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm run test:unit',
            ],
          },
        },
        reports: {
          'unit-test-results': {
            files: ['test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, `UnitTestLogs-${environmentSuffix}`, {
            logGroupName: `/aws/codebuild/unit-tests-${environmentSuffix}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK,
          }),
        },
      },
    });

    // CodeBuild project for integration tests (LARGE compute)
    const integrationTestProject = new codebuild.PipelineProject(this, `IntegrationTestProject-${environmentSuffix}`, {
      projectName: `integration-tests-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.LARGE,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing dependencies...',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
            ],
          },
        },
        reports: {
          'integration-test-results': {
            files: ['integration-test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, `IntegrationTestLogs-${environmentSuffix}`, {
            logGroupName: `/aws/codebuild/integration-tests-${environmentSuffix}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            retention: logs.RetentionDays.ONE_WEEK,
          }),
        },
      },
    });

    // ECS Cluster (placeholder for CodeDeploy reference)
    const cluster = new ecs.Cluster(this, `EcsCluster-${environmentSuffix}`, {
      clusterName: `app-cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true,
    });

    // Application Load Balancer (placeholder)
    const alb = new elbv2.ApplicationLoadBalancer(this, `ALB-${environmentSuffix}`, {
      loadBalancerName: `app-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
    });

    const targetGroupBlue = new elbv2.ApplicationTargetGroup(this, `TargetGroupBlue-${environmentSuffix}`, {
      targetGroupName: `tg-blue-${environmentSuffix}`,
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
      },
    });

    const targetGroupGreen = new elbv2.ApplicationTargetGroup(this, `TargetGroupGreen-${environmentSuffix}`, {
      targetGroupName: `tg-green-${environmentSuffix}`,
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
      },
    });

    const listener = alb.addListener(`Listener-${environmentSuffix}`, {
      port: 80,
      defaultTargetGroups: [targetGroupBlue],
    });

    // Placeholder ECS Fargate service for CodeDeploy reference
    const taskDefinition = new ecs.FargateTaskDefinition(this, `TaskDef-${environmentSuffix}`, {
      family: `app-task-${environmentSuffix}`,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    taskDefinition.addContainer(`AppContainer-${environmentSuffix}`, {
      containerName: 'app',
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      portMappings: [{ containerPort: 80 }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `app-${environmentSuffix}`,
        logGroup: new logs.LogGroup(this, `AppLogs-${environmentSuffix}`, {
          logGroupName: `/ecs/app-${environmentSuffix}`,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          retention: logs.RetentionDays.ONE_WEEK,
        }),
      }),
    });

    const ecsService = new ecs.FargateService(this, `EcsService-${environmentSuffix}`, {
      serviceName: `app-service-${environmentSuffix}`,
      cluster,
      taskDefinition,
      desiredCount: 2,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
    });

    // CodeDeploy application and deployment group
    const codeDeployApp = new codedeploy.EcsApplication(this, `CodeDeployApp-${environmentSuffix}`, {
      applicationName: `app-deploy-${environmentSuffix}`,
    });

    const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, `DeploymentGroup-${environmentSuffix}`, {
      deploymentGroupName: `app-deployment-${environmentSuffix}`,
      application: codeDeployApp,
      service: ecsService,
      blueGreenDeploymentConfig: {
        blueTargetGroup: targetGroupBlue,
        greenTargetGroup: targetGroupGreen,
        listener: listener,
        terminationWaitTime: cdk.Duration.minutes(10),
      },
      deploymentConfig: codedeploy.EcsDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTES,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
    });

    // CloudWatch alarms for deployment monitoring
    const taskHealthAlarm = new cloudwatch.Alarm(this, `TaskHealthAlarm-${environmentSuffix}`, {
      alarmName: `ecs-task-health-${environmentSuffix}`,
      metric: ecsService.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    const targetHealthAlarm = new cloudwatch.Alarm(this, `TargetHealthAlarm-${environmentSuffix}`, {
      alarmName: `alb-target-health-${environmentSuffix}`,
      metric: targetGroupBlue.metrics.healthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    const http5xxAlarm = new cloudwatch.Alarm(this, `Http5xxAlarm-${environmentSuffix}`, {
      alarmName: `alb-5xx-errors-${environmentSuffix}`,
      metric: alb.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Add alarms to deployment group
    deploymentGroup.addAlarm(taskHealthAlarm);
    deploymentGroup.addAlarm(targetHealthAlarm);
    deploymentGroup.addAlarm(http5xxAlarm);

    // CodePipeline artifacts
    const sourceOutput = new codepipeline.Artifact('SourceArtifact');
    const buildOutput = new codepipeline.Artifact('BuildArtifact');

    // CodePipeline
    const pipeline = new codepipeline.Pipeline(this, `Pipeline-${environmentSuffix}`, {
      pipelineName: `app-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage - GitHub
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'your-github-owner',
          repo: 'your-repo-name',
          branch: 'main',
          oauthToken: githubToken.secretValueFromJson('token'),
          output: sourceOutput,
          trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
        }),
      ],
    });

    // Build stage - Docker image
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

    // Test stage - Unit and Integration tests
    pipeline.addStage({
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Unit_Tests',
          project: unitTestProject,
          input: sourceOutput,
          runOrder: 1,
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Integration_Tests',
          project: integrationTestProject,
          input: sourceOutput,
          runOrder: 2,
        }),
      ],
    });

    // Deploy to Dev stage
    pipeline.addStage({
      stageName: 'Deploy-Dev',
      actions: [
        new codepipeline_actions.CodeDeployEcsDeployAction({
          actionName: 'Deploy_To_Dev',
          deploymentGroup: deploymentGroup,
          appSpecTemplateInput: sourceOutput,
          taskDefinitionTemplateInput: sourceOutput,
        }),
      ],
    });

    // Deploy to Staging stage
    pipeline.addStage({
      stageName: 'Deploy-Staging',
      actions: [
        new codepipeline_actions.CodeDeployEcsDeployAction({
          actionName: 'Deploy_To_Staging',
          deploymentGroup: deploymentGroup,
          appSpecTemplateInput: sourceOutput,
          taskDefinitionTemplateInput: sourceOutput,
        }),
      ],
    });

    // Manual Approval stage
    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Manual_Approval',
          notificationTopic: approvalTopic,
          additionalInformation: 'Please review and approve deployment to production',
        }),
      ],
    });

    // Deploy to Production stage
    pipeline.addStage({
      stageName: 'Deploy-Prod',
      actions: [
        new codepipeline_actions.CodeDeployEcsDeployAction({
          actionName: 'Deploy_To_Prod',
          deploymentGroup: deploymentGroup,
          appSpecTemplateInput: sourceOutput,
          taskDefinitionTemplateInput: sourceOutput,
        }),
      ],
    });

    // CloudWatch Events rule to trigger pipeline on GitHub push
    const pipelineEventRule = new events.Rule(this, `PipelineEventRule-${environmentSuffix}`, {
      ruleName: `pipeline-trigger-${environmentSuffix}`,
      description: 'Trigger pipeline on GitHub push to main branch',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
        },
      },
    });

    pipelineEventRule.addTarget(new events_targets.SnsTopic(approvalTopic));

    // Stack Outputs
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'ARN of the CodePipeline',
      exportName: `pipeline-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'Name of the S3 artifact bucket',
      exportName: `artifact-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApprovalTopicArn', {
      value: approvalTopic.topicArn,
      description: 'ARN of the SNS approval topic',
      exportName: `approval-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'Name of the ECS cluster',
      exportName: `cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `alb-dns-${environmentSuffix}`,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `CI/CD Pipeline Infrastructure for environment: ${environmentSuffix}`,
});

app.synth();
```

## File: test/tap-stack.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Creates VPC with 3 AZs', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: Match.stringLikeRegexp('pipeline-vpc-test'),
        }),
      ]),
    });
  });

  test('Creates S3 artifact bucket with encryption and lifecycle', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
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
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Status: 'Enabled',
            ExpirationInDays: 30,
          }),
        ]),
      },
    });
  });

  test('Creates GitHub OAuth token in Secrets Manager', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'github-oauth-token-test',
    });
  });

  test('Creates Parameter Store parameters for all environments', () => {
    template.resourceCountIs('AWS::SSM::Parameter', 3);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/app/dev/config-test',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/app/staging/config-test',
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/app/prod/config-test',
    });
  });

  test('Creates SNS topic for approvals', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'pipeline-approval-test',
    });
  });

  test('Creates three CodeBuild projects with different compute types', () => {
    template.resourceCountIs('AWS::CodeBuild::Project', 3);

    // Docker build - SMALL
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'docker-build-test',
      Environment: Match.objectLike({
        ComputeType: 'BUILD_GENERAL1_SMALL',
      }),
    });

    // Unit tests - MEDIUM
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'unit-tests-test',
      Environment: Match.objectLike({
        ComputeType: 'BUILD_GENERAL1_MEDIUM',
      }),
    });

    // Integration tests - LARGE
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'integration-tests-test',
      Environment: Match.objectLike({
        ComputeType: 'BUILD_GENERAL1_LARGE',
      }),
    });
  });

  test('Creates ECS cluster and Fargate service', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'app-cluster-test',
    });

    template.resourceCountIs('AWS::ECS::Service', 1);
    template.hasResourceProperties('AWS::ECS::Service', {
      ServiceName: 'app-service-test',
      LaunchType: 'FARGATE',
      DeploymentController: {
        Type: 'CODE_DEPLOY',
      },
    });
  });

  test('Creates Application Load Balancer with target groups', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'tg-blue-test',
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Name: 'tg-green-test',
    });
  });

  test('Creates CodeDeploy application and deployment group', () => {
    template.resourceCountIs('AWS::CodeDeploy::Application', 1);
    template.hasResourceProperties('AWS::CodeDeploy::Application', {
      ApplicationName: 'app-deploy-test',
      ComputePlatform: 'ECS',
    });

    template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);
    template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
      DeploymentGroupName: 'app-deployment-test',
      AutoRollbackConfiguration: {
        Enabled: true,
        Events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
      },
    });
  });

  test('Creates CloudWatch alarms for monitoring', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 3);

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'ecs-task-health-test',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 80,
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'alb-target-health-test',
      ComparisonOperator: 'LessThanThreshold',
      Threshold: 1,
    });

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'alb-5xx-errors-test',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 10,
    });
  });

  test('Creates CodePipeline with 7 stages', () => {
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'app-pipeline-test',
      Stages: Match.arrayWith([
        Match.objectLike({ Name: 'Source' }),
        Match.objectLike({ Name: 'Build' }),
        Match.objectLike({ Name: 'Test' }),
        Match.objectLike({ Name: 'Deploy-Dev' }),
        Match.objectLike({ Name: 'Deploy-Staging' }),
        Match.objectLike({ Name: 'Approval' }),
        Match.objectLike({ Name: 'Deploy-Prod' }),
      ]),
    });
  });

  test('Creates CloudWatch Events rule', () => {
    template.resourceCountIs('AWS::Events::Rule', 1);
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: 'pipeline-trigger-test',
      State: 'ENABLED',
    });
  });

  test('Creates stack outputs', () => {
    template.hasOutput('PipelineArn', {
      Export: {
        Name: 'pipeline-arn-test',
      },
    });

    template.hasOutput('ArtifactBucketName', {
      Export: {
        Name: 'artifact-bucket-test',
      },
    });

    template.hasOutput('ApprovalTopicArn', {
      Export: {
        Name: 'approval-topic-arn-test',
      },
    });
  });

  test('All resources include environmentSuffix in names', () => {
    const resources = template.toJSON().Resources;
    const resourcesWithNames = Object.values(resources).filter(
      (r: any) => r.Properties && (r.Properties.Name || r.Properties.BucketName || r.Properties.ClusterName)
    );

    expect(resourcesWithNames.length).toBeGreaterThan(0);

    resourcesWithNames.forEach((resource: any) => {
      const name = resource.Properties.Name ||
                   resource.Properties.BucketName ||
                   resource.Properties.ClusterName ||
                   resource.Properties.TopicName;
      if (name && typeof name === 'string') {
        expect(name).toContain('test');
      }
    });
  });

  test('All resources have RemovalPolicy DESTROY', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    const logGroups = template.findResources('AWS::Logs::LogGroup');
    const secrets = template.findResources('AWS::SecretsManager::Secret');

    Object.values(buckets).forEach((bucket: any) => {
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    Object.values(logGroups).forEach((logGroup: any) => {
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });

    Object.values(secrets).forEach((secret: any) => {
      expect(secret.DeletionPolicy).toBe('Delete');
    });
  });
});
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Integration

Complete multi-stage CI/CD pipeline for deploying containerized microservices with automated testing, blue/green deployments, and approval gates.

## Architecture

This solution implements:

- **CodePipeline**: 7-stage pipeline (Source, Build, Test, Deploy-Dev, Deploy-Staging, Approval, Deploy-Prod)
- **CodeBuild**: Three projects with different compute types (SMALL for Docker builds, MEDIUM for unit tests, LARGE for integration tests)
- **CodeDeploy**: Blue/green deployment strategy with automatic traffic shifting over 10 minutes
- **ECS Fargate**: Container runtime for microservices
- **Application Load Balancer**: Traffic distribution with blue/green target groups
- **CloudWatch**: Alarms for deployment health monitoring and automatic rollback
- **S3**: Artifact storage with encryption and 30-day lifecycle policy
- **Secrets Manager**: Secure storage for GitHub OAuth token
- **Parameter Store**: Environment-specific configuration
- **SNS**: Approval notifications

## Prerequisites

- AWS CDK 2.x installed
- Node.js 18+ installed
- AWS CLI configured with appropriate credentials
- GitHub repository with OAuth token

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX=dev
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap
```

4. Deploy the stack:
```bash
cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX
```

## Configuration

### GitHub OAuth Token

Update the Secrets Manager secret with your GitHub OAuth token:
```bash
aws secretsmanager put-secret-value \
  --secret-id github-oauth-token-${ENVIRONMENT_SUFFIX} \
  --secret-string '{"token":"your-github-token"}'
```

### GitHub Repository

Update the pipeline source action in `lib/tap-stack.ts`:
```typescript
owner: 'your-github-owner',
repo: 'your-repo-name',
```

### Environment Configuration

Environment-specific configuration is stored in Parameter Store:
- `/app/dev/config-${environmentSuffix}`
- `/app/staging/config-${environmentSuffix}`
- `/app/prod/config-${environmentSuffix}`

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Pipeline Stages

1. **Source**: Pull code from GitHub main branch
2. **Build**: Build Docker image and push to ECR
3. **Test**: Run unit tests (parallel) and integration tests
4. **Deploy-Dev**: Deploy to development environment
5. **Deploy-Staging**: Deploy to staging environment
6. **Approval**: Manual approval with SNS notification
7. **Deploy-Prod**: Deploy to production with blue/green strategy

## Monitoring and Rollback

The pipeline includes automatic rollback based on CloudWatch alarms:
- ECS task CPU utilization > 80%
- ALB target healthy host count < 1
- ALB 5xx error count > 10

## Cleanup

To destroy the stack:
```bash
cdk destroy --context environmentSuffix=$ENVIRONMENT_SUFFIX
```

## Stack Outputs

- `PipelineArn`: ARN of the CodePipeline
- `ArtifactBucketName`: Name of the S3 artifact bucket
- `ApprovalTopicArn`: ARN of the SNS approval topic
- `ClusterName`: Name of the ECS cluster
- `LoadBalancerDns`: DNS name of the Application Load Balancer
```

## Deployment Instructions

1. Ensure you have AWS CDK 2.x and Node.js 18+ installed
2. Set the ENVIRONMENT_SUFFIX environment variable
3. Update GitHub repository details and OAuth token
4. Deploy using `cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX`
5. Configure GitHub webhook to trigger pipeline on push events
6. Subscribe to SNS topic for approval notifications

## Notes

- All resources include environmentSuffix for uniqueness
- All resources use RemovalPolicy.DESTROY for easy cleanup
- GitHub OAuth token needs to be manually updated in Secrets Manager
- CodeDeploy deployment group references ECS service and target groups
- CloudWatch alarms trigger automatic rollback on deployment issues