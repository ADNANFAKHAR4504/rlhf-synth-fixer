const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const sqs = new AWS.SQS();

exports.handler = async (event) => {
  console.log('Received webhook:', JSON.stringify(event, null, 2));
  
  try {
    const correlationId = uuidv4();
    
    // Extract provider from path parameters
    const provider = event.pathParameters?.provider || 'unknown';
    
    // Parse webhook payload
    let payload;
    try {
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Internal server error',
          correlationId: correlationId
        })
      };
    }
    
    // Send message to SQS for processing
    const message = {
      correlationId,
      provider,
      payload,
      timestamp: new Date().toISOString(),
      headers: event.headers || {}
    };
    
    await sqs.sendMessage({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        provider: {
          DataType: 'String',
          StringValue: provider
        },
        correlationId: {
          DataType: 'String',
          StringValue: correlationId
        }
      }
    }).promise();
    
    console.log('Message sent to SQS:', correlationId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Webhook received',
        correlationId: correlationId
      })
    };
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        correlationId: uuidv4()
      })
    };
  }
};