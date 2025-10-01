import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

export const handler = async (event) => {
  const queueUrl = process.env.QUEUE_URL;

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      await sqs.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(record.dynamodb.NewImage),
      }));
    }
  }
};
