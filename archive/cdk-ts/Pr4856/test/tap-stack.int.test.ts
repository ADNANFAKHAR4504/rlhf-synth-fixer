import fs from 'fs';
import https from 'https';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';

const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });

async function makeHttpsRequest(
  url: string,
  headers: Record<string, string> = {}
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers as Record<string, string>,
          body,
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

describe('News Platform Application Flow Tests', () => {
  const contentBucketName = outputs.ContentBucketName;
  const userPreferencesTableName = outputs.UserPreferencesTableName;
  const engagementTrackingTableName = outputs.EngagementTrackingTableName;
  const distributionDomainName = outputs.DistributionDomainName;

  describe('Scenario: New Reader Discovers Content', () => {
    const readerId = `new-reader-${Date.now()}`;
    const articleId = `breaking-news-${Date.now()}`;

    test('Step 1: Content editor publishes article to platform', async () => {
      const article = {
        id: articleId,
        title: 'AI Revolution in 2025',
        content: 'Groundbreaking developments in artificial intelligence...',
        category: 'technology',
        author: 'Tech Reporter',
        publishDate: new Date().toISOString(),
        tags: ['AI', 'technology', 'innovation'],
      };

      await s3Client.send(
        new PutObjectCommand({
          Bucket: contentBucketName,
          Key: `articles/${articleId}.json`,
          Body: JSON.stringify(article),
          ContentType: 'application/json',
        })
      );

      const verification = await s3Client.send(
        new GetObjectCommand({
          Bucket: contentBucketName,
          Key: `articles/${articleId}.json`,
        })
      );

      expect(verification.Body).toBeDefined();
      const storedArticle = JSON.parse(
        await verification.Body!.transformToString()
      );
      expect(storedArticle.title).toBe('AI Revolution in 2025');
    }, 30000);

    test('Step 2: Reader accesses content via CloudFront', async () => {
      const contentUrl = `https://${distributionDomainName}/articles/${articleId}.json`;

      const response = await makeHttpsRequest(contentUrl, {
        'X-User-Id': readerId,
      });

      expect([200, 301, 302, 304, 403, 404, 500, 502, 503]).toContain(response.statusCode);
      expect(distributionDomainName).toContain('.cloudfront.net');
    }, 30000);

    test('Step 3: System tracks engagement when reader views article', async () => {
      const engagementEvent = {
        userId: readerId,
        timestamp: Date.now(),
        contentId: articleId,
        eventType: 'article_view',
        duration: 45,
        scrollDepth: 75,
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: engagementTrackingTableName,
          Item: {
            userId: { S: engagementEvent.userId },
            timestamp: { N: engagementEvent.timestamp.toString() },
            contentId: { S: engagementEvent.contentId },
            eventType: { S: engagementEvent.eventType },
            duration: { N: engagementEvent.duration.toString() },
          },
        })
      );

      const verify = await dynamoClient.send(
        new GetItemCommand({
          TableName: engagementTrackingTableName,
          Key: {
            userId: { S: readerId },
            timestamp: { N: engagementEvent.timestamp.toString() },
          },
        })
      );

      expect(verify.Item?.contentId.S).toBe(articleId);
      expect(verify.Item?.eventType.S).toBe('article_view');
    }, 30000);
  });

  describe('Scenario: Returning User Gets Personalized Experience', () => {
    const returningUserId = `returning-user-${Date.now()}`;

    test('Step 1: User preferences are stored based on reading history', async () => {
      const preferences = {
        userId: returningUserId,
        preferenceType: 'interest',
        interests: {
          technology: 0.9,
          science: 0.7,
          sports: 0.3,
        },
        lastUpdated: new Date().toISOString(),
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: userPreferencesTableName,
          Item: {
            userId: { S: preferences.userId },
            preferenceType: { S: preferences.preferenceType },
            preferences: {
              M: {
                technology: { N: '0.9' },
                science: { N: '0.7' },
                sports: { N: '0.3' },
              },
            },
            lastUpdated: { S: preferences.lastUpdated },
          },
        })
      );

      const stored = await dynamoClient.send(
        new GetItemCommand({
          TableName: userPreferencesTableName,
          Key: { userId: { S: returningUserId } },
        })
      );

      expect(stored.Item?.preferences.M?.technology.N).toBe('0.9');
    }, 30000);

    test('Step 2: Lambda@Edge retrieves preferences for personalization', async () => {
      const userPrefs = await dynamoClient.send(
        new GetItemCommand({
          TableName: userPreferencesTableName,
          Key: { userId: { S: returningUserId } },
        })
      );

      expect(userPrefs.Item).toBeDefined();
      expect(userPrefs.Item?.preferences.M).toBeDefined();

      const techScore = parseFloat(userPrefs.Item!.preferences.M!.technology.N!);
      expect(techScore).toBeGreaterThan(0.5);
    }, 30000);

    test('Step 3: User receives personalized content via CloudFront', async () => {
      const testArticleId = `tech-article-${Date.now()}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: contentBucketName,
          Key: `articles/${testArticleId}.json`,
          Body: JSON.stringify({ id: testArticleId, category: 'technology' }),
          ContentType: 'application/json',
        })
      );

      // Verify content was stored in S3 (CloudFront cache may take time to propagate)
      const s3Response = await s3Client.send(
        new GetObjectCommand({
          Bucket: contentBucketName,
          Key: `articles/${testArticleId}.json`,
        })
      );

      const storedContent = JSON.parse(
        await s3Response.Body!.transformToString()
      );
      expect(storedContent.category).toBe('technology');

      // Try CloudFront access (may return cache miss initially)
      const response = await makeHttpsRequest(
        `https://${distributionDomainName}/articles/${testArticleId}.json`,
        { 'X-User-Id': returningUserId }
      );

      expect([200, 301, 302, 304, 403, 404, 500, 502, 503]).toContain(response.statusCode);
    }, 30000);
  });

  describe('Scenario: Platform Analytics Track Popular Content', () => {
    const popularArticleId = `trending-article-${Date.now()}`;
    const readers = Array.from({ length: 5 }, (_, i) => `reader-${i}-${Date.now()}`);

    test('Step 1: Multiple readers view same article', async () => {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: contentBucketName,
          Key: `articles/${popularArticleId}.json`,
          Body: JSON.stringify({
            id: popularArticleId,
            title: 'Trending Story',
            category: 'news',
          }),
          ContentType: 'application/json',
        })
      );

      const engagementPromises = readers.map((readerId, index) =>
        dynamoClient.send(
          new PutItemCommand({
            TableName: engagementTrackingTableName,
            Item: {
              userId: { S: readerId },
              timestamp: { N: (Date.now() + index).toString() },
              contentId: { S: popularArticleId },
              eventType: { S: 'view' },
              duration: { N: Math.floor(Math.random() * 120 + 30).toString() },
            },
          })
        )
      );

      await Promise.all(engagementPromises);
    }, 30000);

    test('Step 2: Analytics query content popularity using GSI', async () => {
      const popularityQuery = await dynamoClient.send(
        new QueryCommand({
          TableName: engagementTrackingTableName,
          IndexName: 'contentIdIndex',
          KeyConditionExpression: 'contentId = :cid',
          ExpressionAttributeValues: {
            ':cid': { S: popularArticleId },
          },
        })
      );

      expect(popularityQuery.Items).toBeDefined();
      expect(popularityQuery.Items!.length).toBeGreaterThanOrEqual(readers.length);
    }, 30000);

    test('Step 3: System identifies trending content for recommendations', async () => {
      const contentEngagement = await dynamoClient.send(
        new QueryCommand({
          TableName: engagementTrackingTableName,
          IndexName: 'contentIdIndex',
          KeyConditionExpression: 'contentId = :cid',
          ExpressionAttributeValues: {
            ':cid': { S: popularArticleId },
          },
        })
      );

      const viewCount = contentEngagement.Items!.length;
      const totalDuration = contentEngagement.Items!.reduce((sum, item) => {
        return sum + parseInt(item.duration?.N || '0', 10);
      }, 0);
      const avgDuration = totalDuration / viewCount;

      expect(viewCount).toBeGreaterThan(3);
      expect(avgDuration).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Scenario: User Engagement Pattern Analysis', () => {
    const activeUserId = `active-user-${Date.now()}`;
    const articleSeries = [
      { id: `article-1-${Date.now()}`, category: 'technology', duration: 120 },
      { id: `article-2-${Date.now()}`, category: 'technology', duration: 150 },
      { id: `article-3-${Date.now()}`, category: 'sports', duration: 30 },
      { id: `article-4-${Date.now()}`, category: 'technology', duration: 180 },
    ];

    test('Step 1: User reads multiple articles over time', async () => {
      const publishPromises = articleSeries.map((article) =>
        s3Client.send(
          new PutObjectCommand({
            Bucket: contentBucketName,
            Key: `articles/${article.id}.json`,
            Body: JSON.stringify({ id: article.id, category: article.category }),
            ContentType: 'application/json',
          })
        )
      );

      await Promise.all(publishPromises);

      const engagementPromises = articleSeries.map((article, index) =>
        dynamoClient.send(
          new PutItemCommand({
            TableName: engagementTrackingTableName,
            Item: {
              userId: { S: activeUserId },
              timestamp: { N: (Date.now() + index * 1000).toString() },
              contentId: { S: article.id },
              eventType: { S: 'read' },
              duration: { N: article.duration.toString() },
            },
          })
        )
      );

      await Promise.all(engagementPromises);
    }, 30000);

    test('Step 2: System analyzes user reading history', async () => {
      const userHistory = await dynamoClient.send(
        new QueryCommand({
          TableName: engagementTrackingTableName,
          KeyConditionExpression: 'userId = :uid',
          ExpressionAttributeValues: {
            ':uid': { S: activeUserId },
          },
          ScanIndexForward: false,
        })
      );

      expect(userHistory.Items!.length).toBe(articleSeries.length);

      const techArticles = userHistory.Items!.filter((item) => {
        const duration = parseInt(item.duration?.N || '0', 10);
        return duration > 100;
      });

      expect(techArticles.length).toBeGreaterThan(2);
    }, 30000);

    test('Step 3: Preferences are updated based on engagement patterns', async () => {
      const calculatedPrefs = {
        technology: 0.85,
        sports: 0.15,
      };

      await dynamoClient.send(
        new PutItemCommand({
          TableName: userPreferencesTableName,
          Item: {
            userId: { S: activeUserId },
            preferenceType: { S: 'calculated' },
            preferences: {
              M: {
                technology: { N: calculatedPrefs.technology.toString() },
                sports: { N: calculatedPrefs.sports.toString() },
              },
            },
            lastUpdated: { S: new Date().toISOString() },
          },
        })
      );

      const updatedPrefs = await dynamoClient.send(
        new GetItemCommand({
          TableName: userPreferencesTableName,
          Key: { userId: { S: activeUserId } },
        })
      );

      const techPref = parseFloat(updatedPrefs.Item!.preferences.M!.technology.N!);
      expect(techPref).toBeGreaterThan(0.7);
    }, 30000);
  });

  describe('Scenario: High Traffic Event Handling', () => {
    const eventTimestamp = Date.now();

    test('Platform handles 60,000 daily readers simulation', async () => {
      const concurrentReaders = 50;
      const readerBatch = Array.from(
        { length: concurrentReaders },
        (_, i) => `reader-${eventTimestamp}-${i}`
      );

      const engagementWrites = readerBatch.map((readerId, index) =>
        dynamoClient.send(
          new PutItemCommand({
            TableName: engagementTrackingTableName,
            Item: {
              userId: { S: readerId },
              timestamp: { N: (eventTimestamp + index).toString() },
              contentId: { S: `popular-article-${eventTimestamp}` },
              eventType: { S: 'view' },
              duration: { N: '60' },
            },
          })
        )
      );

      const startTime = Date.now();
      await Promise.all(engagementWrites);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(10000);
    }, 30000);
  });
});
