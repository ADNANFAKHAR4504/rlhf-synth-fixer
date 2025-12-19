// eslint-disable-next-line import/no-extraneous-dependencies
import { Context, SNSEvent } from 'aws-lambda';
import axios from 'axios';

interface SlackMessage {
  username: string;
  icon_emoji: string;
  attachments: Array<{
    color: string;
    title: string;
    text: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
    footer: string;
    ts: number;
  }>;
}

export const handler = async (
  event: SNSEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: Context
): Promise<void> => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  const environment = process.env.ENVIRONMENT || 'unknown';
  const company = process.env.COMPANY || 'unknown';
  const division = process.env.DIVISION || 'unknown';

  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return;
  }

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.Sns.Message);
      const subject = record.Sns.Subject || 'Pipeline Notification';

      // Parse the message based on type
      let slackMessage: SlackMessage;

      if (message.approval) {
        slackMessage = createApprovalMessage(
          message,
          environment,
          company,
          division
        );
      } else if (message.alarm) {
        slackMessage = createAlarmMessage(message, environment);
      } else {
        slackMessage = createGenericMessage(
          subject,
          message,
          environment,
          company,
          division
        );
      }

      // Send to Slack
      await axios.post(webhookUrl, slackMessage);
      console.log('Notification sent to Slack successfully');
    } catch (error) {
      console.error('Error processing SNS message:', error);
      throw error;
    }
  }
};

function createApprovalMessage(
  message: any,
  environment: string,
  company: string,
  division: string
): SlackMessage {
  return {
    username: 'AWS Pipeline Bot',
    icon_emoji: ':rocket:',
    attachments: [
      {
        color: 'warning',
        title: ':hourglass_flowing_sand: Manual Approval Required',
        text: `Pipeline is waiting for manual approval to deploy to ${environment}`,
        fields: [
          {
            title: 'Pipeline',
            value: `${company}-${division}-${environment}`,
            short: true,
          },
          {
            title: 'Stage',
            value: 'Deployment',
            short: true,
          },
          {
            title: 'Action Required',
            value: 'Please review and approve the deployment',
            short: false,
          },
        ],
        footer: 'AWS CodePipeline',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

function createAlarmMessage(message: any, environment: string): SlackMessage {
  return {
    username: 'AWS Pipeline Bot',
    icon_emoji: ':rotating_light:',
    attachments: [
      {
        color: 'danger',
        title: ':x: Pipeline Alarm Triggered',
        text: message.AlarmDescription || 'A pipeline alarm has been triggered',
        fields: [
          {
            title: 'Alarm Name',
            value: message.AlarmName || 'Unknown',
            short: true,
          },
          {
            title: 'Environment',
            value: environment,
            short: true,
          },
          {
            title: 'State',
            value: message.NewStateValue || 'ALARM',
            short: true,
          },
          {
            title: 'Reason',
            value: message.NewStateReason || 'Threshold exceeded',
            short: false,
          },
        ],
        footer: 'AWS CloudWatch',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

function createGenericMessage(
  subject: string,
  message: any,
  environment: string,
  company: string,
  division: string
): SlackMessage {
  return {
    username: 'AWS Pipeline Bot',
    icon_emoji: ':information_source:',
    attachments: [
      {
        color: 'good',
        title: subject,
        text: JSON.stringify(message, null, 2),
        fields: [
          {
            title: 'Environment',
            value: environment,
            short: true,
          },
          {
            title: 'Pipeline',
            value: `${company}-${division}`,
            short: true,
          },
        ],
        footer: 'AWS',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}
