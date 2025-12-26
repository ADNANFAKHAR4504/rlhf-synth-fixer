"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
const s3Client = new client_s3_1.S3Client({});
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const handler = async (event) => {
    console.log('API handler event:', JSON.stringify(event, null, 2));
    const { httpMethod, path, body, requestContext } = event;
    const userId = requestContext.authorizer?.userId || 'anonymous';
    try {
        if (httpMethod === 'POST' && path === '/documents') {
            // Document upload
            const requestBody = JSON.parse(body || '{}');
            const { fileName, content, contentType } = requestBody;
            if (!fileName || !content) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'fileName and content are required' }),
                };
            }
            // Validate file size (max 10MB)
            const contentSize = Buffer.byteLength(content, 'base64');
            if (contentSize > 10 * 1024 * 1024) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'File size exceeds 10MB limit' }),
                };
            }
            // Validate file name
            if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Invalid file name' }),
                };
            }
            // Validate content type
            const allowedTypes = [
                'application/pdf',
                'text/plain',
                'image/jpeg',
                'image/png',
            ];
            if (contentType && !allowedTypes.includes(contentType)) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Unsupported content type' }),
                };
            }
            const documentId = (0, crypto_1.randomUUID)();
            const key = `documents/${userId}/${documentId}-${fileName}`;
            // Upload to S3
            await s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: process.env.DOCUMENTS_BUCKET,
                Key: key,
                Body: Buffer.from(content, 'base64'),
                ContentType: contentType || 'application/octet-stream',
                Metadata: {
                    userId,
                    documentId,
                },
            }));
            // Store metadata in DynamoDB
            const uploadTimestamp = Date.now();
            const item = {
                documentId,
                uploadTimestamp,
                fileName,
                bucket: process.env.DOCUMENTS_BUCKET,
                key,
                size: Buffer.byteLength(content, 'base64'),
                contentType: contentType || 'application/octet-stream',
                uploadedAt: new Date().toISOString(),
                status: 'uploaded',
                userId,
            };
            await docClient.send(new lib_dynamodb_1.PutCommand({
                TableName: process.env.DOCUMENTS_TABLE,
                Item: item,
            }));
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId,
                    message: 'Document uploaded successfully',
                    key,
                }),
            };
        }
        if (httpMethod === 'GET' && path.startsWith('/documents/')) {
            // Document retrieval
            const pathParts = path.split('/');
            const documentId = pathParts[2];
            // If uploadTimestamp is provided in the path, use it for exact lookup
            if (pathParts.length > 3) {
                const uploadTimestamp = parseInt(pathParts[3], 10);
                const result = await docClient.send(new lib_dynamodb_1.GetCommand({
                    TableName: process.env.DOCUMENTS_TABLE,
                    Key: {
                        documentId,
                        uploadTimestamp,
                    },
                }));
                if (!result.Item) {
                    return {
                        statusCode: 404,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ error: 'Document not found' }),
                    };
                }
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.Item),
                };
            }
            else {
                // If only documentId is provided, query for the most recent version
                const result = await docClient.send(new lib_dynamodb_1.QueryCommand({
                    TableName: process.env.DOCUMENTS_TABLE,
                    KeyConditionExpression: 'documentId = :documentId',
                    ExpressionAttributeValues: {
                        ':documentId': documentId,
                    },
                    ScanIndexForward: false, // Most recent first
                    Limit: 1,
                }));
                if (!result.Items || result.Items.length === 0) {
                    return {
                        statusCode: 404,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ error: 'Document not found' }),
                    };
                }
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result.Items[0]),
                };
            }
        }
        if (httpMethod === 'GET' && path === '/documents') {
            // List documents using GSI for efficient querying
            const queryParams = {
                TableName: process.env.DOCUMENTS_TABLE,
                IndexName: 'userId-uploadTimestamp-index',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId,
                },
                ScanIndexForward: false, // Most recent first
                Limit: 50,
            };
            const result = await docClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documents: result.Items,
                    count: result.Count,
                    lastEvaluatedKey: result.LastEvaluatedKey,
                }),
            };
        }
        return {
            statusCode: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Not found' }),
        };
    }
    catch (error) {
        console.error('API handler error:', error);
        // Handle specific error types
        if (error.name === 'ValidationError') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Validation error',
                    details: error.message,
                }),
            };
        }
        if (error.name === 'ResourceNotFoundException') {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Resource not found' }),
            };
        }
        if (error.name === 'AccessDeniedException') {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Access denied' }),
            };
        }
        // Default error response
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal server error',
                requestId: event.requestContext?.requestId || 'unknown',
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpSGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9sYW1iZGEvYXBpSGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFBZ0U7QUFDaEUsOERBQTBEO0FBQzFELHdEQUsrQjtBQUMvQixtQ0FBb0M7QUFHcEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2xDLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFxQnJELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFDMUIsS0FBMkIsRUFDSyxFQUFFO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbEUsTUFBTSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUN6RCxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsVUFBVSxFQUFFLE1BQU0sSUFBSSxXQUFXLENBQUM7SUFFaEUsSUFBSSxDQUFDO1FBQ0gsSUFBSSxVQUFVLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxZQUFZLEVBQUUsQ0FBQztZQUNuRCxrQkFBa0I7WUFDbEIsTUFBTSxXQUFXLEdBQTBCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxHQUFHLFdBQVcsQ0FBQztZQUV2RCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzFCLE9BQU87b0JBQ0wsVUFBVSxF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QS9PVyxRQUFBLE9BQU8sV0ErT2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUzNDbGllbnQsIFB1dE9iamVjdENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtczMnO1xuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgRHluYW1vREJEb2N1bWVudENsaWVudCxcbiAgR2V0Q29tbWFuZCxcbiAgUXVlcnlDb21tYW5kLFxuICBQdXRDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5cbmNvbnN0IHMzQ2xpZW50ID0gbmV3IFMzQ2xpZW50KHt9KTtcbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCBkb2NDbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20oZHluYW1vQ2xpZW50KTtcblxuaW50ZXJmYWNlIERvY3VtZW50VXBsb2FkUmVxdWVzdCB7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGNvbnRlbnQ6IHN0cmluZztcbiAgY29udGVudFR5cGU/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBEb2N1bWVudE1ldGFkYXRhIHtcbiAgZG9jdW1lbnRJZDogc3RyaW5nO1xuICB1cGxvYWRUaW1lc3RhbXA6IG51bWJlcjtcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgYnVja2V0OiBzdHJpbmc7XG4gIGtleTogc3RyaW5nO1xuICBzaXplOiBudW1iZXI7XG4gIGNvbnRlbnRUeXBlOiBzdHJpbmc7XG4gIHVwbG9hZGVkQXQ6IHN0cmluZztcbiAgc3RhdHVzOiBzdHJpbmc7XG4gIHVzZXJJZDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChcbiAgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50XG4pOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICBjb25zb2xlLmxvZygnQVBJIGhhbmRsZXIgZXZlbnQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcblxuICBjb25zdCB7IGh0dHBNZXRob2QsIHBhdGgsIGJvZHksIHJlcXVlc3RDb250ZXh0IH0gPSBldmVudDtcbiAgY29uc3QgdXNlcklkID0gcmVxdWVzdENvbnRleHQuYXV0aG9yaXplcj8udXNlcklkIHx8ICdhbm9ueW1vdXMnO1xuXG4gIHRyeSB7XG4gICAgaWYgKGh0dHBNZXRob2QgPT09ICdQT1NUJyAmJiBwYXRoID09PSAnL2RvY3VtZW50cycpIHtcbiAgICAgIC8vIERvY3VtZW50IHVwbG9hZFxuICAgICAgY29uc3QgcmVxdWVzdEJvZHk6IERvY3VtZW50VXBsb2FkUmVxdWVzdCA9IEpTT04ucGFyc2UoYm9keSB8fCAne30nKTtcbiAgICAgIGNvbnN0IHsgZmlsZU5hbWUsIGNvbnRlbnQsIGNvbnRlbnRUeXBlIH0gPSByZXF1ZXN0Qm9keTtcblxuICAgICAgaWYgKCFmaWxlTmFtZSB8fCAhY29udGVudCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnZmlsZU5hbWUgYW5kIGNvbnRlbnQgYXJlIHJlcXVpcmVkJyB9KSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gVmFsaWRhdGUgZmlsZSBzaXplIChtYXggMTBNQilcbiAgICAgIGNvbnN0IGNvbnRlbnRTaXplID0gQnVmZmVyLmJ5dGVMZW5ndGgoY29udGVudCwgJ2Jhc2U2NCcpO1xuICAgICAgaWYgKGNvbnRlbnRTaXplID4gMTAgKiAxMDI0ICogMTAyNCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnRmlsZSBzaXplIGV4Y2VlZHMgMTBNQiBsaW1pdCcgfSksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIFZhbGlkYXRlIGZpbGUgbmFtZVxuICAgICAgaWYgKCEvXlthLXpBLVowLTkuXy1dKyQvLnRlc3QoZmlsZU5hbWUpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnZhbGlkIGZpbGUgbmFtZScgfSksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIFZhbGlkYXRlIGNvbnRlbnQgdHlwZVxuICAgICAgY29uc3QgYWxsb3dlZFR5cGVzID0gW1xuICAgICAgICAnYXBwbGljYXRpb24vcGRmJyxcbiAgICAgICAgJ3RleHQvcGxhaW4nLFxuICAgICAgICAnaW1hZ2UvanBlZycsXG4gICAgICAgICdpbWFnZS9wbmcnLFxuICAgICAgXTtcbiAgICAgIGlmIChjb250ZW50VHlwZSAmJiAhYWxsb3dlZFR5cGVzLmluY2x1ZGVzKGNvbnRlbnRUeXBlKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnVW5zdXBwb3J0ZWQgY29udGVudCB0eXBlJyB9KSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG9jdW1lbnRJZCA9IHJhbmRvbVVVSUQoKTtcbiAgICAgIGNvbnN0IGtleSA9IGBkb2N1bWVudHMvJHt1c2VySWR9LyR7ZG9jdW1lbnRJZH0tJHtmaWxlTmFtZX1gO1xuXG4gICAgICAvLyBVcGxvYWQgdG8gUzNcbiAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgICBCdWNrZXQ6IHByb2Nlc3MuZW52LkRPQ1VNRU5UU19CVUNLRVQsXG4gICAgICAgICAgS2V5OiBrZXksXG4gICAgICAgICAgQm9keTogQnVmZmVyLmZyb20oY29udGVudCwgJ2Jhc2U2NCcpLFxuICAgICAgICAgIENvbnRlbnRUeXBlOiBjb250ZW50VHlwZSB8fCAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyxcbiAgICAgICAgICBNZXRhZGF0YToge1xuICAgICAgICAgICAgdXNlcklkLFxuICAgICAgICAgICAgZG9jdW1lbnRJZCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgLy8gU3RvcmUgbWV0YWRhdGEgaW4gRHluYW1vREJcbiAgICAgIGNvbnN0IHVwbG9hZFRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgICBjb25zdCBpdGVtOiBEb2N1bWVudE1ldGFkYXRhID0ge1xuICAgICAgICBkb2N1bWVudElkLFxuICAgICAgICB1cGxvYWRUaW1lc3RhbXAsXG4gICAgICAgIGZpbGVOYW1lLFxuICAgICAgICBidWNrZXQ6IHByb2Nlc3MuZW52LkRPQ1VNRU5UU19CVUNLRVQhLFxuICAgICAgICBrZXksXG4gICAgICAgIHNpemU6IEJ1ZmZlci5ieXRlTGVuZ3RoKGNvbnRlbnQsICdiYXNlNjQnKSxcbiAgICAgICAgY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxuICAgICAgICB1cGxvYWRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHN0YXR1czogJ3VwbG9hZGVkJyxcbiAgICAgICAgdXNlcklkLFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZG9jQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBQdXRDb21tYW5kKHtcbiAgICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3MuZW52LkRPQ1VNRU5UU19UQUJMRSxcbiAgICAgICAgICBJdGVtOiBpdGVtLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIGRvY3VtZW50SWQsXG4gICAgICAgICAgbWVzc2FnZTogJ0RvY3VtZW50IHVwbG9hZGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgICAga2V5LFxuICAgICAgICB9KSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGh0dHBNZXRob2QgPT09ICdHRVQnICYmIHBhdGguc3RhcnRzV2l0aCgnL2RvY3VtZW50cy8nKSkge1xuICAgICAgLy8gRG9jdW1lbnQgcmV0cmlldmFsXG4gICAgICBjb25zdCBwYXRoUGFydHMgPSBwYXRoLnNwbGl0KCcvJyk7XG4gICAgICBjb25zdCBkb2N1bWVudElkID0gcGF0aFBhcnRzWzJdO1xuXG4gICAgICAvLyBJZiB1cGxvYWRUaW1lc3RhbXAgaXMgcHJvdmlkZWQgaW4gdGhlIHBhdGgsIHVzZSBpdCBmb3IgZXhhY3QgbG9va3VwXG4gICAgICBpZiAocGF0aFBhcnRzLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgY29uc3QgdXBsb2FkVGltZXN0YW1wID0gcGFyc2VJbnQocGF0aFBhcnRzWzNdLCAxMCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBHZXRDb21tYW5kKHtcbiAgICAgICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzcy5lbnYuRE9DVU1FTlRTX1RBQkxFLFxuICAgICAgICAgICAgS2V5OiB7XG4gICAgICAgICAgICAgIGRvY3VtZW50SWQsXG4gICAgICAgICAgICAgIHVwbG9hZFRpbWVzdGFtcCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIXJlc3VsdC5JdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0RvY3VtZW50IG5vdCBmb3VuZCcgfSksXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3VsdC5JdGVtKSxcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIG9ubHkgZG9jdW1lbnRJZCBpcyBwcm92aWRlZCwgcXVlcnkgZm9yIHRoZSBtb3N0IHJlY2VudCB2ZXJzaW9uXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBRdWVyeUNvbW1hbmQoe1xuICAgICAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5ET0NVTUVOVFNfVEFCTEUsXG4gICAgICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnZG9jdW1lbnRJZCA9IDpkb2N1bWVudElkJyxcbiAgICAgICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgICAgICAgJzpkb2N1bWVudElkJzogZG9jdW1lbnRJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBTY2FuSW5kZXhGb3J3YXJkOiBmYWxzZSwgLy8gTW9zdCByZWNlbnQgZmlyc3RcbiAgICAgICAgICAgIExpbWl0OiAxLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCFyZXN1bHQuSXRlbXMgfHwgcmVzdWx0Lkl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDQsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdEb2N1bWVudCBub3QgZm91bmQnIH0pLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXN1bHQuSXRlbXNbMF0pLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChodHRwTWV0aG9kID09PSAnR0VUJyAmJiBwYXRoID09PSAnL2RvY3VtZW50cycpIHtcbiAgICAgIC8vIExpc3QgZG9jdW1lbnRzIHVzaW5nIEdTSSBmb3IgZWZmaWNpZW50IHF1ZXJ5aW5nXG4gICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IHtcbiAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5ET0NVTUVOVFNfVEFCTEUsXG4gICAgICAgIEluZGV4TmFtZTogJ3VzZXJJZC11cGxvYWRUaW1lc3RhbXAtaW5kZXgnLFxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAndXNlcklkID0gOnVzZXJJZCcsXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICAgICAnOnVzZXJJZCc6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgICAgU2NhbkluZGV4Rm9yd2FyZDogZmFsc2UsIC8vIE1vc3QgcmVjZW50IGZpcnN0XG4gICAgICAgIExpbWl0OiA1MCxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRvY0NsaWVudC5zZW5kKG5ldyBRdWVyeUNvbW1hbmQocXVlcnlQYXJhbXMpKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIGRvY3VtZW50czogcmVzdWx0Lkl0ZW1zLFxuICAgICAgICAgIGNvdW50OiByZXN1bHQuQ291bnQsXG4gICAgICAgICAgbGFzdEV2YWx1YXRlZEtleTogcmVzdWx0Lkxhc3RFdmFsdWF0ZWRLZXksXG4gICAgICAgIH0pLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTm90IGZvdW5kJyB9KSxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignQVBJIGhhbmRsZXIgZXJyb3I6JywgZXJyb3IpO1xuXG4gICAgLy8gSGFuZGxlIHNwZWNpZmljIGVycm9yIHR5cGVzXG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdWYWxpZGF0aW9uRXJyb3InKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgZXJyb3I6ICdWYWxpZGF0aW9uIGVycm9yJyxcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICB9KSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Jlc291cmNlIG5vdCBmb3VuZCcgfSksXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChlcnJvci5uYW1lID09PSAnQWNjZXNzRGVuaWVkRXhjZXB0aW9uJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogNDAzLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0FjY2VzcyBkZW5pZWQnIH0pLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IGVycm9yIHJlc3BvbnNlXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIHJlcXVlc3RJZDogZXZlbnQucmVxdWVzdENvbnRleHQ/LnJlcXVlc3RJZCB8fCAndW5rbm93bicsXG4gICAgICB9KSxcbiAgICB9O1xuICB9XG59O1xuIl19