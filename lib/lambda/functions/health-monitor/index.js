const AWS = require('aws-sdk');
const health = new AWS.Health({ region: 'us-east-1' }); // Health API only available in us-east-1
const sns = new AWS.SNS();

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Processing AWS Health event:', JSON.stringify(event, null, 2));

  try {
    const eventArn = event.detail.eventArn;

    // Get event details
    const eventDetails = await health.describeEventDetails({
      eventArns: [eventArn],
    }).promise();

    const eventDetail = eventDetails.successfulSet[0];

    // Get affected entities
    const affectedEntities = await health.describeAffectedEntities({
      filter: {
        eventArns: [eventArn],
      },
    }).promise();

    // Send notification
    await sns.publish({
      TopicArn: SNS_TOPIC_ARN,
      Subject: `AWS Health Alert: ${eventDetail.event.eventTypeCategory}`,
      Message: `AWS Health Event Detected:\n\n` +
        `Event: ${eventDetail.event.eventTypeCode}\n` +
        `Category: ${eventDetail.event.eventTypeCategory}\n` +
        `Region: ${eventDetail.event.region}\n` +
        `Start Time: ${eventDetail.event.startTime}\n` +
        `Status: ${eventDetail.event.statusCode}\n\n` +
        `Description:\n${eventDetail.eventDescription.latestDescription}\n\n` +
        `Affected Resources: ${affectedEntities.entities.length}`,
    }).promise();

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
