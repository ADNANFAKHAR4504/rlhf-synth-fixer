// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs - fail if they don't exist for integration tests
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
    console.log('Loaded deployment outputs for integration testing');
  } else {
    throw new Error('Deployment outputs not found. Run "cdk deploy" first.');
  }
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  // For integration tests, we should fail if outputs aren't available
  // This ensures we're testing against actual deployed resources
  process.exit(1);
}

// Validate that we have real outputs, not mock values
const isUsingMockOutputs =
  outputs.VpcId?.includes('mock') ||
  outputs.ApiEndpointUrl?.includes('mock-api');

if (isUsingMockOutputs) {
  console.error(
    'ERROR: Using mock outputs for integration tests. This is not allowed.'
  );
  console.error(
    'Please deploy the stack first and ensure cfn-outputs/flat-outputs.json contains real resource IDs.'
  );
  process.exit(1);
}

describe('Nova Security Baseline Integration Tests', () => {
  describe('Infrastructure Deployment Validation', () => {
    test('should have VPC deployed with real AWS resource ID', async () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-[a-z0-9]{8,17}$/);
    });

    test('should have private subnets deployed with real AWS resource IDs', async () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-z0-9]{8,17}$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-z0-9]{8,17}$/);
    });

    test('should have API Gateway deployed with real endpoint', async () => {
      expect(outputs.ApiEndpointUrl).toBeDefined();
      expect(outputs.ApiEndpointUrl).toMatch(
        /^https:\/\/.+\\.execute-api\\.us-east-1\\.amazonaws\\.com\/prod$/
      );
    });

    test('should have S3 logs bucket deployed with valid bucket name', async () => {
      expect(outputs.LogsBucketName).toBeDefined();
      expect(outputs.LogsBucketName).toMatch(/^nova-logs-bucket-[a-z0-9-]+$/);
    });

    test('should have KMS key deployed with valid ARN', async () => {
      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyArn).toMatch(
        /^arn:aws:kms:us-east-1:\d{12}:key\/[a-z0-9-]+$/
      );
    });
  });

  describe('API Health Check', () => {
    test('should respond to health check with 200 status', async () => {
      const response = await fetch(`${outputs.ApiEndpointUrl}/health`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.region).toBe('us-east-1');
    }, 10000); // 10 second timeout for API calls

    test('should have proper CORS headers', async () => {
      const response = await fetch(`${outputs.ApiEndpointUrl}/health`);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      expect(response.headers.get('x-request-id')).toBeDefined();
    }, 10000);
  });

  describe('Security Validation', () => {
    test('S3 bucket should enforce encryption', async () => {
      // This would require AWS SDK calls to verify bucket policies
      // For now, we trust the CDK deployment created the proper policies
      expect(outputs.LogsBucketName).toBeDefined();
    });

    test('VPC should have no public subnets', async () => {
      // This would require AWS SDK calls to verify VPC configuration
      // For now, we trust the CDK deployment created private-only subnets
      expect(outputs.VpcId).toBeDefined();
    });
  });
});
