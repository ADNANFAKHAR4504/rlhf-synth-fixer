const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

const ORDERS_TABLE = process.env.ORDERS_TABLE;

/**
 * Validates order data
 */
function validateOrder(order) {
    const errors = [];

    if (!order.orderId) {
        errors.push('Missing orderId');
    }

    if (!order.customerName) {
        errors.push('Missing customerName');
    }

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        errors.push('Missing or invalid items array');
    }

    if (!order.totalAmount || order.totalAmount <= 0) {
        errors.push('Invalid totalAmount');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Publishes CloudWatch metrics
 */
async function publishMetrics(metricName, value, unit = 'Count') {
    try {
        const params = {
            Namespace: 'OrderProcessing',
            MetricData: [{
                MetricName: metricName,
                Value: value,
                Unit: unit,
                Timestamp: new Date()
            }]
        };

        await cloudWatchClient.send(new PutMetricDataCommand(params));
    } catch (error) {
        console.error('Error publishing metrics:', error);
    }
}

/**
 * Lambda handler for order validation
 */
exports.handler = async (event) => {
    const startTime = Date.now();

    try {
        console.log('Processing event:', JSON.stringify(event, null, 2));

        // Handle SQS batch
        const records = event.Records || [];
        const results = [];

        for (const record of records) {
            try {
                const order = JSON.parse(record.body);
                const orderTimestamp = Date.now();

                // Validate order
                const validation = validateOrder(order);

                if (!validation.valid) {
                    console.error('Validation failed:', validation.errors);
                    await publishMetrics('OrderValidationFailed', 1);
                    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                }

                // Store in DynamoDB
                const item = {
                    orderId: order.orderId,
                    orderTimestamp: orderTimestamp,
                    customerName: order.customerName,
                    items: order.items,
                    totalAmount: order.totalAmount,
                    orderStatus: 'VALIDATED',
                    createdAt: new Date().toISOString()
                };

                await docClient.send(new PutCommand({
                    TableName: ORDERS_TABLE,
                    Item: item
                }));

                await publishMetrics('OrderValidationSuccess', 1);

                results.push({
                    orderId: order.orderId,
                    orderTimestamp: orderTimestamp.toString(),
                    status: 'success'
                });

            } catch (error) {
                console.error('Error processing record:', error);
                await publishMetrics('OrderProcessingError', 1);
                throw error;
            }
        }

        // Publish execution time metric
        const executionTime = Date.now() - startTime;
        await publishMetrics('LambdaExecutionTime', executionTime, 'Milliseconds');

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Orders processed successfully',
                results
            })
        };

    } catch (error) {
        console.error('Handler error:', error);
        await publishMetrics('LambdaError', 1);
        throw error;
    }
};
