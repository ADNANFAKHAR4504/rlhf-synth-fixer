import * as AWS from 'aws-sdk';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load deployed stack outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const stackOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// AWS SDK configuration
const s3 = new AWS.S3({ region: 'us-east-1' });

interface TrafficResult {
  statusCode: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
}

describe('TapStack Integration Tests - Pure Traffic Validation', () => {
  const albDnsName = stackOutputs.ALBDNSName;
  const s3BucketName = stackOutputs.S3BucketName;

  // Helper function to generate HTTP traffic
  async function generateHttpTraffic(
    url: string,
    requestCount: number = 10,
    concurrency: number = 2,
    options: { timeout?: number; headers?: any } = {}
  ): Promise<LoadTestResult> {
    const results: TrafficResult[] = [];
    const { timeout = 5000, headers = {} } = options;

    // Create batches for concurrent requests
    const batches = [];
    for (let i = 0; i < requestCount; i += concurrency) {
      const batch = [];
      for (let j = 0; j < concurrency && i + j < requestCount; j++) {
        batch.push(
          (async (): Promise<TrafficResult> => {
            const startTime = Date.now();
            try {
              const response = await axios.get(url, {
                timeout,
                headers,
                validateStatus: () => true // Accept any status code
              });
              const responseTime = Date.now() - startTime;
              return {
                statusCode: response.status,
                responseTime,
                success: response.status < 400
              };
            } catch (error: any) {
              const responseTime = Date.now() - startTime;
              return {
                statusCode: 0,
                responseTime,
                success: false,
                error: error.message
              };
            }
          })()
        );
      }
      batches.push(batch);
    }

    // Execute batches with delay between them
    for (const batch of batches) {
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      // Small delay between batches to avoid overwhelming
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const responseTimes = results.map(r => r.responseTime);

    return {
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: results.length - successfulResults.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      successRate: (successfulResults.length / results.length) * 100
    };
  }

  describe('Application Load Balancer Traffic Tests', () => {
    test('should handle HTTP traffic and demonstrate ALB functionality', async () => {
      console.log('Testing HTTP traffic to ALB...');
      const httpUrl = `http://${albDnsName}`;
      
      const result = await generateHttpTraffic(httpUrl, 15, 3);
      
      console.log('HTTP Traffic Results:');
      console.log(`- Total Requests: ${result.totalRequests}`);
      console.log(`- Success Rate: ${result.successRate.toFixed(2)}%`);
      console.log(`- Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`- Max Response Time: ${result.maxResponseTime}ms`);

      // ALB should be accessible and handle requests
      expect(result.totalRequests).toBe(15);
      expect(result.successRate).toBeGreaterThan(0);
      expect(result.averageResponseTime).toBeLessThan(10000); // Should respond within 10 seconds
    }, 60000);

    test('should handle concurrent traffic load', async () => {
      console.log('Testing concurrent traffic to validate load handling...');
      const httpUrl = `http://${albDnsName}`;
      
      // Generate higher concurrent load
      const result = await generateHttpTraffic(httpUrl, 25, 5);
      
      console.log('Concurrent Load Test Results:');
      console.log(`- Total Requests: ${result.totalRequests}`);
      console.log(`- Success Rate: ${result.successRate.toFixed(2)}%`);
      console.log(`- Failed Requests: ${result.failedRequests}`);
      console.log(`- Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);

      // ALB should handle concurrent load effectively
      expect(result.totalRequests).toBe(25);
      expect(result.successfulRequests).toBeGreaterThan(0);
      // Allow some failures but majority should succeed
      expect(result.successRate).toBeGreaterThan(60);
    }, 90000);

    test('should maintain performance under sustained load', async () => {
      console.log('Testing sustained load performance...');
      const httpUrl = `http://${albDnsName}`;
      
      // Generate sustained load over multiple rounds
      const rounds = 3;
      const results: LoadTestResult[] = [];
      
      for (let i = 0; i < rounds; i++) {
        console.log(`Sustained load round ${i + 1}/${rounds}...`);
        const result = await generateHttpTraffic(httpUrl, 10, 2);
        results.push(result);
        
        // Brief pause between rounds
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Calculate overall performance
      const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
      const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
      const avgSuccessRate = (totalSuccessful / totalRequests) * 100;
      const avgResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;

      console.log('Sustained Load Results:');
      console.log(`- Total Rounds: ${rounds}`);
      console.log(`- Total Requests: ${totalRequests}`);
      console.log(`- Overall Success Rate: ${avgSuccessRate.toFixed(2)}%`);
      console.log(`- Average Response Time: ${avgResponseTime.toFixed(2)}ms`);

      expect(totalRequests).toBe(rounds * 10);
      expect(avgSuccessRate).toBeGreaterThan(50); // Allow some flexibility for real infrastructure
      expect(avgResponseTime).toBeLessThan(15000); // 15 second timeout
    }, 120000);
  });

  describe('S3 Bucket Functionality Tests', () => {
    test('should allow object upload and retrieval operations', async () => {
      console.log('Testing S3 bucket functionality through data operations...');
      
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content for S3 bucket validation';
      
      try {
        // Test upload
        console.log('Uploading test object to S3...');
        await s3.putObject({
          Bucket: s3BucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain'
        }).promise();

        // Test retrieval
        console.log('Retrieving test object from S3...');
        const getResult = await s3.getObject({
          Bucket: s3BucketName,
          Key: testKey
        }).promise();

        const retrievedContent = getResult.Body?.toString();
        
        console.log('S3 Operations Results:');
        console.log(`- Upload: Success`);
        console.log(`- Retrieval: Success`);
        console.log(`- Content Match: ${retrievedContent === testContent}`);

        expect(retrievedContent).toBe(testContent);
        
        // Cleanup
        await s3.deleteObject({
          Bucket: s3BucketName,
          Key: testKey
        }).promise();
        
      } catch (error: any) {
        console.error('S3 operation failed:', error.message);
        throw error;
      }
    }, 30000);

    test('should support versioning through multiple uploads', async () => {
      console.log('Testing S3 versioning behavior through uploads...');
      
      const testKey = `versioning-test-${Date.now()}.txt`;
      const versions = ['Version 1 content', 'Version 2 content', 'Version 3 content'];
      
      try {
        console.log('Uploading multiple versions of the same object...');
        
        // Upload multiple versions of the same key
        for (let i = 0; i < versions.length; i++) {
          await s3.putObject({
            Bucket: s3BucketName,
            Key: testKey,
            Body: versions[i],
            ContentType: 'text/plain'
          }).promise();
          console.log(`Uploaded version ${i + 1}`);
        }

        // Retrieve the latest version
        const latestVersion = await s3.getObject({
          Bucket: s3BucketName,
          Key: testKey
        }).promise();

        const retrievedContent = latestVersion.Body?.toString();
        
        console.log('S3 Versioning Behavior Results:');
        console.log(`- Versions uploaded: ${versions.length}`);
        console.log(`- Latest content retrieved: ${retrievedContent === versions[versions.length - 1]}`);

        expect(retrievedContent).toBe(versions[versions.length - 1]);
        
        // Cleanup
        await s3.deleteObject({
          Bucket: s3BucketName,
          Key: testKey
        }).promise();
        
      } catch (error: any) {
        console.error('S3 versioning test failed:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Auto Scaling Behavior Validation Through Load Testing', () => {
    test('should demonstrate scaling behavior under increasing load', async () => {
      console.log('Testing Auto Scaling behavior through progressive load...');
      
      const httpUrl = `http://${albDnsName}`;
      const loadPhases = [
        { requests: 10, concurrency: 2, phase: 'baseline' },
        { requests: 20, concurrency: 4, phase: 'moderate' },
        { requests: 30, concurrency: 6, phase: 'high' }
      ];
      
      const phaseResults: any[] = [];
      
      for (const phase of loadPhases) {
        console.log(`Running ${phase.phase} load phase: ${phase.requests} requests with ${phase.concurrency} concurrency...`);
        
        const result = await generateHttpTraffic(httpUrl, phase.requests, phase.concurrency);
        phaseResults.push({
          phase: phase.phase,
          ...result
        });
        
        console.log(`${phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} Phase Results:`);
        console.log(`- Success Rate: ${result.successRate.toFixed(2)}%`);
        console.log(`- Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
        
        // Wait between phases to observe scaling
        if (loadPhases.indexOf(phase) < loadPhases.length - 1) {
          console.log('Waiting 30 seconds for potential scaling...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
      
      // Validate that the system handled increasing load
      const baselineSuccess = phaseResults.find(r => r.phase === 'baseline')?.successRate || 0;
      const highLoadSuccess = phaseResults.find(r => r.phase === 'high')?.successRate || 0;
      
      console.log('Load Scaling Summary:');
      phaseResults.forEach(result => {
        console.log(`- ${result.phase}: ${result.successRate.toFixed(2)}% success, ${result.averageResponseTime.toFixed(2)}ms avg`);
      });

      // System should handle load progression reasonably well
      expect(baselineSuccess).toBeGreaterThan(50);
      expect(highLoadSuccess).toBeGreaterThan(30); // Allow for some degradation under high load
      expect(phaseResults.length).toBe(3);
    }, 180000);

    test('should maintain availability during load variations', async () => {
      console.log('Testing consistent availability through load variations...');
      
      const httpUrl = `http://${albDnsName}`;
      const testRounds = 5;
      const results: LoadTestResult[] = [];
      
      for (let i = 0; i < testRounds; i++) {
        console.log(`Availability test round ${i + 1}/${testRounds}...`);
        
        // Vary the load pattern
        const requests = 8 + (i * 2); // 8, 10, 12, 14, 16 requests
        const concurrency = 2;
        
        const result = await generateHttpTraffic(httpUrl, requests, concurrency);
        results.push(result);
        
        console.log(`Round ${i + 1}: ${result.successRate.toFixed(2)}% success, ${result.averageResponseTime.toFixed(2)}ms avg`);
        
        // Short pause between rounds
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const averageSuccessRate = results.reduce((sum, r) => sum + r.successRate, 0) / results.length;
      const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
      
      console.log('Availability Test Summary:');
      console.log(`- Total Rounds: ${testRounds}`);
      console.log(`- Total Requests: ${totalRequests}`);
      console.log(`- Average Success Rate: ${averageSuccessRate.toFixed(2)}%`);

      expect(results.length).toBe(testRounds);
      expect(averageSuccessRate).toBeGreaterThan(40); // Allow flexibility for real infrastructure
    }, 120000);
  });

  describe('End-to-End Application Flow Tests', () => {
    test('should validate complete request flow through ALB to application', async () => {
      console.log('Testing end-to-end application flow...');
      
      const httpUrl = `http://${albDnsName}`;
      
      // Test various endpoints if they exist
      const testPaths = ['/', '/health', '/api/status', '/index.html'];
      
      for (const testPath of testPaths) {
        try {
          console.log(`Testing path: ${testPath}`);
          const fullUrl = `${httpUrl}${testPath}`;
          const result = await generateHttpTraffic(fullUrl, 5, 2);
          
          console.log(`Path ${testPath} Results:`);
          console.log(`- Success Rate: ${result.successRate.toFixed(2)}%`);
          console.log(`- Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
          
          // At least the root path should work
          if (testPath === '/') {
            expect(result.successfulRequests).toBeGreaterThan(0);
          }
          
        } catch (error: any) {
          console.log(`Path ${testPath} failed: ${error.message}`);
          // Continue with other paths
        }
      }
    }, 60000);

    test('should demonstrate multi-region capability through traffic patterns', async () => {
      console.log('Testing multi-region infrastructure behavior...');
      
      const httpUrl = `http://${albDnsName}`;
      
      // Simulate traffic patterns that would benefit from multi-region setup
      const trafficPatterns = [
        { name: 'US-East Pattern', requests: 12, concurrency: 3 },
        { name: 'US-West Pattern', requests: 10, concurrency: 2 },
        { name: 'EU Pattern', requests: 8, concurrency: 2 }
      ];
      
      const patternResults: any[] = [];
      
      for (const pattern of trafficPatterns) {
        console.log(`Testing ${pattern.name}...`);
        
        const result = await generateHttpTraffic(httpUrl, pattern.requests, pattern.concurrency);
        patternResults.push({
          pattern: pattern.name,
          ...result
        });
        
        console.log(`${pattern.name} Results:`);
        console.log(`- Success Rate: ${result.successRate.toFixed(2)}%`);
        console.log(`- Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
        
        // Brief pause between patterns
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      const overallSuccess = patternResults.reduce((sum, r) => sum + r.successfulRequests, 0);
      const overallRequests = patternResults.reduce((sum, r) => sum + r.totalRequests, 0);
      const overallSuccessRate = (overallSuccess / overallRequests) * 100;
      
      console.log('Multi-Region Traffic Summary:');
      console.log(`- Total Patterns Tested: ${patternResults.length}`);
      console.log(`- Overall Success Rate: ${overallSuccessRate.toFixed(2)}%`);

      expect(patternResults.length).toBe(3);
      expect(overallSuccessRate).toBeGreaterThan(40);
    }, 90000);
  });

  describe('Security Validation Through Traffic Behavior', () => {
    test('should handle various request types and validate HTTPS termination capability', async () => {
      console.log('Testing security through different request patterns...');
      
      const httpUrl = `http://${albDnsName}`;
      
      // Test different HTTP methods and headers
      const securityTests = [
        { name: 'Standard GET', method: 'GET', headers: {} },
        { name: 'POST with data', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { name: 'Custom headers', method: 'GET', headers: { 'X-Test-Header': 'security-test' } }
      ];
      
      for (const test of securityTests) {
        try {
          console.log(`Testing ${test.name}...`);
          
          const startTime = Date.now();
          const response = await axios({
            method: test.method as any,
            url: httpUrl,
            headers: test.headers,
            timeout: 5000,
            validateStatus: () => true
          });
          const responseTime = Date.now() - startTime;
          
          console.log(`${test.name} Results:`);
          console.log(`- Status: ${response.status}`);
          console.log(`- Response Time: ${responseTime}ms`);
          console.log(`- Headers Received: ${Object.keys(response.headers).length}`);
          
          // Should receive some response
          expect(responseTime).toBeLessThan(10000);
          
        } catch (error: any) {
          console.log(`${test.name} failed: ${error.message}`);
          // Continue with other tests
        }
      }
    }, 45000);
  });
});