const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.ITEMS_TABLE_NAME;
    
    if (!tableName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Table name not configured' })
        };
    }
    
    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '/items';
    
    try {
        switch (method) {
            case 'GET':
                // Get item by ID or list all items
                if (event.pathParameters?.id) {
                    const result = await dynamodb.get({
                        TableName: tableName,
                        Key: { itemId: event.pathParameters.id }
                    }).promise();
                    
                    return {
                        statusCode: result.Item ? 200 : 404,
                        body: JSON.stringify(result.Item || { message: 'Item not found' })
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
                // Create a new item
                const newItem = JSON.parse(event.body || '{}');
                newItem.itemId = newItem.itemId || Date.now().toString();
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: newItem
                }).promise();
                
                return {
                    statusCode: 201,
                    body: JSON.stringify(newItem)
                };
                
            case 'PUT':
                // Update an existing item
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Item ID required for update' })
                    };
                }
                
                const updateItem = JSON.parse(event.body || '{}');
                updateItem.itemId = event.pathParameters.id;
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: updateItem
                }).promise();
                
                return {
                    statusCode: 200,
                    body: JSON.stringify(updateItem)
                };
                
            case 'DELETE':
                // Delete an item
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Item ID required for deletion' })
                    };
                }
                
                await dynamodb.delete({
                    TableName: tableName,
                    Key: { itemId: event.pathParameters.id }
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