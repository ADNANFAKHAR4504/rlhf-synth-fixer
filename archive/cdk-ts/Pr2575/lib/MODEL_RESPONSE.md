I'll help you implement a complete CI/CD pipeline in your existing `lib/tap-stack.ts` file. Here's the updated implementation that includes all your requirements:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  notificationEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const notificationEmail = 
      props?.notificationEmail || 
      this.node.tryGetContext('notificationEmail') || 
      'admin@example.com';

    // 🔐 KMS Key for encryption
    const pipelineKmsKey = new kms.Key(this, `PipelineKmsKey-${environmentSuffix}`, {
      description: `KMS key for CI/CD pipeline encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    pipelineKmsKey.addAlias(`alias/tap-pipeline-${environmentSuffix}`);

    // 📦 S3 Bucket for source code (triggers pipeline)
    const sourceBucket = new s3.Bucket(this, `SourceBucket-${environmentSuffix}`, {
      bucketName: `tap-source-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryptionKey: pipelineKmsKey,
      encryption: s3.BucketEncryption.KMS,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
    });

    // 📦 S3 Bucket for pipeline artifacts
    const artifactsBucket = new s3.Bucket(this, `ArtifactsBucket-${environmentSuffix}`, {
      bucketName: `tap-artifacts-${environmentSuffix}-${this.account}`,
      encryptionKey: pipelineKmsKey,
      encryption: s3.BucketEncryption.KMS,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{
        id: 'DeleteArtifacts',
        expiration: cdk.Duration.days(30),
      }],
    });

    // 📧 SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, `PipelineNotifications-${environmentSuffix}`, {
      topicName: `tap-pipeline-notifications-${environmentSuffix}`,
      displayName: `TAP Pipeline Notifications - ${environmentSuffix}`,
      masterKey: pipelineKmsKey,
    });

    notificationTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(notificationEmail)
    );

    // 📝 CloudWatch Log Groups
    const buildLogGroup = new logs.LogGroup(this, `BuildLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: pipelineKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const pipelineLogGroup = new logs.LogGroup(this, `PipelineLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/codepipeline/tap-pipeline-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: pipelineKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔑 IAM Role for CodeBuild
    const codeBuildRole = new iam.Role(this, `CodeBuildRole-${environmentSuffix}`, {
      roleName: `tap-codebuild-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
      ],
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [buildLogGroup.logGroupArn + ':*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ],
              resources: [
                artifactsBucket.bucketArn + '/*',
                sourceBucket.bucketArn + '/*',
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [pipelineKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // 🔑 IAM Role for CodePipeline
    const codePipelineRole = new iam.Role(this, `CodePipelineRole-${environmentSuffix}`, {
      roleName: `tap-codepipeline-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
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
              ],
              resources: [
                artifactsBucket.bucketArn,
                artifactsBucket.bucketArn + '/*',
                sourceBucket.bucketArn,
                sourceBucket.bucketArn + '/*',
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'elasticbeanstalk:*',
                's3:ListAllMyBuckets',
                's3:GetBucketLocation',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish',
              ],
              resources: [notificationTopic.topicArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [pipelineKmsKey.keyArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [pipelineLogGroup.logGroupArn + ':*'],
            }),
          ],
        }),
      },
    });

    // 🏗️ CodeBuild Project
    const buildProject = new codebuild.Project(this, `BuildProject-${environmentSuffix}`, {
      projectName: `tap-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
        environmentVariables: {
          ENVIRONMENT: {
            value: environmentSuffix,
          },
          AWS_DEFAULT_REGION: {
            value: this.region,
          },
          AWS_ACCOUNT_ID: {
            value: this.account,
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
              'echo Environment: $ENVIRONMENT',
              'npm ci --only=production',
            ],
          },
          build: {
            commands: [
              'echo Build phase started on `date`',
              'npm run build',
              'npm test',
              'echo Creating deployment package...',
              'zip -r application.zip . -x "node_modules/*" "*.git*" "tests/*" "*.md"',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Build phase completed',
            ],
          },
        },
        artifacts: {
          files: [
            'application.zip',
            'Dockerrun.aws.json',
            '.ebextensions/**/*',
          ],
        },
        reports: {
          'tap-test-reports': {
            files: [
              'coverage/**/*',
              'test-results.xml',
            ],
            'base-directory': '.',
          },
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        includeBuildId: false,
        packageZip: true,
      }),
      logging: {
        cloudWatch: {
          logGroup: buildLogGroup,
        },
      },
      encryptionKey: pipelineKmsKey,
    });

    // 🔑 IAM Role for Elastic Beanstalk
    const ebInstanceRole = new iam.Role(this, `EBInstanceRole-${environmentSuffix}`, {
      roleName: `tap-eb-instance-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWorkerTier'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkMulticontainerDocker'),
      ],
    });

    const ebInstanceProfile = new iam.CfnInstanceProfile(this, `EBInstanceProfile-${environmentSuffix}`, {
      instanceProfileName: `tap-eb-instance-profile-${environmentSuffix}`,
      roles: [ebInstanceRole.roleName],
    });

    const ebServiceRole = new iam.Role(this, `EBServiceRole-${environmentSuffix}`, {
      roleName: `tap-eb-service-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSElasticBeanstalkEnhancedHealth'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy'),
      ],
    });

    // 🌱 Elastic Beanstalk Application
    const ebApplication = new elasticbeanstalk.CfnApplication(this, `EBApplication-${environmentSuffix}`, {
      applicationName: `tap-app-${environmentSuffix}`,
      description: `TAP Application - ${environmentSuffix} environment`,
    });

    // 🌱 Elastic Beanstalk Environment
    const ebEnvironment = new elasticbeanstalk.CfnEnvironment(this, `EBEnvironment-${environmentSuffix}`, {
      applicationName: ebApplication.applicationName!,
      environmentName: `tap-env-${environmentSuffix}`,
      solutionStackName: '64bit Amazon Linux 2 v5.8.4 running Node.js 18',
      optionSettings: [
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: ebInstanceProfile.instanceProfileName!,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'ServiceRole',
          value: ebServiceRole.roleArn,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'EnvironmentType',
          value: 'LoadBalanced',
        },
        {
          namespace: 'aws:autoscaling:asg',
          optionName: 'MinSize',
          value: environmentSuffix === 'prod' ? '2' : '1',
        },
        {
          namespace: 'aws:autoscaling:asg',
          optionName: 'MaxSize',
          value: environmentSuffix === 'prod' ? '6' : '2',
        },
        {
          namespace: 'aws:elasticbeanstalk:healthreporting:system',
          optionName: 'SystemType',
          value: 'enhanced',
        },
        {
          namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
          optionName: 'StreamLogs',
          value: 'true',
        },
        {
          namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
          optionName: 'DeleteOnTerminate',
          value: 'false',
        },
        {
          namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
          optionName: 'RetentionInDays',
          value: '30',
        },
      ],
    });

    ebEnvironment.addDependency(ebApplication);

    // 🔄 CodePipeline Artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // 🚀 CodePipeline
    const pipeline = new codepipeline.Pipeline(this, `Pipeline-${environmentSuffix}`, {
      pipelineName: `tap-pipeline-${environmentSuffix}`,
      role: codePipelineRole,
      artifactBucket: artifactsBucket,
      encryptionKey: pipelineKmsKey,
      stages: [
        // 📥 Source Stage
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.S3SourceAction({
              actionName: 'S3Source',
              bucket: sourceBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
              trigger: codepipelineActions.S3Trigger.POLL,
            }),
          ],
        },
        // 🏗️ Build Stage
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
              environmentVariables: {
                ENVIRONMENT: {
                  value: environmentSuffix,
                },
              },
            }),
          ],
        },
        // ✅ Manual Approval (for production)
        ...(environmentSuffix === 'prod' ? [{
          stageName: 'ManualApproval',
          actions: [
            new codepipelineActions.ManualApprovalAction({
              actionName: 'ManualApproval',
              additionalInformation: `Please review the build artifacts and approve deployment to ${environmentSuffix} environment.`,
              notificationTopic: notificationTopic,
              externalEntityLink: `https://console.aws.amazon.com/elasticbeanstalk/home?region=${this.region}#/environment/dashboard?applicationName=${ebApplication.applicationName}&environmentId=${ebEnvironment.ref}`,
            }),
          ],
        }] : []),
        // 🚀 Deploy Stage
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.ElasticBeanstalkDeployAction({
              actionName: 'Deploy',
              applicationName: ebApplication.applicationName!,
              environmentName: ebEnvironment.environmentName!,
              input: buildOutput,
            }),
          ],
        },
      ],
    });

    // 📧 Pipeline state change notifications
    pipeline.onStateChange(`PipelineStateChange-${environmentSuffix}`, {
      target: new cdk.aws_events_targets.SnsTopic(notificationTopic),
      description: `Pipeline state change notifications for ${environmentSuffix}`,
      eventPattern: {
        detail: {
          state: ['FAILED', 'SUCCEEDED'],
        },
      },
    });

    // 🔔 S3 bucket notification to trigger pipeline
    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.SnsDestination(notificationTopic),
      { prefix: 'source.zip' }
    );

    // 📊 CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, `PipelineDashboard-${environmentSuffix}`, {
      dashboardName: `tap-pipeline-${environmentSuffix}`,
      widgets: [
        [
          new cdk.aws_cloudwatch.TextWidget({
            markdown: `# TAP CI/CD Pipeline - ${environmentSuffix.toUpperCase()}\n\nMonitoring dashboard for the TAP application pipeline.`,
            width: 24,
            height: 2,
          }),
        ],
        [
          new cdk.aws_cloudwatch.SingleValueWidget({
            title: 'Pipeline Executions',
            metrics: [
              new cdk.aws_cloudwatch.Metric({
                namespace: 'AWS/CodePipeline',
                metricName: 'PipelineExecutionSuccess',
                dimensionsMap: {
                  PipelineName: pipeline.pipelineName,
                },
                statistic: 'Sum',
                period: cdk.Duration.days(1),
              }),
            ],
            width: 8,
          }),
          new cdk.aws_cloudwatch.SingleValueWidget({
            title: 'Build Success Rate',
            metrics: [
              new cdk.aws_cloudwatch.Metric({
                namespace: 'AWS/CodeBuild',
                metricName: 'SucceededBuilds',
                dimensionsMap: {
                  ProjectName: buildProject.projectName,
                },
                statistic: 'Sum',
                period: cdk.Duration.days(1),
              }),
            ],
            width: 8,
          }),
          new cdk.aws_cloudwatch.SingleValueWidget({
            title: 'Environment Health',
            metrics: [
              new cdk.aws_cloudwatch.Metric({
                namespace: 'AWS/ElasticBeanstalk',
                metricName: 'EnvironmentHealth',
                dimensionsMap: {
                  EnvironmentName: ebEnvironment.environmentName!,
                },
                statistic: 'Average',
                period: cdk.Duration.minutes(5),
              }),
            ],
            width: 8,
          }),
        ],
      ],
    });

    // 📤 Stack Outputs
    new cdk.CfnOutput(this, `SourceBucketName-${environmentSuffix}`, {
      value: sourceBucket.bucketName,
      description: `Source bucket for ${environmentSuffix} environment`,
      exportName: `tap-source-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PipelineName-${environmentSuffix}`, {
      value: pipeline.pipelineName,
      description: `Pipeline name for ${environmentSuffix} environment`,
      exportName: `tap-pipeline-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `EBEnvironmentURL-${environmentSuffix}`, {
      value: `http://${ebEnvironment.attrEndpointUrl}`,
      description: `Elastic Beanstalk environment URL for ${environmentSuffix}`,
      exportName: `tap-eb-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `DashboardURL-${environmentSuffix}`, {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: `CloudWatch dashboard URL for ${environmentSuffix} environment`,
      exportName: `tap-dashboard-url-${environmentSuffix}`,
    });
  }
}
```

## Key Features Implemented

### 🔐 **Security**
- **KMS encryption** for all S3 buckets and pipeline artifacts
- **IAM roles** with least privilege principles
- **Encrypted CloudWatch logs**
- **Secure artifact storage**

### 📦 **Source Management**
- **S3 bucket** as source trigger
- **Versioned storage** with lifecycle policies
- **Automatic pipeline triggering** on source updates

### 🏗️ **Build Process**
- **CodeBuild project** with comprehensive buildspec
- **Environment-specific builds**
- **Test execution** and reporting
- **Artifact packaging**

### 🚀 **Deployment**
- **Elastic Beanstalk** deployment
- **Auto-scaling configuration**
- **Health monitoring**
- **Environment-specific settings**

### ✅ **Manual Approval**
- **Production-only approval gates**
- **SNS notifications** for approvals
- **External links** for review

### 📊 **Monitoring & Logging**
- **CloudWatch logs** for all stages
- **Pipeline state notifications**
- **Comprehensive dashboard**
- **Build and deployment metrics**

### 🔄 **Rollback Mechanisms**
- **Elastic Beanstalk** automatic rollback on deployment failure
- **Versioned deployments**
- **Health-based rollback triggers**

## Usage Instructions

1. **Deploy the stack:**
   ```bash
   cdk deploy --context environmentSuffix=dev --context notificationEmail=your-email@example.com
   ```

2. **Upload source code:**
   ```bash
   zip -r source.zip . -x "node_modules/*" "*.git*"
   aws s3 cp source.zip s3://tap-source-dev-YOUR-ACCOUNT-ID/source.zip
   ```

3. **Monitor the pipeline:**
   - Check the CloudWatch dashboard
   - Monitor SNS notifications
   - Review build logs in CloudWatch

The pipeline will automatically trigger when you upload new source code to the S3 bucket, providing a complete CI/CD solution with security, monitoring, and rollback capabilities.
