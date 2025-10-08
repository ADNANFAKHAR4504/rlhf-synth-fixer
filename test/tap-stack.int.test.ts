import fs from 'fs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

const ddbClient = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region });
const cloudFrontClient = new CloudFrontClient({ region });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

describe('Personalized News Platform Integration Tests', () => {
  const tableName = outputs[`${environmentSuffix}-UserPreferencesTableName`];
  const bucketName = outputs[`${environmentSuffix}-ContentBucketName`];
  const distributionId = outputs[`${environmentSuffix}-DistributionId`];
  const distributionDomain =
    outputs[`${environmentSuffix}-DistributionDomainName`];
  const viewerRequestFunctionArn =
    outputs[`${environmentSuffix}-ViewerRequestFunctionArn`];
  const viewerResponseFunctionArn =
    outputs[`${environmentSuffix}-ViewerResponseFunctionArn`];

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
    expect(
      viewerRequestFunction.Configuration?.Environment?.Variables?.TABLE_NAME
    ).toBe(tableName);

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
});
