const { Logger } = require('@aws-lambda-powertools/logger');
const { Metrics, MetricUnits } = require('@aws-lambda-powertools/metrics');
const { Tracer } = require('@aws-lambda-powertools/tracer');
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const logger = new Logger({ serviceName: 'ApprovalProcessor' });
const metrics = new Metrics({ namespace: 'StockPatternDetection', serviceName: 'ApprovalProcessor' });
const tracer = new Tracer({ serviceName: 'ApprovalProcessor' });
const dynamoClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment('ApprovalProcessing');

  try {
    logger.info('Processing approval request', { event });

    const token = event.pathParameters?.token || event.token;
    const action = event.body ? JSON.parse(event.body).action : 'approve';

    // Check if approval already processed (idempotency)
    const existingApproval = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.APPROVAL_TRACKING_TABLE,
        Key: { approvalId: { S: token } },
      })
    );

    if (existingApproval.Item) {
      logger.info('Approval already processed', { token });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Approval already processed', status: existingApproval.Item.status.S }),
      };
    }

    // Store approval with TTL
    const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration
    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.APPROVAL_TRACKING_TABLE,
        Item: {
          approvalId: { S: token },
          status: { S: action },
          timestamp: { S: new Date().toISOString() },
          expiresAt: { N: expiresAt.toString() },
        },
        ConditionExpression: 'attribute_not_exists(approvalId)',
      })
    );

    // Publish approval result
    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.TRADING_ALERTS_TOPIC_ARN,
        Message: JSON.stringify({
          type: 'approval_processed',
          token,
          action,
          timestamp: new Date().toISOString(),
        }),
        Subject: `Approval ${action}`,
      })
    );

    metrics.addMetric('ApprovalsProcessed', MetricUnits.Count, 1);
    metrics.addDimension('Action', action);

    subsegment.close();
    logger.info('Approval processing completed', { token, action });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Approval processed successfully', token, action }),
    };
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      logger.warn('Duplicate approval attempt', { token: event.pathParameters?.token });
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Approval already exists' }),
      };
    }

    logger.error('Error in approval processor', { error });
    subsegment.addError(error);
    subsegment.close();
    throw error;
  } finally {
    metrics.publishStoredMetrics();
  }
};
