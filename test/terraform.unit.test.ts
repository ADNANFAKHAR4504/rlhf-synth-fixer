// test/terraform.unit.test.ts
// Unit tests for EKS Terraform configuration (no AWS calls)

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../'); // root of tf files

describe('EKS Terraform - Unit Tests', () => {
  let tfFiles: string[];

  beforeAll(() => {
    tfFiles = fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.tf'));
  });

  describe('File structure', () => {
    test('Terraform files exist', () => {
      expect(tfFiles.length).toBeGreaterThan(0);
    });

    test('core Terraform modules/files are present', () => {
      const required = [
        'main.tf',
        'variables.tf',
        'outputs.tf',
        'eks_cluster.tf',
        'eks_node_groups.tf',
        'eks_fargate.tf',
        'eks_addons.tf',
        'security.tf',
        'iam.tf',
        'monitoring.tf'
      ];
      required.forEach(name => {
        expect(tfFiles).toContain(name);
      });
    });

    test('provider configuration exists', () => {
      const providerFile = tfFiles.find(f => f === 'provider.tf' || f === 'versions.tf' || f === 'main.tf');
      expect(providerFile).toBeDefined();
    });
  });

  describe('Content sanity checks', () => {
    function fileContent(name: string): string {
      return fs.readFileSync(path.join(LIB_DIR, name), 'utf8');
    }

    test('AWS provider is configured', () => {
      const content = fileContent('versions.tf');
      expect(content).toMatch(/required_providers/);
      expect(content).toMatch(/aws/);
    });

    test('EKS cluster resource is defined', () => {
      const content = fileContent('eks_cluster.tf');
      expect(content).toMatch(/resource\s+"aws_eks_cluster"/);
    });

    test('EKS node groups are defined', () => {
      const content = fileContent('eks_node_groups.tf');
      expect(content).toMatch(/aws_eks_node_group/);
    });

    test('Fargate profiles are defined', () => {
      const content = fileContent('eks_fargate.tf');
      expect(content).toMatch(/aws_eks_fargate_profile/);
    });

    test('monitoring resources reference CloudWatch and Container Insights', () => {
      const content = fileContent('monitoring.tf');
      expect(content.toLowerCase()).toContain('cloudwatch');
      expect(content).toContain('/aws/containerinsights');
    });

    test('IAM roles for ALB controller, autoscaler and secrets manager exist', () => {
      const content = fileContent('iam.tf');
      expect(content).toMatch(/alb.*controller/i);
      expect(content.toLowerCase()).toContain('autoscaler');
      expect(content.toLowerCase()).toContain('secrets');
    });

    test('security and VPC related resources are present', () => {
      const security = fileContent('security.tf');
      const main = fileContent('main.tf');
      expect(security.toLowerCase()).toContain('security_group');
      expect(main.toLowerCase()).toContain('vpc');
    });

    test('outputs reference core EKS resources', () => {
      const content = fileContent('outputs.tf');
      const requiredOutputs = [
        'cluster_name',
        'cluster_version',
        'cluster_endpoint',
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'oidc_provider_arn',
        'ecr_repository_url',
        'cloudwatch_log_group_name'
      ];
      requiredOutputs.forEach(out => {
        expect(content).toContain(`output "${out}"`);
      });
    });
  });

  describe('Syntax sanity checks', () => {
    test('all .tf files have balanced braces', () => {
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        const open = (content.match(/{/g) || []).length;
        const close = (content.match(/}/g) || []).length;
        expect(open).toBe(close);
      });
    });

    test('Terraform blocks (resource/module/variable) exist in key files', () => {
      ['main.tf', 'eks_cluster.tf', 'eks_node_groups.tf', 'monitoring.tf'].forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        expect(content).toMatch(/\b(resource|module|variable|data)\b/);
      });
    });
  });
});
