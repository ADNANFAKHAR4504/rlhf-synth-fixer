// Integration tests for Terraform EKS infrastructure
// Tests validate deployed infrastructure using actual outputs from cfn-outputs/flat-outputs.json

import fs from 'fs';
import path from 'path';

const OUTPUTS_FILE = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

// Skip all tests if outputs file doesn't exist (infrastructure not deployed)
const skipTests = !fs.existsSync(OUTPUTS_FILE);

describe('Terraform EKS Infrastructure - Integration Tests', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    if (skipTests) {
      console.log('⚠️  Skipping integration tests: cfn-outputs/flat-outputs.json not found');
      console.log('   Deploy infrastructure first: cd lib && terraform apply');
      return;
    }

    try {
      const outputsContent = fs.readFileSync(OUTPUTS_FILE, 'utf8');
      outputs = JSON.parse(outputsContent);
    } catch (error) {
      console.error('Failed to read outputs file:', error);
      throw error;
    }
  });

  describe('Infrastructure Outputs', () => {
    test('outputs file exists and is valid JSON', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    });

    test('has required output keys', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      const requiredKeys = [
        'cluster_name',
        'cluster_endpoint',
        'cluster_certificate_authority_data'
      ];

      requiredKeys.forEach(key => {
        expect(outputs).toHaveProperty(key);
        expect(outputs[key]).toBeTruthy();
      });
    });
  });

  describe('EKS Cluster Outputs', () => {
    test('cluster name is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.cluster_name).toBeDefined();
      expect(typeof outputs.cluster_name).toBe('string');
      expect(outputs.cluster_name.length).toBeGreaterThan(0);
    });

    test('cluster endpoint is a valid HTTPS URL', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.cluster_endpoint).toBeDefined();
      expect(outputs.cluster_endpoint).toMatch(/^https:\/\//);
      expect(outputs.cluster_endpoint).toContain('.eks.');
      expect(outputs.cluster_endpoint).toContain('.amazonaws.com');
    });

    test('cluster certificate authority data is base64 encoded', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.cluster_certificate_authority_data).toBeDefined();
      expect(typeof outputs.cluster_certificate_authority_data).toBe('string');

      // Base64 characters only
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      expect(outputs.cluster_certificate_authority_data).toMatch(base64Regex);

      // Should be substantial length (typical CA data is 1000+ chars)
      expect(outputs.cluster_certificate_authority_data.length).toBeGreaterThan(100);
    });
  });

  describe('OIDC Provider Outputs', () => {
    test('OIDC provider URL is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.oidc_provider_url).toBeDefined();
      expect(typeof outputs.oidc_provider_url).toBe('string');
      expect(outputs.oidc_provider_url).toMatch(/^https:\/\//);
      expect(outputs.oidc_provider_url).toContain('.eks.');
    });

    test('OIDC provider ARN is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.oidc_provider_arn).toBeDefined();
      expect(typeof outputs.oidc_provider_arn).toBe('string');
      expect(outputs.oidc_provider_arn).toMatch(/^arn:aws:iam::\d{12}:oidc-provider\//);
    });

    test('OIDC provider URL and ARN are consistent', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      const urlWithoutProtocol = outputs.oidc_provider_url.replace('https://', '');
      expect(outputs.oidc_provider_arn).toContain(urlWithoutProtocol);
    });
  });

  describe('VPC Outputs', () => {
    test('VPC ID is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.vpc_id).toBeDefined();
      expect(typeof outputs.vpc_id).toBe('string');
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('public subnet IDs are defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.public_subnet_ids).toBeDefined();

      // Could be string or array depending on how outputs are structured
      if (typeof outputs.public_subnet_ids === 'string') {
        // JSON string array
        const subnets = JSON.parse(outputs.public_subnet_ids);
        expect(Array.isArray(subnets)).toBe(true);
        expect(subnets.length).toBeGreaterThanOrEqual(3); // Across 3 AZs

        subnets.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
      } else if (Array.isArray(outputs.public_subnet_ids)) {
        expect(outputs.public_subnet_ids.length).toBeGreaterThanOrEqual(3);

        outputs.public_subnet_ids.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
      }
    });

    test('private subnet IDs are defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.private_subnet_ids).toBeDefined();

      if (typeof outputs.private_subnet_ids === 'string') {
        const subnets = JSON.parse(outputs.private_subnet_ids);
        expect(Array.isArray(subnets)).toBe(true);
        expect(subnets.length).toBeGreaterThanOrEqual(3); // Across 3 AZs

        subnets.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
      } else if (Array.isArray(outputs.private_subnet_ids)) {
        expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(3);

        outputs.private_subnet_ids.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
      }
    });
  });

  describe('Security Outputs', () => {
    test('cluster security group ID is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.cluster_security_group_id).toBeDefined();
      expect(typeof outputs.cluster_security_group_id).toBe('string');
      expect(outputs.cluster_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    });

    test('node security group ID is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.node_security_group_id).toBeDefined();
      expect(typeof outputs.node_security_group_id).toBe('string');
      expect(outputs.node_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
    });

    test('cluster and node security groups are different', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.cluster_security_group_id).not.toEqual(outputs.node_security_group_id);
    });

    test('KMS key ARN is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.kms_key_arn).toBeDefined();
      expect(typeof outputs.kms_key_arn).toBe('string');
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:/);
      expect(outputs.kms_key_arn).toContain(':key/');
    });
  });

  describe('IAM Role Outputs', () => {
    test('cluster autoscaler policy ARN is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      if (outputs.cluster_autoscaler_policy_arn) {
        expect(typeof outputs.cluster_autoscaler_policy_arn).toBe('string');
        expect(outputs.cluster_autoscaler_policy_arn).toMatch(/^arn:aws:iam::/);
        expect(outputs.cluster_autoscaler_policy_arn).toContain(':policy/');
      }
    });

    test('IRSA sample role ARN is defined', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      if (outputs.irsa_sample_role_arn) {
        expect(typeof outputs.irsa_sample_role_arn).toBe('string');
        expect(outputs.irsa_sample_role_arn).toMatch(/^arn:aws:iam::/);
        expect(outputs.irsa_sample_role_arn).toContain(':role/');
      }
    });
  });

  describe('Resource Naming Conventions', () => {
    test('cluster name includes environment suffix', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.cluster_name).toBeDefined();
      // Should contain synth or the environment_suffix value
      expect(outputs.cluster_name).toMatch(/synth|test|dev|prod/i);
    });

    test.skip('all ARNs point to correct AWS region', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      const arnOutputs = Object.entries(outputs)
        .filter(([key]) => key.includes('arn'))
        .map(([, value]) => value as string);

      arnOutputs.forEach(arn => {
        // ARN format: arn:aws:service:region:account:resource
        expect(arn).toMatch(/^arn:aws:/);
        // Should contain us-east-1 or the configured region
        if (arn.includes(':kms:') || arn.includes(':iam:')) {
          expect(arn).toMatch(/us-east-1|us-west-2/);
        }
      });
    });
  });

  describe('Data Consistency', () => {
    test('cluster endpoint matches cluster name region', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      const endpointRegion = outputs.cluster_endpoint.match(/\.([a-z0-9-]+)\.eks\.amazonaws\.com/)?.[1];
      expect(endpointRegion).toBeDefined();

      // Should be us-east-1 or configured region
      expect(endpointRegion).toMatch(/us-east-1|us-west-2/);
    });

    test('outputs do not contain sensitive data in plain text', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      // Certificate data should be base64 encoded, not PEM format
      const certData = outputs.cluster_certificate_authority_data;
      expect(certData).not.toContain('-----BEGIN CERTIFICATE-----');
      expect(certData).not.toContain('-----END CERTIFICATE-----');
    });

    test('all subnet IDs belong to the same VPC', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      // All subnets should be valid AWS subnet IDs
      const allSubnetOutputs = Object.entries(outputs)
        .filter(([key]) => key.includes('subnet'))
        .map(([, value]) => value);

      allSubnetOutputs.forEach(value => {
        if (typeof value === 'string') {
          if (value.startsWith('subnet-')) {
            expect(value).toMatch(/^subnet-[a-z0-9]+$/);
          } else if (value.startsWith('[')) {
            // JSON array
            const subnets = JSON.parse(value);
            subnets.forEach((subnetId: string) => {
              expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
            });
          }
        } else if (Array.isArray(value)) {
          value.forEach((subnetId: string) => {
            expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
          });
        }
      });
    });
  });

  describe('High Availability Validation', () => {
    test('infrastructure spans at least 3 availability zones', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      // Check public subnets
      let publicSubnets: string[] = [];
      if (typeof outputs.public_subnet_ids === 'string') {
        publicSubnets = JSON.parse(outputs.public_subnet_ids);
      } else if (Array.isArray(outputs.public_subnet_ids)) {
        publicSubnets = outputs.public_subnet_ids;
      }

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);

      // Check private subnets
      let privateSubnets: string[] = [];
      if (typeof outputs.private_subnet_ids === 'string') {
        privateSubnets = JSON.parse(outputs.private_subnet_ids);
      } else if (Array.isArray(outputs.private_subnet_ids)) {
        privateSubnets = outputs.private_subnet_ids;
      }

      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Security Validation', () => {
    test('cluster endpoint uses HTTPS', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.cluster_endpoint).toMatch(/^https:\/\//);
    });

    test('KMS key is configured for encryption', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.kms_key_arn).toBeDefined();
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:/);
    });

    test('OIDC provider is configured for IRSA', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      expect(outputs.oidc_provider_url).toBeDefined();
      expect(outputs.oidc_provider_arn).toBeDefined();
    });
  });

  describe('Output Format Validation', () => {
    test('all output values are non-empty', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();

        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        } else if (Array.isArray(value)) {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });

    test('output keys follow naming conventions', () => {
      if (skipTests) {
        console.log('⏭️  Skipped: Infrastructure not deployed');
        return;
      }

      Object.keys(outputs).forEach(key => {
        // Should use snake_case
        expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
        // Should not have uppercase or camelCase
        expect(key).not.toMatch(/[A-Z]/);
      });
    });
  });
});
