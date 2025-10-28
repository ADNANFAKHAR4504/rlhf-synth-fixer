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
