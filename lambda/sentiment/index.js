// Sentiment Analysis Lambda Handler
const {
  ComprehendClient,
  DetectSentimentCommand,
  DetectEntitiesCommand
} = require('@aws-sdk/client-comprehend');

const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const comprehend = new ComprehendClient({ region: process.env.AWS_REGION });
const sqs = new SQSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing sentiment analysis:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const { ticketText, ticketId } = body;

    if (!ticketText || !ticketId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing ticketText or ticketId' })
      };
    }

    // Detect sentiment
    const sentimentResponse = await comprehend.send(
      new DetectSentimentCommand({
        Text: ticketText,
        LanguageCode: 'en'
      })
    );

    const sentiment = sentimentResponse.Sentiment;

    // Detect entities for routing
    const entitiesResponse = await comprehend.send(
      new DetectEntitiesCommand({
        Text: ticketText,
        LanguageCode: 'en'
      })
    );

    // Determine priority queue based on sentiment
    let queueUrl;
    if (sentiment === 'NEGATIVE') {
      queueUrl = process.env.HIGH_PRIORITY_QUEUE_URL;
    } else if (sentiment === 'NEUTRAL' || sentiment === 'MIXED') {
      queueUrl = process.env.STANDARD_PRIORITY_QUEUE_URL;
    } else {
      queueUrl = process.env.LOW_PRIORITY_QUEUE_URL;
    }

    // Send message to appropriate queue
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          ticketId,
          ticketText,
          sentiment: sentimentResponse.Sentiment,
          sentimentScore: sentimentResponse.SentimentScore,
          entities: entitiesResponse.Entities,
          timestamp: new Date().toISOString()
        })
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        ticketId,
        sentiment: sentimentResponse.Sentiment,
        sentimentScore: sentimentResponse.SentimentScore,
        queueType: sentiment === 'NEGATIVE' ? 'HIGH' : sentiment === 'POSITIVE' ? 'LOW' : 'STANDARD'
      })
    };
  } catch (error) {
    console.error('Error processing sentiment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
