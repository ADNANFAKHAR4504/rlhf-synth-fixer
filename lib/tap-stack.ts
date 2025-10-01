import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply iac-rlhf-amazon tag to all resources in the stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // ===========================================
    // 1. NETWORKING & SECURITY FOUNDATION
    // ===========================================

    // Create VPC with private subnets
    const vpc = new ec2.Vpc(this, `TapVpc-${environmentSuffix}`, {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 2,
      cidr: '10.0.0.0/16',
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
      natGateways: 1,
    });

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `TapEc2SecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for TAP EC2 instances',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic from ALB
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      'Allow HTTP from VPC'
    );

    // Allow HTTPS traffic from ALB
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // ===========================================
    // 2. SECRETS MANAGEMENT
    // ===========================================

    // Secrets for build process
    const buildSecrets = new secretsmanager.Secret(
      this,
      `TapBuildSecrets-${environmentSuffix}`,
      {
        secretName: `tap-build-secrets-${environmentSuffix}`,
        description: 'Build secrets for TAP application',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            API_KEY: '',
            DATABASE_URL: '',
            JWT_SECRET: '',
          }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
      }
    );

    // ===========================================
    // 3. STORAGE & ARTIFACTS
    // ===========================================

    // Source S3 bucket
    const sourceBucket = new s3.Bucket(
      this,
      `TapSourceBucket-${environmentSuffix}`,
      {
        bucketName: `tap-source-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
      }
    );

    // Artifacts S3 bucket
    const artifactsBucket = new s3.Bucket(
      this,
      `TapArtifactsBucket-${environmentSuffix}`,
      {
        bucketName: `tap-artifacts-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
      }
    );

    // ===========================================
    // 4. IAM ROLES AND POLICIES
    // ===========================================

    // CodeBuild service role
    const codeBuildRole = new iam.Role(
      this,
      `TapCodeBuildRole-${environmentSuffix}`,
      {
        roleName: `tap-codebuild-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSCodeBuildDeveloperAccess'
          ),
        ],
      }
    );

    // Grant CodeBuild access to secrets
    buildSecrets.grantRead(codeBuildRole);

    // Grant CodeBuild access to S3 buckets
    sourceBucket.grantRead(codeBuildRole);
    artifactsBucket.grantReadWrite(codeBuildRole);

    // CodeDeploy service role
    const codeDeployRole = new iam.Role(
      this,
      `TapCodeDeployRole-${environmentSuffix}`,
      {
        roleName: `tap-codedeploy-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSCodeDeployRole'
          ),
        ],
      }
    );

    // EC2 instance role
    const ec2Role = new iam.Role(this, `TapEc2Role-${environmentSuffix}`, {
      roleName: `tap-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Grant EC2 instances access to artifacts bucket
    artifactsBucket.grantRead(ec2Role);

    // CodePipeline service role
    const pipelineRole = new iam.Role(
      this,
      `TapPipelineRole-${environmentSuffix}`,
      {
        roleName: `tap-pipeline-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      }
    );

    // Grant pipeline access to S3 buckets
    sourceBucket.grantRead(pipelineRole);
    artifactsBucket.grantReadWrite(pipelineRole);

    // ===========================================
    // 5. BUILD STAGE - CODEBUILD PROJECT
    // ===========================================

    // CloudWatch Log Group for CodeBuild
    const buildLogGroup = new logs.LogGroup(
      this,
      `TapBuildLogs-${environmentSuffix}`,
      {
        logGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const buildProject = new codebuild.Project(
      this,
      `TapBuildProject-${environmentSuffix}`,
      {
        projectName: `tap-build-${environmentSuffix}`,
        source: codebuild.Source.s3({
          bucket: sourceBucket,
          path: 'source.zip',
        }),
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          environmentVariables: {
            ENVIRONMENT_SUFFIX: {
              value: environmentSuffix,
            },
            SECRETS_ARN: {
              value: buildSecrets.secretArn,
            },
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Logging in to Amazon ECR...',
                'echo Build started on `date`',
                'echo Node.js version: $(node --version)',
                'echo NPM version: $(npm --version)',
                // Retrieve secrets from AWS Secrets Manager
                'export SECRETS=$(aws secretsmanager get-secret-value --secret-id $SECRETS_ARN --query SecretString --output text)',
                'export API_KEY=$(echo $SECRETS | jq -r .API_KEY)',
              ],
            },
            build: {
              commands: [
                'echo Installing dependencies...',
                'npm ci',
                'echo Running unit tests...',
                'npm run test',
                'echo Building TypeScript application...',
                'npm run build',
                'echo Creating deployment package...',
                'mkdir -p deploy',
                'cp -r dist/* deploy/',
                'cp package.json deploy/',
                'cp -r node_modules deploy/ 2>/dev/null || echo "No node_modules to copy"',
                'echo Creating appspec.yml for CodeDeploy...',
                'cat > deploy/appspec.yml << EOF',
                'version: 0.0',
                'os: linux',
                'files:',
                '  - source: /',
                '    destination: /var/www/html',
                'hooks:',
                '  BeforeInstall:',
                '    - location: scripts/install_dependencies.sh',
                '      timeout: 300',
                '      runas: root',
                '  ApplicationStart:',
                '    - location: scripts/start_server.sh',
                '      timeout: 300',
                '      runas: root',
                '  ApplicationStop:',
                '    - location: scripts/stop_server.sh',
                '      timeout: 300',
                '      runas: root',
                'EOF',
                'mkdir -p deploy/scripts',
                'echo "#!/bin/bash" > deploy/scripts/install_dependencies.sh',
                'echo "yum update -y" >> deploy/scripts/install_dependencies.sh',
                'echo "yum install -y nodejs npm" >> deploy/scripts/install_dependencies.sh',
                'chmod +x deploy/scripts/install_dependencies.sh',
                'echo "#!/bin/bash" > deploy/scripts/start_server.sh',
                'echo "cd /var/www/html && npm start &" >> deploy/scripts/start_server.sh',
                'chmod +x deploy/scripts/start_server.sh',
                'echo "#!/bin/bash" > deploy/scripts/stop_server.sh',
                'echo "pkill -f node || true" >> deploy/scripts/stop_server.sh',
                'chmod +x deploy/scripts/stop_server.sh',
              ],
            },
            post_build: {
              commands: ['echo Build completed on `date`'],
            },
          },
          artifacts: {
            files: ['**/*'],
            'base-directory': 'deploy',
          },
        }),
        role: codeBuildRole,
        logging: {
          cloudWatch: {
            logGroup: buildLogGroup,
          },
        },
      }
    );

    // ===========================================
    // 6. DEPLOYMENT INFRASTRUCTURE - EC2 AUTO SCALING
    // ===========================================

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `TapLaunchTemplate-${environmentSuffix}`,
      {
        launchTemplateName: `tap-launch-template-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
      }
    );

    // User data script for CodeDeploy agent installation
    launchTemplate.userData?.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      'wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install',
      'chmod +x ./install',
      './install auto',
      'service codedeploy-agent start',
      'chkconfig codedeploy-agent on'
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `TapAutoScalingGroup-${environmentSuffix}`,
      {
        autoScalingGroupName: `tap-asg-${environmentSuffix}`,
        vpc,
        launchTemplate,
        minCapacity: 1,
        maxCapacity: 3,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.ec2(),
      }
    );

    // Tag instances for CodeDeploy
    cdk.Tags.of(autoScalingGroup).add(
      'Name',
      `tap-instance-${environmentSuffix}`
    );
    cdk.Tags.of(autoScalingGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(autoScalingGroup).add('Application', 'tap');

    // ===========================================
    // 7. DEPLOYMENT STAGE - CODEDEPLOY
    // ===========================================

    // CodeDeploy Application
    const codeDeployApplication = new codedeploy.ServerApplication(
      this,
      `TapCodeDeployApp-${environmentSuffix}`,
      {
        applicationName: `tap-app-${environmentSuffix}`,
      }
    );

    // CodeDeploy Deployment Group
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      `TapDeploymentGroup-${environmentSuffix}`,
      {
        application: codeDeployApplication,
        deploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
        role: codeDeployRole,
        ec2InstanceTags: new codedeploy.InstanceTagSet({
          Environment: [environmentSuffix],
          Application: ['tap'],
        }),
        autoScalingGroups: [autoScalingGroup],
        deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
        },
      }
    );

    // ===========================================
    // 8. MONITORING & NOTIFICATIONS
    // ===========================================

    // SNS Topic for pipeline notifications
    const pipelineTopic = new sns.Topic(
      this,
      `TapPipelineTopic-${environmentSuffix}`,
      {
        topicName: `tap-pipeline-notifications-${environmentSuffix}`,
        displayName: 'TAP Pipeline Notifications',
      }
    );

    // CloudWatch Alarms for pipeline monitoring
    const buildFailureAlarm = new cloudwatch.Alarm(
      this,
      `TapBuildFailureAlarm-${environmentSuffix}`,
      {
        alarmName: `tap-build-failure-${environmentSuffix}`,
        metric: buildProject.metricFailedBuilds(),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    buildFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineTopic)
    );

    // Slack Chatbot role (for future Slack integration)
    new iam.Role(this, `TapChatbotRole-${environmentSuffix}`, {
      roleName: `tap-chatbot-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('chatbot.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchReadOnlyAccess'),
      ],
    });

    // Note: Slack Chatbot configuration requires valid workspace and channel IDs
    // To enable Slack notifications, configure the SlackChannelConfiguration
    // with actual values from your Slack workspace

    // ===========================================
    // 9. CI/CD PIPELINE ORCHESTRATION
    // ===========================================

    // Pipeline artifacts
    const sourceArtifact = new codepipeline.Artifact('source');
    const buildArtifact = new codepipeline.Artifact('build');

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(
      this,
      `TapPipeline-${environmentSuffix}`,
      {
        pipelineName: `tap-pipeline-${environmentSuffix}`,
        artifactBucket: artifactsBucket,
        role: pipelineRole,
        stages: [
          // Source Stage
          {
            stageName: 'Source',
            actions: [
              new codepipeline_actions.S3SourceAction({
                actionName: 'Source',
                bucket: sourceBucket,
                bucketKey: 'source.zip',
                output: sourceArtifact,
                trigger: codepipeline_actions.S3Trigger.POLL,
              }),
            ],
          },
          // Build Stage
          {
            stageName: 'Build',
            actions: [
              new codepipeline_actions.CodeBuildAction({
                actionName: 'Build',
                project: buildProject,
                input: sourceArtifact,
                outputs: [buildArtifact],
              }),
            ],
          },
          // Approval Stage for Staging
          {
            stageName: 'ApproveStaging',
            actions: [
              new codepipeline_actions.ManualApprovalAction({
                actionName: 'ApproveStaging',
                notificationTopic: pipelineTopic,
                additionalInformation: `Please review and approve deployment to ${environmentSuffix} environment`,
              }),
            ],
          },
          // Deploy Stage
          {
            stageName: 'Deploy',
            actions: [
              new codepipeline_actions.CodeDeployServerDeployAction({
                actionName: 'Deploy',
                input: buildArtifact,
                deploymentGroup,
              }),
            ],
          },
        ],
      }
    );

    // Grant additional permissions to pipeline role
    pipeline.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'codebuild:BatchGetBuilds',
          'codebuild:StartBuild',
          'codedeploy:CreateDeployment',
          'codedeploy:GetApplication',
          'codedeploy:GetApplicationRevision',
          'codedeploy:GetDeployment',
          'codedeploy:GetDeploymentConfig',
          'codedeploy:RegisterApplicationRevision',
        ],
        resources: ['*'],
      })
    );

    // ===========================================
    // 10. CLOUDWATCH MONITORING & LOGGING
    // ===========================================

    // Pipeline CloudWatch Event Rule for notifications
    pipeline.onStateChange('TapPipelineStateChange', {
      target: new events_targets.SnsTopic(pipelineTopic),
    });

    // Note: Load balancer not required by task description
    // Focus on CI/CD pipeline: S3 source -> CodeBuild -> CodeDeploy -> EC2 in VPC

    // ===========================================
    // 11. OUTPUTS
    // ===========================================

    new cdk.CfnOutput(this, `TapPipelineOutput-${environmentSuffix}`, {
      value: pipeline.pipelineArn,
      description: 'TAP Pipeline ARN',
      exportName: `tap-pipeline-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TapSourceBucketOutput-${environmentSuffix}`, {
      value: sourceBucket.bucketName,
      description: 'TAP Source S3 Bucket Name',
      exportName: `tap-source-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `VpcId-${environmentSuffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, `ArtifactsBucketName-${environmentSuffix}`, {
      value: artifactsBucket.bucketName,
      description: 'Artifacts S3 Bucket Name',
    });

    new cdk.CfnOutput(this, `BuildSecretsArn-${environmentSuffix}`, {
      value: buildSecrets.secretArn,
      description: 'Build Secrets ARN',
    });

    new cdk.CfnOutput(this, `CodeBuildProjectName-${environmentSuffix}`, {
      value: buildProject.projectName,
      description: 'CodeBuild Project Name',
    });

    new cdk.CfnOutput(this, `CodeDeployApplicationName-${environmentSuffix}`, {
      value: codeDeployApplication.applicationName,
      description: 'CodeDeploy Application Name',
    });

    new cdk.CfnOutput(this, `DeploymentGroupName-${environmentSuffix}`, {
      value: deploymentGroup.deploymentGroupName,
      description: 'Deployment Group Name',
    });

    new cdk.CfnOutput(this, `AutoScalingGroupName-${environmentSuffix}`, {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });

    new cdk.CfnOutput(this, `LaunchTemplateId-${environmentSuffix}`, {
      value: launchTemplate.launchTemplateId!,
      description: 'Launch Template ID',
    });

    new cdk.CfnOutput(this, `SnsTopicArn-${environmentSuffix}`, {
      value: pipelineTopic.topicArn,
      description: 'SNS Topic ARN',
    });

    new cdk.CfnOutput(this, `BuildFailureAlarmName-${environmentSuffix}`, {
      value: buildFailureAlarm.alarmName,
      description: 'Build Failure Alarm Name',
    });

    new cdk.CfnOutput(this, `SecurityGroupId-${environmentSuffix}`, {
      value: ec2SecurityGroup.securityGroupId,
      description: 'Security Group ID',
    });
  }
}
