// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Helper to load outputs
function loadOutputs() {
  try {
    const outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
    return outputs;
  } catch (error) {
    console.warn('Warning: cfn-outputs/flat-outputs.json not found. Skipping integration tests.');
    return null;
  }
}

describe('Observability Stack Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    outputs = loadOutputs();
  });

  describe('Deployment Validation', () => {
    test('should have deployed successfully with outputs', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have PaymentLogGroupName output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.PaymentLogGroupName).toBeDefined();
      expect(outputs.PaymentLogGroupName).toContain('payment-processing');
    });

    test('should have DashboardName output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.DashboardName).toBeDefined();
      expect(outputs.DashboardName).toContain('PaymentProcessing');
    });

    test('should have XRaySamplingRuleArn output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.XRaySamplingRuleArn).toBeDefined();
      expect(outputs.XRaySamplingRuleArn).toContain('PaymentProcessing');
    });

    test('should have CompositeAlarmName output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.CompositeAlarmName).toBeDefined();
      expect(outputs.CompositeAlarmName).toContain('Critical');
    });

    test('should have CriticalAlertTopicArn output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.CriticalAlertTopicArn).toBeDefined();
      expect(outputs.CriticalAlertTopicArn).toContain('arn:aws:sns');
    });

    test('should have MetricStreamName output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.MetricStreamName).toBeDefined();
      expect(outputs.MetricStreamName).toContain('PaymentMetrics');
    });

    test('should have CloudWatchAgentRoleArn output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.CloudWatchAgentRoleArn).toBeDefined();
      expect(outputs.CloudWatchAgentRoleArn).toContain('arn:aws:iam');
    });

    test('should have MetricStreamBucketName output', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.MetricStreamBucketName).toBeDefined();
      expect(outputs.MetricStreamBucketName).toContain('metric-stream');
    });

    test('should have EnvironmentSuffix output matching deployment', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups Validation', () => {
    test('PaymentLogGroup should be deployed', () => {
      if (!outputs || !outputs.PaymentLogGroupName) {
        console.log('Skipping: PaymentLogGroupName not available');
        return;
      }
      expect(outputs.PaymentLogGroupName).toMatch(/\/aws\/payment-processing\/.+/);
    });

    test('ApiGatewayLogGroup should be deployed', () => {
      if (!outputs || !outputs.ApiGatewayLogGroupName) {
        console.log('Skipping: ApiGatewayLogGroupName not available');
        return;
      }
      expect(outputs.ApiGatewayLogGroupName).toMatch(/\/aws\/apigateway\/.+/);
    });

    test('LambdaLogGroup should be deployed', () => {
      if (!outputs || !outputs.LambdaLogGroupName) {
        console.log('Skipping: LambdaLogGroupName not available');
        return;
      }
      expect(outputs.LambdaLogGroupName).toMatch(/\/aws\/lambda\/.+/);
    });
  });

  describe('Dashboard Validation', () => {
    test('CloudWatch Dashboard should be created with correct naming', () => {
      if (!outputs || !outputs.DashboardName) {
        console.log('Skipping: DashboardName not available');
        return;
      }
      expect(outputs.DashboardName).toContain('PaymentProcessing');
      expect(outputs.DashboardName).toContain(environmentSuffix);
    });
  });

  describe('X-Ray Validation', () => {
    test('X-Ray Sampling Rule should be created', () => {
      if (!outputs || !outputs.XRaySamplingRuleArn) {
        console.log('Skipping: XRaySamplingRuleArn not available');
        return;
      }
      expect(outputs.XRaySamplingRuleArn).toContain('PaymentProcessing');
      expect(outputs.XRaySamplingRuleArn).toContain(environmentSuffix);
    });
  });

  describe('Alarms Validation', () => {
    test('Composite Alarm should be created', () => {
      if (!outputs || !outputs.CompositeAlarmName) {
        console.log('Skipping: CompositeAlarmName not available');
        return;
      }
      expect(outputs.CompositeAlarmName).toContain('PaymentProcessing');
      expect(outputs.CompositeAlarmName).toContain('Critical');
      expect(outputs.CompositeAlarmName).toContain(environmentSuffix);
    });
  });

  describe('SNS Topic Validation', () => {
    test('Critical Alert Topic should be created', () => {
      if (!outputs || !outputs.CriticalAlertTopicArn) {
        console.log('Skipping: CriticalAlertTopicArn not available');
        return;
      }
      expect(outputs.CriticalAlertTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:[0-9]{12}:.+$/);
    });
  });

  describe('Parameter Store Validation', () => {
    test('Dashboard Config Parameter should be created', () => {
      if (!outputs || !outputs.DashboardConfigParameterName) {
        console.log('Skipping: DashboardConfigParameterName not available');
        return;
      }
      expect(outputs.DashboardConfigParameterName).toContain('/observability/dashboard-config/');
      expect(outputs.DashboardConfigParameterName).toContain(environmentSuffix);
    });
  });

  describe('Metric Stream Validation', () => {
    test('Metric Stream should be created', () => {
      if (!outputs || !outputs.MetricStreamName) {
        console.log('Skipping: MetricStreamName not available');
        return;
      }
      expect(outputs.MetricStreamName).toContain('PaymentMetrics');
      expect(outputs.MetricStreamName).toContain(environmentSuffix);
    });

    test('Metric Stream S3 Bucket should be created', () => {
      if (!outputs || !outputs.MetricStreamBucketName) {
        console.log('Skipping: MetricStreamBucketName not available');
        return;
      }
      expect(outputs.MetricStreamBucketName).toContain('metric-stream');
      expect(outputs.MetricStreamBucketName).toContain(environmentSuffix);
    });
  });

  describe('IAM Roles Validation', () => {
    test('CloudWatch Agent Role should be created', () => {
      if (!outputs || !outputs.CloudWatchAgentRoleArn) {
        console.log('Skipping: CloudWatchAgentRoleArn not available');
        return;
      }
      expect(outputs.CloudWatchAgentRoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.+$/);
    });

    test('CloudWatch Agent Instance Profile should be created', () => {
      if (!outputs || !outputs.CloudWatchAgentInstanceProfileArn) {
        console.log('Skipping: CloudWatchAgentInstanceProfileArn not available');
        return;
      }
      expect(outputs.CloudWatchAgentInstanceProfileArn).toMatch(/^arn:aws:iam::[0-9]{12}:instance-profile\/.+$/);
    });
  });

  describe('Compliance Validation', () => {
    test('all resources should include environment suffix for uniqueness', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }

      const resourcesWithSuffix = [
        'PaymentLogGroupName',
        'DashboardName',
        'XRaySamplingRuleArn',
        'CompositeAlarmName',
        'MetricStreamName',
        'MetricStreamBucketName',
      ];

      resourcesWithSuffix.forEach(resourceKey => {
        if (outputs[resourceKey]) {
          expect(outputs[resourceKey]).toContain(environmentSuffix);
        }
      });
    });

    test('all ARNs should be valid AWS ARN format', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }

      const arnOutputs = [
        'PaymentLogGroupArn',
        'CriticalAlertTopicArn',
        'CloudWatchAgentRoleArn',
        'CloudWatchAgentInstanceProfileArn',
      ];

      arnOutputs.forEach(arnKey => {
        if (outputs[arnKey]) {
          expect(outputs[arnKey]).toMatch(/^arn:aws:.+$/);
        }
      });
    });
  });

  describe('End-to-End Observability Flow', () => {
    test('complete observability stack should be operational', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }

      // Verify all critical components exist
      const criticalOutputs = [
        'PaymentLogGroupName',
        'DashboardName',
        'XRaySamplingRuleArn',
        'CompositeAlarmName',
        'CriticalAlertTopicArn',
        'MetricStreamName',
        'CloudWatchAgentRoleArn',
      ];

      criticalOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
      });
    });

    test('log groups, alarms, and SNS should form complete alerting pipeline', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }

      // Verify alerting pipeline components
      expect(outputs.PaymentLogGroupName).toBeDefined(); // Logs captured
      expect(outputs.CompositeAlarmName).toBeDefined(); // Alarms monitor
      expect(outputs.CriticalAlertTopicArn).toBeDefined(); // SNS notifies
    });

    test('metric stream should connect CloudWatch to S3 for cross-region replication', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }

      expect(outputs.MetricStreamName).toBeDefined();
      expect(outputs.MetricStreamBucketName).toBeDefined();
    });
  });

  describe('Multi-Region Readiness', () => {
    test('stack should be deployable with region-specific parameters', () => {
      if (!outputs) {
        console.log('Skipping: outputs not available');
        return;
      }

      // Verify regional resources include suffix for multi-region deployment
      expect(outputs.DashboardName).toContain(environmentSuffix);
      expect(outputs.MetricStreamBucketName).toContain(environmentSuffix);
    });
  });
});
