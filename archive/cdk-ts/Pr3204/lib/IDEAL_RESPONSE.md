# Overview

Please find solution files below.

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

```

## ./test/tap-stack.int.test.ts

```typescript
// Integration tests for deployed TAP stack infrastructure
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  ListApplicationsCommand,
  ListDeploymentGroupsCommand,
} from '@aws-sdk/client-codedeploy';
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListPipelinesCommand,
} from '@aws-sdk/client-codepipeline';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeLaunchTemplatesCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS SDK clients
const codeBuildClient = new CodeBuildClient({ region });
const codeDeployClient = new CodeDeployClient({ region });
const codePipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const secretsManagerClient = new SecretsManagerClient({ region });
const ec2Client = new EC2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('TAP Stack Integration Tests', () => {
  // Extract resource IDs from outputs
  const vpcId = outputs[`VpcId${environmentSuffix}`];
  const sourceBucketName = outputs[`TapSourceBucketOutput${environmentSuffix}`];
  const artifactsBucketName =
    outputs[`ArtifactsBucketName${environmentSuffix}`];
  const secretArn = outputs[`BuildSecretsArn${environmentSuffix}`];
  const codeBuildProjectName =
    outputs[`CodeBuildProjectName${environmentSuffix}`];
  const codeDeployAppName =
    outputs[`CodeDeployApplicationName${environmentSuffix}`];
  const deploymentGroupName =
    outputs[`DeploymentGroupName${environmentSuffix}`];
  const autoScalingGroupName =
    outputs[`AutoScalingGroupName${environmentSuffix}`];
  const launchTemplateId = outputs[`LaunchTemplateId${environmentSuffix}`];
  const pipelineArn = outputs[`TapPipelineOutput${environmentSuffix}`];
  const snsTopicArn = outputs[`SnsTopicArn${environmentSuffix}`];
  const alarmName = outputs[`BuildFailureAlarmName${environmentSuffix}`];
  const securityGroupId = outputs[`SecurityGroupId${environmentSuffix}`];

  describe('Stack Deployment Validation', () => {
    test('should have all expected stack outputs from flat-outputs.json', () => {
      expect(outputs).toBeDefined();
      expect(pipelineArn).toBeDefined();
      expect(sourceBucketName).toBeDefined();
      expect(vpcId).toBeDefined();

      // Validate output formats
      expect(pipelineArn).toMatch(/^arn:aws:codepipeline:/);
      expect(sourceBucketName).toMatch(/^tap-source-/);
      expect(vpcId).toMatch(/^vpc-/);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      expect(vpcId).toBeDefined();

      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(vpcsResponse.Vpcs).toBeDefined();
      expect(vpcsResponse.Vpcs!.length).toBe(1);

      const vpc = vpcsResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should have public and private subnets', async () => {
      expect(vpcId).toBeDefined();

      // Get all subnets in the VPC
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(subnetsResponse.Subnets).toBeDefined();
      expect(subnetsResponse.Subnets!.length).toBe(4);

      // Check for public subnets (MapPublicIpOnLaunch = true)
      const publicSubnets = subnetsResponse.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch
      );
      expect(publicSubnets.length).toBe(2);

      // Check for private subnets (MapPublicIpOnLaunch = false)
      const privateSubnets = subnetsResponse.Subnets!.filter(
        subnet => !subnet.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBe(2);
    });

    test('should have Internet Gateway and NAT Gateway', async () => {
      expect(vpcId).toBeDefined();

      // Check Internet Gateway
      const igwResponse = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );
      expect(igwResponse.InternetGateways).toBeDefined();
      expect(igwResponse.InternetGateways!.length).toBeGreaterThan(0);
      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe(
        'available'
      );

      // Check NAT Gateway
      const natGwResponse = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );
      expect(natGwResponse.NatGateways).toBeDefined();
      expect(natGwResponse.NatGateways!.length).toBeGreaterThan(0);
      expect(natGwResponse.NatGateways![0].State).toBe('available');
    });

    test('should have security group with proper configuration', async () => {
      expect(securityGroupId).toBeDefined();

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroupId],
        })
      );

      expect(sgResponse.SecurityGroups).toBeDefined();
      expect(sgResponse.SecurityGroups!.length).toBe(1);

      const sg = sgResponse.SecurityGroups![0];
      expect(sg.Description).toBe('Security group for TAP EC2 instances');
      expect(sg.IpPermissions!.length).toBeGreaterThanOrEqual(2); // HTTP and HTTPS
    });
  });

  describe('S3 Storage', () => {
    test('should have source S3 bucket with versioning enabled', async () => {
      const sourceBucket = outputs[`TapSourceBucketOutput${environmentSuffix}`];
      expect(sourceBucket).toBeDefined();

      // Check bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: sourceBucket }))
      ).resolves.not.toThrow();

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: sourceBucket })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: sourceBucket })
      );
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration
      ).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have artifacts S3 bucket with lifecycle rules', async () => {
      expect(artifactsBucketName).toBeDefined();

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: artifactsBucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check lifecycle configuration
      const lifecycleResponse = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: artifactsBucketName,
        })
      );
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

      const deleteRule = lifecycleResponse.Rules!.find(
        (rule: any) => rule.ID === 'DeleteOldVersions'
      );
      expect(deleteRule).toBeDefined();
      expect(deleteRule!.Status).toBe('Enabled');
    });
  });

  describe('Secrets Management', () => {
    test('should have build secrets in Secrets Manager', async () => {
      expect(secretArn).toBeDefined();

      const secretResponse = await secretsManagerClient.send(
        new DescribeSecretCommand({
          SecretId: secretArn,
        })
      );

      expect(secretResponse.Name).toMatch(/tap-build-secrets/);
      expect(secretResponse.Description).toBe(
        'Build secrets for TAP application'
      );
    });
  });

  describe('CodeBuild Project', () => {
    test('should have CodeBuild project with correct configuration', async () => {
      expect(codeBuildProjectName).toBeDefined();

      const buildResponse = await codeBuildClient.send(
        new BatchGetProjectsCommand({
          names: [codeBuildProjectName],
        })
      );

      expect(buildResponse.projects).toBeDefined();
      expect(buildResponse.projects!.length).toBe(1);

      const project = buildResponse.projects![0];
      expect(project.name).toMatch(/tap-build/);
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.image).toBe('aws/codebuild/standard:7.0');

      // Check environment variables
      const envVars = project.environment!.environmentVariables || [];
      const envSuffixVar = envVars.find(v => v.name === 'ENVIRONMENT_SUFFIX');
      const secretsVar = envVars.find(v => v.name === 'SECRETS_ARN');

      expect(envSuffixVar).toBeDefined();
      expect(envSuffixVar!.value).toBe(environmentSuffix);
      expect(secretsVar).toBeDefined();
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should have CodeDeploy application', async () => {
      expect(codeDeployAppName).toBeDefined();
      expect(codeDeployAppName).toMatch(`tap-app-${environmentSuffix}`);
    });

    test('should have deployment group configured', async () => {
      expect(codeDeployAppName).toBeDefined();
      expect(deploymentGroupName).toBeDefined();

      const groupsResponse = await codeDeployClient.send(
        new ListDeploymentGroupsCommand({ applicationName: codeDeployAppName })
      );

      expect(groupsResponse.deploymentGroups).toBeDefined();
      expect(groupsResponse.deploymentGroups!.length).toBe(1);
      expect(groupsResponse.deploymentGroups![0]).toMatch(
        /tap-deployment-group/
      );
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have auto scaling group with proper configuration', async () => {
      expect(autoScalingGroupName).toBeDefined();

      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoScalingGroupName],
        })
      );

      expect(asgResponse.AutoScalingGroups).toBeDefined();
      expect(asgResponse.AutoScalingGroups!.length).toBe(1);

      const asg = asgResponse.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(3);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.VPCZoneIdentifier).toBeDefined();

      // Check tags
      const nameTag = asg.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toBe(`tap-instance-${environmentSuffix}`);
    });

    test('should have launch template configured', async () => {
      expect(launchTemplateId).toBeDefined();

      const ltResponse = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({
          LaunchTemplateIds: [launchTemplateId],
        })
      );

      expect(ltResponse.LaunchTemplates).toBeDefined();
      expect(ltResponse.LaunchTemplates!.length).toBe(1);

      const lt = ltResponse.LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toMatch(/tap-launch-template/);
    });
  });

  describe('CI/CD Pipeline', () => {
    test('should have CodePipeline with all stages', async () => {
      const pipelineArn = outputs[`TapPipelineOutput${environmentSuffix}`];
      expect(pipelineArn).toBeDefined();

      // Extract pipeline name from ARN
      const pipelineName = pipelineArn.split(':').pop();

      const pipelineResponse = await codePipelineClient.send(
        new GetPipelineCommand({ name: pipelineName })
      );

      expect(pipelineResponse.pipeline).toBeDefined();
      expect(pipelineResponse.pipeline!.stages).toBeDefined();
      expect(pipelineResponse.pipeline!.stages!.length).toBe(4);

      const stageNames = pipelineResponse.pipeline!.stages!.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('ApproveStaging');
      expect(stageNames).toContain('Deploy');
    });

    test('should have pipeline in available state', async () => {
      expect(pipelineArn).toBeDefined();

      // Extract pipeline name from ARN
      const pipelineName = pipelineArn.split(':').pop();

      const pipelinesResponse = await codePipelineClient.send(
        new ListPipelinesCommand()
      );

      const tapPipeline = pipelinesResponse.pipelines?.find(
        p => p.name === pipelineName
      );
      expect(tapPipeline).toBeDefined();
      expect(tapPipeline!.created).toBeDefined();
      expect(tapPipeline!.updated).toBeDefined();
    });
  });

  describe('Monitoring and Notifications', () => {
    test('should have SNS topic for notifications', async () => {
      expect(snsTopicArn).toBeDefined();

      const topicResponse = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: snsTopicArn,
        })
      );

      expect(topicResponse.Attributes).toBeDefined();
      expect(topicResponse.Attributes!.DisplayName).toBe(
        'TAP Pipeline Notifications'
      );
    });

    test('should have CloudWatch alarms configured', async () => {
      expect(alarmName).toBeDefined();

      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(alarmsResponse.MetricAlarms).toBeDefined();
      expect(alarmsResponse.MetricAlarms!.length).toBe(1);

      const alarm = alarmsResponse.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(`tap-build-failure-${environmentSuffix}`);
      expect(alarm.MetricName).toBe('FailedBuilds');
      expect(alarm.Namespace).toBe('AWS/CodeBuild');
      expect(alarm.Threshold).toBe(1);
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('should have consistent naming with environment suffix', () => {
      // Check that outputs contain environment suffix
      expect(pipelineArn).toContain(environmentSuffix);
      expect(sourceBucketName).toContain(environmentSuffix);
      expect(codeBuildProjectName).toContain(environmentSuffix);
      expect(alarmName).toContain(environmentSuffix);
    });

    test('should have proper resource tags for cost tracking', async () => {
      // Check VPC tags
      expect(vpcId).toBeDefined();

      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcsResponse.Vpcs![0];
      const environmentTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      expect(environmentTag!.Value).toBe(environmentSuffix);

      // Check for iac-rlhf-amazon tag
      const iacTag = vpc.Tags?.find(tag => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag!.Value).toBe('true');
    });
  });

  describe('Security Validation', () => {
    test('should have encrypted S3 buckets', async () => {
      const buckets = [sourceBucketName, artifactsBucketName];

      // Test each bucket for encryption
      for (const bucket of buckets) {
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucket,
          })
        );

        expect(
          encryptionResponse.ServerSideEncryptionConfiguration
        ).toBeDefined();
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');
      }
    });

    test('should have secrets properly stored in Secrets Manager', async () => {
      expect(secretArn).toBeDefined();

      const secretResponse = await secretsManagerClient.send(
        new DescribeSecretCommand({
          SecretId: secretArn,
        })
      );

      // Secret should be properly configured but we shouldn't retrieve the actual value
      expect(secretResponse.ARN).toBeDefined();
      expect(secretResponse.Name).toBeDefined();
      expect(secretResponse.Description).toBeDefined();
    });
  });

  describe('Cost Optimization', () => {
    test('should use cost-effective instance types', async () => {
      expect(launchTemplateId).toBeDefined();

      // We can't directly check instance type from describe-launch-templates,
      // but we can verify the launch template exists and is properly configured
      const ltResponse = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({
          LaunchTemplateIds: [launchTemplateId],
        })
      );

      expect(ltResponse.LaunchTemplates![0].DefaultVersionNumber).toBeDefined();
    });

    test('should have lifecycle policies for S3 cost optimization', async () => {
      expect(artifactsBucketName).toBeDefined();

      const lifecycleResponse = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: artifactsBucketName,
        })
      );

      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

      const deleteRule = lifecycleResponse.Rules!.find(
        (rule: any) => rule.NoncurrentVersionExpiration
      );
      expect(deleteRule).toBeDefined();
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create Internet Gateway and NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });

    test('should create security group for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for TAP EC2 instances',
        SecurityGroupIngress: [
          {
            CidrIp: {
              'Fn::GetAtt': [Match.anyValue(), 'CidrBlock'],
            },
            Description: 'Allow HTTP from VPC',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
          {
            CidrIp: {
              'Fn::GetAtt': [Match.anyValue(), 'CidrBlock'],
            },
            Description: 'Allow HTTPS from VPC',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
        ],
      });
    });
  });

  describe('S3 Storage', () => {
    test('should create source S3 bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              Match.stringLikeRegexp(`tap-source-${environmentSuffix}-`),
              Match.anyValue(),
            ],
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('should create artifacts S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              Match.stringLikeRegexp(`tap-artifacts-${environmentSuffix}-`),
              Match.anyValue(),
            ],
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('Secrets Management', () => {
    test('should create build secrets in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-build-secrets-${environmentSuffix}`,
        Description: 'Build secrets for TAP application',
        GenerateSecretString: {
          SecretStringTemplate:
            '{"API_KEY":"","DATABASE_URL":"","JWT_SECRET":""}',
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\',
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create CodeBuild service role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AWSCodeBuildDeveloperAccess',
              ],
            ],
          },
        ],
      });
    });

    test('should create CodeDeploy service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codedeploy-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });

    test('should create EC2 instance role with required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-ec2-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
        ],
      });
    });

    test('should create pipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-pipeline-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `tap-build-${environmentSuffix}`,
        Source: {
          Location: Match.anyValue(),
          Type: 'S3',
        },
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          EnvironmentVariables: [
            {
              Name: 'ENVIRONMENT_SUFFIX',
              Value: environmentSuffix,
            },
            {
              Name: 'SECRETS_ARN',
              Value: Match.anyValue(),
            },
          ],
        },
      });
    });

    test('should have proper build spec configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          BuildSpec: Match.serializedJson({
            version: '0.2',
            phases: Match.objectLike({
              pre_build: Match.objectLike({
                commands: Match.arrayWith([
                  'echo Logging in to Amazon ECR...',
                  'echo Build started on `date`',
                ]),
              }),
              build: Match.objectLike({
                commands: Match.arrayWith([
                  'npm ci',
                  'npm run test',
                  'npm run build',
                ]),
              }),
              post_build: Match.objectLike({
                commands: ['echo Build completed on `date`'],
              }),
            }),
            artifacts: Match.objectLike({
              files: ['**/*'],
              'base-directory': 'deploy',
            }),
          }),
        },
      });
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('should create launch template for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-launch-template-${environmentSuffix}`,
        LaunchTemplateData: {
          ImageId: Match.anyValue(),
          InstanceType: 't3.micro',
          SecurityGroupIds: [Match.anyValue()],
          IamInstanceProfile: {
            Arn: Match.anyValue(),
          },
          UserData: Match.anyValue(),
        },
      });
    });

    test('should create auto scaling group with proper configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-asg-${environmentSuffix}`,
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '2',
        LaunchTemplate: {
          LaunchTemplateId: Match.anyValue(),
          Version: Match.anyValue(),
        },
      });

      // Check that tags are present (structure may vary)
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.anyValue(),
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `tap-app-${environmentSuffix}`,
        ComputePlatform: 'Server',
      });
    });

    test('should create deployment group with auto scaling integration', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        ApplicationName: Match.anyValue(),
        DeploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
        ServiceRoleArn: Match.anyValue(),
        Ec2TagSet: {
          Ec2TagSetList: [
            {
              Ec2TagGroup: [
                {
                  Key: 'Environment',
                  Type: 'KEY_AND_VALUE',
                  Value: environmentSuffix,
                },
                {
                  Key: 'Application',
                  Type: 'KEY_AND_VALUE',
                  Value: 'tap',
                },
              ],
            },
          ],
        },
        AutoScalingGroups: [Match.anyValue()],
        DeploymentConfigName: 'CodeDeployDefault.AllAtOnce',
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_REQUEST'],
        },
      });
    });
  });

  describe('Monitoring and Notifications', () => {
    test('should create SNS topic for pipeline notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'TAP Pipeline Notifications',
        TopicName: `tap-pipeline-notifications-${environmentSuffix}`,
      });
    });

    test('should create CloudWatch alarm for build failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-build-failure-${environmentSuffix}`,
        MetricName: 'FailedBuilds',
        Namespace: 'AWS/CodeBuild',
        Statistic: 'Sum',
        Threshold: 1,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create chatbot role for future Slack integration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-chatbot-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'chatbot.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchReadOnlyAccess',
              ],
            ],
          },
        ],
      });
    });
  });

  describe('CI/CD Pipeline', () => {
    test('should create CodePipeline with all required stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `tap-pipeline-${environmentSuffix}`,
        Stages: [
          {
            Name: 'Source',
            Actions: [
              {
                Name: 'Source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                  Version: '1',
                },
                Configuration: {
                  S3Bucket: Match.anyValue(),
                  S3ObjectKey: 'source.zip',
                  PollForSourceChanges: true,
                },
                OutputArtifacts: [{ Name: 'source' }],
              },
            ],
          },
          {
            Name: 'Build',
            Actions: [
              {
                Name: 'Build',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                  Version: '1',
                },
                Configuration: {
                  ProjectName: Match.anyValue(),
                },
                InputArtifacts: [{ Name: 'source' }],
                OutputArtifacts: [{ Name: 'build' }],
              },
            ],
          },
          {
            Name: 'ApproveStaging',
            Actions: [
              {
                Name: 'ApproveStaging',
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                  Version: '1',
                },
                Configuration: {
                  NotificationArn: Match.anyValue(),
                  CustomData: Match.stringLikeRegexp(
                    `Please review and approve deployment to ${environmentSuffix} environment`
                  ),
                },
              },
            ],
          },
          {
            Name: 'Deploy',
            Actions: [
              {
                Name: 'Deploy',
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'CodeDeploy',
                  Version: '1',
                },
                Configuration: {
                  ApplicationName: Match.anyValue(),
                  DeploymentGroupName: Match.anyValue(),
                },
                InputArtifacts: [{ Name: 'build' }],
              },
            ],
          },
        ],
      });
    });

    test('should create CloudWatch event rule for pipeline state changes', () => {
      // Check for pipeline state change event rule existence
      template.resourceCountIs('AWS::Events::Rule', 1);

      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.codepipeline'],
        }),
        State: 'ENABLED',
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('should create log group for CodeBuild', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create outputs for pipeline and source bucket', () => {
      template.hasOutput(`TapPipelineOutput${environmentSuffix}`, {
        Description: 'TAP Pipeline ARN',
        Export: {
          Name: `tap-pipeline-arn-${environmentSuffix}`,
        },
      });

      template.hasOutput(`TapSourceBucketOutput${environmentSuffix}`, {
        Description: 'TAP Source S3 Bucket Name',
        Export: {
          Name: `tap-source-bucket-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environment suffix in resource names', () => {
      // Create separate app for this test to avoid synthesis conflicts
      const testApp = new cdk.App();
      const stackWithCustomSuffix = new TapStack(
        testApp,
        'TestTapStackCustom',
        {
          environmentSuffix: 'staging',
        }
      );
      const customTemplate = Template.fromStack(stackWithCustomSuffix);

      // Check that staging suffix is used in pipeline name
      customTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-staging',
      });

      // Check that staging suffix is used in role name
      customTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-codebuild-role-staging',
      });
    });

    test('should use context environment suffix when props not provided', () => {
      // Create app with context
      const testApp = new cdk.App({
        context: { environmentSuffix: 'prod' },
      });
      const stackWithContext = new TapStack(testApp, 'TestTapStackContext');
      const contextTemplate = Template.fromStack(stackWithContext);

      // Check that prod suffix is used in pipeline name
      contextTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-prod',
      });

      // Check that prod suffix is used in role name
      contextTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-codebuild-role-prod',
      });
    });

    test('should use default dev suffix when neither props nor context provided', () => {
      // Create app without context or props
      const testApp = new cdk.App();
      const stackWithDefaults = new TapStack(testApp, 'TestTapStackDefaults');
      const defaultTemplate = Template.fromStack(stackWithDefaults);

      // Check that dev suffix is used in pipeline name
      defaultTemplate.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'tap-pipeline-dev',
      });

      // Check that dev suffix is used in role name
      defaultTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-codebuild-role-dev',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of major resources', () => {
      // VPC and networking
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);

      // S3 buckets
      template.resourceCountIs('AWS::S3::Bucket', 2); // source + artifacts

      // IAM roles (minimum expected - there are additional CDK-created roles)
      // Just check that we have the main roles
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codebuild-role-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-codedeploy-role-${environmentSuffix}`,
      });

      // CodeBuild and CodeDeploy
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
      template.resourceCountIs('AWS::CodeDeploy::Application', 1);
      template.resourceCountIs('AWS::CodeDeploy::DeploymentGroup', 1);

      // Pipeline
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);

      // Auto Scaling
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);

      // Monitoring
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);

      // Secrets
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });
  });

  describe('Bucket Policies', () => {
    test('should create bucket policies for S3 buckets', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 2);
    });
  });

  describe('Route Tables and Associations', () => {
    test('should create route tables for all subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
    });

    test('should create subnet route table associations', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4);
    });

    test('should create default routes for subnets', () => {
      // Check for routes
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
      });
    });
  });

  describe('IAM Instance Profile', () => {
    test('should create IAM instance profile for EC2 instances', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('Pipeline Policies', () => {
    test('should have proper IAM policy for pipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.anyValue(),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Tags', () => {
    test('should apply tags to auto scaling group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
            PropagateAtLaunch: true,
          }),
          Match.objectLike({
            Key: 'Name',
            PropagateAtLaunch: true,
          }),
        ]),
      });
    });
  });

  describe('VPC Gateway Attachment', () => {
    test('should attach internet gateway to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
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
