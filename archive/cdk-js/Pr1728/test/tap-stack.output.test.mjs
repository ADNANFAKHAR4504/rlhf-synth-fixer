import fs from 'fs';
import path from 'path';

describe('TapStack Output Tests', () => {
  let outputs;

  beforeAll(() => {
    // Load deployment outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      throw new Error(
        'Deployment outputs not found. Please deploy the stack first.'
      );
    }
  });

  describe('Stack Outputs Verification', () => {
    test('should verify all required outputs exist', () => {
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.apiEndpoint).toBeDefined();
      expect(outputs.imageProcessorArn).toBeDefined();
      expect(outputs.dataAnalyzerArn).toBeDefined();
      expect(outputs.notificationHandlerArn).toBeDefined();
      expect(outputs.environmentSuffix).toBeDefined();
    });

    test('should verify outputs have correct format', () => {
      // S3 bucket name format
      expect(outputs.s3BucketName).toMatch(/^tap-.*-synthtrainr131$/);

      // API Gateway endpoint format
      expect(outputs.apiEndpoint).toMatch(
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/synthtrainr131$/
      );

      // Lambda ARN format
      expect(outputs.imageProcessorArn).toMatch(
        /^arn:aws:lambda:[a-z0-9-]+:\d+:function:tap-image-processor-synthtrainr131$/
      );
      expect(outputs.dataAnalyzerArn).toMatch(
        /^arn:aws:lambda:[a-z0-9-]+:\d+:function:tap-data-analyzer-synthtrainr131$/
      );
      expect(outputs.notificationHandlerArn).toMatch(
        /^arn:aws:lambda:[a-z0-9-]+:\d+:function:tap-notification-handler-synthtrainr131$/
      );

      // Environment suffix
      expect(outputs.environmentSuffix).toBe('synthtrainr131');
    });

    test('should verify resource naming consistency', () => {
      // All resources should use the same environment suffix
      const suffix = outputs.environmentSuffix;
      expect(outputs.s3BucketName).toContain(suffix);
      expect(outputs.apiEndpoint).toContain(suffix);
      expect(outputs.imageProcessorArn).toContain(suffix);
      expect(outputs.dataAnalyzerArn).toContain(suffix);
      expect(outputs.notificationHandlerArn).toContain(suffix);
    });

    test('should verify API Gateway endpoint is valid', () => {
      const apiUrl = outputs.apiEndpoint;
      const apiIdMatch = apiUrl.match(/https:\/\/([^.]+)\.execute-api/);
      expect(apiIdMatch).not.toBeNull();
      expect(apiIdMatch[1]).toBeDefined();
    });
  });
});
