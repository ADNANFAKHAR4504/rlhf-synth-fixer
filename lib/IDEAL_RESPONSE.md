# Overview

Please find solution files below.

## ./bin/tap.d.ts

```typescript
#!/usr/bin/env node
export {};

```

## ./lib/lambda/alarm-processor.ts

```typescript
import { CloudWatchLogsEvent, Context } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

const snsClient = new SNSClient({});
const cloudwatchClient = new CloudWatchClient({});

interface AlarmEvent {
  AlarmName: string;
  AlarmDescription?: string;
  AWSAccountId: string;
  NewStateValue: string;
  NewStateReason: string;
  StateChangeTime: string;
  Region: string;
  OldStateValue?: string;
  Trigger?: {
    MetricName: string;
    Namespace: string;
    StatisticType: string;
    Statistic: string;
    Unit: string;
    Dimensions: Array<{ name: string; value: string }>;
    Period: number;
    EvaluationPeriods: number;
    ComparisonOperator: string;
    Threshold: number;
    TreatMissingData: string;
  };
}

/**
 * Lambda function to process CloudWatch alarms and send enhanced notifications
 * Enriches alarm data and sends structured alerts via SNS
 */
export const handler = async (event: any, context: Context): Promise<any> => {
  const alertTopicArn = process.env.ALERT_TOPIC_ARN;
  const environment = process.env.ENVIRONMENT || 'unknown';

  console.log(`Processing CloudWatch alarm in ${environment} environment`);
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Handle SNS-wrapped alarm events
    let alarmData: AlarmEvent;

    if (event.Records && event.Records[0]?.Sns) {
      // Event is wrapped in SNS
      const snsMessage = JSON.parse(event.Records[0].Sns.Message);
      alarmData = snsMessage;
    } else if (event.AlarmName) {
      // Direct alarm event
      alarmData = event as AlarmEvent;
    } else {
      console.warn('Unknown event format, processing as generic alarm');
      alarmData = event;
    }

    const alarmName = alarmData.AlarmName;
    const newState = alarmData.NewStateValue;
    const oldState = alarmData.OldStateValue || 'UNKNOWN';
    const reason = alarmData.NewStateReason;
    const timestamp = alarmData.StateChangeTime || new Date().toISOString();

    console.log(`Alarm: ${alarmName}, State: ${oldState} → ${newState}`);

    // Get additional alarm details from CloudWatch
    let alarmDetails: any = null;
    try {
      const describeCommand = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(describeCommand);
      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        alarmDetails = response.MetricAlarms[0];
      }
    } catch (error) {
      console.error('Error fetching alarm details:', error);
    }

    // Determine severity based on alarm name and state
    const severity = determineSeverity(alarmName, newState);
    const prefix = getSeverityPrefix(severity);

    // Build enhanced message
    const subject = `${prefix} CloudWatch Alarm: ${alarmName} - ${newState}`;

    const messageBody = {
      summary: `Alarm ${alarmName} transitioned from ${oldState} to ${newState}`,
      alarm: {
        name: alarmName,
        description: alarmData.AlarmDescription || (alarmDetails?.AlarmDescription) || 'No description',
        oldState: oldState,
        newState: newState,
        reason: reason,
        timestamp: timestamp,
        region: alarmData.Region,
        accountId: alarmData.AWSAccountId,
      },
      severity: severity,
      environment: environment,
      metric: alarmData.Trigger ? {
        name: alarmData.Trigger.MetricName,
        namespace: alarmData.Trigger.Namespace,
        threshold: alarmData.Trigger.Threshold,
        comparisonOperator: alarmData.Trigger.ComparisonOperator,
        evaluationPeriods: alarmData.Trigger.EvaluationPeriods,
        period: alarmData.Trigger.Period,
        statistic: alarmData.Trigger.Statistic,
        dimensions: alarmData.Trigger.Dimensions,
      } : null,
      actions: getRecommendedActions(alarmName, newState),
      runbookUrl: getRunbookUrl(alarmName),
    };

    // Send notification to SNS
    if (alertTopicArn) {
      const publishCommand = new PublishCommand({
        TopicArn: alertTopicArn,
        Subject: subject,
        Message: JSON.stringify(messageBody, null, 2),
        MessageAttributes: {
          alarmName: {
            DataType: 'String',
            StringValue: alarmName,
          },
          severity: {
            DataType: 'String',
            StringValue: severity,
          },
          state: {
            DataType: 'String',
            StringValue: newState,
          },
          environment: {
            DataType: 'String',
            StringValue: environment,
          },
        },
      });

      await snsClient.send(publishCommand);
      console.log(`Alert sent to SNS topic: ${alertTopicArn}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Alarm processed successfully',
        alarm: alarmName,
        state: newState,
      }),
    };

  } catch (error) {
    console.error('Error processing alarm:', error);

    // Send error notification
    if (alertTopicArn) {
      try {
        await snsClient.send(new PublishCommand({
          TopicArn: alertTopicArn,
          Subject: `ERROR: Alarm Processing Error - ${environment}`,
          Message: `Failed to process alarm event:\n${JSON.stringify(error, null, 2)}`,
        }));
      } catch (snsError) {
        console.error('Failed to send error notification:', snsError);
      }
    }

    throw error;
  }
};

/**
 * Determine severity level based on alarm characteristics
 */
function determineSeverity(alarmName: string, state: string): string {
  if (state !== 'ALARM') {
    return 'INFO';
  }

  const name = alarmName.toLowerCase();

  if (name.includes('critical') || name.includes('fatal')) {
    return 'CRITICAL';
  } else if (name.includes('high') || name.includes('error') || name.includes('unhealthy')) {
    return 'HIGH';
  } else if (name.includes('warning') || name.includes('medium')) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Get prefix based on severity
 */
function getSeverityPrefix(severity: string): string {
  const prefixMap: { [key: string]: string } = {
    CRITICAL: '[CRITICAL]',
    HIGH: '[HIGH]',
    MEDIUM: '[MEDIUM]',
    LOW: '[LOW]',
    INFO: '[INFO]',
  };
  return prefixMap[severity] || '[UNKNOWN]';
}

/**
 * Get recommended actions based on alarm type
 */
function getRecommendedActions(alarmName: string, state: string): string[] {
  if (state !== 'ALARM') {
    return ['No action required - alarm is in OK state'];
  }

  const name = alarmName.toLowerCase();
  const actions: string[] = [];

  if (name.includes('cpu')) {
    actions.push('Check application performance and optimize code');
    actions.push('Review auto-scaling policies');
    actions.push('Consider scaling up instance types');
  } else if (name.includes('memory')) {
    actions.push('Investigate memory leaks in application');
    actions.push('Review application logs for errors');
    actions.push('Consider increasing instance memory');
  } else if (name.includes('unhealthy') || name.includes('health')) {
    actions.push('Check application health endpoints');
    actions.push('Review recent deployments');
    actions.push('Inspect instance logs for errors');
  } else if (name.includes('disk') || name.includes('storage')) {
    actions.push('Clean up old logs and temporary files');
    actions.push('Archive or delete unnecessary data');
    actions.push('Increase storage capacity if needed');
  } else {
    actions.push('Investigate the root cause using CloudWatch metrics and logs');
    actions.push('Check recent changes to infrastructure or application');
  }

  return actions;
}

/**
 * Get runbook URL for alarm (placeholder for actual runbook system)
 */
function getRunbookUrl(alarmName: string): string {
  // In production, this would return actual runbook URLs
  return `https://wiki.example.com/runbooks/${encodeURIComponent(alarmName)}`;
}

```

## ./lib/lambda/config-processor.ts

```typescript
import { Context } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { ConfigServiceClient, GetResourceConfigHistoryCommand } from '@aws-sdk/client-config-service';

const snsClient = new SNSClient({});
const configClient = new ConfigServiceClient({});

interface ConfigEvent {
  configRuleNames?: string[];
  configRuleName?: string;
  configurationItem?: any;
  messageType?: string;
  notificationCreationTime?: string;
  recordVersion?: string;
}

/**
 * Lambda function to process AWS Config events and configuration changes
 * Monitors compliance status and sends notifications for configuration drift
 */
export const handler = async (event: any, context: Context): Promise<any> => {
  const notificationTopicArn = process.env.SNS_TOPIC_ARN;
  const environment = process.env.ENVIRONMENT || 'unknown';

  console.log(`Processing AWS Config event in ${environment} environment`);
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    let configData: ConfigEvent;

    // Handle SNS-wrapped Config events
    if (event.Records && event.Records[0]?.Sns) {
      const snsMessage = JSON.parse(event.Records[0].Sns.Message);
      configData = snsMessage;
    } else {
      configData = event;
    }

    const messageType = configData.messageType || 'Unknown';
    const configItem = configData.configurationItem;

    console.log(`Message Type: ${messageType}`);

    // Process different types of Config messages
    let notificationSubject: string;
    let notificationMessage: any;

    switch (messageType) {
      case 'ConfigurationItemChangeNotification':
        notificationSubject = `AWS Config Change Detected - ${environment}`;
        notificationMessage = processConfigurationChange(configItem, environment);
        break;

      case 'ComplianceChangeNotification':
        notificationSubject = `Compliance Status Changed - ${environment}`;
        notificationMessage = processComplianceChange(configData, environment);
        break;

      case 'ConfigurationSnapshotDeliveryCompleted':
        notificationSubject = `Config Snapshot Completed - ${environment}`;
        notificationMessage = {
          message: 'AWS Config snapshot delivery completed successfully',
          timestamp: configData.notificationCreationTime,
          environment: environment,
        };
        break;

      case 'ConfigurationHistoryDeliveryCompleted':
        notificationSubject = `Config History Delivered - ${environment}`;
        notificationMessage = {
          message: 'AWS Config history delivery completed successfully',
          timestamp: configData.notificationCreationTime,
          environment: environment,
        };
        break;

      default:
        notificationSubject = `AWS Config Event - ${environment}`;
        notificationMessage = {
          messageType: messageType,
          event: configData,
          environment: environment,
        };
    }

    // Send notification to SNS
    if (notificationTopicArn) {
      const publishCommand = new PublishCommand({
        TopicArn: notificationTopicArn,
        Subject: notificationSubject,
        Message: JSON.stringify(notificationMessage, null, 2),
        MessageAttributes: {
          messageType: {
            DataType: 'String',
            StringValue: messageType,
          },
          environment: {
            DataType: 'String',
            StringValue: environment,
          },
          resourceType: {
            DataType: 'String',
            StringValue: configItem?.resourceType || 'Unknown',
          },
        },
      });

      await snsClient.send(publishCommand);
      console.log(`Config notification sent to SNS topic: ${notificationTopicArn}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Config event processed successfully',
        messageType: messageType,
      }),
    };

  } catch (error) {
    console.error('Error processing Config event:', error);

    // Send error notification
    if (notificationTopicArn) {
      try {
        await snsClient.send(new PublishCommand({
          TopicArn: notificationTopicArn,
          Subject: `Config Processing Error - ${environment}`,
          Message: `Failed to process Config event:\n${JSON.stringify(error, null, 2)}`,
        }));
      } catch (snsError) {
        console.error('Failed to send error notification:', snsError);
      }
    }

    throw error;
  }
};

/**
 * Process configuration item change
 */
function processConfigurationChange(configItem: any, environment: string): any {
  if (!configItem) {
    return { error: 'No configuration item provided' };
  }

  const changeType = configItem.configurationItemCaptureTime ? 'UPDATE' : 'CREATE';
  const resourceType = configItem.resourceType;
  const resourceId = configItem.resourceId;
  const resourceName = configItem.resourceName || configItem.resourceId;
  const region = configItem.awsRegion;
  const configurationStateId = configItem.configurationStateId;

  // Extract important changes
  const changes: any = {
    resourceType: resourceType,
    resourceId: resourceId,
    resourceName: resourceName,
    region: region,
    changeType: changeType,
    captureTime: configItem.configurationItemCaptureTime,
    status: configItem.configurationItemStatus,
    stateId: configurationStateId,
  };

  // Compare configuration differences if available
  if (configItem.configuration) {
    changes.configuration = configItem.configuration;
  }

  // Check for tags changes
  if (configItem.tags) {
    changes.tags = configItem.tags;
  }

  // Check for relationships
  if (configItem.relationships && configItem.relationships.length > 0) {
    changes.relatedResources = configItem.relationships.map((rel: any) => ({
      type: rel.resourceType,
      id: rel.resourceId,
      name: rel.resourceName,
    }));
  }

  // Determine if this is a critical change
  const isCritical = isCriticalChange(resourceType, configItem);

  return {
    summary: `Configuration change detected for ${resourceType}: ${resourceName}`,
    environment: environment,
    changes: changes,
    isCritical: isCritical,
    severity: isCritical ? 'HIGH' : 'LOW',
    recommendations: getChangeRecommendations(resourceType, changeType),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process compliance change notification
 */
function processComplianceChange(configData: any, environment: string): any {
  const configRuleName = configData.configRuleName ||
                         (configData.configRuleNames && configData.configRuleNames[0]);

  return {
    summary: `Compliance status changed for Config rule: ${configRuleName}`,
    environment: environment,
    configRule: configRuleName,
    timestamp: configData.notificationCreationTime || new Date().toISOString(),
    recommendation: 'Review the Config rule evaluation results and remediate any non-compliant resources',
  };
}

/**
 * Determine if a configuration change is critical
 */
function isCriticalChange(resourceType: string, configItem: any): boolean {
  const criticalResourceTypes = [
    'AWS::IAM::Role',
    'AWS::IAM::Policy',
    'AWS::IAM::User',
    'AWS::EC2::SecurityGroup',
    'AWS::S3::Bucket',
    'AWS::KMS::Key',
    'AWS::CloudTrail::Trail',
    'AWS::Config::ConfigurationRecorder',
  ];

  if (criticalResourceTypes.includes(resourceType)) {
    return true;
  }

  // Check for security-related configuration changes
  const configuration = configItem.configuration || {};

  // S3 bucket public access changes
  if (resourceType === 'AWS::S3::Bucket' && configuration.publicAccessBlockConfiguration) {
    return true;
  }

  // Security group changes
  if (resourceType === 'AWS::EC2::SecurityGroup' && configuration.ipPermissions) {
    return true;
  }

  // Encryption changes
  if (configuration.encryption !== undefined || configuration.serverSideEncryptionConfiguration) {
    return true;
  }

  return false;
}

/**
 * Get recommendations based on resource type and change
 */
function getChangeRecommendations(resourceType: string, changeType: string): string[] {
  const recommendations: string[] = [];

  if (changeType === 'CREATE') {
    recommendations.push('Verify that the new resource follows security best practices');
    recommendations.push('Ensure proper tags are applied for resource management');
  } else if (changeType === 'UPDATE') {
    recommendations.push('Review the configuration changes for security implications');
    recommendations.push('Verify that the changes align with compliance requirements');
  }

  // Resource-specific recommendations
  if (resourceType.includes('SecurityGroup')) {
    recommendations.push('Audit security group rules for overly permissive access');
    recommendations.push('Ensure principle of least privilege is maintained');
  } else if (resourceType.includes('S3::Bucket')) {
    recommendations.push('Verify bucket encryption is enabled');
    recommendations.push('Check that public access is blocked unless explicitly required');
    recommendations.push('Ensure versioning is enabled for data protection');
  } else if (resourceType.includes('IAM')) {
    recommendations.push('Review IAM policies for excessive permissions');
    recommendations.push('Ensure MFA is enabled for privileged accounts');
  }

  return recommendations;
}

```

## ./lib/lambda/s3-processor.ts

```typescript
import { S3Event, S3Handler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const snsClient = new SNSClient({});
const s3Client = new S3Client({});

/**
 * Lambda function to process S3 events and send notifications
 * Handles object creation, validates files, and sends SNS notifications
 */
export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  const environment = process.env.ENVIRONMENT || 'unknown';

  console.log(`Processing S3 events in ${environment} environment`);

  for (const record of event.Records) {
    try {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const eventName = record.eventName;
      const size = record.s3.object.size;

      console.log(`Event: ${eventName}, Bucket: ${bucketName}, Key: ${objectKey}, Size: ${size} bytes`);

      // Get object metadata
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const metadata = await s3Client.send(headCommand);

      // Validate file size (alert if > 100MB)
      const maxSizeBytes = 100 * 1024 * 1024;
      let alertMessage = '';

      if (size > maxSizeBytes) {
        alertMessage = `WARNING: Large file detected: ${objectKey} (${(size / 1024 / 1024).toFixed(2)} MB)`;
        console.warn(alertMessage);
      }

      // Prepare notification message
      const message = {
        event: eventName,
        bucket: bucketName,
        key: objectKey,
        size: size,
        sizeFormatted: `${(size / 1024 / 1024).toFixed(2)} MB`,
        contentType: metadata.ContentType || 'unknown',
        lastModified: metadata.LastModified?.toISOString(),
        encryption: metadata.ServerSideEncryption || 'none',
        versionId: metadata.VersionId,
        environment: environment,
        timestamp: new Date().toISOString(),
        alert: size > maxSizeBytes ? alertMessage : null,
      };

      // Send notification to SNS
      if (snsTopicArn) {
        const publishCommand = new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `S3 Event: ${eventName} - ${environment}`,
          Message: JSON.stringify(message, null, 2),
          MessageAttributes: {
            eventType: {
              DataType: 'String',
              StringValue: eventName,
            },
            environment: {
              DataType: 'String',
              StringValue: environment,
            },
            bucketName: {
              DataType: 'String',
              StringValue: bucketName,
            },
          },
        });

        await snsClient.send(publishCommand);
        console.log(`Notification sent to SNS topic: ${snsTopicArn}`);
      }

      // Additional processing for JSON files
      if (objectKey.endsWith('.json')) {
        console.log(`JSON file detected: ${objectKey}`);

        // Could add JSON validation, schema checking, etc.
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });

        const response = await s3Client.send(getCommand);
        const jsonContent = await response.Body?.transformToString();

        if (jsonContent) {
          try {
            const parsed = JSON.parse(jsonContent);
            console.log(`JSON file successfully parsed. Keys: ${Object.keys(parsed).join(', ')}`);
          } catch (parseError) {
            console.error(`Invalid JSON file: ${objectKey}`, parseError);

            // Send alert for invalid JSON
            if (snsTopicArn) {
              await snsClient.send(new PublishCommand({
                TopicArn: snsTopicArn,
                Subject: `WARNING: Invalid JSON File - ${environment}`,
                Message: `Invalid JSON file detected: ${bucketName}/${objectKey}`,
              }));
            }
          }
        }
      }

    } catch (error) {
      console.error('Error processing S3 event:', error);

      // Send error notification
      if (snsTopicArn) {
        await snsClient.send(new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: `ERROR: S3 Processing Error - ${environment}`,
          Message: `Error processing S3 event: ${JSON.stringify(error, null, 2)}`,
        }));
      }

      throw error;
    }
  }
};

```

## ./lib/tap-stack.d.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface TapStackProps extends cdk.StackProps {
    environmentSuffix?: string;
}
export declare class TapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: TapStackProps);
}
export {};

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```

## ./cdk.json

```json
{
  "app": "pipenv run python3 tap.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "**/__pycache__",
      "tests"
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
    "@aws-cdk/aws-kms:applyImportedAliasPermissionsToPrincipal": true,
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
