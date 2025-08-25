# CDK Multi-Account Infrastructure Solution

Here's a comprehensive CDK JavaScript solution for multi-account AWS infrastructure management that provides StackSets-like functionality.

## File Structure

The solution consists of the following files:

1. **multi-account-pipeline-stack.mjs** - CDK Pipeline for multi-account deployments
2. **cross-account-roles-stack.mjs** - Cross-account IAM roles and policies
3. **shared-infrastructure-stack.mjs** - Shared infrastructure across accounts
4. **tagging-aspects.mjs** - Standardized tagging enforcement
5. **control-tower-integration.mjs** - Control Tower integration utilities
6. **drift-detection.mjs** - CDK drift detection implementation

## multi-account-pipeline-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import { SharedInfrastructureStack } from './shared-infrastructure-stack.mjs';
import { CrossAccountRolesStack } from './cross-account-roles-stack.mjs';

export class MultiAccountPipelineStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const repo = new codecommit.Repository(this, 'InfraRepository', {
      repositoryName: 'multi-account-infrastructure',
      description: 'Repository for multi-account infrastructure deployments'
    });

    const pipeline = new pipelines.CodePipeline(this, 'MultiAccountPipeline', {
      pipelineName: 'MultiAccountInfraPipeline',
      synth: new pipelines.ShellStep('Synth', {
        input: pipelines.CodePipelineSource.codeCommit(repo, 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      }),
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
          environmentVariables: {
            CDK_DEFAULT_REGION: { value: 'us-east-1' },
            CDK_DEFAULT_ACCOUNT: { value: props.managementAccountId }
          }
        }
      },
      crossAccountKeys: true,
      enableKeyRotation: true
    });

    // Development Environment Wave
    const devWave = pipeline.addWave('Development');
    
    props.targetAccounts.development.forEach((accountConfig, index) => {
      const devStage = new MultiAccountStage(this, `Dev-${accountConfig.accountId}`, {
        env: {
          account: accountConfig.accountId,
          region: accountConfig.region
        },
        stageName: 'development',
        accountConfig
      });
      devWave.addStage(devStage);
    });

    // Staging Environment Wave  
    const stagingWave = pipeline.addWave('Staging');
    
    props.targetAccounts.staging.forEach((accountConfig, index) => {
      const stagingStage = new MultiAccountStage(this, `Staging-${accountConfig.accountId}`, {
        env: {
          account: accountConfig.accountId,
          region: accountConfig.region
        },
        stageName: 'staging',
        accountConfig
      });
      stagingWave.addStage(stagingStage);
    });

    // Production Environment Wave
    const prodWave = pipeline.addWave('Production');
    
    props.targetAccounts.production.forEach((accountConfig, index) => {
      const prodStage = new MultiAccountStage(this, `Prod-${accountConfig.accountId}`, {
        env: {
          account: accountConfig.accountId,
          region: accountConfig.region
        },
        stageName: 'production',
        accountConfig
      });
      
      // Add manual approval for production deployments
      prodWave.addStage(prodStage, {
        pre: [
          new pipelines.ManualApprovalStep(`ApproveProduction-${accountConfig.accountId}`, {
            comment: `Approve deployment to production account ${accountConfig.accountId}`
          })
        ]
      });
    });

    // Build the pipeline
    pipeline.buildPipeline();
  }
}

class MultiAccountStage extends cdk.Stage {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Deploy cross-account roles first
    new CrossAccountRolesStack(this, 'CrossAccountRoles', {
      managementAccountId: props.accountConfig.managementAccountId,
      stageName: props.stageName,
      env: props.env
    });

    // Deploy shared infrastructure
    new SharedInfrastructureStack(this, 'SharedInfrastructure', {
      stageName: props.stageName,
      accountConfig: props.accountConfig,
      env: props.env
    });
  }
}
```

## cross-account-roles-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as organizations from 'aws-cdk-lib/aws-organizations';

export class CrossAccountRolesStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Cross-account deployment role
    const crossAccountDeploymentRole = new iam.Role(this, 'CrossAccountDeploymentRole', {
      roleName: `CrossAccountDeploymentRole-${props.stageName}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.AccountPrincipal(props.managementAccountId),
        new iam.ServicePrincipal('codebuild.amazonaws.com'),
        new iam.ServicePrincipal('codepipeline.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
      ],
      inlinePolicies: {
        CrossAccountDeploymentPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:CreateRole',
                'iam:DeleteRole',
                'iam:AttachRolePolicy',
                'iam:DetachRolePolicy',
                'iam:PutRolePolicy',
                'iam:DeleteRolePolicy',
                'iam:PassRole'
              ],
              resources: [
                `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/cdk-*`,
                `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/*-CrossAccount*`
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'organizations:ListAccounts',
                'organizations:DescribeAccount',
                'organizations:ListAccountsForParent',
                'organizations:ListOrganizationalUnitsForParent'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // CloudFormation execution role
    const cloudFormationExecutionRole = new iam.Role(this, 'CloudFormationExecutionRole', {
      roleName: `CloudFormationExecutionRole-${props.stageName}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('cloudformation.amazonaws.com'),
        new iam.AccountPrincipal(props.managementAccountId)
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
      ]
    });

    // Governance read-only role for compliance monitoring
    const governanceReadOnlyRole = new iam.Role(this, 'GovernanceReadOnlyRole', {
      roleName: `GovernanceReadOnlyRole-${props.stageName}`,
      assumedBy: new iam.OrganizationPrincipal(props.organizationId),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit')
      ],
      inlinePolicies: {
        ComplianceMonitoring: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'config:GetConfigRule',
                'config:GetComplianceDetailsByConfigRule',
                'config:GetComplianceSummaryByConfigRule',
                'controltower:GetEnabledBaseline',
                'controltower:ListEnabledBaselines'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Output role ARNs for reference
    new cdk.CfnOutput(this, 'CrossAccountDeploymentRoleArn', {
      value: crossAccountDeploymentRole.roleArn,
      description: 'ARN of the cross-account deployment role',
      exportName: `CrossAccountDeploymentRoleArn-${props.stageName}`
    });

    new cdk.CfnOutput(this, 'CloudFormationExecutionRoleArn', {
      value: cloudFormationExecutionRole.roleArn,
      description: 'ARN of the CloudFormation execution role',
      exportName: `CloudFormationExecutionRoleArn-${props.stageName}`
    });
  }
}
```

## shared-infrastructure-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { TaggingAspects } from './tagging-aspects.mjs';

export class SharedInfrastructureStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Apply standardized tagging
    cdk.Aspects.of(this).add(new TaggingAspects(props.accountConfig));

    // Shared KMS key for encryption
    const sharedKmsKey = new kms.Key(this, 'SharedKmsKey', {
      description: `Shared KMS key for ${props.stageName} environment`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    sharedKmsKey.addAlias(`shared-key-${props.stageName}`);

    // Shared S3 bucket for artifacts and logging
    const sharedBucket = new s3.Bucket(this, 'SharedBucket', {
      bucketName: `shared-infrastructure-${props.stageName}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: sharedKmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          enabled: true
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          enabled: true
        }
      ],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // SNS topic for notifications
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: `shared-notifications-${props.stageName}`,
      displayName: `Shared Notifications - ${props.stageName}`,
      masterKey: sharedKmsKey
    });

    // SQS dead letter queue for failed messages
    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: `shared-dlq-${props.stageName}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: sharedKmsKey,
      retentionPeriod: cdk.Duration.days(14)
    });

    // SQS queue for processing
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: `shared-processing-${props.stageName}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: sharedKmsKey,
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3
      },
      visibilityTimeout: cdk.Duration.minutes(5)
    });

    // CloudWatch Log Group for centralized logging
    const logGroup = new logs.LogGroup(this, 'SharedLogGroup', {
      logGroupName: `/shared-infrastructure/${props.stageName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: sharedKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'SharedDashboard', {
      dashboardName: `SharedInfrastructure-${props.stageName}`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: `# Shared Infrastructure - ${props.stageName}\n\nThis dashboard monitors shared infrastructure resources.`,
            width: 24,
            height: 2
          })
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'S3 Bucket Metrics',
            left: [sharedBucket.metricBucketSizeBytes()],
            width: 12,
            height: 6
          }),
          new cloudwatch.GraphWidget({
            title: 'SQS Queue Metrics',
            left: [processingQueue.metricApproximateNumberOfMessages()],
            right: [deadLetterQueue.metricApproximateNumberOfMessages()],
            width: 12,
            height: 6
          })
        ]
      ]
    });

    // SSM Parameters for resource sharing
    new ssm.StringParameter(this, 'SharedBucketParameter', {
      parameterName: `/shared-infrastructure/${props.stageName}/bucket-name`,
      stringValue: sharedBucket.bucketName,
      description: 'Shared S3 bucket name'
    });

    new ssm.StringParameter(this, 'SharedKmsKeyParameter', {
      parameterName: `/shared-infrastructure/${props.stageName}/kms-key-id`,
      stringValue: sharedKmsKey.keyId,
      description: 'Shared KMS key ID'
    });

    new ssm.StringParameter(this, 'NotificationTopicParameter', {
      parameterName: `/shared-infrastructure/${props.stageName}/notification-topic-arn`,
      stringValue: notificationTopic.topicArn,
      description: 'Shared notification topic ARN'
    });

    // Outputs
    new cdk.CfnOutput(this, 'SharedBucketName', {
      value: sharedBucket.bucketName,
      description: 'Name of the shared S3 bucket'
    });

    new cdk.CfnOutput(this, 'SharedKmsKeyId', {
      value: sharedKmsKey.keyId,
      description: 'ID of the shared KMS key'
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'ARN of the shared notification topic'
    });
  }
}
```

## tagging-aspects.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export class TaggingAspects {
  constructor(accountConfig) {
    this.accountConfig = accountConfig;
  }

  visit(node) {
    // Apply tags to all taggable resources
    if (node instanceof cdk.CfnResource) {
      const tags = this.getStandardTags();
      
      // Apply standard tags
      Object.entries(tags).forEach(([key, value]) => {
        cdk.Tags.of(node).add(key, value);
      });

      // Apply resource-specific tags based on resource type
      this.applyResourceSpecificTags(node);
    }
  }

  getStandardTags() {
    return {
      Department: this.accountConfig.department || 'IT',
      Project: this.accountConfig.project || 'SharedInfrastructure', 
      Environment: this.accountConfig.environment || 'dev',
      Owner: this.accountConfig.owner || 'InfrastructureTeam',
      CostCenter: this.accountConfig.costCenter || 'IT-OPS',
      ManagedBy: 'CDK',
      CreatedDate: new Date().toISOString().split('T')[0],
      ComplianceRequired: this.accountConfig.complianceRequired || 'true',
      BackupRequired: this.accountConfig.backupRequired || 'false',
      MonitoringLevel: this.accountConfig.monitoringLevel || 'standard'
    };
  }

  applyResourceSpecificTags(resource) {
    const resourceType = resource.cfnResourceType;

    switch (resourceType) {
      case 'AWS::S3::Bucket':
        cdk.Tags.of(resource).add('DataClassification', 'internal');
        cdk.Tags.of(resource).add('RetentionPeriod', '90days');
        break;
        
      case 'AWS::KMS::Key':
        cdk.Tags.of(resource).add('KeyRotation', 'enabled');
        cdk.Tags.of(resource).add('KeyUsage', 'shared-encryption');
        break;
        
      case 'AWS::SNS::Topic':
        cdk.Tags.of(resource).add('MessageType', 'notifications');
        cdk.Tags.of(resource).add('IntegrationPattern', 'pub-sub');
        break;
        
      case 'AWS::SQS::Queue':
        cdk.Tags.of(resource).add('MessageType', 'processing');
        cdk.Tags.of(resource).add('IntegrationPattern', 'queue');
        break;
        
      case 'AWS::IAM::Role':
        cdk.Tags.of(resource).add('AccessLevel', 'cross-account');
        cdk.Tags.of(resource).add('SecurityReviewRequired', 'true');
        break;
        
      case 'AWS::Logs::LogGroup':
        cdk.Tags.of(resource).add('LogType', 'application');
        cdk.Tags.of(resource).add('RetentionPolicy', 'standard');
        break;
        
      default:
        // Apply default resource tags
        cdk.Tags.of(resource).add('ResourceType', resourceType);
        break;
    }
  }
}

// Tag compliance validation aspect
export class TagComplianceAspect {
  constructor(requiredTags = ['Department', 'Project', 'Environment', 'Owner']) {
    this.requiredTags = requiredTags;
  }

  visit(node) {
    if (node instanceof cdk.CfnResource) {
      const appliedTags = this.getAppliedTags(node);
      const missingTags = this.requiredTags.filter(tag => !appliedTags.includes(tag));
      
      if (missingTags.length > 0) {
        node.node.addWarning(`Missing required tags: ${missingTags.join(', ')}`);
      }
    }
  }

  getAppliedTags(resource) {
    const tagManager = cdk.Tags.of(resource);
    return tagManager.tagValues() ? Object.keys(tagManager.tagValues()) : [];
  }
}
```

## control-tower-integration.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ControlTowerIntegration extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id);

    // Role for Control Tower operations
    const controlTowerRole = new iam.Role(this, 'ControlTowerOperationsRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        ControlTowerOperations: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'controltower:GetEnabledBaseline',
                'controltower:ListEnabledBaselines',
                'controltower:EnableBaseline',
                'controltower:DisableBaseline',
                'controltower:UpdateEnabledBaseline'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'organizations:ListAccounts',
                'organizations:DescribeAccount',
                'organizations:ListAccountsForParent',
                'organizations:MoveAccount'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'servicecatalog:ListPortfolios',
                'servicecatalog:ListProductsForPortfolio',
                'servicecatalog:ProvisionProduct',
                'servicecatalog:TerminateProvisionedProduct',
                'servicecatalog:UpdateProvisionedProduct'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Lambda function for Control Tower baseline management
    const baselineManagerFunction = new lambda.Function(this, 'BaselineManagerFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: controlTowerRole,
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
        const { ControlTowerClient, ListEnabledBaselinesCommand, GetEnabledBaselineCommand } = require('@aws-sdk/client-controltower');
        const { OrganizationsClient, ListAccountsCommand } = require('@aws-sdk/client-organizations');
        
        const controlTower = new ControlTowerClient({ region: process.env.AWS_REGION });
        const organizations = new OrganizationsClient({ region: process.env.AWS_REGION });
        
        exports.handler = async (event) => {
          console.log('Processing Control Tower event:', JSON.stringify(event, null, 2));
          
          try {
            // Check baseline drift status for all accounts
            const accounts = await organizations.send(new ListAccountsCommand({}));
            const enabledBaselines = await controlTower.send(new ListEnabledBaselinesCommand({}));
            
            const driftStatus = [];
            
            for (const baseline of enabledBaselines.enabledBaselines || []) {
              const details = await controlTower.send(new GetEnabledBaselineCommand({
                enabledBaselineIdentifier: baseline.arn
              }));
              
              if (details.enabledBaselineDetails?.statusSummary?.status === 'DRIFT_DETECTED') {
                driftStatus.push({
                  baselineArn: baseline.arn,
                  targetIdentifier: baseline.targetIdentifier,
                  status: 'DRIFT_DETECTED'
                });
              }
            }
            
            if (driftStatus.length > 0) {
              console.log('Drift detected in baselines:', JSON.stringify(driftStatus, null, 2));
              
              // Send notification about drift
              const notificationPayload = {
                message: 'Control Tower baseline drift detected',
                driftedBaselines: driftStatus,
                timestamp: new Date().toISOString()
              };
              
              // In a real implementation, you would send this to SNS or another notification service
              console.log('Notification payload:', JSON.stringify(notificationPayload, null, 2));
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Control Tower baseline check completed',
                driftCount: driftStatus.length
              })
            };
          } catch (error) {
            console.error('Error processing Control Tower event:', error);
            throw error;
          }
        };
      `),
      environment: {
        ORGANIZATION_ID: props.organizationId || '',
        NOTIFICATION_TOPIC: props.notificationTopic || ''
      }
    });

    // CloudWatch Event Rule for Control Tower events
    const controlTowerEventRule = new events.Rule(this, 'ControlTowerEventRule', {
      description: 'Capture Control Tower lifecycle events',
      eventPattern: {
        source: ['aws.controltower'],
        detailType: [
          'AWS Control Tower Setup Completed',
          'AWS Control Tower Baseline Enabled',
          'AWS Control Tower Baseline Disabled'
        ]
      }
    });

    controlTowerEventRule.addTarget(new targets.LambdaFunction(baselineManagerFunction));

    // Schedule for periodic baseline drift checks
    const driftCheckRule = new events.Rule(this, 'DriftCheckRule', {
      description: 'Periodic Control Tower baseline drift check',
      schedule: events.Schedule.rate(cdk.Duration.hours(4))
    });

    driftCheckRule.addTarget(new targets.LambdaFunction(baselineManagerFunction));

    // Log Group for Control Tower integration logs
    new logs.LogGroup(this, 'ControlTowerIntegrationLogs', {
      logGroupName: `/aws/lambda/${baselineManagerFunction.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}
```

## drift-detection.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';

export class DriftDetectionStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // SNS topic for drift notifications
    const driftNotificationTopic = new sns.Topic(this, 'DriftNotificationTopic', {
      displayName: 'CDK Drift Detection Notifications'
    });

    // IAM role for drift detection
    const driftDetectionRole = new iam.Role(this, 'DriftDetectionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        DriftDetectionPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudformation:ListStacks',
                'cloudformation:DescribeStacks',
                'cloudformation:DescribeStackResources',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DetectStackDrift',
                'cloudformation:DescribeStackDriftDetectionStatus',
                'cloudformation:DescribeStackResourceDrifts'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish'
              ],
              resources: [driftNotificationTopic.topicArn]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'organizations:ListAccounts',
                'sts:AssumeRole'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Lambda function for drift detection
    const driftDetectionFunction = new lambda.Function(this, 'DriftDetectionFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: driftDetectionRole,
      timeout: cdk.Duration.minutes(15),
      code: lambda.Code.fromInline(`
        const { CloudFormationClient, ListStacksCommand, DetectStackDriftCommand, DescribeStackDriftDetectionStatusCommand, DescribeStackResourceDriftsCommand } = require('@aws-sdk/client-cloudformation');
        const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
        const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
        
        const sns = new SNSClient({ region: process.env.AWS_REGION });
        const sts = new STSClient({ region: process.env.AWS_REGION });
        
        async function getCloudFormationClient(accountId, region, roleArn) {
          if (roleArn && accountId !== process.env.AWS_ACCOUNT_ID) {
            const assumeRoleCommand = new AssumeRoleCommand({
              RoleArn: roleArn,
              RoleSessionName: 'DriftDetectionSession'
            });
            
            const { Credentials } = await sts.send(assumeRoleCommand);
            
            return new CloudFormationClient({
              region: region,
              credentials: {
                accessKeyId: Credentials.AccessKeyId,
                secretAccessKey: Credentials.SecretAccessKey,
                sessionToken: Credentials.SessionToken
              }
            });
          }
          
          return new CloudFormationClient({ region: region });
        }
        
        async function detectStackDrift(cfn, stackName) {
          try {
            const detectCommand = new DetectStackDriftCommand({
              StackName: stackName
            });
            
            const detectResult = await cfn.send(detectCommand);
            const detectionId = detectResult.StackDriftDetectionId;
            
            // Wait for drift detection to complete
            let status = 'DETECTION_IN_PROGRESS';
            let attempts = 0;
            const maxAttempts = 30;
            
            while (status === 'DETECTION_IN_PROGRESS' && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
              
              const statusCommand = new DescribeStackDriftDetectionStatusCommand({
                StackDriftDetectionId: detectionId
              });
              
              const statusResult = await cfn.send(statusCommand);
              status = statusResult.DetectionStatus;
              attempts++;
            }
            
            if (status === 'DETECTION_COMPLETE') {
              const statusResult = await cfn.send(new DescribeStackDriftDetectionStatusCommand({
                StackDriftDetectionId: detectionId
              }));
              
              if (statusResult.StackDriftStatus === 'DRIFTED') {
                // Get detailed drift information
                const driftsCommand = new DescribeStackResourceDriftsCommand({
                  StackName: stackName
                });
                
                const driftsResult = await cfn.send(driftsCommand);
                
                return {
                  stackName: stackName,
                  driftStatus: 'DRIFTED',
                  driftedResources: driftsResult.StackResourceDrifts.filter(
                    drift => drift.StackResourceDriftStatus === 'MODIFIED' || drift.StackResourceDriftStatus === 'DELETED'
                  )
                };
              }
              
              return {
                stackName: stackName,
                driftStatus: statusResult.StackDriftStatus
              };
            }
            
            return {
              stackName: stackName,
              driftStatus: 'DETECTION_TIMEOUT',
              error: 'Drift detection timed out'
            };
            
          } catch (error) {
            console.error(\`Error detecting drift for stack \${stackName}:\`, error);
            return {
              stackName: stackName,
              driftStatus: 'DETECTION_FAILED',
              error: error.message
            };
          }
        }
        
        exports.handler = async (event) => {
          console.log('Starting drift detection:', JSON.stringify(event, null, 2));
          
          const targetAccounts = event.targetAccounts || [process.env.AWS_ACCOUNT_ID];
          const targetRegions = event.targetRegions || [process.env.AWS_REGION];
          const crossAccountRoleTemplate = event.crossAccountRoleTemplate;
          
          const driftResults = [];
          
          for (const accountId of targetAccounts) {
            for (const region of targetRegions) {
              try {
                const roleArn = crossAccountRoleTemplate 
                  ? crossAccountRoleTemplate.replace('{account}', accountId)
                  : null;
                
                const cfn = await getCloudFormationClient(accountId, region, roleArn);
                
                // List all CDK stacks
                const listCommand = new ListStacksCommand({
                  StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']
                });
                
                const stackList = await cfn.send(listCommand);
                const cdkStacks = stackList.StackSummaries.filter(
                  stack => stack.StackName.includes('CDK') || stack.StackName.includes('Tap')
                );
                
                // Check drift for each stack
                for (const stack of cdkStacks) {
                  const driftResult = await detectStackDrift(cfn, stack.StackName);
                  driftResults.push({
                    accountId: accountId,
                    region: region,
                    ...driftResult
                  });
                }
                
              } catch (error) {
                console.error(\`Error processing account \${accountId} in region \${region}:\`, error);
                driftResults.push({
                  accountId: accountId,
                  region: region,
                  driftStatus: 'ERROR',
                  error: error.message
                });
              }
            }
          }
          
          // Send notifications for drifted stacks
          const driftedStacks = driftResults.filter(result => result.driftStatus === 'DRIFTED');
          
          if (driftedStacks.length > 0) {
            const notificationMessage = {
              subject: 'CDK Stack Drift Detected',
              message: 'Drift has been detected in the following CDK stacks:',
              driftedStacks: driftedStacks,
              timestamp: new Date().toISOString(),
              totalStacks: driftResults.length,
              driftedCount: driftedStacks.length
            };
            
            await sns.send(new PublishCommand({
              TopicArn: process.env.DRIFT_NOTIFICATION_TOPIC,
              Subject: notificationMessage.subject,
              Message: JSON.stringify(notificationMessage, null, 2)
            }));
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Drift detection completed',
              totalStacks: driftResults.length,
              driftedStacks: driftedStacks.length,
              results: driftResults
            })
          };
        };
      `),
      environment: {
        DRIFT_NOTIFICATION_TOPIC: driftNotificationTopic.topicArn
      }
    });

    // EventBridge rule for scheduled drift detection
    const scheduledDriftDetection = new events.Rule(this, 'ScheduledDriftDetection', {
      description: 'Scheduled CDK drift detection across accounts',
      schedule: events.Schedule.rate(cdk.Duration.hours(6))
    });

    scheduledDriftDetection.addTarget(new targets.LambdaFunction(driftDetectionFunction, {
      event: events.RuleTargetInput.fromObject({
        targetAccounts: props.targetAccounts || [],
        targetRegions: props.targetRegions || ['us-east-1'],
        crossAccountRoleTemplate: props.crossAccountRoleTemplate
      })
    }));

    // Log Group for drift detection logs
    new logs.LogGroup(this, 'DriftDetectionLogs', {
      logGroupName: `/aws/lambda/${driftDetectionFunction.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Outputs
    new cdk.CfnOutput(this, 'DriftNotificationTopicArn', {
      value: driftNotificationTopic.topicArn,
      description: 'ARN of the drift notification topic'
    });

    new cdk.CfnOutput(this, 'DriftDetectionFunctionArn', {
      value: driftDetectionFunction.functionArn,
      description: 'ARN of the drift detection function'
    });
  }
}
```

This solution provides a comprehensive multi-account CDK infrastructure management system with cross-account deployment capabilities, standardized tagging, Control Tower integration, and drift detection features using the latest AWS CDK patterns and 2024-2025 features.