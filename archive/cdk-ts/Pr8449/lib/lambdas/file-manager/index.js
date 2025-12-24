const {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const {
  DynamoDBClient,
  UpdateItemCommand,
} = require('@aws-sdk/client-dynamodb');
const {
  CloudWatchClient,
  PutMetricDataCommand,
} = require('@aws-sdk/client-cloudwatch');

// Initialize AWS clients with LocalStack endpoint configuration
const endpoint = process.env.AWS_ENDPOINT_URL || undefined;
const clientConfig = {
  region: process.env.REGION,
  ...(endpoint && { endpoint }),
};

const s3Client = new S3Client({
  ...clientConfig,
  forcePathStyle: true, // Required for LocalStack S3
});
const dynamoClient = new DynamoDBClient(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);

// Publish CloudWatch metric
async function publishMetric(metricName, value) {
  try {
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'ServerlessImageDetector',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );
  } catch (error) {
    console.error('Error publishing metric:', error);
  }
}

// Main Lambda handler
exports.handler = async (event, context) => {
  console.log('File Manager Event:', JSON.stringify(event, null, 2));

  try {
    const { imageId, sourceKey, detectedAnimal, confidenceScore } = event;

    if (!imageId || !sourceKey || !detectedAnimal) {
      throw new Error(
        'Missing required parameters: imageId, sourceKey, detectedAnimal'
      );
    }

    // Determine destination folder based on detected animal
    let destinationFolder;
    if (detectedAnimal === 'cats') {
      destinationFolder = 'cats';
    } else if (detectedAnimal === 'dogs') {
      destinationFolder = 'dogs';
    } else {
      destinationFolder = 'others';
    }

    // Extract file extension from source key
    const fileExtension = sourceKey.split('.').pop();
    const destinationKey = `${destinationFolder}/${imageId}.${fileExtension}`;

    console.log(`Moving file from ${sourceKey} to ${destinationKey}`);

    // Copy object to destination folder
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        CopySource: `${process.env.BUCKET_NAME}/${sourceKey}`,
        Key: destinationKey,
        ServerSideEncryption: 'AES256',
        MetadataDirective: 'COPY',
      })
    );

    console.log(`File copied to ${destinationKey}`);

    // Delete original file from input folder
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: sourceKey,
      })
    );

    console.log(`Original file deleted: ${sourceKey}`);

    // Update DynamoDB record with new S3 location
    await dynamoClient.send(
      new UpdateItemCommand({
        TableName: process.env.TABLE_NAME,
        Key: { ImageID: { S: imageId } },
        UpdateExpression:
          'SET S3Location = :newLocation, ProcessingStatus = :status',
        ExpressionAttributeValues: {
          ':newLocation': {
            S: `s3://${process.env.BUCKET_NAME}/${destinationKey}`,
          },
          ':status': { S: 'organized' },
        },
      })
    );

    console.log(`DynamoDB record updated for image: ${imageId}`);

    // Publish metrics
    await publishMetric('FilesOrganized', 1);
    await publishMetric(
      `FilesMovedTo${destinationFolder.charAt(0).toUpperCase() + destinationFolder.slice(1)}`,
      1
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File organized successfully',
        imageId,
        sourceKey,
        destinationKey,
        detectedAnimal,
        confidenceScore,
      }),
    };
  } catch (error) {
    console.error('Error organizing file:', error);
    await publishMetric('FileOrganizationErrors', 1);

    // Update DynamoDB with error status
    if (event.imageId) {
      try {
        await dynamoClient.send(
          new UpdateItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: { ImageID: { S: event.imageId } },
            UpdateExpression:
              'SET ProcessingStatus = :status, ErrorMessage = :error',
            ExpressionAttributeValues: {
              ':status': { S: 'organization_failed' },
              ':error': { S: error.message || 'Unknown error' },
            },
          })
        );
      } catch (dbError) {
        console.error('Error updating DynamoDB with error status:', dbError);
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'File organization failed',
        message: error.message || 'Unknown error',
        requestId: context.awsRequestId,
      }),
    };
  }
};
