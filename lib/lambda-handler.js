exports.handler = async (event) => {
  console.log('Processing price check event:', JSON.stringify(event, null, 2));

  const AWS = require('aws-sdk');
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  const sns = new AWS.SNS();

  const tableName = process.env.DYNAMODB_TABLE_NAME;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;

  try {
    // Example: Query alerts for a specific user
    const userId = event.userId || 'test-user';
    const params = {
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const result = await dynamodb.query(params).promise();
    console.log(`Found ${result.Items.length} alerts for user ${userId}`);

    // Example: Send notification if price threshold is met
    if (event.priceAlert && event.currentPrice >= event.priceAlert.targetPrice) {
      const message = `Price alert triggered! ${event.priceAlert.cryptocurrency} reached ${event.currentPrice}`;
      await sns.publish({
        TopicArn: snsTopicArn,
        Message: message,
        Subject: 'Cryptocurrency Price Alert'
      }).promise();
      console.log('Notification sent:', message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Price check processed successfully',
        alertsChecked: result.Items.length
      })
    };
  } catch (error) {
    console.error('Error processing price check:', error);
    throw error;
  }
};
