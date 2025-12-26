const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const PRICE_HISTORY_TABLE = process.env.PRICE_HISTORY_TABLE;
const RETENTION_HOURS = 24;

exports.handler = async (event) => {
  console.log('Starting cleanup of old price history data');

  try {
    const cutoffTime = Date.now() - (RETENTION_HOURS * 60 * 60 * 1000);

    const scanParams = {
      TableName: PRICE_HISTORY_TABLE,
      FilterExpression: '#ts < :cutoff',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':cutoff': cutoffTime
      }
    };

    const scanResult = await ddbDocClient.send(new ScanCommand(scanParams));
    const itemsToDelete = scanResult.Items || [];

    console.log(`Found ${itemsToDelete.length} items to delete`);

    for (const item of itemsToDelete) {
      const deleteParams = {
        TableName: PRICE_HISTORY_TABLE,
        Key: {
          symbol: item.symbol,
          timestamp: item.timestamp
        }
      };

      await ddbDocClient.send(new DeleteCommand(deleteParams));
    }

    console.log(`Cleanup complete: deleted ${itemsToDelete.length} items`);

    return {
      statusCode: 200,
      body: JSON.stringify({ deletedCount: itemsToDelete.length })
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};
