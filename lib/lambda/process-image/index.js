"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const sharp_1 = __importDefault(require("sharp"));
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
});
const THUMBNAIL_BUCKET = process.env.THUMBNAIL_BUCKET || '';
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;
/**
 * Converts a readable stream to a buffer
 */
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}
/**
 * Lambda handler for processing S3 image uploads
 */
const handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    for (const record of event.Records) {
        const sourceBucket = record.s3.bucket.name;
        const sourceKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        console.log(`Processing image: ${sourceKey} from bucket: ${sourceBucket}`);
        try {
            // Validate thumbnail bucket configuration
            if (!THUMBNAIL_BUCKET) {
                throw new Error('THUMBNAIL_BUCKET environment variable is not set');
            }
            // Get the original image from S3
            const getObjectCommand = new client_s3_1.GetObjectCommand({
                Bucket: sourceBucket,
                Key: sourceKey,
            });
            const response = await s3Client.send(getObjectCommand);
            if (!response.Body) {
                throw new Error('Empty response body from S3');
            }
            // Convert stream to buffer
            const imageBuffer = await streamToBuffer(response.Body);
            console.log(`Image size: ${imageBuffer.length} bytes`);
            // Validate image file
            if (imageBuffer.length === 0) {
                throw new Error('Image file is empty');
            }
            // Generate thumbnail using Sharp
            const thumbnailBuffer = await (0, sharp_1.default)(imageBuffer)
                .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .jpeg({ quality: 85 })
                .toBuffer();
            console.log(`Thumbnail size: ${thumbnailBuffer.length} bytes`);
            // Generate thumbnail key (add 'thumb-' prefix)
            const thumbnailKey = `thumb-${sourceKey}`;
            // Upload thumbnail to destination bucket
            const putObjectCommand = new client_s3_1.PutObjectCommand({
                Bucket: THUMBNAIL_BUCKET,
                Key: thumbnailKey,
                Body: thumbnailBuffer,
                ContentType: 'image/jpeg',
                Metadata: {
                    'original-key': sourceKey,
                    'original-bucket': sourceBucket,
                    'processed-at': new Date().toISOString(),
                },
            });
            await s3Client.send(putObjectCommand);
            console.log(`Successfully created thumbnail: ${thumbnailKey} in bucket: ${THUMBNAIL_BUCKET}`);
        }
        catch (error) {
            console.error('Error processing image:', error);
            // Log detailed error information
            if (error instanceof Error) {
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            // Re-throw to mark Lambda execution as failed
            throw error;
        }
    }
    console.log('All images processed successfully');
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSxrREFJNEI7QUFDNUIsa0RBQTBCO0FBRzFCLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQztJQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksV0FBVztDQUM5QyxDQUFDLENBQUM7QUFDSCxNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLElBQUksRUFBRSxDQUFDO0FBQzVELE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQztBQUM1QixNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQztBQUU3Qjs7R0FFRztBQUNILEtBQUssVUFBVSxjQUFjLENBQUMsTUFBZ0I7SUFDNUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDNUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDL0MsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOztHQUVHO0FBQ0ksTUFBTSxPQUFPLEdBQWMsS0FBSyxFQUFFLEtBQWMsRUFBaUIsRUFBRTtJQUN4RSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLElBQUks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S0FBSyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQy9DLE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsOENBQThDO1lBQzlDLE1BQU0sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7QUFDbkQsQ0FBQyxDQUFDO0FBdkZXLFFBQUEsT0FBTyxXQXVGbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTM0V2ZW50LCBTM0hhbmRsZXIgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7XG4gIFMzQ2xpZW50LFxuICBHZXRPYmplY3RDb21tYW5kLFxuICBQdXRPYmplY3RDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtczMnO1xuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcbmltcG9ydCB7IFJlYWRhYmxlIH0gZnJvbSAnc3RyZWFtJztcblxuY29uc3QgczNDbGllbnQgPSBuZXcgUzNDbGllbnQoe1xuICByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMScsXG59KTtcbmNvbnN0IFRIVU1CTkFJTF9CVUNLRVQgPSBwcm9jZXNzLmVudi5USFVNQk5BSUxfQlVDS0VUIHx8ICcnO1xuY29uc3QgVEhVTUJOQUlMX1dJRFRIID0gMjAwO1xuY29uc3QgVEhVTUJOQUlMX0hFSUdIVCA9IDIwMDtcblxuLyoqXG4gKiBDb252ZXJ0cyBhIHJlYWRhYmxlIHN0cmVhbSB0byBhIGJ1ZmZlclxuICovXG5hc3luYyBmdW5jdGlvbiBzdHJlYW1Ub0J1ZmZlcihzdHJlYW06IFJlYWRhYmxlKTogUHJvbWlzZTxCdWZmZXI+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gICAgc3RyZWFtLm9uKCdkYXRhJywgY2h1bmsgPT4gY2h1bmtzLnB1c2goY2h1bmspKTtcbiAgICBzdHJlYW0ub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICBzdHJlYW0ub24oJ2VuZCcsICgpID0+IHJlc29sdmUoQnVmZmVyLmNvbmNhdChjaHVua3MpKSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBwcm9jZXNzaW5nIFMzIGltYWdlIHVwbG9hZHNcbiAqL1xuZXhwb3J0IGNvbnN0IGhhbmRsZXI6IFMzSGFuZGxlciA9IGFzeW5jIChldmVudDogUzNFdmVudCk6IFByb21pc2U8dm9pZD4gPT4ge1xuICBjb25zb2xlLmxvZygnRXZlbnQgcmVjZWl2ZWQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcblxuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBldmVudC5SZWNvcmRzKSB7XG4gICAgY29uc3Qgc291cmNlQnVja2V0ID0gcmVjb3JkLnMzLmJ1Y2tldC5uYW1lO1xuICAgIGNvbnN0IHNvdXJjZUtleSA9IGRlY29kZVVSSUNvbXBvbmVudChcbiAgICAgIHJlY29yZC5zMy5vYmplY3Qua2V5LnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgKTtcblxuICAgIGNvbnNvbGUubG9nKGBQcm9jZXNzaW5nIGltYWdlOiAke3NvdXJjZUtleX0gZnJvbSBidWNrZXQ6ICR7c291cmNlQnVja2V0fWApO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIHRodW1ibmFpbCBidWNrZXQgY29uZmlndXJhdGlvblxuICAgICAgaWYgKCFUSFVNQk5BSUxfQlVDS0VUKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVEhVTUJOQUlMX0JVQ0tFVCBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBub3Qgc2V0Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgb3JpZ2luYWwgaW1hZ2UgZnJvbSBTM1xuICAgICAgY29uc3QgZ2V0T2JqZWN0Q29tbWFuZCA9IG5ldyBHZXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgQnVja2V0OiBzb3VyY2VCdWNrZXQsXG4gICAgICAgIEtleTogc291cmNlS2V5LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgczNDbGllbnQuc2VuZChnZXRPYmplY3RDb21tYW5kKTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5Cb2R5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRW1wdHkgcmVzcG9uc2UgYm9keSBmcm9tIFMzJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbnZlcnQgc3RyZWFtIHRvIGJ1ZmZlclxuICAgICAgY29uc3QgaW1hZ2VCdWZmZXIgPSBhd2FpdCBzdHJlYW1Ub0J1ZmZlcihyZXNwb25zZS5Cb2R5IGFzIFJlYWRhYmxlKTtcblxuICAgICAgY29uc29sZS5sb2coYEltYWdlIHNpemU6ICR7aW1hZ2VCdWZmZXIubGVuZ3RofSBieXRlc2ApO1xuXG4gICAgICAvLyBWYWxpZGF0ZSBpbWFnZSBmaWxlXG4gICAgICBpZiAoaW1hZ2VCdWZmZXIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW1hZ2UgZmlsZSBpcyBlbXB0eScpO1xuICAgICAgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSB0aHVtYm5haWwgdXNpbmcgU2hhcnBcbiAgICAgIGNvbnN0IHRodW1ibmFpbEJ1ZmZlciA9IGF3YWl0IHNoYXJwKGltYWdlQnVmZmVyKVxuICAgICAgICAucmVzaXplKFRIVU1CTkFJTF9XSURUSCwgVEhVTUJOQUlMX0hFSUdIVCwge1xuICAgICAgICAgIGZpdDogJ2luc2lkZScsXG4gICAgICAgICAgd2l0aG91dEVubGFyZ2VtZW50OiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgICAuanBlZyh7IHF1YWxpdHk6IDg1IH0pXG4gICAgICAgIC50b0J1ZmZlcigpO1xuXG4gICAgICBjb25zb2xlLmxvZyhgVGh1bWJuYWlsIHNpemU6ICR7dGh1bWJuYWlsQnVmZmVyLmxlbmd0aH0gYnl0ZXNgKTtcblxuICAgICAgLy8gR2VuZXJhdGUgdGh1bWJuYWlsIGtleSAoYWRkICd0aHVtYi0nIHByZWZpeClcbiAgICAgIGNvbnN0IHRodW1ibmFpbEtleSA9IGB0aHVtYi0ke3NvdXJjZUtleX1gO1xuXG4gICAgICAvLyBVcGxvYWQgdGh1bWJuYWlsIHRvIGRlc3RpbmF0aW9uIGJ1Y2tldFxuICAgICAgY29uc3QgcHV0T2JqZWN0Q29tbWFuZCA9IG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICAgICAgQnVja2V0OiBUSFVNQk5BSUxfQlVDS0VULFxuICAgICAgICBLZXk6IHRodW1ibmFpbEtleSxcbiAgICAgICAgQm9keTogdGh1bWJuYWlsQnVmZmVyLFxuICAgICAgICBDb250ZW50VHlwZTogJ2ltYWdlL2pwZWcnLFxuICAgICAgICBNZXRhZGF0YToge1xuICAgICAgICAgICdvcmlnaW5hbC1rZXknOiBzb3VyY2VLZXksXG4gICAgICAgICAgJ29yaWdpbmFsLWJ1Y2tldCc6IHNvdXJjZUJ1Y2tldCxcbiAgICAgICAgICAncHJvY2Vzc2VkLWF0JzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQocHV0T2JqZWN0Q29tbWFuZCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgU3VjY2Vzc2Z1bGx5IGNyZWF0ZWQgdGh1bWJuYWlsOiAke3RodW1ibmFpbEtleX0gaW4gYnVja2V0OiAke1RIVU1CTkFJTF9CVUNLRVR9YFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyBpbWFnZTonLCBlcnJvcik7XG5cbiAgICAgIC8vIExvZyBkZXRhaWxlZCBlcnJvciBpbmZvcm1hdGlvblxuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbmFtZTonLCBlcnJvci5uYW1lKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbWVzc2FnZTonLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhY2s6JywgZXJyb3Iuc3RhY2spO1xuICAgICAgfVxuXG4gICAgICAvLyBSZS10aHJvdyB0byBtYXJrIExhbWJkYSBleGVjdXRpb24gYXMgZmFpbGVkXG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBjb25zb2xlLmxvZygnQWxsIGltYWdlcyBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5Jyk7XG59O1xuIl19