const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const snsClient = new SNSClient();

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Your business logic here
    // Access S3 bucket: process.env.S3_BUCKET_NAME
    // Access DynamoDB table: process.env.DYNAMODB_TABLE_NAME

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Success',
        environment: process.env.ENVIRONMENT,
        bucket: process.env.S3_BUCKET_NAME,
        table: process.env.DYNAMODB_TABLE_NAME,
      }),
    };
  } catch (error) {
    console.error('Error occurred:', error);

    // Send error to SNS topic
    try {
      await snsClient.send(
        new PublishCommand({
          TopicArn: process.env.ERROR_TOPIC_ARN,
          Subject: `Error in Lambda Function (${process.env.ENVIRONMENT})`,
          Message: JSON.stringify(
            {
              error: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
              environment: process.env.ENVIRONMENT,
            },
            null,
            2
          ),
        })
      );
    } catch (snsError) {
      console.error('Failed to send SNS notification:', snsError);
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
