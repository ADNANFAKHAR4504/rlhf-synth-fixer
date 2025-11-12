// Review processing Lambda function using AWS SDK v3
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle S3 event (image processing)
    if (event.Records && event.Records[0].eventSource === 'aws:s3') {
        return handleS3Event(event);
    }

    // Handle API Gateway event
    if (event.httpMethod) {
        return handleApiGatewayEvent(event);
    }

    return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ message: 'Unsupported event type' })
    };
};

async function handleS3Event(event) {
    try {
        const record = event.Records[0];
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing image: ${objectKey} from bucket: ${bucketName}`);

        // Get object metadata
        const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        });

        const response = await s3Client.send(getCommand);
        console.log(`Image metadata: ContentType=${response.ContentType}, Size=${response.ContentLength}`);

        // Here you would add image validation and processing logic
        // For example: check file size, validate image format, extract metadata, etc.

        return {
            statusCode: 200,
            message: 'Image processed successfully'
        };
    } catch (error) {
        console.error('Error processing S3 event:', error);
        throw error;
    }
}

async function handleApiGatewayEvent(event) {
    const method = event.httpMethod;
    const path = event.path;

    try {
        if (method === 'POST' && path === '/reviews') {
            return await createReview(event);
        } else if (method === 'GET' && path.startsWith('/reviews/')) {
            return await getReviews(event);
        }

        return {
            statusCode: 404,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Not found' })
        };
    } catch (error) {
        console.error('Error handling API Gateway event:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Internal server error', error: error.message })
        };
    }
}

async function createReview(event) {
    const body = JSON.parse(event.body || '{}');
    const { productId, reviewId, rating, comment, imageUrl } = body;

    // Validate input
    if (!productId || !reviewId || !rating) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Missing required fields: productId, reviewId, rating' })
        };
    }

    if (rating < 1 || rating > 5) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Rating must be between 1 and 5' })
        };
    }

    // Create review item
    const item = {
        productId,
        reviewId,
        rating,
        comment: comment || '',
        imageUrl: imageUrl || '',
        timestamp: new Date().toISOString()
    };

    const putCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: item
    });

    await docClient.send(putCommand);

    return {
        statusCode: 201,
        headers: getCorsHeaders(),
        body: JSON.stringify({ message: 'Review created successfully', review: item })
    };
}

async function getReviews(event) {
    const productId = event.pathParameters?.productId;

    if (!productId) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Missing productId parameter' })
        };
    }

    const queryCommand = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'productId = :productId',
        ExpressionAttributeValues: {
            ':productId': productId
        }
    });

    const result = await docClient.send(queryCommand);

    return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({
            productId,
            count: result.Count,
            reviews: result.Items
        })
    };
}

function getCorsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    };
}
