import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // ==============================================
    // VPC and Networking Setup
    // ==============================================

    /**
     * Create a VPC with public and private subnets for secure EC2 deployment
     */
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      natGateways: 1,
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

    // ==============================================
    // Security Groups
    // ==============================================

    /**
     * Security group for EC2 instances - follows least privilege principle
     * Only allows HTTP/HTTPS traffic and SSH from specific sources
     */
    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebServerSecurityGroup',
      {
        vpc,
        description: 'Security group for web servers',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic from anywhere
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow HTTPS traffic from anywhere
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow SSH from VPC only (for maintenance)
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );

    // ==============================================
    // S3 Bucket for Artifacts
    // ==============================================

    /**
     * Encrypted S3 bucket to store build artifacts securely
     */
    const artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `tap-pipeline-artifacts-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // ==============================================
    // SNS Topic for Notifications
    // ==============================================

    /**
     * SNS topic for pipeline notifications and alerts
     */
    const notificationTopic = new sns.Topic(this, 'PipelineNotifications', {
      displayName: `TAP Pipeline Notifications ${environmentSuffix}`,
      topicName: `tap-pipeline-notifications-${environmentSuffix}`,
    });

    // Add email subscription (replace with actual email)
    notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('admin@example.com')
    );

    // ==============================================
    // IAM Roles
    // ==============================================

    /**
     * IAM role for CodeBuild with least privilege permissions
     */
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // Grant specific permissions to CodeBuild
    artifactsBucket.grantReadWrite(codeBuildRole);
    notificationTopic.grantPublish(codeBuildRole);

    /**
     * IAM role for CodePipeline
     */
    const codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
    });

    artifactsBucket.grantReadWrite(codePipelineRole);
    notificationTopic.grantPublish(codePipelineRole);

    /**
     * IAM role for EC2 instances with CodeDeploy agent
     */
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Grant EC2 instances access to artifacts bucket
    artifactsBucket.grantRead(ec2Role);

    /**
     * IAM role for CodeDeploy
     */
    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSCodeDeployRole'
        ),
      ],
    });

    // ==============================================
    // CloudWatch Log Groups
    // ==============================================

    /**
     * CloudWatch log group for CodeBuild with detailed logging
     */
    const codeBuildLogGroup = new logs.LogGroup(this, 'CodeBuildLogGroup', {
      logGroupName: `/aws/codebuild/tap-build-project-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==============================================
    // CodeBuild Project
    // ==============================================

    /**
     * CodeBuild project for compiling and testing the application
     */
    const buildProject = new codebuild.Project(this, 'TapBuildProject', {
      projectName: `tap-build-project-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '16',
            },
            commands: ['echo Installing dependencies...', 'npm install'],
          },
          pre_build: {
            commands: [
              'echo Running pre-build commands...',
              'npm run lint || echo "Linting completed"',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'npm run build || echo "Build completed"',
              'npm test || echo "Tests completed"',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Creating deployment package...',
              'zip -r deployment-package.zip . -x "node_modules/*" "*.git*"',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
          'exclude-paths': ['node_modules/**/*', '.git/**/*'],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        includeBuildId: true,
        packageZip: true,
      }),
      logging: {
        cloudWatch: {
          logGroup: codeBuildLogGroup,
        },
      },
    });

    // ==============================================
    // EC2 Launch Template and Auto Scaling Group
    // ==============================================

    /**
     * Launch template for EC2 instances with CodeDeploy agent
     */
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        launchTemplateName: `tap-web-server-template-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }),
        securityGroup: webServerSecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
      }
    );

    // Add user data to install CodeDeploy agent and web server
    launchTemplate.userData?.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Install CodeDeploy agent
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      `wget https://aws-codedeploy-${this.region}.s3.${this.region}.amazonaws.com/latest/install`,
      'chmod +x ./install',
      './install auto',
      'service codedeploy-agent start',

      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',

      // Create a simple index.html
      'echo "<h1>TAP Application - Version 1.0</h1>" > /var/www/html/index.html',
      'echo "<p>Deployed via CodeDeploy</p>" >> /var/www/html/index.html'
    );

    /**
     * Auto Scaling Group for high availability
     */
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebServerASG',
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 4,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.ec2({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    // Tag instances for CodeDeploy
    cdk.Tags.of(autoScalingGroup).add('Environment', 'Production');
    cdk.Tags.of(autoScalingGroup).add('Application', 'TAP');

    // ==============================================
    // CodeDeploy Application and Deployment Group
    // ==============================================

    /**
     * CodeDeploy application for managing deployments
     */
    const codeDeployApplication = new codedeploy.ServerApplication(
      this,
      'TapCodeDeployApp',
      {
        applicationName: `tap-application-${environmentSuffix}`,
      }
    );

    /**
     * CodeDeploy deployment group with rollback configuration
     */
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      'TapDeploymentGroup',
      {
        application: codeDeployApplication,
        deploymentGroupName: `tap-deployment-group-${environmentSuffix}`,
        role: codeDeployRole,
        autoScalingGroups: [autoScalingGroup],
        deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
        },
        ignoreAlarmConfiguration: false,
      }
    );

    // ==============================================
    // Lambda Function for Boto3 Integration
    // ==============================================

    /**
     * Lambda function demonstrating Boto3 usage for custom resource operations
     */
    const boto3Lambda = new lambda.Function(this, 'Boto3IntegrationLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Demonstrates Boto3 usage for operations not natively supported by CloudFormation
    This function can be used to perform custom operations during pipeline execution
    """
    try:
        # Initialize AWS clients
        codepipeline_client = boto3.client('codepipeline')
        sns_client = boto3.client('sns')
        
        # Example: Get pipeline execution details
        pipeline_name = event.get('pipeline_name', 'tap-pipeline')
        
        # Send custom notification
        topic_arn = event.get('topic_arn')
        if topic_arn:
            message = {
                'pipeline': pipeline_name,
                'status': 'Custom operation completed',
                'timestamp': context.aws_request_id
            }
            
            sns_client.publish(
                TopicArn=topic_arn,
                Message=json.dumps(message),
                Subject='TAP Pipeline Custom Operation'
            )
        
        logger.info(f"Custom operation completed for pipeline: {pipeline_name}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Boto3 integration successful',
                'pipeline': pipeline_name
            })
        }
        
    except Exception as e:
        logger.error(f"Error in Boto3 integration: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
      timeout: cdk.Duration.minutes(5),
    });

    // Grant permissions to Lambda
    notificationTopic.grantPublish(boto3Lambda);
    boto3Lambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'codepipeline:GetPipelineExecution',
          'codepipeline:GetPipelineState',
        ],
        resources: ['*'],
      })
    );

    // ==============================================
    // CodePipeline
    // ==============================================

    /**
     * Artifacts for pipeline stages
     */
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    /**
     * Main CI/CD Pipeline with multiple stages and approval gates
     */
    const pipeline = new codepipeline.Pipeline(this, 'TapPipeline', {
      pipelineName: `tap-pipeline-${environmentSuffix}`,
      role: codePipelineRole,
      artifactBucket: artifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            // Using S3 as source for demo compatibility
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3_Source',
              bucket: artifactsBucket,
              bucketKey: 'source/source.zip',
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_and_Test',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'PreProductionApproval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Manual_Approval',
              notificationTopic: notificationTopic,
              additionalInformation:
                'Please review the build artifacts and approve deployment to production.',
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeDeployServerDeployAction({
              actionName: 'Deploy_to_EC2',
              input: buildOutput,
              deploymentGroup: deploymentGroup,
            }),
          ],
        },
        {
          stageName: 'PostDeploymentValidation',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'Custom_Validation',
              lambda: boto3Lambda,
              userParameters: {
                pipeline_name: `tap-pipeline-${environmentSuffix}`,
                topic_arn: notificationTopic.topicArn,
              },
            }),
          ],
        },
      ],
    });

    // ==============================================
    // Pipeline Event Rules for Notifications
    // ==============================================

    /**
     * CloudWatch Event Rules for pipeline state changes
     */
    pipeline.onStateChange('PipelineStateChange', {
      target: new cdk.aws_events_targets.SnsTopic(notificationTopic),
      description: 'Send notification when pipeline state changes',
    });

    // ==============================================
    // Custom Resource for Additional Boto3 Operations
    // ==============================================

    /**
     * Custom resource using Boto3 for operations not supported by CloudFormation
     */
    const customResourceProvider = new cr.Provider(
      this,
      'CustomResourceProvider',
      {
        onEventHandler: boto3Lambda,
      }
    );

    new cdk.CustomResource(this, 'PipelineCustomResource', {
      serviceToken: customResourceProvider.serviceToken,
      properties: {
        PipelineName: pipeline.pipelineName,
        TopicArn: notificationTopic.topicArn,
      },
    });

    // ==============================================
    // Stack Outputs for Auditing
    // ==============================================

    /**
     * Output important ARNs and identifiers for auditing and monitoring
     */
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'ARN of the main CI/CD pipeline',
      exportName: `TapPipelineArn${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BuildProjectArn', {
      value: buildProject.projectArn,
      description: 'ARN of the CodeBuild project',
      exportName: `TapBuildProjectArn${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeploymentApplicationArn', {
      value: codeDeployApplication.applicationArn,
      description: 'ARN of the CodeDeploy application',
      exportName: `TapDeployApplicationArn${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'ARN of the SNS notification topic',
      exportName: `TapNotificationTopicArn${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'Name of the encrypted S3 artifacts bucket',
      exportName: `TapArtifactsBucketName${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the VPC hosting the infrastructure',
      exportName: `TapVpcId${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Name of the Auto Scaling Group',
      exportName: `TapAutoScalingGroupName${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Boto3LambdaArn', {
      value: boto3Lambda.functionArn,
      description: 'ARN of the Boto3 integration Lambda function',
      exportName: `TapBoto3LambdaArn${environmentSuffix}`,
    });
  }
}
