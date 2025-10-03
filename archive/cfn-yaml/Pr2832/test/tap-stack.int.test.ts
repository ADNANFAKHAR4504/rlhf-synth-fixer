// Configuration - These are coming from cfn-outputs after cdk deploy
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import axios from 'axios';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  it('should have required API endpoints in cfn-outputs', async () => {
    const apiEndpoint = outputs[`HealthCheckUrl`];
    expect(apiEndpoint).toBeDefined();
    expect(typeof apiEndpoint).toBe('string');

    // Check if API endpoint is reachable (basic GET request)
    const response = await axios.get(apiEndpoint);
    expect(response.status).toBeLessThan(500);
  });

  it('should have DynamoDB table name in cfn-outputs and table exists', async () => {
    const tableName = outputs['DynamoDBTableName'];
    expect(tableName).toBeDefined();
    expect(typeof tableName).toBe('string');

    const dynamoClient = new DynamoDBClient({});
    const describeTableCmd = new DescribeTableCommand({ TableName: tableName });
    const tableInfo = await dynamoClient.send(describeTableCmd);
    expect(tableInfo.Table?.TableName).toBe(tableName);
    expect(tableInfo.Table?.TableStatus).toBe('ACTIVE');
  });

  it('should have S3 bucket name in cfn-outputs and bucket exists', async () => {
    const bucketName = outputs[`S3BucketName`];
    expect(bucketName).toBeDefined();
    expect(typeof bucketName).toBe('string');

    const s3Client = new S3Client({});
    const headBucketCmd = new HeadBucketCommand({ Bucket: bucketName });
    await expect(s3Client.send(headBucketCmd)).resolves.toBeDefined();
  });
});
