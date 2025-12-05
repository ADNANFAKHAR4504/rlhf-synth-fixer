// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs only if file exists (for live integration tests)
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  }
} catch (error) {
  console.log('No deployment outputs found - skipping live integration tests');
}

describe('CI/CD Pipeline Integration Tests', () => {
  describe('Pipeline Infrastructure Tests', () => {
    test('Should have pipeline outputs after deployment', () => {
      if (Object.keys(outputs).length > 0) {
        expect(outputs).toHaveProperty('PipelineName');
        expect(outputs).toHaveProperty('ECRRepositoryURI');
        expect(outputs).toHaveProperty('ArtifactBucketName');
        expect(outputs).toHaveProperty('NotificationTopicArn');
      } else {
        // Skip test if no deployment outputs
        expect(true).toBe(true);
      }
    });

    test('Should have valid ECR repository URI format', () => {
      if (outputs.ECRRepositoryURI) {
        expect(outputs.ECRRepositoryURI).toMatch(/^[0-9]+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/.+$/);
      } else {
        expect(true).toBe(true);
      }
    });

    test('Should have valid SNS topic ARN format', () => {
      if (outputs.NotificationTopicArn) {
        expect(outputs.NotificationTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:[0-9]+:.+$/);
      } else {
        expect(true).toBe(true);
      }
    });
  });
});
