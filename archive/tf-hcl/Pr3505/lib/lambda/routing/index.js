const routeWebhook = async (webhookData) => {
    const { source, payload } = webhookData;

    // Define routing rules based on source
    const routingRules = {
        github: ['code-pipeline', 'notification-service'],
        stripe: ['payment-processor', 'accounting-service'],
        slack: ['notification-service', 'chat-integration'],
        default: ['webhook-archive']
    };

    const targets = routingRules[source] || routingRules.default;
    return targets;
};

const sendToEventBridge = async (webhookData, targets) => {
    console.log('Sending to EventBridge targets:', targets);

    const events = targets.map(target => ({
        Source: 'webhook.processor',
        DetailType: 'Webhook Processed',
        Detail: JSON.stringify({
            ...webhookData,
            target,
            processedAt: new Date().toISOString()
        }),
        EventBusName: process.env.EVENT_BUS_NAME
    }));

    // In production, use AWS SDK to send events
    console.log('Events to send:', events);
    return { FailedEntryCount: 0 };
};

const updateWebhookStatus = async (webhookId, status, metadata = {}) => {
    console.log(`Updating webhook ${webhookId} status to ${status}`);
    // In production, use AWS SDK to update DynamoDB
};

const exponentialBackoff = async (fn, maxRetries = 3) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const delay = Math.min(1000 * Math.pow(2, i), 10000);
            console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

exports.handler = async (event) => {
    const processedWebhooks = [];
    const failedWebhooks = [];

    try {
        console.log('Processing SQS messages, count:', event.Records ? event.Records.length : 0);

        if (!event.Records) {
            return { batchItemFailures: [] };
        }

        for (const record of event.Records) {
            const webhookData = JSON.parse(record.body);
            const { webhookId } = webhookData;

            try {
                // Determine routing targets
                const targets = await routeWebhook(webhookData);
                console.log('Routing webhook', webhookId, 'to targets:', targets);

                // Send to EventBridge with exponential backoff
                await exponentialBackoff(async () => {
                    await sendToEventBridge(webhookData, targets);
                });

                // Update status in DynamoDB
                await updateWebhookStatus(webhookId, 'processed', { targets });

                processedWebhooks.push(webhookId);

            } catch (error) {
                console.error('Failed to process webhook', webhookId, error);
                failedWebhooks.push({ webhookId, error: error.message });

                // Send to DLQ if max retries exceeded
                if (record.attributes && record.attributes.ApproximateReceiveCount >= 3) {
                    console.log('Sending to DLQ:', webhookId);
                    await updateWebhookStatus(webhookId, 'failed', { error: error.message });
                }

                throw error;
            }
        }

        console.log('Batch processing complete. Processed:', processedWebhooks.length, 'Failed:', failedWebhooks.length);

        return {
            batchItemFailures: failedWebhooks.map(f => ({
                itemIdentifier: f.webhookId
            }))
        };

    } catch (error) {
        console.error('Fatal error in webhook routing:', error);
        throw error;
    }
};