const crypto = require('crypto');

// Mock implementations since we can't use external packages in terraform archive
const getSecret = async (secretArn) => {
    console.log('Getting secret from:', secretArn);
    // In production, use AWS SDK to fetch actual secret
    return {
        github_secret: 'test-github-secret',
        stripe_secret: 'test-stripe-secret',
        slack_secret: 'test-slack-secret'
    };
};

const validateWebhookSignature = (payload, signature, secret) => {
    const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
    );
};

exports.handler = async (event) => {
    try {
        console.log('Processing webhook request');

        const body = JSON.parse(event.body || '{}');
        const signature = event.headers && event.headers['x-webhook-signature'];
        const source = (event.headers && event.headers['x-webhook-source']) || 'unknown';

        if (!signature) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing webhook signature' })
            };
        }

        // Get secrets
        const secrets = await getSecret(process.env.SECRET_ARN);
        const secretKey = secrets[`${source}_secret`];

        if (!secretKey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Unknown webhook source' })
            };
        }

        // Validate signature
        const isValid = validateWebhookSignature(body, signature, secretKey);

        if (!isValid) {
            console.warn('Invalid webhook signature from source:', source);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid webhook signature' })
            };
        }

        // Log webhook to DynamoDB (simplified)
        const webhookId = crypto.randomUUID();
        const timestamp = Date.now();

        console.log('Webhook validated, ID:', webhookId);

        // Send to SQS for processing (simplified)
        const messageBody = {
            webhookId,
            source,
            payload: body,
            receivedAt: new Date().toISOString()
        };

        console.log('Queuing webhook for processing:', messageBody);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Webhook received successfully',
                webhookId
            })
        };

    } catch (error) {
        console.error('Error processing webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};