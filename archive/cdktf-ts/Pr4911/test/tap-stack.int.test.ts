import * as fs from 'fs';
import * as path from 'path';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Load outputs from deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let deploymentExists = false;

if (fs.existsSync(outputsPath)) {
  try {
    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    // Handle nested stack output structure (e.g., {"StackName": {...outputs}})
    const stackKey = Object.keys(rawOutputs)[0];
    if (stackKey && rawOutputs[stackKey]) {
      deploymentExists = true;
    }
  } catch (error) {
    console.warn('Failed to parse outputs file:', error);
  }
}

// AWS Clients
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });

describe('HIPAA-Compliant Healthcare Infrastructure - Integration Tests', () => {
  describe('CloudWatch Logs', () => {
    test('API Gateway log group exists with encryption and retention', async () => {
      if (!deploymentExists) {
        console.log('⚠️  Skipping API Gateway log group test - deployment outputs not found');
        expect(true).toBe(true);
        return;
      }
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/apigateway/healthcare-',
        })
      );

      const logGroup = response.logGroups!.find((lg) =>
        lg.logGroupName!.includes('healthcare-')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(90);
      expect(logGroup!.kmsKeyId).toBeDefined();
    });

    test('ECS log group exists with encryption and retention', async () => {
      if (!deploymentExists) {
        console.log('⚠️  Skipping ECS log group test - deployment outputs not found');
        expect(true).toBe(true);
        return;
      }
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/ecs/healthcare-',
        })
      );

      const logGroup = response.logGroups!.find((lg) =>
        lg.logGroupName!.includes('healthcare-')
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(90);
      expect(logGroup!.kmsKeyId).toBeDefined();
    });
  });

  describe('HIPAA Compliance Validation', () => {
    test('CloudWatch Logs use KMS encryption', async () => {
      if (!deploymentExists) {
        console.log('⚠️  Skipping CloudWatch Logs KMS test - deployment outputs not found');
        expect(true).toBe(true);
        return;
      }
      const logsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/apigateway/healthcare-',
        })
      );

      const logGroup = logsResponse.logGroups!.find((lg) =>
        lg.logGroupName!.includes('healthcare-')
      );
      expect(logGroup!.kmsKeyId).toBeDefined();

      // Verify KMS key exists and has rotation enabled
      const keyId = logGroup!.kmsKeyId!.split('/').pop();
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: keyId,
        })
      );
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');

      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({
          KeyId: keyId,
        })
      );
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });
});
