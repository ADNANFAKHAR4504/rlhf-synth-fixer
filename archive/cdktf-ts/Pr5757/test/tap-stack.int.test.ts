import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('CloudWatch Monitoring Stack Integration Tests', () => {
  describe('Infrastructure Synthesis', () => {
    test('should synthesize complete infrastructure without errors', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ca-central-1',
        defaultTags: [
          {
            tags: {
              Environment: 'production',
              Team: 'platform',
            },
          },
        ],
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      expect(synthesized).toContain('monitoring');
    });

    test('should create all required AWS resources', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ca-central-1',
      });

      const synthesized = Testing.synth(stack);

      // Check for CloudWatch resources
      expect(synthesized).toContain('aws_cloudwatch_log_group');
      expect(synthesized).toContain('aws_cloudwatch_metric_alarm');
      expect(synthesized).toContain('aws_cloudwatch_dashboard');
      expect(synthesized).toContain('aws_cloudwatch_log_metric_filter');

      // Check for Lambda resources
      expect(synthesized).toContain('aws_lambda_function');
      expect(synthesized).toContain('aws_lambda_permission');

      // Check for SNS resources
      expect(synthesized).toContain('aws_sns_topic');
      expect(synthesized).toContain('aws_sns_topic_subscription');

      // Check for IAM resources
      expect(synthesized).toContain('aws_iam_role');
      expect(synthesized).toContain('aws_iam_policy');
    });

    test('should configure CloudWatch Log Group correctly', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('/aws/application/monitoring-test');
      expect(synthesized).toContain('"retention_in_days": 30');
    });

    test('should configure Lambda function correctly', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('log-processor-test');
      expect(synthesized).toContain('"runtime": "nodejs18.x"');
      expect(synthesized).toContain('"timeout": 60');
      expect(synthesized).toContain('"memory_size": 256');
    });

    test('should configure SNS topic with encryption', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('monitoring-alarms-test');
      expect(synthesized).toContain('"kms_master_key_id": "alias/aws/sns"');
    });

    test('should configure CloudWatch Alarm with correct threshold', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('high-error-rate-test');
      expect(synthesized).toContain('"threshold": 10');
      expect(synthesized).toContain('"period": 300');
      expect(synthesized).toContain('"comparison_operator": "GreaterThanThreshold"');
    });

    test('should create CloudWatch Dashboard', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('monitoring-dashboard-test');
      expect(synthesized).toContain('Error Count (per minute)');
      expect(synthesized).toContain('Lambda Function Metrics');
    });

    test('should use ca-central-1 region', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'ca-central-1',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"region": "ca-central-1"');
    });

    test('should include environment suffix in resource names', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('monitoring-prod');
      expect(synthesized).toContain('log-processor-prod');
      expect(synthesized).toContain('error-count-prod');
      expect(synthesized).toContain('high-error-rate-prod');
      expect(synthesized).toContain('monitoring-dashboard-prod');
    });

    test('should apply correct tags to resources', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        defaultTags: [
          {
            tags: {
              Environment: 'production',
              Team: 'platform',
            },
          },
        ],
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"Environment": "production"');
      expect(synthesized).toContain('"Team": "platform"');
    });
  });
});
