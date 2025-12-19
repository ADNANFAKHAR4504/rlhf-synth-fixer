import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { Handler } from 'aws-lambda';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.AWS_ENDPOINT_URL && {
    endpoint: process.env.AWS_ENDPOINT_URL,
  }),
});

interface ImageProcessingEvent {
  imageKey: string;
  metadata?: {
    timestamp?: string;
    userId?: string;
    operation?: string;
  };
}

export const handler: Handler = async event => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Parse the incoming request - handle both API Gateway proxy and direct invocation
    let parsedBody: ImageProcessingEvent;

    if (event.body) {
      // API Gateway proxy integration
      parsedBody =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else if (event.imageKey !== undefined) {
      // Direct invocation
      parsedBody = event as ImageProcessingEvent;
    } else {
      // Invalid format
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid request format',
        }),
      };
    }

    const { imageKey, metadata } = parsedBody;

    if (!imageKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing required field: imageKey',
        }),
      };
    }

    const bucketName = process.env.IMAGE_BUCKET;
    const topicArn = process.env.NOTIFICATION_TOPIC_ARN;

    console.log(`Processing image: ${imageKey} from bucket: ${bucketName}`);

    // Simulate image processing
    const processingResult = {
      imageKey,
      bucket: bucketName,
      status: 'processed',
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    };

    // Publish notification to SNS
    if (topicArn) {
      const publishCommand = new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(processingResult),
        Subject: 'Image Processing Complete',
      });

      await snsClient.send(publishCommand);
      console.log(`Notification sent to SNS topic: ${topicArn}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Image processing initiated successfully',
        result: processingResult,
      }),
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
