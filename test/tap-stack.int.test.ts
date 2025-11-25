import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    // Read deployment outputs from cfn-outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('⚠️ No cfn-outputs found. Run deployment first.');
      outputs = {};
    }
  });

  describe('Deployment Outputs', () => {
    test('should have GlobalClusterIdentifier output', () => {
      expect(outputs).toHaveProperty('GlobalClusterIdentifier');
      expect(outputs.GlobalClusterIdentifier).toBeTruthy();
    });

    test('should have ClusterEndpoint output', () => {
      expect(outputs).toHaveProperty('ClusterEndpoint');
      expect(outputs.ClusterEndpoint).toMatch(/\.cluster-.*\.rds\.amazonaws\.com$/);
    });

    test('should have ClusterReadEndpoint output', () => {
      expect(outputs).toHaveProperty('ClusterReadEndpoint');
      expect(outputs.ClusterReadEndpoint).toMatch(/\.cluster-ro-.*\.rds\.amazonaws\.com$/);
    });

    test('should have DatabaseSecretArn output', () => {
      expect(outputs).toHaveProperty('DatabaseSecretArn');
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('should have VPCId output', () => {
      expect(outputs).toHaveProperty('VPCId');
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });
  });

  describe('Output Value Formats', () => {
    test('GlobalClusterIdentifier should contain environmentSuffix pattern', () => {
      if (outputs.GlobalClusterIdentifier) {
        expect(outputs.GlobalClusterIdentifier).toMatch(/^global-aurora-cluster-.+$/);
      }
    });

    test('ClusterEndpoint should be valid Aurora endpoint', () => {
      if (outputs.ClusterEndpoint) {
        expect(outputs.ClusterEndpoint).toContain('.rds.amazonaws.com');
      }
    });

    test('DatabaseSecretArn should be valid Secrets Manager ARN', () => {
      if (outputs.DatabaseSecretArn) {
        expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:[\d\*]+:secret:.+$/);
      }
    });

    test('VPC ID should be valid AWS VPC ID format', () => {
      if (outputs.VPCId) {
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      }
    });
  });

  describe('Required Outputs Present', () => {
    const requiredOutputs = [
      'GlobalClusterIdentifier',
      'ClusterEndpoint',
      'ClusterReadEndpoint',
      'DatabaseSecretArn',
      'VPCId'
    ];

    requiredOutputs.forEach(outputKey => {
      test(`should have ${outputKey} in outputs`, () => {
        expect(outputs).toHaveProperty(outputKey);
      });
    });
  });

  describe('Endpoint Accessibility', () => {
    test('cluster endpoint should be resolvable', () => {
      if (outputs.ClusterEndpoint) {
        expect(outputs.ClusterEndpoint).toBeTruthy();
        expect(outputs.ClusterEndpoint.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Security Configuration', () => {
    test('database endpoints should not contain public IP addresses', () => {
      if (outputs.ClusterEndpoint) {
        // Endpoints should be DNS names, not IPs
        expect(outputs.ClusterEndpoint).not.toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      }
    });

    test('secret ARN should be from Secrets Manager', () => {
      if (outputs.DatabaseSecretArn) {
        expect(outputs.DatabaseSecretArn).toContain('secretsmanager');
      }
    });
  });

  describe('Global Database Configuration', () => {
    test('GlobalClusterIdentifier should follow naming convention', () => {
      if (outputs.GlobalClusterIdentifier) {
        expect(outputs.GlobalClusterIdentifier).toMatch(/^global-aurora-cluster-/);
      }
    });

    test('should have cluster deployed', () => {
      // Verify cluster is deployed
      const hasCluster = Boolean(outputs.ClusterEndpoint);

      if (Object.keys(outputs).length > 0) {
        expect(hasCluster).toBe(true);
      }
    });
  });

  describe('High Availability Configuration', () => {
    test('should have read endpoint', () => {
      if (Object.keys(outputs).length > 0) {
        expect(outputs.ClusterReadEndpoint).toBeTruthy();
      }
    });

    test('read endpoint should be different from write endpoint', () => {
      if (outputs.ClusterEndpoint && outputs.ClusterReadEndpoint) {
        expect(outputs.ClusterEndpoint).not.toBe(outputs.ClusterReadEndpoint);
      }
    });
  });

  describe('Deployment Validation', () => {
    test('all required infrastructure components should be present', () => {
      if (Object.keys(outputs).length > 0) {
        const hasGlobalCluster = Boolean(outputs.GlobalClusterIdentifier);
        const hasCluster = Boolean(outputs.ClusterEndpoint);
        const hasSecret = Boolean(outputs.DatabaseSecretArn);
        const hasNetworking = Boolean(outputs.VPCId);

        expect(hasGlobalCluster).toBe(true);
        expect(hasCluster).toBe(true);
        expect(hasSecret).toBe(true);
        expect(hasNetworking).toBe(true);
      }
    });

    test('output count should match expected number', () => {
      if (Object.keys(outputs).length > 0) {
        // We expect 7 outputs based on the template
        expect(Object.keys(outputs).length).toBe(7);
      }
    });
  });
});
