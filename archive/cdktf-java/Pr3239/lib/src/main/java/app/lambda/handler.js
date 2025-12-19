const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.REGION
});

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const REGION = process.env.REGION || 'us-east-1';

// Enhanced error types for better monitoring
const ErrorTypes = {
    VALIDATION_ERROR: 'ValidationError',
    NOT_FOUND: 'NotFoundError',
    CONFLICT: 'ConflictError',
    RATE_LIMIT: 'RateLimitError',
    INTERNAL_ERROR: 'InternalError'
};

exports.main = async (event, context) => {
    // Request tracing
    const requestId = context.awsRequestId;
    const traceId = event.headers?.['X-Amzn-Trace-Id'] || 'unknown';

    console.log(`[${requestId}] Request received:`, {
        httpMethod: event.httpMethod,
        path: event.path,
        traceId: traceId,
        userAgent: event.headers?.['User-Agent'],
        sourceIp: event.requestContext?.identity?.sourceIp
    });

    // Set timeout warning
    const timeoutWarning = setTimeout(() => {
        console.warn(`[${requestId}] Function approaching timeout, remaining time: ${context.getRemainingTimeInMillis()}ms`);
    }, context.getRemainingTimeInMillis() - 1000);

    try {
        // Input validation
        if (!event.httpMethod || !event.path) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Missing required request properties', requestId);
        }

        // Health check endpoint
        if (event.path === '/health') {
            return await handleHealthCheck(requestId);
        }

        const httpMethod = event.httpMethod;
        const path = event.path;
        const pathSegments = path.split('/').filter(Boolean);

        // Route handling with enhanced paths
        if (pathSegments[0] === 'items') {
            if (pathSegments.length === 1) {
                // Collection operations: /items
                switch (httpMethod) {
                    case 'GET':
                        return await handleListItems(event, requestId);
                    case 'POST':
                        return await handleCreateItem(event, requestId);
                    default:
                        return createErrorResponse(405, ErrorTypes.VALIDATION_ERROR, 'Method not allowed for collection', requestId);
                }
            } else if (pathSegments.length === 2) {
                // Individual item operations: /items/{id}
                const itemId = pathSegments[1];
                switch (httpMethod) {
                    case 'GET':
                        return await handleGetItem(itemId, requestId);
                    case 'PUT':
                        return await handleUpdateItem(itemId, event, requestId);
                    case 'DELETE':
                        return await handleDeleteItem(itemId, requestId);
                    default:
                        return createErrorResponse(405, ErrorTypes.VALIDATION_ERROR, 'Method not allowed for item', requestId);
                }
            } else if (pathSegments.length === 3 && pathSegments[2] === 'batch') {
                // Batch operations: /items/batch
                switch (httpMethod) {
                    case 'POST':
                        return await handleBatchOperation(event, requestId);
                    default:
                        return createErrorResponse(405, ErrorTypes.VALIDATION_ERROR, 'Method not allowed for batch', requestId);
                }
            }
        }

        return createErrorResponse(404, ErrorTypes.NOT_FOUND, 'Endpoint not found', requestId);

    } catch (error) {
        console.error(`[${requestId}] Unhandled error:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return createErrorResponse(500, ErrorTypes.INTERNAL_ERROR, 'Internal server error', requestId);
    } finally {
        clearTimeout(timeoutWarning);
    }
};

async function handleHealthCheck(requestId) {
    console.log(`[${requestId}] Health check requested`);

    try {
        // Test DynamoDB connection
        const params = {
            TableName: TABLE_NAME,
            Limit: 1
        };

        const start = Date.now();
        await dynamodb.scan(params).promise();
        const duration = Date.now() - start;

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            region: REGION,
            table: TABLE_NAME,
            dynamoLatency: `${duration}ms`,
            requestId: requestId
        };

        console.log(`[${requestId}] Health check passed:`, health);
        return createResponse(200, health, requestId);
    } catch (error) {
        console.error(`[${requestId}] Health check failed:`, error);
        return createErrorResponse(503, ErrorTypes.INTERNAL_ERROR, 'Service unhealthy', requestId);
    }
}

async function handleListItems(event, requestId) {
    console.log(`[${requestId}] Listing items`);

    try {
        // Query parameters for pagination and filtering
        const queryParams = event.queryStringParameters || {};
        const limit = Math.min(parseInt(queryParams.limit) || 20, 100); // Max 100 items
        const lastKey = queryParams.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;

        const params = {
            TableName: TABLE_NAME,
            Limit: limit
        };

        if (lastKey) {
            params.ExclusiveStartKey = lastKey;
        }

        const result = await dynamodb.scan(params).promise();

        const response = {
            items: result.Items || [],
            count: result.Count,
            scannedCount: result.ScannedCount
        };

        if (result.LastEvaluatedKey) {
            response.nextToken = encodeURIComponent(JSON.stringify(result.LastEvaluatedKey));
        }

        console.log(`[${requestId}] Listed ${result.Count} items`);
        return createResponse(200, response, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error listing items:`, error);
        if (error.code === 'ResourceNotFoundException') {
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, 'Table not found', requestId);
        }
        throw error;
    }
}

async function handleGetItem(itemId, requestId) {
    console.log(`[${requestId}] Getting item: ${itemId}`);

    if (!isValidId(itemId)) {
        return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid item ID format', requestId);
    }

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: itemId }
        };

        const result = await dynamodb.get(params).promise();

        if (!result.Item) {
            console.log(`[${requestId}] Item not found: ${itemId}`);
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, `Item with id '${itemId}' not found`, requestId);
        }

        console.log(`[${requestId}] Item retrieved: ${itemId}`);
        return createResponse(200, result.Item, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error getting item ${itemId}:`, error);
        throw error;
    }
}

async function handleCreateItem(event, requestId) {
    console.log(`[${requestId}] Creating item`);

    try {
        const body = parseRequestBody(event.body);
        const validationResult = validateItemData(body, true);

        if (!validationResult.isValid) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, validationResult.errors.join(', '), requestId);
        }

        const item = {
            id: body.id,
            name: body.name || null,
            data: body.data || {},
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
        };

        // Conditional put to prevent duplicates
        const params = {
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(id)'
        };

        await dynamodb.put(params).promise();

        console.log(`[${requestId}] Item created: ${item.id}`);
        return createResponse(201, {
            message: 'Item created successfully',
            id: item.id,
            createdAt: item.createdAt
        }, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error creating item:`, error);

        if (error.code === 'ConditionalCheckFailedException') {
            return createErrorResponse(409, ErrorTypes.CONFLICT, 'Item already exists', requestId);
        }
        throw error;
    }
}

async function handleUpdateItem(itemId, event, requestId) {
    console.log(`[${requestId}] Updating item: ${itemId}`);

    if (!isValidId(itemId)) {
        return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid item ID format', requestId);
    }

    try {
        const body = parseRequestBody(event.body);
        const validationResult = validateItemData(body, false);

        if (!validationResult.isValid) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, validationResult.errors.join(', '), requestId);
        }

        // Build update expression dynamically
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        if (body.name !== undefined) {
            updateExpressions.push('#name = :name');
            expressionAttributeNames['#name'] = 'name';
            expressionAttributeValues[':name'] = body.name;
        }

        if (body.data !== undefined) {
            updateExpressions.push('#data = :data');
            expressionAttributeNames['#data'] = 'data';
            expressionAttributeValues[':data'] = body.data;
        }

        updateExpressions.push('#updatedAt = :updatedAt');
        updateExpressions.push('#version = #version + :inc');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeNames['#version'] = 'version';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        expressionAttributeValues[':inc'] = 1;

        const params = {
            TableName: TABLE_NAME,
            Key: { id: itemId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_NEW'
        };

        const result = await dynamodb.update(params).promise();

        console.log(`[${requestId}] Item updated: ${itemId}`);
        return createResponse(200, {
            message: 'Item updated successfully',
            item: result.Attributes
        }, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error updating item ${itemId}:`, error);

        if (error.code === 'ConditionalCheckFailedException') {
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, `Item with id '${itemId}' not found`, requestId);
        }
        throw error;
    }
}

async function handleDeleteItem(itemId, requestId) {
    console.log(`[${requestId}] Deleting item: ${itemId}`);

    if (!isValidId(itemId)) {
        return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid item ID format', requestId);
    }

    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { id: itemId },
            ConditionExpression: 'attribute_exists(id)',
            ReturnValues: 'ALL_OLD'
        };

        const result = await dynamodb.delete(params).promise();

        console.log(`[${requestId}] Item deleted: ${itemId}`);
        return createResponse(200, {
            message: 'Item deleted successfully',
            deletedItem: result.Attributes
        }, requestId);

    } catch (error) {
        console.error(`[${requestId}] Error deleting item ${itemId}:`, error);

        if (error.code === 'ConditionalCheckFailedException') {
            return createErrorResponse(404, ErrorTypes.NOT_FOUND, `Item with id '${itemId}' not found`, requestId);
        }
        throw error;
    }
}

async function handleBatchOperation(event, requestId) {
    console.log(`[${requestId}] Handling batch operation`);

    try {
        const body = parseRequestBody(event.body);

        if (!body.operation || !Array.isArray(body.items)) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Batch operation requires operation type and items array', requestId);
        }

        if (body.items.length > 25) {
            return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Batch operations limited to 25 items', requestId);
        }

        switch (body.operation) {
            case 'write':
                return await handleBatchWrite(body.items, requestId);
            case 'get':
                return await handleBatchGet(body.items, requestId);
            default:
                return createErrorResponse(400, ErrorTypes.VALIDATION_ERROR, 'Invalid batch operation type', requestId);
        }

    } catch (error) {
        console.error(`[${requestId}] Error in batch operation:`, error);
        throw error;
    }
}

async function handleBatchWrite(items, requestId) {
    const writeRequests = items.map(item => {
        if (item.action === 'put') {
            return {
                PutRequest: {
                    Item: {
                        id: item.id,
                        name: item.name || null,
                        data: item.data || {},
                        timestamp: Date.now(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        version: 1
                    }
                }
            };
        } else if (item.action === 'delete') {
            return {
                DeleteRequest: {
                    Key: { id: item.id }
                }
            };
        }
    }).filter(Boolean);

    const params = {
        RequestItems: {
            [TABLE_NAME]: writeRequests
        }
    };

    const result = await dynamodb.batchWrite(params).promise();

    return createResponse(200, {
        message: 'Batch write completed',
        unprocessedItems: result.UnprocessedItems
    }, requestId);
}

async function handleBatchGet(items, requestId) {
    const keys = items.map(item => ({ id: item.id }));

    const params = {
        RequestItems: {
            [TABLE_NAME]: {
                Keys: keys
            }
        }
    };

    const result = await dynamodb.batchGet(params).promise();

    return createResponse(200, {
        items: result.Responses[TABLE_NAME] || [],
        unprocessedKeys: result.UnprocessedKeys
    }, requestId);
}

function parseRequestBody(body) {
    if (!body) {
        throw new Error('Request body is required');
    }

    try {
        return JSON.parse(body);
    } catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}

function validateItemData(data, requireId = false) {
    const errors = [];

    if (requireId && !data.id) {
        errors.push('Missing required field: id');
    }

    if (data.id && !isValidId(data.id)) {
        errors.push('Invalid id format: must be alphanumeric with dashes/underscores, 1-50 characters');
    }

    if (data.name && typeof data.name !== 'string') {
        errors.push('Name must be a string');
    }

    if (data.name && data.name.length > 255) {
        errors.push('Name must be 255 characters or less');
    }

    if (data.data && typeof data.data !== 'object') {
        errors.push('Data must be an object');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function isValidId(id) {
    return typeof id === 'string' &&
           /^[a-zA-Z0-9_-]+$/.test(id) &&
           id.length >= 1 &&
           id.length <= 50;
}

function createResponse(statusCode, body, requestId) {
    const response = {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'X-Request-ID': requestId
        },
        body: JSON.stringify(body)
    };

    console.log(`[${requestId}] Response: ${statusCode}`);
    return response;
}

function createErrorResponse(statusCode, errorType, message, requestId) {
    const error = {
        error: {
            type: errorType,
            message: message,
            requestId: requestId,
            timestamp: new Date().toISOString()
        }
    };

    // Log error for CloudWatch monitoring
    console.error(`[${requestId}] ERROR ${statusCode}:`, error);

    return createResponse(statusCode, error, requestId);
}