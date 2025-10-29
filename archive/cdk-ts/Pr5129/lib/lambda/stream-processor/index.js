const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqsClient = new SQSClient({});

exports.handler = async function (event) {
  console.log('Stream processor received event:', JSON.stringify(event));
  const queueUrl = process.env.QUEUE_URL;
  if (!queueUrl) {
    console.error('QUEUE_URL not configured');
    return;
  }

  for (const record of event.Records || []) {
    try {
      const body = JSON.stringify({ event: record });
      await sqsClient.send(new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: body }));
    } catch (err) {
      console.error('Failed to send message to SQS', err);
    }
  }
};
