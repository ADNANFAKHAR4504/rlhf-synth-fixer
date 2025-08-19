exports.handler = async (event) => {
    console.log('Data processing event:', JSON.stringify(event, null, 2));
    
    // Basic data processing logic
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Data processed successfully',
            bucketName: process.env.BUCKET_NAME,
            kmsKeyId: process.env.KMS_KEY_ID,
            projectPrefix: process.env.PROJECT_PREFIX,
            processedAt: new Date().toISOString()
        })
    };
    
    return response;
};