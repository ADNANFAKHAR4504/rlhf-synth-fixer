import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  serviceName?: string;
  companyName?: string;
  devAccountId?: string;
  stagingAccountId?: string;
  prodAccountId?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get configuration from props, context, or defaults
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const serviceName =
      props?.serviceName ||
      this.node.tryGetContext('serviceName') ||
      'microservice';
    const companyName =
      props?.companyName || this.node.tryGetContext('companyName') || 'acme';
    const devAccountId =
      props?.devAccountId ||
      this.node.tryGetContext('devAccountId') ||
      this.account;
    const stagingAccountId =
      props?.stagingAccountId ||
      this.node.tryGetContext('stagingAccountId') ||
      this.account;
    const prodAccountId =
      props?.prodAccountId ||
      this.node.tryGetContext('prodAccountId') ||
      this.account;

    // 🔹 KMS Key for Encryption
    const encryptionKey = new kms.Key(this, 'PipelineEncryptionKey', {
      alias: `${companyName}-${serviceName}-${environmentSuffix}-pipeline-key`,
      description: 'Encryption key for CI/CD pipeline artifacts and logs',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pendingWindow: cdk.Duration.days(7), // 7-day waiting period before key can be deleted
    });

    // Grant access to cross-account principals
    encryptionKey.grantEncryptDecrypt(new iam.AccountPrincipal(devAccountId));
    encryptionKey.grantEncryptDecrypt(
      new iam.AccountPrincipal(stagingAccountId)
    );
    encryptionKey.grantEncryptDecrypt(new iam.AccountPrincipal(prodAccountId));

    // Grant CloudWatch Logs permission to use the key for encryption
    encryptionKey.grant(
      new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
      'kms:Encrypt',
      'kms:Decrypt',
      'kms:ReEncrypt*',
      'kms:GenerateDataKey*',
      'kms:DescribeKey'
    );

    // 🔹 Artifact Store
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `${companyName}-${serviceName}-${environmentSuffix}-pipeline-artifacts-${this.account}`,
      versioned: false,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'delete-old-artifacts',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Cross-account bucket policy
    artifactBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [
          new iam.AccountPrincipal(devAccountId),
          new iam.AccountPrincipal(stagingAccountId),
          new iam.AccountPrincipal(prodAccountId),
        ],
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [artifactBucket.bucketArn, `${artifactBucket.bucketArn}/*`],
      })
    );

    // 🔹 ECR Repository for Build Images
    const buildImageRepo = new ecr.Repository(this, 'BuildImageRepository', {
      repositoryName: `${companyName}-${serviceName}-${environmentSuffix}-build-images`,
      lifecycleRules: [
        {
          description: 'Keep only last 10 images',
          maxImageCount: 10,
        },
      ],
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true, // Delete all images when repository is deleted
    });

    // Grant cross-account pull permissions
    buildImageRepo.grantPull(new iam.AccountPrincipal(devAccountId));
    buildImageRepo.grantPull(new iam.AccountPrincipal(stagingAccountId));
    buildImageRepo.grantPull(new iam.AccountPrincipal(prodAccountId));

    // 🔹 SNS Topics
    const pipelineNotificationsTopic = new sns.Topic(
      this,
      'PipelineNotificationsTopic',
      {
        topicName: `${companyName}-${serviceName}-${environmentSuffix}-pipeline-notifications`,
        displayName: 'CI/CD Pipeline Notifications',
      }
    );

    const approvalNotificationsTopic = new sns.Topic(
      this,
      'ApprovalNotificationsTopic',
      {
        topicName: `${companyName}-${serviceName}-${environmentSuffix}-approval-requests`,
        displayName: 'Pipeline Approval Requests',
      }
    );

    // 🔹 CloudWatch Log Groups
    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/${companyName}/${serviceName}/${environmentSuffix}/codebuild/build`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const testLogGroup = new logs.LogGroup(this, 'TestLogGroup', {
      logGroupName: `/${companyName}/${serviceName}/${environmentSuffix}/codebuild/test`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const imageLogGroup = new logs.LogGroup(this, 'ImageLogGroup', {
      logGroupName: `/${companyName}/${serviceName}/${environmentSuffix}/codebuild/image`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `${companyName}-${serviceName}-${environmentSuffix}-build`,
      description: 'Build and compile microservice',
      encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromEcrRepository(
          buildImageRepo,
          'latest'
        ),
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
      cache: codebuild.Cache.bucket(artifactBucket, {
        prefix: 'build-cache',
      }),
    });

    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: `${companyName}-${serviceName}-${environmentSuffix}-test`,
      description: 'Run unit and integration tests',
      encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromEcrRepository(
          buildImageRepo,
          'latest'
        ),
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
      projectName: `${companyName}-${serviceName}-${environmentSuffix}-image-build`,
      description: 'Build and push container image',
      encryptionKey,
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromEcrRepository(
          buildImageRepo,
          'latest'
        ),
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
    const stagingDeployApp = new codedeploy.EcsApplication(
      this,
      'StagingDeployApp',
      {
        applicationName: `${companyName}-${serviceName}-${environmentSuffix}-staging-deploy`,
      }
    );

    const prodDeployApp = new codedeploy.EcsApplication(this, 'ProdDeployApp', {
      applicationName: `${companyName}-${serviceName}-${environmentSuffix}-prod-deploy`,
    });

    // 🔹 CloudWatch Alarms for Rollback
    const stagingDeploymentAlarm = new cloudwatch.Alarm(
      this,
      'StagingDeploymentAlarm',
      {
        alarmName: `${companyName}-${serviceName}-${environmentSuffix}-staging-deployment-failures`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodeDeploy',
          metricName: 'Deployments',
          dimensionsMap: {
            ApplicationName: stagingDeployApp.applicationName,
            DeploymentGroupName: `${companyName}-${serviceName}-${environmentSuffix}-staging`,
          },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const prodDeploymentAlarm = new cloudwatch.Alarm(
      this,
      'ProdDeploymentAlarm',
      {
        alarmName: `${companyName}-${serviceName}-${environmentSuffix}-prod-deployment-failures`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodeDeploy',
          metricName: 'Deployments',
          dimensionsMap: {
            ApplicationName: prodDeployApp.applicationName,
            DeploymentGroupName: `${companyName}-${serviceName}-${environmentSuffix}-prod`,
          },
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Add alarm actions
    stagingDeploymentAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationsTopic)
    );
    prodDeploymentAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationsTopic)
    );

    // 🔹 IAM Roles
    const pipelineRole = new iam.Role(this, 'PipelineRole', {
      roleName: `${companyName}-${serviceName}-${environmentSuffix}-pipeline-role`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        CodePipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codepipeline:*',
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
                'codebuild:BatchGetProjects',
                'codedeploy:CreateDeployment',
                'codedeploy:GetApplication',
                'codedeploy:GetApplicationRevision',
                'codedeploy:GetDeployment',
                'codedeploy:GetDeploymentConfig',
                'codedeploy:RegisterApplicationRevision',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:ListBucket',
                'iam:PassRole',
                'sts:AssumeRole',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Grant pipeline role permissions
    artifactBucket.grantReadWrite(pipelineRole);
    encryptionKey.grantEncryptDecrypt(pipelineRole);

    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      roleName: `${companyName}-${serviceName}-${environmentSuffix}-codedeploy-role`,
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      inlinePolicies: {
        CodeDeployECSPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecs:CreateTaskSet',
                'ecs:DeleteTaskSet',
                'ecs:DescribeServices',
                'ecs:UpdateServicePrimaryTaskSet',
                'ecs:UpdateService',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeListeners',
                'elasticloadbalancing:ModifyListener',
                'elasticloadbalancing:DescribeRules',
                'elasticloadbalancing:ModifyRule',
                'lambda:InvokeFunction',
                'cloudwatch:DescribeAlarms',
                's3:GetObject',
                's3:GetObjectVersion',
                'sns:Publish',
                'iam:PassRole',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Cross-account trust for CodeDeploy
    codeDeployRole.assumeRolePolicy?.addStatements(
      new iam.PolicyStatement({
        principals: [
          new iam.AccountPrincipal(stagingAccountId),
          new iam.AccountPrincipal(prodAccountId),
        ],
        actions: ['sts:AssumeRole'],
      })
    );

    // 🔹 Pipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');
    const imageOutput = new codepipeline.Artifact('ImageOutput');

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${companyName}-${serviceName}-${environmentSuffix}-pipeline`,
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
    // Note: For minimal configuration, these ARNs should be provided via context or environment variables
    // when actual ECS services and load balancers are available
    const stagingServiceArn =
      this.node.tryGetContext('stagingServiceArn') ||
      `arn:aws:ecs:${this.region}:${stagingAccountId}:service/${companyName}-${serviceName}-staging-cluster/${companyName}-${serviceName}-staging-service`;

    // Check if we have a valid service ARN (not a placeholder/default)
    // If using default placeholder, skip creating ECS services and deployment groups
    const hasValidStagingService =
      this.node.tryGetContext('stagingServiceArn') !== undefined;

    const stagingBlueTargetGroupArn =
      this.node.tryGetContext('stagingBlueTargetGroupArn') ||
      `arn:aws:elasticloadbalancing:${this.region}:${stagingAccountId}:targetgroup/${companyName}-${serviceName}-staging-blue/1234567890123456`;
    const stagingGreenTargetGroupArn =
      this.node.tryGetContext('stagingGreenTargetGroupArn') ||
      `arn:aws:elasticloadbalancing:${this.region}:${stagingAccountId}:targetgroup/${companyName}-${serviceName}-staging-green/1234567890123456`;
    const stagingListenerArn =
      this.node.tryGetContext('stagingListenerArn') ||
      `arn:aws:elasticloadbalancing:${this.region}:${stagingAccountId}:listener/app/${companyName}-${serviceName}-staging-alb/1234567890123456/1234567890123456`;

    // Parse ARN to extract cluster and service names for minimal configuration
    const stagingServiceMatch = stagingServiceArn.match(
      /service\/([^\/]+)\/(.+)$/
    );
    const stagingClusterArn = stagingServiceArn.replace(
      /\/service\/[^\/]+\/.+$/,
      ''
    );
    const stagingClusterName = stagingServiceMatch
      ? stagingServiceMatch[1]
      : `${companyName}-${serviceName}-staging-cluster`;
    const stagingServiceName = stagingServiceMatch
      ? stagingServiceMatch[2]
      : `${companyName}-${serviceName}-staging-service`;

    // For minimal configuration, check if we have valid VPC information
    // If using placeholder VPC ID, skip creating ECS services (they require existing infrastructure)
    const stagingVpcId =
      this.node.tryGetContext('stagingVpcId') || 'vpc-00000000000000000';

    const stagingVpc = ec2.Vpc.fromVpcAttributes(this, 'StagingVpcRef', {
      vpcId: stagingVpcId,
      availabilityZones: [this.availabilityZones[0] || 'us-east-1a'],
      publicSubnetIds: [
        this.node.tryGetContext('stagingPublicSubnetId') ||
          'subnet-00000000000000000',
      ],
      privateSubnetIds: [
        this.node.tryGetContext('stagingPrivateSubnetId') ||
          'subnet-00000000000000001',
      ],
    });

    // Only create deployment resources if we have valid service ARN
    // For minimal configuration without actual infrastructure, skip deployment stages
    if (hasValidStagingService) {
      const stagingCluster = ecs.Cluster.fromClusterAttributes(
        this,
        'StagingCluster',
        {
          clusterName: stagingClusterName,
          clusterArn: stagingClusterArn,
          vpc: stagingVpc,
          securityGroups: [],
        }
      );

      // Get security group ID for staging (used for both service and listener)
      const stagingSecurityGroupId =
        this.node.tryGetContext('stagingSecurityGroupId') ||
        'sg-00000000000000000';

      // Create a minimal service reference for CodeDeploy
      // Note: This requires the cluster to exist, so only create if we have valid infrastructure
      const stagingTaskDef = new ecs.FargateTaskDefinition(
        this,
        'StagingTaskDef',
        {
          // Minimal task definition for reference only
        }
      );
      stagingTaskDef.addContainer('placeholder', {
        image: ecs.ContainerImage.fromRegistry('nginx:latest'),
        essential: true,
      });

      // Create a security group for the service (required even with desiredCount: 0)
      const stagingSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        'StagingServiceSG',
        this.node.tryGetContext('stagingServiceSecurityGroupId') ||
          stagingSecurityGroupId
      );

      const stagingService = new ecs.FargateService(this, 'StagingService', {
        cluster: stagingCluster,
        serviceName: stagingServiceName,
        taskDefinition: stagingTaskDef,
        desiredCount: 0, // Not actually deploying, just for reference
        deploymentController: {
          type: ecs.DeploymentControllerType.CODE_DEPLOY,
        },
        securityGroups: [stagingSecurityGroup],
      });

      const stagingBlueTargetGroup =
        elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
          this,
          'StagingBlueTarget',
          {
            targetGroupArn: stagingBlueTargetGroupArn,
          }
        );

      const stagingGreenTargetGroup =
        elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
          this,
          'StagingGreenTarget',
          {
            targetGroupArn: stagingGreenTargetGroupArn,
          }
        );

      const stagingListener =
        elbv2.ApplicationListener.fromApplicationListenerAttributes(
          this,
          'StagingListener',
          {
            listenerArn: stagingListenerArn,
            defaultPort: 80,
            securityGroup: ec2.SecurityGroup.fromSecurityGroupId(
              this,
              'StagingListenerSG',
              stagingSecurityGroupId
            ),
          }
        );

      const stagingDeploymentGroup = new codedeploy.EcsDeploymentGroup(
        this,
        'StagingDeploymentGroup',
        {
          application: stagingDeployApp,
          deploymentGroupName: `${companyName}-${serviceName}-${environmentSuffix}-staging`,
          service: stagingService,
          blueGreenDeploymentConfig: {
            blueTargetGroup: stagingBlueTargetGroup,
            greenTargetGroup: stagingGreenTargetGroup,
            listener: stagingListener,
            deploymentApprovalWaitTime: cdk.Duration.minutes(5),
            terminationWaitTime: cdk.Duration.minutes(5),
          },
          role: codeDeployRole,
          alarms: [stagingDeploymentAlarm],
          autoRollback: {
            failedDeployment: true,
            stoppedDeployment: true,
            deploymentInAlarm: true,
          },
        }
      );

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
    }

    // Production Deployment Stage
    // Note: For minimal configuration, these ARNs should be provided via context or environment variables
    // when actual ECS services and load balancers are available
    const prodServiceArn =
      this.node.tryGetContext('prodServiceArn') ||
      `arn:aws:ecs:${this.region}:${prodAccountId}:service/${companyName}-${serviceName}-prod-cluster/${companyName}-${serviceName}-prod-service`;

    // Check if we have a valid service ARN (not a placeholder/default)
    const hasValidProdService =
      this.node.tryGetContext('prodServiceArn') !== undefined;

    // Manual Approval Stage (only add if we have production deployment)
    if (hasValidProdService) {
      pipeline.addStage({
        stageName: 'ApprovalStage',
        actions: [
          new codepipeline_actions.ManualApprovalAction({
            actionName: 'ProductionApproval',
            notificationTopic: approvalNotificationsTopic,
            additionalInformation:
              'Please review staging deployment and approve production release',
            runOrder: 1,
          }),
        ],
      });
    }

    const prodBlueTargetGroupArn =
      this.node.tryGetContext('prodBlueTargetGroupArn') ||
      `arn:aws:elasticloadbalancing:${this.region}:${prodAccountId}:targetgroup/${companyName}-${serviceName}-prod-blue/1234567890123456`;
    const prodGreenTargetGroupArn =
      this.node.tryGetContext('prodGreenTargetGroupArn') ||
      `arn:aws:elasticloadbalancing:${this.region}:${prodAccountId}:targetgroup/${companyName}-${serviceName}-prod-green/1234567890123456`;
    const prodListenerArn =
      this.node.tryGetContext('prodListenerArn') ||
      `arn:aws:elasticloadbalancing:${this.region}:${prodAccountId}:listener/app/${companyName}-${serviceName}-prod-alb/1234567890123456/1234567890123456`;

    // Parse ARN to extract cluster and service names for minimal configuration
    const prodServiceMatch = prodServiceArn.match(/service\/([^\/]+)\/(.+)$/);
    const prodClusterArn = prodServiceArn.replace(/\/service\/[^\/]+\/.+$/, '');
    const prodClusterName = prodServiceMatch
      ? prodServiceMatch[1]
      : `${companyName}-${serviceName}-prod-cluster`;
    const prodServiceName = prodServiceMatch
      ? prodServiceMatch[2]
      : `${companyName}-${serviceName}-prod-service`;

    // For minimal configuration, use cluster attributes with VPC from context or create minimal VPC reference
    const prodVpcId =
      this.node.tryGetContext('prodVpcId') || 'vpc-00000000000000000';
    const prodVpc = ec2.Vpc.fromVpcAttributes(this, 'ProdVpcRef', {
      vpcId: prodVpcId,
      availabilityZones: [this.availabilityZones[0] || 'us-east-1a'],
      publicSubnetIds: [
        this.node.tryGetContext('prodPublicSubnetId') ||
          'subnet-00000000000000000',
      ],
      privateSubnetIds: [
        this.node.tryGetContext('prodPrivateSubnetId') ||
          'subnet-00000000000000001',
      ],
    });

    // Only create deployment resources if we have valid service ARN
    // For minimal configuration without actual infrastructure, skip deployment stages
    if (hasValidProdService) {
      const prodCluster = ecs.Cluster.fromClusterAttributes(
        this,
        'ProdCluster',
        {
          clusterName: prodClusterName,
          clusterArn: prodClusterArn,
          vpc: prodVpc,
          securityGroups: [],
        }
      );

      // Get security group ID for production (used for both service and listener)
      const prodSecurityGroupId =
        this.node.tryGetContext('prodSecurityGroupId') ||
        'sg-00000000000000000';

      // Create a minimal service reference for CodeDeploy
      // Note: This requires the cluster to exist, so only create if we have valid infrastructure
      const prodTaskDef = new ecs.FargateTaskDefinition(this, 'ProdTaskDef', {
        // Minimal task definition for reference only
      });
      prodTaskDef.addContainer('placeholder', {
        image: ecs.ContainerImage.fromRegistry('nginx:latest'),
        essential: true,
      });

      // Create a security group for the service (required even with desiredCount: 0)
      const prodServiceSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
        this,
        'ProdServiceSG',
        this.node.tryGetContext('prodServiceSecurityGroupId') ||
          prodSecurityGroupId
      );

      const prodService = new ecs.FargateService(this, 'ProdService', {
        cluster: prodCluster,
        serviceName: prodServiceName,
        taskDefinition: prodTaskDef,
        desiredCount: 0, // Not actually deploying, just for reference
        deploymentController: {
          type: ecs.DeploymentControllerType.CODE_DEPLOY,
        },
        securityGroups: [prodServiceSecurityGroup],
      });

      const prodBlueTargetGroup =
        elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
          this,
          'ProdBlueTarget',
          {
            targetGroupArn: prodBlueTargetGroupArn,
          }
        );

      const prodGreenTargetGroup =
        elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
          this,
          'ProdGreenTarget',
          {
            targetGroupArn: prodGreenTargetGroupArn,
          }
        );

      const prodListener =
        elbv2.ApplicationListener.fromApplicationListenerAttributes(
          this,
          'ProdListener',
          {
            listenerArn: prodListenerArn,
            defaultPort: 80,
            securityGroup: ec2.SecurityGroup.fromSecurityGroupId(
              this,
              'ProdListenerSG',
              prodSecurityGroupId
            ),
          }
        );

      const prodDeploymentGroup = new codedeploy.EcsDeploymentGroup(
        this,
        'ProdDeploymentGroup',
        {
          application: prodDeployApp,
          deploymentGroupName: `${companyName}-${serviceName}-${environmentSuffix}-prod`,
          service: prodService,
          blueGreenDeploymentConfig: {
            blueTargetGroup: prodBlueTargetGroup,
            greenTargetGroup: prodGreenTargetGroup,
            listener: prodListener,
            deploymentApprovalWaitTime: cdk.Duration.minutes(30),
            terminationWaitTime: cdk.Duration.minutes(30),
          },
          role: codeDeployRole,
          alarms: [prodDeploymentAlarm],
          autoRollback: {
            failedDeployment: true,
            stoppedDeployment: true,
            deploymentInAlarm: true,
          },
        }
      );

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
    }

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `${companyName}-${serviceName}-${environmentSuffix}-pipeline-dashboard`,
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
      exportName: `${companyName}-${serviceName}-${environmentSuffix}-pipeline-arn`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'Name of the artifact bucket',
      exportName: `${companyName}-${serviceName}-${environmentSuffix}-artifact-bucket`,
    });

    new cdk.CfnOutput(this, 'BuildImageRepoUri', {
      value: buildImageRepo.repositoryUri,
      description: 'URI of the build image ECR repository',
      exportName: `${companyName}-${serviceName}-${environmentSuffix}-build-image-repo`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
