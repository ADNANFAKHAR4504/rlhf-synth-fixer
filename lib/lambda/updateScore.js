const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const playerId = event.pathParameters?.playerId;
    const body = JSON.parse(event.body);

    if (!playerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing playerId parameter'
        }),
      };
    }

    if (!body.score && !body.gameId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'At least one field (score or gameId) must be provided'
        }),
      };
    }

    let updateExpression = 'SET #timestamp = :timestamp';
    const expressionAttributeNames = {
      '#timestamp': 'timestamp',
    };
    const expressionAttributeValues = {
      ':timestamp': new Date().toISOString(),
    };

    if (body.score !== undefined) {
      updateExpression += ', #score = :score';
      expressionAttributeNames['#score'] = 'score';
      expressionAttributeValues[':score'] = body.score;
    }

    if (body.gameId !== undefined) {
      updateExpression += ', #gameId = :gameId';
      expressionAttributeNames['#gameId'] = 'gameId';
      expressionAttributeValues[':gameId'] = body.gameId;
    }

    const params = {
      TableName: TABLE_NAME,
      Key: marshall({ playerId }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ConditionExpression: 'attribute_exists(playerId)',
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoClient.send(new UpdateItemCommand(params));
    const updatedItem = unmarshall(result.Attributes);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Score updated successfully',
        data: updatedItem
      }),
    };
  } catch (error) {
    console.error('Error updating score:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Player score not found'
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