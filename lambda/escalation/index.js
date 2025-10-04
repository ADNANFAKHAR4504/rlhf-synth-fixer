// Escalation Lambda Handler
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing escalation:', JSON.stringify(event, null, 2));

  try {
    const { ticketId } = event;

    if (!ticketId) {
      throw new Error('Missing ticketId');
    }

    // Get ticket from DynamoDB
    const getResult = await dynamodb.send(
      new GetItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          ticketId: { S: ticketId }
        }
      })
    );

    if (!getResult.Item) {
      return { statusCode: 404, message: 'Ticket not found' };
    }

    const priority = parseInt(getResult.Item.priority?.N || '0');
    const sentiment = getResult.Item.sentiment?.S || 'NEUTRAL';

    // Escalate if priority > 8 or negative sentiment
    const shouldEscalate = priority > 8 || sentiment === 'NEGATIVE';

    if (shouldEscalate) {
      // Update ticket status to escalated
      await dynamodb.send(
        new UpdateItemCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
            ticketId: { S: ticketId }
          },
          UpdateExpression: 'SET #status = :status, escalatedAt = :escalatedAt',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': { S: 'ESCALATED' },
            ':escalatedAt': { N: Date.now().toString() }
          }
        })
      );

      // Send SNS notification
      await sns.send(
        new PublishCommand({
          TopicArn: process.env.SNS_TOPIC_ARN,
          Subject: `Ticket Escalated: ${ticketId}`,
          Message: `Ticket ${ticketId} has been escalated. Priority: ${priority}, Sentiment: ${sentiment}`
        })
      );

      return {
        statusCode: 200,
        escalated: true,
        ticketId,
        priority,
        sentiment
      };
    }

    return {
      statusCode: 200,
      escalated: false,
      ticketId,
      priority,
      sentiment
    };
  } catch (error) {
    console.error('Error processing escalation:', error);
    throw error;
  }
};
