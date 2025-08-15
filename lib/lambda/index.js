// Lambda function for S3 data processing
// This function is triggered when objects are uploaded to the S3 bucket

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));
    
    const bucketName = process.env.BUCKET_NAME;
    const kmsKeyId = process.env.KMS_KEY_ID;
    const projectPrefix = process.env.PROJECT_PREFIX;
    
    console.log(`Processing data for project: ${projectPrefix}`);
    console.log(`Using KMS key: ${kmsKeyId}`);
    
    try {
        // Process each S3 record
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
            
            console.log(`Processing object ${key} from bucket ${bucket}`);
            
            // Get the object from S3 (this will automatically decrypt if encrypted with KMS)
            const getObjectCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });
            
            const response = await s3Client.send(getObjectCommand);
            const objectContent = await response.Body.transformToString();
            
            // Process the JSON data
            try {
                const jsonData = JSON.parse(objectContent);
                console.log('Successfully parsed JSON data:', jsonData);
                
                // Your data processing logic goes here
                console.log(`Processed ${Object.keys(jsonData).length} fields from ${key}`);
                
            } catch (parseError) {
                console.error(`Error parsing JSON from ${key}:`, parseError);
                throw parseError;
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully processed S3 objects',
                processedCount: event.Records.length,
                timestamp: new Date().toISOString()
            }),
        };
        
    } catch (error) {
        console.error('Error processing S3 event:', error);
        throw error;
    }
};