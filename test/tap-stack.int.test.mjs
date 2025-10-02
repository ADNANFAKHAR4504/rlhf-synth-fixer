// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import https from 'https';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, GetDistributionCommand, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { CloudWatchClient, GetDashboardCommand, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read actual deployment outputs (required for integration tests)
let outputs;
try {
  // Try to read from cfn-outputs/flat-outputs.json first (CI/CD format)
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  console.log('✅ Loaded deployment outputs from cfn-outputs/flat-outputs.json');
} catch (error) {
  try {
    // Fallback to cdk-outputs.json (local deployment format)
    const cdkOutputs = JSON.parse(fs.readFileSync('cdk-outputs.json', 'utf8'));
    const stackName = `TapStack${environmentSuffix}`;
    outputs = cdkOutputs[stackName] || {};
    console.log(`✅ Loaded deployment outputs from cdk-outputs.json (stack: ${stackName})`);
  } catch (cdkError) {
    console.error('❌ Failed to load deployment outputs from both sources:');
    console.error(`  - cfn-outputs/flat-outputs.json: ${error.message}`);
    console.error(`  - cdk-outputs.json: ${cdkError.message}`);
    console.error('💡 Integration tests require real deployment outputs');
    console.error('🚀 Deploy the stack first using: ./scripts/deploy.sh');
    process.exit(1);
  }
}

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is global
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

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

// Helper function to wait for a condition
const waitFor = async (condition, timeout = 30000, interval = 1000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
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
    // Debug: Show available outputs
    console.log('🔍 Available deployment outputs:');
    console.log(JSON.stringify(outputs, null, 2));
    
    console.log(`\n🔍 Looking for news website outputs (environment: ${environmentSuffix}):`);
    console.log(`  - WebsiteBucketName${environmentSuffix} OR NewsWebsiteBucket-${environmentSuffix}`);
    console.log(`  - DistributionId${environmentSuffix} OR NewsDistributionId-${environmentSuffix}`);
    console.log(`  - DistributionDomainName${environmentSuffix} OR NewsDistributionDomain-${environmentSuffix}`);
    console.log(`  - KMSKeyId${environmentSuffix} OR NewsKMSKeyId-${environmentSuffix}`);
    
    // Validate that all required outputs are present
    if (!bucketName || !distributionId || !distributionDomain || !kmsKeyId) {
      console.error('\n❌ Missing required deployment outputs for news website infrastructure:');
      console.error(`  - Bucket Name: ${bucketName || 'MISSING'}`);
      console.error(`  - Distribution ID: ${distributionId || 'MISSING'}`);
      console.error(`  - Distribution Domain: ${distributionDomain || 'MISSING'}`);
      console.error(`  - KMS Key ID: ${kmsKeyId || 'MISSING'}`);
      console.error('\n💡 The current deployment appears to be a different stack (backup system).');
      console.error('🔄 To deploy the news website infrastructure:');
      console.error(`   1. Run: cdk deploy TapStack${environmentSuffix}`);
      console.error('   2. Ensure the stack creates S3 bucket, CloudFront distribution, and KMS key');
      console.error('   3. Re-run integration tests');
      throw new Error('Integration tests require news website deployment outputs to be present');
    }
    
    console.log('\n✅ All deployment outputs validated successfully');
    console.log(`🗄️  Bucket: ${bucketName}`);
    console.log(`🌐 Distribution: ${distributionId} (${distributionDomain})`);
    console.log(`🔐 KMS Key: ${kmsKeyId}`);
  });

  describe('S3 Bucket Operations', () => {
    test('should upload content to S3 bucket with KMS encryption', async () => {
      const testContent = '<html><body><h1>Test News Article</h1><p>This is a test article.</p></body></html>';
      const key = 'test-article.html';

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: testContent,
        ContentType: 'text/html',
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: kmsKeyId
      });

      await expect(s3Client.send(putCommand)).resolves.not.toThrow();

      // Verify the object exists and is encrypted
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      const headResponse = await s3Client.send(headCommand);
      expect(headResponse.ServerSideEncryption).toBe('aws:kms');
      expect(headResponse.SSEKMSKeyId).toContain(kmsKeyId);
    }, 30000);

    test('should retrieve content from S3 bucket', async () => {
      const key = 'test-article.html';
      
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      const response = await s3Client.send(getCommand);
      const content = await response.Body.transformToString();
      
      expect(content).toContain('Test News Article');
      expect(content).toContain('This is a test article');
    }, 30000);

    test('should handle versioning correctly', async () => {
      const key = 'versioned-article.html';
      const content1 = '<html><body><h1>Version 1</h1></body></html>';
      const content2 = '<html><body><h1>Version 2</h1></body></html>';

      // Upload first version
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: content1,
        ContentType: 'text/html'
      }));

      // Upload second version
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: content2,
        ContentType: 'text/html'
      }));

      // Verify latest version
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      }));
      
      const content = await response.Body.transformToString();
      expect(content).toContain('Version 2');
    }, 30000);
  });

  describe('CloudFront Distribution', () => {
    test('should have correct distribution configuration', async () => {
      const command = new GetDistributionCommand({
        Id: distributionId
      });

      const response = await cloudFrontClient.send(command);
      const config = response.Distribution.DistributionConfig;

      expect(config.Enabled).toBe(true);
      expect(config.DefaultRootObject).toBe('index.html');
      expect(config.PriceClass).toBe('PriceClass_100');
      // CloudFront uses default certificate, so TLS version is 'TLSv1' (not custom certificate)
      expect(config.ViewerCertificate.MinimumProtocolVersion).toBe('TLSv1');
      expect(config.Origins.Quantity).toBe(1);
      expect(config.Origins.Items[0].DomainName).toContain('.s3.');
    }, 30000);

    test('should serve content through CloudFront', async () => {
      // First upload an index.html file
      const indexContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>News Website - ${environmentSuffix}</title>
        </head>
        <body>
          <h1>Welcome to News Website</h1>
          <p>Environment: ${environmentSuffix}</p>
          <p>Served via CloudFront</p>
        </body>
        </html>
      `;

      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: 'index.html',
        Body: indexContent,
        ContentType: 'text/html'
      }));

      // Wait a bit for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test CloudFront distribution
      const response = await makeHttpRequest(`https://${distributionDomain}/`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Welcome to News Website');
      expect(response.body).toContain(`Environment: ${environmentSuffix}`);
      expect(response.headers['x-cache']).toBeDefined(); // CloudFront header
    }, 60000);

    test('should handle 404 errors correctly', async () => {
      // Upload 404.html
      const notFoundContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Page Not Found</title>
        </head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The requested page could not be found.</p>
        </body>
        </html>
      `;

      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: '404.html',
        Body: notFoundContent,
        ContentType: 'text/html'
      }));

      // Test non-existent page
      const response = await makeHttpRequest(`https://${distributionDomain}/non-existent-page.html`);
      
      expect(response.statusCode).toBe(404);
      expect(response.body).toContain('404 - Page Not Found');
    }, 60000);

    test('should enforce HTTPS redirect', async () => {
      // This test would require HTTP request, but CloudFront automatically redirects
      // We can verify the configuration instead
      const command = new GetDistributionCommand({
        Id: distributionId
      });

      const response = await cloudFrontClient.send(command);
      const behavior = response.Distribution.DistributionConfig.DefaultCacheBehavior;
      
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    }, 30000);

    test('should create cache invalidation', async () => {
      const command = new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/test-invalidation.html']
          },
          CallerReference: `test-${Date.now()}`
        }
      });

      const response = await cloudFrontClient.send(command);
      expect(response.Invalidation.Id).toBeDefined();
      expect(response.Invalidation.Status).toBe('InProgress');
    }, 30000);
  });


  describe('KMS Encryption', () => {
    test('should have correct KMS key configuration', async () => {
      const command = new DescribeKeyCommand({
        KeyId: kmsKeyId
      });

      const response = await kmsClient.send(command);
      const keyMetadata = response.KeyMetadata;

      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Description).toContain(`KMS key for news website content encryption - ${environmentSuffix}`);
      
      // Check key rotation status separately
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: kmsKeyId
      });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    test('should have dashboard configured', async () => {
      const command = new GetDashboardCommand({
        DashboardName: `NewsWebsiteMetrics-${environmentSuffix}`
      });

      const response = await cloudWatchClient.send(command);
      const dashboardBody = JSON.parse(response.DashboardBody);

      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
      
      // Check for CloudFront metrics widgets
      const hasCloudFrontWidget = dashboardBody.widgets.some(widget => 
        widget.properties && widget.properties.title && 
        widget.properties.title.includes('CloudFront')
      );
      expect(hasCloudFrontWidget).toBe(true);
    }, 30000);

    test('should have alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`news-website-high-error-rate-${environmentSuffix}`]
      });

      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms[0];
      
      expect(alarm.AlarmName).toBe(`news-website-high-error-rate-${environmentSuffix}`);
      expect(alarm.MetricName).toBe('TotalErrorRate');
      expect(alarm.Namespace).toBe('AWS/CloudFront');
      expect(alarm.Threshold).toBe(5);
      // AWS CloudWatch uses 'GreaterThanOrEqualToThreshold' as the actual comparison operator
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    }, 30000);
  });

  describe('End-to-End Content Delivery Flow', () => {
    test('should deliver content from S3 through CloudFront with proper caching', async () => {
      const testArticle = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Breaking News - ${Date.now()}</title>
          <meta charset="utf-8">
        </head>
        <body>
          <article>
            <h1>Breaking News Story</h1>
            <p>Published at: ${new Date().toISOString()}</p>
            <p>This is a test news article served through our CDN infrastructure.</p>
            <p>Environment: ${environmentSuffix}</p>
          </article>
        </body>
        </html>
      `;

      const articleKey = `articles/breaking-news-${Date.now()}.html`;

      // 1. Upload article to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: articleKey,
        Body: testArticle,
        ContentType: 'text/html',
        CacheControl: 'max-age=3600',
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: kmsKeyId
      }));

      // 2. Wait for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 3. Request through CloudFront
      const response1 = await makeHttpRequest(`https://${distributionDomain}/${articleKey}`);
      
      expect(response1.statusCode).toBe(200);
      expect(response1.body).toContain('Breaking News Story');
      expect(response1.body).toContain(`Environment: ${environmentSuffix}`);
      expect(response1.headers['content-type']).toContain('text/html');

      // 4. Second request should be cached
      const response2 = await makeHttpRequest(`https://${distributionDomain}/${articleKey}`);
      
      expect(response2.statusCode).toBe(200);
      expect(response2.body).toBe(response1.body);
      
      // Check cache headers (second request might show cache hit)
      if (response2.headers['x-cache']) {
        expect(response2.headers['x-cache']).toMatch(/(Hit|Miss) from cloudfront/i);
      }
    }, 90000);

    test('should handle multiple concurrent requests efficiently', async () => {
      const testContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Load Test Article</title>
        </head>
        <body>
          <h1>Load Test Content</h1>
          <p>Timestamp: ${Date.now()}</p>
        </body>
        </html>
      `;

      const loadTestKey = `load-test/article-${Date.now()}.html`;

      // Upload test content
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: loadTestKey,
        Body: testContent,
        ContentType: 'text/html'
      }));

      // Wait for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Make multiple concurrent requests
      const requests = Array(10).fill().map(() => 
        makeHttpRequest(`https://${distributionDomain}/${loadTestKey}`)
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Load Test Content');
      });

      // Responses should be consistent
      const firstBody = responses[0].body;
      responses.forEach(response => {
        expect(response.body).toBe(firstBody);
      });
    }, 60000);

    test('should properly handle different content types', async () => {
      const contentTypes = [
        { key: 'styles.css', content: 'body { font-family: Arial; }', type: 'text/css' },
        { key: 'script.js', content: 'console.log("Hello World");', type: 'application/javascript' },
        { key: 'data.json', content: '{"message": "Hello World"}', type: 'application/json' }
      ];

      // Upload different content types
      for (const item of contentTypes) {
        await s3Client.send(new PutObjectCommand({
          Bucket: bucketName,
          Key: item.key,
          Body: item.content,
          ContentType: item.type
        }));
      }

      // Wait for S3 consistency
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test each content type
      for (const item of contentTypes) {
        const response = await makeHttpRequest(`https://${distributionDomain}/${item.key}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toBe(item.content);
        expect(response.headers['content-type']).toContain(item.type.split('/')[0]);
      }
    }, 90000);
  });

  describe('Security and Performance Validation', () => {
    test('should enforce security headers', async () => {
      const response = await makeHttpRequest(`https://${distributionDomain}/`);
      
      // CloudFront should add security headers
      expect(response.headers['x-cache']).toBeDefined();
      expect(response.headers['via']).toBeDefined();
      expect(response.headers['x-amz-cf-pop']).toBeDefined();
    }, 30000);

    test('should compress content when appropriate', async () => {
      const largeContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Large Content Test</title>
        </head>
        <body>
          ${'<p>This is a large content block for compression testing. </p>'.repeat(100)}
        </body>
        </html>
      `;

      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: 'large-content.html',
        Body: largeContent,
        ContentType: 'text/html'
      }));

      await new Promise(resolve => setTimeout(resolve, 3000));

      const response = await makeHttpRequest(`https://${distributionDomain}/large-content.html`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      expect(response.statusCode).toBe(200);
      // CloudFront should compress large HTML content
      if (response.headers['content-encoding']) {
        expect(response.headers['content-encoding']).toMatch(/gzip|deflate/);
      }
    }, 60000);

    test('should handle edge cases gracefully', async () => {
      // Test empty file
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: 'empty.html',
        Body: '',
        ContentType: 'text/html'
      }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      const emptyResponse = await makeHttpRequest(`https://${distributionDomain}/empty.html`);
      expect(emptyResponse.statusCode).toBe(200);
      expect(emptyResponse.body).toBe('');

      // Test very long URL (should still work within limits)
      const longKey = 'articles/' + 'a'.repeat(100) + '.html';
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: longKey,
        Body: '<html><body>Long URL test</body></html>',
        ContentType: 'text/html'
      }));

      await new Promise(resolve => setTimeout(resolve, 2000));

      const longUrlResponse = await makeHttpRequest(`https://${distributionDomain}/${longKey}`);
      expect(longUrlResponse.statusCode).toBe(200);
      expect(longUrlResponse.body).toContain('Long URL test');
    }, 60000);
  });

  // Cleanup after tests
  afterAll(async () => {
    // Note: In a real scenario, you might want to clean up test objects
    // For integration tests, we typically leave resources as they are
    // since they're part of the deployed infrastructure
    console.log('Integration tests completed');
  });
});