/**
 * Unit Tests for CI/CD Pipeline Configuration
 * Tests YAML structure, job definitions, and configuration validity
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

describe('CI/CD Pipeline Configuration - Unit Tests', () => {
  let pipelineConfig: any;
  const configPath = path.join(__dirname, '../lib/ci-cd.yml');

  beforeAll(() => {
    const yamlContent = fs.readFileSync(configPath, 'utf8');
    pipelineConfig = yaml.load(yamlContent);
  });

  describe('Pipeline Structure', () => {
    test('should have valid YAML structure', () => {
      expect(pipelineConfig).toBeDefined();
      expect(typeof pipelineConfig).toBe('object');
    });

    test('should have pipeline name', () => {
      expect(pipelineConfig.name).toBeDefined();
      expect(typeof pipelineConfig.name).toBe('string');
      expect(pipelineConfig.name.length).toBeGreaterThan(0);
    });

    test('should have workflow triggers defined', () => {
      expect(pipelineConfig.on).toBeDefined();
      expect(pipelineConfig.on).toHaveProperty('push');
    });

    test('should have environment variables', () => {
      expect(pipelineConfig.env).toBeDefined();
      expect(pipelineConfig.env.AWS_REGION).toBeDefined();
    });

    test('should have jobs defined', () => {
      expect(pipelineConfig.jobs).toBeDefined();
      expect(typeof pipelineConfig.jobs).toBe('object');
      expect(Object.keys(pipelineConfig.jobs).length).toBeGreaterThan(0);
    });
  });

  describe('Source Stage', () => {
    test('should have source job', () => {
      expect(pipelineConfig.jobs.source).toBeDefined();
    });

    test('should configure runner', () => {
      const sourceJob = pipelineConfig.jobs.source;
      expect(sourceJob['runs-on']).toBeDefined();
      expect(sourceJob['runs-on']).toBe('ubuntu-latest');
    });

    test('should have checkout step', () => {
      const sourceJob = pipelineConfig.jobs.source;
      expect(sourceJob.steps).toBeDefined();
      expect(Array.isArray(sourceJob.steps)).toBe(true);
      
      const checkoutStep = sourceJob.steps.find((step: any) => 
        step.name === 'Checkout code'
      );
      expect(checkoutStep).toBeDefined();
      expect(checkoutStep.uses).toContain('actions/checkout');
    });

    test('should configure AWS credentials', () => {
      const sourceJob = pipelineConfig.jobs.source;
      const awsStep = sourceJob.steps.find((step: any) => 
        step.name === 'Configure AWS Credentials via OIDC'
      );
      expect(awsStep).toBeDefined();
      expect(awsStep.uses).toContain('aws-actions/configure-aws-credentials');
    });
  });

  describe('Build Stage', () => {
    test('should have build job', () => {
      expect(pipelineConfig.jobs.build).toBeDefined();
    });

    test('should depend on source job', () => {
      const buildJob = pipelineConfig.jobs.build;
      expect(buildJob.needs).toBeDefined();
      expect(buildJob.needs).toBe('source');
    });

    test('should setup Docker Buildx', () => {
      const buildJob = pipelineConfig.jobs.build;
      const dockerStep = buildJob.steps.find((step: any) => 
        step.name === 'Setup Docker Buildx (ARM64 Support)'
      );
      expect(dockerStep).toBeDefined();
      expect(dockerStep.uses).toContain('docker/setup-buildx-action');
    });

    test('should login to ECR', () => {
      const buildJob = pipelineConfig.jobs.build;
      const ecrStep = buildJob.steps.find((step: any) => 
        step.name === 'Login to Amazon ECR'
      );
      expect(ecrStep).toBeDefined();
      expect(ecrStep.uses).toContain('amazon-ecr-login');
    });
  });

  describe('Security Scan Stage', () => {
    test('should have security scan job', () => {
      expect(pipelineConfig.jobs['security-scan']).toBeDefined();
    });

    test('should run Trivy scanner', () => {
      const securityJob = pipelineConfig.jobs['security-scan'];
      if (securityJob && securityJob.steps) {
        const trivyStep = securityJob.steps.find((step: any) => 
          step.name && step.name.includes('Trivy')
        );
        expect(trivyStep).toBeDefined();
      }
    });
  });

  describe('Deploy Stages', () => {
    test('should have dev deployment job', () => {
      expect(pipelineConfig.jobs['deploy-dev']).toBeDefined();
    });

    test('should have staging deployment job', () => {
      expect(pipelineConfig.jobs['deploy-staging']).toBeDefined();
    });

    test('should have prod deployment job', () => {
      expect(pipelineConfig.jobs['deploy-prod']).toBeDefined();
    });

    test('staging should depend on dev', () => {
      const stagingJob = pipelineConfig.jobs['deploy-staging'];
      expect(stagingJob.needs).toBeDefined();
      expect(stagingJob.needs).toContain('deploy-dev');
    });

    test('prod should depend on staging', () => {
      const prodJob = pipelineConfig.jobs['deploy-prod'];
      expect(prodJob.needs).toBeDefined();
      expect(prodJob.needs).toContain('deploy-staging');
    });
  });

  describe('AWS Services Configuration', () => {
    test('should configure ECS deployment', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(yamlContent).toContain('ECS');
    });

    test('should configure ECR', () => {
      expect(pipelineConfig.env.ECR_REPOSITORY).toBeDefined();
    });

    test('should use CodePipeline or similar', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(
        yamlContent.includes('CodePipeline') ||
        yamlContent.includes('CodeBuild') ||
        yamlContent.includes('pipeline')
      ).toBe(true);
    });
  });

  describe('Notifications', () => {
    test('should have notification configuration', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(
        yamlContent.includes('SNS') ||
        yamlContent.includes('EventBridge') ||
        yamlContent.includes('Slack') ||
        yamlContent.includes('notification')
      ).toBe(true);
    });
  });
});
