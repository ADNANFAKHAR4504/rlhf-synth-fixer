import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({});

interface ComplianceEvent {
  detail: {
    configRuleName: string;
    complianceType: string;
    resourceId: string;
    resourceType: string;
  };
}

export const handler = async (event: ComplianceEvent) => {
  console.log('Received compliance event:', JSON.stringify(event, null, 2));

  try {
    const { configRuleName, complianceType, resourceId, resourceType } =
      event.detail;

    if (complianceType === 'NON_COMPLIANT') {
      // Determine severity based on rule name
      let topicArn: string;
      let severity: string;

      if (
        configRuleName.includes('s3-bucket-encryption') ||
        configRuleName.includes('rds-backup')
      ) {
        topicArn = process.env.CRITICAL_TOPIC_ARN!;
        severity = 'CRITICAL';
      } else if (configRuleName.includes('ec2-instance-type')) {
        topicArn = process.env.MEDIUM_TOPIC_ARN!;
        severity = 'MEDIUM';
      } else {
        topicArn = process.env.LOW_TOPIC_ARN!;
        severity = 'LOW';
      }

      // Generate compliance report
      const report = {
        timestamp: new Date().toISOString(),
        severity: severity,
        ruleName: configRuleName,
        resourceId: resourceId,
        resourceType: resourceType,
        complianceStatus: complianceType,
        environmentSuffix: process.env.ENVIRONMENT_SUFFIX,
      };

      // Send notification
      const message = `
Compliance Violation Detected

Severity: ${severity}
Rule: ${configRuleName}
Resource: ${resourceId} (${resourceType})
Status: ${complianceType}
Environment: ${process.env.ENVIRONMENT_SUFFIX}
Timestamp: ${report.timestamp}

Please review and remediate this compliance violation.
      `;

      await snsClient.send(
        new PublishCommand({
          TopicArn: topicArn,
          Subject: `[${severity}] Compliance Violation: ${configRuleName}`,
          Message: message,
        })
      );

      console.log(`Sent ${severity} notification for ${resourceId}`);

      return {
        statusCode: 200,
        body: JSON.stringify(report),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resource is compliant' }),
    };
  } catch (error) {
    console.error('Error processing compliance event:', error);
    throw error;
  }
};
