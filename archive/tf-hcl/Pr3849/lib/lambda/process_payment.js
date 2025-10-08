const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const dynamoDb = new DynamoDBClient();
const secretsManager = new SecretsManagerClient();

exports.handler = async (event) => {
    console.log('Processing payment event:', JSON.stringify(event));

    try {
        const { subscription_id, customer_id, amount } = event;

        if (!subscription_id || !customer_id || !amount) {
            throw new Error('Missing required fields: subscription_id, customer_id, or amount');
        }

        // Retrieve payment gateway credentials
        const secretResponse = await secretsManager.send(
            new GetSecretValueCommand({
                SecretId: process.env.SECRETS_MANAGER_ARN
            })
        );

        const credentials = JSON.parse(secretResponse.SecretString);

        // Validate subscription exists in DynamoDB
        const getParams = {
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                subscription_id: { S: subscription_id },
                customer_id: { S: customer_id }
            }
        };

        const subscription = await dynamoDb.send(new GetItemCommand(getParams));

        if (!subscription.Item) {
            throw new Error('Subscription not found');
        }

        // Simulate payment processing
        // In production, this would call the actual payment gateway API
        const paymentResult = await processPaymentWithGateway(
            credentials,
            {
                subscription_id,
                customer_id,
                amount
            }
        );

        // Update subscription status
        const updateParams = {
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                subscription_id: { S: subscription_id },
                customer_id: { S: customer_id }
            },
            UpdateExpression: 'SET payment_status = :status, last_payment = :timestamp, transaction_id = :txn_id',
            ExpressionAttributeValues: {
                ':status': { S: 'paid' },
                ':timestamp': { S: new Date().toISOString() },
                ':txn_id': { S: paymentResult.transaction_id }
            }
        };

        await dynamoDb.send(new UpdateItemCommand(updateParams));

        return {
            statusCode: 200,
            body: {
                subscription_id,
                customer_id,
                transaction_id: paymentResult.transaction_id,
                amount,
                status: 'success',
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Payment processing error:', error);
        throw new Error('PaymentError: ' + error.message);
    }
};

async function processPaymentWithGateway(credentials, paymentData) {
    // Simulate payment gateway API call
    // In production, integrate with actual payment gateway
    console.log('Processing payment with gateway:', paymentData);

    // Simulate success response
    return {
        transaction_id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        status: 'approved',
        amount: paymentData.amount,
        timestamp: new Date().toISOString()
    };
}
