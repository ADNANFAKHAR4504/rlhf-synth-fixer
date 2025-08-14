import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;
  let stack: TapStack;

  beforeEach(() => {
    app = new App();
  });

  describe('Terraform Synthesis', () => {
    test('should synthesize valid Terraform configuration', () => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });

      const synthesized = Testing.synth(stack);
      
      // Verify basic structure
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('provider');
      expect(synthesized).toContain('resource');
    });

    test('should include required AWS resources', () => {
      stack = new TapStack(app, 'TestStack');
      const synthesized = Testing.synth(stack);

      // Check for key AWS resources
      expect(synthesized).toContain('aws_dynamodb_table');
      expect(synthesized).toContain('aws_lambda_function');
      expect(synthesized).toContain('aws_api_gateway_rest_api');
      expect(synthesized).toContain('aws_s3_bucket');
      expect(synthesized).toContain('aws_kms_key');
      expect(synthesized).toContain('aws_iam_role');
    });

    test('should apply correct tags to resources', () => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        defaultTags: {
          tags: {
            CustomTag: 'CustomValue',
          },
        },
      });

      const synthesized = Testing.synth(stack);
      
      // Verify tags are applied
      expect(synthesized).toContain('Environment');
      expect(synthesized).toContain('prod');
      expect(synthesized).toContain('ecommerce-team');
    });
  });
});
