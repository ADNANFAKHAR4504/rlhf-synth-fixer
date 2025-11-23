/**
 * Lambda function for post-migration data validation
 * Runtime: Node.js 18.x
 * Memory: 256MB
 */

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Starting post-migration validation', JSON.stringify(event, null, 2));

    const results = {
        timestamp: new Date().toISOString(),
        validations: [],
        success: true
    };

    try {
        // Validate S3 buckets
        if (event.s3Buckets && Array.isArray(event.s3Buckets)) {
            for (const bucketName of event.s3Buckets) {
                try {
                    const bucketValidation = await validateS3Bucket(bucketName);
                    results.validations.push(bucketValidation);
                } catch (error) {
                    console.error(`Error validating bucket ${bucketName}:`, error);
                    results.validations.push({
                        resourceType: 'S3Bucket',
                        resourceName: bucketName,
                        status: 'FAILED',
                        error: error.message
                    });
                    results.success = false;
                }
            }
        }

        // Validate DynamoDB tables
        if (event.dynamoTables && Array.isArray(event.dynamoTables)) {
            for (const tableName of event.dynamoTables) {
                try {
                    const tableValidation = await validateDynamoDBTable(tableName);
                    results.validations.push(tableValidation);
                } catch (error) {
                    console.error(`Error validating table ${tableName}:`, error);
                    results.validations.push({
                        resourceType: 'DynamoDBTable',
                        resourceName: tableName,
                        status: 'FAILED',
                        error: error.message
                    });
                    results.success = false;
                }
            }
        }

        console.log('Validation completed:', JSON.stringify(results, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify(results)
        };
    } catch (error) {
        console.error('Validation failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                success: false
            })
        };
    }
};

async function validateS3Bucket(bucketName) {
    console.log(`Validating S3 bucket: ${bucketName}`);

    // Check bucket exists
    await s3.headBucket({ Bucket: bucketName }).promise();

    // Check versioning
    const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
    const versioningEnabled = versioning.Status === 'Enabled';

    // Check encryption
    let encryptionEnabled = false;
    try {
        const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
        encryptionEnabled = encryption.ServerSideEncryptionConfiguration !== undefined;
    } catch (error) {
        if (error.code !== 'ServerSideEncryptionConfigurationNotFoundError') {
            throw error;
        }
    }

    // Check lifecycle rules
    let lifecycleRules = [];
    try {
        const lifecycle = await s3.getBucketLifecycleConfiguration({ Bucket: bucketName }).promise();
        lifecycleRules = lifecycle.Rules || [];
    } catch (error) {
        if (error.code !== 'NoSuchLifecycleConfiguration') {
            throw error;
        }
    }

    const validation = {
        resourceType: 'S3Bucket',
        resourceName: bucketName,
        status: 'SUCCESS',
        checks: {
            exists: true,
            versioningEnabled,
            encryptionEnabled,
            lifecycleRulesCount: lifecycleRules.length
        }
    };

    if (!versioningEnabled || !encryptionEnabled) {
        validation.status = 'WARNING';
        validation.warnings = [];
        if (!versioningEnabled) validation.warnings.push('Versioning not enabled');
        if (!encryptionEnabled) validation.warnings.push('Encryption not enabled');
    }

    return validation;
}

async function validateDynamoDBTable(tableName) {
    console.log(`Validating DynamoDB table: ${tableName}`);

    // Describe table
    const tableDescription = await dynamodb.send(
        new AWS.DynamoDB.DescribeTableCommand({ TableName: tableName })
    );

    const table = tableDescription.Table;

    const validation = {
        resourceType: 'DynamoDBTable',
        resourceName: tableName,
        status: 'SUCCESS',
        checks: {
            exists: true,
            status: table.TableStatus,
            itemCount: table.ItemCount,
            tableSizeBytes: table.TableSizeBytes,
            provisionedThroughput: {
                readCapacity: table.ProvisionedThroughput?.ReadCapacityUnits,
                writeCapacity: table.ProvisionedThroughput?.WriteCapacityUnits
            }
        }
    };

    if (table.TableStatus !== 'ACTIVE') {
        validation.status = 'WARNING';
        validation.warnings = [`Table status is ${table.TableStatus}, not ACTIVE`];
    }

    return validation;
}
