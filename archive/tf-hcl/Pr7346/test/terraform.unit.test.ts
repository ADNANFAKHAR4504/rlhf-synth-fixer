// tests/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

// Helper to read file content from lib/
function fileContent(name: string): string {
  return fs.readFileSync(path.join(LIB_DIR, name), 'utf8');
}

// List all .tf files you want to test
const tfFiles = [
  'main.tf',
  'versions.tf',
  'eks_cluster.tf',
  'eks_node_groups.tf',
  'eks_fargate.tf',
  'eks_addons.tf',
  'security.tf',
  'iam.tf',
  'monitoring.tf',
  'outputs.tf',
  'variables.tf',
  'helm.tf',
];

describe('EKS Terraform - Basic Unit Tests', () => {
  describe('Provider and version config', () => {
    test('versions.tf defines AWS provider', () => {
      const content = fileContent('versions.tf');
      expect(content).toMatch(/required_providers/);
      expect(content).toMatch(/aws/);
    });
  });

  describe('Cluster resources and IAM', () => {
    test('eks_cluster.tf defines aws_eks_cluster resource', () => {
      const content = fileContent('eks_cluster.tf');
      expect(content).toMatch(/resource\s+"aws_eks_cluster"\s+"main"/);
      expect(content).toContain('role_arn = aws_iam_role.eks_cluster.arn');
      expect(content).toContain('encryption_config');
    });

    test('IAM role for EKS cluster defined', () => {
      const content = fileContent('eks_cluster.tf');
      expect(content).toMatch(/resource\s+"aws_iam_role"\s+"eks_cluster"/);
      expect(content).toMatch(/assume_role_policy/);
    });
  });

  describe('Node groups and Fargate profiles', () => {
    test('eks_node_groups.tf has node group resources', () => {
      const content = fileContent('eks_node_groups.tf');
      expect(content).toMatch(/resource\s+"aws_eks_node_group"\s+"frontend"/);
      expect(content).toMatch(/resource\s+"aws_eks_node_group"\s+"backend"/);
      expect(content).toMatch(/resource\s+"aws_eks_node_group"\s+"data_processing"/);
    });

    test('eks_fargate.tf declares fargate profiles', () => {
      const content = fileContent('eks_fargate.tf');
      expect(content).toMatch(/resource\s+"aws_eks_fargate_profile"\s+"coredns"/);
      expect(content).toMatch(/resource\s+"aws_eks_fargate_profile"\s+"alb_controller"/);
    });
  });

  describe('Security and Monitoring', () => {
    test('security.tf includes security group and subnet references', () => {
      const content = fileContent('security.tf').toLowerCase();
      expect(content).toContain('security_group');
      expect(content).toContain('subnet');
    });

    test('monitoring.tf references CloudWatch and Container Insights', () => {
      const content = fileContent('monitoring.tf').toLowerCase();
      expect(content).toContain('cloudwatch');
      expect(content).toContain('/aws/containerinsights');
    });
  });

  describe('IAM roles for controllers and autoscaler', () => {
    test('iam.tf contains roles for alb controller, autoscaler and secrets access', () => {
      const content = fileContent('iam.tf').toLowerCase();
      expect(content).toContain('alb');
      expect(content).toContain('controller');
      expect(content).toContain('autoscaler');
      expect(content).toContain('secrets');
    });
  });

  describe('Outputs', () => {
    test('outputs.tf declares core cluster outputs', () => {
      const content = fileContent('outputs.tf');
      [
        'cluster_id',
        'cluster_name',
        'cluster_endpoint',
        'cluster_version',
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'cloudwatch_log_group_name',
        'ecr_repository_url',
        'oidc_provider_arn'
      ].forEach(output => {
        expect(content).toContain(`output "${output}"`);
      });
    });

    test('outputs.tf includes node group and fargate profile outputs', () => {
      const content = fileContent('outputs.tf');
      [
        'node_group_frontend_id',
        'node_group_backend_id',
        'node_group_data_processing_id',
        'fargate_profile_coredns_id',
        'fargate_profile_alb_controller_id'
      ].forEach(output => {
        expect(content).toContain(`output "${output}"`);
      });
    });

    test('outputs.tf includes cluster_info output block', () => {
      const content = fileContent('outputs.tf');
      expect(content).toContain('output "cluster_info"');
      expect(content).toContain('node_groups');
      expect(content).toContain('fargate_profiles');
    });
  });

  describe('Variables and Helm module', () => {
    test('variables.tf defines variables for cluster_name and aws_region', () => {
      const content = fileContent('variables.tf');
      expect(content).toMatch(/variable\s+"cluster_name"/);
      expect(content).toMatch(/variable\s+"aws_region"/);
    });
  });

  describe('Syntax validation', () => {
    test('all Terraform .tf files have balanced braces', () => {
      tfFiles.forEach(file => {
        const content = fileContent(file);
        const opening = (content.match(/{/g) || []).length;
        const closing = (content.match(/}/g) || []).length;
        expect(opening).toBe(closing);
      });
    });
  });
});
