// Placeholder Lambda function for deployment
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Lambda function executed successfully',
            input: event,
        }),
    };
};