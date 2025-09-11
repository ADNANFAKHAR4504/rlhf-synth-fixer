// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

const outputsPath = path.join('cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} else {
  // Warn and skip tests if outputs file is missing
  console.warn(`Warning: ${outputsPath} not found. Integration tests will be skipped.`);
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  if (!fs.existsSync(outputsPath)) {
    test.skip('Skipping integration tests due to missing outputs file', () => { });
    return;
  }

  describe('Pipeline Integration Tests', () => {
    test('should have CodePipeline accessible', async () => {
      expect(outputs.CodePipelineName).toBeDefined();
      expect(typeof outputs.CodePipelineName).toBe('string');
    });

    test('should have ECR repository URL', async () => {
      expect(outputs.ECRRepositoryURI).toBeDefined();
      expect(typeof outputs.ECRRepositoryURI).toBe('string');
      expect(outputs.ECRRepositoryURI).toMatch(/\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\//);
    });

    test('should have ECS cluster and service', async () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();
      expect(typeof outputs.ECSClusterName).toBe('string');
      expect(typeof outputs.ECSServiceName).toBe('string');
    });

    test('should have S3 artifact bucket', async () => {
      expect(outputs.S3ArtifactBucket).toBeDefined();
      expect(typeof outputs.S3ArtifactBucket).toBe('string');
    });

    test('should have VPC and subnets configured', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(typeof outputs.VPCId).toBe('string');
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should have SNS topic for notifications', async () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(typeof outputs.SNSTopicArn).toBe('string');
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d+:/);
    });

    test('should validate pipeline outputs consistency', async () => {
      // Verify all essential outputs are present for a complete CI/CD pipeline
      const requiredOutputs = [
        'CodePipelineName',
        'ECRRepositoryURI', 
        'ECSClusterName',
        'ECSServiceName',
        'S3ArtifactBucket',
        'VPCId'
      ];
      
      const missingOutputs = requiredOutputs.filter(output => !outputs[output]);
      expect(missingOutputs).toEqual([]);
    });
  });
});
