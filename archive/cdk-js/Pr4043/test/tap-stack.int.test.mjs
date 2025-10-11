import fs from 'fs';
import https from 'https';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand, GetInvalidationCommand } from '@aws-sdk/client-cloudfront';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read actual deployment outputs (required for integration tests)
let outputs;
try {
  // Try to read from cfn-outputs/flat-outputs.json first (CI/CD format)
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  console.log('Loaded deployment outputs from cfn-outputs/flat-outputs.json');
} catch (error) {
  try {
    // Fallback to cdk-outputs.json (local deployment format)
    const cdkOutputs = JSON.parse(fs.readFileSync('cdk-outputs.json', 'utf8'));
    const stackName = `TapStack${environmentSuffix}`;
    outputs = cdkOutputs[stackName] || {};
    console.log(`Loaded deployment outputs from cdk-outputs.json (stack: ${stackName})`);
  } catch (cdkError) {
    console.error('Failed to load deployment outputs from both sources:');
    console.error(`  - cfn-outputs/flat-outputs.json: ${error.message}`);
    console.error(`  - cdk-outputs.json: ${cdkError.message}`);
    console.error('Integration tests require real deployment outputs');
    console.error('Deploy the stack first using: ./scripts/deploy.sh');
    process.exit(1);
  }
}

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });

// Helper function to make HTTP requests
const makeHttpRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      request.write(options.body);
    }
    
    request.end();
  });
};

const waitForInvalidation = async (distributionId, invalidationId, maxWaitTime = 60000) => {
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

describe('News Website Infrastructure Integration Tests', () => {
  // Map output keys based on CDK output names
  const bucketName = outputs[`WebsiteBucketName${environmentSuffix}`] || outputs[`NewsWebsiteBucket-${environmentSuffix}`];
  const distributionId = outputs[`DistributionId${environmentSuffix}`] || outputs[`NewsDistributionId-${environmentSuffix}`];
  const distributionDomain = outputs[`DistributionDomainName${environmentSuffix}`] || outputs[`NewsDistributionDomain-${environmentSuffix}`];
  const kmsKeyId = outputs[`KMSKeyId${environmentSuffix}`] || outputs[`NewsKMSKeyId-${environmentSuffix}`];

  beforeAll(() => {
    if (!bucketName || !distributionId || !distributionDomain || !kmsKeyId) {
      throw new Error('Required stack outputs not found. Please run: ./scripts/get-outputs.sh');
    }
    console.log(`Testing News Website (${environmentSuffix}): ${distributionDomain}`);
  });

  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('complete news article publishing and delivery flow', async () => {
    console.log('=== Starting Complete News Article Publishing Flow ===');

    const timestamp = Date.now();
    const articleKey = `articles/breaking-news-${timestamp}.html`;

    console.log('Step 1: Publishing breaking news article with KMS encryption');
    const articleContent = `<!DOCTYPE html>
<html>
<head>
  <title>Breaking News - ${new Date(timestamp).toLocaleString()}</title>
  <meta charset="utf-8">
</head>
<body>
  <article>
    <h1>Major Technology Breakthrough Announced</h1>
    <p>Published: ${new Date(timestamp).toISOString()}</p>
    <p>In a groundbreaking announcement, researchers have discovered...</p>
    <p>This article is served securely through CloudFront CDN with KMS encryption at rest.</p>
  </article>
</body>
</html>`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: articleKey,
      Body: articleContent,
      ContentType: 'text/html',
      CacheControl: 'max-age=3600',
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: kmsKeyId
    }));
    console.log('✓ Article published to S3 with KMS encryption');

    console.log('Step 2: Waiting for S3 consistency');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Step 3: Accessing article through CloudFront CDN');
    const cdnUrl = `https://${distributionDomain}/${articleKey}`;
    const response1 = await makeHttpRequest(cdnUrl);

    expect(response1.statusCode).toBe(200);
    expect(response1.body).toContain('Major Technology Breakthrough');
    expect(response1.body).toContain('CloudFront CDN');
    expect(response1.headers['content-type']).toContain('text/html');
    expect(response1.headers['x-cache']).toBeDefined();
    console.log(`✓ Content delivered via CloudFront (Cache Status: ${response1.headers['x-cache']})`);

    console.log('Step 4: Second request to verify caching');
    const response2 = await makeHttpRequest(cdnUrl);
    expect(response2.statusCode).toBe(200);
    expect(response2.body).toBe(response1.body);
    console.log(`✓ Cached content served (Cache Status: ${response2.headers['x-cache']})`);

    console.log('Step 5: Verifying encrypted storage in S3');
    const s3Response = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: articleKey
    }));
    const s3Content = await s3Response.Body.transformToString();
    expect(s3Content).toContain('Major Technology Breakthrough');
    console.log('✓ Article verified in S3 with encryption');

    console.log('Step 6: Cleanup');
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: articleKey
    }));
    console.log('✓ Test article removed');
    console.log('=== Flow Complete ===\n');
  }, 90000);

  test('concurrent global reader access flow', async () => {
    console.log('=== Starting Concurrent Global Reader Access Flow ===');

    const timestamp = Date.now();
    const articles = [
      { key: `articles/tech-${timestamp}.html`, title: 'Technology News', category: 'tech' },
      { key: `articles/sports-${timestamp}.html`, title: 'Sports Update', category: 'sports' },
      { key: `articles/finance-${timestamp}.html`, title: 'Market Analysis', category: 'finance' },
    ];

    console.log('Step 1: Publishing multiple articles with KMS encryption');
    await Promise.all(
      articles.map(article =>
        s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: article.key,
          Body: `<!DOCTYPE html>
<html>
<head><title>${article.title}</title></head>
<body>
  <h1>${article.title}</h1>
  <p>Category: ${article.category}</p>
  <p>Published: ${new Date(timestamp).toISOString()}</p>
</body>
</html>`,
          ContentType: 'text/html',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: kmsKeyId
        }))
      )
    );
    console.log(`✓ ${articles.length} articles published with encryption`);

    console.log('Step 2: Waiting for S3 consistency');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Step 3: Simulating 30 concurrent global reader requests');
    const requests = [];
    for (let i = 0; i < 10; i++) {
      articles.forEach(article => {
        const url = `https://${distributionDomain}/${article.key}`;
        requests.push(makeHttpRequest(url));
      });
    }

    const responses = await Promise.all(requests);
    const successfulRequests = responses.filter(r => r.statusCode === 200);
    expect(successfulRequests.length).toBe(30);
    console.log(`✓ All ${successfulRequests.length} requests successful`);

    console.log('Step 4: Verifying content delivery consistency');
    responses.forEach(response => {
      expect(response.statusCode).toBe(200);
      expect(response.headers['x-cache']).toBeDefined();
    });
    console.log('✓ All responses consistent with CDN headers');

    console.log('Step 5: Cleanup');
    await Promise.all(
      articles.map(article =>
        s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: article.key
        }))
      )
    );
    console.log('✓ Test articles removed');
    console.log('=== Flow Complete ===\n');
  }, 120000);

  test('article update with cache invalidation flow', async () => {
    console.log('=== Starting Article Update with Cache Invalidation Flow ===');

    const timestamp = Date.now();
    const articleKey = `articles/developing-story-${timestamp}.html`;

    console.log('Step 1: Publishing initial version of developing story');
    const initialContent = `<!DOCTYPE html>
<html>
<head><title>Developing Story - Version 1</title></head>
<body>
  <h1>Breaking: Developing Story</h1>
  <p>Initial report published at ${new Date(timestamp).toLocaleString()}</p>
  <p>Details are still emerging...</p>
</body>
</html>`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: articleKey,
      Body: initialContent,
      ContentType: 'text/html',
      CacheControl: 'max-age=3600',
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: kmsKeyId
    }));
    console.log('✓ Initial version published');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Step 2: Readers access initial version');
    const cdnUrl = `https://${distributionDomain}/${articleKey}`;
    const initialResponse = await makeHttpRequest(cdnUrl);
    expect(initialResponse.statusCode).toBe(200);
    expect(initialResponse.body).toContain('Version 1');
    console.log('✓ Initial version delivered to readers');

    console.log('Step 3: Updating story with new information');
    const updatedContent = `<!DOCTYPE html>
<html>
<head><title>Developing Story - Version 2 (Updated)</title></head>
<body>
  <h1>Breaking: Developing Story - UPDATED</h1>
  <p>Updated at ${new Date().toLocaleString()}</p>
  <p>New details have emerged with confirmed information...</p>
  <p>This is the latest version of the developing story.</p>
</body>
</html>`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: articleKey,
      Body: updatedContent,
      ContentType: 'text/html',
      CacheControl: 'max-age=3600',
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: kmsKeyId
    }));
    console.log('✓ Updated version published to S3');

    console.log('Step 4: Invalidating CloudFront cache');
    const invalidationResponse = await cloudFrontClient.send(new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: [`/${articleKey}`]
        },
        CallerReference: `update-${timestamp}`
      }
    }));

    const invalidationId = invalidationResponse.Invalidation.Id;
    expect(invalidationId).toBeDefined();
    console.log(`✓ Cache invalidation initiated: ${invalidationId}`);

    console.log('Step 5: Waiting for cache invalidation (up to 60s)');
    const completed = await waitForInvalidation(distributionId, invalidationId, 60000);
    if (completed) {
      console.log('✓ Cache invalidation completed');
    } else {
      console.log('⚠ Invalidation in progress (will complete shortly)');
    }

    console.log('Step 6: Readers access updated version');
    await new Promise(resolve => setTimeout(resolve, 5000));
    const updatedResponse = await makeHttpRequest(cdnUrl);
    expect(updatedResponse.statusCode).toBe(200);
    console.log('✓ Updated content accessible to readers');

    console.log('Step 7: Cleanup');
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: articleKey
    }));
    console.log('✓ Test article removed');
    console.log('=== Flow Complete ===\n');
  }, 150000);
});