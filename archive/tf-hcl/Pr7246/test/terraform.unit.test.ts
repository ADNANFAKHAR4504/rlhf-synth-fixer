import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Structure', () => {
  const libPath = path.join(__dirname, '../lib');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Configuration Files', () => {
    test('provider.tf exists and contains required providers', () => {
      const providerPath = path.join(libPath, 'provider.tf');
      expect(fs.existsSync(providerPath)).toBe(true);

      const content = fs.readFileSync(providerPath, 'utf8');
      expect(content).toContain('provider "aws"');
      expect(content).toContain('required_providers');
    });

    test('backend.tf exists', () => {
      const backendPath = path.join(libPath, 'backend.tf');
      expect(fs.existsSync(backendPath)).toBe(true);
    });

    test('variables.tf exists with environment_suffix', () => {
      const variablesPath = path.join(libPath, 'variables.tf');
      expect(fs.existsSync(variablesPath)).toBe(true);

      const content = fs.readFileSync(variablesPath, 'utf8');
      expect(content).toContain('variable "environment_suffix"');
    });

    test('main.tf exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      expect(fs.existsSync(mainPath)).toBe(true);
    });

    test('outputs.tf exists', () => {
      const outputsPath = path.join(libPath, 'outputs.tf');
      expect(fs.existsSync(outputsPath)).toBe(true);
    });
  });

  describe('Infrastructure Resources', () => {
    test('VPC resource exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toContain('resource "aws_vpc"');
    });

    test('ALB resource exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toContain('resource "aws_lb"');
    });

    test('ECS cluster exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toContain('resource "aws_ecs_cluster"');
    });

    test('Aurora cluster exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toContain('resource "aws_rds_cluster"');
    });

    test('Lambda function exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toContain('resource "aws_lambda_function"');
    });

    test('S3 bucket for state exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toContain('resource "aws_s3_bucket"');
    });

    test('DynamoDB table for locks exists', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');
      expect(content).toContain('resource "aws_dynamodb_table"');
    });
  });

  describe('Destroyability Requirements', () => {
    test('Aurora cluster has skip_final_snapshot', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      const auroraBlock = content.match(/resource "aws_rds_cluster"[\s\S]*?(?=resource |$)/);
      if (auroraBlock) {
        expect(auroraBlock[0]).toMatch(/skip_final_snapshot\s*=\s*true/);
      }
    });

    test('ALB has deletion protection disabled', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      const albBlock = content.match(/resource "aws_lb"[\s\S]*?(?=resource |$)/);
      if (albBlock) {
        expect(albBlock[0]).toMatch(/enable_deletion_protection\s*=\s*false/);
      }
    });
  });

  describe('Security Best Practices', () => {
    test('random_password resource used for Aurora', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      expect(content).toContain('resource "random_password"');
    });

    test('Elastic IP uses domain parameter not deprecated vpc', () => {
      const mainPath = path.join(libPath, 'main.tf');
      const content = fs.readFileSync(mainPath, 'utf8');

      const eipBlock = content.match(/resource "aws_eip"[\s\S]*?(?=resource |$)/);
      if (eipBlock) {
        expect(eipBlock[0]).toContain('domain = "vpc"');
        expect(eipBlock[0]).not.toContain('vpc = true');
      }
    });
  });

  describe('Documentation', () => {
    test('README.md exists', () => {
      const readmePath = path.join(libPath, 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    test('Lambda processor.py exists', () => {
      const lambdaPath = path.join(libPath, 'lambda', 'processor.py');
      expect(fs.existsSync(lambdaPath)).toBe(true);
    });
  });
});
