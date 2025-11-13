import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

// Constants for port configuration
const CONTAINER_PORT = 80;
const ALB_PORT = 80;

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const stagingAccountId =
      this.node.tryGetContext('stagingAccountId') ||
      process.env.STAGING_ACCOUNT_ID ||
      this.account;
    const prodAccountId =
      this.node.tryGetContext('prodAccountId') ||
      process.env.PROD_ACCOUNT_ID ||
      this.account;

    const artifactKey = new kms.Key(this, 'ArtifactKey', {
      enableKeyRotation: true,
      description: 'KMS key for encrypting the artifacts stored in S3',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Note: Using S3 as source instead of CodeCommit for test environment compatibility.
    // CodeCommit requires at least one existing repository in the AWS account before
    // CloudFormation can create new repositories, which fails in fresh test accounts.
    // S3 source is more suitable for test environments and allows immediate deployment.
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `microservice-source-${this.account}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: artifactKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const ecrRepository = new ecr.Repository(this, 'MicroserviceECR', {
      repositoryName: `microservice-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only the last 10 images',
        },
      ],
    });

    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `microservice-artifacts-${this.account}-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: artifactKey,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const approvalTopic = new sns.Topic(this, 'PipelineApprovalTopic', {
      displayName: 'Pipeline Approval Notifications',
    });

    const alarmTopic = new sns.Topic(this, 'PipelineAlarmTopic', {
      displayName: 'Pipeline Alarm Notifications',
    });

    const pipeline = new codepipeline.Pipeline(this, 'MicroservicePipeline', {
      pipelineName: `microservice-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
      crossAccountKeys: true,
      restartExecutionOnUpdate: true,
    });

    const sourceOutput = new codepipeline.Artifact('SourceCode');
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'S3Source',
      bucket: sourceBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
      trigger: codepipeline_actions.S3Trigger.EVENTS,
    });

    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `microservice-build-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      environmentVariables: {
        REPOSITORY_URI: {
          value: ecrRepository.repositoryUri,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI',
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}',
              'echo Running unit tests...',
              'npm install',
              'npm run test',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $REPOSITORY_URI:latest .',
              'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Pushing the Docker image...',
              'docker push $REPOSITORY_URI:latest',
              'docker push $REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing artifacts...',
              'echo "{\"ImageURI\":\"$REPOSITORY_URI:$IMAGE_TAG\"}" > imageDefinition.json',
              'echo Creating task definition and appspec files...',
              'cp task-definition-template.json taskdef.json',
              'sed -i "s|<IMAGE_URI>|$REPOSITORY_URI:$IMAGE_TAG|g" taskdef.json',
              'cp appspec-template.yaml appspec.yaml',
            ],
          },
        },
        artifacts: {
          files: [
            'imageDefinition.json',
            'appspec.yaml',
            'taskdef.json',
            'build-info.json',
          ],
        },
        reports: {
          UnitTestReports: {
            files: ['reports/test-results.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER),
      timeout: cdk.Duration.minutes(30),
    });

    ecrRepository.grantPullPush(buildProject.role!);
    artifactBucket.grantReadWrite(buildProject.role!);
    artifactKey.grantEncryptDecrypt(buildProject.role!);

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'BuildAndUnitTest',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    });

    const testOutput = new codepipeline.Artifact('TestOutput');
    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: `microservice-test-${environmentSuffix}`,
      timeout: cdk.Duration.hours(2),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.LARGE,
        privileged: true,
      },
      environmentVariables: {
        REPOSITORY_URI: {
          value: ecrRepository.repositoryUri,
          type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Installing dependencies...',
              'npm install',
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $REPOSITORY_URI',
              'echo Setting up security scanning tools...',
              'pip install safety bandit',
              'curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin',
            ],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
              'echo Running dependency security scan...',
              'safety check',
              'echo Running static code analysis...',
              'bandit -r ./src -f json -o security-reports/bandit-results.json || true',
              'echo Running container security scan...',
              'IMAGE_TAG=$(cat imageDefinition.json | jq -r .ImageURI | cut -d: -f2)',
              'trivy image --format json --output security-reports/container-scan.json "$REPOSITORY_URI:$IMAGE_TAG" || true',
            ],
          },
          post_build: {
            commands: [
              'echo Tests completed on `date`',
              'echo Creating test result summary...',
              'jq -s "." ./security-reports/*.json > security-reports/all-security-results.json || echo "No security reports generated"',
            ],
          },
        },
        artifacts: {
          files: ['test-reports/**/*', 'security-reports/**/*'],
          'base-directory': '.',
        },
        reports: {
          IntegrationTestReports: {
            files: ['test-reports/integration-results.xml'],
            'file-format': 'JUNITXML',
          },
          SecurityReports: {
            files: ['security-reports/all-security-results.json'],
            'file-format': 'JSON',
          },
        },
      }),
    });

    ecrRepository.grantPull(testProject.role!);
    artifactBucket.grantReadWrite(testProject.role!);
    artifactKey.grantEncryptDecrypt(testProject.role!);

    const testAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'IntegrationAndSecurityTests',
      project: testProject,
      input: buildOutput,
      outputs: [testOutput],
    });

    pipeline.addStage({
      stageName: 'Test',
      actions: [testAction],
    });

    let stagingDeployRole: iam.Role | undefined;

    if (stagingAccountId !== this.account) {
      stagingDeployRole = new iam.Role(this, 'StagingDeployRole', {
        assumedBy: new iam.AccountPrincipal(stagingAccountId),
        description: 'Role for deploying to staging account',
        roleName: `CrossAccountStagingDeployRole-${environmentSuffix}`,
      });

      stagingDeployRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecs:DescribeServices',
            'ecs:UpdateService',
            'ecs:RegisterTaskDefinition',
            'ecs:ListTaskDefinitions',
            'ecs:DescribeTaskDefinition',
            'cloudformation:DescribeChangeSet',
            'cloudformation:CreateChangeSet',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:DescribeStacks',
            'codedeploy:CreateDeployment',
            'codedeploy:GetDeployment',
            'codedeploy:GetDeploymentConfig',
            'codedeploy:RegisterApplicationRevision',
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          resources: ['*'],
        })
      );
    }

    let prodDeployRole: iam.Role | undefined;

    if (prodAccountId !== this.account) {
      prodDeployRole = new iam.Role(this, 'ProdDeployRole', {
        assumedBy: new iam.AccountPrincipal(prodAccountId),
        description: 'Role for deploying to production account',
        roleName: `CrossAccountProdDeployRole-${environmentSuffix}`,
      });

      prodDeployRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecs:DescribeServices',
            'ecs:UpdateService',
            'ecs:RegisterTaskDefinition',
            'ecs:ListTaskDefinitions',
            'ecs:DescribeTaskDefinition',
            'cloudformation:DescribeChangeSet',
            'cloudformation:CreateChangeSet',
            'cloudformation:ExecuteChangeSet',
            'cloudformation:DescribeStacks',
            'codedeploy:CreateDeployment',
            'codedeploy:GetDeployment',
            'codedeploy:GetDeploymentConfig',
            'codedeploy:RegisterApplicationRevision',
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
          ],
          resources: ['*'],
        })
      );
    }

    const stagingVpc = new ec2.Vpc(this, 'StagingVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const stagingCluster = new ecs.Cluster(this, 'StagingCluster', {
      clusterName: `StagingCluster-${environmentSuffix}`,
      vpc: stagingVpc,
    });

    const stagingTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'StagingTaskDefinition',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Note: Using nginx:latest as placeholder image. This allows ECS services to start
    // successfully before the first pipeline deployment. The pipeline will create new
    // task definition revisions with the actual ECR image during deployment.
    stagingTaskDefinition.addContainer('MicroserviceContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'microservice',
      }),
      portMappings: [
        {
          containerPort: CONTAINER_PORT,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    const stagingSecurityGroup = new ec2.SecurityGroup(
      this,
      'StagingSecurityGroup',
      {
        vpc: stagingVpc,
        description: 'Security group for staging ECS service',
        allowAllOutbound: true,
      }
    );

    const stagingService = new ecs.FargateService(this, 'StagingService', {
      cluster: stagingCluster,
      taskDefinition: stagingTaskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      serviceName: `microservice-${environmentSuffix}`,
      securityGroups: [stagingSecurityGroup],
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    const deployToStagingAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployToStaging',
      service: stagingService,
      imageFile: buildOutput.atPath('imageDefinition.json'),
      deploymentTimeout: cdk.Duration.minutes(60),
      role: stagingDeployRole,
    });

    pipeline.addStage({
      stageName: 'DeployToStaging',
      actions: [deployToStagingAction],
    });

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'ApproveDeployment',
      notificationTopic: approvalTopic,
      additionalInformation:
        'Please review the staging deployment before approving deployment to production',
      externalEntityLink: `https://${this.region}.console.aws.amazon.com/ecs/home?region=${this.region}#/clusters/${stagingCluster.clusterName}/services/${stagingService.serviceName}/details`,
    });

    pipeline.addStage({
      stageName: 'Approve',
      actions: [manualApprovalAction],
    });

    const prodVpc = new ec2.Vpc(this, 'ProdVpc', {
      maxAzs: 2,
      natGateways: 1,
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

    const prodCluster = new ecs.Cluster(this, 'ProdCluster', {
      clusterName: `ProdCluster-${environmentSuffix}`,
      vpc: prodVpc,
    });

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: prodVpc,
      description: 'Security group for production ALB',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(ALB_PORT),
      'Allow HTTP traffic from internet'
    );

    const prodLoadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'ProdLoadBalancer',
      {
        vpc: prodVpc,
        internetFacing: true,
        loadBalancerName: `prod-alb-${environmentSuffix}`,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    const prodListener = prodLoadBalancer.addListener('ProdListener', {
      port: ALB_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    const blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BlueTargetGroup',
      {
        vpc: prodVpc,
        port: CONTAINER_PORT,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
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
        vpc: prodVpc,
        port: CONTAINER_PORT,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    prodListener.addTargetGroups('DefaultTargetGroup', {
      targetGroups: [blueTargetGroup],
    });

    const codedeployApplication = new codedeploy.EcsApplication(
      this,
      'ProdCodeDeployApplication',
      {
        applicationName: `ProdMicroserviceApplication-${environmentSuffix}`,
      }
    );

    const prodTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'ProdTaskDefinition',
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Note: Using nginx:latest as placeholder image. This allows ECS services to start
    // successfully before the first pipeline deployment. The pipeline will create new
    // task definition revisions with the actual ECR image during deployment.
    prodTaskDefinition.addContainer('MicroserviceContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'microservice',
      }),
      portMappings: [
        {
          containerPort: CONTAINER_PORT,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    const prodSecurityGroup = new ec2.SecurityGroup(this, 'ProdSecurityGroup', {
      vpc: prodVpc,
      description: 'Security group for production ECS service',
      allowAllOutbound: true,
    });

    prodSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      ec2.Port.tcp(CONTAINER_PORT),
      'Allow HTTP traffic from ALB'
    );

    const prodService = new ecs.FargateService(this, 'ProdService', {
      cluster: prodCluster,
      taskDefinition: prodTaskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
      serviceName: `microservice-prod-${environmentSuffix}`,
      securityGroups: [prodSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    prodService.attachToApplicationTargetGroup(blueTargetGroup);

    const prodDeploymentGroup = new codedeploy.EcsDeploymentGroup(
      this,
      'ProdDeploymentGroup',
      {
        application: codedeployApplication,
        service: prodService,
        deploymentGroupName: `ProdMicroserviceDeploymentGroup-${environmentSuffix}`,
        deploymentConfig:
          codedeploy.EcsDeploymentConfig.CANARY_10PERCENT_5MINUTES,
        blueGreenDeploymentConfig: {
          blueTargetGroup: blueTargetGroup,
          greenTargetGroup: greenTargetGroup,
          listener: prodListener,
        },
      }
    );

    const deployToProdAction =
      new codepipeline_actions.CodeDeployEcsDeployAction({
        actionName: 'DeployToProduction',
        deploymentGroup: prodDeploymentGroup,
        taskDefinitionTemplateFile: buildOutput.atPath('taskdef.json'),
        appSpecTemplateFile: buildOutput.atPath('appspec.yaml'),
        containerImageInputs: [
          {
            input: buildOutput,
            taskDefinitionPlaceholder: 'IMAGE_NAME',
          },
        ],
        role: prodDeployRole,
      });

    pipeline.addStage({
      stageName: 'DeployToProduction',
      actions: [deployToProdAction],
    });

    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `MicroservicePipelineMonitoring-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Execution Time',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'ExecutionTime',
            dimensionsMap: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Pipeline Success/Failure',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'SucceededPipeline',
            dimensionsMap: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'FailedPipeline',
            dimensionsMap: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'CodeBuild Project Success/Failure',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'SucceededBuilds',
            dimensionsMap: {
              ProjectName: buildProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'FailedBuilds',
            dimensionsMap: {
              ProjectName: buildProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'SucceededBuilds',
            dimensionsMap: {
              ProjectName: testProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'FailedBuilds',
            dimensionsMap: {
              ProjectName: testProject.projectName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'FailedPipeline',
          dimensionsMap: {
            PipelineName: pipeline.pipelineName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alarm when pipeline execution fails',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    const buildFailureAlarm = new cloudwatch.Alarm(this, 'BuildFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'FailedBuilds',
        dimensionsMap: {
          ProjectName: buildProject.projectName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm when build project fails',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    buildFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    const testFailureAlarm = new cloudwatch.Alarm(this, 'TestFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'FailedBuilds',
        dimensionsMap: {
          ProjectName: testProject.projectName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm when test project fails',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    testFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'S3 bucket name for source code',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'ECR repository URI',
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD pipeline',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'Name of the artifact bucket',
    });

    new cdk.CfnOutput(this, 'ApprovalTopicArn', {
      value: approvalTopic.topicArn,
      description: 'ARN of the SNS topic for deployment approvals',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarm notifications',
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'Name of the CloudWatch dashboard',
    });
  }
}
