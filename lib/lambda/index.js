const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Initialize AWS services with region from environment
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Enhanced Lambda handler for production data processing
 * Processes S3 events with error handling and monitoring
 */
exports.handler = async (event, context) => {
    // Configure Lambda context for better monitoring
    context.callbackWaitsForEmptyEventLoop = false;
    
    const startTime = Date.now();
    console.log('Data processing started:', {
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
        event: JSON.stringify(event, null, 2)
    });

    try {
        // Process each S3 record in the event
        const results = [];
        
        for (const record of event.Records || []) {
            if (record.eventSource === 'aws:s3') {
                const result = await processS3Record(record);
                results.push(result);
            }
        }

        const processingTime = Date.now() - startTime;
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Data processed successfully',
                bucketName: process.env.BUCKET_NAME,
                kmsKeyId: process.env.KMS_KEY_ID,
                projectPrefix: process.env.PROJECT_PREFIX,
                processedAt: new Date().toISOString(),
                requestId: context.awsRequestId,
                processingTimeMs: processingTime,
                recordsProcessed: results.length,
                results: results
            })
        };

        console.log('Processing completed:', {
            statusCode: response.statusCode,
            recordsProcessed: results.length,
            processingTimeMs: processingTime
        });

        return response;

    } catch (error) {
        console.error('Error processing data:', {
            error: error.message,
            stack: error.stack,
            requestId: context.awsRequestId,
            timestamp: new Date().toISOString()
        });

        // Return error response
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error processing data',
                error: error.message,
                requestId: context.awsRequestId,
                timestamp: new Date().toISOString()
            })
        };
    }
};

/**
 * Process individual S3 record
 */
async function processS3Record(record) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    
    console.log(`Processing S3 object: s3://${bucket}/${key}`);
    
    try {
        // Get object metadata
        const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
        const headResult = await s3Client.send(headCommand);
        
        // For production, add actual data processing logic here
        // This could include:
        // - Reading and parsing the file content
        // - Applying business logic transformations
        // - Writing processed data to another location
        // - Sending notifications or metrics
        
        return {
            bucket: bucket,
            key: key,
            size: headResult.ContentLength,
            lastModified: headResult.LastModified,
            contentType: headResult.ContentType,
            encryption: headResult.ServerSideEncryption,
            processed: true
        };
        
    } catch (error) {
        console.error(`Failed to process S3 object s3://${bucket}/${key}:`, error);
        throw error;
    }
}