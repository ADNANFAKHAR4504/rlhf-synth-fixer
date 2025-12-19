const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  console.log('Context: ', JSON.stringify(context, null, 2));

  try {
    // Example S3 operation
    const bucketName = process.env.BUCKET_NAME;

    if (bucketName) {
      const params = {
        Bucket: bucketName,
        Key: `logs/execution-${context.awsRequestId}.json`,
        Body: JSON.stringify({
          requestId: context.awsRequestId,
          timestamp: new Date().toISOString(),
          event: event,
        }),
        ContentType: 'application/json',
      };

      await s3.putObject(params).promise();
      console.log('Log saved to S3 successfully');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Function executed successfully',
        requestId: context.awsRequestId,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
