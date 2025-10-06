// Translation Lambda Handler
const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate');

const translate = new TranslateClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing translation:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const { text, targetLanguage } = body;

    if (!text || !targetLanguage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing text or targetLanguage' })
      };
    }

    const translateResponse = await translate.send(
      new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: 'auto',
        TargetLanguageCode: targetLanguage
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        originalText: text,
        translatedText: translateResponse.TranslatedText,
        sourceLanguage: translateResponse.SourceLanguageCode,
        targetLanguage: translateResponse.TargetLanguageCode
      })
    };
  } catch (error) {
    console.error('Error translating text:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Translation failed', message: error.message })
    };
  }
};
