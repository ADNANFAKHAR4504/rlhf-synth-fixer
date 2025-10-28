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
