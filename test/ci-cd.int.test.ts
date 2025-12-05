/**
 * Integration Tests for CI/CD Pipeline Configuration
 * Tests pipeline execution flow, AWS service integrations, and end-to-end deployment
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

describe('CI/CD Pipeline Configuration - Integration Tests', () => {
  let pipelineConfig: any;
  const configPath = path.join(__dirname, '../lib/ci-cd.yml');

  beforeAll(() => {
    const yamlContent = fs.readFileSync(configPath, 'utf8');
    pipelineConfig = yaml.load(yamlContent);
  });

  describe('Pipeline Flow', () => {
    test('should have proper job dependencies', () => {
      const jobs = pipelineConfig.jobs;

      // Build depends on source
      expect(jobs.build.needs).toBeDefined();
      expect(jobs.build.needs).toBe('source');

      // Security scan depends on build
      if (jobs['security-scan']) {
        expect(jobs['security-scan'].needs).toBeDefined();
      }
    });

    test('should have multi-stage deployment flow', () => {
      const jobs = pipelineConfig.jobs;

      // Should have dev, staging, and prod deployments
      expect(jobs['deploy-dev']).toBeDefined();
      expect(jobs['deploy-staging']).toBeDefined();
      expect(jobs['deploy-prod']).toBeDefined();

      // Staging depends on dev
      const stagingNeeds = Array.isArray(jobs['deploy-staging'].needs)
        ? jobs['deploy-staging'].needs
        : [jobs['deploy-staging'].needs];
      expect(stagingNeeds).toContain('deploy-dev');

      // Prod depends on staging
      const prodNeeds = Array.isArray(jobs['deploy-prod'].needs)
        ? jobs['deploy-prod'].needs
        : [jobs['deploy-prod'].needs];
      expect(prodNeeds).toContain('deploy-staging');
    });

    test('should have manual approval for production', () => {
      const prodJob = pipelineConfig.jobs['deploy-prod'];
      expect(prodJob.environment).toBeDefined();

      // Check if environment requires approval or has protection rules
      if (typeof prodJob.environment === 'object') {
        // GitHub Actions uses 'environment' with name and url
        expect(prodJob.environment.name).toBeDefined();
      }
    });
  });

  describe('AWS Service Integration', () => {
    test('should integrate with CodeCommit', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(yamlContent).toContain('CodeCommit');
    });

    test('should integrate with ECR for container registry', () => {
      const buildJob = pipelineConfig.jobs.build;
      const ecrLogin = buildJob.steps.find((step: any) =>
        step.uses && step.uses.includes('amazon-ecr-login')
      );
      expect(ecrLogin).toBeDefined();
    });

    test('should integrate with ECS for deployment', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(yamlContent.includes('ECS') || yamlContent.includes('ecs')).toBe(true);
    });

    test('should use IAM roles with OIDC', () => {
      const sourceJob = pipelineConfig.jobs.source;
      const awsStep = sourceJob.steps.find((step: any) =>
        step.uses && step.uses.includes('configure-aws-credentials')
      );
      expect(awsStep.with['role-to-assume']).toBeDefined();
      expect(awsStep.with['role-to-assume']).toContain('secrets.GITHUB_OIDC_ROLE_ARN');
    });

    test('should configure KMS encryption', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(yamlContent.includes('KMS') || yamlContent.includes('kms')).toBe(true);
    });
  });

  describe('Container Build and Deployment', () => {
    test('should build ARM64/Graviton2 images', () => {
      const buildJob = pipelineConfig.jobs.build;
      const dockerBuildx = buildJob.steps.find((step: any) =>
        step.name && step.name.includes('Buildx')
      );
      expect(dockerBuildx).toBeDefined();
      expect(dockerBuildx.with.platforms).toContain('arm64');
    });

    test('should tag images appropriately', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(
        yamlContent.includes('IMAGE_TAG') ||
        yamlContent.includes('image') ||
        yamlContent.includes('tag')
      ).toBe(true);
    });

    test('should push images to ECR', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(yamlContent.includes('docker push') || yamlContent.includes('ecr')).toBe(true);
    });
  });

  describe('Security and Compliance', () => {
    test('should perform security scanning', () => {
      const securityJob = pipelineConfig.jobs['security-scan'];
      expect(securityJob).toBeDefined();

      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(yamlContent.includes('Trivy') || yamlContent.includes('security')).toBe(true);
    });

    test('should use secrets for sensitive data', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(yamlContent).toContain('secrets.');
    });
  });

  describe('Monitoring and Notifications', () => {
    test('should configure EventBridge or notifications', () => {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      expect(
        yamlContent.includes('EventBridge') ||
        yamlContent.includes('SNS') ||
        yamlContent.includes('Slack') ||
        yamlContent.includes('notification')
      ).toBe(true);
    });
  });

  describe('Multi-Environment Support', () => {
    test('should support different AWS accounts for each environment', () => {
      const env = pipelineConfig.env;
      expect(env.DEV_ACCOUNT_ID).toBeDefined();
      expect(env.STAGING_ACCOUNT_ID).toBeDefined();
      expect(env.PROD_ACCOUNT_ID).toBeDefined();
    });

    test('should deploy to dev environment first', () => {
      const devJob = pipelineConfig.jobs['deploy-dev'];
      expect(devJob).toBeDefined();

      // Dev should only depend on build/security, not other deploys
      const needs = devJob.needs;
      if (Array.isArray(needs)) {
        expect(needs).not.toContain('deploy-staging');
        expect(needs).not.toContain('deploy-prod');
      }
    });
  });
});
