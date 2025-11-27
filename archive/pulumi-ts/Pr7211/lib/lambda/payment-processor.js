
exports.handler = async (event) => {
    console.log('Payment processing event:', JSON.stringify(event, null, 2));

    // Extract payment details from event
    const body = event.body ? JSON.parse(event.body) : event;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Payment processed successfully',
            paymentId: body.paymentId || 'generated-id',
            status: 'completed',
            region: process.env.AWS_REGION,
            timestamp: Date.now()
        })
    };
};
