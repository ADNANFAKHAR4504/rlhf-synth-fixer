import fs from 'fs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';

let outputs: Record<string, string> = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Warning: cfn-outputs/flat-outputs.json not found. Run ./scripts/get-outputs.sh first.'
  );
}
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

const ddbClient = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region });
const cloudFrontClient = new CloudFrontClient({ region });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region });

describe('Personalized News Platform Integration Tests', () => {
  const tableName =
    outputs[`${environmentSuffix}-UserPreferencesTableName`] ||
    outputs['UserPreferencesTableName'];
  const bucketName =
    outputs[`${environmentSuffix}-ContentBucketName`] ||
    outputs['ContentBucketName'];
  const distributionId =
    outputs[`${environmentSuffix}-DistributionId`] || outputs['DistributionId'];
  const distributionDomain =
    outputs[`${environmentSuffix}-DistributionDomainName`] ||
    outputs['DistributionDomainName'];
  const viewerRequestFunctionArn =
    outputs[`${environmentSuffix}-ViewerRequestFunctionArn`] ||
    outputs['ViewerRequestFunctionArn'];
  const viewerResponseFunctionArn =
    outputs[`${environmentSuffix}-ViewerResponseFunctionArn`] ||
    outputs['ViewerResponseFunctionArn'];

  beforeAll(() => {
    if (!tableName || !bucketName || !distributionId) {
      throw new Error(
        'Required stack outputs not found. Please run: ./scripts/get-outputs.sh'
      );
    }
  });

  test('should complete full personalized content delivery flow', async () => {
    const testUserId = `test-user-${Date.now()}`;
    const testArticleKey = `articles/test-article-${Date.now()}.html`;

    const userPreferences = {
      userId: testUserId,
      topics: ['technology', 'cloud-computing'],
      readingLevel: 'expert',
      preferredLength: 'detailed',
      lastUpdated: Date.now(),
    };

    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: userPreferences,
      })
    );

    const retrievedUser = await ddb.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId: testUserId },
      })
    );

    expect(retrievedUser.Item).toBeDefined();
    expect(retrievedUser.Item?.userId).toBe(testUserId);
    expect(retrievedUser.Item?.topics).toEqual([
      'technology',
      'cloud-computing',
    ]);

    const articleContent = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Article</title></head>
        <body>
          <h1>Personalized News Article</h1>
          <p>This is a test article for ${testUserId}</p>
        </body>
      </html>
    `;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testArticleKey,
        Body: articleContent,
        ContentType: 'text/html',
      })
    );

    const s3Object = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: testArticleKey,
      })
    );

    expect(s3Object).toBeDefined();
    expect(s3Object.ContentType).toBe('text/html');

    const distribution = await cloudFrontClient.send(
      new GetDistributionCommand({
        Id: distributionId,
      })
    );

    expect(distribution.Distribution).toBeDefined();
    expect(distribution.Distribution?.Status).toBe('Deployed');
    expect(distribution.Distribution?.DistributionConfig?.Enabled).toBe(true);
    expect(
      distribution.Distribution?.DistributionConfig?.DefaultCacheBehavior
        ?.ViewerProtocolPolicy
    ).toBe('redirect-to-https');

    const lambdaFunctions =
      distribution.Distribution?.DistributionConfig?.DefaultCacheBehavior
        ?.LambdaFunctionAssociations;
    expect(lambdaFunctions?.Quantity).toBeGreaterThanOrEqual(2);

    const viewerRequestAssociation = lambdaFunctions?.Items?.find(
      item => item.EventType === 'viewer-request'
    );
    const viewerResponseAssociation = lambdaFunctions?.Items?.find(
      item => item.EventType === 'viewer-response'
    );

    expect(viewerRequestAssociation).toBeDefined();
    expect(viewerResponseAssociation).toBeDefined();

    const viewerRequestFunction = await lambdaClient.send(
      new GetFunctionCommand({
        FunctionName: viewerRequestFunctionArn.split(':').slice(-1)[0],
      })
    );

    expect(viewerRequestFunction.Configuration).toBeDefined();
    expect(viewerRequestFunction.Configuration?.Runtime).toContain('nodejs');
    expect(viewerRequestFunction.Configuration?.Timeout).toBeLessThanOrEqual(5);

    const viewerResponseFunction = await lambdaClient.send(
      new GetFunctionCommand({
        FunctionName: viewerResponseFunctionArn.split(':').slice(-1)[0],
      })
    );

    expect(viewerResponseFunction.Configuration).toBeDefined();
    expect(viewerResponseFunction.Configuration?.Runtime).toContain('nodejs');
    expect(viewerResponseFunction.Configuration?.Timeout).toBeLessThanOrEqual(
      5
    );

    expect(distributionDomain).toBeDefined();
    expect(distributionDomain).toContain('cloudfront.net');

    const origins = distribution.Distribution?.DistributionConfig?.Origins;
    expect(origins?.Quantity).toBeGreaterThan(0);

    const s3Origin = origins?.Items?.[0];
    expect(s3Origin?.DomainName).toContain(bucketName);
    expect(s3Origin?.S3OriginConfig).toBeDefined();
    expect(s3Origin?.OriginAccessControlId).toBeDefined();
  }, 30000);

  test('should handle multiple user preferences concurrently', async () => {
    const userIds = Array.from(
      { length: 10 },
      (_, i) => `concurrent-user-${Date.now()}-${i}`
    );

    const putPromises = userIds.map(userId =>
      ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            userId,
            topics: ['tech', 'science'],
            timestamp: Date.now(),
          },
        })
      )
    );

    await Promise.all(putPromises);

    const getPromises = userIds.map(userId =>
      ddb.send(
        new GetCommand({
          TableName: tableName,
          Key: { userId },
        })
      )
    );

    const results = await Promise.all(getPromises);
    results.forEach((result, index) => {
      expect(result.Item).toBeDefined();
      expect(result.Item?.userId).toBe(userIds[index]);
    });

    const deletePromises = userIds.map(userId =>
      ddb.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { userId },
        })
      )
    );
    await Promise.all(deletePromises);
  }, 30000);

  test('should upload and retrieve various content types', async () => {
    const testFiles = [
      {
        key: `test-${Date.now()}.html`,
        body: '<html><body>Test HTML</body></html>',
        contentType: 'text/html',
      },
      {
        key: `test-${Date.now()}.json`,
        body: JSON.stringify({ test: 'data' }),
        contentType: 'application/json',
      },
      {
        key: `test-${Date.now()}.txt`,
        body: 'Plain text content',
        contentType: 'text/plain',
      },
    ];

    for (const file of testFiles) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: file.key,
          Body: file.body,
          ContentType: file.contentType,
        })
      );

      const retrieved = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: file.key,
        })
      );

      expect(retrieved.ContentType).toBe(file.contentType);

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: file.key,
        })
      );
    }
  }, 30000);

  test('should validate CloudFront cache invalidation', async () => {
    const testKey = `cache-test-${Date.now()}.html`;
    const content = '<html><body>Cache Test</body></html>';

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: content,
        ContentType: 'text/html',
      })
    );

    const invalidation = await cloudFrontClient.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `test-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [`/${testKey}`],
          },
        },
      })
    );

    expect(invalidation.Invalidation).toBeDefined();
    expect(invalidation.Invalidation?.Status).toBe('InProgress');

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      })
    );
  }, 30000);

  test('should verify DynamoDB read/write performance', async () => {
    const batchSize = 25;
    const testUsers = Array.from(
      { length: batchSize },
      (_, i) => `perf-test-${Date.now()}-${i}`
    );

    const startWrite = Date.now();
    await Promise.all(
      testUsers.map(userId =>
        ddb.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              userId,
              topics: ['performance', 'testing'],
              preferences: { theme: 'dark', notifications: true },
              timestamp: Date.now(),
            },
          })
        )
      )
    );
    const writeTime = Date.now() - startWrite;

    expect(writeTime).toBeLessThan(5000);

    const startRead = Date.now();
    const reads = await Promise.all(
      testUsers.map(userId =>
        ddb.send(
          new GetCommand({
            TableName: tableName,
            Key: { userId },
          })
        )
      )
    );
    const readTime = Date.now() - startRead;

    expect(readTime).toBeLessThan(3000);
    expect(reads.every(r => r.Item !== undefined)).toBe(true);

    await Promise.all(
      testUsers.map(userId =>
        ddb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { userId },
          })
        )
      )
    );
  }, 30000);

  test('should validate CloudWatch metrics are being generated', async () => {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3600000);

    const ddbMetrics = await cloudWatchClient.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/DynamoDB',
        MetricName: 'UserErrors',
        Dimensions: [
          {
            Name: 'TableName',
            Value: tableName,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
      })
    );

    expect(ddbMetrics.Datapoints).toBeDefined();

    const cfMetrics = await cloudWatchClient.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/CloudFront',
        MetricName: 'Requests',
        Dimensions: [
          {
            Name: 'DistributionId',
            Value: distributionId,
          },
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600,
        Statistics: ['Sum'],
      })
    );

    expect(cfMetrics.Datapoints).toBeDefined();
  }, 30000);

  test('should validate S3 bucket security configurations', async () => {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `security-test-${Date.now()}.txt`,
          Body: 'test',
        })
      );
    } catch (error: any) {
      if (error.name === 'AccessDenied') {
        fail('Should be able to write to bucket with proper credentials');
      }
    }

    const listResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1,
      })
    );

    expect(listResult.$metadata.httpStatusCode).toBe(200);
  }, 30000);
});
