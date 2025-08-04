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
            body: JSON.stringify({
                message: 'Processing failed',
                error: error.message,
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VQcm9jZXNzb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbWFnZVByb2Nlc3Nvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxvREFBZ0U7QUFZaEUsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLElBQUksRUFBRSxDQUFDO0FBRXBELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFDMUIsS0FBbUIsRUFDVSxFQUFFO0lBQy9CLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXJDLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixRQUFRLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXRFLCtCQUErQjtRQUMvQixNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ2xCLElBQUksMkJBQWMsQ0FBQztZQUNqQixRQUFRLEVBQUUsU0FBUztZQUNuQixPQUFPLEVBQUUsaUNBQWlDLFFBQVEsRUFBRTtTQUNyRCxDQUFDLENBQ0gsQ0FBQztRQUVGLGtDQUFrQztRQUNsQyxPQUFPO1lBQ0wsVUFBVSxFQUFFLEdBQUc7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSw4QkFBOEIsRUFBRSxDQUFDO1NBQ2xFLENBQUM7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0MsMkNBQTJDO1FBQzNDLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNuQixPQUFPLEVBQUUsbUJBQW1CO2dCQUM1QixLQUFLLEVBQUcsS0FBZSxDQUFDLE9BQU87YUFDaEMsQ0FBQztTQUNILENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBakNXLFFBQUEsT0FBTyxXQWlDbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTTlNDbGllbnQsIFB1Ymxpc2hDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNucyc7XHJcblxyXG5pbnRlcmZhY2UgSW1hZ2VSZXF1ZXN0IHtcclxuICBpbWFnZUtleTogc3RyaW5nO1xyXG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQXBpR2F0ZXdheVJlc3BvbnNlIHtcclxuICBzdGF0dXNDb2RlOiBudW1iZXI7XHJcbiAgYm9keTogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBzbnNDbGllbnQgPSBuZXcgU05TQ2xpZW50KHt9KTtcclxuY29uc3QgVE9QSUNfQVJOID0gcHJvY2Vzcy5lbnYuTk9USUZJQ0FUSU9OX1RPUElDX0FSTiB8fCAnJztcclxuXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxyXG4gIGV2ZW50OiBJbWFnZVJlcXVlc3RcclxuKTogUHJvbWlzZTxBcGlHYXRld2F5UmVzcG9uc2U+ID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBpbWFnZUtleSwgbWV0YWRhdGEgfSA9IGV2ZW50O1xyXG5cclxuICAgIC8vIFNpbXVsYXRlIGltYWdlIHByb2Nlc3NpbmdcclxuICAgIGNvbnNvbGUubG9nKGBQcm9jZXNzaW5nIGltYWdlOiAke2ltYWdlS2V5fSB3aXRoIG1ldGFkYXRhOmAsIG1ldGFkYXRhKTtcclxuXHJcbiAgICAvLyBQdWJsaXNoIHN1Y2Nlc3Mgbm90aWZpY2F0aW9uXHJcbiAgICBhd2FpdCBzbnNDbGllbnQuc2VuZChcclxuICAgICAgbmV3IFB1Ymxpc2hDb21tYW5kKHtcclxuICAgICAgICBUb3BpY0FybjogVE9QSUNfQVJOLFxyXG4gICAgICAgIE1lc3NhZ2U6IGBTdWNjZXNzZnVsbHkgcHJvY2Vzc2VkIGltYWdlOiAke2ltYWdlS2V5fWAsXHJcbiAgICAgIH0pXHJcbiAgICApO1xyXG5cclxuICAgIC8vIOKchSBSZXR1cm4gc3VjY2VzcyB0byBBUEkgR2F0ZXdheVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdHVzQ29kZTogMjAwLFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6ICdJbWFnZSBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5JyB9KSxcclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1Byb2Nlc3NpbmcgZmFpbGVkOicsIGVycm9yKTtcclxuICAgIC8vIOKdl++4j1JldHVybiBmYWlsdXJlIHdpdGggcHJvcGVyIHN0YXR1cyBjb2RlXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBzdGF0dXNDb2RlOiA1MDAsXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcclxuICAgICAgICBtZXNzYWdlOiAnUHJvY2Vzc2luZyBmYWlsZWQnLFxyXG4gICAgICAgIGVycm9yOiAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UsXHJcbiAgICAgIH0pLFxyXG4gICAgfTtcclxuICB9XHJcbn07XHJcbiJdfQ==