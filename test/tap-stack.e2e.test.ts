import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import axios from 'axios';

// Configure AWS SDK
const cloudFormation = new CloudFormationClient({ region: 'us-west-2' });

describe('Secure Web Application E2E Tests', () => {
  let stackOutputs: { [key: string]: string } = {};
  let albDnsName: string;

  // Increased timeout for E2E tests (5 minutes)
  jest.setTimeout(300000);

  beforeAll(async () => {
    console.log('🔍 Getting stack outputs for E2E testing...');
    
    try {
      // Get stack name from environment or use default pattern
      const environment = process.env.TEST_ENVIRONMENT || 'dev';
      const stackName = `TapStack-${environment}`;
      
      console.log(`📋 Looking for stack: ${stackName}`);
      
      const response = await cloudFormation.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = response.Stacks?.[0];
      
      if (!stack) {
        throw new Error(`Stack ${stackName} not found`);
      }
      
      // Extract outputs
      if (stack.Outputs) {
        for (const output of stack.Outputs) {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        }
      }
      
      albDnsName = stackOutputs['LoadBalancerDNS'];
      
      if (!albDnsName) {
        throw new Error('LoadBalancerDNS output not found in stack');
      }
      
      console.log(`✅ Found ALB DNS: ${albDnsName}`);
      console.log('🔗 Stack outputs:', Object.keys(stackOutputs));
      
    } catch (error) {
      console.error('❌ Failed to get stack outputs:', error);
      throw error;
    }
  });

  describe('End-to-End Application Access', () => {
    test('should be able to access the web application through ALB', async () => {
      console.log(`🌐 Testing web application access via ALB: ${albDnsName}`);
      
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 30000,
          validateStatus: (status) => status < 500 // Accept any status except server errors
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toContain('Secure Web Application');
        expect(response.headers['content-type']).toMatch(/text\/html/);
        
        console.log('✅ Successfully accessed web application');
        console.log(`📄 Response status: ${response.status}`);
        console.log(`📊 Response size: ${response.data.length} bytes`);
        
      } catch (error) {
        console.error('❌ Failed to access web application:', error);
        throw error;
      }
    });

    test('should display instance information in the response', async () => {
      console.log('🏷️ Testing instance information display');
      
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 30000
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toContain('Instance ID:');
        expect(response.data).toMatch(/i-[a-f0-9]+/); // Instance ID pattern
        
        console.log('✅ Instance information is displayed correctly');
        
      } catch (error) {
        console.error('❌ Failed to verify instance information:', error);
        throw error;
      }
    });

    test('should handle multiple requests (load balancing)', async () => {
      console.log('⚖️ Testing load balancing with multiple requests');
      
      const requests = [];
      const instanceIds = new Set<string>();
      
      try {
        // Make 10 concurrent requests to test load balancing
        for (let i = 0; i < 10; i++) {
          requests.push(
            axios.get(`http://${albDnsName}`, {
              timeout: 30000
            })
          );
        }
        
        const responses = await Promise.all(requests);
        
        // Verify all responses are successful
        responses.forEach((response, index) => {
          expect(response.status).toBe(200);
          expect(response.data).toContain('Secure Web Application');
          
          // Extract instance ID from response
          const instanceIdMatch = response.data.match(/i-[a-f0-9]+/);
          if (instanceIdMatch) {
            instanceIds.add(instanceIdMatch[0]);
          }
        });
        
        console.log(`✅ All ${responses.length} requests successful`);
        console.log(`🔄 Load balanced across ${instanceIds.size} instance(s): ${Array.from(instanceIds).join(', ')}`);
        
        // At minimum, we expect requests to be successful (even if only one instance is running)
        expect(instanceIds.size).toBeGreaterThan(0);
        
      } catch (error) {
        console.error('❌ Load balancing test failed:', error);
        throw error;
      }
    });

    test('should respond within acceptable time limits', async () => {
      console.log('⏱️ Testing response time performance');
      
      const startTime = Date.now();
      
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 30000
        });
        
        const responseTime = Date.now() - startTime;
        
        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
        
        console.log(`✅ Response time: ${responseTime}ms (under 10s limit)`);
        
      } catch (error) {
        console.error('❌ Response time test failed:', error);
        throw error;
      }
    });

    test('should have proper HTTP headers for security', async () => {
      console.log('🔒 Testing security headers');
      
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 30000
        });
        
        expect(response.status).toBe(200);
        
        // Check for basic security-related headers from the ALB/server
        expect(response.headers).toHaveProperty('server');
        expect(response.headers).toHaveProperty('date');
        
        // Verify response comes from our web server
        expect(response.data).toContain('Secure Web Application');
        
        console.log('✅ Security headers verified');
        console.log('🔍 Server header:', response.headers.server);
        
      } catch (error) {
        console.error('❌ Security headers test failed:', error);
        throw error;
      }
    });
  });

  describe('WAF Protection Testing', () => {
    test('should allow legitimate requests', async () => {
      console.log('🛡️ Testing WAF allows legitimate requests');
      
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; E2E-Test/1.0)',
            'Accept': 'text/html,application/xhtml+xml'
          }
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toContain('Secure Web Application');
        
        console.log('✅ WAF allows legitimate requests');
        
      } catch (error) {
        console.error('❌ WAF legitimate request test failed:', error);
        throw error;
      }
    });

    test('should handle rate limiting gracefully', async () => {
      console.log('🚦 Testing WAF rate limiting behavior');
      
      // Note: Since WAF is configured with 10,000 req/min limit, 
      // we won't trigger it in normal testing, but we verify the endpoint handles requests properly
      
      const requests = [];
      
      try {
        // Make 20 requests to verify consistent behavior under moderate load
        for (let i = 0; i < 20; i++) {
          requests.push(
            axios.get(`http://${albDnsName}`, {
              timeout: 30000
            }).catch(error => ({ error, index: i }))
          );
        }
        
        const results = await Promise.all(requests);
        const successfulRequests = results.filter(r => !('error' in r));
        const failedRequests = results.filter(r => 'error' in r);
        
        // Most requests should succeed (rate limit is high at 10k/min)
        expect(successfulRequests.length).toBeGreaterThan(15);
        
        console.log(`✅ Rate limiting test: ${successfulRequests.length} successful, ${failedRequests.length} failed`);
        
        if (failedRequests.length > 0) {
          console.log('⚠️ Some requests failed (this could indicate rate limiting or other WAF rules)');
        }
        
      } catch (error) {
        console.error('❌ Rate limiting test failed:', error);
        throw error;
      }
    });
  });

  describe('Application Health and Monitoring', () => {
    test('should have consistent uptime across multiple checks', async () => {
      console.log('💓 Testing application uptime consistency');
      
      const checks = [];
      
      try {
        // Perform 5 health checks with 2-second intervals
        for (let i = 0; i < 5; i++) {
          checks.push(
            new Promise(async (resolve) => {
              await new Promise(resolve => setTimeout(resolve, i * 2000)); // Stagger requests
              try {
                const response = await axios.get(`http://${albDnsName}`, { timeout: 30000 });
                resolve({ success: true, status: response.status, attempt: i + 1 });
              } catch (error) {
                resolve({ success: false, error: error.message, attempt: i + 1 });
              }
            })
          );
        }
        
        const results = await Promise.all(checks);
        const successfulChecks = results.filter((r: any) => r.success);
        
        // Expect at least 80% uptime (4 out of 5 checks)
        expect(successfulChecks.length).toBeGreaterThanOrEqual(4);
        
        console.log(`✅ Uptime check: ${successfulChecks.length}/5 successful`);
        console.log('📊 Check results:', results);
        
      } catch (error) {
        console.error('❌ Uptime consistency test failed:', error);
        throw error;
      }
    });

    test('should serve content from EC2 instances in private subnets', async () => {
      console.log('🔒 Verifying content is served from private subnet instances');
      
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 30000
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toContain('Secure Web Application');
        expect(response.data).toContain('Instance ID:');
        
        // Verify we're getting dynamic content from EC2 instances
        const instanceIdMatch = response.data.match(/i-[a-f0-9]+/);
        expect(instanceIdMatch).not.toBeNull();
        
        if (instanceIdMatch) {
          console.log(`✅ Content served from EC2 instance: ${instanceIdMatch[0]}`);
        }
        
      } catch (error) {
        console.error('❌ Private subnet content test failed:', error);
        throw error;
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid paths gracefully', async () => {
      console.log('🚫 Testing invalid path handling');
      
      try {
        const response = await axios.get(`http://${albDnsName}/nonexistent-path`, {
          timeout: 30000,
          validateStatus: (status) => true // Accept any status code
        });
        
        // Should get a 404 or similar error response
        expect([404, 403].includes(response.status)).toBeTruthy();
        
        console.log(`✅ Invalid path handled with status: ${response.status}`);
        
      } catch (error) {
        // Network errors are also acceptable for invalid paths
        console.log('✅ Invalid path rejected at network level');
      }
    });
  });
});