### Reasoning Trace
---

Let me analyze the requirements and create a comprehensive CDK program for a multi-account CI/CD pipeline:

Key Requirements:
1. Multi-stage pipeline: Source → Build → Test → Deploy (Staging) → Approval → Deploy (Prod)
2. S3 artifact storage with versioning and encryption
3. ECR repositories for custom build images
4. CodeBuild projects for build/test stages
5. CodeDeploy for ECS blue-green deployments
6. Manual approval between staging and production
7. CloudWatch monitoring and automatic rollback
8. SNS notifications
9. Least-privilege IAM
10. Multi-account support
11. 30-day CloudWatch log retention

I need to create:
- main.ts: CDK app entry point
- tapstack.ts: Complete pipeline implementation

Let me structure the solution:

1. S3 artifact bucket with encryption and versioning
2. ECR repositories for build images with lifecycle policies
3. CodeBuild projects for build, test, and container image creation
4. CodePipeline with all stages connected
5. CodeDeploy applications for blue-green ECS deployments
6. CloudWatch alarms for rollback triggers
7. SNS topics for notifications
8. IAM roles with least privilege
9. CloudWatch log groups with retention
10. Multi-account support through cross-account roles

I'll use the naming convention: {company}-{service}-{environment}-{resource}
For this example, I'll use "acme" as company and "microservice" as service.
### Answer 
---

```typescript
// main.ts
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();

// Account IDs from context or environment
const devAccountId = app.node.tryGetContext('devAccountId') || process.env.CDK_DEFAULT_ACCOUNT;
const stagingAccountId = app.node.tryGetContext('stagingAccountId') || process.env.CDK_DEFAULT_ACCOUNT;
const prodAccountId = app.node.tryGetContext('prodAccountId') || process.env.CDK_DEFAULT_ACCOUNT;

new TapStack(app, 'acme-microservice-pipeline-stack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  devAccountId: devAccountId!,
  stagingAccountId: stagingAccountId!,
  prodAccountId: prodAccountId!,
  serviceName: 'microservice',
  companyName: 'acme',
  tags: {
    Environment: 'shared',
    Team: 'platform',
    CostCenter: 'engineering'
  }
});

app.synth();
```

```typescript
// tapstack.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  devAccountId: string;
  stagingAccountId: string;
  prodAccountId: string;
  serviceName: string;
  companyName: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { devAccountId, stagingAccountId, prodAccountId, serviceName, companyName } = props;

    // 🔹 KMS Key for Encryption
    const encryptionKey = new kms.Key(this, 'PipelineEncryptionKey', {
      alias: `${companyName}-${serviceName}-pipeline-key`,
      description: 'Encryption key for CI/CD pipeline artifacts and logs',
      enableKeyRotation: true,
    });

    // Grant access to cross-account principals
    encryptionKey.grantEncryptDecrypt(new iam.AccountPrincipal(devAccountId));
    encryptionKey.grantEncryptDecrypt(new iam.AccountPrincipal(stagingAccountId));
    encryptionKey.grantEncryptDecrypt(new iam.AccountPrincipal(prodAccountId));

    // 🔹 Artifact Store
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `${companyName}-${serviceName}-pipeline-artifacts-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{
        id: 'delete-old-artifacts',
        expiration: cdk.Duration.days(90),
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
    });

    // Cross-account bucket policy
    artifactBucket.addToResourcePolicy(new iam.PolicyStatement({
      principals: [
        new iam.AccountPrincipal(devAccountId),
        new iam.AccountPrincipal(stagingAccountId),
        new iam.AccountPrincipal(prodAccountId),
      ],
      actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
      resources: [artifactBucket.bucketArn, `${artifactBucket.bucketArn}/*`],
    }));

    // 🔹 ECR Repository for Build Images
    const buildImageRepo = new ecr.Repository(this, 'BuildImageRepository', {
      repositoryName: `${companyName}-${serviceName}-build-images`,
      lifecycleRules: [{
        description: 'Keep only last 10 images',
        maxImageCount: 10,
      }],
      imageScanOnPush: true,
    });

    // Grant cross-account pull permissions
    buildImageRepo.grantPull(new iam.AccountPrincipal(devAccountId));
    buildImageRepo.grantPull(new iam.AccountPrincipal(stagingAccountId));
    buildImageRepo.grantPull(new iam.AccountPrincipal(prodAccountId));

    // 🔹 SNS Topics
    const pipelineNotificationsTopic = new sns.Topic(this, 'PipelineNotificationsTopic', {
      topicName: `${companyName}-${serviceName}-pipeline-notifications`,
      displayName: 'CI/CD Pipeline Notifications',
    });

    const approvalNotificationsTopic = new sns.Topic(this, 'ApprovalNotificationsTopic', {
      topicName: `${companyName}-${serviceName}-approval-requests`,
      displayName: 'Pipeline Approval Requests',
    });

    // 🔹 CloudWatch Log Groups
    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/${companyName}/${serviceName}/codebuild/build`,
      retention: logs.RetentionDays.THIRTY_DAYS,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const testLogGroup = new logs.LogGroup(this, 'TestLogGroup', {
      logGroupName: `/${companyName}/${serviceName}/codebuild/test`,
      retention: logs.RetentionDays.THIRTY_DAYS,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const imageLogGroup = new logs.LogGroup(this, 'ImageLogGroup', {
      logGroupName: `/${companyName}/${serviceName}/codebuild/image`,
      retention: logs.RetentionDays.THIRTY_DAYS,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `${companyName}-${serviceName}-build`,
      description: 'Build and compile microservice',
      encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromEcrRepository(buildImageRepo, 'latest'),
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: false,
      },
      environmentVariables: {
        SERVICE_NAME: { value: serviceName },
        COMPANY_NAME: { value: companyName },
      },
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
      cache: codebuild.Cache.s3(artifactBucket, {
        prefix: 'build-cache',
      }),
    });

    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: `${companyName}-${serviceName}-test`,
      description: 'Run unit and integration tests',
      encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromEcrRepository(buildImageRepo, 'latest'),
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: false,
      },
      environmentVariables: {
        SERVICE_NAME: { value: serviceName },
        COMPANY_NAME: { value: companyName },
      },
      logging: {
        cloudWatch: {
          logGroup: testLogGroup,
        },
      },
    });

    const imageProject = new codebuild.PipelineProject(this, 'ImageProject', {
      projectName: `${companyName}-${serviceName}-image-build`,
      description: 'Build and push container image',
      encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromEcrRepository(buildImageRepo, 'latest'),
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true, // Required for Docker builds
      },
      environmentVariables: {
        SERVICE_NAME: { value: serviceName },
        COMPANY_NAME: { value: companyName },
        ECR_REPO_URI: { value: buildImageRepo.repositoryUri },
      },
      logging: {
        cloudWatch: {
          logGroup: imageLogGroup,
        },
      },
    });

    // Grant ECR permissions to image build project
    buildImageRepo.grantPullPush(imageProject);

    // 🔹 CodeDeploy Applications
    const stagingDeployApp = new codedeploy.EcsApplication(this, 'StagingDeployApp', {
      applicationName: `${companyName}-${serviceName}-staging-deploy`,
    });

    const prodDeployApp = new codedeploy.EcsApplication(this, 'ProdDeployApp', {
      applicationName: `${companyName}-${serviceName}-prod-deploy`,
    });

    // 🔹 CloudWatch Alarms for Rollback
    const stagingDeploymentAlarm = new cloudwatch.Alarm(this, 'StagingDeploymentAlarm', {
      alarmName: `${companyName}-${serviceName}-staging-deployment-failures`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeDeploy',
        metricName: 'Deployments',
        dimensionsMap: {
          ApplicationName: stagingDeployApp.applicationName,
          DeploymentGroupName: `${companyName}-${serviceName}-staging`,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const prodDeploymentAlarm = new cloudwatch.Alarm(this, 'ProdDeploymentAlarm', {
      alarmName: `${companyName}-${serviceName}-prod-deployment-failures`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeDeploy',
        metricName: 'Deployments',
        dimensionsMap: {
          ApplicationName: prodDeployApp.applicationName,
          DeploymentGroupName: `${companyName}-${serviceName}-prod`,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm actions
    stagingDeploymentAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(pipelineNotificationsTopic));
    prodDeploymentAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(pipelineNotificationsTopic));

    // 🔹 IAM Roles
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `${companyName}-${serviceName}-pipeline-role`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipelineFullAccess'),
      ],
    });

    // Grant pipeline role permissions
    artifactBucket.grantReadWrite(pipelineRole);
    encryptionKey.grantEncryptDecrypt(pipelineRole);

    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      roleName: `${companyName}-${serviceName}-codedeploy-role`,
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployRoleForECS'),
      ],
    });

    // Cross-account trust for CodeDeploy
    codeDeployRole.assumeRolePolicy?.addStatements(new iam.PolicyStatement({
      principals: [
        new iam.AccountPrincipal(stagingAccountId),
        new iam.AccountPrincipal(prodAccountId),
      ],
      actions: ['sts:AssumeRole'],
    }));

    // 🔹 Pipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');
    const imageOutput = new codepipeline.Artifact('ImageOutput');

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${companyName}-${serviceName}-pipeline`,
      artifactBucket,
      role: pipelineRole,
      restartExecutionOnUpdate: true,
    });

    // Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'SourceAction',
          bucket: artifactBucket,
          bucketKey: 'source.zip',
          output: sourceOutput,
          trigger: codepipeline_actions.S3Trigger.EVENTS,
        }),
      ],
    });

    // Build Stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAction',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
          environmentVariables: {
            ENVIRONMENT: { value: 'build' },
          },
        }),
      ],
    });

    // Test Stage
    pipeline.addStage({
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'TestAction',
          project: testProject,
          input: buildOutput,
          outputs: [testOutput],
          environmentVariables: {
            ENVIRONMENT: { value: 'test' },
          },
        }),
      ],
    });

    // Container Image Build Stage
    pipeline.addStage({
      stageName: 'ImageBuild',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'ImageBuildAction',
          project: imageProject,
          input: testOutput,
          outputs: [imageOutput],
          environmentVariables: {
            ENVIRONMENT: { value: 'image' },
          },
        }),
      ],
    });

    // Staging Deployment Stage
    const stagingDeploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'StagingDeploymentGroup', {
      application: stagingDeployApp,
      deploymentGroupName: `${companyName}-${serviceName}-staging`,
      service: codedeploy.BaseService.fromServiceArnForEcs(
        this,
        'StagingService',
        `arn:aws:ecs:${this.region}:${stagingAccountId}:service/${companyName}-${serviceName}-staging-cluster/${companyName}-${serviceName}-staging-service`
      ),
      blueGreenDeploymentConfig: {
        blueTargetGroup: codedeploy.TargetGroup.fromTargetGroupAttributes(
          this,
          'StagingBlueTarget',
          {
            targetGroupName: `${companyName}-${serviceName}-staging-blue`,
          }
        ),
        greenTargetGroup: codedeploy.TargetGroup.fromTargetGroupAttributes(
          this,
          'StagingGreenTarget',
          {
            targetGroupName: `${companyName}-${serviceName}-staging-green`,
          }
        ),
        listener: codedeploy.EcsDeploymentGroupProps.fromListenerArn(
          `arn:aws:elasticloadbalancing:${this.region}:${stagingAccountId}:listener/${companyName}-${serviceName}-staging-alb`
        ),
        terminateBlueInstancesOnDeploymentSuccess: true,
        deploymentApprovalWaitTime: cdk.Duration.minutes(5),
      },
      role: codeDeployRole,
      alarms: [stagingDeploymentAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
    });

    pipeline.addStage({
      stageName: 'DeployStaging',
      actions: [
        new codepipeline_actions.CodeDeployEcsDeployAction({
          actionName: 'DeployStagingAction',
          deploymentGroup: stagingDeploymentGroup,
          taskDefinitionTemplateInput: imageOutput,
          appSpecTemplateInput: imageOutput,
          runOrder: 1,
        }),
      ],
    });

    // Manual Approval Stage
    pipeline.addStage({
      stageName: 'ApprovalStage',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'ProductionApproval',
          notificationTopic: approvalNotificationsTopic,
          additionalInformation: 'Please review staging deployment and approve production release',
          runOrder: 1,
        }),
      ],
    });

    // Production Deployment Stage
    const prodDeploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'ProdDeploymentGroup', {
      application: prodDeployApp,
      deploymentGroupName: `${companyName}-${serviceName}-prod`,
      service: codedeploy.BaseService.fromServiceArnForEcs(
        this,
        'ProdService',
        `arn:aws:ecs:${this.region}:${prodAccountId}:service/${companyName}-${serviceName}-prod-cluster/${companyName}-${serviceName}-prod-service`
      ),
      blueGreenDeploymentConfig: {
        blueTargetGroup: codedeploy.TargetGroup.fromTargetGroupAttributes(
          this,
          'ProdBlueTarget',
          {
            targetGroupName: `${companyName}-${serviceName}-prod-blue`,
          }
        ),
        greenTargetGroup: codedeploy.TargetGroup.fromTargetGroupAttributes(
          this,
          'ProdGreenTarget',
          {
            targetGroupName: `${companyName}-${serviceName}-prod-green`,
          }
        ),
        listener: codedeploy.EcsDeploymentGroupProps.fromListenerArn(
          `arn:aws:elasticloadbalancing:${this.region}:${prodAccountId}:listener/${companyName}-${serviceName}-prod-alb`
        ),
        terminateBlueInstancesOnDeploymentSuccess: true,
        deploymentApprovalWaitTime: cdk.Duration.minutes(30),
      },
      role: codeDeployRole,
      alarms: [prodDeploymentAlarm],
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
    });

    pipeline.addStage({
      stageName: 'DeployProduction',
      actions: [
        new codepipeline_actions.CodeDeployEcsDeployAction({
          actionName: 'DeployProductionAction',
          deploymentGroup: prodDeploymentGroup,
          taskDefinitionTemplateInput: imageOutput,
          appSpecTemplateInput: imageOutput,
          runOrder: 1,
        }),
      ],
    });

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `${companyName}-${serviceName}-pipeline-dashboard`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Pipeline Execution Status',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionSuccess',
                dimensionsMap: { PipelineName: pipeline.pipelineName },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionFailure',
                dimensionsMap: { PipelineName: pipeline.pipelineName },
              }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Build Duration',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodeBuild',
                metricName: 'Duration',
                dimensionsMap: { ProjectName: buildProject.projectName },
              }),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.SingleValueWidget({
            title: 'Total Deployments',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodeDeploy',
                metricName: 'Deployments',
                statistic: 'Sum',
              }),
            ],
            width: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Failed Deployments',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodeDeploy',
                metricName: 'Deployments',
                statistic: 'Sum',
                dimensionsMap: { Status: 'Failed' },
              }),
            ],
            width: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Rollback Count',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/CodeDeploy',
                metricName: 'Deployments',
                statistic: 'Sum',
                dimensionsMap: { Status: 'Rolled back' },
              }),
            ],
            width: 6,
          }),
        ],
      ],
    });

    // 🔹 Pipeline State Change Notifications
    pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(pipelineNotificationsTopic),
      description: 'Notify on pipeline state changes',
    });

    // 🔹 Stack Outputs
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'ARN of the CI/CD pipeline',
      exportName: `${companyName}-${serviceName}-pipeline-arn`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'Name of the artifact bucket',
      exportName: `${companyName}-${serviceName}-artifact-bucket`,
    });

    new cdk.CfnOutput(this, 'BuildImageRepoUri', {
      value: buildImageRepo.repositoryUri,
      description: 'URI of the build image ECR repository',
      exportName: `${companyName}-${serviceName}-build-image-repo`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
```