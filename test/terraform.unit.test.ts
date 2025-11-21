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
        if (content.includes('provider "aws"') || content.includes('provider "hashicorp/aws"')) {
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
        if (content.includes('aws_vpc') || content.includes('module "vpc"')) {
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
        if (content.includes('aws_ecs_cluster') || content.includes('aws_ecs_service')) {
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
        if (content.includes('aws_lb') || content.includes('aws_alb')) {
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
        if (content.includes('aws_cloudwatch') || content.includes('cloudwatch')) {
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
        if (content.includes('aws_sns') || content.includes('sns_topic')) {
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
        if (content.includes('aws_secretsmanager') || content.includes('secretsmanager')) {
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

    test('no syntax errors in resource blocks', () => {
      const files = fs.readdirSync(LIB_DIR);
      const tfFiles = files.filter(f => f.endsWith('.tf'));

      tfFiles.forEach(file => {
        const content = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
        // Check for basic resource syntax
        if (content.includes('resource ')) {
          expect(content).toMatch(/resource\s+"[a-z_]+"\s+"[a-z_]+"\s*{/);
        }
      });
    });
  });
});
