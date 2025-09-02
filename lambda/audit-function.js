"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event, context, callback) => {
    console.log('Audit Lambda triggered by S3 event');
    try {
        for (const record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            const eventName = record.eventName;
            console.log(`Processing S3 event: ${eventName}`);
            console.log(`Bucket: ${bucketName}`);
            console.log(`Object: ${objectKey}`);
            console.log(`Size: ${record.s3.object.size} bytes`);
            // Audit logging - in production, this would write to CloudWatch Logs,
            // send to a SIEM, or store in a dedicated audit database
            const auditLog = {
                timestamp: new Date().toISOString(),
                eventName,
                bucketName,
                objectKey,
                size: record.s3.object.size,
                sourceIp: record.requestParameters?.sourceIPAddress || 'unknown',
                userIdentity: record.userIdentity || 'unknown',
            };
            console.log('Audit Log Entry:', JSON.stringify(auditLog, null, 2));
            // Here you would typically:
            // 1. Validate the object meets security requirements
            // 2. Check for sensitive data patterns
            // 3. Log to a centralized audit system
            // 4. Send alerts for suspicious activity
        }
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Audit processing completed successfully',
                processedRecords: event.Records.length,
            }),
        });
    }
    catch (error) {
        console.error('Error processing audit event:', error);
        callback(error instanceof Error ? error : new Error(String(error)));
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaXQtZnVuY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhdWRpdC1mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFTyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQzFCLEtBQWMsRUFDZCxPQUFnQixFQUNoQixRQUFrQixFQUNsQixFQUFFO0lBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBRWxELElBQUksQ0FBQztRQUNILEtBQUssTUFBTSxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25DLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUN6QyxNQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FDbEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQ3pDLENBQUM7WUFDRixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1lBRW5DLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7WUFFcEQsc0VBQXNFO1lBQ3RFLHlEQUF5RDtZQUN6RCxNQUFNLFFBQVEsR0FBRztnQkFDZixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ25DLFNBQVM7Z0JBQ1QsVUFBVTtnQkFDVixTQUFTO2dCQUNULElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJO2dCQUMzQixRQUFRLEVBQUUsTUFBTSxDQUFDLGlCQUFpQixFQUFFLGVBQWUsSUFBSSxTQUFTO2dCQUNoRSxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVksSUFBSSxTQUFTO2FBQy9DLENBQUM7WUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5FLDRCQUE0QjtZQUM1QixxREFBcUQ7WUFDckQsdUNBQXVDO1lBQ3ZDLHVDQUF1QztZQUN2Qyx5Q0FBeUM7UUFDM0MsQ0FBQztRQUVELFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDYixVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNuQixPQUFPLEVBQUUseUNBQXlDO2dCQUNsRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU07YUFDdkMsQ0FBQztTQUNILENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RCxRQUFRLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7QUFDSCxDQUFDLENBQUM7QUFwRFcsUUFBQSxPQUFPLFdBb0RsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFMzRXZlbnQsIENvbnRleHQsIENhbGxiYWNrIH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogUzNFdmVudCxcbiAgY29udGV4dDogQ29udGV4dCxcbiAgY2FsbGJhY2s6IENhbGxiYWNrXG4pID0+IHtcbiAgY29uc29sZS5sb2coJ0F1ZGl0IExhbWJkYSB0cmlnZ2VyZWQgYnkgUzMgZXZlbnQnKTtcblxuICB0cnkge1xuICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIGV2ZW50LlJlY29yZHMpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSByZWNvcmQuczMuYnVja2V0Lm5hbWU7XG4gICAgICBjb25zdCBvYmplY3RLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoXG4gICAgICAgIHJlY29yZC5zMy5vYmplY3Qua2V5LnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICApO1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gcmVjb3JkLmV2ZW50TmFtZTtcblxuICAgICAgY29uc29sZS5sb2coYFByb2Nlc3NpbmcgUzMgZXZlbnQ6ICR7ZXZlbnROYW1lfWApO1xuICAgICAgY29uc29sZS5sb2coYEJ1Y2tldDogJHtidWNrZXROYW1lfWApO1xuICAgICAgY29uc29sZS5sb2coYE9iamVjdDogJHtvYmplY3RLZXl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgU2l6ZTogJHtyZWNvcmQuczMub2JqZWN0LnNpemV9IGJ5dGVzYCk7XG5cbiAgICAgIC8vIEF1ZGl0IGxvZ2dpbmcgLSBpbiBwcm9kdWN0aW9uLCB0aGlzIHdvdWxkIHdyaXRlIHRvIENsb3VkV2F0Y2ggTG9ncyxcbiAgICAgIC8vIHNlbmQgdG8gYSBTSUVNLCBvciBzdG9yZSBpbiBhIGRlZGljYXRlZCBhdWRpdCBkYXRhYmFzZVxuICAgICAgY29uc3QgYXVkaXRMb2cgPSB7XG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBldmVudE5hbWUsXG4gICAgICAgIGJ1Y2tldE5hbWUsXG4gICAgICAgIG9iamVjdEtleSxcbiAgICAgICAgc2l6ZTogcmVjb3JkLnMzLm9iamVjdC5zaXplLFxuICAgICAgICBzb3VyY2VJcDogcmVjb3JkLnJlcXVlc3RQYXJhbWV0ZXJzPy5zb3VyY2VJUEFkZHJlc3MgfHwgJ3Vua25vd24nLFxuICAgICAgICB1c2VySWRlbnRpdHk6IHJlY29yZC51c2VySWRlbnRpdHkgfHwgJ3Vua25vd24nLFxuICAgICAgfTtcblxuICAgICAgY29uc29sZS5sb2coJ0F1ZGl0IExvZyBFbnRyeTonLCBKU09OLnN0cmluZ2lmeShhdWRpdExvZywgbnVsbCwgMikpO1xuXG4gICAgICAvLyBIZXJlIHlvdSB3b3VsZCB0eXBpY2FsbHk6XG4gICAgICAvLyAxLiBWYWxpZGF0ZSB0aGUgb2JqZWN0IG1lZXRzIHNlY3VyaXR5IHJlcXVpcmVtZW50c1xuICAgICAgLy8gMi4gQ2hlY2sgZm9yIHNlbnNpdGl2ZSBkYXRhIHBhdHRlcm5zXG4gICAgICAvLyAzLiBMb2cgdG8gYSBjZW50cmFsaXplZCBhdWRpdCBzeXN0ZW1cbiAgICAgIC8vIDQuIFNlbmQgYWxlcnRzIGZvciBzdXNwaWNpb3VzIGFjdGl2aXR5XG4gICAgfVxuXG4gICAgY2FsbGJhY2sobnVsbCwge1xuICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtZXNzYWdlOiAnQXVkaXQgcHJvY2Vzc2luZyBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgcHJvY2Vzc2VkUmVjb3JkczogZXZlbnQuUmVjb3Jkcy5sZW5ndGgsXG4gICAgICB9KSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIGF1ZGl0IGV2ZW50OicsIGVycm9yKTtcbiAgICBjYWxsYmFjayhlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSkpO1xuICB9XG59OyJdfQ==