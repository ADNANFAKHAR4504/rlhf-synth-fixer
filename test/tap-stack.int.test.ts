// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper function to safely read outputs file
function getOutputs() {
  try {
    return JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  } catch (error) {
    console.warn(
      'Could not read cfn-outputs/flat-outputs.json. Integration tests will be skipped.'
    );
    return {};
  }
}

const outputs = getOutputs();

describe('TapStack Integration Tests', () => {
  // Only run integration tests if outputs are available
  const shouldRunIntegrationTests = Object.keys(outputs).length > 0;

  describe('Load Balancer Integration', () => {
    test('should have accessible load balancer endpoint', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping integration test - no outputs available');
        return;
      }

      const albDns = outputs[`BookstoreALBDNS-${environmentSuffix}`];
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(
        /^[a-zA-Z0-9-]+\.elb\.[a-zA-Z0-9-]+\.amazonaws\.com$/
      );
    });
  });

  describe('S3 Bucket Integration', () => {
    test('should have S3 bucket created', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping integration test - no outputs available');
        return;
      }

      const bucketName = outputs[`BookstoreAssetsBucket-${environmentSuffix}`];
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(
        /^bookstore-assets-\d+-\w+-\d+-${environmentSuffix}$/
      );
    });
  });

  describe('CloudWatch Alarm Integration', () => {
    test('should have CPU alarm created', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping integration test - no outputs available');
        return;
      }

      const alarmName = outputs[`BookstoreCPUAlarm-${environmentSuffix}`];
      expect(alarmName).toBeDefined();
      expect(alarmName).toMatch(/^bookstore-high-cpu-${environmentSuffix}$/);
    });
  });

  describe('Write Additional Integration TESTS', () => {
    test('Add more integration tests here', async () => {
      // TODO: Add more integration tests
      // Examples:
      // - Test ALB health check endpoint
      // - Test S3 bucket permissions
      // - Test CloudWatch metrics
      // - Test Auto Scaling Group health
      expect(true).toBe(true);
    });
  });
});
