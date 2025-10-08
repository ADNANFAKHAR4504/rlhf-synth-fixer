const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');

const stepFunctions = new SFNClient();

exports.handler = async (event) => {
    console.log('Webhook received:', JSON.stringify(event));

    try {
        // Parse webhook payload
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

        const { subscription_id, customer_id, amount, event_type } = body;

        if (!subscription_id || !customer_id || !amount) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Missing required fields: subscription_id, customer_id, or amount'
                })
            };
        }

        // Start Step Functions execution
        const executionParams = {
            stateMachineArn: process.env.STATE_MACHINE_ARN,
            input: JSON.stringify({
                subscription_id,
                customer_id,
                amount,
                event_type: event_type || 'subscription.renewal',
                timestamp: new Date().toISOString()
            }),
            name: `renewal-${subscription_id}-${Date.now()}`
        };

        const result = await stepFunctions.send(new StartExecutionCommand(executionParams));

        return {
            statusCode: 202,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Webhook received and processing started',
                execution_arn: result.executionArn,
                subscription_id,
                customer_id
            })
        };

    } catch (error) {
        console.error('Webhook handler error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
