/**
 * Payment Processor Lambda Function
 *
 * This function processes payment events from Step Functions with business logic.
 * It updates payment status in DynamoDB and handles various payment scenarios.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Simulates payment processing logic
 * In production, this would integrate with actual payment gateways
 */
async function processPayment(paymentData) {
    const { paymentId, amount, currency } = paymentData;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate random failures for testing retry logic (10% failure rate)
    if (Math.random() < 0.1) {
        throw new Error('Payment gateway timeout');
    }

    // Process payment
    console.log(`Processing payment: ${paymentId}, amount: ${amount} ${currency}`);

    return {
        success: true,
        transactionId: `txn_${Date.now()}_${paymentId}`,
        processedAt: new Date().toISOString(),
    };
}

/**
 * Lambda handler function
 */
exports.handler = async (event) => {
    console.log('Processing payment event:', JSON.stringify(event, null, 2));

    try {
        // Extract payment data from DynamoDB Stream event
        let paymentData;

        if (event.paymentId) {
            // Direct invocation from Step Functions
            paymentData = event;
        } else if (event.dynamodb && event.dynamodb.NewImage) {
            // From DynamoDB Stream
            paymentData = {
                paymentId: event.dynamodb.NewImage.paymentId.S,
                timestamp: parseInt(event.dynamodb.NewImage.timestamp.N),
                amount: parseFloat(event.dynamodb.NewImage.amount.N || '0'),
                currency: event.dynamodb.NewImage.currency.S,
                status: event.dynamodb.NewImage.status.S,
            };
        } else {
            throw new Error('Invalid event format');
        }

        const { paymentId, timestamp } = paymentData;

        // Retrieve full payment details if needed
        const getParams = {
            TableName: TABLE_NAME,
            Key: {
                paymentId,
                timestamp,
            },
        };

        const { Item } = await ddbDocClient.send(new GetCommand(getParams));

        if (!Item) {
            throw new Error(`Payment not found: ${paymentId}`);
        }

        // Process the payment
        const result = await processPayment({
            ...Item,
            ...paymentData,
        });

        // Update payment status in DynamoDB
        const updateParams = {
            TableName: TABLE_NAME,
            Key: {
                paymentId,
                timestamp,
            },
            UpdateExpression: 'SET #status = :status, transactionId = :transactionId, processedAt = :processedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'completed',
                ':transactionId': result.transactionId,
                ':processedAt': result.processedAt,
                ':updatedAt': new Date().toISOString(),
            },
        };

        await ddbDocClient.send(new UpdateCommand(updateParams));

        console.log(`Successfully processed payment: ${paymentId}`);

        return {
            success: true,
            paymentId,
            transactionId: result.transactionId,
            status: 'completed',
        };
    } catch (error) {
        console.error('Error processing payment:', error);

        // Re-throw error to trigger Step Functions retry logic
        throw error;
    }
};
