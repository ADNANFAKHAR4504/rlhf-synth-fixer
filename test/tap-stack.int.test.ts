import fs from 'fs';
import http from 'http';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  }
} catch (error) {
  console.warn('CFN outputs file not found, using environment variables as fallback');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region });

const makeHttpRequest = (url: string): Promise<{ statusCode: number; body: string }> => {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response: any) => {
      let body = '';
      response.on('data', (chunk: any) => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode || 0,
          body
        });
      });
    });
    
    request.on('error', (error: Error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

const waitForWebServer = async (url: string, maxWaitTime = 180000): Promise<boolean> => {
  const startTime = Date.now();
  console.log(`Waiting for web server at ${url} to be ready...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await makeHttpRequest(url);
      if (response.statusCode === 200 && response.body.includes('Blog Platform')) {
        console.log(`✓ Web server ready after ${Math.round((Date.now() - startTime) / 1000)}s`);
        return true;
      }
    } catch (error) {
      // Expected during bootstrap
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  return false;
};

describe('Blog Platform Infrastructure Integration Tests', () => {
  const instanceId = outputs.InstanceId || process.env.INSTANCE_ID;
  const publicIp = outputs.PublicIp || process.env.PUBLIC_IP;
  const websiteUrl = outputs.WebsiteUrl || process.env.WEBSITE_URL || `http://${publicIp}`;

  beforeAll(() => {
    if (!instanceId || !publicIp) {
      throw new Error('Required stack outputs not found. Please run: ./scripts/get-outputs.sh');
    }
    console.log(`Testing Blog Platform: ${websiteUrl}`);
  });

  afterEach(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('blog platform deployment and initialization flow', async () => {
    console.log('=== Starting Blog Platform Deployment and Initialization Flow ===');

    console.log('Step 1: Verifying EC2 instance is running');
    const instanceCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId]
    });
    const instanceResponse = await ec2Client.send(instanceCommand);
    const instance = instanceResponse.Reservations![0].Instances![0];
    
    expect(instance.State?.Name).toBe('running');
    expect(instance.InstanceType).toBe('t3.micro');
    expect(instance.Monitoring?.State).toBe('enabled');
    console.log(`✓ Instance ${instanceId} running with detailed monitoring`);

    console.log('Step 2: Waiting for Apache web server initialization');
    const isReady = await waitForWebServer(websiteUrl, 180000);
    expect(isReady).toBe(true);

    console.log('Step 3: Validating blog platform home page');
    const response = await makeHttpRequest(websiteUrl);
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Blog Platform');
    expect(response.body).toContain(`Environment: ${environmentSuffix}`);
    expect(response.body).toContain('Instance ID:');
    console.log('✓ Blog platform home page accessible and serving correct content');

    console.log('Step 4: Verifying instance metadata in response');
    expect(response.body).toContain(instanceId);
    console.log('✓ Instance metadata correctly displayed');

    console.log('=== Flow Complete ===\n');
  }, 300000);

  test('concurrent reader access and scalability flow', async () => {
    console.log('=== Starting Concurrent Reader Access Flow ===');

    console.log('Step 1: Simulating 20 concurrent blog readers');
    const requests = Array(20).fill(null).map(() => makeHttpRequest(websiteUrl));
    
    const responses = await Promise.all(requests);
    const successful = responses.filter(r => r.statusCode === 200);
    
    expect(successful.length).toBe(20);
    console.log(`✓ All ${successful.length} concurrent readers successfully accessed the blog`);

    console.log('Step 2: Verifying response consistency');
    responses.forEach((response, idx) => {
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('Blog Platform');
      expect(response.body).toContain(instanceId);
    });
    console.log('✓ All responses consistent and correct');

    console.log('Step 3: Testing sustained load (5000 daily readers simulation)');
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < 50; i++) {
      try {
        const res = await makeHttpRequest(websiteUrl);
        if (res.statusCode === 200) successCount++;
        else failCount++;
      } catch (error) {
        failCount++;
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/50 requests...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const availability = (successCount / (successCount + failCount)) * 100;
    expect(availability).toBeGreaterThanOrEqual(95);
    console.log(`✓ Platform availability: ${availability.toFixed(2)}% (${successCount}/${successCount + failCount})`);

    console.log('=== Flow Complete ===\n');
  }, 180000);

  test('monitoring and performance tracking flow', async () => {
    console.log('=== Starting Monitoring and Performance Tracking Flow ===');

    console.log('Step 1: Validating CloudWatch detailed monitoring');
    const instanceCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId]
    });
    const instanceResponse = await ec2Client.send(instanceCommand);
    const instance = instanceResponse.Reservations![0].Instances![0];
    
    expect(instance.Monitoring?.State).toBe('enabled');
    console.log('✓ Detailed monitoring enabled on EC2 instance');

    console.log('Step 2: Measuring baseline application response time');
    const startTime = Date.now();
    const response = await makeHttpRequest(websiteUrl);
    const responseTime = Date.now() - startTime;
    
    expect(response.statusCode).toBe(200);
    expect(responseTime).toBeLessThan(5000);
    console.log(`✓ Baseline response time: ${responseTime}ms`);

    console.log('Step 3: Simulating reader load to generate metrics');
    const loadRequests = [];
    for (let i = 0; i < 30; i++) {
      loadRequests.push(makeHttpRequest(websiteUrl));
    }
    
    const loadResponses = await Promise.all(loadRequests);
    const successfulLoad = loadResponses.filter(r => r.statusCode === 200);
    expect(successfulLoad.length).toBeGreaterThan(25);
    console.log(`✓ Load test: ${successfulLoad.length}/30 requests successful`);

    console.log('Step 4: Verifying instance remains responsive after load');
    await new Promise(resolve => setTimeout(resolve, 5000));
    const postLoadResponse = await makeHttpRequest(websiteUrl);
    expect(postLoadResponse.statusCode).toBe(200);
    expect(postLoadResponse.body).toContain('Blog Platform');
    console.log('✓ Instance recovered and responsive after load');

    console.log('=== Flow Complete ===\n');
  }, 240000);
});
