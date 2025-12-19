import * as fs from 'fs';
import * as path from 'path';

describe('Deployment Integration Tests', () => {
  let outputs: Record<string, unknown>;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const data = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(data);
      
      // Parse JSON-stringified values back to objects
      Object.keys(outputs).forEach((key) => {
        if (typeof outputs[key] === 'string') {
          try {
            const parsed = JSON.parse(outputs[key] as string);
            if (typeof parsed === 'object' && parsed !== null) {
              outputs[key] = parsed;
            }
          } catch {
            // Not a JSON string, keep as-is
          }
        }
      });
    } else {
      throw new Error('Deployment outputs not found. Run deployment first.');
    }
  });

  describe('Deployed Resources', () => {
    it('should have deployed S3 bucket', () => {
      expect(outputs.bucketName).toBeDefined();
      expect(typeof outputs.bucketName).toBe('string');
      expect(outputs.bucketName).toContain('compliance-results-');
    });

    it('should have deployed SNS topic', () => {
      expect(outputs.topicArn).toBeDefined();
      expect(typeof outputs.topicArn).toBe('string');
      expect(outputs.topicArn).toContain('compliance-alerts-');
    });

    it('should have deployed Lambda function', () => {
      expect(outputs.lambdaFunctionName).toBeDefined();
      expect(typeof outputs.lambdaFunctionName).toBe('string');
      expect(outputs.lambdaFunctionName).toContain('compliance-scanner-');
    });

    it('should have Lambda function ARN', () => {
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(typeof outputs.lambdaFunctionArn).toBe('string');
    });

    it('should have deployed CloudWatch dashboard', () => {
      expect(outputs.dashboardName).toBeDefined();
      expect(typeof outputs.dashboardName).toBe('string');
      expect(outputs.dashboardName).toContain('compliance-dashboard-');
    });

    it('should have deployed CloudWatch alarm', () => {
      expect(outputs.alarmName).toBeDefined();
      expect(typeof outputs.alarmName).toBe('string');
      expect(outputs.alarmName).toContain('compliance-threshold-alarm-');
    });

    it('should have deployed EventBridge rule', () => {
      expect(outputs.eventRuleName).toBeDefined();
      expect(typeof outputs.eventRuleName).toBe('string');
      expect(outputs.eventRuleName).toContain('compliance-schedule-');
    });

    it('should have deployed CloudWatch log group', () => {
      expect(outputs.logGroupName).toBeDefined();
      expect(typeof outputs.logGroupName).toBe('string');
      expect(outputs.logGroupName).toMatch(/\/aws\/lambda\/compliance-scanner-/);
    });

    it('should have SNS subscription details', () => {
      expect(outputs.complianceSubscription).toBeDefined();
      const subscription = outputs.complianceSubscription as Record<string, unknown>;
      expect(subscription.arn).toBeDefined();
      expect(subscription.protocol).toBe('email');
      expect(subscription.endpoint).toBe('compliance-team@example.com');
    });
  });

  describe('Resource Naming Consistency', () => {
    it('should use consistent environment suffix across resources', () => {
      const bucketName = outputs.bucketName as string;
      const functionName = outputs.lambdaFunctionName as string;
      const topicArn = outputs.topicArn as string;

      // Extract suffix from bucket name
      const suffixMatch = bucketName.match(/compliance-results-(.+)$/);
      expect(suffixMatch).toBeTruthy();
      const suffix = suffixMatch![1];

      // Verify all resources use the same suffix
      expect(functionName).toContain(suffix);
      expect(topicArn).toContain(suffix);
    });
  });

  describe('ARN Format Validation', () => {
    it('should have valid SNS ARN format', () => {
      const topicArn = outputs.topicArn as string;
      const arnPattern = /^arn:aws:sns:[a-z0-9-]+:\d{12}:.+$/;
      expect(topicArn).toMatch(arnPattern);
    });

    it('should have valid Lambda ARN format', () => {
      const functionArn = outputs.lambdaFunctionArn as string;
      const arnPattern = /^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:.+$/;
      expect(functionArn).toMatch(arnPattern);
    });
  });

  describe('Output Completeness', () => {
    it('should export all required outputs', () => {
      const requiredOutputs = [
        'bucketName',
        'topicArn',
        'lambdaFunctionName',
        'lambdaFunctionArn',
        'dashboardName',
        'alarmName',
        'eventRuleName',
        'logGroupName',
        'complianceSubscription',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
      });
    });

    it('should have no undefined or null outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
      });
    });
  });

  describe('Resource Count', () => {
    it('should have deployed all expected outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBeGreaterThanOrEqual(9);
    });
  });
});
