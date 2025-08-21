"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup for AWS integration tests
const aws_sdk_1 = __importDefault(require("aws-sdk"));
// Set default region if not provided
if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = 'us-west-2';
}
// Configure AWS SDK
aws_sdk_1.default.config.update({
    region: process.env.AWS_REGION,
    maxRetries: 3,
});
// Increase timeout for integration tests
jest.setTimeout(60000);
// Global test setup
beforeAll(async () => {
    console.log(`🧪 Running integration tests in region: ${process.env.AWS_REGION}`);
    // Verify AWS credentials are available
    try {
        const sts = new aws_sdk_1.default.STS();
        const identity = await sts.getCallerIdentity().promise();
        console.log(`✅ AWS credentials verified for account: ${identity.Account}`);
    }
    catch (error) {
        console.warn('⚠️  AWS credentials not configured. Tests will fail.');
        console.warn('   Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION');
    }
});
// Global test teardown
afterAll(async () => {
    console.log('🧹 Integration tests completed');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHVDQUF1QztBQUN2QyxzREFBMEI7QUFFMUIscUNBQXFDO0FBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQzVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQztBQUN2QyxDQUFDO0FBRUQsb0JBQW9CO0FBQ3BCLGlCQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVO0lBQzlCLFVBQVUsRUFBRSxDQUFDO0NBQ2QsQ0FBQyxDQUFDO0FBRUgseUNBQXlDO0FBQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFdkIsb0JBQW9CO0FBQ3BCLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFFakYsdUNBQXVDO0lBQ3ZDLElBQUksQ0FBQztRQUNILE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMxQixNQUFNLFFBQVEsR0FBRyxNQUFNLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLElBQUksQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO1FBQ3JFLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUVBQWlFLENBQUMsQ0FBQztJQUNsRixDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFFSCx1QkFBdUI7QUFDdkIsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO0lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRlc3Qgc2V0dXAgZm9yIEFXUyBpbnRlZ3JhdGlvbiB0ZXN0c1xyXG5pbXBvcnQgQVdTIGZyb20gJ2F3cy1zZGsnO1xyXG5cclxuLy8gU2V0IGRlZmF1bHQgcmVnaW9uIGlmIG5vdCBwcm92aWRlZFxyXG5pZiAoIXByb2Nlc3MuZW52LkFXU19SRUdJT04pIHtcclxuICBwcm9jZXNzLmVudi5BV1NfUkVHSU9OID0gJ3VzLXdlc3QtMic7XHJcbn1cclxuXHJcbi8vIENvbmZpZ3VyZSBBV1MgU0RLXHJcbkFXUy5jb25maWcudXBkYXRlKHtcclxuICByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04sXHJcbiAgbWF4UmV0cmllczogMyxcclxufSk7XHJcblxyXG4vLyBJbmNyZWFzZSB0aW1lb3V0IGZvciBpbnRlZ3JhdGlvbiB0ZXN0c1xyXG5qZXN0LnNldFRpbWVvdXQoNjAwMDApO1xyXG5cclxuLy8gR2xvYmFsIHRlc3Qgc2V0dXBcclxuYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLmxvZyhg8J+nqiBSdW5uaW5nIGludGVncmF0aW9uIHRlc3RzIGluIHJlZ2lvbjogJHtwcm9jZXNzLmVudi5BV1NfUkVHSU9OfWApO1xyXG4gIFxyXG4gIC8vIFZlcmlmeSBBV1MgY3JlZGVudGlhbHMgYXJlIGF2YWlsYWJsZVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBzdHMgPSBuZXcgQVdTLlNUUygpO1xyXG4gICAgY29uc3QgaWRlbnRpdHkgPSBhd2FpdCBzdHMuZ2V0Q2FsbGVySWRlbnRpdHkoKS5wcm9taXNlKCk7XHJcbiAgICBjb25zb2xlLmxvZyhg4pyFIEFXUyBjcmVkZW50aWFscyB2ZXJpZmllZCBmb3IgYWNjb3VudDogJHtpZGVudGl0eS5BY2NvdW50fWApO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ+KaoO+4jyAgQVdTIGNyZWRlbnRpYWxzIG5vdCBjb25maWd1cmVkLiBUZXN0cyB3aWxsIGZhaWwuJyk7XHJcbiAgICBjb25zb2xlLndhcm4oJyAgIFNldCBBV1NfQUNDRVNTX0tFWV9JRCwgQVdTX1NFQ1JFVF9BQ0NFU1NfS0VZLCBhbmQgQVdTX1JFR0lPTicpO1xyXG4gIH1cclxufSk7XHJcblxyXG4vLyBHbG9iYWwgdGVzdCB0ZWFyZG93blxyXG5hZnRlckFsbChhc3luYyAoKSA9PiB7XHJcbiAgY29uc29sZS5sb2coJ/Cfp7kgSW50ZWdyYXRpb24gdGVzdHMgY29tcGxldGVkJyk7XHJcbn0pO1xyXG4iXX0=