"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_sns_1 = require("@aws-sdk/client-sns");
const snsClient = new client_sns_1.SNSClient({});
const TOPIC_ARN = process.env.NOTIFICATION_TOPIC_ARN || '';
const handler = async (event) => {
    try {
        const { imageKey, metadata } = event;
        // Simulate image processing
        console.log(`Processing image: ${imageKey} with metadata:`, metadata);
        // Publish success notification
        await snsClient.send(new client_sns_1.PublishCommand({
            TopicArn: TOPIC_ARN,
            Message: `Successfully processed image: ${imageKey}`,
        }));
        // ✅ Return success to API Gateway
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Image processed successfully' }),
        };
    }
    catch (error) {
        console.error('Processing failed:', error);
        // ❗️Return failure with proper status code
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Processing failed', error: error.message }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VQcm9jZXNzb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbWFnZVByb2Nlc3Nvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxvREFBZ0U7QUFPaEUsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLElBQUksRUFBRSxDQUFDO0FBRXBELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFtQixFQUFnQixFQUFFO0lBQ2pFLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXJDLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixRQUFRLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXRFLCtCQUErQjtRQUMvQixNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ2xCLElBQUksMkJBQWMsQ0FBQztZQUNqQixRQUFRLEVBQUUsU0FBUztZQUNuQixPQUFPLEVBQUUsaUNBQWlDLFFBQVEsRUFBRTtTQUNyRCxDQUFDLENBQ0gsQ0FBQztRQUVGLGtDQUFrQztRQUNsQyxPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxDQUFDO1NBQ2xFLENBQUM7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0MsMkNBQTJDO1FBQzNDLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRyxLQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDdEYsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUE3QlcsUUFBQSxPQUFPLFdBNkJsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNOU0NsaWVudCwgUHVibGlzaENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtc25zJztcblxuaW50ZXJmYWNlIEltYWdlUmVxdWVzdCB7XG4gIGltYWdlS2V5OiBzdHJpbmc7XG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5jb25zdCBzbnNDbGllbnQgPSBuZXcgU05TQ2xpZW50KHt9KTtcbmNvbnN0IFRPUElDX0FSTiA9IHByb2Nlc3MuZW52Lk5PVElGSUNBVElPTl9UT1BJQ19BUk4gfHwgJyc7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBJbWFnZVJlcXVlc3QpOiBQcm9taXNlPGFueT4gPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHsgaW1hZ2VLZXksIG1ldGFkYXRhIH0gPSBldmVudDtcblxuICAgIC8vIFNpbXVsYXRlIGltYWdlIHByb2Nlc3NpbmdcbiAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyBpbWFnZTogJHtpbWFnZUtleX0gd2l0aCBtZXRhZGF0YTpgLCBtZXRhZGF0YSk7XG5cbiAgICAvLyBQdWJsaXNoIHN1Y2Nlc3Mgbm90aWZpY2F0aW9uXG4gICAgYXdhaXQgc25zQ2xpZW50LnNlbmQoXG4gICAgICBuZXcgUHVibGlzaENvbW1hbmQoe1xuICAgICAgICBUb3BpY0FybjogVE9QSUNfQVJOLFxuICAgICAgICBNZXNzYWdlOiBgU3VjY2Vzc2Z1bGx5IHByb2Nlc3NlZCBpbWFnZTogJHtpbWFnZUtleX1gLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8g4pyFIFJldHVybiBzdWNjZXNzIHRvIEFQSSBHYXRld2F5XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ0ltYWdlIHByb2Nlc3NlZCBzdWNjZXNzZnVsbHknIH0pLFxuICAgIH07XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdQcm9jZXNzaW5nIGZhaWxlZDonLCBlcnJvcik7XG4gICAgLy8g4p2X77iPUmV0dXJuIGZhaWx1cmUgd2l0aCBwcm9wZXIgc3RhdHVzIGNvZGVcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnUHJvY2Vzc2luZyBmYWlsZWQnLCBlcnJvcjogKGVycm9yIGFzIGFueSkubWVzc2FnZSB9KSxcbiAgICB9O1xuICB9XG59O1xuIl19