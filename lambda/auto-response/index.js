// Auto-Response Lambda Handler
const { LexRuntimeV2Client, RecognizeTextCommand } = require('@aws-sdk/client-lex-runtime-v2');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const lex = new LexRuntimeV2Client({ region: process.env.AWS_REGION });
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing auto-response:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing message or sessionId' })
      };
    }

    // Recognize text with Lex
    const lexResponse = await lex.send(
      new RecognizeTextCommand({
        botId: process.env.LEX_BOT_ID,
        botAliasId: process.env.LEX_BOT_ALIAS_ID,
        localeId: 'en_US',
        sessionId,
        text: message
      })
    );

    const responseMessage = lexResponse.messages && lexResponse.messages.length > 0
      ? lexResponse.messages[0].content
      : 'I am here to help. Could you please rephrase your question?';

    // Log conversation to DynamoDB
    await dynamodb.send(
      new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ticketId: { S: `auto-${sessionId}` },
          timestamp: { N: Date.now().toString() },
          userMessage: { S: message },
          botResponse: { S: responseMessage },
          intent: { S: lexResponse.sessionState?.intent?.name || 'Unknown' },
          status: { S: 'AUTO_RESPONDED' }
        }
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: responseMessage,
        intent: lexResponse.sessionState?.intent?.name,
        sessionId
      })
    };
  } catch (error) {
    console.error('Error generating auto-response:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Auto-response failed', message: error.message })
    };
  }
};
