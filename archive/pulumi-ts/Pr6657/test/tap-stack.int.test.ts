/**
 * Integration Tests for EKS Cluster Deployment
 *
 * These tests validate the actual deployment outputs from cfn-outputs/flat-outputs.json
 * against expected values and infrastructure requirements.
 *
 * Pattern: Uses cfn-outputs/flat-outputs.json to validate deployed infrastructure
 * No AWS SDK calls - all validation based on deployment outputs
 */
import * as fs from 'fs';
import * as path from 'path';

describe('EKS Cluster Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // TODO: Load deployment outputs after actual deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Deployment outputs not found at ${outputsPath}. Run deployment first.`);
    }

    const rawData = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawData);
  });

  describe('Core Outputs', () => {
    test('should have required core outputs', () => {
      // Verify all core outputs are present
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.oidcProviderArn).toBeDefined();
      expect(outputs.kubeconfig).toBeDefined();
    });

    test('should extract environment suffix from cluster name', () => {
      // Environment suffix is embedded in resource names like eks-cluster-pr6657
      expect(outputs.clusterName).toMatch(/^eks-cluster-[a-z0-9]+$/);
      const match = outputs.clusterName.match(/^eks-cluster-(.+)$/);
      expect(match).not.toBeNull();
      expect(match![1].length).toBeGreaterThan(0);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have valid VPC ID', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('VPC ID should be properly formatted', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.vpcId.length).toBeGreaterThan(4); // vpc- prefix + id
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should have valid cluster name', () => {
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterName).toMatch(/^eks-cluster-/);
    });

    test('cluster name should follow naming convention', () => {
      expect(outputs.clusterName).toMatch(/^eks-cluster-[a-z0-9]+$/);
    });

    test('should have valid cluster endpoint', () => {
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\//);
      expect(outputs.clusterEndpoint).toContain('.eks.');
      expect(outputs.clusterEndpoint).toContain('.amazonaws.com');
    });

    test('cluster endpoint should be accessible HTTPS URL', () => {
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\/[A-F0-9]+\.gr7\.(us|eu|ap)-[a-z]+-\d\.eks\.amazonaws\.com$/);
    });

    test('should have valid OIDC provider ARN', () => {
      expect(outputs.oidcProviderArn).toBeDefined();
      expect(outputs.oidcProviderArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.oidcProviderArn).toContain('oidc-provider');
      expect(outputs.oidcProviderArn).toContain('oidc.eks.');
    });

    test('OIDC provider ARN should match cluster region', () => {
      // Extract region from cluster endpoint
      const endpointMatch = outputs.clusterEndpoint.match(/\.(us|eu|ap)-([a-z]+-\d)\.eks/);
      if (endpointMatch) {
        const region = `${endpointMatch[1]}-${endpointMatch[2]}`;
        expect(outputs.oidcProviderArn).toContain(region);
      }
    });
  });

  describe('Kubeconfig', () => {
    test('should have valid kubeconfig output', () => {
      expect(outputs.kubeconfig).toBeDefined();
      expect(typeof outputs.kubeconfig).toBe('string');
    });

    test('kubeconfig should be valid JSON', () => {
      expect(() => JSON.parse(outputs.kubeconfig)).not.toThrow();
    });

    test('kubeconfig should contain required fields', () => {
      const config = JSON.parse(outputs.kubeconfig);
      expect(config.apiVersion).toBe('v1');
      expect(config.kind).toBe('Config');
      expect(config.clusters).toBeDefined();
      expect(config.contexts).toBeDefined();
      expect(config.users).toBeDefined();
      expect(config['current-context']).toBeDefined();
    });

    test('kubeconfig cluster should match cluster endpoint', () => {
      const config = JSON.parse(outputs.kubeconfig);
      expect(config.clusters).toHaveLength(1);
      expect(config.clusters[0].cluster.server).toBe(outputs.clusterEndpoint);
    });

    test('kubeconfig should have certificate authority data', () => {
      const config = JSON.parse(outputs.kubeconfig);
      expect(config.clusters[0].cluster['certificate-authority-data']).toBeDefined();
      expect(config.clusters[0].cluster['certificate-authority-data']).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    test('kubeconfig should use aws CLI for authentication', () => {
      const config = JSON.parse(outputs.kubeconfig);
      expect(config.users).toHaveLength(1);
      expect(config.users[0].user.exec).toBeDefined();
      expect(config.users[0].user.exec.command).toBe('aws');
      expect(config.users[0].user.exec.args).toContain('eks');
      expect(config.users[0].user.exec.args).toContain('get-token');
    });

    test('kubeconfig should reference correct cluster name', () => {
      const config = JSON.parse(outputs.kubeconfig);
      const args = config.users[0].user.exec.args;
      expect(args).toContain('--cluster-name');
      const clusterNameIndex = args.indexOf('--cluster-name') + 1;
      expect(args[clusterNameIndex]).toBe(outputs.clusterName);
    });
  });

  describe('Naming Conventions', () => {
    test('should follow consistent naming pattern for cluster', () => {
      expect(outputs.clusterName).toMatch(/^eks-cluster-[a-z0-9]+$/);
    });

    test('cluster name should contain identifiable suffix', () => {
      const match = outputs.clusterName.match(/^eks-cluster-(.+)$/);
      expect(match).not.toBeNull();
      expect(match![1]).toBeTruthy();
    });
  });

  describe('AWS Resource Format Validation', () => {
    test('should have valid AWS VPC ID format', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have valid OIDC provider ARN format', () => {
      expect(outputs.oidcProviderArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.oidcProviderArn).toContain('oidc-provider');
    });

    test('should have valid EKS endpoint URL', () => {
      const url = new URL(outputs.clusterEndpoint);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toContain('.eks.');
      expect(url.hostname).toContain('.amazonaws.com');
    });
  });

  describe('Output Completeness', () => {
    test('should have all core infrastructure outputs', () => {
      const requiredOutputs = [
        'vpcId',
        'clusterName',
        'clusterEndpoint',
        'oidcProviderArn',
        'kubeconfig',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    test('should not have undefined or null outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
      });
    });

    test('should not have empty string outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('should have OIDC provider configured for IRSA', () => {
      expect(outputs.oidcProviderArn).toBeDefined();
      expect(outputs.oidcProviderArn).toContain('oidc.eks');
    });

    test('should use HTTPS for cluster endpoint', () => {
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\//);
    });

    test('kubeconfig should use AWS CLI for secure authentication', () => {
      const config = JSON.parse(outputs.kubeconfig);
      expect(config.users[0].user.exec.command).toBe('aws');
    });
  });
});
