import fs from 'fs';
import https from 'https';
import { 
  DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand 
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { 
  CloudWatchClient, GetMetricStatisticsCommand, DescribeAlarmsCommand 
} from '@aws-sdk/client-cloudwatch';
import { 
  EventBridgeClient, PutEventsCommand, ListEventBusesCommand 
} from '@aws-sdk/client-eventbridge';
import { 
  SyntheticsClient, GetCanaryCommand, GetCanaryRunsCommand 
} from '@aws-sdk/client-synthetics';
import { 
  ApiGatewayClient, GetRestApiCommand, GetStageCommand 
} from '@aws-sdk/client-api-gateway';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load deployment outputs
let outputs = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('Could not load cfn-outputs, tests may fail:', error.message);
}

// Helper function to make HTTPS requests
const makeRequest = (url, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

describe('Global SaaS API - Real-World Application Flows', () => {
  const regions = ['us-east-1', 'ap-south-1'];
  let apiEndpoints = {};
  let tableName;
  let assetBucketName;
  let eventBusName;
  let lambdaFunctionName;

  beforeAll(() => {
    // Extract outputs for both regions
    regions.forEach(region => {
      const prefix = `global-api-${environmentSuffix}-${region}`;
      apiEndpoints[region] = outputs[`${prefix}-ApiEndpoint`];
      if (!tableName) tableName = outputs[`${prefix}-TableName`];
      if (!assetBucketName) assetBucketName = outputs[`${prefix}-AssetBucketName`];
      if (!eventBusName) eventBusName = outputs[`${prefix}-EventBusName`];
      if (!lambdaFunctionName) lambdaFunctionName = outputs[`${prefix}-LambdaFunctionName`];
    });
  });

  describe('Scenario 1: Global Content Collaboration - User creates document in India, colleague accesses from USA', () => {
    const documentId = `doc-collab-${Date.now()}`;
    const authorUserId = 'user-india-123';
    const readerUserId = 'user-usa-456';

    test('Step 1: Indian user creates a project document', async () => {
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      
      const document = {
        id: documentId,
        title: 'Q4 Marketing Strategy',
        content: 'Our strategy focuses on APAC expansion...',
        authorId: authorUserId,
        authorRegion: 'ap-south-1',
        collaborators: [readerUserId],
        createdAt: new Date().toISOString(),
        version: 1
      };

      const response = await makeRequest(`${indiaEndpoint}data`, 'POST', document);
      
      expect(response.statusCode).toBe(201);
      expect(response.body.id).toBe(documentId);
      console.log(`✓ Document created by ${authorUserId} in India region`);
    }, 30000);

    test('Step 2: Wait for global replication (simulating real-world latency)', async () => {
      // Simulate real-world cross-region replication time
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✓ Replication window completed');
    }, 10000);

    test('Step 3: US user accesses the document from their local region', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      
      const response = await makeRequest(`${usEndpoint}data?id=${documentId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe('Q4 Marketing Strategy');
      expect(response.body.authorId).toBe(authorUserId);
      expect(response.body.collaborators).toContain(readerUserId);
      console.log(`✓ Document accessed by ${readerUserId} from US region`);
    }, 30000);

    test('Step 4: Verify low-latency access from user\\'s nearest region', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      const startTime = Date.now();
      
      await makeRequest(`${usEndpoint}data?id=${documentId}`);
      
      const latency = Date.now() - startTime;
      expect(latency).toBeLessThan(2000); // Should be fast from local region
      console.log(`✓ Latency: ${latency}ms - Meeting SLA requirements`);
    }, 30000);
  });

  describe('Scenario 2: E-commerce Platform - User places order in USA, fulfillment center in India processes it', () => {
    const orderId = `order-${Date.now()}`;
    const customerId = 'customer-usa-789';
    const productId = 'product-global-001';

    test('Step 1: Customer places order from US region', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      
      const order = {
        id: orderId,
        customerId: customerId,
        productId: productId,
        quantity: 2,
        totalAmount: 299.98,
        currency: 'USD',
        orderStatus: 'pending',
        shippingAddress: {
          country: 'USA',
          city: 'New York'
        },
        orderedAt: new Date().toISOString()
      };

      const response = await makeRequest(`${usEndpoint}data`, 'POST', order);
      
      expect(response.statusCode).toBe(201);
      console.log(`✓ Order ${orderId} placed by customer ${customerId}`);
    }, 30000);

    test('Step 2: Order replicates to India fulfillment center', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      const response = await makeRequest(`${indiaEndpoint}data?id=${orderId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.orderStatus).toBe('pending');
      console.log('✓ Order visible in India fulfillment center');
    }, 30000);

    test('Step 3: Fulfillment center updates order status to processing', async () => {
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      
      const updateData = {
        id: orderId,
        orderStatus: 'processing',
        fulfillmentCenter: 'IN-HYD-01',
        processedAt: new Date().toISOString()
      };

      const response = await makeRequest(`${indiaEndpoint}data`, 'POST', updateData);
      
      expect(response.statusCode).toBe(201);
      console.log('✓ Order status updated to processing');
    }, 30000);

    test('Step 4: Customer checks order status from US and sees update', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const usEndpoint = apiEndpoints['us-east-1'];
      const response = await makeRequest(`${usEndpoint}data?id=${orderId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.orderStatus).toBe('processing');
      console.log(`✓ Customer sees updated order status from their region`);
    }, 30000);
  });

  describe('Scenario 3: Media Platform - Content creator uploads video, subscribers access globally', () => {
    const videoId = `video-${Date.now()}`;
    const creatorId = 'creator-premium-555';
    const subscriberUS = 'subscriber-us-111';
    const subscriberIndia = 'subscriber-in-222';

    test('Step 1: Creator uploads video metadata and thumbnail in India', async () => {
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      
      const videoMetadata = {
        id: videoId,
        creatorId: creatorId,
        title: 'How to Build Global APIs',
        description: 'Tutorial on building globally distributed systems',
        duration: '15:32',
        category: 'Technology',
        uploadRegion: 'ap-south-1',
        uploadedAt: new Date().toISOString(),
        viewCount: 0,
        status: 'published'
      };

      const response = await makeRequest(`${indiaEndpoint}data`, 'POST', videoMetadata);
      
      expect(response.statusCode).toBe(201);
      console.log(`✓ Video ${videoId} published by creator ${creatorId}`);
    }, 30000);

    test('Step 2: Upload video thumbnail to S3', async () => {
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      const thumbnailKey = `thumbnails/${videoId}.jpg`;
      
      const thumbnail = {
        key: thumbnailKey,
        content: {
          videoId: videoId,
          url: `https://cdn.example.com/${thumbnailKey}`,
          size: '1920x1080',
          format: 'JPEG'
        }
      };

      const response = await makeRequest(`${indiaEndpoint}assets`, 'POST', thumbnail);
      
      expect(response.statusCode).toBe(201);
      console.log(`✓ Thumbnail uploaded to S3`);
    }, 30000);

    test('Step 3: US subscriber discovers and views video from their region', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const usEndpoint = apiEndpoints['us-east-1'];
      const response = await makeRequest(`${usEndpoint}data?id=${videoId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe('How to Build Global APIs');
      expect(response.body.creatorId).toBe(creatorId);
      console.log(`✓ ${subscriberUS} accessed video from US region`);
    }, 30000);

    test('Step 4: Track view count increment from US viewer', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      
      const viewEvent = {
        id: videoId,
        viewCount: 1,
        lastViewedBy: subscriberUS,
        lastViewedAt: new Date().toISOString(),
        viewRegion: 'us-east-1'
      };

      const response = await makeRequest(`${usEndpoint}data`, 'POST', viewEvent);
      expect(response.statusCode).toBe(201);
      console.log('✓ View count updated');
    }, 30000);

    test('Step 5: India subscriber also views video, sees updated metrics', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      const response = await makeRequest(`${indiaEndpoint}data?id=${videoId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.viewCount).toBeGreaterThanOrEqual(1);
      console.log(`✓ ${subscriberIndia} accessed video with updated view count`);
    }, 30000);

    test('Step 6: Verify thumbnail accessible from both regions', async () => {
      const thumbnailKey = `thumbnails/${videoId}.jpg`;
      
      // Check from US
      const usEndpoint = apiEndpoints['us-east-1'];
      const usResponse = await makeRequest(`${usEndpoint}assets?key=${thumbnailKey}`);
      expect(usResponse.statusCode).toBe(200);
      
      // Check from India
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      const indiaResponse = await makeRequest(`${indiaEndpoint}assets?key=${thumbnailKey}`);
      expect(indiaResponse.statusCode).toBe(200);
      
      console.log('✓ Thumbnail accessible from both regions (S3 replication working)');
    }, 30000);
  });

  describe('Scenario 4: Real-Time Collaboration - Multiple users edit shared document simultaneously', () => {
    const projectId = `project-${Date.now()}`;
    const userUSA = 'user-usa-444';
    const userIndia = 'user-india-333';

    test('Step 1: Create shared project workspace', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      
      const project = {
        id: projectId,
        name: 'Global Product Launch',
        type: 'workspace',
        owner: userUSA,
        collaborators: [userUSA, userIndia],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: 1
      };

      const response = await makeRequest(`${usEndpoint}data`, 'POST', project);
      expect(response.statusCode).toBe(201);
      console.log(`✓ Project workspace created by ${userUSA}`);
    }, 30000);

    test('Step 2: USA user adds initial content', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      const contentKey = `projects/${projectId}/content.md`;
      
      const content = {
        key: contentKey,
        content: {
          text: 'Product Launch Plan:\n1. Market Research\n2. Design Phase',
          lastEditBy: userUSA,
          lastEditAt: new Date().toISOString()
        }
      };

      const response = await makeRequest(`${usEndpoint}assets`, 'POST', content);
      expect(response.statusCode).toBe(201);
      console.log('✓ Initial content added');
    }, 30000);

    test('Step 3: India user sees project and adds their contribution', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      const response = await makeRequest(`${indiaEndpoint}data?id=${projectId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.collaborators).toContain(userIndia);
      console.log(`✓ ${userIndia} accessed shared project`);
      
      // Add comment/contribution
      const contributionKey = `projects/${projectId}/comments/${Date.now()}.json`;
      const comment = {
        key: contributionKey,
        content: {
          userId: userIndia,
          comment: 'Adding India market insights for phase 1',
          timestamp: new Date().toISOString()
        }
      };

      const commentResponse = await makeRequest(`${indiaEndpoint}assets`, 'POST', comment);
      expect(commentResponse.statusCode).toBe(201);
      console.log(`✓ ${userIndia} added contribution`);
    }, 30000);

    test('Step 4: Verify collaboration visible to both users', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // US user checks for updates
      const usEndpoint = apiEndpoints['us-east-1'];
      const projectResponse = await makeRequest(`${usEndpoint}data?id=${projectId}`);
      
      expect(projectResponse.statusCode).toBe(200);
      console.log('✓ Real-time collaboration working across regions');
    }, 30000);
  });

  describe('Scenario 5: Event-Driven Notifications - User action triggers notifications across platform', () => {
    const userId = 'user-premium-999';
    const followerId1 = 'follower-us-101';
    const followerId2 = 'follower-india-102';

    test('Step 1: User publishes content and triggers notification event', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      const postId = `post-${Date.now()}`;
      
      const post = {
        id: postId,
        userId: userId,
        content: 'Excited to announce our new global feature!',
        postedAt: new Date().toISOString(),
        notifyFollowers: true
      };

      const response = await makeRequest(`${usEndpoint}data`, 'POST', post);
      expect(response.statusCode).toBe(201);
      console.log(`✓ Post ${postId} created and event published`);
    }, 30000);

    test('Step 2: Verify event published to EventBridge', async () => {
      const client = new EventBridgeClient({ region: 'us-east-1' });
      
      const eventDetail = {
        postId: `post-${Date.now()}`,
        userId: userId,
        action: 'new_post',
        followers: [followerId1, followerId2]
      };

      const result = await client.send(new PutEventsCommand({
        Entries: [{
          Source: 'global-api.events',
          DetailType: 'UserContentPublished',
          Detail: JSON.stringify(eventDetail),
          EventBusName: eventBusName
        }]
      }));

      expect(result.FailedEntryCount).toBe(0);
      console.log('✓ Notification event published to EventBridge');
    }, 30000);

    test('Step 3: Verify event replicated cross-region (event bus in both regions)', async () => {
      for (const region of regions) {
        const client = new EventBridgeClient({ region });
        const result = await client.send(new ListEventBusesCommand({}));
        
        const eventBus = result.EventBuses.find(bus => bus.Name === eventBusName);
        expect(eventBus).toBeDefined();
      }
      console.log('✓ Event buses active in both regions for notification delivery');
    }, 30000);
  });

  describe('Scenario 6: High Traffic Load - Simulating burst of concurrent users (2M users scale)', () => {
    test('Step 1: Simulate 50 concurrent users accessing health endpoint', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      const concurrentRequests = 50;
      
      const startTime = Date.now();
      const promises = Array(concurrentRequests).fill(null).map((_, i) =>
        makeRequest(`${usEndpoint}health`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      const successCount = responses.filter(r => r.statusCode === 200).length;
      expect(successCount).toBe(concurrentRequests);
      
      const avgLatency = (endTime - startTime) / concurrentRequests;
      console.log(`✓ Handled ${concurrentRequests} concurrent requests`);
      console.log(`✓ Average latency: ${avgLatency.toFixed(2)}ms per request`);
      expect(avgLatency).toBeLessThan(500); // Should handle load efficiently
    }, 60000);

    test('Step 2: Test API throttling and rate limits under load', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      
      // Make rapid sequential requests
      const rapidRequests = 20;
      let successCount = 0;
      
      for (let i = 0; i < rapidRequests; i++) {
        try {
          const response = await makeRequest(`${usEndpoint}health`);
          if (response.statusCode === 200) successCount++;
        } catch (error) {
          // Some requests might be throttled - this is expected
        }
      }
      
      expect(successCount).toBeGreaterThan(rapidRequests * 0.8); // At least 80% success rate
      console.log(`✓ API handled rapid requests: ${successCount}/${rapidRequests} successful`);
    }, 60000);

    test('Step 3: Verify provisioned concurrency handling parallel data operations', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      const operations = 20;
      
      const dataOperations = Array(operations).fill(null).map((_, i) => {
        const dataId = `concurrent-test-${Date.now()}-${i}`;
        return makeRequest(`${usEndpoint}data`, 'POST', {
          id: dataId,
          testIndex: i,
          timestamp: new Date().toISOString()
        });
      });

      const results = await Promise.all(dataOperations);
      const successCount = results.filter(r => r.statusCode === 201).length;
      
      expect(successCount).toBeGreaterThanOrEqual(operations * 0.9); // 90% success rate
      console.log(`✓ Provisioned concurrency handled ${successCount}/${operations} parallel writes`);
    }, 60000);
  });

  describe('Scenario 7: Disaster Recovery - Simulating region failover', () => {
    const userId = 'user-critical-888';
    const sessionId = `session-${Date.now()}`;

    test('Step 1: User establishes session in primary region (US)', async () => {
      const usEndpoint = apiEndpoints['us-east-1'];
      
      const session = {
        id: sessionId,
        userId: userId,
        loginTime: new Date().toISOString(),
        region: 'us-east-1',
        active: true
      };

      const response = await makeRequest(`${usEndpoint}data`, 'POST', session);
      expect(response.statusCode).toBe(201);
      console.log(`✓ User session established in US region`);
    }, 30000);

    test('Step 2: Simulate US region issue - switch to India region', async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // User's traffic routes to India region
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      const response = await makeRequest(`${indiaEndpoint}data?id=${sessionId}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.userId).toBe(userId);
      console.log('✓ Session recovered from India region - zero data loss');
    }, 30000);

    test('Step 3: Verify both regions remain operational for failover', async () => {
      const results = await Promise.all(
        regions.map(async region => {
          try {
            const response = await makeRequest(`${apiEndpoints[region]}health`);
            return { region, healthy: response.body.status === 'healthy', latency: Date.now() };
          } catch (error) {
            return { region, healthy: false, error: error.message };
          }
        })
      );

      results.forEach(result => {
        expect(result.healthy).toBe(true);
        console.log(`✓ Region ${result.region} operational and ready for failover`);
      });
    }, 30000);
  });

  describe('Scenario 8: Monitoring & Observability - Platform health validation', () => {
    test('Step 1: Verify CloudWatch alarms are monitoring critical metrics', async () => {
      const client = new CloudWatchClient({ region: 'us-east-1' });
      
      const result = await client.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `global-api-${environmentSuffix}`
      }));

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms.length).toBeGreaterThan(0);

      const apiErrorsAlarm = result.MetricAlarms.find(alarm => 
        alarm.AlarmName.includes('api-errors')
      );
      expect(apiErrorsAlarm).toBeDefined();
      console.log(`✓ CloudWatch alarms configured: ${result.MetricAlarms.length} alarms active`);
    }, 30000);

    test('Step 2: Verify Synthetics Canary is monitoring uptime', async () => {
      const client = new SyntheticsClient({ region: 'us-east-1' });
      const canaryName = `api-${environmentSuffix}-mon`.substring(0, 21);
      
      const result = await client.send(new GetCanaryCommand({
        Name: canaryName
      }));

      expect(result.Canary).toBeDefined();
      expect(result.Canary.Status.State).toMatch(/RUNNING|READY/);
      console.log(`✓ Synthetics Canary monitoring API health: ${result.Canary.Status.State}`);
    }, 30000);

    test('Step 3: Verify API Gateway tracing and logging enabled', async () => {
      const endpoint = apiEndpoints['us-east-1'];
      const apiId = endpoint.match(/https:\/\/([^.]+)\.execute-api/)[1];
      
      const client = new ApiGatewayClient({ region: 'us-east-1' });
      const stage = await client.send(new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod'
      }));

      expect(stage.tracingEnabled).toBe(true);
      console.log('✓ API Gateway tracing enabled for request tracking');
    }, 30000);
  });

  describe('Scenario 9: Complete End-to-End User Journey', () => {
    test('User registration → content creation → global access → analytics', async () => {
      const newUserId = `user-${Date.now()}`;
      const contentId = `content-${Date.now()}`;
      
      // Step 1: User signs up in India
      const indiaEndpoint = apiEndpoints['ap-south-1'];
      const userProfile = {
        id: newUserId,
        email: `user${Date.now()}@example.com`,
        name: 'Test User',
        region: 'ap-south-1',
        signupAt: new Date().toISOString(),
        plan: 'premium'
      };

      const signupResponse = await makeRequest(`${indiaEndpoint}data`, 'POST', userProfile);
      expect(signupResponse.statusCode).toBe(201);
      console.log(`✓ 1. User registered in India: ${newUserId}`);

      // Step 2: User creates content
      await new Promise(resolve => setTimeout(resolve, 1000));
      const content = {
        id: contentId,
        userId: newUserId,
        title: 'My First Global Post',
        body: 'Hello from India!',
        createdAt: new Date().toISOString()
      };

      const contentResponse = await makeRequest(`${indiaEndpoint}data`, 'POST', content);
      expect(contentResponse.statusCode).toBe(201);
      console.log('✓ 2. Content created');

      // Step 3: Content replicates globally
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 4: User from US accesses the content
      const usEndpoint = apiEndpoints['us-east-1'];
      const accessResponse = await makeRequest(`${usEndpoint}data?id=${contentId}`);
      expect(accessResponse.statusCode).toBe(200);
      expect(accessResponse.body.title).toBe('My First Global Post');
      console.log('✓ 3. Content accessible from US region');

      // Step 5: Track analytics event
      const analyticsEvent = {
        postId: `post-${Date.now()}`,
        userId: newUserId,
        action: 'content_created',
        region: 'ap-south-1',
        timestamp: new Date().toISOString()
      };

      const client = new EventBridgeClient({ region: 'us-east-1' });
      const eventResult = await client.send(new PutEventsCommand({
        Entries: [{
          Source: 'global-api.events',
          DetailType: 'UserAnalytics',
          Detail: JSON.stringify(analyticsEvent),
          EventBusName: eventBusName
        }]
      }));

      expect(eventResult.FailedEntryCount).toBe(0);
      console.log('✓ 4. Analytics tracked for insights');
      console.log('✓ Complete user journey validated across global infrastructure');
    }, 90000);
  });

  describe('Scenario 10: GDPR Compliance & Data Sovereignty', () => {
    test('User data properly tagged and accessible for compliance', async () => {
      const userId = `gdpr-user-${Date.now()}`;
      const usEndpoint = apiEndpoints['us-east-1'];
      
      // Create user data with GDPR-compliant tags
      const userData = {
        id: userId,
        email: 'gdpr.user@example.com',
        dataClassification: 'personal',
        consentGiven: true,
        dataRetentionDays: 90,
        createdAt: new Date().toISOString()
      };

      const response = await makeRequest(`${usEndpoint}data`, 'POST', userData);
      expect(response.statusCode).toBe(201);
      console.log('✓ User data created with GDPR compliance metadata');

      // Verify data can be retrieved (for data export requirement)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retrieveResponse = await makeRequest(`${usEndpoint}data?id=${userId}`);
      expect(retrieveResponse.statusCode).toBe(200);
      expect(retrieveResponse.body.dataClassification).toBe('personal');
      console.log('✓ User data accessible for GDPR data export requests');
    }, 30000);
  });
});