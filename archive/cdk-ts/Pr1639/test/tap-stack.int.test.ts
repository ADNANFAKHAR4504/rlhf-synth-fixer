// Configuration - These are coming from cfn-outputs after cdk deploy
import * as fs from 'fs';
import * as https from 'https';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Helper function to make HTTP requests
function makeRequest(url: string, method: string = 'GET', data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData),
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

describe('TapStack Integration Tests', () => {
  const apiGatewayUrl = outputs.ApiGatewayUrl;

  describe('Stack Deployment Validation', () => {
    test('Should have all required outputs', () => {
      expect(outputs).toHaveProperty('ApiGatewayUrl');
      expect(outputs).toHaveProperty('LambdaFunctionArn');
      expect(outputs).toHaveProperty('S3BucketName');
      expect(outputs).toHaveProperty('KmsKeyId');
      expect(outputs).toHaveProperty('CloudWatchLogGroup');
    });

    test('Should have valid API Gateway URL', () => {
      expect(apiGatewayUrl).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/.+\/$/);
    });

    test('Should have valid Lambda ARN', () => {
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:.+$/);
    });

    test('Should have valid S3 bucket name', () => {
      expect(outputs.S3BucketName).toMatch(/^srv-data-.+-\d+-[a-z0-9-]+$/);
    });
  });

  describe('API Gateway Accessibility', () => {
    test('Should be accessible from internet', async () => {
      const response = await makeRequest(apiGatewayUrl);
      expect(response.status).toBe(200);
    });

    test('Should return expected response structure', async () => {
      const response = await makeRequest(apiGatewayUrl);
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('requestId');
      expect(response.data).toHaveProperty('method');
      expect(response.data).toHaveProperty('path');
      expect(response.data).toHaveProperty('bucketName');
    });
  });

  describe('Stack Resources Integration', () => {
    test('Should have Lambda connected to API Gateway', async () => {
      const response = await makeRequest(apiGatewayUrl);
      expect(response.data.message).toBe('Serverless function executed successfully');
    });

    test('Should have S3 bucket accessible to Lambda', async () => {
      const response = await makeRequest(apiGatewayUrl);
      expect(response.data.bucketName).toBe(outputs.S3BucketName);
    });
  });
});
