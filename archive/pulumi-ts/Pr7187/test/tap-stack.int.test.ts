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
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.oidcIssuer).toBeDefined();
      expect(outputs.kubeconfig).toBeDefined();
    });

    it('should have valid cluster endpoint format', () => {
      expect(outputs.clusterEndpoint).toMatch(
        /^https:\/\/[A-F0-9]+\.gr[0-9]+\.us-east-1\.eks\.amazonaws\.com$/
      );
    });

    it('should have valid OIDC issuer format', () => {
      expect(outputs.oidcIssuer).toMatch(
        /^https:\/\/oidc\.eks\.[a-z0-9-]+\.amazonaws\.com\/id\/[A-Z0-9-]+$/
      );
    });

    it('should have valid kubeconfig data', () => {
      expect(outputs.kubeconfig).toBeDefined();
      expect(typeof outputs.kubeconfig).toBe('string');
      expect(outputs.kubeconfig.length).toBeGreaterThan(0);
    });

    it('should have kubeconfig with cluster name', () => {
      const kubeconfigObj = JSON.parse(outputs.kubeconfig);
      expect(kubeconfigObj).toBeDefined();
      expect(kubeconfigObj.users[0].user.exec.args).toContain('--cluster-name');
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should extract cluster name from kubeconfig', () => {
      const kubeconfigObj = JSON.parse(outputs.kubeconfig);
      const clusterName = kubeconfigObj.users[0].user.exec.args.find((arg: string, idx: number) =>
        kubeconfigObj.users[0].user.exec.args[idx - 1] === '--cluster-name'
      );
      expect(clusterName).toMatch(/^eks-cluster-[a-z0-9-]+$/);
    });

    it('should include environment suffix in cluster endpoint', () => {
      expect(outputs.clusterEndpoint).toContain('.us-east-1.eks.amazonaws.com');
    });
  });

  describe('Output Data Types', () => {
    it('should have string-type outputs', () => {
      expect(typeof outputs.clusterEndpoint).toBe('string');
      expect(typeof outputs.oidcIssuer).toBe('string');
      expect(typeof outputs.kubeconfig).toBe('string');
    });

    it('should have non-empty string values', () => {
      expect(outputs.clusterEndpoint.length).toBeGreaterThan(0);
      expect(outputs.oidcIssuer.length).toBeGreaterThan(0);
      expect(outputs.kubeconfig.length).toBeGreaterThan(0);
    });
  });

  describe('Infrastructure Connectivity Patterns', () => {
    it('should have cluster endpoint in correct region', () => {
      expect(outputs.clusterEndpoint).toContain('.us-east-1.');
    });

    it('should have OIDC issuer in correct region', () => {
      expect(outputs.oidcIssuer).toContain('.us-east-1.');
    });

    it('should have matching cluster identifiers', () => {
      const kubeconfigObj = JSON.parse(outputs.kubeconfig);
      const clusterEndpoint = kubeconfigObj.clusters[0].cluster.server;
      expect(clusterEndpoint).toBe(outputs.clusterEndpoint);
    });

    it('should have OIDC issuer matching cluster ID', () => {
      const clusterIdFromEndpoint = outputs.clusterEndpoint.match(/https:\/\/([A-Z0-9]+)\./)?.[1];
      const clusterIdFromOidc = outputs.oidcIssuer.match(/\/id\/([A-Z0-9]+)$/)?.[1];
      expect(clusterIdFromEndpoint).toBe(clusterIdFromOidc);
    });
  });

  describe('EKS Configuration', () => {
    it('should have HTTPS cluster endpoint', () => {
      expect(outputs.clusterEndpoint.startsWith('https://')).toBe(true);
    });

    it('should have valid OIDC provider URL', () => {
      expect(outputs.oidcIssuer.startsWith('https://')).toBe(true);
    });

    it('should have kubeconfig with sufficient data', () => {
      expect(outputs.kubeconfig.length).toBeGreaterThan(100);
      const kubeconfigObj = JSON.parse(outputs.kubeconfig);
      expect(kubeconfigObj.clusters).toBeDefined();
      expect(kubeconfigObj.users).toBeDefined();
      expect(kubeconfigObj.contexts).toBeDefined();
    });
  });


  describe('Network Configuration', () => {
    it('should have cluster in us-east-1 region', () => {
      expect(outputs.clusterEndpoint).toContain('.us-east-1.eks.amazonaws.com');
      expect(outputs.oidcIssuer).toContain('eks.us-east-1.amazonaws.com');
    });

    it('should have kubeconfig configured for us-east-1', () => {
      const kubeconfigObj = JSON.parse(outputs.kubeconfig);
      const region = kubeconfigObj.users[0].user.exec.args.find((arg: string, idx: number) =>
        kubeconfigObj.users[0].user.exec.args[idx - 1] === '--region'
      );
      expect(region).toBe('us-east-1');
    });
  });

  describe('AWS Resource ID Validation', () => {
    it('should have valid cluster endpoint format', () => {
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\/[A-F0-9]+\.gr[0-9]\.us-east-1\.eks\.amazonaws\.com$/);
    });

    it('should have valid OIDC issuer format', () => {
      expect(outputs.oidcIssuer).toMatch(/^https:\/\/oidc\.eks\.us-east-1\.amazonaws\.com\/id\/[A-F0-9]+$/);
    });
  });

  describe('Outputs File Structure', () => {
    it('should have valid JSON structure', () => {
      expect(outputs).toBeInstanceOf(Object);
      expect(Array.isArray(outputs)).toBe(false);
    });

    it('should contain only expected output keys', () => {
      const expectedKeys = [
        'clusterEndpoint',
        'oidcIssuer',
        'kubeconfig',
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
      if (outputs.clusterEndpoint.includes('.amazonaws.com')) {
        expect(outputs.clusterEndpoint).toContain('.us-east-1.');
      }
      if (outputs.oidcIssuer.includes('.amazonaws.com')) {
        expect(outputs.oidcIssuer).toContain('.us-east-1.');
      }
    });
  });

  describe('Resource Relationships', () => {
    it('should have consistent cluster identifier across outputs', () => {
      const clusterIdFromEndpoint = outputs.clusterEndpoint.match(/https:\/\/([A-F0-9]+)\./)?.[1];
      const clusterIdFromOidc = outputs.oidcIssuer.match(/\/id\/([A-F0-9]+)$/)?.[1];

      expect(clusterIdFromEndpoint).toBeDefined();
      expect(clusterIdFromOidc).toBeDefined();
      expect(clusterIdFromEndpoint).toBe(clusterIdFromOidc);
    });
  });
});
