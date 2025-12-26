"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const s3Client = new client_s3_1.S3Client({});
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const handler = async (event) => {
    console.log('Document processor event:', JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        if (record.eventName && record.eventName.startsWith('ObjectCreated')) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            try {
                // Get object metadata
                const objectInfo = await s3Client.send(new client_s3_1.HeadObjectCommand({
                    Bucket: bucket,
                    Key: key,
                }));
                // Extract document metadata
                const documentId = key.split('/').pop()?.split('.')[0] || 'unknown';
                const uploadTimestamp = Date.now();
                const metadata = {
                    documentId,
                    uploadTimestamp,
                    fileName: key.split('/').pop() || 'unknown',
                    bucket,
                    key,
                    size: objectInfo.ContentLength || 0,
                    contentType: objectInfo.ContentType || 'application/octet-stream',
                    uploadedAt: new Date().toISOString(),
                    status: 'processed',
                    processedAt: new Date().toISOString(),
                    userId: key.split('/')[1] || 'anonymous', // Extract userId from path
                };
                // Store metadata in DynamoDB
                await docClient.send(new lib_dynamodb_1.PutCommand({
                    TableName: process.env.DOCUMENTS_TABLE,
                    Item: metadata,
                }));
                console.log('Successfully processed document:', documentId);
            }
            catch (error) {
                console.error('Error processing document:', error);
                // Handle specific error types
                let errorStatus = 'error';
                let errorDetails = error.message || 'Unknown error';
                if (error.name === 'NoSuchKey') {
                    errorStatus = 's3_not_found';
                    errorDetails = 'S3 object not found';
                }
                else if (error.name === 'AccessDeniedException') {
                    errorStatus = 'access_denied';
                    errorDetails = 'Access denied to S3 or DynamoDB';
                }
                else if (error.name === 'ResourceNotFoundException') {
                    errorStatus = 'table_not_found';
                    errorDetails = 'DynamoDB table not found';
                }
                else if (error.name === 'ProvisionedThroughputExceededException') {
                    errorStatus = 'throughput_exceeded';
                    errorDetails = 'DynamoDB throughput exceeded';
                }
                // Store error information with enhanced details
                try {
                    const errorMetadata = {
                        documentId: key.split('/').pop()?.split('.')[0] || 'unknown',
                        uploadTimestamp: Date.now(),
                        fileName: key.split('/').pop() || 'unknown',
                        bucket,
                        key,
                        size: 0,
                        contentType: 'application/octet-stream',
                        uploadedAt: new Date().toISOString(),
                        status: errorStatus,
                        error: errorDetails,
                        errorType: error.name || 'UnknownError',
                        processedAt: new Date().toISOString(),
                        userId: key.split('/')[1] || 'anonymous',
                    };
                    await docClient.send(new lib_dynamodb_1.PutCommand({
                        TableName: process.env.DOCUMENTS_TABLE,
                        Item: errorMetadata,
                    }));
                }
                catch (dbError) {
                    console.error('Failed to store error information in DynamoDB:', dbError);
                }
            }
        }
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRQcm9jZXNzb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvbGFtYmRhL2RvY3VtZW50UHJvY2Vzc29yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGtEQUFpRTtBQUNqRSw4REFBMEQ7QUFDMUQsd0RBQTJFO0FBRzNFLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNsQyxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBcUJyRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBYyxFQUFpQixFQUFFO0lBQzdELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFekUsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbkMsSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDckUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3JDLE1BQU0sR0FBRyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFekUsSUFBSSxDQUFDO2dCQUNILHNCQUFzQjtnQkFDdEIsTUFBTSxVQUFVLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUNwQyxJQUFJLDZCQUFpQixDQUFDO29CQUNwQixNQUFNLEVB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M0MsTUFBTTt3QkFDTixHQUFHO3dCQUNILElBQUksRUFBRSxDQUFDO3dCQUNQLFdBQVcsRUFBRSwwQkFBMEI7d0JBQ3ZDLFVBQVUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTt3QkFDcEMsTUFBTSxFQUFFLFdBQVc7d0JBQ25CLEtBQUssRUFBRSxZQUFZO3dCQUNuQixTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxjQUFjO3dCQUN2QyxXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7d0JBQ3JDLE1BQU0sRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLFdBQVc7cUJBQ3pDLENBQUM7b0JBRUYsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNsQixJQUFJLHlCQUFVLENBQUM7d0JBQ2IsU0FBUyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZTt3QkFDdEMsSUFBSSxFQUFFLGFBQWE7cUJBQ3BCLENBQUMsQ0FDSCxDQUFDO2dCQUNKLENBQUM7Z0JBQUMsT0FBTyxPQUFZLEVBQUUsQ0FBQztvQkFDdEIsT0FBTyxDQUFDLEtBQUssQ0FDWCxnREFBZ0QsRUFDaEQsT0FBTyxDQUNSLENBQUM7Z0JBQ0osQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMsQ0FBQztBQWpHVyxRQUFBLE9BQU8sV0FpR2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUzNDbGllbnQsIEhlYWRPYmplY3RDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXMzJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFB1dENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHsgUzNFdmVudCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuXG5jb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7fSk7XG5jb25zdCBkeW5hbW9DbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuY29uc3QgZG9jQ2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGR5bmFtb0NsaWVudCk7XG5cbmludGVyZmFjZSBEb2N1bWVudE1ldGFkYXRhIHtcbiAgZG9jdW1lbnRJZDogc3RyaW5nO1xuICB1cGxvYWRUaW1lc3RhbXA6IG51bWJlcjtcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgYnVja2V0OiBzdHJpbmc7XG4gIGtleTogc3RyaW5nO1xuICBzaXplOiBudW1iZXI7XG4gIGNvbnRlbnRUeXBlOiBzdHJpbmc7XG4gIHVwbG9hZGVkQXQ6IHN0cmluZztcbiAgc3RhdHVzOiBzdHJpbmc7XG4gIHByb2Nlc3NlZEF0OiBzdHJpbmc7XG4gIHVzZXJJZDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRXJyb3JEb2N1bWVudE1ldGFkYXRhIGV4dGVuZHMgRG9jdW1lbnRNZXRhZGF0YSB7XG4gIGVycm9yOiBzdHJpbmc7XG4gIGVycm9yVHlwZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogUzNFdmVudCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICBjb25zb2xlLmxvZygnRG9jdW1lbnQgcHJvY2Vzc29yIGV2ZW50OicsIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSk7XG5cbiAgZm9yIChjb25zdCByZWNvcmQgb2YgZXZlbnQuUmVjb3Jkcykge1xuICAgIGlmIChyZWNvcmQuZXZlbnROYW1lICYmIHJlY29yZC5ldmVudE5hbWUuc3RhcnRzV2l0aCgnT2JqZWN0Q3JlYXRlZCcpKSB7XG4gICAgICBjb25zdCBidWNrZXQgPSByZWNvcmQuczMuYnVja2V0Lm5hbWU7XG4gICAgICBjb25zdCBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocmVjb3JkLnMzLm9iamVjdC5rZXkucmVwbGFjZSgvXFwrL2csICcgJykpO1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBHZXQgb2JqZWN0IG1ldGFkYXRhXG4gICAgICAgIGNvbnN0IG9iamVjdEluZm8gPSBhd2FpdCBzM0NsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBIZWFkT2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldCxcbiAgICAgICAgICAgIEtleToga2V5LFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gRXh0cmFjdCBkb2N1bWVudCBtZXRhZGF0YVxuICAgICAgICBjb25zdCBkb2N1bWVudElkID0ga2V5LnNwbGl0KCcvJykucG9wKCk/LnNwbGl0KCcuJylbMF0gfHwgJ3Vua25vd24nO1xuICAgICAgICBjb25zdCB1cGxvYWRUaW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCBtZXRhZGF0YTogRG9jdW1lbnRNZXRhZGF0YSA9IHtcbiAgICAgICAgICBkb2N1bWVudElkLFxuICAgICAgICAgIHVwbG9hZFRpbWVzdGFtcCxcbiAgICAgICAgICBmaWxlTmFtZToga2V5LnNwbGl0KCcvJykucG9wKCkgfHwgJ3Vua25vd24nLFxuICAgICAgICAgIGJ1Y2tldCxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgc2l6ZTogb2JqZWN0SW5mby5Db250ZW50TGVuZ3RoIHx8IDAsXG4gICAgICAgICAgY29udGVudFR5cGU6IG9iamVjdEluZm8uQ29udGVudFR5cGUgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICAgICAgICAgdXBsb2FkZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIHN0YXR1czogJ3Byb2Nlc3NlZCcsXG4gICAgICAgICAgcHJvY2Vzc2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICB1c2VySWQ6IGtleS5zcGxpdCgnLycpWzFdIHx8ICdhbm9ueW1vdXMnLCAvLyBFeHRyYWN0IHVzZXJJZCBmcm9tIHBhdGhcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTdG9yZSBtZXRhZGF0YSBpbiBEeW5hbW9EQlxuICAgICAgICBhd2FpdCBkb2NDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgUHV0Q29tbWFuZCh7XG4gICAgICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3MuZW52LkRPQ1VNRU5UU19UQUJMRSxcbiAgICAgICAgICAgIEl0ZW06IG1ldGFkYXRhLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1N1Y2Nlc3NmdWxseSBwcm9jZXNzZWQgZG9jdW1lbnQ6JywgZG9jdW1lbnRJZCk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgZG9jdW1lbnQ6JywgZXJyb3IpO1xuXG4gICAgICAgIC8vIEhhbmRsZSBzcGVjaWZpYyBlcnJvciB0eXBlc1xuICAgICAgICBsZXQgZXJyb3JTdGF0dXMgPSAnZXJyb3InO1xuICAgICAgICBsZXQgZXJyb3JEZXRhaWxzID0gZXJyb3IubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcic7XG5cbiAgICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdOb1N1Y2hLZXknKSB7XG4gICAgICAgICAgZXJyb3JTdGF0dXMgPSAnczNfbm90X2ZvdW5kJztcbiAgICAgICAgICBlcnJvckRldGFpbHMgPSAnUzMgb2JqZWN0IG5vdCBmb3VuZCc7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyb3IubmFtZSA9PT0gJ0FjY2Vzc0RlbmllZEV4Y2VwdGlvbicpIHtcbiAgICAgICAgICBlcnJvclN0YXR1cyA9ICdhY2Nlc3NfZGVuaWVkJztcbiAgICAgICAgICBlcnJvckRldGFpbHMgPSAnQWNjZXNzIGRlbmllZCB0byBTMyBvciBEeW5hbW9EQic7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyb3IubmFtZSA9PT0gJ1Jlc291cmNlTm90Rm91bmRFeGNlcHRpb24nKSB7XG4gICAgICAgICAgZXJyb3JTdGF0dXMgPSAndGFibGVfbm90X2ZvdW5kJztcbiAgICAgICAgICBlcnJvckRldGFpbHMgPSAnRHluYW1vREIgdGFibGUgbm90IGZvdW5kJztcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnUHJvdmlzaW9uZWRUaHJvdWdocHV0RXhjZWVkZWRFeGNlcHRpb24nKSB7XG4gICAgICAgICAgZXJyb3JTdGF0dXMgPSAndGhyb3VnaHB1dF9leGNlZWRlZCc7XG4gICAgICAgICAgZXJyb3JEZXRhaWxzID0gJ0R5bmFtb0RCIHRocm91Z2hwdXQgZXhjZWVkZWQnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmUgZXJyb3IgaW5mb3JtYXRpb24gd2l0aCBlbmhhbmNlZCBkZXRhaWxzXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZXJyb3JNZXRhZGF0YTogRXJyb3JEb2N1bWVudE1ldGFkYXRhID0ge1xuICAgICAgICAgICAgZG9jdW1lbnRJZDoga2V5LnNwbGl0KCcvJykucG9wKCk/LnNwbGl0KCcuJylbMF0gfHwgJ3Vua25vd24nLFxuICAgICAgICAgICAgdXBsb2FkVGltZXN0YW1wOiBEYXRlLm5vdygpLFxuICAgICAgICAgICAgZmlsZU5hbWU6IGtleS5zcGxpdCgnLycpLnBvcCgpIHx8ICd1bmtub3duJyxcbiAgICAgICAgICAgIGJ1Y2tldCxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIHNpemU6IDAsXG4gICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXG4gICAgICAgICAgICB1cGxvYWRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICBzdGF0dXM6IGVycm9yU3RhdHVzLFxuICAgICAgICAgICAgZXJyb3I6IGVycm9yRGV0YWlscyxcbiAgICAgICAgICAgIGVycm9yVHlwZTogZXJyb3IubmFtZSB8fCAnVW5rbm93bkVycm9yJyxcbiAgICAgICAgICAgIHByb2Nlc3NlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICB1c2VySWQ6IGtleS5zcGxpdCgnLycpWzFdIHx8ICdhbm9ueW1vdXMnLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBhd2FpdCBkb2NDbGllbnQuc2VuZChcbiAgICAgICAgICAgIG5ldyBQdXRDb21tYW5kKHtcbiAgICAgICAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzLmVudi5ET0NVTUVOVFNfVEFCTEUsXG4gICAgICAgICAgICAgIEl0ZW06IGVycm9yTWV0YWRhdGEsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGRiRXJyb3I6IGFueSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAnRmFpbGVkIHRvIHN0b3JlIGVycm9yIGluZm9ybWF0aW9uIGluIER5bmFtb0RCOicsXG4gICAgICAgICAgICBkYkVycm9yXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiJdfQ==