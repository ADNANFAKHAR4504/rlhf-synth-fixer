import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation DMS Migration Integration Tests', () => {
  let outputs: any;
  const outputsPath = path.join(
    __dirname,
    '..',
    'cfn-outputs',
    'flat-outputs.json'
  );

  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error(`Deployment outputs not found at ${outputsPath}`);
    }
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'DMSReplicationTaskArn',
        'AuroraClusterEndpoint',
        'AuroraClusterPort',
        'Route53HostedZoneId',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'SNSAlertTopicArn',
        'AuroraClusterIdentifier',
        'DMSSecurityGroupId',
        'AuroraSecurityGroupId',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('should have valid ARN formats', () => {
      const arnOutputs = [
        'DMSReplicationTaskArn',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'SNSAlertTopicArn',
      ];

      arnOutputs.forEach(output => {
        expect(outputs[output]).toMatch(/^arn:aws:[a-z]+:[a-z0-9-]+:\d+:.+$/);
      });
    });

    test('Aurora endpoint should be valid', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toMatch(
        /^[a-z0-9-]+\.(cluster-)?[a-z0-9-]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/
      );
    });

    test('Aurora port should be PostgreSQL default', () => {
      expect(outputs.AuroraClusterPort).toBe('5432');
    });

    test('Route 53 hosted zone ID should be valid', () => {
      expect(outputs.Route53HostedZoneId).toBeDefined();
      expect(outputs.Route53HostedZoneId).toMatch(/^Z[A-Z0-9]+$/);
    });

    test('Security group IDs should be valid', () => {
      expect(outputs.DMSSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs.AuroraSecurityGroupId).toMatch(/^sg-[a-f0-9]{17}$/);
    });

    test('CloudWatch dashboard URL should be valid', () => {
      expect(outputs.CloudWatchDashboardUrl).toBeDefined();
      expect(outputs.CloudWatchDashboardUrl).toContain(
        'console.aws.amazon.com/cloudwatch'
      );
      expect(outputs.CloudWatchDashboardUrl).toContain('dashboards');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('resources should include environment identifier', () => {
      // Check that resource names/identifiers include environment differentiation
      const hasEnvironmentSuffix = (value: string) => {
        return /-(dev|qa|staging|prod|pr\d+|synth\w+)($|[^a-z])/.test(value);
      };

      expect(hasEnvironmentSuffix(outputs.DMSReplicationTaskArn)).toBe(true);
      expect(hasEnvironmentSuffix(outputs.AuroraClusterEndpoint)).toBe(true);
      expect(hasEnvironmentSuffix(outputs.DMSReplicationInstanceArn)).toBe(
        true
      );
    });

    test('all ARNs should reference correct AWS region', () => {
      const arnOutputs = [
        'DMSReplicationTaskArn',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'SNSAlertTopicArn',
      ];

      arnOutputs.forEach(output => {
        expect(outputs[output]).toContain(':us-east-1:');
      });
    });

    test('all ARNs should reference correct AWS account', () => {
      const arnOutputs = [
        'DMSReplicationTaskArn',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'SNSAlertTopicArn',
      ];

      const accountId = '342597974367';
      arnOutputs.forEach(output => {
        expect(outputs[output]).toContain(`:${accountId}:`);
      });
    });
  });

  describe('DMS Resources', () => {
    test('DMS replication task ARN should be valid', () => {
      expect(outputs.DMSReplicationTaskArn).toMatch(/^arn:aws:dms:.+:task:.+$/);
    });

    test('DMS replication instance ARN should be valid', () => {
      expect(outputs.DMSReplicationInstanceArn).toMatch(
        /^arn:aws:dms:.+:rep:.+$/
      );
    });

    test('DMS source endpoint ARN should be valid', () => {
      expect(outputs.DMSSourceEndpointArn).toMatch(
        /^arn:aws:dms:.+:endpoint:.+$/
      );
    });

    test('DMS target endpoint ARN should be valid', () => {
      expect(outputs.DMSTargetEndpointArn).toMatch(
        /^arn:aws:dms:.+:endpoint:.+$/
      );
    });
  });

  describe('Aurora Database', () => {
    test('Aurora cluster endpoint should be resolvable format', () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterEndpoint.length).toBeGreaterThan(0);
      expect(outputs.AuroraClusterEndpoint).toContain('.rds.amazonaws.com');
    });

    test('Aurora cluster identifier should be present', () => {
      expect(outputs.AuroraClusterIdentifier).toBeDefined();
      expect(outputs.AuroraClusterIdentifier.length).toBeGreaterThan(0);
    });

    test('Aurora port should be numeric', () => {
      const port = parseInt(outputs.AuroraClusterPort);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('SNS alert topic ARN should be valid', () => {
      expect(outputs.SNSAlertTopicArn).toMatch(/^arn:aws:sns:.+:\d+:.+$/);
    });

    test('CloudWatch dashboard URL should point to correct region', () => {
      expect(outputs.CloudWatchDashboardUrl).toContain('region=us-east-1');
    });

    test('CloudWatch dashboard URL should reference correct dashboard', () => {
      expect(outputs.CloudWatchDashboardUrl).toContain(
        'DMS-Aurora-Migration-Dashboard'
      );
    });
  });

  describe('Network Resources', () => {
    test('security group IDs should be valid AWS format', () => {
      expect(outputs.DMSSecurityGroupId).toBeDefined();
      expect(outputs.AuroraSecurityGroupId).toBeDefined();
      expect(outputs.DMSSecurityGroupId).not.toBe(
        outputs.AuroraSecurityGroupId
      );
    });
  });

  describe('Route 53 Configuration', () => {
    test('hosted zone ID should be present', () => {
      expect(outputs.Route53HostedZoneId).toBeDefined();
      expect(outputs.Route53HostedZoneId.length).toBeGreaterThan(0);
    });

    test('hosted zone ID should match AWS format', () => {
      // AWS hosted zone IDs start with Z and contain alphanumeric characters
      expect(outputs.Route53HostedZoneId).toMatch(/^Z[A-Z0-9]+$/);
    });
  });

  describe('Cross-Stack References', () => {
    test('all outputs should be exportable for cross-stack references', () => {
      // Verify outputs exist and are not empty
      Object.keys(outputs).forEach(key => {
        if (key !== 'CloudWatchDashboardUrl') {
          // URLs are informational only
          expect(outputs[key]).toBeDefined();
          expect(outputs[key].length).toBeGreaterThan(0);
        }
      });
    });

    test('resource identifiers should be unique', () => {
      const values = Object.values(outputs);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('Deployment Completeness', () => {
    test('all output keys should match template outputs', () => {
      const expectedOutputs = [
        'DMSReplicationTaskArn',
        'AuroraClusterEndpoint',
        'AuroraClusterPort',
        'Route53HostedZoneId',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'CloudWatchDashboardUrl',
        'SNSAlertTopicArn',
        'AuroraClusterIdentifier',
        'DMSSecurityGroupId',
        'AuroraSecurityGroupId',
      ];

      const actualOutputs = Object.keys(outputs);
      expectedOutputs.forEach(expectedKey => {
        expect(actualOutputs).toContain(expectedKey);
      });
    });

    test('no unexpected outputs should be present', () => {
      const expectedOutputs = [
        'DMSReplicationTaskArn',
        'AuroraClusterEndpoint',
        'AuroraClusterPort',
        'Route53HostedZoneId',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'CloudWatchDashboardUrl',
        'SNSAlertTopicArn',
        'AuroraClusterIdentifier',
        'DMSSecurityGroupId',
        'AuroraSecurityGroupId',
      ];

      const actualOutputs = Object.keys(outputs);
      actualOutputs.forEach(actualKey => {
        expect(expectedOutputs).toContain(actualKey);
      });
    });
  });
});
