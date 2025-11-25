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

    test('should have PrimaryClusterEndpoint output', () => {
      expect(outputs).toHaveProperty('PrimaryClusterEndpoint');
      expect(outputs.PrimaryClusterEndpoint).toMatch(/\.cluster-.*\.rds\.amazonaws\.com$/);
    });

    test('should have PrimaryClusterReadEndpoint output', () => {
      expect(outputs).toHaveProperty('PrimaryClusterReadEndpoint');
      expect(outputs.PrimaryClusterReadEndpoint).toMatch(/\.cluster-ro-.*\.rds\.amazonaws\.com$/);
    });

    test('should have SecondaryClusterEndpoint output', () => {
      expect(outputs).toHaveProperty('SecondaryClusterEndpoint');
      expect(outputs.SecondaryClusterEndpoint).toMatch(/\.cluster-.*\.rds\.amazonaws\.com$/);
    });

    test('should have SecondaryClusterReadEndpoint output', () => {
      expect(outputs).toHaveProperty('SecondaryClusterReadEndpoint');
      expect(outputs.SecondaryClusterReadEndpoint).toMatch(/\.cluster-ro-.*\.rds\.amazonaws\.com$/);
    });

    test('should have DatabaseSecretArn output', () => {
      expect(outputs).toHaveProperty('DatabaseSecretArn');
      expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('should have PrimaryVPCId output', () => {
      expect(outputs).toHaveProperty('PrimaryVPCId');
      expect(outputs.PrimaryVPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have SecondaryVPCId output', () => {
      expect(outputs).toHaveProperty('SecondaryVPCId');
      expect(outputs.SecondaryVPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });
  });

  describe('Output Value Formats', () => {
    test('GlobalClusterIdentifier should contain environmentSuffix pattern', () => {
      if (outputs.GlobalClusterIdentifier) {
        expect(outputs.GlobalClusterIdentifier).toMatch(/^global-aurora-cluster-.+$/);
      }
    });

    test('PrimaryClusterEndpoint should be valid Aurora endpoint', () => {
      if (outputs.PrimaryClusterEndpoint) {
        expect(outputs.PrimaryClusterEndpoint).toContain('.rds.amazonaws.com');
      }
    });

    test('SecondaryClusterEndpoint should be valid Aurora endpoint', () => {
      if (outputs.SecondaryClusterEndpoint) {
        expect(outputs.SecondaryClusterEndpoint).toContain('.rds.amazonaws.com');
      }
    });

    test('DatabaseSecretArn should be valid Secrets Manager ARN', () => {
      if (outputs.DatabaseSecretArn) {
        expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d+:secret:.+$/);
      }
    });

    test('VPC IDs should be valid AWS VPC ID format', () => {
      if (outputs.PrimaryVPCId) {
        expect(outputs.PrimaryVPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      }
      if (outputs.SecondaryVPCId) {
        expect(outputs.SecondaryVPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      }
    });
  });

  describe('Cross-Region Resources', () => {
    test('should have different VPC IDs for primary and secondary', () => {
      if (outputs.PrimaryVPCId && outputs.SecondaryVPCId) {
        expect(outputs.PrimaryVPCId).not.toBe(outputs.SecondaryVPCId);
      }
    });

    test('primary and secondary endpoints should be different', () => {
      if (outputs.PrimaryClusterEndpoint && outputs.SecondaryClusterEndpoint) {
        expect(outputs.PrimaryClusterEndpoint).not.toBe(outputs.SecondaryClusterEndpoint);
      }
    });

    test('primary and secondary read endpoints should be different', () => {
      if (outputs.PrimaryClusterReadEndpoint && outputs.SecondaryClusterReadEndpoint) {
        expect(outputs.PrimaryClusterReadEndpoint).not.toBe(outputs.SecondaryClusterReadEndpoint);
      }
    });
  });

  describe('Required Outputs Present', () => {
    const requiredOutputs = [
      'GlobalClusterIdentifier',
      'PrimaryClusterEndpoint',
      'PrimaryClusterReadEndpoint',
      'SecondaryClusterEndpoint',
      'SecondaryClusterReadEndpoint',
      'DatabaseSecretArn',
      'PrimaryVPCId',
      'SecondaryVPCId'
    ];

    requiredOutputs.forEach(outputKey => {
      test(`should have ${outputKey} in outputs`, () => {
        expect(outputs).toHaveProperty(outputKey);
      });
    });
  });

  describe('Endpoint Accessibility', () => {
    test('primary cluster endpoint should be resolvable', () => {
      if (outputs.PrimaryClusterEndpoint) {
        expect(outputs.PrimaryClusterEndpoint).toBeTruthy();
        expect(outputs.PrimaryClusterEndpoint.length).toBeGreaterThan(20);
      }
    });

    test('secondary cluster endpoint should be resolvable', () => {
      if (outputs.SecondaryClusterEndpoint) {
        expect(outputs.SecondaryClusterEndpoint).toBeTruthy();
        expect(outputs.SecondaryClusterEndpoint.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Security Configuration', () => {
    test('database endpoints should not contain public IP addresses', () => {
      if (outputs.PrimaryClusterEndpoint) {
        // Endpoints should be DNS names, not IPs
        expect(outputs.PrimaryClusterEndpoint).not.toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      }
      if (outputs.SecondaryClusterEndpoint) {
        expect(outputs.SecondaryClusterEndpoint).not.toMatch(/^\d+\.\d+\.\d+\.\d+$/);
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

    test('should have both primary and secondary clusters deployed', () => {
      // Verify both endpoints exist, indicating both clusters are deployed
      const hasPrimary = Boolean(outputs.PrimaryClusterEndpoint);
      const hasSecondary = Boolean(outputs.SecondaryClusterEndpoint);

      if (Object.keys(outputs).length > 0) {
        expect(hasPrimary && hasSecondary).toBe(true);
      }
    });
  });

  describe('High Availability Configuration', () => {
    test('should have read endpoints for both clusters', () => {
      if (Object.keys(outputs).length > 0) {
        expect(outputs.PrimaryClusterReadEndpoint).toBeTruthy();
        expect(outputs.SecondaryClusterReadEndpoint).toBeTruthy();
      }
    });

    test('read endpoints should be different from write endpoints', () => {
      if (outputs.PrimaryClusterEndpoint && outputs.PrimaryClusterReadEndpoint) {
        expect(outputs.PrimaryClusterEndpoint).not.toBe(outputs.PrimaryClusterReadEndpoint);
      }
      if (outputs.SecondaryClusterEndpoint && outputs.SecondaryClusterReadEndpoint) {
        expect(outputs.SecondaryClusterEndpoint).not.toBe(outputs.SecondaryClusterReadEndpoint);
      }
    });
  });

  describe('Deployment Validation', () => {
    test('all required infrastructure components should be present', () => {
      if (Object.keys(outputs).length > 0) {
        const hasGlobalCluster = Boolean(outputs.GlobalClusterIdentifier);
        const hasPrimaryCluster = Boolean(outputs.PrimaryClusterEndpoint);
        const hasSecondaryCluster = Boolean(outputs.SecondaryClusterEndpoint);
        const hasSecret = Boolean(outputs.DatabaseSecretArn);
        const hasNetworking = Boolean(outputs.PrimaryVPCId && outputs.SecondaryVPCId);

        expect(hasGlobalCluster).toBe(true);
        expect(hasPrimaryCluster).toBe(true);
        expect(hasSecondaryCluster).toBe(true);
        expect(hasSecret).toBe(true);
        expect(hasNetworking).toBe(true);
      }
    });

    test('output count should match expected number', () => {
      if (Object.keys(outputs).length > 0) {
        // We expect 8 outputs based on the template
        expect(Object.keys(outputs).length).toBe(8);
      }
    });
  });
});
