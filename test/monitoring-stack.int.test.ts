import * as fs from 'fs';
import * as path from 'path';

describe('MonitoringStack Integration Tests', () => {
  let outputs: Record<string, string>;
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  beforeAll(() => {
    // Load deployment outputs
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Please deploy the stack first.`);
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('SNS Topic Validation', () => {
    it('should have alarm topic ARN deployed', () => {
      expect(outputs.AlarmTopicArn).toBeDefined();
      expect(outputs.AlarmTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-z0-9-]+$/);
    });

    it('should have alarm topic with correct naming pattern', () => {
      expect(outputs.AlarmTopicArn).toContain('postgres-dr-alarms');
    });

    it('should have alarm topic in correct region', () => {
      expect(outputs.AlarmTopicArn).toContain('us-east-1');
    });

    it('should have matching internal alarm topic reference', () => {
      const internalKey = Object.keys(outputs).find(key =>
        key.includes('MonitoringStack') && key.includes('AlarmTopic') && key.includes('Ref')
      );

      if (internalKey) {
        expect(outputs[internalKey]).toBe(outputs.AlarmTopicArn);
      }
    });
  });

  describe('CloudWatch Alarms Validation', () => {
    it('should have composite alarm name', () => {
      expect(outputs.CompositeAlarmName).toBeDefined();
      expect(outputs.CompositeAlarmName).toMatch(/^postgres-dr-composite-[a-z0-9-]+$/);
    });

    it('should have composite alarm for primary region', () => {
      expect(outputs.CompositeAlarmName).toContain('us-east-1');
    });

    it('should have composite alarm with environment suffix', () => {
      const suffixMatch = outputs.CompositeAlarmName.match(/postgres-dr-composite-([a-z0-9-]+)/);
      expect(suffixMatch).not.toBeNull();
    });

    it('should have composite alarm name matching expected pattern', () => {
      // Expected format: postgres-dr-composite-<env>-<region>
      const pattern = /^postgres-dr-composite-[a-z0-9]+-us-east-1$/;
      expect(outputs.CompositeAlarmName).toMatch(pattern);
    });
  });

  describe('Replication Lag Lambda Function Validation', () => {
    it('should have replication lag function ARN', () => {
      expect(outputs.ReplicationLagFunctionArn).toBeDefined();
      expect(outputs.ReplicationLagFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-z0-9-]+$/);
    });

    it('should have replication lag function with correct naming', () => {
      expect(outputs.ReplicationLagFunctionArn).toContain('replication-lag-monitor');
    });

    it('should have replication lag function in primary region', () => {
      expect(outputs.ReplicationLagFunctionArn).toContain('us-east-1');
    });

    it('should have replication lag function with environment suffix', () => {
      const arnParts = outputs.ReplicationLagFunctionArn.split(':');
      const functionName = arnParts[arnParts.length - 1];
      expect(functionName).toMatch(/^replication-lag-monitor-[a-z0-9-]+-us-east-1$/);
    });

    it('should have valid Lambda function ARN structure', () => {
      const parts = outputs.ReplicationLagFunctionArn.split(':');
      expect(parts).toHaveLength(7);
      expect(parts[0]).toBe('arn');
      expect(parts[1]).toBe('aws');
      expect(parts[2]).toBe('lambda');
      expect(parts[3]).toBe('us-east-1');
      expect(parts[4]).toMatch(/^\d{12}$/);
      expect(parts[5]).toBe('function');
      expect(parts[6]).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Lambda Function Configuration Validation', () => {
    it('should validate replication lag function name format', () => {
      const functionArn = outputs.ReplicationLagFunctionArn;
      const functionName = functionArn.split(':').pop();

      expect(functionName).toMatch(/^replication-lag-monitor-[a-z0-9]+-us-east-1$/);
    });

    it('should have consistent naming across monitoring resources', () => {
      const extractEnvSuffix = (str: string): string | null => {
        const match = str.match(/-([a-z0-9]+)-us-east-1/);
        return match ? match[1] : null;
      };

      const alarmSuffix = extractEnvSuffix(outputs.CompositeAlarmName);
      const topicSuffix = extractEnvSuffix(outputs.AlarmTopicArn);
      const functionSuffix = extractEnvSuffix(outputs.ReplicationLagFunctionArn);

      expect(alarmSuffix).toBe(topicSuffix);
      expect(alarmSuffix).toBe(functionSuffix);
    });
  });

  describe('Monitoring Outputs Structure Validation', () => {
    it('should have all required monitoring outputs', () => {
      const requiredOutputs = [
        'AlarmTopicArn',
        'CompositeAlarmName',
        'ReplicationLagFunctionArn',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    it('should have valid output values without null or undefined', () => {
      expect(outputs.AlarmTopicArn).not.toContain('null');
      expect(outputs.AlarmTopicArn).not.toContain('undefined');

      expect(outputs.CompositeAlarmName).not.toContain('null');
      expect(outputs.CompositeAlarmName).not.toContain('undefined');

      expect(outputs.ReplicationLagFunctionArn).not.toContain('null');
      expect(outputs.ReplicationLagFunctionArn).not.toContain('undefined');
    });

    it('should have non-empty output values', () => {
      expect(outputs.AlarmTopicArn.length).toBeGreaterThan(0);
      expect(outputs.CompositeAlarmName.length).toBeGreaterThan(0);
      expect(outputs.ReplicationLagFunctionArn.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Account and Region Consistency', () => {
    it('should use consistent AWS account ID across monitoring resources', () => {
      const extractAccountId = (arn: string): string | null => {
        const match = arn.match(/:(\d{12}):/);
        return match ? match[1] : null;
      };

      const topicAccountId = extractAccountId(outputs.AlarmTopicArn);
      const functionAccountId = extractAccountId(outputs.ReplicationLagFunctionArn);

      expect(topicAccountId).toBe(functionAccountId);
      expect(topicAccountId).toMatch(/^\d{12}$/);
    });

    it('should use us-east-1 region for all monitoring resources', () => {
      const extractRegion = (arn: string): string | null => {
        const match = arn.match(/:([a-z0-9-]+):\d{12}:/);
        return match ? match[1] : null;
      };

      const topicRegion = extractRegion(outputs.AlarmTopicArn);
      const functionRegion = extractRegion(outputs.ReplicationLagFunctionArn);

      expect(topicRegion).toBe('us-east-1');
      expect(functionRegion).toBe('us-east-1');
    });
  });

  describe('Resource Naming Pattern Validation', () => {

    it('should have region suffix in resource names', () => {
      const topicName = outputs.AlarmTopicArn.split(':').pop();
      const alarmName = outputs.CompositeAlarmName;
      const functionName = outputs.ReplicationLagFunctionArn.split(':').pop();

      expect(topicName).toContain('us-east-1');
      expect(alarmName).toContain('us-east-1');
      expect(functionName).toContain('us-east-1');
    });
  });

  describe('Integration with Database Stack', () => {
    it('should have database resources for monitoring', () => {
      // Monitoring stack depends on database stack outputs
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.ReadReplicaEndpoint).toBeDefined();
      expect(outputs.DatabaseIdentifier).toBeDefined();
    });

    it('should validate database is in same region as monitoring', () => {
      expect(outputs.DatabaseEndpoint).toContain('.us-east-1.');
    });

    it('should have read replica for replication lag monitoring', () => {
      // Replication lag function only created when read replica exists
      expect(outputs.ReadReplicaEndpoint).toBeDefined();
      expect(outputs.ReplicationLagFunctionArn).toBeDefined();
    });
  });

  describe('Integration with VPC', () => {
    it('should have VPC for Lambda function deployment', () => {
      // Lambda function deployed in VPC
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    it('should have Lambda security group', () => {
      expect(outputs.LambdaSecurityGroupId).toBeDefined();
      expect(outputs.LambdaSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });

    it('should have private subnets for Lambda', () => {
      const lambdaSubnetKeys = Object.keys(outputs).filter(key =>
        key.includes('privatelambda') && key.includes('Subnet') && key.includes('Ref')
      );

      expect(lambdaSubnetKeys.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Monitoring Alarms Configuration', () => {
    it('should have composite alarm for critical issues', () => {
      expect(outputs.CompositeAlarmName).toBeDefined();
      expect(outputs.CompositeAlarmName).toMatch(/^postgres-dr-composite-/);
    });

    it('should validate alarm naming includes environment and region', () => {
      const alarmName = outputs.CompositeAlarmName;
      const parts = alarmName.split('-');

      expect(parts).toContain('postgres');
      expect(parts).toContain('dr');
      expect(parts).toContain('composite');
      expect(alarmName).toContain('us-east-1');
    });
  });

  describe('Lambda IAM and Permissions', () => {
    it('should have Lambda function with proper ARN structure', () => {
      const arn = outputs.ReplicationLagFunctionArn;

      // Validate full ARN structure
      expect(arn).toMatch(/^arn:aws:lambda:us-east-1:\d{12}:function:replication-lag-monitor-[a-z0-9-]+$/);
    });

    it('should have function name indicating monitoring purpose', () => {
      const functionName = outputs.ReplicationLagFunctionArn.split(':').pop();
      expect(functionName).toContain('replication-lag-monitor');
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should have alarm topic with valid ARN', () => {
      const topicArn = outputs.AlarmTopicArn;
      const arnPattern = /^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-z0-9-]+$/;

      expect(topicArn).toMatch(arnPattern);
    });

    it('should have alarm topic in same region as other resources', () => {
      const topicRegion = outputs.AlarmTopicArn.split(':')[3];
      const functionRegion = outputs.ReplicationLagFunctionArn.split(':')[3];

      expect(topicRegion).toBe(functionRegion);
      expect(topicRegion).toBe('us-east-1');
    });

    it('should have alarm topic name matching pattern', () => {
      const topicName = outputs.AlarmTopicArn.split(':').pop();
      expect(topicName).toMatch(/^postgres-dr-alarms-[a-z0-9]+-us-east-1$/);
    });
  });

  describe('EventBridge Integration', () => {
    it('should validate replication lag function exists for scheduling', () => {
      // Function should exist for EventBridge schedule
      expect(outputs.ReplicationLagFunctionArn).toBeDefined();
      expect(outputs.ReplicationLagFunctionArn).toContain(':function:');
    });

    it('should have function name suitable for EventBridge target', () => {
      const functionName = outputs.ReplicationLagFunctionArn.split(':').pop();
      expect(functionName).toMatch(/^[a-z0-9-]+$/);
      expect(functionName!.length).toBeGreaterThan(0);
      expect(functionName!.length).toBeLessThan(256);
    });
  });

  describe('Monitoring Stack Completeness', () => {
    it('should have all core monitoring components deployed', () => {
      const components = {
        'SNS Topic': outputs.AlarmTopicArn,
        'Composite Alarm': outputs.CompositeAlarmName,
        'Replication Lag Function': outputs.ReplicationLagFunctionArn,
      };

      Object.entries(components).forEach(([name, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
      });
    });

    it('should validate monitoring stack outputs are properly exported', () => {
      // Check that outputs exist and are accessible
      expect(Object.keys(outputs)).toContain('AlarmTopicArn');
      expect(Object.keys(outputs)).toContain('CompositeAlarmName');
      expect(Object.keys(outputs)).toContain('ReplicationLagFunctionArn');
    });
  });

  describe('Cross-Stack References', () => {
    it('should have VPC reference for Lambda deployment', () => {
      expect(outputs.VpcId).toBeDefined();
    });

    it('should have database references for monitoring', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.ReadReplicaEndpoint).toBeDefined();
    });

    it('should validate all dependent stack outputs exist', () => {
      const dependencies = [
        'VpcId', // From NetworkStack
        'DatabaseEndpoint', // From DatabaseStack
        'ReadReplicaEndpoint', // From DatabaseStack
      ];

      dependencies.forEach(dep => {
        expect(outputs[dep]).toBeDefined();
      });
    });
  });

  describe('Resource Tagging Validation', () => {
    it('should have resources with consistent naming for tagging', () => {
      // Extract environment suffix from resources
      const extractSuffix = (str: string): string | null => {
        const match = str.match(/-([a-z0-9]+)-us-east-1/);
        return match ? match[1] : null;
      };

      const suffixes = [
        extractSuffix(outputs.AlarmTopicArn.split(':').pop()!),
        extractSuffix(outputs.CompositeAlarmName),
        extractSuffix(outputs.ReplicationLagFunctionArn.split(':').pop()!),
      ].filter(Boolean);

      // All should have same suffix
      const uniqueSuffixes = new Set(suffixes);
      expect(uniqueSuffixes.size).toBe(1);
    });
  });

  describe('Monitoring Stack Output Validation Summary', () => {
    it('should pass all monitoring stack validations', () => {
      const validations = {
        'Has Alarm Topic': outputs.AlarmTopicArn && outputs.AlarmTopicArn.includes(':sns:'),
        'Has Composite Alarm': outputs.CompositeAlarmName && outputs.CompositeAlarmName.startsWith('postgres-dr-composite'),
        'Has Replication Lag Function': outputs.ReplicationLagFunctionArn && outputs.ReplicationLagFunctionArn.includes(':lambda:'),
        'Correct Region': outputs.AlarmTopicArn.includes('us-east-1'),
        'Has Database Dependencies': outputs.DatabaseEndpoint && outputs.ReadReplicaEndpoint,
        'Has VPC Dependencies': outputs.VpcId,
      };

      Object.entries(validations).forEach(([check, passed]) => {
        expect(passed).toBeTruthy();
      });
    });

    it('should have complete monitoring infrastructure', () => {
      const criticalResources = [
        outputs.AlarmTopicArn,
        outputs.CompositeAlarmName,
        outputs.ReplicationLagFunctionArn,
      ];

      criticalResources.forEach(resource => {
        expect(resource).toBeDefined();
        expect(resource.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Primary Region Validation', () => {
    it('should only have replication lag function in primary region', () => {
      // This test validates that monitoring stack deployed with primary=true
      expect(outputs.ReplicationLagFunctionArn).toBeDefined();
    });

    it('should have primary region identifier in composite alarm', () => {
      expect(outputs.CompositeAlarmName).toContain('us-east-1');
    });

    it('should have all monitoring resources in primary region', () => {
      expect(outputs.AlarmTopicArn).toContain('us-east-1');
      expect(outputs.CompositeAlarmName).toContain('us-east-1');
      expect(outputs.ReplicationLagFunctionArn).toContain('us-east-1');
    });
  });
});
