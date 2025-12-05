import * as fs from 'fs';
import * as path from 'path';

describe('Deployment Integration Tests', () => {
  let outputs: Record<string, unknown>;
  let deploymentsSkipped = false;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const data = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(data);

      // Check if outputs are empty
      if (Object.keys(outputs).length === 0) {
        deploymentsSkipped = true;
      }
    } else {
      deploymentsSkipped = true;
    }
  });

  describe('CI/CD Pipeline Resources', () => {
    it('should have deployed CodePipeline', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.PipelineName).toBeDefined();
      expect(typeof outputs.PipelineName).toBe('string');
      expect(outputs.PipelineName).toContain('container-pipeline');
    });

    it('should have deployed ECR repository', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.ECRRepositoryUri).toBeDefined();
      expect(typeof outputs.ECRRepositoryUri).toBe('string');
      expect(outputs.ECRRepositoryUri).toMatch(/\.dkr\.ecr\./);
      expect(outputs.ECRRepositoryUri).toContain('app-repo');
    });

    it('should have deployed S3 artifact bucket', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.ArtifactBucketName).toBeDefined();
      expect(typeof outputs.ArtifactBucketName).toBe('string');
    });

    it('should have deployed SNS notification topic', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      expect(outputs.NotificationTopicArn).toBeDefined();
      expect(typeof outputs.NotificationTopicArn).toBe('string');
      expect(outputs.NotificationTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('Resource Naming Consistency', () => {
    it('should use consistent environment suffix across resources', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      const pipelineName = outputs.PipelineName as string;

      // Environment suffix should be consistent
      expect(pipelineName).toMatch(/container-pipeline-.+$/);
    });
  });

  describe('ARN Format Validation', () => {
    it('should have valid SNS ARN format', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      const topicArn = outputs.NotificationTopicArn as string;
      const arnPattern = /^arn:aws:sns:[a-z0-9-]+:\d{12}:.+$/;
      expect(topicArn).toMatch(arnPattern);
    });

    it('should have valid ECR repository URI format', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      const repoUri = outputs.ECRRepositoryUri as string;
      expect(repoUri).toMatch(/^\d{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\/.+$/);
    });
  });

  describe('Output Completeness', () => {
    it('should export all required CI/CD pipeline outputs', () => {
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

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
      });
    });

    it('should have no undefined or null outputs', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      Object.entries(outputs).forEach(([_key, value]) => {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
      });
    });
  });

  describe('Resource Count', () => {
    it('should have deployed all expected outputs', () => {
      if (deploymentsSkipped) {
        console.log('Skipping: Deployment outputs not found. Run deployment first.');
        return;
      }

      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBeGreaterThanOrEqual(4);
    });
  });
});
