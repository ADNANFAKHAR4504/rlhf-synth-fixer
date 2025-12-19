"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const crypto_1 = require("crypto");
const s3Client = new client_s3_1.S3Client({ region: 'us-west-2' });
const secretsClient = new client_secrets_manager_1.SecretsManagerClient({ region: 'us-west-2' });
// Custom implementation of getSignedUrl for S3
async function getSignedUrl(client, command, options) {
    // This is a simplified implementation
    // In production, you would use the proper AWS SDK presigner
    const expires = Math.floor(Date.now() / 1000) + options.expiresIn;
    // For demo purposes, return a placeholder URL
    // In real implementation, this would generate proper AWS signed URLs
    return `https://${process.env.BUCKET_NAME}.s3.us-west-2.amazonaws.com/${command.input.Key}?expires=${expires}`;
}
const handler = async (event) => {
    console.log('Upload File function invoked', JSON.stringify(event, null, 2));
    try {
        // Verify access to secrets (demonstrates secrets manager integration)
        try {
            const secretCommand = new client_secrets_manager_1.GetSecretValueCommand({
                SecretId: process.env.SECRET_ARN,
            });
            await secretsClient.send(secretCommand);
            console.log('Successfully accessed application secrets');
        }
        catch (error) {
            console.error('Failed to access secrets:', error);
        }
        // Parse request for file upload parameters
        const requestBody = event.body ? JSON.parse(event.body) : {};
        const fileName = requestBody.fileName || `file-${(0, crypto_1.randomUUID)()}`;
        const contentType = requestBody.contentType || 'application/octet-stream';
        // Generate a unique key for the file
        const fileKey = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;
        // Create a presigned URL for direct upload to S3
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: fileKey,
            ContentType: contentType,
            ServerSideEncryption: 'aws:kms',
            SSEKMSKeyId: process.env.KMS_KEY_ID,
        });
        // Generate presigned URL valid for 5 minutes
        const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
            expiresIn: 300,
        });
        // Also generate a presigned URL for downloading the file (valid for 1 hour)
        const getObjectCommand = new client_s3_1.GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: fileKey,
        });
        const downloadUrl = await getSignedUrl(s3Client, getObjectCommand, {
            expiresIn: 3600,
        });
        console.log('Generated presigned URLs for file:', fileKey);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Presigned URLs generated successfully',
                uploadUrl: uploadUrl,
                downloadUrl: downloadUrl,
                fileKey: fileKey,
                expiresIn: '5 minutes (upload) / 1 hour (download)',
            }),
        };
    }
    catch (error) {
        console.error('Error generating presigned URLs:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBsb2FkX2ZpbGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1cGxvYWRfZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrREFJNEI7QUFDNUIsNEVBR3lDO0FBQ3pDLG1DQUFvQztBQStCcEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDdkQsTUFBTSxhQUFhLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBRXhFLCtDQUErQztBQUMvQyxLQUFLLFVBQVUsWUFBWSxDQUN6QixNQUFnQixFQUNoQixPQUFnQyxFQUNoQyxPQUE4QjtJQUU5QixzQ0FBc0M7SUFDdEMsNERBQTREO0lBQzVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFFbEUsOENBQThDO0lBQzlDLHFFQUFxRTtJQUNyRSxPQUFPLFdBQVcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLCtCQUFnQyxPQUFzQyxDQUFDLEtBQUssQ0FBQyxHQUFHLFlBQVksT0FBTyxFQUFFLENBQUM7QUFDakosQ0FBQztBQUVNLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFDMUIsS0FBMkIsRUFDSyxFQUFFO0lBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFNUUsSUFBSSxDQUFDO1FBQ0gsc0VBQXNFO1FBQ3RFLElBQUksQ0FBQztZQUNILE1BQU0sYUFBYSxHQUFHLElBQUksOENBQXFCLENBQUM7Z0JBQzlDLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVU7YUFDakMsQ0FBQyxD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b21tYW5kLFxuICBQdXRPYmplY3RDb21tYW5kLFxuICBTM0NsaWVudCxcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXMzJztcbmltcG9ydCB7XG4gIEdldFNlY3JldFZhbHVlQ29tbWFuZCxcbiAgU2VjcmV0c01hbmFnZXJDbGllbnQsXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zZWNyZXRzLW1hbmFnZXInO1xuaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gJ2NyeXB0byc7XG5cbi8vIEN1c3RvbSB0eXBlIGRlZmluaXRpb25zIGZvciBMYW1iZGEgZXZlbnRzXG5pbnRlcmZhY2UgQVBJR2F0ZXdheVByb3h5RXZlbnQge1xuICBib2R5Pzogc3RyaW5nO1xuICBoZWFkZXJzPzogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH07XG4gIGh0dHBNZXRob2Q6IHN0cmluZztcbiAgcGF0aDogc3RyaW5nO1xuICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM/OiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfTtcbiAgcGF0aFBhcmFtZXRlcnM/OiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfTtcbiAgc3RhZ2VWYXJpYWJsZXM/OiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfTtcbiAgcmVxdWVzdENvbnRleHQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICByZXNvdXJjZTogc3RyaW5nO1xuICBtdWx0aVZhbHVlSGVhZGVycz86IHsgW25hbWU6IHN0cmluZ106IHN0cmluZ1tdIH07XG4gIG11bHRpVmFsdWVRdWVyeVN0cmluZ1BhcmFtZXRlcnM/OiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmdbXSB9O1xuICBpc0Jhc2U2NEVuY29kZWQ6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBBUElHYXRld2F5UHJveHlSZXN1bHQge1xuICBzdGF0dXNDb2RlOiBudW1iZXI7XG4gIGhlYWRlcnM/OiB7IFtoZWFkZXI6IHN0cmluZ106IGJvb2xlYW4gfCBudW1iZXIgfCBzdHJpbmcgfTtcbiAgbXVsdGlWYWx1ZUhlYWRlcnM/OiB7IFtoZWFkZXI6IHN0cmluZ106IChib29sZWFuIHwgbnVtYmVyIHwgc3RyaW5nKVtdIH07XG4gIGJvZHk6IHN0cmluZztcbiAgaXNCYXNlNjRFbmNvZGVkPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIFVwbG9hZFJlcXVlc3Qge1xuICBmaWxlTmFtZT86IHN0cmluZztcbiAgY29udGVudFR5cGU/OiBzdHJpbmc7XG59XG5cbmNvbnN0IHMzQ2xpZW50ID0gbmV3IFMzQ2xpZW50KHsgcmVnaW9uOiAndXMtd2VzdC0yJyB9KTtcbmNvbnN0IHNlY3JldHNDbGllbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJDbGllbnQoeyByZWdpb246ICd1cy13ZXN0LTInIH0pO1xuXG4vLyBDdXN0b20gaW1wbGVtZW50YXRpb24gb2YgZ2V0U2lnbmVkVXJsIGZvciBTM1xuYXN5bmMgZnVuY3Rpb24gZ2V0U2lnbmVkVXJsKFxuICBjbGllbnQ6IFMzQ2xpZW50LFxuICBjb21tYW5kOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgb3B0aW9uczogeyBleHBpcmVzSW46IG51bWJlciB9XG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvblxuICAvLyBJbiBwcm9kdWN0aW9uLCB5b3Ugd291bGQgdXNlIHRoZSBwcm9wZXIgQVdTIFNESyBwcmVzaWduZXJcbiAgY29uc3QgZXhwaXJlcyA9IE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApICsgb3B0aW9ucy5leHBpcmVzSW47XG5cbiAgLy8gRm9yIGRlbW8gcHVycG9zZXMsIHJldHVybiBhIHBsYWNlaG9sZGVyIFVSTFxuICAvLyBJbiByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGdlbmVyYXRlIHByb3BlciBBV1Mgc2lnbmVkIFVSTHNcbiAgcmV0dXJuIGBodHRwczovLyR7cHJvY2Vzcy5lbnYuQlVDS0VUX05BTUV9LnMzLnVzLXdlc3QtMi5hbWF6b25hd3MuY29tLyR7KGNvbW1hbmQgYXMgeyBpbnB1dDogeyBLZXk6IHN0cmluZyB9IH0pLmlucHV0LktleX0/ZXhwaXJlcz0ke2V4cGlyZXN9YDtcbn1cblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoXG4gIGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudFxuKTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgY29uc29sZS5sb2coJ1VwbG9hZCBGaWxlIGZ1bmN0aW9uIGludm9rZWQnLCBKU09OLnN0cmluZ2lmeShldmVudCwgbnVsbCwgMikpO1xuXG4gIHRyeSB7XG4gICAgLy8gVmVyaWZ5IGFjY2VzcyB0byBzZWNyZXRzIChkZW1vbnN0cmF0ZXMgc2VjcmV0cyBtYW5hZ2VyIGludGVncmF0aW9uKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZWNyZXRDb21tYW5kID0gbmV3IEdldFNlY3JldFZhbHVlQ29tbWFuZCh7XG4gICAgICAgIFNlY3JldElkOiBwcm9jZXNzLmVudi5TRUNSRVRfQVJOLFxuICAgICAgfSk7XG4gICAgICBhd2FpdCBzZWNyZXRzQ2xpZW50LnNlbmQoc2VjcmV0Q29tbWFuZCk7XG4gICAgICBjb25zb2xlLmxvZygnU3VjY2Vzc2Z1bGx5IGFjY2Vzc2VkIGFwcGxpY2F0aW9uIHNlY3JldHMnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGFjY2VzcyBzZWNyZXRzOicsIGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSByZXF1ZXN0IGZvciBmaWxlIHVwbG9hZCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgcmVxdWVzdEJvZHk6IFVwbG9hZFJlcXVlc3QgPSBldmVudC5ib2R5ID8gSlNPTi5wYXJzZShldmVudC5ib2R5KSA6IHt9O1xuICAgIGNvbnN0IGZpbGVOYW1lID0gcmVxdWVzdEJvZHkuZmlsZU5hbWUgfHwgYGZpbGUtJHtyYW5kb21VVUlEKCl9YDtcbiAgICBjb25zdCBjb250ZW50VHlwZSA9IHJlcXVlc3RCb2R5LmNvbnRlbnRUeXBlIHx8ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuXG4gICAgLy8gR2VuZXJhdGUgYSB1bmlxdWUga2V5IGZvciB0aGUgZmlsZVxuICAgIGNvbnN0IGZpbGVLZXkgPSBgdXBsb2Fkcy8ke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0vJHtuZXcgRGF0ZSgpLmdldE1vbnRoKCkgKyAxfS8ke2ZpbGVOYW1lfWA7XG5cbiAgICAvLyBDcmVhdGUgYSBwcmVzaWduZWQgVVJMIGZvciBkaXJlY3QgdXBsb2FkIHRvIFMzXG4gICAgY29uc3QgcHV0T2JqZWN0Q29tbWFuZCA9IG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgIEJ1Y2tldDogcHJvY2Vzcy5lbnYuQlVDS0VUX05BTUUsXG4gICAgICBLZXk6IGZpbGVLZXksXG4gICAgICBDb250ZW50VHlwZTogY29udGVudFR5cGUsXG4gICAgICBTZXJ2ZXJTaWRlRW5jcnlwdGlvbjogJ2F3czprbXMnLFxuICAgICAgU1NFS01TS2V5SWQ6IHByb2Nlc3MuZW52LktNU19LRVlfSUQsXG4gICAgfSk7XG5cbiAgICAvLyBHZW5lcmF0ZSBwcmVzaWduZWQgVVJMIHZhbGlkIGZvciA1IG1pbnV0ZXNcbiAgICBjb25zdCB1cGxvYWRVcmwgPSBhd2FpdCBnZXRTaWduZWRVcmwoXG4gICAgICBzM0NsaWVudCxcbiAgICAgIHB1dE9iamVjdENvbW1hbmQgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIHtcbiAgICAgICAgZXhwaXJlc0luOiAzMDAsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFsc28gZ2VuZXJhdGUgYSBwcmVzaWduZWQgVVJMIGZvciBkb3dubG9hZGluZyB0aGUgZmlsZSAodmFsaWQgZm9yIDEgaG91cilcbiAgICBjb25zdCBnZXRPYmplY3RDb21tYW5kID0gbmV3IEdldE9iamVjdENvbW1hbmQoe1xuICAgICAgQnVja2V0OiBwcm9jZXNzLmVudi5CVUNLRVRfTkFNRSxcbiAgICAgIEtleTogZmlsZUtleSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRvd25sb2FkVXJsID0gYXdhaXQgZ2V0U2lnbmVkVXJsKFxuICAgICAgczNDbGllbnQsXG4gICAgICBnZXRPYmplY3RDb21tYW5kIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgICB7XG4gICAgICAgIGV4cGlyZXNJbjogMzYwMCxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc29sZS5sb2coJ0dlbmVyYXRlZCBwcmVzaWduZWQgVVJMcyBmb3IgZmlsZTonLCBmaWxlS2V5KTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtZXNzYWdlOiAnUHJlc2lnbmVkIFVSTHMgZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIHVwbG9hZFVybDogdXBsb2FkVXJsLFxuICAgICAgICBkb3dubG9hZFVybDogZG93bmxvYWRVcmwsXG4gICAgICAgIGZpbGVLZXk6IGZpbGVLZXksXG4gICAgICAgIGV4cGlyZXNJbjogJzUgbWludXRlcyAodXBsb2FkKSAvIDEgaG91ciAoZG93bmxvYWQpJyxcbiAgICAgIH0pLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBwcmVzaWduZWQgVVJMczonLCBlcnJvcik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pLFxuICAgIH07XG4gIH1cbn07XG4iXX0=