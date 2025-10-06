// lambda/index.js
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const { Logger, Metrics, Tracer } = require('@aws-lambda-powertools/logger');

// Initialize AWS services with X-Ray tracing
const dynamodb = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();

// Initialize Powertools
const logger = new Logger({ serviceName: 'fintech-api' });
const metrics = new Metrics({ namespace: 'FintechAPI', serviceName: 'transaction-processor' });
const tracer = new Tracer({ serviceName: 'fintech-api' });

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const SSM_PARAMETER_PREFIX = process.env.SSM_PARAMETER_PREFIX || '/fintech-api';

// Cache for SSM parameters
let parameterCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getParameter(name) {
    const now = Date.now();

    if (parameterCache[name] && parameterCache[name].expiry > now) {
        return parameterCache[name].value;
    }

    try {
        const result = await ssm.getParameter({
            Name: name,
            WithDecryption: true
        }).promise();

        parameterCache[name] = {
            value: result.Parameter.Value,
            expiry: now + CACHE_TTL
        };

        return result.Parameter.Value;
    } catch (error) {
        logger.error('Failed to get parameter', { name, error });
        throw error;
    }
}

async function processTransaction(transaction) {
    // Create X-Ray subsegment for transaction processing
    const subsegment = AWSXRay.getSegment().addNewSubsegment('processTransaction');

    const timestamp = Date.now();
    const transactionId = `txn-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    const item = {
        transaction_id: transactionId,
        timestamp: timestamp,
        customer_id: transaction.customer_id,
        amount: transaction.amount,
        currency: transaction.currency || 'USD',
        status: 'PENDING',
        created_at: new Date().toISOString(),
        metadata: transaction.metadata || {}
    };

    try {
        // Add transaction metadata to X-Ray
        subsegment.addAnnotation('transactionId', transactionId);
        subsegment.addAnnotation('customerId', transaction.customer_id);
        subsegment.addMetadata('transaction', {
            amount: transaction.amount,
            currency: item.currency
        });

        // Validate API key with X-Ray tracing
        const ssmSubsegment = subsegment.addNewSubsegment('SSM_GetParameter');
        try {
            const apiKey = await getParameter(`${SSM_PARAMETER_PREFIX}/api-key`);
            ssmSubsegment.close();
        } catch (error) {
            ssmSubsegment.addError(error);
            ssmSubsegment.close();
            throw error;
        }

        // Store transaction in DynamoDB with X-Ray tracing
        const dbWriteSubsegment = subsegment.addNewSubsegment('DynamoDB_PutItem');
        try {
            await dynamodb.put({
                TableName: TABLE_NAME,
                Item: item,
                ConditionExpression: 'attribute_not_exists(transaction_id)'
            }).promise();
            dbWriteSubsegment.close();
        } catch (error) {
            dbWriteSubsegment.addError(error);
            dbWriteSubsegment.close();
            throw error;
        }

        // Record metrics
        metrics.addMetric('TransactionCreated', 'Count', 1);
        metrics.addMetadata('transactionId', transactionId);

        logger.info('Transaction created', { transactionId, customerId: transaction.customer_id });

        // Simulate processing with X-Ray annotation
        const processingSubsegment = subsegment.addNewSubsegment('TransactionProcessing');
        await new Promise(resolve => setTimeout(resolve, 100));
        processingSubsegment.close();

        // Update status to COMPLETED with X-Ray tracing
        const dbUpdateSubsegment = subsegment.addNewSubsegment('DynamoDB_UpdateItem');
        try {
            await dynamodb.update({
                TableName: TABLE_NAME,
                Key: {
                    transaction_id: transactionId,
                    timestamp: timestamp
                },
                UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#status': 'status',
                    '#updatedAt': 'updated_at'
                },
                ExpressionAttributeValues: {
                    ':status': 'COMPLETED',
                    ':updatedAt': new Date().toISOString()
                }
            }).promise();
            dbUpdateSubsegment.close();
        } catch (error) {
            dbUpdateSubsegment.addError(error);
            dbUpdateSubsegment.close();
            throw error;
        }

        subsegment.close();

        return {
            transactionId,
            status: 'COMPLETED',
            timestamp: new Date(timestamp).toISOString()
        };
    } catch (error) {
        logger.error('Transaction processing failed', { error, transactionId });
        metrics.addMetric('TransactionFailed', 'Count', 1);
        subsegment.addError(error);
        subsegment.close();
        throw error;
    }
}

async function getTransaction(transactionId) {
    try {
        const result = await dynamodb.query({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'transaction_id = :id',
            ExpressionAttributeValues: {
                ':id': transactionId
            }
        }).promise();

        if (result.Items.length === 0) {
            return null;
        }

        metrics.addMetric('TransactionRetrieved', 'Count', 1);
        return result.Items[0];
    } catch (error) {
        logger.error('Failed to retrieve transaction', { error, transactionId });
        throw error;
    }
}

async function generateDailyReport() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();

    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: '#ts BETWEEN :start AND :end',
            ExpressionAttributeNames: {
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':start': startOfDay,
                ':end': endOfDay
            }
        }).promise();

        const report = {
            date: yesterday.toISOString().split('T')[0],
            total_transactions: result.Items.length,
            total_amount: result.Items.reduce((sum, item) => sum + (item.amount || 0), 0),
            status_breakdown: {}
        };

        result.Items.forEach(item => {
            report.status_breakdown[item.status] = (report.status_breakdown[item.status] || 0) + 1;
        });

        logger.info('Daily report generated', report);
        metrics.addMetric('DailyReportGenerated', 'Count', 1);

        return report;
    } catch (error) {
        logger.error('Failed to generate daily report', { error });
        throw error;
    }
}

async function cleanupOldRecords(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTimestamp = cutoffDate.getTime();

    try {
        const result = await dynamodb.scan({
            TableName: TABLE_NAME,
            FilterExpression: '#ts < :cutoff',
            ExpressionAttributeNames: {
                '#ts': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':cutoff': cutoffTimestamp
            },
            ProjectionExpression: 'transaction_id, #ts',
            ExpressionAttributeNames: {
                '#ts': 'timestamp'
            }
        }).promise();

        const deletePromises = result.Items.map(item =>
            dynamodb.delete({
                TableName: TABLE_NAME,
                Key: {
                    transaction_id: item.transaction_id,
                    timestamp: item.timestamp
                }
            }).promise()
        );

        await Promise.all(deletePromises);

        logger.info(`Cleaned up ${result.Items.length} old records`);
        metrics.addMetric('RecordsCleaned', 'Count', result.Items.length);

        return { deleted: result.Items.length };
    } catch (error) {
        logger.error('Failed to cleanup old records', { error });
        throw error;
    }
}

exports.handler = async (event) => {
    const segment = tracer.getSegment();
    const subsegment = segment.addNewSubsegment('processRequest');

    try {
        logger.info('Received event', { event });

        // Handle EventBridge scheduled events
        if (event.action) {
            switch (event.action) {
                case 'generate_daily_report':
                    const report = await generateDailyReport();
                    return {
                        statusCode: 200,
                        body: JSON.stringify(report)
                    };
                case 'cleanup_old_records':
                    const cleanup = await cleanupOldRecords(event.days_to_keep);
                    return {
                        statusCode: 200,
                        body: JSON.stringify(cleanup)
                    };
            }
        }

        // Handle API Gateway events
        const method = event.requestContext?.http?.method || event.httpMethod;
        const path = event.requestContext?.http?.path || event.path;

        if (method === 'POST' && path === '/transactions') {
            const body = JSON.parse(event.body || '{}');

            if (!body.customer_id || !body.amount) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Missing required fields: customer_id, amount' })
                };
            }

            const result = await processTransaction(body);

            return {
                statusCode: 201,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            };
        }

        if (method === 'GET' && path.startsWith('/transactions/')) {
            const transactionId = event.pathParameters?.id || path.split('/').pop();
            const transaction = await getTransaction(transactionId);

            if (!transaction) {
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Transaction not found' })
                };
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction)
            };
        }

        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        logger.error('Handler error', { error: error.message, stack: error.stack });
        metrics.addMetric('HandlerError', 'Count', 1);

        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    } finally {
        subsegment.close();
        metrics.publishStoredMetrics();
    }
};