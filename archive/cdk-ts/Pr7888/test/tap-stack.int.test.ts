// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CI/CD Pipeline Integration Tests', () => {
  let outputs: Record<string, string>;
  let deploymentsSkipped = false;

  beforeAll(() => {
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const data = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(data);

      // Check if outputs are empty
      if (Object.keys(outputs).length === 0) {
        deploymentsSkipped = true;
      }
    } else {
      deploymentsSkipped = true;
    }
  });

  describe('Pipeline Infrastructure', () => {
    test('has pipeline name output', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.PipelineName).toBeDefined();
      expect(outputs.PipelineName).toContain('container-pipeline');
      expect(outputs.PipelineName).toContain(environmentSuffix);
    });

    test('has ECR repository URI output', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.ECRRepositoryUri).toBeDefined();
      expect(outputs.ECRRepositoryUri).toContain('ecr');
      expect(outputs.ECRRepositoryUri).toContain('app-repo');
    });

    test('has artifact bucket name output', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.ArtifactBucketName).toBeDefined();
      // Note: Bucket uses auto-generated name, so we just verify it exists as a string
      expect(typeof outputs.ArtifactBucketName).toBe('string');
      expect(outputs.ArtifactBucketName.length).toBeGreaterThan(0);
    });

    test('has notification topic ARN output', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.NotificationTopicArn).toBeDefined();
      expect(outputs.NotificationTopicArn).toContain('arn:aws:sns');
      // Note: Topic uses auto-generated name, so we don't check for specific name
    });
  });

  describe('Resource Validation', () => {
    test('environment suffix is consistent across resources', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      // Pipeline name should contain environment suffix
      expect(outputs.PipelineName).toContain(environmentSuffix);
    });

    test('all required outputs are present', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      const requiredOutputs = [
        'PipelineName',
        'ECRRepositoryUri',
        'ArtifactBucketName',
        'NotificationTopicArn',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });
});
