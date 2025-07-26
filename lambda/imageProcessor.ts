import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface ImageRequest {
  imageKey: string;
  metadata: Record<string, string>;
}

const snsClient = new SNSClient({});
const TOPIC_ARN = process.env.NOTIFICATION_TOPIC_ARN || '';

export const handler = async (event: ImageRequest): Promise<void> => {
  try {
    const { imageKey, metadata } = event;

    // Simulate image processing
    console.log(`Processing image: ${imageKey} with metadata:`, metadata);

    // Publish success notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: TOPIC_ARN,
        Message: `Successfully processed image: ${imageKey}`,
      })
    );
  } catch (error) {
    console.error('Processing failed:', error);
  }
};
