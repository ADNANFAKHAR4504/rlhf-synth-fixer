// SLA Monitoring Lambda Handler
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Running SLA check:', JSON.stringify(event, null, 2));

  try {
    const slaThresholdMinutes = 60; // 1 hour SLA
    const currentTime = Date.now();
    const slaThresholdTime = currentTime - (slaThresholdMinutes * 60 * 1000);

    // Scan for tickets exceeding SLA
    const scanResult = await dynamodb.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: '#status = :openStatus AND #timestamp < :threshold',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#timestamp': 'timestamp'
        },
        ExpressionAttributeValues: {
          ':openStatus': { S: 'OPEN' },
          ':threshold': { N: slaThresholdTime.toString() }
        }
      })
    );

    const breachedTickets = scanResult.Items || [];

    if (breachedTickets.length > 0) {
      const ticketIds = breachedTickets.map(item => item.ticketId.S).join(', ');

      await sns.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: `SLA Breach Alert: ${breachedTickets.length} tickets`,
          Message: `SLA breach detected for ${breachedTickets.length} tickets: ${ticketIds}`
        })
      );

      return {
        statusCode: 200,
        breachedTickets: breachedTickets.length,
        ticketIds
      };
    }

    return {
      statusCode: 200,
      breachedTickets: 0,
      message: 'No SLA breaches detected'
    };
  } catch (error) {
    console.error('Error checking SLA:', error);
    throw error;
  }
};
