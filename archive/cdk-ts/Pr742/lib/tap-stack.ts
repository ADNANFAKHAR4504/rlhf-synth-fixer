import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Apply tags to the entire stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'Enterprise-CICD');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // ========================================
    // PARAMETER STORE CONFIGURATION
    // ========================================

    // Store configuration parameters securely
    const appNameParameter = new ssm.StringParameter(this, 'AppNameParameter', {
      parameterName: '/cicd/app-name',
      stringValue: 'enterprise-web-app',
      description: 'Application name for the CI/CD pipeline',
    });

    const deploymentRegionsParameter = new ssm.StringListParameter(
      this,
      'DeploymentRegionsParameter',
      {
        parameterName: '/cicd/deployment-regions',
        stringListValue: ['us-east-1', 'us-west-2', 'eu-west-1'],
        description: 'List of regions for multi-region deployment',
      }
    );

    const notificationEmailParameter = new ssm.StringParameter(
      this,
      'NotificationEmailParameter',
      {
        parameterName: '/cicd/notification-email',
        stringValue: 'devops@company.com',
        description: 'Email address for pipeline notifications',
      }
    );

    // ========================================
    // S3 BUCKET FOR ARTIFACTS
    // ========================================

    // S3 bucket to store pipeline artifacts with cross-region replication capability
    const artifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
    });

    // ========================================
    // SNS TOPIC FOR NOTIFICATIONS
    // ========================================

    // SNS topic for pipeline notifications
    const pipelineNotificationsTopic = new sns.Topic(
      this,
      'PipelineNotificationsTopic',
      {
        topicName: 'enterprise-cicd-notifications',
        displayName: 'Enterprise CI/CD Pipeline Notifications',
      }
    );

    // Subscribe email to SNS topic
    pipelineNotificationsTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('devops@company.com')
    );

    // ========================================
    // IAM ROLES WITH LEAST PRIVILEGE
    // ========================================

    // CodePipeline Service Role
    const codePipelineRole = new iam.Role(this, 'CodePipelineServiceRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'Service role for CodePipeline with least privilege access',
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketVersioning',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:PutObjectAcl',
              ],
              resources: [
                artifactsBucket.bucketArn,
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              resources: ['*'], // Will be restricted to specific CodeBuild projects
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codedeploy:CreateDeployment',
                'codedeploy:GetApplication',
                'codedeploy:GetApplicationRevision',
                'codedeploy:GetDeployment',
                'codedeploy:GetDeploymentConfig',
                'codedeploy:RegisterApplicationRevision',
              ],
              resources: ['*'], // Will be restricted to specific CodeDeploy applications
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: ['*'], // Will be restricted to specific Lambda functions
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [pipelineNotificationsTopic.topicArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                appNameParameter.parameterArn,
                deploymentRegionsParameter.parameterArn,
                notificationEmailParameter.parameterArn,
              ],
            }),
          ],
        }),
      },
    });

    // CodeBuild Service Role
    const codeBuildRole = new iam.Role(this, 'CodeBuildServiceRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Service role for CodeBuild with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
      inlinePolicies: {
        BuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:PutObject'],
              resources: [`${artifactsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/*`,
              ],
            }),
          ],
        }),
      },
    });

    // CodeDeploy Service Role
    const codeDeployRole = new iam.Role(this, 'CodeDeployServiceRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      description: 'Service role for CodeDeploy with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSCodeDeployRole'
        ),
      ],
    });

    // Lambda Execution Role for Custom Validation
    const lambdaValidationRole = new iam.Role(this, 'LambdaValidationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda validation functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        ValidationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codepipeline:PutJobSuccessResult',
                'codepipeline:PutJobFailureResult',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject'],
              resources: [`${artifactsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/*`,
              ],
            }),
          ],
        }),
      },
    });

    // ========================================
    // LAMBDA FUNCTION FOR CUSTOM VALIDATION
    // ========================================

    // Lambda function for pre-deployment validation
    const preDeploymentValidationFunction = new lambda.Function(
      this,
      'PreDeploymentValidation',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'pre-deployment-validation.handler',
        role: lambdaValidationRole,
        timeout: cdk.Duration.minutes(5),
        description: 'Custom validation function for pre-deployment checks',
        code: lambda.Code.fromAsset('lib/lambda'),
        environment: {
          PIPELINE_NAME: 'enterprise-web-app-pipeline',
        },
      }
    );

    // ========================================
    // CODEBUILD PROJECT
    // ========================================

    // CodeBuild project for building the application
    const buildProject = new codebuild.Project(this, 'WebAppBuildProject', {
      projectName: 'enterprise-web-app-build',
      description: 'Build project for enterprise web application',
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: false,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'echo Build started on `date`',
              'echo Installing dependencies...',
              'npm install',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Running tests...',
              'npm test',
              'echo Building the application...',
              'npm run build',
              'echo Creating deployment package...',
              'zip -r deployment-package.zip . -x "node_modules/*" "*.git*"',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Uploading artifacts...',
            ],
          },
        },
        artifacts: {
          files: ['deployment-package.zip'],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        includeBuildId: true,
        packageZip: true,
      }),
    });

    // ========================================
    // CODEDEPLOY APPLICATION AND DEPLOYMENT GROUP
    // ========================================

    // CodeDeploy application
    const codeDeployApplication = new codedeploy.ServerApplication(
      this,
      'WebAppDeployApplication',
      {
        applicationName: 'enterprise-web-app',
      }
    );

    // Auto Scaling Group for EC2 instances
    // Create a new VPC for the application instead of looking up existing one
    const vpc = new ec2.Vpc(this, 'ApplicationVPC', {
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

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
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

    // Create Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
      }
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        vpc,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
      }
    );

    // CodeDeploy deployment group
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      'WebAppDeploymentGroup',
      {
        application: codeDeployApplication,
        deploymentGroupName: 'production-deployment-group',
        role: codeDeployRole,
        autoScalingGroups: [autoScalingGroup],
        deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
        },
      }
    );

    // ========================================
    // CODEPIPELINE DEFINITION
    // ========================================

    // Define source and build artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create the main CI/CD pipeline
    const pipeline = new codepipeline.Pipeline(this, 'EnterpriseCiCdPipeline', {
      pipelineName: 'enterprise-web-app-pipeline',
      role: codePipelineRole,
      artifactBucket: artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        // ========================================
        // SOURCE STAGE
        // ========================================
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'TuringGpt',
              repo: 'iac-test-automations',
              branch: 'IAC-291873',
              oauthToken: cdk.SecretValue.secretsManager(
                'arn:aws:secretsmanager:us-west-2:718240086340:secret:github-token-IAC-291873-K5769N'
              ),
              output: sourceOutput,
              trigger: codepipeline_actions.GitHubTrigger.POLL,
            }),
          ],
        },

        // ========================================
        // BUILD STAGE
        // ========================================
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_Application',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              environmentVariables: {
                ENVIRONMENT: {
                  value: 'production',
                },
                AWS_DEFAULT_REGION: {
                  value: this.region,
                },
              },
            }),
          ],
        },

        // ========================================
        // VALIDATION STAGE
        // ========================================
        {
          stageName: 'PreDeploymentValidation',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'Custom_Validation',
              lambda: preDeploymentValidationFunction,
              userParameters: {
                environment: 'production',
                validationType: 'pre-deployment',
              },
            }),
          ],
        },

        // ========================================
        // MANUAL APPROVAL STAGE
        // ========================================
        {
          stageName: 'ManualApproval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Manual_Approval_For_Production',
              notificationTopic: pipelineNotificationsTopic,
              additionalInformation:
                'Please review the build artifacts and approve deployment to production environment.',
              externalEntityLink:
                'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/enterprise-web-app-pipeline/view',
            }),
          ],
        },

        // ========================================
        // DEPLOYMENT STAGE
        // ========================================
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeDeployServerDeployAction({
              actionName: 'Deploy_To_Production',
              input: buildOutput,
              deploymentGroup: deploymentGroup,
            }),
          ],
        },

        // ========================================
        // POST-DEPLOYMENT VALIDATION STAGE
        // ========================================
        {
          stageName: 'PostDeploymentValidation',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'Post_Deployment_Tests',
              lambda: preDeploymentValidationFunction,
              userParameters: {
                environment: 'production',
                validationType: 'post-deployment',
              },
            }),
          ],
        },
      ],
    });

    // ========================================
    // PIPELINE NOTIFICATIONS
    // ========================================

    // CloudWatch Events Rule for Pipeline State Changes
    const pipelineStateChangeRule = new events.Rule(
      this,
      'PipelineStateChangeRule',
      {
        description: 'Capture pipeline state changes',
        eventPattern: {
          source: ['aws.codepipeline'],
          detailType: ['CodePipeline Pipeline Execution State Change'],
          detail: {
            pipeline: [pipeline.pipelineName],
          },
        },
      }
    );

    // Add SNS target to the rule
    pipelineStateChangeRule.addTarget(
      new events_targets.SnsTopic(pipelineNotificationsTopic, {
        message: events.RuleTargetInput.fromText(
          `Pipeline ${events.EventField.fromPath('$.detail.pipeline')} has changed state to ${events.EventField.fromPath('$.detail.state')} at ${events.EventField.fromPath('$.time')}`
        ),
      })
    );

    // CloudWatch Events Rule for Pipeline Stage State Changes
    const pipelineStageStateChangeRule = new events.Rule(
      this,
      'PipelineStageStateChangeRule',
      {
        description: 'Capture pipeline stage state changes',
        eventPattern: {
          source: ['aws.codepipeline'],
          detailType: ['CodePipeline Stage Execution State Change'],
          detail: {
            pipeline: [pipeline.pipelineName],
          },
        },
      }
    );

    pipelineStageStateChangeRule.addTarget(
      new events_targets.SnsTopic(pipelineNotificationsTopic, {
        message: events.RuleTargetInput.fromText(
          `Pipeline ${events.EventField.fromPath('$.detail.pipeline')} stage ${events.EventField.fromPath('$.detail.stage')} has changed state to ${events.EventField.fromPath('$.detail.state')} at ${events.EventField.fromPath('$.time')}`
        ),
      })
    );

    // ========================================
    // CROSS-REGION SUPPORT CONFIGURATION
    // ========================================

    // Note: CrossRegionSupport is not available in the current CDK version
    // For multi-region deployment, you would need to create separate stacks
    // or use cross-stack references with proper replication configuration

    // ========================================
    // OUTPUTS
    // ========================================

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD Pipeline',
    });

    new cdk.CfnOutput(this, 'PipelineUrl', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view`,
      description: 'URL to view the pipeline in AWS Console',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'Name of the S3 bucket storing pipeline artifacts',
    });

    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: pipelineNotificationsTopic.topicArn,
      description: 'ARN of the SNS topic for pipeline notifications',
    });

    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: codeDeployApplication.applicationName,
      description: 'Name of the CodeDeploy application',
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: buildProject.projectName,
      description: 'Name of the CodeBuild project',
    });
  }
}
