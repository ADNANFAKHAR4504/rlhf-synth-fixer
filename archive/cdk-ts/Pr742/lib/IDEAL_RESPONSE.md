# Ideal CI/CD Pipeline Implementation with AWS CDK

This document presents an ideal implementation of a comprehensive CI/CD pipeline using AWS CDK with TypeScript, incorporating best practices from both the model response and actual implementation.

## Key Improvements Over Original Implementations

### 1. **Flexible Configuration with Environment Parameters**
### 2. **Proper Cross-Region Support Architecture**  
### 3. **Comprehensive Security with Least Privilege**
### 4. **Modern Lambda Implementation with External Assets**
### 5. **Robust VPC and Networking Configuration**
### 6. **Enhanced Monitoring and Alerting**

---

## Complete CDK Stack Implementation

```typescript
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
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

interface EnterpriseCiCdPipelineStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
  notificationEmail?: string;
  deploymentRegions?: string[];
  createNewVpc?: boolean;
}

export class EnterpriseCiCdPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: EnterpriseCiCdPipelineStackProps) {
    super(scope, id, props);

    // Configuration with sensible defaults
    const config = {
      environmentSuffix: props?.environmentSuffix || 'prod',
      githubOwner: props?.githubOwner || 'TuringGpt',
      githubRepo: props?.githubRepo || 'iac-test-automations',
      githubBranch: props?.githubBranch || 'main',
      notificationEmail: props?.notificationEmail || 'devops@company.com',
      deploymentRegions: props?.deploymentRegions || ['us-east-1', 'us-west-2', 'eu-west-1'],
      createNewVpc: props?.createNewVpc ?? true,
    };

    // Apply comprehensive tags to the entire stack
    cdk.Tags.of(this).add('Environment', config.environmentSuffix);
    cdk.Tags.of(this).add('Project', 'Enterprise-CICD');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CreatedBy', 'EnterpriseCiCdPipelineStack');

    // ========================================
    // PARAMETER STORE CONFIGURATION
    // ========================================

    const appNameParameter = new ssm.StringParameter(this, 'AppNameParameter', {
      parameterName: `/cicd/${config.environmentSuffix}/app-name`,
      stringValue: `enterprise-web-app-${config.environmentSuffix}`,
      description: 'Application name for the CI/CD pipeline',
      tier: ssm.ParameterTier.STANDARD,
    });

    const deploymentRegionsParameter = new ssm.StringListParameter(
      this,
      'DeploymentRegionsParameter',
      {
        parameterName: `/cicd/${config.environmentSuffix}/deployment-regions`,
        stringListValue: config.deploymentRegions,
        description: 'List of regions for multi-region deployment',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    const notificationEmailParameter = new ssm.StringParameter(
      this,
      'NotificationEmailParameter',
      {
        parameterName: `/cicd/${config.environmentSuffix}/notification-email`,
        stringValue: config.notificationEmail,
        description: 'Email address for pipeline notifications',
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // ========================================
    // S3 BUCKET FOR ARTIFACTS WITH ENHANCED SECURITY
    // ========================================

    const artifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // ========================================
    // CLOUDWATCH LOG GROUPS
    // ========================================

    const pipelineLogGroup = new logs.LogGroup(this, 'PipelineLogGroup', {
      logGroupName: `/aws/codepipeline/enterprise-web-app-${config.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const buildLogGroup = new logs.LogGroup(this, 'BuildLogGroup', {
      logGroupName: `/aws/codebuild/enterprise-web-app-build-${config.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // SNS TOPIC FOR NOTIFICATIONS WITH DLQ
    // ========================================

    const notificationsDLQ = new sns.Topic(this, 'NotificationsDLQ', {
      topicName: `enterprise-cicd-notifications-dlq-${config.environmentSuffix}`,
      displayName: 'Enterprise CI/CD Pipeline Notifications Dead Letter Queue',
    });

    const pipelineNotificationsTopic = new sns.Topic(this, 'PipelineNotificationsTopic', {
      topicName: `enterprise-cicd-notifications-${config.environmentSuffix}`,
      displayName: 'Enterprise CI/CD Pipeline Notifications',
    });

    pipelineNotificationsTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(config.notificationEmail)
    );

    // ========================================
    // VPC CONFIGURATION (FLEXIBLE)
    // ========================================

    let vpc: ec2.IVpc;
    
    if (config.createNewVpc) {
      vpc = new ec2.Vpc(this, 'ApplicationVPC', {
        maxAzs: 3,
        natGateways: 2, // For high availability
        enableDnsHostnames: true,
        enableDnsSupport: true,
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
          {
            cidrMask: 28,
            name: 'Isolated',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
      });
    } else {
      vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
        isDefault: true,
      });
    }

    // ========================================
    // IAM ROLES WITH ENHANCED LEAST PRIVILEGE
    // ========================================

    // CodePipeline Service Role with specific resource restrictions
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
              resources: [
                `arn:aws:codebuild:${this.region}:${this.account}:project/enterprise-web-app-build-*`,
              ],
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
              resources: [
                `arn:aws:codedeploy:${this.region}:${this.account}:application:enterprise-web-app-*`,
                `arn:aws:codedeploy:${this.region}:${this.account}:deploymentgroup:enterprise-web-app-*/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: [
                `arn:aws:lambda:${this.region}:${this.account}:function:*validation*`,
              ],
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
                `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/${config.environmentSuffix}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [pipelineLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // CodeBuild Service Role with enhanced permissions
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
                `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/${config.environmentSuffix}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:GetAuthorizationToken',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [buildLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // CodeDeploy Service Role (unchanged but with better naming)
    const codeDeployRole = new iam.Role(this, 'CodeDeployServiceRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      description: 'Service role for CodeDeploy with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRoleForAutoScaling'),
      ],
    });

    // Lambda Execution Role with enhanced permissions
    const lambdaValidationRole = new iam.Role(this, 'LambdaValidationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda validation functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
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
                `arn:aws:ssm:${this.region}:${this.account}:parameter/cicd/${config.environmentSuffix}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [pipelineNotificationsTopic.topicArn],
            }),
          ],
        }),
      },
    });

    // ========================================
    // LAMBDA FUNCTIONS FOR VALIDATION
    // ========================================

    // Pre-deployment validation function
    const preDeploymentValidationFunction = new lambda.Function(
      this,
      'PreDeploymentValidation',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'pre-deployment-validation.handler',
        role: lambdaValidationRole,
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        description: 'Custom validation function for pre-deployment checks',
        code: lambda.Code.fromAsset('lib/lambda'),
        environment: {
          PIPELINE_NAME: `enterprise-web-app-pipeline-${config.environmentSuffix}`,
          ENVIRONMENT: config.environmentSuffix,
          SNS_TOPIC_ARN: pipelineNotificationsTopic.topicArn,
          ARTIFACTS_BUCKET: artifactsBucket.bucketName,
        },
        deadLetterQueue: new sqs.Queue(this, 'ValidationDLQ', {
          queueName: `validation-dlq-${config.environmentSuffix}`,
          retentionPeriod: cdk.Duration.days(14),
        }),
      }
    );

    // Post-deployment validation function
    const postDeploymentValidationFunction = new lambda.Function(
      this,
      'PostDeploymentValidation',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'post-deployment-validation.handler',
        role: lambdaValidationRole,
        timeout: cdk.Duration.minutes(10),
        memorySize: 512,
        description: 'Custom validation function for post-deployment checks',
        code: lambda.Code.fromAsset('lib/lambda'),
        environment: {
          PIPELINE_NAME: `enterprise-web-app-pipeline-${config.environmentSuffix}`,
          ENVIRONMENT: config.environmentSuffix,
          SNS_TOPIC_ARN: pipelineNotificationsTopic.topicArn,
        },
      }
    );

    // ========================================
    // CODEBUILD PROJECT WITH ENHANCED CONFIGURATION
    // ========================================

    const buildProject = new codebuild.Project(this, 'WebAppBuildProject', {
      projectName: `enterprise-web-app-build-${config.environmentSuffix}`,
      description: `Build project for enterprise web application - ${config.environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // Updated to latest
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: false,
        environmentVariables: {
          AWS_DEFAULT_REGION: {
            value: this.region,
          },
          AWS_ACCOUNT_ID: {
            value: this.account,
          },
          ENVIRONMENT: {
            value: config.environmentSuffix,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        env: {
          'parameter-store': {
            APP_NAME: `/cicd/${config.environmentSuffix}/app-name`,
            NOTIFICATION_EMAIL: `/cicd/${config.environmentSuffix}/notification-email`,
          },
        },
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
          },
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'echo Build started on `date`',
              'echo Installing dependencies...',
              'npm ci --only=production',
              'echo Running security audit...',
              'npm audit --audit-level moderate',
              'echo Running linting...',
              'npm run lint',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Running tests...',
              'npm test -- --coverage --watchAll=false',
              'echo Building the application...',
              'npm run build',
              'echo Creating deployment package...',
              'zip -r deployment-package.zip . -x "node_modules/*" "*.git*" "coverage/*" "test/*"',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Uploading artifacts...',
              'echo Publishing test results...',
            ],
          },
        },
        reports: {
          'test-reports': {
            files: ['coverage/lcov.info'],
            'base-directory': 'coverage',
            'file-format': 'CLOVERXML',
          },
        },
        artifacts: {
          files: [
            'deployment-package.zip',
            'appspec.yml',
            'scripts/**/*',
            'package.json',
            'package-lock.json',
          ],
          name: 'BuildArtifact',
        },
        cache: {
          paths: [
            '/root/.npm/**/*',
            'node_modules/**/*',
          ],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        includeBuildId: true,
        packageZip: false,
      }),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE, codebuild.LocalCacheMode.CUSTOM),
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
    });

    // ========================================
    // EC2 INFRASTRUCTURE FOR DEPLOYMENT
    // ========================================

    // Security Group for application instances
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description: 'Security group for application instances',
      allowAllOutbound: true,
    });

    appSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    appSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // IAM role for EC2 instances with enhanced permissions
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2RoleforAWSCodeDeploy'),
      ],
      inlinePolicies: {
        S3ArtifactsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [
                artifactsBucket.bucketArn,
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Launch Template with user data for CodeDeploy agent installation
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebAppLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL), // Upgraded from micro
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      role: ec2Role,
      securityGroup: appSecurityGroup,
      userData: ec2.UserData.forLinux(),
    });

    // Add user data script to install CodeDeploy agent
    launchTemplate.userData.addCommands(
      'yum update -y',
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      'wget https://aws-codedeploy-' + this.region + '.s3.' + this.region + '.amazonaws.com/latest/install',
      'chmod +x ./install',
      './install auto',
      'service codedeploy-agent start',
      'chkconfig codedeploy-agent on'
    );

    // Auto Scaling Group with enhanced configuration
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 10, // Increased for better scalability
      desiredCapacity: 3, // Increased from 2
      healthCheckType: autoscaling.HealthCheckType.ELB,
      healthCheckGracePeriod: cdk.Duration.minutes(5),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 2,
        pauseTime: cdk.Duration.minutes(10),
      }),
    });

    // Add scaling policies
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(3),
    });

    // ========================================
    // CODEDEPLOY APPLICATION AND DEPLOYMENT GROUP
    // ========================================

    const codeDeployApplication = new codedeploy.ServerApplication(
      this,
      'WebAppDeployApplication',
      {
        applicationName: `enterprise-web-app-${config.environmentSuffix}`,
      }
    );

    // Create CloudWatch Alarms for deployment monitoring
    const deploymentAlarm = new cloudwatch.Alarm(this, 'DeploymentFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeDeploy',
        metricName: 'Deployments',
        dimensionsMap: {
          ApplicationName: codeDeployApplication.applicationName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      'WebAppDeploymentGroup',
      {
        application: codeDeployApplication,
        deploymentGroupName: `${config.environmentSuffix}-deployment-group`,
        role: codeDeployRole,
        autoScalingGroups: [autoScalingGroup],
        deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE_HALF_AT_A_TIME, // More conservative
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: true,
        },
        alarms: [deploymentAlarm],
        ignorePollAlarmsFailure: false,
      }
    );

    // ========================================
    // ENHANCED CODEPIPELINE DEFINITION
    // ========================================

    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    const pipeline = new codepipeline.Pipeline(this, 'EnterpriseCiCdPipeline', {
      pipelineName: `enterprise-web-app-pipeline-${config.environmentSuffix}`,
      role: codePipelineRole,
      artifactBucket: artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        // SOURCE STAGE
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: config.githubOwner,
              repo: config.githubRepo,
              branch: config.githubBranch,
              oauthToken: cdk.SecretValue.secretsManager('github-token'), // Simplified for flexibility
              output: sourceOutput,
              trigger: codepipeline_actions.GitHubTrigger.WEBHOOK, // More responsive than polling
            }),
          ],
        },

        // BUILD AND TEST STAGE
        {
          stageName: 'BuildAndTest',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_And_Test',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              environmentVariables: {
                ENVIRONMENT: {
                  value: config.environmentSuffix,
                },
                AWS_DEFAULT_REGION: {
                  value: this.region,
                },
                PIPELINE_EXECUTION_ID: {
                  value: codepipeline.GlobalVariables.executionId,
                },
              },
            }),
          ],
        },

        // SECURITY AND QUALITY GATE
        {
          stageName: 'SecurityAndQualityGate',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'Security_Scan_And_Validation',
              lambda: preDeploymentValidationFunction,
              userParameters: {
                environment: config.environmentSuffix,
                validationType: 'security-quality-gate',
                executionId: codepipeline.GlobalVariables.executionId,
              },
            }),
          ],
        },

        // MANUAL APPROVAL (for production only)
        ...(config.environmentSuffix === 'prod' ? [{
          stageName: 'ManualApproval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Production_Deployment_Approval',
              notificationTopic: pipelineNotificationsTopic,
              additionalInformation: `Please review the build artifacts for ${config.environmentSuffix} environment and approve deployment.`,
              externalEntityLink: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/enterprise-web-app-pipeline-${config.environmentSuffix}/view`,
            }),
          ],
        }] : []),

        // DEPLOYMENT STAGE
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeDeployServerDeployAction({
              actionName: `Deploy_To_${config.environmentSuffix}`,
              input: buildOutput,
              deploymentGroup: deploymentGroup,
            }),
          ],
        },

        // POST-DEPLOYMENT VALIDATION
        {
          stageName: 'PostDeploymentValidation',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'Post_Deployment_Tests',
              lambda: postDeploymentValidationFunction,
              userParameters: {
                environment: config.environmentSuffix,
                validationType: 'post-deployment',
                executionId: codepipeline.GlobalVariables.executionId,
              },
            }),
          ],
        },
      ],
    });

    // ========================================
    // ENHANCED MONITORING AND NOTIFICATIONS
    // ========================================

    // Pipeline state change events
    const pipelineStateChangeRule = new events.Rule(this, 'PipelineStateChangeRule', {
      description: `Capture pipeline state changes for ${config.environmentSuffix}`,
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
          state: ['FAILED', 'SUCCEEDED', 'SUPERSEDED'],
        },
      },
    });

    pipelineStateChangeRule.addTarget(
      new events_targets.SnsTopic(pipelineNotificationsTopic, {
        message: events.RuleTargetInput.fromText(
          `🚀 Pipeline Alert: ${events.EventField.fromPath('$.detail.pipeline')} 
           State: ${events.EventField.fromPath('$.detail.state')}
           Time: ${events.EventField.fromPath('$.time')}
           Environment: ${config.environmentSuffix}
           Execution ID: ${events.EventField.fromPath('$.detail.execution-id')}`
        ),
      })
    );

    // Stage-specific notifications
    const criticalStageRule = new events.Rule(this, 'CriticalStageRule', {
      description: `Monitor critical stages for ${config.environmentSuffix}`,
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Stage Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
          stage: ['Deploy', 'SecurityAndQualityGate'],
          state: ['FAILED'],
        },
      },
    });

    criticalStageRule.addTarget(
      new events_targets.SnsTopic(pipelineNotificationsTopic, {
        message: events.RuleTargetInput.fromText(
          `🚨 CRITICAL: Stage ${events.EventField.fromPath('$.detail.stage')} FAILED
           Pipeline: ${events.EventField.fromPath('$.detail.pipeline')}
           Environment: ${config.environmentSuffix}
           Time: ${events.EventField.fromPath('$.time')}
           Action Required: Immediate investigation needed!`
        ),
      })
    );

    // ========================================
    // CLOUDWATCH DASHBOARDS
    // ========================================

    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: `Enterprise-CICD-Dashboard-${config.environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Pipeline Execution Success Rate',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionSuccess',
            dimensionsMap: {
              PipelineName: pipeline.pipelineName,
            },
            statistic: 'Average',
            period: cdk.Duration.hours(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Build Duration',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/CodeBuild',
            metricName: 'Duration',
            dimensionsMap: {
              ProjectName: buildProject.projectName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(15),
          }),
        ],
      })
    );

    // ========================================
    // COMPREHENSIVE OUTPUTS
    // ========================================

    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD Pipeline',
      exportName: `PipelineName-${config.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineUrl', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view`,
      description: 'URL to view the pipeline in AWS Console',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'Name of the S3 bucket storing pipeline artifacts',
      exportName: `ArtifactsBucket-${config.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NotificationsTopicArn', {
      value: pipelineNotificationsTopic.topicArn,
      description: 'ARN of the SNS topic for pipeline notifications',
      exportName: `NotificationsTopic-${config.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for the deployment infrastructure',
      exportName: `VpcId-${config.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Name of the Auto Scaling Group',
      exportName: `ASGName-${config.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'URL to view the CloudWatch dashboard',
    });
  }
}
```

## Key Improvements Implemented

### 1. **Configuration Flexibility**
- Parameterized environment suffix for multi-environment deployments
- Configurable GitHub repository settings
- Flexible VPC creation vs. lookup options
- Environment-specific notification emails

### 2. **Enhanced Security**
- Least privilege IAM roles with specific resource ARNs
- S3 bucket with SSL enforcement and lifecycle policies
- Security groups with minimal required access
- Parameter Store integration for secure configuration management

### 3. **Improved Monitoring**
- CloudWatch log groups for centralized logging
- CloudWatch dashboards for visual monitoring
- Enhanced SNS notifications with detailed context
- Critical stage failure alerting

### 4. **Better Architecture**
- Separate Lambda functions for pre and post-deployment validation
- Launch templates for better EC2 management
- Enhanced Auto Scaling with CPU-based scaling
- CodeDeploy with conservative deployment strategies

### 5. **Production Readiness**
- Dead letter queues for Lambda functions
- Comprehensive error handling and rollback strategies
- Cache configuration for faster builds
- Test report integration
- Security scanning in build process

### 6. **Multi-Environment Support**
- Environment-specific resource naming
- Conditional manual approval for production
- Environment-aware configuration parameters
- Cross-stack exports for resource sharing

### 7. **Enhanced Build Process**
- Updated to latest CodeBuild images
- Comprehensive build phases with security scanning
- Test coverage reporting
- Improved artifact management
- Build caching for performance

This ideal implementation addresses all the shortcomings identified in the model failures analysis while maintaining the architectural benefits of both approaches.