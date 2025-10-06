const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const ARTIFACT_BUCKET = process.env.ARTIFACT_BUCKET;
const EXPRESS_BUCKET = process.env.EXPRESS_BUCKET;
const METADATA_TABLE = process.env.METADATA_TABLE;
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '90');

exports.handler = async (event) => {
  console.log('Starting artifact cleanup process');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
  const cutoffTimestamp = cutoffDate.getTime();

  try {
    // Clean up S3 artifacts
    await cleanupS3Bucket(ARTIFACT_BUCKET, cutoffTimestamp);

    // Clean up Express One Zone bucket
    if (EXPRESS_BUCKET) {
      await cleanupS3Bucket(EXPRESS_BUCKET, cutoffTimestamp);
    }

    // Clean up DynamoDB metadata
    await cleanupDynamoDB(cutoffTimestamp);

    console.log('Artifact cleanup completed successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cleanup completed successfully',
        cutoffDate: cutoffDate.toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};

async function cleanupS3Bucket(bucketName, cutoffTimestamp) {
  console.log(`Cleaning up bucket: ${bucketName}`);

  try {
    const listParams = {
      Bucket: bucketName,
      MaxKeys: 1000,
    };

    let continuationToken = null;
    let deletedCount = 0;

    do {
      if (continuationToken) {
        listParams.ContinuationToken = continuationToken;
      }

      const listResponse = await s3.listObjectsV2(listParams).promise();

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        break;
      }

      const objectsToDelete = listResponse.Contents
        .filter(obj => new Date(obj.LastModified).getTime() < cutoffTimestamp)
        .map(obj => ({ Key: obj.Key }));

      if (objectsToDelete.length > 0) {
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: objectsToDelete,
            Quiet: true,
          },
        };

        const deleteResponse = await s3.deleteObjects(deleteParams).promise();
        deletedCount += objectsToDelete.length;

        if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
          console.error('Errors deleting objects:', deleteResponse.Errors);
        }
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    console.log(`Deleted ${deletedCount} objects from ${bucketName}`);
  } catch (error) {
    console.error(`Error cleaning up bucket ${bucketName}:`, error);
    throw error;
  }
}

async function cleanupDynamoDB(cutoffTimestamp) {
  console.log('Cleaning up DynamoDB metadata');

  try {
    const scanParams = {
      TableName: METADATA_TABLE,
      FilterExpression: '#ts < :cutoff',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':cutoff': cutoffTimestamp,
      },
    };

    let deletedCount = 0;
    let lastEvaluatedKey = null;

    do {
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      const scanResponse = await dynamodb.scan(scanParams).promise();

      if (!scanResponse.Items || scanResponse.Items.length === 0) {
        break;
      }

      for (const item of scanResponse.Items) {
        const deleteParams = {
          TableName: METADATA_TABLE,
          Key: {
            artifact_id: item.artifact_id,
            build_number: item.build_number,
          },
        };

        await dynamodb.delete(deleteParams).promise();
        deletedCount++;
      }

      lastEvaluatedKey = scanResponse.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`Deleted ${deletedCount} metadata records from DynamoDB`);
  } catch (error) {
    console.error('Error cleaning up DynamoDB:', error);
    throw error;
  }
}