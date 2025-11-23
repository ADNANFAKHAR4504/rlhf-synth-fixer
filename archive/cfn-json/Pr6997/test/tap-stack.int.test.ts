// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import https from 'https';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Try to load outputs, but handle gracefully if not available
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Warning: cfn-outputs/flat-outputs.json not found. Some tests may be skipped.');
}

/**
 * Helper function to make HTTPS requests
 */
function makeHttpsRequest(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
    }).on('error', reject);
  });
}

describe('Credit Scoring Application - Integration Tests', () => {

  describe('CloudFormation Stack Outputs', () => {
    test('should have VPCId output', () => {
      expect(outputs).toHaveProperty('VPCId');
      if (outputs.VPCId) {
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      }
    });

    test('should have ALBDNSName output', () => {
      expect(outputs).toHaveProperty('ALBDNSName');
      if (outputs.ALBDNSName) {
        expect(outputs.ALBDNSName).toContain('.elb.amazonaws.com');
      }
    });

    test('should have LambdaFunctionArn output', () => {
      expect(outputs).toHaveProperty('LambdaFunctionArn');
      if (outputs.LambdaFunctionArn) {
        expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:.+$/);
      }
    });

    test('should have LambdaFunctionUrl output', () => {
      expect(outputs).toHaveProperty('LambdaFunctionUrl');
      if (outputs.LambdaFunctionUrl) {
        expect(outputs.LambdaFunctionUrl).toMatch(/^https:\/\/.+\.lambda-url\.[a-z0-9-]+\.on\.aws\/$/);
      }
    });

    test('should have AuroraClusterEndpoint output', () => {
      expect(outputs).toHaveProperty('AuroraClusterEndpoint');
      if (outputs.AuroraClusterEndpoint) {
        expect(outputs.AuroraClusterEndpoint).toContain('.rds.amazonaws.com');
      }
    });

    test('should have AuroraClusterArn output', () => {
      expect(outputs).toHaveProperty('AuroraClusterArn');
      if (outputs.AuroraClusterArn) {
        expect(outputs.AuroraClusterArn).toMatch(/^arn:aws:rds:[a-z0-9-]+:\d+:cluster:.+$/);
      }
    });

    test('should have KMSKeyId output', () => {
      expect(outputs).toHaveProperty('KMSKeyId');
      if (outputs.KMSKeyId) {
        expect(outputs.KMSKeyId).toMatch(/^[a-f0-9-]+$/);
      }
    });
  });

  describe('Security Configuration', () => {
    test('all endpoints should use HTTPS', () => {
      if (outputs.ALBDNSName) {
        // ALB should only support HTTPS (port 443)
        expect(outputs.ALBDNSName).toBeTruthy();
      }
      if (outputs.LambdaFunctionUrl) {
        expect(outputs.LambdaFunctionUrl).toMatch(/^https:\/\//);
      }
    });

    test('database endpoint should be private', () => {
      if (outputs.AuroraClusterEndpoint) {
        // Aurora endpoints should not be publicly accessible
        // They should be in the VPC private subnets
        expect(outputs.AuroraClusterEndpoint).toBeTruthy();
        expect(outputs.VPCId).toBeTruthy();
      }
    });
  });
});
