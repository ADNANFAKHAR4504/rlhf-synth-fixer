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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaXQtZnVuY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhdWRpdC1mdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFTyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQzFCLEtBQWMsRUFDZCxPQUFnQixFQUNoQixRQUFrQixFQUNsQixFQUFFO0lBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0lBRWxELElBQUksQ0FBQztRQUNILEtBQUssTUFBTSxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25DLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUN6QyxNQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FDbEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQ3pDLENBQUM7WUFDRixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1lBRW5DLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7WUFFcEQsc0VBQXNFO1lBQ3RFLHlEQUF5RDtZQUN6RCxNQUFNLFFBQVEsR0FBRztnQkFDZixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ25DLFNBQVM7Z0JBQ1QsVUFBVTtnQkFDVixTQUFTO2dCQUNULElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJO2dCQUMzQixRQUFRLEVBQUUsTUFBTSxDQUFDLGlCQUFpQixFQUFFLGVBQWUsSUFBSSxTQUFTO2dCQUNoRSxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVksSUFBSSxTQUFTO2FBQy9DLENBQUM7WUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5FLDRCQUE0QjtZQUM1QixxREFBcUQ7WUFDckQsdUNBQXVDO1lBQ3ZDLHVDQUF1QztZQUN2Qyx5Q0FBeUM7UUFDM0MsQ0FBQztRQUVELFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDYixVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNuQixPQUFPLEVBQUUseUNBQXlDO2dCQUNsRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU07YUFDdkMsQ0FBQztTQUNILENBQUMsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RCxRQUFRLENBQUMsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7QUFDSCxDQUFDLENBQUM7QUFwRFcsUUFBQSxPQUFPLFdBb0RsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENhbGxiYWNrLCBDb250ZXh0LCBTM0V2ZW50IH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChcclxuICBldmVudDogUzNFdmVudCxcclxuICBjb250ZXh0OiBDb250ZXh0LFxyXG4gIGNhbGxiYWNrOiBDYWxsYmFja1xyXG4pID0+IHtcclxuICBjb25zb2xlLmxvZygnQXVkaXQgTGFtYmRhIHRyaWdnZXJlZCBieSBTMyBldmVudCcpO1xyXG5cclxuICB0cnkge1xyXG4gICAgZm9yIChjb25zdCByZWNvcmQgb2YgZXZlbnQuUmVjb3Jkcykge1xyXG4gICAgICBjb25zdCBidWNrZXROYW1lID0gcmVjb3JkLnMzLmJ1Y2tldC5uYW1lO1xyXG4gICAgICBjb25zdCBvYmplY3RLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoXHJcbiAgICAgICAgcmVjb3JkLnMzLm9iamVjdC5rZXkucmVwbGFjZSgvXFwrL2csICcgJylcclxuICAgICAgKTtcclxuICAgICAgY29uc3QgZXZlbnROYW1lID0gcmVjb3JkLmV2ZW50TmFtZTtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKGBQcm9jZXNzaW5nIFMzIGV2ZW50OiAke2V2ZW50TmFtZX1gKTtcclxuICAgICAgY29uc29sZS5sb2coYEJ1Y2tldDogJHtidWNrZXROYW1lfWApO1xyXG4gICAgICBjb25zb2xlLmxvZyhgT2JqZWN0OiAke29iamVjdEtleX1gKTtcclxuICAgICAgY29uc29sZS5sb2coYFNpemU6ICR7cmVjb3JkLnMzLm9iamVjdC5zaXplfSBieXRlc2ApO1xyXG5cclxuICAgICAgLy8gQXVkaXQgbG9nZ2luZyAtIGluIHByb2R1Y3Rpb24sIHRoaXMgd291bGQgd3JpdGUgdG8gQ2xvdWRXYXRjaCBMb2dzLFxyXG4gICAgICAvLyBzZW5kIHRvIGEgU0lFTSwgb3Igc3RvcmUgaW4gYSBkZWRpY2F0ZWQgYXVkaXQgZGF0YWJhc2VcclxuICAgICAgY29uc3QgYXVkaXRMb2cgPSB7XHJcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXHJcbiAgICAgICAgZXZlbnROYW1lLFxyXG4gICAgICAgIGJ1Y2tldE5hbWUsXHJcbiAgICAgICAgb2JqZWN0S2V5LFxyXG4gICAgICAgIHNpemU6IHJlY29yZC5zMy5vYmplY3Quc2l6ZSxcclxuICAgICAgICBzb3VyY2VJcDogcmVjb3JkLnJlcXVlc3RQYXJhbWV0ZXJzPy5zb3VyY2VJUEFkZHJlc3MgfHwgJ3Vua25vd24nLFxyXG4gICAgICAgIHVzZXJJZGVudGl0eTogcmVjb3JkLnVzZXJJZGVudGl0eSB8fCAndW5rbm93bicsXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnQXVkaXQgTG9nIEVudHJ5OicsIEpTT04uc3RyaW5naWZ5KGF1ZGl0TG9nLCBudWxsLCAyKSk7XHJcblxyXG4gICAgICAvLyBIZXJlIHlvdSB3b3VsZCB0eXBpY2FsbHk6XHJcbiAgICAgIC8vIDEuIFZhbGlkYXRlIHRoZSBvYmplY3QgbWVldHMgc2VjdXJpdHkgcmVxdWlyZW1lbnRzXHJcbiAgICAgIC8vIDIuIENoZWNrIGZvciBzZW5zaXRpdmUgZGF0YSBwYXR0ZXJuc1xyXG4gICAgICAvLyAzLiBMb2cgdG8gYSBjZW50cmFsaXplZCBhdWRpdCBzeXN0ZW1cclxuICAgICAgLy8gNC4gU2VuZCBhbGVydHMgZm9yIHN1c3BpY2lvdXMgYWN0aXZpdHlcclxuICAgIH1cclxuXHJcbiAgICBjYWxsYmFjayhudWxsLCB7XHJcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIG1lc3NhZ2U6ICdBdWRpdCBwcm9jZXNzaW5nIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIHByb2Nlc3NlZFJlY29yZHM6IGV2ZW50LlJlY29yZHMubGVuZ3RoLFxyXG4gICAgICB9KSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIGF1ZGl0IGV2ZW50OicsIGVycm9yKTtcclxuICAgIGNhbGxiYWNrKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKSk7XHJcbiAgfVxyXG59O1xyXG4iXX0=