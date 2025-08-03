import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface ImageRequest {
  imageKey: string;
  metadata: Record<string, string>;
}

interface ApiGatewayResponse {
  statusCode: number;
  body: string;
}

const snsClient = new SNSClient({});
const TOPIC_ARN = process.env.NOTIFICATION_TOPIC_ARN || '';

export const handler = async (
  event: ImageRequest
): Promise<ApiGatewayResponse> => {
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

    // ✅ Return success to API Gateway
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Image processed successfully' }),
    };
  } catch (error) {
    console.error('Processing failed:', error);
    // ❗️Return failure with proper status code
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Processing failed',
        error: (error as Error).message,
      }),
    };
  }
};
