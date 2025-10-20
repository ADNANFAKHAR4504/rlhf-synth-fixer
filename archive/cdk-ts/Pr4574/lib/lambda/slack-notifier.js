const https = require('https');
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Get Slack webhook URL from Secrets Manager
    const secret = await secretsManager
      .getSecretValue({
        SecretId: process.env.WEBHOOK_SECRET_ARN,
      })
      .promise();

    const webhookUrl = JSON.parse(secret.SecretString).webhookUrl;
    if (!webhookUrl) {
      console.log('No Slack webhook URL configured');
      return { statusCode: 200, body: 'No webhook configured' };
    }

    const message = JSON.parse(event.Records[0].Sns.Message);

    const slackMessage = {
      text: 'Pipeline Notification',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Pipeline Status Update*\n${
              message.detail || message.Message || 'Pipeline event occurred'
            }`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Environment: ${process.env.ENVIRONMENT}`,
            },
            {
              type: 'mrkdwn',
              text: `Region: ${process.env.DEPLOYMENT_REGION || process.env.AWS_REGION}`,
            },
          ],
        },
      ],
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    return new Promise((resolve, reject) => {
      const url = new URL(webhookUrl);
      const req = https.request(url, options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        resolve({ statusCode: res.statusCode });
      });

      req.on('error', (e) => {
        console.error('Request error:', e);
        reject(e);
      });

      req.write(JSON.stringify(slackMessage));
      req.end();
    });
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
