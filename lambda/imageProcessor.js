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
    }
    catch (error) {
        console.error('Processing failed:', error);
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1hZ2VQcm9jZXNzb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbWFnZVByb2Nlc3Nvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxvREFBZ0U7QUFPaEUsTUFBTSxTQUFTLEdBQUcsSUFBSSxzQkFBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLElBQUksRUFBRSxDQUFDO0FBRXBELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFtQixFQUFpQixFQUFFO0lBQ2xFLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXJDLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixRQUFRLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXRFLCtCQUErQjtRQUMvQixNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ2xCLElBQUksMkJBQWMsQ0FBQztZQUNqQixRQUFRLEVBQUUsU0FBUztZQUNuQixPQUFPLEVBQUUsaUNBQWlDLFFBQVEsRUFBRTtTQUNyRCxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3QyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBakJXLFFBQUEsT0FBTyxXQWlCbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTTlNDbGllbnQsIFB1Ymxpc2hDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNucyc7XG5cbmludGVyZmFjZSBJbWFnZVJlcXVlc3Qge1xuICBpbWFnZUtleTogc3RyaW5nO1xuICBtZXRhZGF0YTogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuY29uc3Qgc25zQ2xpZW50ID0gbmV3IFNOU0NsaWVudCh7fSk7XG5jb25zdCBUT1BJQ19BUk4gPSBwcm9jZXNzLmVudi5OT1RJRklDQVRJT05fVE9QSUNfQVJOIHx8ICcnO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogSW1hZ2VSZXF1ZXN0KTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBpbWFnZUtleSwgbWV0YWRhdGEgfSA9IGV2ZW50O1xuXG4gICAgLy8gU2ltdWxhdGUgaW1hZ2UgcHJvY2Vzc2luZ1xuICAgIGNvbnNvbGUubG9nKGBQcm9jZXNzaW5nIGltYWdlOiAke2ltYWdlS2V5fSB3aXRoIG1ldGFkYXRhOmAsIG1ldGFkYXRhKTtcblxuICAgIC8vIFB1Ymxpc2ggc3VjY2VzcyBub3RpZmljYXRpb25cbiAgICBhd2FpdCBzbnNDbGllbnQuc2VuZChcbiAgICAgIG5ldyBQdWJsaXNoQ29tbWFuZCh7XG4gICAgICAgIFRvcGljQXJuOiBUT1BJQ19BUk4sXG4gICAgICAgIE1lc3NhZ2U6IGBTdWNjZXNzZnVsbHkgcHJvY2Vzc2VkIGltYWdlOiAke2ltYWdlS2V5fWAsXG4gICAgICB9KVxuICAgICk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignUHJvY2Vzc2luZyBmYWlsZWQ6JywgZXJyb3IpO1xuICB9XG59OyJdfQ==