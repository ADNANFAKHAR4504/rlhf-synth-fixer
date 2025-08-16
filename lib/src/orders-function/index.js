const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.ORDERS_TABLE_NAME;
    
    if (!tableName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Table name not configured' })
        };
    }
    
    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '/orders';
    
    try {
        switch (method) {
            case 'GET':
                // Get order by ID or list all orders
                if (event.pathParameters?.id) {
                    const result = await dynamodb.get({
                        TableName: tableName,
                        Key: { orderId: event.pathParameters.id }
                    }).promise();
                    
                    return {
                        statusCode: result.Item ? 200 : 404,
                        body: JSON.stringify(result.Item || { message: 'Order not found' })
                    };
                } else {
                    const result = await dynamodb.scan({
                        TableName: tableName
                    }).promise();
                    
                    return {
                        statusCode: 200,
                        body: JSON.stringify(result.Items || [])
                    };
                }
                
            case 'POST':
                // Create a new order
                const newOrder = JSON.parse(event.body || '{}');
                newOrder.orderId = newOrder.orderId || Date.now().toString();
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: newOrder
                }).promise();
                
                return {
                    statusCode: 201,
                    body: JSON.stringify(newOrder)
                };
                
            case 'PUT':
                // Update an existing order
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Order ID required for update' })
                    };
                }
                
                const updateOrder = JSON.parse(event.body || '{}');
                updateOrder.orderId = event.pathParameters.id;
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: updateOrder
                }).promise();
                
                return {
                    statusCode: 200,
                    body: JSON.stringify(updateOrder)
                };
                
            case 'DELETE':
                // Delete an order
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Order ID required for deletion' })
                    };
                }
                
                await dynamodb.delete({
                    TableName: tableName,
                    Key: { orderId: event.pathParameters.id }
                }).promise();
                
                return {
                    statusCode: 204,
                    body: ''
                };
                
            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};