const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // Input validation
    if (!body.playerId || !body.score || !body.gameId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required fields: playerId, score, gameId'
        }),
      };
    }

    const item = {
      playerId: body.playerId,
      score: body.score,
      gameId: body.gameId,
      timestamp: new Date().toISOString(),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: marshall(item),
      ConditionExpression: 'attribute_not_exists(playerId)',
    };

    await dynamoClient.send(new PutItemCommand(params));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Score created successfully',
        data: item
      }),
    };
  } catch (error) {
    console.error('Error creating score:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Player score already exists'
        }),
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
};