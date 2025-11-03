// Metadata Extractor Lambda Function
exports.handler = async (event) => {
    console.log('Metadata extraction started', JSON.stringify(event));

    const inputBucket = process.env.INPUT_BUCKET;
    const outputBucket = process.env.OUTPUT_BUCKET;

    // Simulate metadata extraction logic
    // In production, this would use exif-parser or similar library from the layer
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Metadata extracted successfully',
            inputBucket,
            outputBucket,
            architecture: 'arm64',
            memorySize: '256MB'
        })
    };

    return response;
};
