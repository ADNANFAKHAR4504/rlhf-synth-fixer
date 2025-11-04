// AWS SDK v3 modular imports
const { HealthClient, DescribeEventDetailsCommand, DescribeAffectedEntitiesCommand } = require('@aws-sdk/client-health');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// Input validation
if (!process.env.SNS_TOPIC_ARN) {
  throw new Error('SNS_TOPIC_ARN environment variable is required');
}

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Initialize AWS SDK v3 clients
// Health API only available in us-east-1
const healthClient = new HealthClient({ region: 'us-east-1' });
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  console.log('Processing AWS Health event:', JSON.stringify(event, null, 2));

  try {
    // Validate event structure
    if (!event || !event.detail || !event.detail.eventArn) {
      console.warn('Invalid event structure - no eventArn to process');
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid event structure',
        }),
      };
    }

    const eventArn = event.detail.eventArn;

    // Get event details
    const eventDetailsResponse = await healthClient.send(new DescribeEventDetailsCommand({
      eventArns: [eventArn],
    }));

    // Validate response
    if (!eventDetailsResponse.successfulSet || eventDetailsResponse.successfulSet.length === 0) {
      console.warn('No event details found');
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: 'Event details not found',
        }),
      };
    }

    const eventDetail = eventDetailsResponse.successfulSet[0];

    // Get affected entities with pagination
    const allEntities = [];
    let nextToken;
    do {
      const affectedEntitiesResponse = await healthClient.send(new DescribeAffectedEntitiesCommand({
        filter: {
          eventArns: [eventArn],
        },
        nextToken: nextToken,
      }));

      if (affectedEntitiesResponse.entities) {
        allEntities.push(...affectedEntitiesResponse.entities);
      }

      nextToken = affectedEntitiesResponse.nextToken;
    } while (nextToken);

    // Send notification
    await snsClient.send(new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: `AWS Health Alert: ${eventDetail.event.eventTypeCategory}`,
      Message: `AWS Health Event Detected:\n\n` +
        `Event: ${eventDetail.event.eventTypeCode}\n` +
        `Category: ${eventDetail.event.eventTypeCategory}\n` +
        `Region: ${eventDetail.event.region}\n` +
        `Start Time: ${eventDetail.event.startTime}\n` +
        `Status: ${eventDetail.event.statusCode}\n\n` +
        `Description:\n${eventDetail.eventDescription.latestDescription}\n\n` +
        `Affected Resources: ${allEntities.length}`,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Health event processed',
      }),
    };
  } catch (error) {
    console.error('Error processing health event:', error);
    throw error;
  }
};
