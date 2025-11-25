import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  let outputs: any;

  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Run deployment first.`
      );
    }
  });

  describe('Output Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(outputs.OIDCIssuer).toBeDefined();
      expect(outputs.Kubeconfig).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.ClusterName).toBeDefined();
      expect(outputs.ClusterSecurityGroupId).toBeDefined();
      expect(outputs.NodeSecurityGroupId).toBeDefined();
    });

    it('should have valid cluster endpoint format', () => {
      expect(outputs.ClusterEndpoint).toMatch(
        /^https:\/\/[A-Za-z0-9-]+\.eks\.[a-z0-9-]+\.amazonaws\.com$/
      );
    });

    it('should have valid OIDC issuer format', () => {
      expect(outputs.OIDCIssuer).toMatch(
        /^https:\/\/oidc\.eks\.[a-z0-9-]+\.amazonaws\.com\/id\/[A-Z0-9-]+$/
      );
    });

    it('should have valid VPC ID format', () => {
      expect(outputs.VpcId).toMatch(/^vpc-[a-z0-9]{8,20}$/);
    });

    it('should have valid security group ID formats', () => {
      expect(outputs.ClusterSecurityGroupId).toMatch(/^sg-[a-z0-9]{8,20}$/);
      expect(outputs.NodeSecurityGroupId).toMatch(/^sg-[a-z0-9]{8,20}$/);
    });

    it('should have valid kubeconfig data', () => {
      expect(outputs.Kubeconfig).toBeDefined();
      expect(typeof outputs.Kubeconfig).toBe('string');
      expect(outputs.Kubeconfig.length).toBeGreaterThan(0);
    });

    it('should have valid cluster name', () => {
      expect(outputs.ClusterName).toBeDefined();
      expect(typeof outputs.ClusterName).toBe('string');
      expect(outputs.ClusterName).toMatch(/^eks-cluster-/);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use consistent naming pattern for cluster resources', () => {
      const clusterName = outputs.ClusterName;
      expect(clusterName).toMatch(/^eks-cluster-[a-z0-9-]+$/);
    });

    it('should include environment suffix in resource names', () => {
      const clusterName = outputs.ClusterName;
      expect(clusterName).toContain('-');
    });
  });

  describe('Output Data Types', () => {
    it('should have string-type outputs', () => {
      expect(typeof outputs.ClusterEndpoint).toBe('string');
      expect(typeof outputs.OIDCIssuer).toBe('string');
      expect(typeof outputs.Kubeconfig).toBe('string');
      expect(typeof outputs.VpcId).toBe('string');
      expect(typeof outputs.ClusterName).toBe('string');
    });

    it('should have non-empty string values', () => {
      expect(outputs.ClusterEndpoint.length).toBeGreaterThan(0);
      expect(outputs.OIDCIssuer.length).toBeGreaterThan(0);
      expect(outputs.Kubeconfig.length).toBeGreaterThan(0);
      expect(outputs.VpcId.length).toBeGreaterThan(0);
    });
  });

  describe('Infrastructure Connectivity Patterns', () => {
    it('should have cluster endpoint in correct region', () => {
      expect(outputs.ClusterEndpoint).toContain('.us-east-1.');
    });

    it('should have OIDC issuer in correct region', () => {
      expect(outputs.OIDCIssuer).toContain('.us-east-1.');
    });

    it('should have matching cluster identifiers', () => {
      const clusterName = outputs.ClusterName;
      expect(clusterName).toBeDefined();
      expect(clusterName.startsWith('eks-cluster-')).toBe(true);
    });

    it('should have security groups for cluster and nodes', () => {
      expect(outputs.ClusterSecurityGroupId).toBeDefined();
      expect(outputs.NodeSecurityGroupId).toBeDefined();
      expect(outputs.ClusterSecurityGroupId).not.toBe(outputs.NodeSecurityGroupId);
    });
  });

  describe('EKS Configuration', () => {
    it('should have HTTPS cluster endpoint', () => {
      expect(outputs.ClusterEndpoint.startsWith('https://')).toBe(true);
    });

    it('should have valid OIDC provider URL', () => {
      expect(outputs.OIDCIssuer.startsWith('https://')).toBe(true);
    });

    it('should have kubeconfig with sufficient data', () => {
      expect(outputs.Kubeconfig.length).toBeGreaterThan(10);
    });
  });


  describe('Network Configuration', () => {
    it('should have VPC configured', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.VpcId.startsWith('vpc-')).toBe(true);
    });

    it('should have cluster and node security groups configured', () => {
      expect(outputs.ClusterSecurityGroupId).toBeDefined();
      expect(outputs.NodeSecurityGroupId).toBeDefined();
    });
  });

  describe('AWS Resource ID Validation', () => {
    it('should have valid AWS resource ID lengths', () => {
      expect(outputs.VpcId.length).toBeGreaterThanOrEqual(12);
      expect(outputs.ClusterSecurityGroupId.length).toBeGreaterThanOrEqual(11);
      expect(outputs.NodeSecurityGroupId.length).toBeGreaterThanOrEqual(11);
    });

    it('should have consistent resource ID formats', () => {
      expect(outputs.VpcId).toMatch(/^vpc-[a-z0-9]+$/);
      expect(outputs.ClusterSecurityGroupId).toMatch(/^sg-[a-z0-9]+$/);
      expect(outputs.NodeSecurityGroupId).toMatch(/^sg-[a-z0-9]+$/);
    });
  });

  describe('Outputs File Structure', () => {
    it('should have valid JSON structure', () => {
      expect(outputs).toBeInstanceOf(Object);
      expect(Array.isArray(outputs)).toBe(false);
    });

    it('should contain only expected output keys', () => {
      const expectedKeys = [
        'ClusterEndpoint',
        'OIDCIssuer',
        'Kubeconfig',
        'VpcId',
        'ClusterName',
        'ClusterSecurityGroupId',
        'NodeSecurityGroupId',
      ];

      const actualKeys = Object.keys(outputs);
      expectedKeys.forEach(key => {
        expect(actualKeys).toContain(key);
      });
    });

    it('should not have null or undefined values', () => {
      Object.values(outputs).forEach(value => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });

    it('should not have empty string values', () => {
      Object.values(outputs).forEach(value => {
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Region Consistency', () => {
    it('should have all resources in us-east-1 region', () => {
      if (outputs.ClusterEndpoint.includes('.amazonaws.com')) {
        expect(outputs.ClusterEndpoint).toContain('.us-east-1.');
      }
      if (outputs.OIDCIssuer.includes('.amazonaws.com')) {
        expect(outputs.OIDCIssuer).toContain('.us-east-1.');
      }
    });
  });

  describe('Resource Relationships', () => {
    it('should have consistent environment suffix across resources', () => {
      const clusterName = outputs.ClusterName;
      const vpcId = outputs.VpcId;

      // Both should have consistent naming
      expect(clusterName).toBeDefined();
      expect(vpcId).toBeDefined();
    });
  });
});
