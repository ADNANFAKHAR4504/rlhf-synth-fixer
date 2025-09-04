# Complete CI/CD Pipeline with AWS CDK

I'll create a comprehensive CI/CD pipeline using AWS CDK with TypeScript that meets all your requirements. This solution provides an enterprise-grade, secure, and scalable pipeline architecture.

## CDK Stack Implementation

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
import { Construct } from 'constructs';

export class EnterpriseCiCdPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'Enterprise-CICD',
      ManagedBy: 'CDK'
    };

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

    const deploymentRegionsParameter = new ssm.StringListParameter(this, 'DeploymentRegionsParameter', {
      parameterName: '/cicd/deployment-regions',
      stringListValue: ['us-east-1', 'us-west-2', 'eu-west-1'],
      description: 'List of regions for multi-region deployment',
    });

    const notificationEmailParameter = new ssm.StringParameter(this, 'NotificationEmailParameter', {
      parameterName: '/cicd/notification-email',
      stringValue: 'devops@company.com',
      description: 'Email address for pipeline notifications',
    });

    // ========================================
    // S3 BUCKET FOR ARTIFACTS
    // ========================================

    // S3 bucket to store pipeline artifacts with cross-region replication capability
    const artifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      bucketName: `enterprise-cicd-artifacts-${this.account}-${this.region}`,
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
    const pipelineNotificationsTopic = new sns.Topic(this, 'PipelineNotificationsTopic', {
      topicName: 'enterprise-cicd-notifications',
      displayName: 'Enterprise CI/CD Pipeline Notifications',
    });

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
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
              ],
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
              actions: [
                'lambda:InvokeFunction',
              ],
              resources: ['*'], // Will be restricted to specific Lambda functions
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish',
              ],
              resources: [pipelineNotificationsTopic.topicArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
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
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
              ],
              resources: [
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
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
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSCodeDeployRole'),
      ],
    });

    // Lambda Execution Role for Custom Validation
    const lambdaValidationRole = new iam.Role(this, 'LambdaValidationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda validation functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
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
              actions: [
                's3:GetObject',
              ],
              resources: [
                `${artifactsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
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
    const preDeploymentValidationFunction = new lambda.Function(this, 'PreDeploymentValidation', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      role: lambdaValidationRole,
      timeout: cdk.Duration.minutes(5),
      description: 'Custom validation function for pre-deployment checks',
      code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Custom validation function for CodePipeline
    Performs pre-deployment checks and validation
    """
    codepipeline = boto3.client('codepipeline')
    job_id = event['CodePipeline.job']['id']
    
    try:
        # Extract job data
        job_data = event['CodePipeline.job']['data']
        
        # Perform custom validation logic here
        # Example: Check if deployment should proceed based on business rules
        validation_passed = perform_validation_checks(job_data)
        
        if validation_passed:
            logger.info("Validation passed successfully")
            codepipeline.put_job_success_result(jobId=job_id)
        else:
            logger.error("Validation failed")
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={'message': 'Custom validation failed', 'type': 'JobFailed'}
            )
    
    except Exception as e:
        logger.error(f"Error during validation: {str(e)}")
        codepipeline.put_job_failure_result(
            jobId=job_id,
            failureDetails={'message': str(e), 'type': 'JobFailed'}
        )

def perform_validation_checks(job_data):
    """
    Implement your custom validation logic here
    """
    # Example validation checks:
    # - Verify artifact integrity
    # - Check deployment window
    # - Validate configuration parameters
    # - Run security scans
    
    logger.info("Performing custom validation checks...")
    
    # For demo purposes, always return True
    # In real implementation, add your validation logic
    return True
      `),
      environment: {
        PIPELINE_NAME: 'enterprise-web-app-pipeline',
      },
    });

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
          files: [
            'deployment-package.zip',
            'appspec.yml',
            'scripts/**/*',
          ],
        },
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactsBucket,
        includeBuildId: true,
        packageZip: true,
      }),
      cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE),
    });

    // ========================================
    // CODEDEPLOY APPLICATION AND DEPLOYMENT GROUP
    // ========================================

    // CodeDeploy application
    const codeDeployApplication = new codedeploy.ServerApplication(this, 'WebAppDeployApplication', {
      applicationName: 'enterprise-web-app',
    });

    // Auto Scaling Group for EC2 instances (assuming it exists)
    // In a real scenario, you would reference existing ASG or create one
    // For this example, we'll create a minimal ASG
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      role: new iam.Role(this, 'EC2Role', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        ],
      }),
    });

    // CodeDeploy deployment group
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'WebAppDeploymentGroup', {
      application: codeDeployApplication,
      deploymentGroupName: 'production-deployment-group',
      serviceRole: codeDeployRole,
      autoScalingGroups: [autoScalingGroup],
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
      },
      alarmConfiguration: {
        enabled: true,
        ignorePollAlarmFailure: false,
      },
    });

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
              owner: 'your-github-username',
              repo: 'enterprise-web-app',
              branch: 'main',
              oauthToken: cdk.SecretValue.secretsManager('github-token'),
              output: sourceOutput,
              trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
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
              additionalInformation: 'Please review the build artifacts and approve deployment to production environment.',
              externalEntityLink: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/enterprise-web-app-pipeline/view`,
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
    const pipelineStateChangeRule = new events.Rule(this, 'PipelineStateChangeRule', {
      description: 'Capture pipeline state changes',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          'pipeline': [pipeline.pipelineName],
        },
      },
    });

    // Add SNS target to the rule
    pipelineStateChangeRule.addTarget(new events_targets.SnsTopic(pipelineNotificationsTopic, {
      message: events.RuleTargetInput.fromText(
        `Pipeline ${events.EventField.fromPath('$.detail.pipeline')} has changed state to ${events.EventField.fromPath('$.detail.state')} at ${events.EventField.fromPath('$.time')}`
      ),
    }));

    // CloudWatch Events Rule for Pipeline Stage State Changes
    const pipelineStageStateChangeRule = new events.Rule(this, 'PipelineStageStateChangeRule', {
      description: 'Capture pipeline stage state changes',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Stage Execution State Change'],
        detail: {
          'pipeline': [pipeline.pipelineName],
        },
      },
    });

    pipelineStageStateChangeRule.addTarget(new events_targets.SnsTopic(pipelineNotificationsTopic, {
      message: events.RuleTargetInput.fromText(
        `Pipeline ${events.EventField.fromPath('$.detail.pipeline')} stage ${events.EventField.fromPath('$.detail.stage')} has changed state to ${events.EventField.fromPath('$.detail.state')} at ${events.EventField.fromPath('$.time')}`
      ),
    }));

    // ========================================
    // CROSS-REGION SUPPORT CONFIGURATION
    // ========================================

    // Create cross-region artifact buckets for multi-region deployment
    const crossRegionSupport = new codepipeline.CrossRegionSupport(this, 'CrossRegionSupport', {
      replicationBucket: artifactsBucket,
    });

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
```

## Supporting Configuration Files

### `cdk.json`

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/enterprise-cicd.ts",
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossRegionReplicationBuckets": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-nordicapis-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-lambda:useNodeJs18Runtime": true,
    "@aws-cdk/aws-s3-deployment:createDefaultBucketPolicy": true,
    "@aws-cdk/aws-sqs-redrive-allow-policy": true
  }
}
```

### `bin/enterprise-cicd.ts`

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EnterpriseCiCdPipelineStack } from '../lib/enterprise-cicd-pipeline-stack';

const app = new cdk.App();

new EnterpriseCiCdPipelineStack(app, 'EnterpriseCiCdPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Enterprise CI/CD Pipeline with CodePipeline, CodeBuild, CodeDeploy, Lambda, and SNS',
});
```

### `package.json`

```json
{
  "name": "enterprise-cicd-pipeline",
  "version": "1.0.0",
  "description": "Enterprise CI/CD Pipeline using AWS CDK",
  "bin": {
    "enterprise-cicd": "bin/enterprise-cicd.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "synth": "cdk synth",
    "diff": "cdk diff"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## Deployment Instructions

### Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js 18.x or later** installed
3. **AWS CDK CLI** installed globally: `npm install -g aws-cdk`
4. **GitHub Personal Access Token** stored in AWS Secrets Manager

### Step-by-Step Deployment

1. **Initialize the Project**
   ```bash
   mkdir enterprise-cicd-pipeline
   cd enterprise-cicd-pipeline
   npm init -y
   ```

2. **Install Dependencies**
   ```bash
   npm install aws-cdk-lib constructs
   npm install -D @types/node typescript ts-node aws-cdk
   ```

3. **Create Project Structure**
   ```bash
   mkdir bin lib
   # Copy the provided files to their respective locations
   ```

4. **Bootstrap CDK (if not done before)**
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

5. **Store GitHub Token in Secrets Manager**
   ```bash
   aws secretsmanager create-secret \
     --name github-token \
     --description "GitHub Personal Access Token for CodePipeline" \
     --secret-string "your-github-personal-access-token"
   ```

6. **Synthesize the CloudFormation Template**
   ```bash
   c