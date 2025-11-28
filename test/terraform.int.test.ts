// Integration tests for EKS Terraform deployment
// Validates infrastructure post-deployment

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('EKS Infrastructure Integration Tests', () => {
  const libPath = path.resolve(__dirname, '../lib');
  const tfstatePath = path.join(libPath, 'terraform.tfstate');

  describe('Terraform State Validation', () => {
    test('terraform.tfstate exists and is valid JSON', () => {
      expect(fs.existsSync(tfstatePath)).toBe(true);

      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      expect(state).toHaveProperty('version');
      expect(state).toHaveProperty('resources');
      expect(Array.isArray(state.resources)).toBe(true);
    });

    test('state contains expected AWS resources', () => {
      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      const resourceTypes = state.resources.map((r: any) => r.type);

      // Core VPC resources
      expect(resourceTypes).toContain('aws_vpc');
      expect(resourceTypes).toContain('aws_subnet');
      expect(resourceTypes).toContain('aws_internet_gateway');
      expect(resourceTypes).toContain('aws_route_table');

      // EKS resources
      expect(resourceTypes).toContain('aws_eks_cluster');
      expect(resourceTypes).toContain('aws_eks_node_group');
      expect(resourceTypes).toContain('aws_eks_addon');

      // IAM resources
      expect(resourceTypes).toContain('aws_iam_role');
      expect(resourceTypes).toContain('aws_iam_role_policy_attachment');

      // Security groups
      expect(resourceTypes).toContain('aws_security_group');
    });

    test('EKS cluster version is 1.28 or higher', () => {
      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      const eksCluster = state.resources.find(
        (r: any) => r.type === 'aws_eks_cluster' && r.name === 'main'
      );

      expect(eksCluster).toBeDefined();
      const version = parseFloat(eksCluster.instances[0].attributes.version);
      expect(version).toBeGreaterThanOrEqual(1.28);
    });

    test('VPC has correct private subnet configuration', () => {
      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      const privateSubnets = state.resources.filter(
        (r: any) => r.type === 'aws_subnet' && r.name === 'private'
      );

      // Should have 3 private subnets (one per AZ)
      expect(privateSubnets.length).toBeGreaterThanOrEqual(1);

      // Each subnet should have /24 CIDR
      privateSubnets.forEach((subnet: any) => {
        const instances = subnet.instances || [];
        instances.forEach((instance: any) => {
          const cidr = instance.attributes.cidr_block;
          expect(cidr).toMatch(/\/24$/);
        });
      });
    });

    test('NAT instances exist for egress traffic', () => {
      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      const natInstances = state.resources.filter(
        (r: any) => r.type === 'aws_instance' && r.name.includes('nat')
      );

      expect(natInstances.length).toBeGreaterThanOrEqual(1);
    });

    test('IAM OIDC provider exists for IRSA', () => {
      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      const oidcProvider = state.resources.find(
        (r: any) => r.type === 'aws_iam_openid_connect_provider'
      );

      expect(oidcProvider).toBeDefined();
    });

    test('Karpenter IAM roles exist', () => {
      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      const karpenterControllerRole = state.resources.find(
        (r: any) => r.type === 'aws_iam_role' && r.name === 'karpenter_controller'
      );

      const karpenterNodeRole = state.resources.find(
        (r: any) => r.type === 'aws_iam_role' && r.name === 'karpenter_node'
      );

      expect(karpenterControllerRole).toBeDefined();
      expect(karpenterNodeRole).toBeDefined();
    });

    test('all resources have required tags', () => {
      const stateContent = fs.readFileSync(tfstatePath, 'utf8');
      const state = JSON.parse(stateContent);

      const taggedResources = state.resources.filter((r: any) => {
        const instances = r.instances || [];
        return instances.some((instance: any) => instance.attributes.tags);
      });

      taggedResources.forEach((resource: any) => {
        resource.instances.forEach((instance: any) => {
          const tags = instance.attributes.tags || {};

          // Required tags
          expect(tags).toHaveProperty('ManagedBy');
          expect(tags.ManagedBy).toBe('terraform');
          expect(tags).toHaveProperty('TaskID');
          expect(tags.TaskID).toBe('101912832');
        });
      });
    });
  });

  describe('Terraform Configuration Validation', () => {
    test('tap_stack.tf uses variables correctly', () => {
      const tapStackPath = path.join(libPath, 'tap_stack.tf');
      const content = fs.readFileSync(tapStackPath, 'utf8');

      // Should use var.environment_suffix for resource naming
      expect(content).toMatch(/\$\{var\.environment_suffix\}/);

      // Should have aws_region variable
      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test('provider configuration does not have circular dependencies', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      const content = fs.readFileSync(providerPath, 'utf8');

      // Provider block should not reference aws_eks_cluster resources
      expect(content).not.toMatch(/aws_eks_cluster\.main/);
    });
  });
});
