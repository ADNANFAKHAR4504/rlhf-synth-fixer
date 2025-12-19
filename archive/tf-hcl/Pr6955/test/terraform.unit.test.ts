// test/terraform.unit.test.ts
// Unit tests for Payment Processing Migration Infrastructure
// Tests Terraform file structure and configuration without deployment

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Payment Processing Migration Infrastructure - Unit Tests', () => {
  describe('File Structure', () => {
    test('main.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'main.tf'));
      expect(exists).toBe(true);
    });

    test('variables.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'variables.tf'));
      expect(exists).toBe(true);
    });

    test('outputs.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'outputs.tf'));
      expect(exists).toBe(true);
    });

    test('ecs.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'ecs.tf'));
      expect(exists).toBe(true);
    });

    test('rds.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'rds.tf'));
      expect(exists).toBe(true);
    });

    test('alb.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'alb.tf'));
      expect(exists).toBe(true);
    });

    test('dms.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'dms.tf'));
      expect(exists).toBe(true);
    });

    test('iam.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'iam.tf'));
      expect(exists).toBe(true);
    });

    test('security_groups.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'security_groups.tf'));
      expect(exists).toBe(true);
    });

    test('provider.tf exists', () => {
      const exists = fs.existsSync(path.join(LIB_DIR, 'provider.tf'));
      expect(exists).toBe(true);
    });
  });

  describe('Provider Configuration', () => {
    test('AWS provider is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toMatch(/provider\s+"aws"/);
    });

    test('Terraform version is specified', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'provider.tf'), 'utf8');
      expect(content).toMatch(/required_version/);
    });
  });

  describe('Variables', () => {
    test('environment_suffix variable is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toMatch(/variable\s+"environment_suffix"/);
    });

    test('aws_region variable is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test('db_master_username variable is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'variables.tf'), 'utf8');
      expect(content).toMatch(/variable\s+"db_master_username"/);
    });
  });

  describe('VPC Resources', () => {
    test('VPC resource is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('Public subnets are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('Private subnets are declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });
  });

  describe('ECS Resources', () => {
    test('ECS cluster is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'ecs.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_ecs_cluster"\s+"main"/);
    });

    test('Blue task definition is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'ecs.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_ecs_task_definition"\s+"blue"/);
    });

    test('Green task definition is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'ecs.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_ecs_task_definition"\s+"green"/);
    });
  });

  describe('KMS Resources', () => {
    test('KMS key is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
    });

    test('KMS key rotation is enabled', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  describe('RDS Resources', () => {
    test('RDS cluster is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'rds.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_rds_cluster"\s+"main"/);
    });

    test('RDS uses Aurora PostgreSQL', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'rds.tf'), 'utf8');
      expect(content).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });
  });

  describe('ALB Resources', () => {
    test('Application Load Balancer is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'alb.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test('Blue target group is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'alb.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"blue"/);
    });

    test('Green target group is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'alb.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_lb_target_group"\s+"green"/);
    });
  });

  describe('DMS Resources', () => {
    test('DMS replication instance is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'dms.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_dms_replication_instance"\s+"main"/);
    });

    test('DMS source endpoint is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'dms.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_dms_endpoint"\s+"source"/);
    });

    test('DMS target endpoint is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'dms.tf'), 'utf8');
      expect(content).toMatch(/resource\s+"aws_dms_endpoint"\s+"target"/);
    });
  });

  describe('Outputs', () => {
    test('VPC ID output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"vpc_id"/);
    });

    test('Public subnet IDs output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"public_subnet_ids"/);
    });

    test('Private subnet IDs output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"private_subnet_ids"/);
    });

    test('ECS cluster name output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"ecs_cluster_name"/);
    });

    test('ECS cluster ARN output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"ecs_cluster_arn"/);
    });

    test('KMS key ID output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"kms_key_id"/);
    });

    test('KMS key ARN output is declared', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'outputs.tf'), 'utf8');
      expect(content).toMatch(/output\s+"kms_key_arn"/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources use environment_suffix in naming', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      const matches = mainContent.match(/var\.environment_suffix/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(5);
    });

    test('resources have proper tags', () => {
      const mainContent = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      const tags = mainContent.match(/tags\s*=\s*{/g);
      expect(tags).not.toBeNull();
      expect(tags!.length).toBeGreaterThan(3);
    });
  });

  describe('Syntax Validation', () => {
    test('main.tf has balanced braces', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'main.tf'), 'utf8');
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('ecs.tf has balanced braces', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'ecs.tf'), 'utf8');
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('alb.tf has balanced braces', () => {
      const content = fs.readFileSync(path.join(LIB_DIR, 'alb.tf'), 'utf8');
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });
});
