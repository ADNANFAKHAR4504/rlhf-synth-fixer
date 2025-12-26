"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const handler = async (event) => {
    console.log('Authorizer event:', JSON.stringify(event, null, 2));
    const apiKey = event.headers?.['x-api-key'] || event.headers?.['X-Api-Key'];
    const httpMethod = event.httpMethod || event.requestContext?.httpMethod;
    if (!apiKey) {
        console.log('No API key provided');
        throw new Error('Unauthorized');
    }
    try {
        const result = await docClient.send(new lib_dynamodb_1.GetCommand({
            TableName: process.env.API_KEYS_TABLE,
            Key: { apiKey },
        }));
        if (!result.Item || result.Item.status !== 'active') {
            console.log('API key not found or inactive:', apiKey);
            throw new Error('Unauthorized');
        }
        const item = result.Item;
        const permissions = item.permissions || 'read';
        const userId = item.userId || 'anonymous';
        console.log('Found user:', userId, 'with permissions:', permissions, 'for method:', httpMethod);
        // Check permissions based on HTTP method
        let allow = true;
        if (httpMethod === 'POST' ||
            httpMethod === 'PUT' ||
            httpMethod === 'DELETE') {
            // Write operations require read-write or admin permissions
            allow = permissions === 'read-write' || permissions === 'admin';
        }
        else if (httpMethod === 'GET') {
            // Read operations allowed for all permission levels
            allow = true;
        }
        if (!allow) {
            console.log('Insufficient permissions:', permissions, 'for method:', httpMethod);
            throw new Error('Forbidden');
        }
        const statement = {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
        };
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [statement],
        };
        const policy = {
            principalId: userId,
            policyDocument,
            context: {
                userId,
                permissions,
            },
        };
        console.log('Authorization successful for user:', userId, 'with permissions:', permissions);
        return policy;
    }
    catch (error) {
        console.error('Authorization failed:', error.message);
        // Handle specific DynamoDB errors
        if (error.name === 'ResourceNotFoundException') {
            console.error('API Keys table not found');
            throw new Error('Service unavailable');
        }
        if (error.name === 'AccessDeniedException') {
            console.error('Access denied to API Keys table');
            throw new Error('Service unavailable');
        }
        if (error.name === 'ProvisionedThroughputExceededException') {
            console.error('DynamoDB throughput exceeded');
            throw new Error('Service temporarily unavailable');
        }
        // Default unauthorized error
        throw new Error('Unauthorized');
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aG9yaXplci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9sYW1iZGEvYXV0aG9yaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBQTJFO0FBUTNFLE1BQU0sTUFBTSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0QyxNQUFNLFNBQVMsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFTL0MsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUMxQixLQUF1QyxFQUNGLEVBQUU7SUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqRSxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzVFLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUM7SUFFeEUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELElBQUksQ0FBQztRQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FDakMsSUFBSSx5QkFBVSxDQUFDO1lBQ2IsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYztZQUNyQyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUU7U0FDaEIsQ0FBQyxDQUNILENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxDQUFDLElB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SyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7QUFDSCxDQUFDLENBQUM7QUFqSFcsUUFBQSxPQUFPLFdBaUhsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIEdldENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHtcbiAgQVBJR2F0ZXdheVJlcXVlc3RBdXRob3JpemVyRXZlbnQsXG4gIEFQSUdhdGV3YXlBdXRob3JpemVyUmVzdWx0LFxuICBQb2xpY3lEb2N1bWVudCxcbiAgU3RhdGVtZW50LFxufSBmcm9tICdhd3MtbGFtYmRhJztcblxuY29uc3QgY2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbmNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShjbGllbnQpO1xuXG5pbnRlcmZhY2UgQXBpS2V5SXRlbSB7XG4gIGFwaUtleTogc3RyaW5nO1xuICBzdGF0dXM6IHN0cmluZztcbiAgcGVybWlzc2lvbnM6IHN0cmluZztcbiAgdXNlcklkOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogQVBJR2F0ZXdheVJlcXVlc3RBdXRob3JpemVyRXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheUF1dGhvcml6ZXJSZXN1bHQ+ID0+IHtcbiAgY29uc29sZS5sb2coJ0F1dGhvcml6ZXIgZXZlbnQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcblxuICBjb25zdCBhcGlLZXkgPSBldmVudC5oZWFkZXJzPy5bJ3gtYXBpLWtleSddIHx8IGV2ZW50LmhlYWRlcnM/LlsnWC1BcGktS2V5J107XG4gIGNvbnN0IGh0dHBNZXRob2QgPSBldmVudC5odHRwTWV0aG9kIHx8IGV2ZW50LnJlcXVlc3RDb250ZXh0Py5odHRwTWV0aG9kO1xuXG4gIGlmICghYXBpS2V5KSB7XG4gICAgY29uc29sZS5sb2coJ05vIEFQSSBrZXkgcHJvdmlkZWQnKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYXV0aG9yaXplZCcpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkb2NDbGllbnQuc2VuZChcbiAgICAgIG5ldyBHZXRDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5BUElfS0VZU19UQUJMRSxcbiAgICAgICAgS2V5OiB7IGFwaUtleSB9LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgaWYgKCFyZXN1bHQuSXRlbSB8fCByZXN1bHQuSXRlbS5zdGF0dXMgIT09ICdhY3RpdmUnKSB7XG4gICAgICBjb25zb2xlLmxvZygnQVBJIGtleSBub3QgZm91bmQgb3IgaW5hY3RpdmU6JywgYXBpS2V5KTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5hdXRob3JpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgaXRlbSA9IHJlc3VsdC5JdGVtIGFzIEFwaUtleUl0ZW07XG4gICAgY29uc3QgcGVybWlzc2lvbnMgPSBpdGVtLnBlcm1pc3Npb25zIHx8ICdyZWFkJztcbiAgICBjb25zdCB1c2VySWQgPSBpdGVtLnVzZXJJZCB8fCAnYW5vbnltb3VzJztcblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgJ0ZvdW5kIHVzZXI6JyxcbiAgICAgIHVzZXJJZCxcbiAgICAgICd3aXRoIHBlcm1pc3Npb25zOicsXG4gICAgICBwZXJtaXNzaW9ucyxcbiAgICAgICdmb3IgbWV0aG9kOicsXG4gICAgICBodHRwTWV0aG9kXG4gICAgKTtcblxuICAgIC8vIENoZWNrIHBlcm1pc3Npb25zIGJhc2VkIG9uIEhUVFAgbWV0aG9kXG4gICAgbGV0IGFsbG93ID0gdHJ1ZTtcbiAgICBpZiAoXG4gICAgICBodHRwTWV0aG9kID09PSAnUE9TVCcgfHxcbiAgICAgIGh0dHBNZXRob2QgPT09ICdQVVQnIHx8XG4gICAgICBodHRwTWV0aG9kID09PSAnREVMRVRFJ1xuICAgICkge1xuICAgICAgLy8gV3JpdGUgb3BlcmF0aW9ucyByZXF1aXJlIHJlYWQtd3JpdGUgb3IgYWRtaW4gcGVybWlzc2lvbnNcbiAgICAgIGFsbG93ID0gcGVybWlzc2lvbnMgPT09ICdyZWFkLXdyaXRlJyB8fCBwZXJtaXNzaW9ucyA9PT0gJ2FkbWluJztcbiAgICB9IGVsc2UgaWYgKGh0dHBNZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICAvLyBSZWFkIG9wZXJhdGlvbnMgYWxsb3dlZCBmb3IgYWxsIHBlcm1pc3Npb24gbGV2ZWxzXG4gICAgICBhbGxvdyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFhbGxvdykge1xuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICdJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnM6JyxcbiAgICAgICAgcGVybWlzc2lvbnMsXG4gICAgICAgICdmb3IgbWV0aG9kOicsXG4gICAgICAgIGh0dHBNZXRob2RcbiAgICAgICk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvcmJpZGRlbicpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXRlbWVudDogU3RhdGVtZW50ID0ge1xuICAgICAgQWN0aW9uOiAnZXhlY3V0ZS1hcGk6SW52b2tlJyxcbiAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgIFJlc291cmNlOiBldmVudC5tZXRob2RBcm4sXG4gICAgfTtcblxuICAgIGNvbnN0IHBvbGljeURvY3VtZW50OiBQb2xpY3lEb2N1bWVudCA9IHtcbiAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgIFN0YXRlbWVudDogW3N0YXRlbWVudF0sXG4gICAgfTtcblxuICAgIGNvbnN0IHBvbGljeTogQVBJR2F0ZXdheUF1dGhvcml6ZXJSZXN1bHQgPSB7XG4gICAgICBwcmluY2lwYWxJZDogdXNlcklkLFxuICAgICAgcG9saWN5RG9jdW1lbnQsXG4gICAgICBjb250ZXh0OiB7XG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgcGVybWlzc2lvbnMsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICdBdXRob3JpemF0aW9uIHN1Y2Nlc3NmdWwgZm9yIHVzZXI6JyxcbiAgICAgIHVzZXJJZCxcbiAgICAgICd3aXRoIHBlcm1pc3Npb25zOicsXG4gICAgICBwZXJtaXNzaW9uc1xuICAgICk7XG5cbiAgICByZXR1cm4gcG9saWN5O1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignQXV0aG9yaXphdGlvbiBmYWlsZWQ6JywgZXJyb3IubWVzc2FnZSk7XG5cbiAgICAvLyBIYW5kbGUgc3BlY2lmaWMgRHluYW1vREIgZXJyb3JzXG4gICAgaWYgKGVycm9yLm5hbWUgPT09ICdSZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uJykge1xuICAgICAgY29uc29sZS5lcnJvcignQVBJIEtleXMgdGFibGUgbm90IGZvdW5kJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlcnZpY2UgdW5hdmFpbGFibGUnKTtcbiAgICB9XG5cbiAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0FjY2Vzc0RlbmllZEV4Y2VwdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0FjY2VzcyBkZW5pZWQgdG8gQVBJIEtleXMgdGFibGUnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmljZSB1bmF2YWlsYWJsZScpO1xuICAgIH1cblxuICAgIGlmIChlcnJvci5uYW1lID09PSAnUHJvdmlzaW9uZWRUaHJvdWdocHV0RXhjZWVkZWRFeGNlcHRpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdEeW5hbW9EQiB0aHJvdWdocHV0IGV4Y2VlZGVkJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlcnZpY2UgdGVtcG9yYXJpbHkgdW5hdmFpbGFibGUnKTtcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IHVuYXV0aG9yaXplZCBlcnJvclxuICAgIHRocm93IG5ldyBFcnJvcignVW5hdXRob3JpemVkJyk7XG4gIH1cbn07XG4iXX0=