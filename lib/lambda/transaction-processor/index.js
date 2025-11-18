const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const AWSXRay = require('aws-xray-sdk-core');

// Create Lambda client with X-Ray tracing
const lambda = AWSXRay.captureAWSv3Client(new LambdaClient({}));

exports.handler = async (event) => {
    console.log('Processing DynamoDB stream records:', JSON.stringify(event, null, 2));

    const fraudScorerFunction = process.env.FRAUD_SCORER_FUNCTION;

    try {
        // Process each record from DynamoDB stream
        for (const record of event.Records) {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const transaction = record.dynamodb.NewImage;

                // Invoke fraud scorer Lambda
                const command = new InvokeCommand({
                    FunctionName: fraudScorerFunction,
                    InvocationType: 'Event',
                    Payload: JSON.stringify({
                        transaction_id: transaction.transaction_id.S,
                        timestamp: transaction.timestamp.N,
                        amount: transaction.amount ? transaction.amount.N : '0',
                        merchant: transaction.merchant ? transaction.merchant.S : 'unknown'
                    })
                });

                await lambda.send(command);
                console.log(`Invoked fraud scorer for transaction ${transaction.transaction_id.S}`);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Successfully processed records' })
        };
    } catch (error) {
        console.error('Error processing records:', error);
        throw error;
    }
};
