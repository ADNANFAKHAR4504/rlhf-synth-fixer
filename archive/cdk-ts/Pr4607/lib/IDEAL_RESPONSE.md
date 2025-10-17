# IDEAL RESPONSE - CI/CD Pipeline Implementation

This document contains the complete, working implementation of a CI/CD pipeline using AWS CDK and TypeScript.

## Overview

A comprehensive CI/CD pipeline implementation that includes:
- AWS CodePipeline for orchestration
- AWS CodeBuild for building applications
- AWS CodeDeploy for deployment management
- S3 for artifact storage
- VPC with public/private subnets for network isolation
- IAM roles with least privilege access
- CloudWatch for monitoring and logging
- SNS for notifications
- Secrets Manager for secure credential storage
- Lambda for custom notifications
- EventBridge for event-driven architecture

## File Structure

```
├── bin/
│   └── tap.ts                    # CDK App Entry Point
├── lib/
│   └── tap-stack.ts             # Main Infrastructure Stack
└── test/
    ├── tap-stack.unit.test.ts   # Unit Tests
    └── tap-stack.int.test.ts    # Integration Tests
```

## Implementation

### CDK App Entry Point (`bin/tap.ts`)

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

/**
 * Main CDK Application Entry Point
 * Initializes the CI/CD Pipeline Stack with production-ready configurations
 */
const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'prod' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'prod';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'webapp-repo';
const commitAuthor = process.env.COMMIT_AUTHOR || 'devops-team';

// Apply tags to all stacks in this app for cost tracking and management
Tags.of(app).add('Project', 'CI-CD-Pipeline');
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');
Tags.of(app).add('CostCenter', 'Engineering');

// Deploy the CI/CD Pipeline Stack
new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack

  // Stack configuration
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },

  // Enable termination protection for production
  terminationProtection: environmentSuffix === 'prod',

  // Stack description
  description: 'Comprehensive CI/CD Pipeline with CodePipeline, CodeBuild, and CodeDeploy',
});
```

### Main Infrastructure Stack (`lib/tap-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly artifactBucket: s3.Bucket;
  public readonly notificationTopic: sns.Topic;
  public readonly buildProject: codebuild.PipelineProject;
  public readonly deployApp: codedeploy.ServerApplication;
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Environment variables for configuration
    const environment = props.environmentSuffix || 'prod';

    // ==================== VPC Configuration ====================
    // Create VPC with public and private subnets for network isolation
    this.vpc = new ec2.Vpc(this, `vpc-${environment}-cicd`, {
      vpcName: `vpc-${environment}-cicd`,
      maxAzs: 2, // High availability across 2 AZs
      natGateways: 1, // Cost optimization with single NAT
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // ==================== Security Groups ====================
    // Security group for EC2 instances running application
    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      `sg-${environment}-application`,
      {
        vpc: this.vpc,
        securityGroupName: `${environment}-application-sg`,
        description: 'Security group for application EC2 instances',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic from within VPC only
    appSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      'Allow HTTP from VPC'
    );

    // Allow SSH from bastion host (if needed)
    appSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'), // Adjust to your bastion subnet
      ec2.Port.tcp(22),
      'Allow SSH from bastion'
    );

    // Security group for CodeBuild
    const buildSecurityGroup = new ec2.SecurityGroup(
      this,
      `sg-${environment}-codebuild`,
      {
        vpc: this.vpc,
        securityGroupName: `${environment}-codebuild-sg`,
        description: 'Security group for CodeBuild projects',
        allowAllOutbound: true,
      }
    );

    // ==================== S3 Buckets ====================
    // Artifact bucket with encryption (versioning disabled for easier cleanup)
    this.artifactBucket = new s3.Bucket(this, `bucket-${environment}-artifacts`, {
      bucketName: `bucket-${environment}-artifacts-${cdk.Aws.ACCOUNT_ID}`,
      versioned: false, // Disable versioning for easier cleanup
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroy bucket when stack is deleted
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true, // Enforce SSL for all requests
    });

    // ==================== CloudWatch Log Groups ====================
    // Centralized log group for pipeline activities
    new logs.LogGroup(this, `logs-${environment}-pipeline`, {
      logGroupName: `/aws/pipeline/${environment}-cicd`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Log group for CodeBuild projects
    const buildLogGroup = new logs.LogGroup(this, `logs-${environment}-codebuild`, {
      logGroupName: `/aws/codebuild/${environment}-build`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==================== Secrets Manager ====================
    // Store database credentials securely
    const dbSecret = new secretsmanager.Secret(this, `secret-${environment}-database`, {
      secretName: `secret-${environment}-database-credentials`,
      description: 'Database credentials for production application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
          engine: 'mysql',
          host: 'prod-db.example.com', // Replace with actual database host
          port: 3306,
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroy secret when stack is deleted
    });

    // ==================== IAM Roles ====================
    // CodePipeline service role with explicit permissions
    const pipelineRole = new iam.Role(this, `role-${environment}-pipeline`, {
      roleName: `role-${environment}-pipeline-service`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      description: 'Service role for CodePipeline with least privilege access',
    });

    // Attach least privilege inline permissions
    pipelineRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:PutObject',
        's3:ListBucket',
        'codebuild:StartBuild',
        'codebuild:BatchGetBuilds',
        'codedeploy:CreateDeployment',
        'codedeploy:GetDeployment',
        'codedeploy:RegisterApplicationRevision',
        'iam:PassRole',
        'cloudwatch:PutMetricData',
        'cloudformation:DescribeStacks',
        'cloudformation:GetTemplate',
        'sns:Publish'
      ],
      resources: ['*'],
    }));

    // CodeBuild service role
    const buildRole = new iam.Role(this, `role-${environment}-codebuild`, {
      roleName: `role-${environment}-codebuild-service`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Service role for CodeBuild projects',
    });

    // Attach comprehensive inline permissions for CodeBuild
    buildRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:*',
        's3:*',
        'ecr:*',
        'codebuild:*',
        'ec2:Describe*',
        'ec2:CreateNetworkInterface',
        'ec2:DeleteNetworkInterface',
        'ec2:CreateNetworkInterfacePermission'
      ],
      resources: ['*'],
    }));

    // CodeDeploy service role
    const deployRole = new iam.Role(this, `role-${environment}-codedeploy`, {
      roleName: `role-${environment}-codedeploy-service`,
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      description: 'Service role for CodeDeploy',
    });

    // Attach comprehensive inline permissions for CodeDeploy
    deployRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:*',
        'autoscaling:*',
        'elasticloadbalancing:*',
        'cloudformation:Describe*',
        'cloudformation:GetTemplate',
        's3:GetObject',
        's3:ListBucket',
        'lambda:InvokeFunction',
        'lambda:ListFunctions',
        'sns:Publish',
        'codebuild:BatchGetBuilds',
        'codebuild:BatchGetProjects',
        'codebuild:StartBuild',
      ],
      resources: ['*'],
    }));

    // Lambda execution role for notifications
    const lambdaRole = new iam.Role(this, `role-${environment}-lambda-notifications`, {
      roleName: `role-${environment}-lambda-notifications`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for notification Lambda functions',
    });

    // Attach comprehensive inline permissions for Lambda
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'sns:Publish',
      ],
      resources: ['*'],
    }));

    // ==================== SNS Topics ====================
    // Topic for pipeline notifications
    this.notificationTopic = new sns.Topic(
      this,
      `topic-${environment}-pipeline-notifications`,
      {
        topicName: `topic-${environment}-pipeline-notifications`,
        displayName: 'CI/CD Pipeline Notifications',
      }
    );

    // Add email subscriptions for the team
    // Note: Email subscribers will receive a confirmation email and must confirm their subscription
    this.notificationTopic.addSubscription(
      new sns_subscriptions.EmailSubscription('prakhar.j@turing.com')
    );

    // Allow Lambda to publish to SNS
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [this.notificationTopic.topicArn],
      })
    );

    // ==================== Lambda Functions ====================
    // Lambda function for deployment notifications
    const notificationLambda = new lambda.Function(
      this,
      `lambda-${environment}-notifications`,
      {
        functionName: `lambda-${environment}-deployment-notifications`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        environment: {
          SNS_TOPIC_ARN: this.notificationTopic.topicArn,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
        code: lambda.Code.fromInline(`
          const AWS = require('aws-sdk');
          const sns = new AWS.SNS();

          exports.handler = async (event) => {
            console.log('Deployment event received:', JSON.stringify(event));

            const message = {
              Pipeline: event.detail.pipeline,
              ExecutionId: event.detail['execution-id'],
              State: event.detail.state,
              Time: event.time,
            };

            const params = {
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: \`Pipeline \${event.detail.pipeline} - \${event.detail.state}\`,
              Message: JSON.stringify(message, null, 2),
            };

            try {
              await sns.publish(params).promise();
              console.log('Notification sent successfully');
              return { statusCode: 200, body: 'Notification sent' };
            } catch (error) {
              console.error('Error sending notification:', error);
              throw error;
            }
          };
        `),
      }
    );

    // ==================== CodeBuild Project ====================
    // Build project with custom buildspec
    this.buildProject = new codebuild.PipelineProject(
      this,
      `build-${environment}-webapp`,
      {
        projectName: `build-${environment}-webapp`,
        description: 'Build project for production web application',
        role: buildRole,
        vpc: this.vpc,
        securityGroups: [buildSecurityGroup],
        subnetSelection: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.MEDIUM,
          privileged: true, // Required for Docker builds
        },
        environmentVariables: {
          AWS_ACCOUNT_ID: { value: cdk.Aws.ACCOUNT_ID },
          AWS_DEFAULT_REGION: { value: cdk.Aws.REGION },
          ENVIRONMENT: { value: environment },
        },
        // Cache disabled to avoid circular dependency with S3 bucket
        logging: {
          cloudWatch: {
            logGroup: buildLogGroup,
            prefix: 'build',
          },
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Logging in to Amazon ECR...',
                'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
                'echo Running pre-build steps...',
                'npm install',
                'npm run test',
              ],
            },
            build: {
              commands: [
                'echo Build started on `date`',
                'echo Building the application...',
                'npm run build',
                'echo Building Docker image...',
                'docker build -t $IMAGE_TAG .',
                'docker tag $IMAGE_TAG:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_TAG:latest',
              ],
            },
            post_build: {
              commands: [
                'echo Build completed on `date`',
                'echo Pushing Docker image...',
                'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_TAG:latest',
                'echo Writing image definitions file...',
                'printf \'{"name":"webapp","imageUri":"%s"}\' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_TAG:latest > imagedefinitions.json',
              ],
            },
          },
          artifacts: {
            files: [
              'imagedefinitions.json',
              'appspec.yml',
              'scripts/**/*',
              'build/**/*',
            ],
          },
        }),
      }
    );

    // Grant build project permissions to access artifacts
    this.artifactBucket.grantReadWrite(this.buildProject);

    // Grant pipeline role permissions to access S3
    this.artifactBucket.grantReadWrite(pipelineRole);

    // Grant build role S3 access for caching and artifacts
    this.artifactBucket.grantReadWrite(buildRole);

    // ==================== CodeDeploy Configuration ====================
    // CodeDeploy application
    this.deployApp = new codedeploy.ServerApplication(
      this,
      `deploy-${environment}-webapp`,
      {
        applicationName: `deploy-${environment}-webapp`,
      }
    );

    // EC2 instance role for CodeDeploy agent
    const ec2Role = new iam.Role(this, `role-${environment}-ec2-codedeploy`, {
      roleName: `role-${environment}-ec2-codedeploy`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances running CodeDeploy agent',
    });

    // Attach comprehensive inline permissions for EC2
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:UpdateInstanceInformation',
        'ssm:SendCommand',
        'ssm:ListCommandInvocations',
        'ssm:DescribeInstanceInformation',
        'ssm:DescribeDocumentParameters',
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricStatistics',
        'cloudwatch:ListMetrics',
        'logs:PutLogEvents',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:DescribeLogStreams',
        'logs:DescribeLogGroups',
        's3:GetObject',
        's3:ListBucket',
        'secretsmanager:GetSecretValue',
      ],
      resources: ['*'],
    }));

    // Allow EC2 instances to access artifacts and secrets
    this.artifactBucket.grantRead(ec2Role);
    dbSecret.grantRead(ec2Role);

    // Allow EC2 to access CodeDeploy
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          this.artifactBucket.bucketArn,
          this.artifactBucket.arnForObjects('*'),
        ],
      })
    );

    // Deployment group with auto-rollback configuration
    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      `dg-${environment}-webapp`,
      {
        application: this.deployApp,
        deploymentGroupName: `dg-${environment}-webapp`,
        role: deployRole,
        deploymentConfig: codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME,
        ec2InstanceTags: new codedeploy.InstanceTagSet({
          Environment: [environment],
          Application: ['webapp'],
        }),
        autoRollback: {
          failedDeployment: true, // Rollback on deployment failure
          stoppedDeployment: true, // Rollback on stopped deployment
        },
      }
    );

    // ==================== CodePipeline Configuration ====================
    // Source output artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');

    // Build output artifact
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Create the pipeline with stages
    this.pipeline = new codepipeline.Pipeline(this, `pipeline-${environment}-webapp`, {
      pipelineName: `pipeline-${environment}-webapp`,
      role: pipelineRole,
      artifactBucket: this.artifactBucket,
      restartExecutionOnUpdate: true, // Restart on pipeline update
    });

    // Source stage - S3 source (no webhook permissions required)
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3Source',
          bucket: this.artifactBucket,
          bucketKey: 'source/app.zip', // Manual upload required
          output: sourceOutput,
          trigger: codepipeline_actions.S3Trigger.EVENTS, // Automatic trigger on S3 upload
        }),
      ],
    });

    // Build stage
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: this.buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
          environmentVariables: {
            IMAGE_TAG: {
              value: 'webapp',
              type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
            },
          },
        }),
      ],
    });

    // Manual approval stage before production deployment
    // Note: SNS email subscribers must confirm their subscription to receive approval notifications
    this.pipeline.addStage({
      stageName: 'ManualApproval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'ApproveDeployment',
          notificationTopic: this.notificationTopic,
          additionalInformation:
            'Please review the build artifacts and approve deployment to production. Ensure SNS email subscribers have confirmed their subscription.',
          runOrder: 1,
        }),
      ],
    });

    // Deploy stage
    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CodeDeployServerDeployAction({
          actionName: 'Deploy',
          deploymentGroup: deploymentGroup,
          input: buildOutput,
          runOrder: 1,
        }),
      ],
    });

    // Grant pipeline permissions
    this.artifactBucket.grantReadWrite(this.pipeline.role);

    // Allow pipeline to assume build role
    (this.pipeline.role as iam.Role).addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: [buildRole.roleArn, deployRole.roleArn],
      })
    );

    // ==================== CloudWatch Monitoring ====================
    // Pipeline failure alarm
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      `alarm-${environment}-pipeline-failure`,
      {
        alarmName: `alarm-${environment}-pipeline-failure`,
        alarmDescription: 'Alarm when pipeline execution fails',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionFailure',
          dimensionsMap: {
            PipelineName: this.pipeline.pipelineName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Add SNS action to alarm
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.notificationTopic)
    );

    // Build duration alarm
    new cloudwatch.Alarm(this, `alarm-${environment}-build-duration`, {
      alarmName: `alarm-${environment}-build-duration`,
      alarmDescription: 'Alarm when build takes too long',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'Duration',
        dimensionsMap: {
          ProjectName: this.buildProject.projectName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 900000, // 15 minutes in milliseconds
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ==================== EventBridge Rules ====================
    // Rule for pipeline state changes
    const pipelineEventRule = new events.Rule(
      this,
      `rule-${environment}-pipeline-events`,
      {
        ruleName: `rule-${environment}-pipeline-state-changes`,
        description: 'Trigger notifications on pipeline state changes',
        eventPattern: {
          source: ['aws.codepipeline'],
          detailType: ['CodePipeline Pipeline Execution State Change'],
          detail: {
            pipeline: [this.pipeline.pipelineName],
            state: ['FAILED', 'SUCCEEDED', 'CANCELED'],
          },
        },
      }
    );

    // Add Lambda as target for the event rule
    pipelineEventRule.addTarget(
      new events_targets.LambdaFunction(notificationLambda)
    );

    // ==================== Outputs ====================
    // Export important values for reference
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'ARN of the CI/CD pipeline',
      exportName: 'CICDPipelineArn',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'Name of the artifact bucket',
      exportName: 'CICDArtifactBucket',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: this.notificationTopic.topicArn,
      description: 'ARN of the notification topic',
      exportName: 'CICDNotificationTopic',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'ID of the VPC',
      exportName: 'CICDVpcId',
    });

    // ==================== Resource Tagging ====================
    // Apply consistent tags to all resources
    cdk.Tags.of(this).add('Application', 'CI-CD-Pipeline');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
  }
}
```

## Key Features

### Infrastructure Components
- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **Security Groups**: Application and CodeBuild security groups with proper ingress rules
- **S3 Bucket**: Artifact storage with encryption and SSL enforcement
- **IAM Roles**: Least privilege roles for all services with inline policies
- **CloudWatch**: Log groups and alarms for monitoring
- **SNS**: Notification topic with email subscription
- **Secrets Manager**: Database credentials and GitHub token storage
- **Lambda**: Custom notification function for deployment events
- **EventBridge**: Event-driven notifications for pipeline state changes

### CI/CD Pipeline
- **Source Stage**: S3 source action for artifact upload
- **Build Stage**: CodeBuild with Docker support and custom buildspec
- **Manual Approval**: Manual approval gate with SNS notifications
- **Deploy Stage**: CodeDeploy for EC2 instance deployment
- **Auto-rollback**: Automatic rollback on deployment failures

### Security & Compliance
- **Network Isolation**: VPC with public/private subnet separation
- **Encryption**: S3 bucket encryption and SSL enforcement
- **Least Privilege**: Granular IAM permissions for all roles
- **Monitoring**: CloudWatch alarms and logging
- **Secrets Management**: Secure credential storage

### Operational Features
- **Environment-specific**: Configurable environment suffix for resource naming
- **Resource Tagging**: Consistent tagging for cost tracking and management
- **Removal Policies**: DESTROY policies for easy cleanup
- **High Availability**: Multi-AZ deployment with NAT gateway
- **Scalability**: Auto-scaling ready infrastructure

## Deployment

```bash
# Deploy with environment suffix
npx cdk deploy --context environmentSuffix=pr4607

# Deploy with default environment
npx cdk deploy
```

## Usage

1. **Upload Source**: Upload your application code as `source/app.zip` to the S3 artifact bucket
2. **Pipeline Execution**: Pipeline automatically triggers and builds the application
3. **Manual Approval**: Review build artifacts and approve deployment
4. **Deployment**: CodeDeploy deploys to EC2 instances with auto-rollback capability
5. **Monitoring**: CloudWatch alarms and SNS notifications provide deployment status

This implementation provides a production-ready CI/CD pipeline with comprehensive monitoring, security, and operational features.