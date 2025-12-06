/**
 * CloudWatch Synthetics Canary for API Monitoring
 * Tests API endpoint availability and response times
 */

const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');
const https = require('https');

const apiCanaryBlueprint = async function () {
  const environment = process.env.ENVIRONMENT || 'dev';

  // Define API endpoints to monitor
  const endpoints = [
    {
      name: 'Health Check',
      url: `https://api.example.com/${environment}/health`,
      method: 'GET',
      expectedStatus: 200,
    },
    {
      name: 'Status Endpoint',
      url: `https://api.example.com/${environment}/status`,
      method: 'GET',
      expectedStatus: 200,
    },
  ];

  log.info(`Starting API monitoring canary for environment: ${environment}`);

  for (const endpoint of endpoints) {
    try {
      log.info(`Testing ${endpoint.name}: ${endpoint.url}`);

      const response = await makeHttpRequest(endpoint.url, endpoint.method);

      if (response.statusCode === endpoint.expectedStatus) {
        log.info(`✅ ${endpoint.name} passed - Status: ${response.statusCode}`);
      } else {
        throw new Error(
          `${endpoint.name} failed - Expected ${endpoint.expectedStatus}, got ${response.statusCode}`
        );
      }

      // Log response time
      log.info(`Response time: ${response.duration}ms`);

    } catch (error) {
      log.error(`❌ ${endpoint.name} failed: ${error.message}`);
      throw error;
    }
  }

  log.info('All API endpoint checks passed successfully');
};

/**
 * Helper function to make HTTP requests
 */
function makeHttpRequest(url, method) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 30000, // 30 second timeout
    };

    const req = https.request(options, (res) => {
      const duration = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          duration: duration,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

exports.handler = async () => {
  return await apiCanaryBlueprint();
};
