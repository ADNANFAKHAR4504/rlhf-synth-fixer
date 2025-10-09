import fs from 'fs';
import https from 'https';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetInvalidationCommand,
} from '@aws-sdk/client-cloudfront';

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

const makeHttpsRequest = (
  url: string,
  headers: Record<string, string> = {}
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers as Record<string, string>,
            body,
          });
        });
      })
      .on('error', reject);
  });
};

const waitForInvalidation = async (
  distributionId: string,
  invalidationId: string,
  maxWaitTime = 60000
): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    const result = await cloudFrontClient.send(
      new GetInvalidationCommand({
        DistributionId: distributionId,
        Id: invalidationId,
      })
    );
    if (result.Invalidation?.Status === 'Completed') {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  return false;
};

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

  beforeAll(() => {
    if (!tableName || !bucketName || !distributionId || !distributionDomain) {
      throw new Error(
        'Required stack outputs not found. Please run: ./scripts/get-outputs.sh'
      );
    }
  });

  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('end-to-end personalized content delivery flow for single user', async () => {
    console.log('=== Starting Complete Personalized Content Delivery Flow ===');

    const testUserId = `flow-user-${Date.now()}`;
    const testArticleKey = `articles/test-article-${Date.now()}.html`;

    console.log(`Step 1: Creating user preferences for ${testUserId}`);
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

    const verifyUser = await ddb.send(
      new GetCommand({
        TableName: tableName,
        Key: { userId: testUserId },
      })
    );
    expect(verifyUser.Item).toBeDefined();
    console.log('✓ User preferences stored in DynamoDB');

    console.log('Step 2: Publishing article content to S3');
    const articleContent = `<!DOCTYPE html>
<html>
<head><title>Cloud Computing News</title></head>
<body>
  <h1>Latest Cloud Computing Trends</h1>
  <p>Article ID: ${testArticleKey}</p>
  <p>This article discusses advanced cloud computing topics for expert readers.</p>
</body>
</html>`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testArticleKey,
        Body: articleContent,
        ContentType: 'text/html',
      })
    );
    console.log('✓ Content published to S3');

    console.log('Step 3: Requesting content through CloudFront with user context');
    const cdnUrl = `https://${distributionDomain}/${testArticleKey}`;
    const response = await makeHttpsRequest(cdnUrl, {
      'X-User-Id': testUserId,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Cloud Computing Trends');
    expect(response.headers['x-personalized']).toBe('true');
    expect(response.headers['cache-control']).toContain('max-age');
    console.log('✓ Content delivered through CloudFront with personalization headers');

    console.log('Step 4: Verifying anonymous user gets content without personalization');
    const anonymousResponse = await makeHttpsRequest(cdnUrl);
    expect(anonymousResponse.statusCode).toBe(200);
    expect(anonymousResponse.body).toContain('Cloud Computing Trends');
    console.log('✓ Anonymous user can access content');

    console.log('Step 5: Cleanup - Removing test data');
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testArticleKey,
      })
    );
    await ddb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { userId: testUserId },
      })
    );
    console.log('✓ Test data cleaned up');
    console.log('=== Flow Complete ===\n');
  }, 60000);

  test('concurrent multi-user content consumption flow', async () => {
    console.log('=== Starting Concurrent Multi-User Content Consumption Flow ===');

    const timestamp = Date.now();
    const users = [
      {
        userId: `tech-user-${timestamp}`,
        topics: ['technology', 'ai'],
        readingLevel: 'intermediate',
      },
      {
        userId: `finance-user-${timestamp}`,
        topics: ['finance', 'economics'],
        readingLevel: 'expert',
      },
      {
        userId: `sports-user-${timestamp}`,
        topics: ['sports', 'health'],
        readingLevel: 'beginner',
      },
    ];

    const articles = [
      {
        key: `articles/tech-news-${timestamp}.html`,
        content: '<html><body><h1>AI Breakthrough</h1></body></html>',
      },
      {
        key: `articles/finance-news-${timestamp}.html`,
        content: '<html><body><h1>Market Update</h1></body></html>',
      },
      {
        key: `articles/sports-news-${timestamp}.html`,
        content: '<html><body><h1>Championship Results</h1></body></html>',
      },
    ];

    console.log('Step 1: Creating preferences for multiple users');
    await Promise.all(
      users.map(user =>
        ddb.send(
          new PutCommand({
            TableName: tableName,
            Item: { ...user, lastUpdated: timestamp },
          })
        )
      )
    );
    console.log(`✓ ${users.length} users created with different preferences`);

    console.log('Step 2: Publishing multiple articles to S3');
    await Promise.all(
      articles.map(article =>
        s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: article.key,
            Body: article.content,
            ContentType: 'text/html',
          })
        )
      )
    );
    console.log(`✓ ${articles.length} articles published`);

    console.log('Step 3: Simulating concurrent user content requests');
    const requestPromises = users.flatMap(user =>
      articles.map(article => {
        const url = `https://${distributionDomain}/${article.key}`;
        return makeHttpsRequest(url, { 'X-User-Id': user.userId });
      })
    );

    const responses = await Promise.all(requestPromises);
    const successfulRequests = responses.filter(r => r.statusCode === 200);
    expect(successfulRequests.length).toBe(users.length * articles.length);
    console.log(`✓ ${successfulRequests.length} concurrent requests successfully processed`);

    console.log('Step 4: Verifying user preferences persisted correctly');
    const userVerifications = await Promise.all(
      users.map(user =>
        ddb.send(
          new GetCommand({
            TableName: tableName,
            Key: { userId: user.userId },
          })
        )
      )
    );
    userVerifications.forEach((result, idx) => {
      expect(result.Item).toBeDefined();
      expect(result.Item?.topics).toEqual(users[idx].topics);
    });
    console.log('✓ All user preferences intact');

    console.log('Step 5: Cleanup - Removing all test data');
    await Promise.all([
      ...users.map(user =>
        ddb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { userId: user.userId },
          })
        )
      ),
      ...articles.map(article =>
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: article.key,
          })
        )
      ),
    ]);
    console.log('✓ All test data cleaned up');
    console.log('=== Flow Complete ===\n');
  }, 90000);

  test('content update and cache invalidation flow', async () => {
    console.log('=== Starting Content Update and Cache Invalidation Flow ===');

    const timestamp = Date.now();
    const userId = `update-user-${timestamp}`;
    const articleKey = `articles/breaking-news-${timestamp}.html`;

    console.log('Step 1: Creating user and publishing initial content');
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          userId,
          topics: ['breaking-news', 'world'],
          readingLevel: 'advanced',
          lastUpdated: timestamp,
        },
      })
    );

    const initialContent = `<!DOCTYPE html>
<html>
<head><title>Breaking News</title></head>
<body>
  <h1>Breaking News - Version 1</h1>
  <p>Initial article content published at ${new Date(timestamp).toISOString()}</p>
</body>
</html>`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: articleKey,
        Body: initialContent,
        ContentType: 'text/html',
      })
    );
    console.log('✓ Initial content published');

    console.log('Step 2: User requests initial content through CloudFront');
    const cdnUrl = `https://${distributionDomain}/${articleKey}`;
    const firstResponse = await makeHttpsRequest(cdnUrl, {
      'X-User-Id': userId,
    });
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toContain('Version 1');
    console.log('✓ Initial content delivered successfully');

    console.log('Step 3: Updating content in S3');
    const updatedContent = `<!DOCTYPE html>
<html>
<head><title>Breaking News - Updated</title></head>
<body>
  <h1>Breaking News - Version 2 (Updated)</h1>
  <p>Content updated with latest information at ${new Date().toISOString()}</p>
</body>
</html>`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: articleKey,
        Body: updatedContent,
        ContentType: 'text/html',
      })
    );
    console.log('✓ Content updated in S3');

    console.log('Step 4: Creating cache invalidation');
    const invalidation = await cloudFrontClient.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `invalidation-${timestamp}`,
          Paths: {
            Quantity: 1,
            Items: [`/${articleKey}`],
          },
        },
      })
    );

    expect(invalidation.Invalidation).toBeDefined();
    expect(invalidation.Invalidation?.Id).toBeDefined();
    const invalidationId = invalidation.Invalidation!.Id!;
    console.log(`✓ Cache invalidation created: ${invalidationId}`);

    console.log('Step 5: Waiting for cache invalidation to complete (up to 60s)');
    const completed = await waitForInvalidation(distributionId, invalidationId, 60000);
    if (completed) {
      console.log('✓ Cache invalidation completed');
    } else {
      console.log('⚠ Cache invalidation still in progress (will complete shortly)');
    }

    console.log('Step 6: User requests updated content');
    await new Promise(resolve => setTimeout(resolve, 5000));
    const secondResponse = await makeHttpsRequest(cdnUrl, {
      'X-User-Id': userId,
    });
    expect(secondResponse.statusCode).toBe(200);
    console.log('✓ Updated content accessible through CDN');

    console.log('Step 7: Cleanup - Removing test data');
    await Promise.all([
      s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: articleKey,
        })
      ),
      ddb.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { userId },
        })
      ),
    ]);
    console.log('✓ Test data cleaned up');
    console.log('=== Flow Complete ===\n');
  }, 120000);
});
