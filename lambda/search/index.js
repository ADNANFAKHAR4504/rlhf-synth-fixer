// Knowledge Base Search Lambda Handler
const { KendraClient, QueryCommand } = require('@aws-sdk/client-kendra');

const kendra = new KendraClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing knowledge base search:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const { queryText } = body;

    if (!queryText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing queryText' })
      };
    }

    const kendraResponse = await kendra.send(
      new QueryCommand({
        IndexId: process.env.KENDRA_INDEX_ID,
        QueryText: queryText
      })
    );

    const results = kendraResponse.ResultItems.map(item => ({
      title: item.DocumentTitle,
      excerpt: item.DocumentExcerpt,
      score: item.ScoreAttributes,
      documentId: item.DocumentId
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        query: queryText,
        results,
        totalResults: kendraResponse.TotalNumberOfResults
      })
    };
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Search failed', message: error.message })
    };
  }
};
