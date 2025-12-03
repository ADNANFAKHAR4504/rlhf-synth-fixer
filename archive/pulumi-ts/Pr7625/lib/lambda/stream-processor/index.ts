import { DynamoDBStreamEvent } from 'aws-lambda';

export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing DynamoDB stream events:', event.Records.length);

  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const newImage = record.dynamodb?.NewImage;

      if (newImage) {
        console.log('New violation detected:', {
          resourceId: newImage.resourceId?.S,
          violationType: newImage.violationType?.S,
          severity: newImage.severity?.S,
        });

        // You could add notifications here (SNS, Slack, etc.)
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ processed: event.Records.length }),
  };
};
