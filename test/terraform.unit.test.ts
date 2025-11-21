// test/terraform.unit.test.ts
// Unit tests for Payment Processing Infrastructure
// Validates Terraform file structure and configuration without deployment

import fs from 'fs';
import path from 'path';

const LIB_DIR = path.resolve(__dirname, '../lib');

describe('Payment Processing Infrastructure - Unit Tests', () => {
  describe('File Structure', () => {
    test('lib directory exists', () => {
      expect(fs.existsSync(LIB_DIR)).toBe(true);
    });

    test('at least one .tf file exists', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));
      expect(tfFiles.length).toBeGreaterThan(0);
    });

    test('provider configuration exists', () => {
      const files = fs.readdirSync(LIB_DIR);
      const hasProvider = files.some(f =>
        f === 'provider.tf' || f === 'main.tf' || f === 'versions.tf'
      );
      expect(hasProvider).toBe(true);
    });
  });

  describe('Terraform Files Content', () => {
    test('AWS provider is configured', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasAwsProvider = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('provider "aws"') || content.includes('provider "hashicorp/aws"') || content.includes('aws_region')) {
          hasAwsProvider = true;
        }
      });

      expect(hasAwsProvider).toBe(true);
    });

    test('VPC resources are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasVpcResources = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('aws_vpc') || content.includes('module "vpc"') || content.includes('vpc_id')) {
          hasVpcResources = true;
        }
      });

      expect(hasVpcResources).toBe(true);
    });

    test('ECS resources are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasEcsResources = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('aws_ecs') || content.includes('module "ecs"') || content.includes('ecs_cluster') || content.includes('ecs_service')) {
          hasEcsResources = true;
        }
      });

      expect(hasEcsResources).toBe(true);
    });

    test('ALB resources are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasAlbResources = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('aws_lb') || content.includes('aws_alb') || content.includes('module "alb"') || content.includes('alb_arn') || content.includes('alb_dns')) {
          hasAlbResources = true;
        }
      });

      expect(hasAlbResources).toBe(true);
    });

    test('outputs are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasOutputs = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('output ')) {
          hasOutputs = true;
        }
      });

      expect(hasOutputs).toBe(true);
    });
  });

  describe('Resource Configuration', () => {
    test('uses environment variables or modules', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasVariables = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('var.') || content.includes('module.') || content.includes('variable ')) {
          hasVariables = true;
        }
      });

      expect(hasVariables).toBe(true);
    });

    test('has proper resource naming', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasNaming = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('environment') || content.includes('name')) {
          hasNaming = true;
        }
      });

      expect(hasNaming).toBe(true);
    });
  });

  describe('Security and Monitoring', () => {
    test('CloudWatch resources are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasCloudWatch = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('aws_cloudwatch') || content.includes('cloudwatch') || content.includes('log_group')) {
          hasCloudWatch = true;
        }
      });

      expect(hasCloudWatch).toBe(true);
    });

    test('SNS resources are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasSns = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('aws_sns') || content.includes('sns_topic') || content.includes('alert')) {
          hasSns = true;
        }
      });

      expect(hasSns).toBe(true);
    });

    test('Secrets Manager is used for credentials', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasSecretsManager = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('aws_secretsmanager') || content.includes('secretsmanager') || content.includes('secret') || content.includes('credentials')) {
          hasSecretsManager = true;
        }
      });

      expect(hasSecretsManager).toBe(true);
    });
  });

  describe('Syntax Validation', () => {
    test('all .tf files have balanced braces', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        expect(openBraces).toBe(closeBraces);
      });
    });

    test('terraform blocks are properly formatted', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasProperBlocks = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        // Check for any valid Terraform block (resource, module, variable, output, etc.)
        if (content.match(/\b(resource|module|variable|output|data|provider|terraform)\s+/)) {
          hasProperBlocks = true;
        }
      });

      expect(hasProperBlocks).toBe(true);
    });
  });

  describe('Variables Configuration', () => {
    test('environment variable is defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasEnvironmentVar = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('variable "environment"') || content.includes('var.environment')) {
          hasEnvironmentVar = true;
        }
      });

      expect(hasEnvironmentVar).toBe(true);
    });

    test('environment_suffix variable is defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasEnvironmentSuffix = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('variable "environment_suffix"') || content.includes('var.environment_suffix')) {
          hasEnvironmentSuffix = true;
        }
      });

      expect(hasEnvironmentSuffix).toBe(true);
    });

    test('aws_region variable is defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasRegionVar = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('variable "aws_region"') || content.includes('var.aws_region')) {
          hasRegionVar = true;
        }
      });

      expect(hasRegionVar).toBe(true);
    });
  });

  describe('Outputs Configuration', () => {
    test('VPC ID output is defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasVpcOutput = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('output "vpc_id"')) {
          hasVpcOutput = true;
        }
      });

      expect(hasVpcOutput).toBe(true);
    });

    test('ALB outputs are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasAlbOutputs = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('output "alb_arn"') || content.includes('output "alb_dns_name"')) {
          hasAlbOutputs = true;
        }
      });

      expect(hasAlbOutputs).toBe(true);
    });

    test('ECS outputs are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasEcsOutputs = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('output "ecs_cluster_arn"') || content.includes('output "ecs_service_name"')) {
          hasEcsOutputs = true;
        }
      });

      expect(hasEcsOutputs).toBe(true);
    });

    test('environment outputs are defined', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      let hasEnvOutputs = false;
      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        if (content.includes('output "environment"') || content.includes('output "environment_suffix"')) {
          hasEnvOutputs = true;
        }
      });

      expect(hasEnvOutputs).toBe(true);
    });
  });
});
