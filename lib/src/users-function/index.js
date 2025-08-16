const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.USERS_TABLE_NAME;
    
    if (!tableName) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Table name not configured' })
        };
    }
    
    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const path = event.path || event.rawPath || '/users';
    
    try {
        switch (method) {
            case 'GET':
                // Get user by ID or list all users
                if (event.pathParameters?.id) {
                    const result = await dynamodb.get({
                        TableName: tableName,
                        Key: { userId: event.pathParameters.id }
                    }).promise();
                    
                    return {
                        statusCode: result.Item ? 200 : 404,
                        body: JSON.stringify(result.Item || { message: 'User not found' })
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
                // Create a new user
                const newUser = JSON.parse(event.body || '{}');
                newUser.userId = newUser.userId || Date.now().toString();
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: newUser
                }).promise();
                
                return {
                    statusCode: 201,
                    body: JSON.stringify(newUser)
                };
                
            case 'PUT':
                // Update an existing user
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'User ID required for update' })
                    };
                }
                
                const updateUser = JSON.parse(event.body || '{}');
                updateUser.userId = event.pathParameters.id;
                
                await dynamodb.put({
                    TableName: tableName,
                    Item: updateUser
                }).promise();
                
                return {
                    statusCode: 200,
                    body: JSON.stringify(updateUser)
                };
                
            case 'DELETE':
                // Delete a user
                if (!event.pathParameters?.id) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'User ID required for deletion' })
                    };
                }
                
                await dynamodb.delete({
                    TableName: tableName,
                    Key: { userId: event.pathParameters.id }
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