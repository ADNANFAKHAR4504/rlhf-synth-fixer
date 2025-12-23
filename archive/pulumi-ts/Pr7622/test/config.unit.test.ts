/**
 * Unit tests for configuration and utility functions
 */

import {
  COMPLIANCE_CONFIG,
  getResourceName,
  validateEnvironmentSuffix,
  getLogGroupName,
  getDashboardWidgets,
  getStepFunctionDefinition,
} from '../lib/config';

describe('Configuration Module', () => {
  describe('COMPLIANCE_CONFIG', () => {
    it('should have correct S3 encryption algorithm', () => {
      expect(COMPLIANCE_CONFIG.S3_ENCRYPTION_ALGORITHM).toBe('AES256');
    });

    it('should enable S3 force destroy', () => {
      expect(COMPLIANCE_CONFIG.S3_FORCE_DESTROY).toBe(true);
    });

    it('should have correct Config role policy ARN', () => {
      expect(COMPLIANCE_CONFIG.CONFIG_ROLE_POLICY_ARN).toBe(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );
    });

    it('should have correct Lambda runtime', () => {
      expect(COMPLIANCE_CONFIG.LAMBDA_RUNTIME).toBe('nodejs18.x');
    });

    it('should have Lambda timeout of 180 seconds', () => {
      expect(COMPLIANCE_CONFIG.LAMBDA_TIMEOUT).toBe(180);
    });

    it('should have log retention of 14 days', () => {
      expect(COMPLIANCE_CONFIG.LOG_RETENTION_DAYS).toBe(14);
    });

    it('should have message retention of 14 days', () => {
      expect(COMPLIANCE_CONFIG.MESSAGE_RETENTION_SECONDS).toBe(1209600);
    });

    it('should have visibility timeout of 5 minutes', () => {
      expect(COMPLIANCE_CONFIG.VISIBILITY_TIMEOUT_SECONDS).toBe(300);
    });

    it('should have email SNS protocol', () => {
      expect(COMPLIANCE_CONFIG.SNS_PROTOCOL).toBe('email');
    });

    it('should have placeholder email endpoint', () => {
      expect(COMPLIANCE_CONFIG.SNS_ENDPOINT).toBe('security-team@example.com');
    });

    it('should enable all supported resource types in Config', () => {
      expect(COMPLIANCE_CONFIG.CONFIG_ALL_SUPPORTED).toBe(true);
    });

    it('should include global resources in Config', () => {
      expect(COMPLIANCE_CONFIG.CONFIG_INCLUDE_GLOBAL_RESOURCES).toBe(true);
    });

    it('should have correct S3 encryption rule ID', () => {
      expect(COMPLIANCE_CONFIG.S3_ENCRYPTION_RULE_ID).toBe(
        'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'
      );
    });

    it('should have correct RDS public access rule ID', () => {
      expect(COMPLIANCE_CONFIG.RDS_PUBLIC_ACCESS_RULE_ID).toBe(
        'RDS_INSTANCE_PUBLIC_ACCESS_CHECK'
      );
    });

    it('should have correct Step Function retry max attempts', () => {
      expect(COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_MAX_ATTEMPTS).toBe(3);
    });

    it('should have correct Step Function retry interval', () => {
      expect(COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_INTERVAL).toBe(2);
    });

    it('should have correct Step Function retry backoff rate', () => {
      expect(COMPLIANCE_CONFIG.STEP_FUNCTION_RETRY_BACKOFF_RATE).toBe(2);
    });

    it('should have correct daily schedule', () => {
      expect(COMPLIANCE_CONFIG.DAILY_SCHEDULE).toBe('rate(1 day)');
    });

    it('should have correct metric namespace', () => {
      expect(COMPLIANCE_CONFIG.METRIC_NAMESPACE).toBe('ComplianceMonitoring');
    });

    it('should have correct metric names', () => {
      expect(COMPLIANCE_CONFIG.METRIC_NAMES).toEqual([
        'CompliancePercentage',
        'CompliantRules',
        'NonCompliantRules',
      ]);
    });

    it('should have correct default region', () => {
      expect(COMPLIANCE_CONFIG.DEFAULT_REGION).toBe('us-east-1');
    });
  });

  describe('getResourceName', () => {
    it('should generate resource name with environment suffix', () => {
      const result = getResourceName('config-delivery', 'test123');
      expect(result).toBe('config-delivery-test123');
    });

    it('should handle different resource types', () => {
      const results = [
        getResourceName('lambda-role', 'prod'),
        getResourceName('compliance-queue', 'dev'),
        getResourceName('critical-alerts', 'staging'),
      ];
      expect(results).toEqual([
        'lambda-role-prod',
        'compliance-queue-dev',
        'critical-alerts-staging',
      ]);
    });

    it('should preserve hyphenated resource types', () => {
      const result = getResourceName('compliance-analyzer', 'test');
      expect(result).toBe('compliance-analyzer-test');
    });
  });

  describe('validateEnvironmentSuffix', () => {
    it('should return true for valid environment suffix', () => {
      const result = validateEnvironmentSuffix('test123');
      expect(result).toBe(true);
    });

    it('should throw error for empty string', () => {
      expect(() => validateEnvironmentSuffix('')).toThrow(
        'environmentSuffix is required and cannot be empty'
      );
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => validateEnvironmentSuffix('   ')).toThrow(
        'environmentSuffix is required and cannot be empty'
      );
    });

    it('should accept various valid suffixes', () => {
      const validSuffixes = ['dev', 'prod', 'staging', 'test123', 'pr456'];
      validSuffixes.forEach((suffix) => {
        expect(validateEnvironmentSuffix(suffix)).toBe(true);
      });
    });
  });

  describe('getLogGroupName', () => {
    it('should generate correct log group name', () => {
      const result = getLogGroupName('compliance-analyzer-test123');
      expect(result).toBe('/aws/lambda/compliance-analyzer-test123');
    });

    it('should handle different function names', () => {
      const results = [
        getLogGroupName('auto-tagger-test'),
        getLogGroupName('compliance-analyzer-prod'),
        getLogGroupName('my-function'),
      ];
      expect(results).toEqual([
        '/aws/lambda/auto-tagger-test',
        '/aws/lambda/compliance-analyzer-prod',
        '/aws/lambda/my-function',
      ]);
    });
  });

  describe('getDashboardWidgets', () => {
    it('should return array of 3 widgets', () => {
      const widgets = getDashboardWidgets('test123', 'us-east-1');
      expect(widgets).toHaveLength(3);
    });

    it('should have compliance percentage widget', () => {
      const widgets = getDashboardWidgets('test123', 'us-east-1');
      const widget = widgets[0];
      expect(widget.type).toBe('metric');
      expect(widget.properties.title).toBe('Compliance Percentage');
      expect(widget.properties.metrics[0][0]).toBe('ComplianceMonitoring');
      expect(widget.properties.metrics[0][1]).toBe('CompliancePercentage');
    });

    it('should have compliance rules status widget', () => {
      const widgets = getDashboardWidgets('test123', 'us-east-1');
      const widget = widgets[1];
      expect(widget.type).toBe('metric');
      expect(widget.properties.title).toBe('Compliance Rules Status');
      expect(widget.properties.metrics).toHaveLength(2);
    });

    it('should have log widget with correct query', () => {
      const widgets = getDashboardWidgets('test123', 'us-east-1');
      const widget = widgets[2];
      expect(widget.type).toBe('log');
      expect(widget.properties.title).toBe('Recent Compliance Analysis Logs');
      expect(widget.properties.query).toContain('compliance-analyzer-test123');
    });

    it('should use provided region in all widgets', () => {
      const widgets = getDashboardWidgets('test123', 'us-west-2');
      expect(widgets[0].properties.region).toBe('us-west-2');
      expect(widgets[1].properties.region).toBe('us-west-2');
      expect(widgets[2].properties.region).toBe('us-west-2');
    });

    it('should have correct widget dimensions', () => {
      const widgets = getDashboardWidgets('test123', 'us-east-1');
      expect(widgets[0].width).toBe(12);
      expect(widgets[0].height).toBe(6);
      expect(widgets[1].width).toBe(12);
      expect(widgets[1].height).toBe(6);
      expect(widgets[2].width).toBe(24);
      expect(widgets[2].height).toBe(6);
    });

    it('should have correct widget positions', () => {
      const widgets = getDashboardWidgets('test123', 'us-east-1');
      expect(widgets[0].x).toBe(0);
      expect(widgets[0].y).toBe(0);
      expect(widgets[1].x).toBe(12);
      expect(widgets[1].y).toBe(0);
      expect(widgets[2].x).toBe(0);
      expect(widgets[2].y).toBe(6);
    });

    it('should have y-axis configuration for compliance percentage', () => {
      const widgets = getDashboardWidgets('test123', 'us-east-1');
      const widget = widgets[0];
      expect(widget.properties.yAxis.left.min).toBe(0);
      expect(widget.properties.yAxis.left.max).toBe(100);
    });
  });

  describe('getStepFunctionDefinition', () => {
    const analyzerArn = 'arn:aws:lambda:us-east-1:123456789012:function:analyzer';
    const taggerArn = 'arn:aws:lambda:us-east-1:123456789012:function:tagger';

    it('should return valid Step Functions definition', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      expect(definition).toBeDefined();
      expect(definition.Comment).toBe('Compliance monitoring workflow');
    });

    it('should start with AnalyzeCompliance state', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      expect(definition.StartAt).toBe('AnalyzeCompliance');
    });

    it('should have AnalyzeCompliance task with correct ARN', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const state = definition.States.AnalyzeCompliance;
      expect(state.Type).toBe('Task');
      expect(state.Resource).toBe(analyzerArn);
      expect(state.Next).toBe('CheckComplianceStatus');
    });

    it('should have retry logic in AnalyzeCompliance', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const state = definition.States.AnalyzeCompliance;
      expect(state.Retry).toHaveLength(1);
      expect(state.Retry[0].MaxAttempts).toBe(3);
      expect(state.Retry[0].IntervalSeconds).toBe(2);
      expect(state.Retry[0].BackoffRate).toBe(2);
      expect(state.Retry[0].ErrorEquals).toEqual(['States.ALL']);
    });

    it('should have CheckComplianceStatus choice state', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const state = definition.States.CheckComplianceStatus;
      expect(state.Type).toBe('Choice');
      expect(state.Choices).toHaveLength(1);
      expect(state.Default).toBe('Success');
    });

    it('should check nonCompliantRules in choice state', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const state = definition.States.CheckComplianceStatus;
      const choice = state.Choices[0];
      expect(choice.Variable).toBe('$.nonCompliantRules');
      expect(choice.NumericGreaterThan).toBe(0);
      expect(choice.Next).toBe('TagNonCompliantResources');
    });

    it('should have TagNonCompliantResources task with correct ARN', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const state = definition.States.TagNonCompliantResources;
      expect(state.Type).toBe('Task');
      expect(state.Resource).toBe(taggerArn);
      expect(state.Next).toBe('Success');
    });

    it('should have retry logic in TagNonCompliantResources', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const state = definition.States.TagNonCompliantResources;
      expect(state.Retry).toHaveLength(1);
      expect(state.Retry[0].MaxAttempts).toBe(3);
      expect(state.Retry[0].IntervalSeconds).toBe(2);
      expect(state.Retry[0].BackoffRate).toBe(2);
    });

    it('should have Success terminal state', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const state = definition.States.Success;
      expect(state.Type).toBe('Succeed');
    });

    it('should have all required states', () => {
      const definition = getStepFunctionDefinition(analyzerArn, taggerArn);
      const stateNames = Object.keys(definition.States);
      expect(stateNames).toEqual([
        'AnalyzeCompliance',
        'CheckComplianceStatus',
        'TagNonCompliantResources',
        'Success',
      ]);
    });
  });
});
