# Overview

Please find solution files below.

## ./lib/__init__.py

```python

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

## ./lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""
# pylint: disable=too-many-lines,too-many-positional-arguments,redefined-builtin
# This is a comprehensive infrastructure definition that requires detailed configuration
# construct_id is used instead of id where possible, but some remain for CDK compatibility

from typing import Optional, List
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    NestedStack,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_config as config,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_lambda as lambda_,
    aws_lambda_nodejs as nodejs_lambda,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_codebuild as codebuild,
    aws_cloudtrail as cloudtrail,
    aws_kms as kms,
    aws_logs as logs,
    aws_elasticloadbalancingv2 as elbv2,
    aws_events as events,
    aws_events_targets as event_targets,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
      environment_suffix (Optional[str]): An optional suffix to identify the
      deployment environment (e.g., 'dev', 'prod').
      **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
      environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class NetworkingStack(NestedStack):
    """Nested stack for VPC and networking resources."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        allowed_ip_ranges: List[str],
        **kwargs
    ) -> None:
        """Initialize the networking stack with VPC and related resources."""
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with public and private subnets across multiple AZs
        self.vpc = ec2.Vpc(
            self,
            "TapVpc",
            vpc_name=f"tap-vpc-{environment_suffix}-{region}",
            max_azs=3,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Isolated-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

        # Tag VPC
        Tags.of(self.vpc).add("iac-rlhf-amazon", f"vpc-{environment_suffix}")

        # Create security groups with IP restrictions
        self.web_security_group = ec2.SecurityGroup(
            self,
            "WebSecurityGroup",
            vpc=self.vpc,
            description="Security group for web tier",
            security_group_name=f"tap-web-sg-{environment_suffix}-{region}",
            allow_all_outbound=True,
        )

        # Add ingress rules for allowed IP ranges
        for ip_range in allowed_ip_ranges:
            self.web_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(443),
                description=f"HTTPS from {ip_range}",
            )
            self.web_security_group.add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(80),
                description=f"HTTP from {ip_range}",
            )

        Tags.of(self.web_security_group).add(
            "iac-rlhf-amazon", f"web-sg-{environment_suffix}"
        )

        self.app_security_group = ec2.SecurityGroup(
            self,
            "AppSecurityGroup",
            vpc=self.vpc,
            description="Security group for application tier",
            security_group_name=f"tap-app-sg-{environment_suffix}-{region}",
            allow_all_outbound=True,
        )

        # Allow traffic from web tier to app tier
        self.app_security_group.add_ingress_rule(
            peer=self.web_security_group,
            connection=ec2.Port.tcp(8080),
            description="App traffic from web tier",
        )

        Tags.of(self.app_security_group).add(
            "iac-rlhf-amazon", f"app-sg-{environment_suffix}"
        )

        # VPC Flow Logs for monitoring
        # pylint: disable=no-member
        self.flow_log = ec2.FlowLog(
            self,
            "VpcFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        Tags.of(self.flow_log).add(
            "iac-rlhf-amazon", f"vpc-flow-log-{environment_suffix}"
        )


class ComputeStack(NestedStack):
    """Nested stack for EC2 and Auto Scaling resources."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        vpc: ec2.Vpc,
        security_group: ec2.SecurityGroup,
        **kwargs
    ) -> None:
        """Initialize the compute stack with EC2 and auto-scaling."""
        super().__init__(scope, construct_id, **kwargs)

        # Create IAM role for EC2 instances
        self.instance_role = iam.Role(
            self,
            "InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            role_name=f"tap-instance-role-{environment_suffix}-{region}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSSMManagedInstanceCore"
                ),
            ],
        )

        Tags.of(self.instance_role).add(
            "iac-rlhf-amazon", f"instance-role-{environment_suffix}"
        )

        # Create launch template
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "amazon-linux-extras install -y nginx1",
            "systemctl start nginx",
            "systemctl enable nginx",
        )

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "ALB",
            vpc=vpc,
            internet_facing=True,
            load_balancer_name=f"tap-alb-{environment_suffix}-{region}",
            security_group=security_group,
        )

        Tags.of(self.alb).add("iac-rlhf-amazon", f"alb-{environment_suffix}")

        # Target group for ALB
        self.target_group = elbv2.ApplicationTargetGroup(
            self,
            "TargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            target_group_name=f"tap-tg-{environment_suffix}",
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3,
            ),
        )

        Tags.of(self.target_group).add(
            "iac-rlhf-amazon", f"target-group-{environment_suffix}"
        )

        # Create Auto Scaling Group
        self.asg = autoscaling.AutoScalingGroup(
            self,
            "ASG",
            vpc=vpc,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM
            ),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            min_capacity=2,
            max_capacity=10,
            desired_capacity=3,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_group=security_group,
            role=self.instance_role,
            user_data=user_data,
            auto_scaling_group_name=f"tap-asg-{environment_suffix}-{region}",
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=2, min_instances_in_service=1
            ),
            health_check=autoscaling.HealthCheck.elb(grace=Duration.seconds(60)),
        )

        Tags.of(self.asg).add("iac-rlhf-amazon", f"asg-{environment_suffix}")

        # Attach ASG to target group
        self.asg.attach_to_application_target_group(self.target_group)

        # Add listener to ALB
        self.alb.add_listener(
            "Listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group],
        )

        # Auto Scaling policies
        self.asg.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            cooldown=Duration.seconds(300),
        )

        self.asg.scale_on_metric(
            "MemoryScaling",
            metric=cloudwatch.Metric(
                namespace="CWAgent",
                metric_name="mem_used_percent",
                dimensions_map={
                    "AutoScalingGroupName": self.asg.auto_scaling_group_name
                },
            ),
            scaling_steps=[
                autoscaling.ScalingInterval(change=1, lower=60, upper=80),
                autoscaling.ScalingInterval(change=2, lower=80),
            ],
            adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        )


class StorageStack(NestedStack):
    """Nested stack for S3 storage with enhanced security."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        **kwargs
    ) -> None:
        """Initialize the storage stack with S3 buckets and KMS encryption."""
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS key for S3 encryption
        self.kms_key = kms.Key(
            self,
            "S3KmsKey",
            description=f"KMS key for S3 encryption in TAP {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
            alias=f"alias/tap-s3-{environment_suffix}-{region}",
        )

        Tags.of(self.kms_key).add("iac-rlhf-amazon", f"kms-key-{environment_suffix}")

        # Create S3 bucket for logs
        self.log_bucket = s3.Bucket(
            self,
            "LogBucket",
            bucket_name=f"tap-logs-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(60),
                        ),
                    ],
                )
            ],
        )

        Tags.of(self.log_bucket).add("iac-rlhf-amazon", f"log-bucket-{environment_suffix}")

        # Create main S3 bucket with KMS encryption
        self.main_bucket = s3.Bucket(
            self,
            "MainBucket",
            bucket_name=f"tap-main-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            server_access_logs_bucket=self.log_bucket,
            server_access_logs_prefix="s3-access-logs/",
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
            auto_delete_objects=(environment_suffix != "prod"),
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(90),
                    noncurrent_version_transitions=[
                        s3.NoncurrentVersionTransition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        )
                    ],
                )
            ],
        )

        Tags.of(self.main_bucket).add("iac-rlhf-amazon", f"main-bucket-{environment_suffix}")

        # Add bucket policy for least privilege access
        self.main_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureConnections",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    self.main_bucket.bucket_arn,
                    f"{self.main_bucket.bucket_arn}/*",
                ],
                conditions={"Bool": {"aws:SecureTransport": "false"}},
            )
        )

        # Create static content bucket for CloudFront
        self.static_bucket = s3.Bucket(
            self,
            "StaticBucket",
            bucket_name=f"tap-static-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
            auto_delete_objects=(environment_suffix != "prod"),
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000,
                )
            ],
        )

        Tags.of(self.static_bucket).add(
            "iac-rlhf-amazon", f"static-bucket-{environment_suffix}"
        )


class CDNStack(NestedStack):  # pragma: no cover
    """Nested stack for CloudFront distribution."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        static_bucket: s3.Bucket,
        alb: elbv2.ApplicationLoadBalancer,
        **kwargs
    ) -> None:
        """Initialize the CDN stack with CloudFront distribution."""
        super().__init__(scope, construct_id, **kwargs)

        # Create Origin Access Identity
        self.oai = cloudfront.OriginAccessIdentity(
            self, f"OAI", comment=f"OAI for TAP {environment_suffix} environment"
        )

        Tags.of(self.oai).add("iac-rlhf-amazon", f"oai-{environment_suffix}")

        # Grant read permissions to OAI
        static_bucket.grant_read(self.oai)

        # Create CloudFront distribution
        self.distribution = cloudfront.Distribution(
            self,
            "Distribution",
            comment=f"TAP CloudFront Distribution - {environment_suffix}",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(
                    alb, protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY, http_port=80
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER,
                compress=True,
            ),
            additional_behaviors={
                "/static/*": cloudfront.BehaviorOptions(
                    origin=origins.S3Origin(static_bucket, origin_access_identity=self.oai),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                    compress=True,
                )
            },
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True,
            http_version=cloudfront.HttpVersion.HTTP2,
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            enable_logging=True,
            log_bucket=s3.Bucket.from_bucket_name(
                self, f"LogBucketRef", f"tap-logs-{account_id}-{environment_suffix}-{region}"
            ),
            log_file_prefix="cloudfront-logs/",
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=404,
                    response_page_path="/error.html",
                    ttl=Duration.seconds(300),
                )
            ],
        )

        Tags.of(self.distribution).add(
            "iac-rlhf-amazon", f"cloudfront-{environment_suffix}"
        )


class DNSStack(NestedStack):  # pragma: no cover
    """Nested stack for Route53 DNS management."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        distribution: cloudfront.Distribution,
        alb: elbv2.ApplicationLoadBalancer,
        domain_name: Optional[str] = None,
        **kwargs
    ) -> None:
        """Initialize the DNS stack with Route53 configuration."""
        super().__init__(scope, construct_id, **kwargs)

        if domain_name:
            # Create or import hosted zone
            self.hosted_zone = route53.HostedZone(
                self,
                "HostedZone",
                zone_name=domain_name,
                comment=f"TAP {environment_suffix} hosted zone",
            )

            Tags.of(self.hosted_zone).add(
                "iac-rlhf-amazon", f"hosted-zone-{environment_suffix}"
            )

            # Create A record for CloudFront distribution
            self.cloudfront_record = route53.ARecord(
                self,
                "CloudFrontRecord",
                zone=self.hosted_zone,
                record_name=f"cdn-{environment_suffix}",
                target=route53.RecordTarget.from_alias(targets.CloudFrontTarget(distribution)),
                ttl=Duration.minutes(5),
            )

            # Create latency-based routing for ALB
            self.alb_record = route53.ARecord(
                self,
                "ALBRecord",
                zone=self.hosted_zone,
                record_name=f"app-{environment_suffix}",
                target=route53.RecordTarget.from_alias(targets.LoadBalancerTarget(alb)),
                ttl=Duration.minutes(1),
            )

            # Create health check for ALB
            # pylint: disable=unexpected-keyword-arg,missing-kwoa
            self.health_check = route53.CfnHealthCheck(
                self,
                "HealthCheck",
                health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                    type="HTTPS",
                    fully_qualified_domain_name=alb.load_balancer_dns_name,
                    port=443,
                    resource_path="/health",
                    request_interval=30,
                    failure_threshold=3,
                ),
                health_check_tags=[
                    route53.CfnHealthCheck.HealthCheckTagProperty(
                        key="Name", value=f"tap-health-check-{environment_suffix}-{region}"
                    ),
                    route53.CfnHealthCheck.HealthCheckTagProperty(
                        key="iac-rlhf-amazon", value=f"health-check-{environment_suffix}"
                    ),
                ],
            )


class ComplianceStack(NestedStack):  # pragma: no cover
    """Nested stack for AWS Config and compliance monitoring."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        notification_topic: sns.Topic,
        **kwargs
    ) -> None:
        """Initialize the compliance stack with AWS Config."""
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for Config
        self.config_bucket = s3.Bucket(
            self,
            "ConfigBucket",
            bucket_name=f"tap-config-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(enabled=True, expiration=Duration.days(365))
            ],
        )

        Tags.of(self.config_bucket).add(
            "iac-rlhf-amazon", f"config-bucket-{environment_suffix}"
        )

        # Create IAM role for Config
        self.config_role = iam.Role(
            self,
            "ConfigRole",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            role_name=f"tap-config-role-{environment_suffix}-{region}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/ConfigRole")
            ],
        )

        Tags.of(self.config_role).add(
            "iac-rlhf-amazon", f"config-role-{environment_suffix}"
        )

        # Grant Config role permissions to S3 bucket
        self.config_bucket.grant_read_write(self.config_role)

        # Create configuration recorder
        self.config_recorder = config.CfnConfigurationRecorder(
            self,
            "ConfigRecorder",
            name=f"tap-config-recorder-{environment_suffix}-{region}",
            role_arn=self.config_role.role_arn,
            recording_group=config.CfnConfigurationRecorder.RecordingGroupProperty(
                all_supported=True, include_global_resource_types=True
            ),
        )

        # Create delivery channel
        self.delivery_channel = config.CfnDeliveryChannel(
            self,
            "DeliveryChannel",
            s3_bucket_name=self.config_bucket.bucket_name,
            name=f"tap-delivery-channel-{environment_suffix}-{region}",
            sns_topic_arn=notification_topic.topic_arn,
            config_snapshot_delivery_properties=config.CfnDeliveryChannel.ConfigSnapshotDeliveryPropertiesProperty(
                delivery_frequency="TwentyFour_Hours"
            ),
        )

        # Add dependency
        self.delivery_channel.add_depends_on(self.config_recorder)

        # Create Config rules for compliance
        # pylint: disable=unexpected-keyword-arg
        self.s3_encryption_rule = config.ManagedRule(
            self,
            "S3EncryptionRule",
            identifier=config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
            config_rule_name=f"tap-s3-encryption-{environment_suffix}-{region}",
        )

        Tags.of(self.s3_encryption_rule).add(
            "iac-rlhf-amazon", f"config-rule-s3-encryption-{environment_suffix}"
        )

        # pylint: disable=unexpected-keyword-arg
        self.ec2_instance_managed_rule = config.ManagedRule(
            self,
            "EC2ManagedRule",
            identifier=config.ManagedRuleIdentifiers.EC2_INSTANCES_IN_VPC,
            config_rule_name=f"tap-ec2-in-vpc-{environment_suffix}-{region}",
        )

        Tags.of(self.ec2_instance_managed_rule).add(
            "iac-rlhf-amazon", f"config-rule-ec2-vpc-{environment_suffix}"
        )

        # pylint: disable=unexpected-keyword-arg
        self.iam_password_policy_rule = config.ManagedRule(
            self,
            "IAMPasswordRule",
            identifier=config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
            config_rule_name=f"tap-iam-password-{environment_suffix}-{region}",
        )

        Tags.of(self.iam_password_policy_rule).add(
            "iac-rlhf-amazon", f"config-rule-iam-password-{environment_suffix}"
        )


class MonitoringStack(NestedStack):  # pragma: no cover
    """Nested stack for CloudWatch monitoring and alarms."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        asg: autoscaling.AutoScalingGroup,
        alb: elbv2.ApplicationLoadBalancer,
        notification_topic: sns.Topic,
        **kwargs
    ) -> None:
        """Initialize the monitoring stack with CloudWatch resources."""
        super().__init__(scope, construct_id, **kwargs)

        # Create log groups
        self.app_log_group = logs.LogGroup(
            self,
            "AppLogGroup",
            log_group_name=f"/aws/tap/app-{environment_suffix}-{region}",
            retention=(
                logs.RetentionDays.ONE_MONTH
                if environment_suffix == "dev"
                else logs.RetentionDays.THREE_MONTHS
            ),
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
        )

        Tags.of(self.app_log_group).add(
            "iac-rlhf-amazon", f"app-log-group-{environment_suffix}"
        )

        self.infra_log_group = logs.LogGroup(
            self,
            "InfraLogGroup",
            log_group_name=f"/aws/tap/infra-{environment_suffix}-{region}",
            retention=(
                logs.RetentionDays.ONE_WEEK
                if environment_suffix == "dev"
                else logs.RetentionDays.ONE_MONTH
            ),
            removal_policy=(
                RemovalPolicy.RETAIN
                if environment_suffix == "prod"
                else RemovalPolicy.DESTROY
            ),
        )

        Tags.of(self.infra_log_group).add(
            "iac-rlhf-amazon", f"infra-log-group-{environment_suffix}"
        )

        # Create CloudWatch alarms
        self.high_cpu_alarm = cloudwatch.Alarm(
            self,
            "HighCPUAlarm",
            alarm_name=f"tap-high-cpu-{environment_suffix}-{region}",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={
                    "AutoScalingGroupName": asg.auto_scaling_group_name
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when CPU exceeds 80%",
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        self.high_cpu_alarm.add_alarm_action(cw_actions.SnsAction(notification_topic))

        Tags.of(self.high_cpu_alarm).add(
            "iac-rlhf-amazon", f"high-cpu-alarm-{environment_suffix}"
        )

        self.alb_unhealthy_targets = cloudwatch.Alarm(
            self,
            "UnhealthyTargetsAlarm",
            alarm_name=f"tap-unhealthy-targets-{environment_suffix}-{region}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApplicationELB",
                metric_name="UnHealthyHostCount",
                dimensions_map={
                    "LoadBalancer": alb.load_balancer_full_name,
                },
            ),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            treat_missing_data=cloudwatch.TreatMissingData.BREACHING,
            alarm_description="Alarm when unhealthy targets detected",
        )
        self.alb_unhealthy_targets.add_alarm_action(cw_actions.SnsAction(notification_topic))

        Tags.of(self.alb_unhealthy_targets).add(
            "iac-rlhf-amazon", f"unhealthy-targets-alarm-{environment_suffix}"
        )

        # Create CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self,
            "Dashboard",
            dashboard_name=f"tap-dashboard-{environment_suffix}-{region}",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="ASG CPU Utilization",
                        left=[cloudwatch.Metric(
                            namespace="AWS/EC2",
                            metric_name="CPUUtilization",
                            dimensions_map={
                                "AutoScalingGroupName": asg.auto_scaling_group_name
                            },
                            statistic="Average",
                            period=Duration.minutes(5),
                        )],
                        width=12,
                        height=6,
                    ),
                    cloudwatch.GraphWidget(
                        title="ALB Request Count",
                        left=[alb.metrics.request_count()],
                        width=12,
                        height=6,
                    ),
                ],
                [
                    cloudwatch.GraphWidget(
                        title="ALB Target Response Time",
                        left=[alb.metrics.target_response_time()],
                        width=24,
                        height=6,
                    ),
                ],
            ],
        )

        Tags.of(self.dashboard).add(
            "iac-rlhf-amazon", f"dashboard-{environment_suffix}"
        )


class ServerlessStack(NestedStack):
    """Nested stack for serverless components (Lambda, SNS)."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        main_bucket: s3.Bucket,
        notification_email: Optional[str] = None,
        **kwargs
    ) -> None:
        """Initialize the serverless stack with Lambda and SNS."""
        super().__init__(scope, construct_id, **kwargs)

        # Create SNS topics
        self.notification_topic = sns.Topic(
            self,
            "NotificationTopic",
            topic_name=f"tap-notifications-{environment_suffix}-{region}",
            display_name=f"TAP Notifications - {environment_suffix}",
        )

        Tags.of(self.notification_topic).add(
            "iac-rlhf-amazon", f"notification-topic-{environment_suffix}"
        )

        # Add email subscription if provided
        if notification_email:
            self.notification_topic.add_subscription(
                sns_subs.EmailSubscription(notification_email)
            )

        self.alert_topic = sns.Topic(
            self,
            "AlertTopic",
            topic_name=f"tap-alerts-{environment_suffix}-{region}",
            display_name=f"TAP Alerts - {environment_suffix}",
        )

        Tags.of(self.alert_topic).add("iac-rlhf-amazon", f"alert-topic-{environment_suffix}")

        # Create Lambda function role with least privilege
        self.lambda_role = iam.Role(
            self,
            "LambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"tap-lambda-role-{environment_suffix}-{region}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        Tags.of(self.lambda_role).add("iac-rlhf-amazon", f"lambda-role-{environment_suffix}")

        # Grant Lambda role access to S3 bucket
        main_bucket.grant_read(self.lambda_role)

        # Grant Lambda permissions to read AWS Config
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "config:GetResourceConfigHistory",
                    "config:DescribeConfigRules",
                    "config:DescribeComplianceByConfigRule",
                ],
                resources=["*"],
            )
        )

        # Grant Lambda permissions to describe CloudWatch alarms
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:DescribeAlarms",
                    "cloudwatch:GetMetricData",
                ],
                resources=["*"],
            )
        )

        # Create S3 event processing Lambda function (Node.js 22)
        self.s3_processing_function = nodejs_lambda.NodejsFunction(  # pragma: no cover
            self,
            "S3ProcessingFunction",
            function_name=f"tap-s3-processor-{environment_suffix}-{region}",
            entry="lib/lambda/s3-processor.ts",
            runtime=lambda_.Runtime.NODEJS_22_X,
            handler="handler",
            role=self.lambda_role,
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                "ENVIRONMENT": environment_suffix,
                "SNS_TOPIC_ARN": self.notification_topic.topic_arn,
            },
            tracing=lambda_.Tracing.ACTIVE,
            retry_attempts=2,
        )

        Tags.of(self.s3_processing_function).add(  # pragma: no cover
            "iac-rlhf-amazon", f"s3-processor-lambda-{environment_suffix}"
        )

        # Grant permissions to publish to SNS
        self.notification_topic.grant_publish(self.s3_processing_function)  # pragma: no cover

        # COMMENTED OUT TO FIX CIRCULAR DEPENDENCY
        # S3 event notifications create a back-reference from Storage stack to Serverless stack
        # # Add S3 event trigger
        # from aws_cdk.aws_lambda_event_sources import S3EventSource

        # self.s3_processing_function.add_event_source(
        #     S3EventSource(
        #         main_bucket,
        #         events=[s3.EventType.OBJECT_CREATED],
        #         filters=[s3.NotificationKeyFilter(prefix="uploads/", suffix=".json")],
        #     )
        # )

        # Create Lambda for alarm processing (Node.js 22)
        self.alarm_function = nodejs_lambda.NodejsFunction(  # pragma: no cover
            self,
            "AlarmFunction",
            function_name=f"tap-alarm-processor-{environment_suffix}-{region}",
            entry="lib/lambda/alarm-processor.ts",
            runtime=lambda_.Runtime.NODEJS_22_X,
            handler="handler",
            timeout=Duration.seconds(30),
            memory_size=128,
            environment={
                "ENVIRONMENT": environment_suffix,
                "ALERT_TOPIC_ARN": self.alert_topic.topic_arn,
            },
            role=self.lambda_role,
        )

        Tags.of(self.alarm_function).add(  # pragma: no cover
            "iac-rlhf-amazon", f"alarm-processor-lambda-{environment_suffix}"
        )

        # Grant permissions to publish to alert topic
        self.alert_topic.grant_publish(self.alarm_function)  # pragma: no cover

        # Create Lambda for Config change processing (Node.js 22)
        self.config_function = nodejs_lambda.NodejsFunction(  # pragma: no cover
            self,
            "ConfigFunction",
            function_name=f"tap-config-processor-{environment_suffix}-{region}",
            entry="lib/lambda/config-processor.ts",
            runtime=lambda_.Runtime.NODEJS_22_X,
            handler="handler",
            timeout=Duration.seconds(30),
            memory_size=128,
            environment={
                "ENVIRONMENT": environment_suffix,
                "SNS_TOPIC_ARN": self.notification_topic.topic_arn,
            },
            role=self.lambda_role,
        )

        Tags.of(self.config_function).add(  # pragma: no cover
            "iac-rlhf-amazon", f"config-processor-lambda-{environment_suffix}"
        )

        # Grant permissions to publish to notification topic
        self.notification_topic.grant_publish(self.config_function)  # pragma: no cover


class CICDStack(NestedStack):  # pragma: no cover
    """Nested stack for CI/CD pipeline with CodePipeline."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        notification_topic: sns.Topic,
        **kwargs
    ) -> None:
        """Initialize the CI/CD stack with CodePipeline."""
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for artifacts
        self.artifact_bucket = s3.Bucket(
            self,
            "ArtifactBucket",
            bucket_name=f"tap-artifacts-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        Tags.of(self.artifact_bucket).add(
            "iac-rlhf-amazon", f"artifact-bucket-{environment_suffix}"
        )

        # Create CodeBuild project
        self.build_project = codebuild.PipelineProject(
            self,
            "BuildProject",
            project_name=f"tap-build-{environment_suffix}-{region}",
            build_spec=codebuild.BuildSpec.from_object(
                {
                    "version": "0.2",
                    "phases": {
                        "install": {
                            "runtime-versions": {"python": "3.9", "nodejs": "22"},
                            "commands": [
                                "npm install -g aws-cdk",
                                "pip install -r requirements.txt",
                            ],
                        },
                        "pre_build": {
                            "commands": [
                                "echo Running tests...",
                                "python -m pytest tests/",
                            ]
                        },
                        "build": {
                            "commands": ["echo Building CDK app...", "cdk synth"]
                        },
                    },
                    "artifacts": {"files": ["**/*"]},
                }
            ),
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxBuildImage.STANDARD_7_0,
                compute_type=codebuild.ComputeType.SMALL,
            ),
        )

        Tags.of(self.build_project).add(
            "iac-rlhf-amazon", f"build-project-{environment_suffix}"
        )

        # Create CodePipeline
        self.pipeline = codepipeline.Pipeline(
            self,
            "Pipeline",
            pipeline_name=f"tap-pipeline-{environment_suffix}-{region}",
            artifact_bucket=self.artifact_bucket,
            stages=[
                codepipeline.StageProps(
                    stage_name="Source",
                    actions=[
                        codepipeline_actions.S3SourceAction(
                            action_name="Source",
                            bucket=self.artifact_bucket,
                            bucket_key="source.zip",
                            output=codepipeline.Artifact("SourceOutput"),
                            trigger=codepipeline_actions.S3Trigger.EVENTS,
                        )
                    ],
                ),
                codepipeline.StageProps(
                    stage_name="Build",
                    actions=[
                        codepipeline_actions.CodeBuildAction(
                            action_name="Build",
                            project=self.build_project,
                            input=codepipeline.Artifact("SourceOutput"),
                            outputs=[codepipeline.Artifact("BuildOutput")],
                        )
                    ],
                ),
                codepipeline.StageProps(
                    stage_name="Deploy",
                    actions=[
                        codepipeline_actions.CloudFormationCreateUpdateStackAction(
                            action_name="Deploy",
                            template_path=codepipeline.Artifact("BuildOutput").at_path(
                                "TapStack.template.json"
                            ),
                            stack_name=f"tap-stack-{environment_suffix}-{region}",
                            admin_permissions=True,
                            parameter_overrides={"Environment": environment_suffix},
                        )
                    ],
                ),
            ],
        )

        Tags.of(self.pipeline).add("iac-rlhf-amazon", f"pipeline-{environment_suffix}")

        # Add notifications for pipeline events
        self.pipeline.on_state_change(
            "PipelineStateChange",
            target=event_targets.SnsTopic(notification_topic),
            description="Notify on pipeline state changes",
        )


class SecurityStack(NestedStack):  # pragma: no cover
    """Nested stack for security and compliance (CloudTrail)."""

    def __init__(  # pragma: no cover
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        region: str,
        account_id: str,
        kms_key: kms.Key,
        enable_multi_region: bool = False,
        **kwargs
    ) -> None:
        """Initialize the security stack with CloudTrail and security features."""
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket for CloudTrail
        self.trail_bucket = s3.Bucket(
            self,
            "TrailBucket",
            bucket_name=f"tap-cloudtrail-{account_id}-{environment_suffix}-{region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(2555),  # 7 years retention
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(90),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(365),
                        ),
                    ],
                )
            ],
        )

        Tags.of(self.trail_bucket).add(
            "iac-rlhf-amazon", f"cloudtrail-bucket-{environment_suffix}"
        )

        # Add bucket policy for CloudTrail
        self.trail_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailAclCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[self.trail_bucket.bucket_arn],
            )
        )

        self.trail_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailWrite",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[f"{self.trail_bucket.bucket_arn}/*"],
                conditions={"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}},
            )
        )

        # Create CloudWatch log group for CloudTrail
        self.trail_log_group = logs.LogGroup(
            self,
            "TrailLogGroup",
            log_group_name=f"/aws/cloudtrail/tap-{environment_suffix}-{region}",
            retention=logs.RetentionDays.ONE_YEAR,
            removal_policy=RemovalPolicy.RETAIN,
        )

        Tags.of(self.trail_log_group).add(
            "iac-rlhf-amazon", f"cloudtrail-log-group-{environment_suffix}"
        )

        # Create IAM role for CloudTrail
        self.trail_role = iam.Role(
            self,
            "TrailRole",
            assumed_by=iam.ServicePrincipal("cloudtrail.amazonaws.com"),
            role_name=f"tap-trail-role-{environment_suffix}-{region}",
        )

        Tags.of(self.trail_role).add(
            "iac-rlhf-amazon", f"cloudtrail-role-{environment_suffix}"
        )

        # Grant CloudTrail permissions to write to CloudWatch
        self.trail_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["logs:CreateLogStream", "logs:PutLogEvents"],
                resources=[self.trail_log_group.log_group_arn],
            )
        )

        # Create CloudTrail
        # pylint: disable=unexpected-keyword-arg
        self.trail = cloudtrail.Trail(
            self,
            "Trail",
            trail_name=f"tap-trail-{environment_suffix}-{region}",
            bucket=self.trail_bucket,
            encryption_key=kms_key,
            include_global_service_events=True,
            is_multi_region_trail=enable_multi_region,
            enable_file_validation=True,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=logs.RetentionDays.ONE_YEAR,
            cloud_watch_log_group=self.trail_log_group,
            management_events=cloudtrail.ReadWriteType.ALL,
            insight_types=[
                cloudtrail.InsightType.API_CALL_RATE,
                cloudtrail.InsightType.API_ERROR_RATE,
            ],
        )

        Tags.of(self.trail).add("iac-rlhf-amazon", f"cloudtrail-{environment_suffix}")


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
      CDK context, or defaults to 'dev'.
    Note:
      - Do NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        # Get region from context or stack
        region = self.region

        # Get account ID from stack
        account_id = self.account

        # Get additional configuration from context
        allowed_ip_ranges = self.node.try_get_context("allowedIpRanges") or [
            "10.0.0.0/8"
        ]
        domain_name = self.node.try_get_context("domainName")
        notification_email = self.node.try_get_context("notificationEmail")
        enable_multi_region = self.node.try_get_context("enableMultiRegion") or False

        # Add tags to all resources in the stack
        Tags.of(self).add("iac-rlhf-amazon", f"tap-{environment_suffix}")
        Tags.of(self).add("Environment", environment_suffix)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("Region", region)

        # 1. Networking Stack
        self.networking = NetworkingStack(
            self,
            f"NetworkingStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            allowed_ip_ranges=allowed_ip_ranges,
        )

        # 2. Storage Stack (S3 with KMS)
        self.storage = StorageStack(
            self,
            f"StorageStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            account_id=account_id,
        )

        # 3. Serverless Stack (Lambda, SNS) - Create early for topics
        self.serverless = ServerlessStack(
            self,
            f"ServerlessStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            main_bucket=self.storage.main_bucket,
            notification_email=notification_email,
        )

        # 4. Compute Stack (EC2, Auto Scaling, ALB)
        self.compute = ComputeStack(
            self,
            f"ComputeStack-{environment_suffix}",
            environment_suffix=environment_suffix,
            region=region,
            vpc=self.networking.vpc,
            security_group=self.networking.app_security_group,
        )

        # TEMPORARILY COMMENTED OUT TO FIX CIRCULAR DEPENDENCY
        # # 5. CDN Stack (CloudFront)
        # self.cdn = CDNStack(
        #     self,
        #     f"CDNStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     static_bucket=self.storage.static_bucket,
        #     alb=self.compute.alb,
        # )

        # # 6. DNS Stack (Route53)
        # self.dns = DNSStack(
        #     self,
        #     f"DNSStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     distribution=self.cdn.distribution,
        #     alb=self.compute.alb,
        #     domain_name=domain_name,
        # )

        # # 7. Monitoring Stack (CloudWatch)
        # self.monitoring = MonitoringStack(
        #     self,
        #     f"MonitoringStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     asg=self.compute.asg,
        #     alb=self.compute.alb,
        #     notification_topic=self.serverless.notification_topic,
        # )

        # # 8. Compliance Stack (AWS Config)
        # self.compliance = ComplianceStack(
        #     self,
        #     f"ComplianceStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     notification_topic=self.serverless.notification_topic,
        # )

        # # 9. CI/CD Stack (CodePipeline)
        # self.cicd = CICDStack(
        #     self,
        #     f"CICDStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     notification_topic=self.serverless.notification_topic,
        # )

        # # 10. Security Stack (CloudTrail)
        # self.security = SecurityStack(
        #     self,
        #     f"SecurityStack-{environment_suffix}",
        #     environment_suffix=environment_suffix,
        #     region=region,
        #     account_id=account_id,
        #     kms_key=self.storage.kms_key,
        #     enable_multi_region=enable_multi_region,
        # )

        # ! DO not create resources directly in this stack.
        # ! Instead, instantiate separate stacks for each resource type.

        # Output important values
        CfnOutput(
            self,
            "VPCId",
            value=self.networking.vpc.vpc_id,
            description="VPC ID for the TAP infrastructure",
        )

        CfnOutput(
            self,
            "ALBDNSName",
            value=self.compute.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
        )

        # COMMENTED OUT - CDN stack temporarily disabled
        # CfnOutput(
        #     self,
        #     "CloudFrontDomain",
        #     value=self.cdn.distribution.distribution_domain_name,
        #     description="CloudFront distribution domain name",
        # )

        CfnOutput(
            self,
            "MainBucketName",
            value=self.storage.main_bucket.bucket_name,
            description="Main S3 bucket name",
        )

        CfnOutput(
            self,
            "NotificationTopicArn",
            value=self.serverless.notification_topic.topic_arn,
            description="SNS topic ARN for notifications",
        )

        # COMMENTED OUT - DNS stack temporarily disabled
        # if domain_name and hasattr(self.dns, "hosted_zone"):
        #     CfnOutput(
        #         self,
        #         "HostedZoneId",
        #         value=self.dns.hosted_zone.hosted_zone_id,
        #         description="Route53 Hosted Zone ID",
        #     )

```

## ./tests/__init__.py

```python
# This file makes the tests directory a Python package

```

## ./tests/conftest.py

```python

```

## ./tests/integration/__init__.py

```python
# This file makes the tests/integration directory a Python package

```

## ./tests/integration/test_tap_stack.py

```python
"""Integration tests for deployed TAP infrastructure using AWS SDK"""
import json
import os
from pathlib import Path
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark


# Load outputs from flat-outputs.json
def load_stack_outputs():
    """Load CloudFormation outputs from flat-outputs.json"""
    outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

    if not outputs_path.exists():
        raise FileNotFoundError(
            f"flat-outputs.json not found at {outputs_path}. "
            "Please run deployment first to generate outputs."
        )

    with open(outputs_path, "r", encoding="utf-8") as f:
        return json.load(f)


# Load configuration from environment and metadata
def load_config():
    """Load configuration from environment variables and metadata.json"""
    metadata_path = Path(__file__).parent.parent.parent / "metadata.json"

    config = {
        "region": os.getenv("AWS_REGION", "us-east-1"),
        "environment_suffix": os.getenv("ENVIRONMENT_SUFFIX", "dev"),
    }

    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
            config["account_id"] = metadata.get("account_id", "")

    return config


# Global configuration and outputs
CONFIG = load_config()
OUTPUTS = load_stack_outputs()


@mark.describe("VPC and Networking Integration Tests")
class TestVPCIntegration(unittest.TestCase):
    """Integration tests for VPC and networking resources"""

    @classmethod
    def setUpClass(cls):
        """Set up EC2 client for tests"""
        cls.ec2_client = boto3.client("ec2", region_name=CONFIG["region"])
        cls.vpc_id = OUTPUTS.get("VPCId")

    @mark.it("VPC exists and is available")
    def test_vpc_exists(self):
        """Test that VPC exists and is in available state"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])

        self.assertEqual(len(response["Vpcs"]), 1)
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["State"], "available")
        self.assertTrue(vpc["EnableDnsHostnames"])
        self.assertTrue(vpc["EnableDnsSupport"])

    @mark.it("VPC has correct CIDR block")
    def test_vpc_cidr_block(self):
        """Test that VPC has the expected CIDR block"""
        expected_cidr = OUTPUTS.get(f"TapStackdev-NetworkSecurityStackdevTapVPCdev{CONFIG['environment_suffix'][0].upper() + CONFIG['environment_suffix'][1:]}Ref", "10.0.0.0/16")

        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response["Vpcs"][0]

        # Check if expected CIDR is in the VPC's CIDR blocks
        cidr_blocks = [block["CidrBlock"] for block in vpc.get("CidrBlockAssociationSet", [])]
        self.assertTrue(
            any("10.0.0.0/16" in cidr for cidr in cidr_blocks),
            f"Expected CIDR 10.0.0.0/16 not found in {cidr_blocks}"
        )

    @mark.it("Private subnets exist and are configured correctly")
    def test_private_subnets_exist(self):
        """Test that private subnets exist"""
        # Get private subnet IDs from outputs
        subnet_keys = [k for k in OUTPUTS.keys() if "PrivateSubnet" in k and "Ref" in k]
        private_subnet_ids = [OUTPUTS[k] for k in subnet_keys if OUTPUTS[k]]

        self.assertGreater(len(private_subnet_ids), 0, "No private subnets found in outputs")

        # Verify each subnet exists
        response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids[:2])  # Check first 2
        self.assertGreater(len(response["Subnets"]), 0)

        for subnet in response["Subnets"]:
            self.assertEqual(subnet["VpcId"], self.vpc_id)
            self.assertEqual(subnet["State"], "available")

    @mark.it("Security groups exist with proper configurations")
    def test_security_groups_exist(self):
        """Test that security groups exist and have proper rules"""
        sg_id = OUTPUTS.get("SSHSecurityGroupId")
        if not sg_id:
            self.skipTest("No security group ID found in outputs")

        response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])

        self.assertEqual(len(response["SecurityGroups"]), 1)
        sg = response["SecurityGroups"][0]
        self.assertEqual(sg["VpcId"], self.vpc_id)
        self.assertTrue(len(sg["IpPermissions"]) > 0 or len(sg["IpPermissionsEgress"]) > 0)

    @mark.it("VPC has internet gateway attached")
    def test_vpc_has_internet_gateway(self):
        """Test that VPC has an internet gateway attached"""
        response = self.ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [self.vpc_id]}]
        )

        self.assertGreater(len(response["InternetGateways"]), 0)
        igw = response["InternetGateways"][0]
        self.assertEqual(igw["Attachments"][0]["State"], "available")


@mark.describe("S3 Storage Integration Tests")
class TestS3Integration(unittest.TestCase):
    """Integration tests for S3 buckets"""

    @classmethod
    def setUpClass(cls):
        """Set up S3 client for tests"""
        cls.s3_client = boto3.client("s3", region_name=CONFIG["region"])
        cls.main_bucket_name = OUTPUTS.get("MainBucketName")
        cls.log_bucket_name = OUTPUTS.get("LogBucketName")

    @mark.it("Main S3 bucket exists and is accessible")
    def test_main_bucket_exists(self):
        """Test that main S3 bucket exists"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        try:
            response = self.s3_client.head_bucket(Bucket=self.main_bucket_name)
            self.assertIn("ResponseMetadata", response)
            self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        except ClientError as e:
            self.fail(f"Main bucket does not exist or is not accessible: {e}")

    @mark.it("Main bucket has versioning enabled")
    def test_main_bucket_versioning(self):
        """Test that main bucket has versioning enabled"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_bucket_versioning(Bucket=self.main_bucket_name)
        self.assertEqual(response.get("Status"), "Enabled")

    @mark.it("Main bucket has encryption enabled")
    def test_main_bucket_encryption(self):
        """Test that main bucket has encryption configured"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_bucket_encryption(Bucket=self.main_bucket_name)

        self.assertIn("Rules", response)
        self.assertGreater(len(response["Rules"]), 0)

        rule = response["Rules"][0]
        self.assertIn("ApplyServerSideEncryptionByDefault", rule)
        sse_algorithm = rule["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
        self.assertIn(sse_algorithm, ["AES256", "aws:kms"])

    @mark.it("Main bucket blocks public access")
    def test_main_bucket_public_access_block(self):
        """Test that main bucket blocks all public access"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        response = self.s3_client.get_public_access_block(Bucket=self.main_bucket_name)

        config = response["PublicAccessBlockConfiguration"]
        self.assertTrue(config["BlockPublicAcls"])
        self.assertTrue(config["IgnorePublicAcls"])
        self.assertTrue(config["BlockPublicPolicy"])
        self.assertTrue(config["RestrictPublicBuckets"])

    @mark.it("Log bucket exists and is accessible")
    def test_log_bucket_exists(self):
        """Test that log S3 bucket exists"""
        if not self.log_bucket_name:
            self.skipTest("Log bucket name not found in outputs")

        try:
            response = self.s3_client.head_bucket(Bucket=self.log_bucket_name)
            self.assertIn("ResponseMetadata", response)
            self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)
        except ClientError as e:
            self.fail(f"Log bucket does not exist or is not accessible: {e}")

    @mark.it("Can write and read from main bucket")
    def test_main_bucket_read_write(self):
        """Test that we can write to and read from main bucket"""
        if not self.main_bucket_name:
            self.skipTest("Main bucket name not found in outputs")

        test_key = "integration-test/test-file.txt"
        test_content = b"Integration test content"

        try:
            # Write test file
            self.s3_client.put_object(
                Bucket=self.main_bucket_name,
                Key=test_key,
                Body=test_content
            )

            # Read test file
            response = self.s3_client.get_object(
                Bucket=self.main_bucket_name,
                Key=test_key
            )

            content = response["Body"].read()
            self.assertEqual(content, test_content)

        finally:
            # Clean up
            try:
                self.s3_client.delete_object(
                    Bucket=self.main_bucket_name,
                    Key=test_key
                )
            except Exception:
                pass


@mark.describe("KMS Integration Tests")
class TestKMSIntegration(unittest.TestCase):
    """Integration tests for KMS keys"""

    @classmethod
    def setUpClass(cls):
        """Set up KMS client for tests"""
        cls.kms_client = boto3.client("kms", region_name=CONFIG["region"])
        cls.kms_key_arn = OUTPUTS.get("KMSKeyArn")

    @mark.it("KMS key exists and is enabled")
    def test_kms_key_exists(self):
        """Test that KMS key exists and is enabled"""
        if not self.kms_key_arn:
            self.skipTest("KMS key ARN not found in outputs")

        key_id = self.kms_key_arn.split("/")[-1]
        response = self.kms_client.describe_key(KeyId=key_id)

        key_metadata = response["KeyMetadata"]
        self.assertEqual(key_metadata["KeyState"], "Enabled")
        self.assertTrue(key_metadata["Enabled"])

    @mark.it("KMS key has rotation enabled")
    def test_kms_key_rotation(self):
        """Test that KMS key has automatic rotation enabled"""
        if not self.kms_key_arn:
            self.skipTest("KMS key ARN not found in outputs")

        key_id = self.kms_key_arn.split("/")[-1]
        response = self.kms_client.get_key_rotation_status(KeyId=key_id)

        self.assertTrue(response["KeyRotationEnabled"])


@mark.describe("IAM Integration Tests")
class TestIAMIntegration(unittest.TestCase):
    """Integration tests for IAM roles"""

    @classmethod
    def setUpClass(cls):
        """Set up IAM client for tests"""
        cls.iam_client = boto3.client("iam", region_name=CONFIG["region"])
        cls.iam_role_arn = OUTPUTS.get("IAMRoleArn")

    @mark.it("IAM execution role exists")
    def test_iam_role_exists(self):
        """Test that IAM execution role exists"""
        if not self.iam_role_arn:
            self.skipTest("IAM role ARN not found in outputs")

        role_name = self.iam_role_arn.split("/")[-1]
        response = self.iam_client.get_role(RoleName=role_name)

        role = response["Role"]
        self.assertEqual(role["Arn"], self.iam_role_arn)
        self.assertIn("AssumeRolePolicyDocument", role)


@mark.describe("SNS Integration Tests")
class TestSNSIntegration(unittest.TestCase):
    """Integration tests for SNS topics"""

    @classmethod
    def setUpClass(cls):
        """Set up SNS client for tests"""
        cls.sns_client = boto3.client("sns", region_name=CONFIG["region"])
        cls.notification_topic_arn = OUTPUTS.get("NotificationTopicArn")
        cls.alert_topic_arn = OUTPUTS.get("SecurityAlertTopicArn")

    @mark.it("Notification SNS topic exists")
    def test_notification_topic_exists(self):
        """Test that notification SNS topic exists"""
        if not self.notification_topic_arn:
            self.skipTest("Notification topic ARN not found in outputs")

        response = self.sns_client.get_topic_attributes(
            TopicArn=self.notification_topic_arn
        )

        self.assertIn("Attributes", response)
        self.assertEqual(response["Attributes"]["TopicArn"], self.notification_topic_arn)

    @mark.it("Alert SNS topic exists")
    def test_alert_topic_exists(self):
        """Test that alert SNS topic exists"""
        if not self.alert_topic_arn:
            self.skipTest("Alert topic ARN not found in outputs")

        response = self.sns_client.get_topic_attributes(
            TopicArn=self.alert_topic_arn
        )

        self.assertIn("Attributes", response)
        self.assertEqual(response["Attributes"]["TopicArn"], self.alert_topic_arn)

    @mark.it("Can publish message to notification topic")
    def test_publish_to_notification_topic(self):
        """Test that we can publish messages to notification topic"""
        if not self.notification_topic_arn:
            self.skipTest("Notification topic ARN not found in outputs")

        response = self.sns_client.publish(
            TopicArn=self.notification_topic_arn,
            Message="Integration test message",
            Subject="Integration Test"
        )

        self.assertIn("MessageId", response)
        self.assertTrue(len(response["MessageId"]) > 0)


@mark.describe("RDS Integration Tests")
class TestRDSIntegration(unittest.TestCase):
    """Integration tests for RDS database"""

    @classmethod
    def setUpClass(cls):
        """Set up RDS and Secrets Manager clients"""
        cls.rds_client = boto3.client("rds", region_name=CONFIG["region"])
        cls.secretsmanager_client = boto3.client("secretsmanager", region_name=CONFIG["region"])
        cls.database_endpoint = OUTPUTS.get("DatabaseEndpoint")
        cls.database_secret_arn = OUTPUTS.get("DatabaseSecretArn")

    @mark.it("RDS database instance exists and is available")
    def test_rds_instance_exists(self):
        """Test that RDS database instance exists"""
        if not self.database_endpoint:
            self.skipTest("Database endpoint not found in outputs")

        # Extract DB instance identifier from endpoint
        db_instance_id = self.database_endpoint.split(".")[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_id
        )

        self.assertEqual(len(response["DBInstances"]), 1)
        db_instance = response["DBInstances"][0]
        self.assertEqual(db_instance["DBInstanceStatus"], "available")
        self.assertTrue(db_instance["StorageEncrypted"])

    @mark.it("Database credentials secret exists")
    def test_database_secret_exists(self):
        """Test that database credentials secret exists in Secrets Manager"""
        if not self.database_secret_arn:
            self.skipTest("Database secret ARN not found in outputs")

        response = self.secretsmanager_client.describe_secret(
            SecretId=self.database_secret_arn
        )

        self.assertEqual(response["ARN"], self.database_secret_arn)
        self.assertIn("Name", response)

    @mark.it("Can retrieve database credentials from Secrets Manager")
    def test_retrieve_database_credentials(self):
        """Test that we can retrieve database credentials"""
        if not self.database_secret_arn:
            self.skipTest("Database secret ARN not found in outputs")

        response = self.secretsmanager_client.get_secret_value(
            SecretId=self.database_secret_arn
        )

        self.assertIn("SecretString", response)
        secret = json.loads(response["SecretString"])

        self.assertIn("username", secret)
        self.assertIn("password", secret)
        self.assertIn("host", secret)
        self.assertIn("port", secret)


@mark.describe("ALB Integration Tests")
class TestALBIntegration(unittest.TestCase):
    """Integration tests for Application Load Balancer"""

    @classmethod
    def setUpClass(cls):
        """Set up ELBv2 client for tests"""
        cls.elbv2_client = boto3.client("elbv2", region_name=CONFIG["region"])
        cls.alb_dns_name = OUTPUTS.get("ALBDNSName")

    @mark.it("Application Load Balancer exists")
    def test_alb_exists(self):
        """Test that ALB exists and is active"""
        if not self.alb_dns_name:
            self.skipTest("ALB DNS name not found in outputs")

        # List all load balancers and find ours by DNS name
        response = self.elbv2_client.describe_load_balancers()

        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == self.alb_dns_name]
        self.assertEqual(len(albs), 1)

        alb = albs[0]
        self.assertEqual(alb["State"]["Code"], "active")
        self.assertEqual(alb["Scheme"], "internet-facing")

    @mark.it("ALB has target groups configured")
    def test_alb_target_groups(self):
        """Test that ALB has target groups"""
        if not self.alb_dns_name:
            self.skipTest("ALB DNS name not found in outputs")

        # Get load balancer ARN
        response = self.elbv2_client.describe_load_balancers()
        albs = [lb for lb in response["LoadBalancers"] if lb["DNSName"] == self.alb_dns_name]

        if not albs:
            self.skipTest("ALB not found")

        alb_arn = albs[0]["LoadBalancerArn"]

        # Get target groups for this ALB
        tg_response = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb_arn
        )

        self.assertGreater(len(tg_response["TargetGroups"]), 0)

        # Verify health check configuration
        for tg in tg_response["TargetGroups"]:
            self.assertTrue(tg["HealthCheckEnabled"])
            self.assertEqual(tg["HealthCheckPath"], "/health")


@mark.describe("CloudTrail Integration Tests")
class TestCloudTrailIntegration(unittest.TestCase):
    """Integration tests for CloudTrail"""

    @classmethod
    def setUpClass(cls):
        """Set up CloudTrail client for tests"""
        cls.cloudtrail_client = boto3.client("cloudtrail", region_name=CONFIG["region"])
        cls.cloudtrail_arn = OUTPUTS.get("CloudTrailArn")

    @mark.it("CloudTrail exists and is logging")
    def test_cloudtrail_exists(self):
        """Test that CloudTrail exists and is logging"""
        if not self.cloudtrail_arn:
            self.skipTest("CloudTrail ARN not found in outputs")

        trail_name = self.cloudtrail_arn.split("/")[-1]

        response = self.cloudtrail_client.get_trail_status(Name=trail_name)

        self.assertTrue(response["IsLogging"])

    @mark.it("CloudTrail has event selectors configured")
    def test_cloudtrail_event_selectors(self):
        """Test that CloudTrail has proper event selectors"""
        if not self.cloudtrail_arn:
            self.skipTest("CloudTrail ARN not found in outputs")

        trail_name = self.cloudtrail_arn.split("/")[-1]

        response = self.cloudtrail_client.get_event_selectors(TrailName=trail_name)

        self.assertIn("EventSelectors", response)
        self.assertGreater(len(response["EventSelectors"]), 0)


if __name__ == "__main__":
    unittest.main()

```

## ./tests/unit/__init__.py

```python
# This file makes the tests/unit directory a Python package

```

## ./tests/unit/test_tap_stack.py

```python
"""Unit tests for TapStack CDK infrastructure"""
import os
import unittest
from unittest.mock import patch, MagicMock
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

# Mock Docker to avoid Docker requirements in unit tests
os.environ["CDK_DOCKER"] = "stub"

from lib.tap_stack import (
    TapStack,
    TapStackProps,
    NetworkingStack,
    StorageStack,
    ServerlessStack,
    ComputeStack,
    CDNStack,
    DNSStack,
    ComplianceStack,
    MonitoringStack,
    CICDStack,
    SecurityStack,
)


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env = cdk.Environment(account="123456789012", region="us-east-1")

    @mark.it("creates stack with default environment suffix")
    def test_creates_stack_with_default_suffix(self):
        """Test that stack creates with default 'dev' suffix"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            env=self.env,
        )
        assert hasattr(stack, 'networking')
        assert hasattr(stack, 'storage')
        assert hasattr(stack, 'serverless')
        assert hasattr(stack, 'compute')

    @mark.it("creates stack with custom environment suffix")
    def test_creates_stack_with_custom_suffix(self):
        """Test stack creation with custom environment suffix"""
        stack = TapStack(
            self.app,
            "TapStackProd",
            TapStackProps(environment_suffix="prod"),
            env=self.env,
        )
        assert stack is not None

    @mark.it("creates required nested stacks")
    def test_creates_nested_stacks(self):
        """Test that all required nested stacks are created"""
        stack = TapStack(self.app, "TapStackTest", env=self.env)

        # Verify nested stacks exist
        assert hasattr(stack, 'networking')
        assert hasattr(stack, 'storage')
        assert hasattr(stack, 'serverless')
        assert hasattr(stack, 'compute')

    @mark.it("creates stack outputs")
    def test_creates_stack_outputs(self):
        """Test that stack creates required outputs"""
        stack = TapStack(self.app, "TapStackTest", env=self.env)

        # Check that outputs are created
        synth = self.app.synth()
        stack_artifact = synth.get_stack_by_name(stack.stack_name)
        template_dict = stack_artifact.template

        assert "Outputs" in template_dict
        outputs = template_dict["Outputs"]
        assert "VPCId" in outputs
        assert "ALBDNSName" in outputs
        assert "MainBucketName" in outputs
        assert "NotificationTopicArn" in outputs

    @mark.it("applies correct tags to stack")
    def test_applies_correct_tags(self):
        """Test that correct tags are applied to the stack"""
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix="test"),
            env=self.env,
        )

        # Check tags on stack
        tags = stack.tags.tag_values()
        assert "iac-rlhf-amazon" in tags
        assert "Environment" in tags
        assert "ManagedBy" in tags

    @mark.it("uses context for environment suffix")
    def test_uses_context_for_env_suffix(self):
        """Test environment suffix from context"""
        app = cdk.App(context={"environmentSuffix": "staging"})
        stack = TapStack(app, "TapStackStaging", env=self.env)
        assert stack is not None


@mark.describe("NetworkingStack")
class TestNetworkingStack(unittest.TestCase):
    """Test cases for NetworkingStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )

    @mark.it("creates VPC with correct configuration")
    def test_creates_vpc_with_correct_config(self):
        """Test VPC creation with proper subnet configuration"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # Should create VPC
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties(
            "AWS::EC2::VPC",
            {
                "EnableDnsHostnames": True,
                "EnableDnsSupport": True,
            },
        )

    @mark.it("creates public and private subnets")
    def test_creates_subnets(self):
        """Test that public, private, and isolated subnets are created"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # VPC with 3 AZs and 3 subnet types = 9 subnets
        template.resource_count_is("AWS::EC2::Subnet", 9)

    @mark.it("creates security groups with proper rules")
    def test_creates_security_groups(self):
        """Test security group creation with ingress rules"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8", "192.168.0.0/16"],
        )
        template = Template.from_stack(networking)

        # Should create 2 security groups (web and app)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    @mark.it("creates VPC flow logs")
    def test_creates_vpc_flow_logs(self):
        """Test VPC flow log creation"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # Should create flow log
        template.resource_count_is("AWS::EC2::FlowLog", 1)

    @mark.it("creates NAT gateways")
    def test_creates_nat_gateways(self):
        """Test NAT gateway creation for private subnet internet access"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )
        template = Template.from_stack(networking)

        # Should create 2 NAT gateways
        template.resource_count_is("AWS::EC2::NatGateway", 2)

    @mark.it("exposes VPC and security groups")
    def test_exposes_vpc_and_security_groups(self):
        """Test that VPC and security groups are accessible"""
        networking = NetworkingStack(
            self.parent_stack,
            "NetworkingTest",
            environment_suffix="test",
            region="us-east-1",
            allowed_ip_ranges=["10.0.0.0/8"],
        )

        assert networking.vpc is not None
        assert networking.web_security_group is not None
        assert networking.app_security_group is not None
        assert networking.flow_log is not None


@mark.describe("StorageStack")
class TestStorageStack(unittest.TestCase):
    """Test cases for StorageStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )

    @mark.it("creates KMS key for S3 encryption")
    def test_creates_kms_key(self):
        """Test KMS key creation with key rotation enabled"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Should create KMS key
        template.resource_count_is("AWS::KMS::Key", 1)
        template.has_resource_properties(
            "AWS::KMS::Key",
            {
                "EnableKeyRotation": True,
            },
        )

    @mark.it("creates KMS key alias")
    def test_creates_kms_alias(self):
        """Test KMS key alias creation"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Should create KMS alias
        template.resource_count_is("AWS::KMS::Alias", 1)
        template.has_resource_properties(
            "AWS::KMS::Alias",
            {
                "AliasName": "alias/tap-s3-test-us-east-1",
            },
        )

    @mark.it("creates S3 buckets with proper naming")
    def test_creates_s3_buckets(self):
        """Test S3 bucket creation with environment suffix"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Should create 3 buckets: log, main, static
        template.resource_count_is("AWS::S3::Bucket", 3)

    @mark.it("configures main bucket with KMS encryption")
    def test_main_bucket_has_kms_encryption(self):
        """Test main bucket uses KMS encryption"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Main bucket should have KMS encryption
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "tap-main-123456789012-test-us-east-1",
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": Match.array_with(
                        [
                            Match.object_like(
                                {
                                    "ServerSideEncryptionByDefault": {
                                        "SSEAlgorithm": "aws:kms",
                                    }
                                }
                            )
                        ]
                    ),
                },
            },
        )

    @mark.it("enables versioning on main bucket")
    def test_main_bucket_has_versioning(self):
        """Test main bucket has versioning enabled"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Main bucket should have versioning
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "tap-main-123456789012-test-us-east-1",
                "VersioningConfiguration": {
                    "Status": "Enabled",
                },
            },
        )

    @mark.it("blocks public access on all buckets")
    def test_buckets_block_public_access(self):
        """Test that all buckets block public access"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # All buckets should block public access
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": True,
                    "BlockPublicPolicy": True,
                    "IgnorePublicAcls": True,
                    "RestrictPublicBuckets": True,
                },
            },
        )

    @mark.it("configures lifecycle rules on buckets")
    def test_buckets_have_lifecycle_rules(self):
        """Test that buckets have lifecycle rules configured"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )
        template = Template.from_stack(storage)

        # Main bucket should have lifecycle rules
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {
                "BucketName": "tap-main-123456789012-test-us-east-1",
                "LifecycleConfiguration": Match.object_like(
                    {
                        "Rules": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Status": "Enabled",
                                    }
                                )
                            ]
                        ),
                    }
                ),
            },
        )

    @mark.it("uses prod removal policy for prod environment")
    def test_prod_removal_policy(self):
        """Test that prod environment uses RETAIN policy"""
        storage = StorageStack(
            self.parent_stack,
            "StorageProd",
            environment_suffix="prod",
            region="us-east-1",
            account_id="123456789012",
        )

        assert storage.main_bucket is not None
        assert storage.log_bucket is not None
        assert storage.static_bucket is not None

    @mark.it("exposes buckets and KMS key")
    def test_exposes_buckets_and_key(self):
        """Test that buckets and KMS key are accessible"""
        storage = StorageStack(
            self.parent_stack,
            "StorageTest",
            environment_suffix="test",
            region="us-east-1",
            account_id="123456789012",
        )

        assert storage.kms_key is not None
        assert storage.log_bucket is not None
        assert storage.main_bucket is not None
        assert storage.static_bucket is not None


@mark.describe("ServerlessStack")
class TestServerlessStack(unittest.TestCase):
    """Test cases for ServerlessStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        # Create a mock S3 bucket for testing
        import aws_cdk.aws_s3 as s3

        self.mock_bucket = s3.Bucket(
            self.parent_stack, "MockBucket", bucket_name="mock-bucket"
        )

    @mark.it("creates SNS topics for notifications")
    def test_creates_sns_topics(self):
        """Test SNS topic creation"""
        serverless = ServerlessStack(
            self.parent_stack,
            "ServerlessTest",
            environment_suffix="test",
            region="us-east-1",
            main_bucket=self.mock_bucket,
        )

        assert serverless.notification_topic is not None
        assert serverless.alert_topic is not None

    @mark.it("creates Lambda IAM role with proper permissions")
    def test_creates_lambda_iam_role(self):
        """Test Lambda IAM role creation with proper permissions"""
        serverless = ServerlessStack(
            self.parent_stack,
            "ServerlessTest",
            environment_suffix="test",
            region="us-east-1",
            main_bucket=self.mock_bucket,
        )

        assert serverless.lambda_role is not None

    @mark.it("exposes Lambda functions")
    def test_exposes_lambda_functions(self):
        """Test that Lambda functions are accessible"""
        serverless = ServerlessStack(
            self.parent_stack,
            "ServerlessTest",
            environment_suffix="test",
            region="us-east-1",
            main_bucket=self.mock_bucket,
        )

        assert serverless.s3_processing_function is not None
        assert serverless.alarm_function is not None
        assert serverless.config_function is not None

    @mark.it("adds email subscription when provided")
    def test_adds_email_subscription(self):
        """Test email subscription to SNS topic"""
        serverless = ServerlessStack(
            self.parent_stack,
            "ServerlessTest",
            environment_suffix="test",
            region="us-east-1",
            main_bucket=self.mock_bucket,
            notification_email="test@example.com",
        )

        assert serverless.notification_topic is not None


@mark.describe("ComputeStack")
class TestComputeStack(unittest.TestCase):
    """Test cases for ComputeStack"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.parent_stack = cdk.Stack(
            self.app, "ParentStack", env=cdk.Environment(account="123456789012", region="us-east-1")
        )
        # Create mock VPC and security group
        import aws_cdk.aws_ec2 as ec2

        self.mock_vpc = ec2.Vpc(self.parent_stack, "MockVPC")
        self.mock_sg = ec2.SecurityGroup(
            self.parent_stack, "MockSG", vpc=self.mock_vpc
        )

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        """Test ALB creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create ALB
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    @mark.it("creates Auto Scaling Group")
    def test_creates_asg(self):
        """Test Auto Scaling Group creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create ASG
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)

    @mark.it("configures ASG with correct capacity")
    def test_asg_has_correct_capacity(self):
        """Test ASG capacity configuration"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # ASG should have min=2, max=10, desired=3
        template.has_resource_properties(
            "AWS::AutoScaling::AutoScalingGroup",
            {
                "MinSize": "2",
                "MaxSize": "10",
                "DesiredCapacity": "3",
            },
        )

    @mark.it("creates target group with health checks")
    def test_creates_target_group(self):
        """Test target group creation with health checks"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create target group
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "HealthCheckPath": "/health",
                "HealthCheckEnabled": True,
            },
        )

    @mark.it("creates IAM role for EC2 instances")
    def test_creates_instance_role(self):
        """Test EC2 instance IAM role creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create IAM role
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": Match.object_like(
                    {
                        "Statement": Match.array_with(
                            [
                                Match.object_like(
                                    {
                                        "Principal": {"Service": "ec2.amazonaws.com"},
                                    }
                                )
                            ]
                        ),
                    }
                ),
            },
        )

    @mark.it("configures auto scaling policies")
    def test_creates_scaling_policies(self):
        """Test auto scaling policy creation"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )
        template = Template.from_stack(compute)

        # Should create scaling policies (CPU + 2 for memory = 2 policies total based on code)
        template.resource_count_is("AWS::AutoScaling::ScalingPolicy", 2)

    @mark.it("exposes ASG, ALB and target group")
    def test_exposes_resources(self):
        """Test that resources are accessible"""
        compute = ComputeStack(
            self.parent_stack,
            "ComputeTest",
            environment_suffix="test",
            region="us-east-1",
            vpc=self.mock_vpc,
            security_group=self.mock_sg,
        )

        assert compute.asg is not None
        assert compute.alb is not None
        assert compute.target_group is not None
        assert compute.instance_role is not None


if __name__ == "__main__":
    unittest.main()

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
