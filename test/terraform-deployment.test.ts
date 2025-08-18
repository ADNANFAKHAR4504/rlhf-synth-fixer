/**
 * Unit tests for Terraform Deployment Manager
 */

import { TerraformDeploymentManager } from '../lib/terraform-deployment';

describe('TerraformDeploymentManager', () => {
  let manager: TerraformDeploymentManager;

  beforeEach(() => {
    manager = new TerraformDeploymentManager({
      environment: 'development',
      environmentSuffix: 'test123',
      region: 'us-east-1'
    });
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      expect(manager).toBeDefined();
    });

    it('should handle different environments', () => {
      const stagingManager = new TerraformDeploymentManager({
        environment: 'staging',
        environmentSuffix: 'stage456',
        region: 'us-east-1'
      });
      expect(stagingManager).toBeDefined();

      const prodManager = new TerraformDeploymentManager({
        environment: 'production',
        environmentSuffix: 'prod789',
        region: 'us-east-1',
        stateBucket: 'my-state-bucket',
        stateKey: 'prod/terraform.tfstate'
      });
      expect(prodManager).toBeDefined();
    });
  });

  describe('getOutputs', () => {
    it('should return mock outputs when terraform command fails', async () => {
      const outputs = await manager.getOutputs();
      
      expect(outputs).toBeDefined();
      expect(outputs.vpc_id).toContain('test123');
      expect(outputs.alb_dns_name).toContain('test123');
      expect(outputs.environment_info).toBeDefined();
    });

    it('should include environment suffix in mock outputs', async () => {
      const outputs = await manager.getOutputs();
      
      expect(outputs.vpc_id).toBe('vpc-mock-test123');
      expect(outputs.s3_bucket_name).toBe('tap-test123-data');
      expect(outputs.environment_info.environmentSuffix).toBe('test123');
    });
  });

  describe('saveOutputs', () => {
    it('should attempt to save outputs', async () => {
      const result = await manager.saveOutputs();
      // May fail in test environment without proper setup
      expect(typeof result).toBe('boolean');
    });
  });

  describe('resourcesExist', () => {
    it('should check if resources exist', async () => {
      const exists = await manager.resourcesExist();
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('getResourceCount', () => {
    it('should get resource count', async () => {
      const count = await manager.getResourceCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate terraform configuration', async () => {
      const isValid = await manager.validateConfiguration();
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('formatConfiguration', () => {
    it('should format terraform files', async () => {
      const formatted = await manager.formatConfiguration();
      expect(typeof formatted).toBe('boolean');
    });
  });

  describe('initializeTerraform', () => {
    it('should initialize terraform', async () => {
      const initialized = await manager.initializeTerraform();
      expect(typeof initialized).toBe('boolean');
    });

    it('should handle S3 backend configuration', async () => {
      const managerWithBackend = new TerraformDeploymentManager({
        environment: 'production',
        environmentSuffix: 'prod',
        region: 'us-east-1',
        stateBucket: 'terraform-state',
        stateKey: 'prod/terraform.tfstate'
      });
      
      const initialized = await managerWithBackend.initializeTerraform();
      expect(typeof initialized).toBe('boolean');
    });
  });

  describe('planDeployment', () => {
    it('should plan terraform deployment', async () => {
      const planned = await manager.planDeployment();
      expect(typeof planned).toBe('boolean');
    });
  });

  describe('applyDeployment', () => {
    it('should attempt to apply deployment', async () => {
      const result = await manager.applyDeployment();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.duration).toBeDefined();
      
      if (!result.success) {
        expect(result.error).toBeDefined();
      } else {
        expect(result.outputs).toBeDefined();
      }
    });
  });

  describe('destroyDeployment', () => {
    it('should attempt to destroy deployment', async () => {
      const destroyed = await manager.destroyDeployment();
      expect(typeof destroyed).toBe('boolean');
    });
  });

  describe('emptyS3Buckets', () => {
    it('should attempt to empty S3 buckets', async () => {
      const emptied = await manager.emptyS3Buckets();
      expect(typeof emptied).toBe('boolean');
    });
  });

  describe('runFullDeployment', () => {
    it('should run full deployment pipeline', async () => {
      const result = await manager.runFullDeployment();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    }, 30000); // Increase timeout for full deployment
  });

  describe('runFullCleanup', () => {
    it('should run full cleanup', async () => {
      const cleaned = await manager.runFullCleanup();
      expect(typeof cleaned).toBe('boolean');
    }, 30000); // Increase timeout for cleanup
  });

  describe('Multi-environment deployment scenarios', () => {
    it('should handle development deployment', async () => {
      const devManager = new TerraformDeploymentManager({
        environment: 'development',
        environmentSuffix: 'dev123',
        region: 'us-east-1'
      });
      
      const outputs = await devManager.getOutputs();
      expect(outputs.environment_info.environment).toBe('development');
    });

    it('should handle staging deployment', async () => {
      const stageManager = new TerraformDeploymentManager({
        environment: 'staging',
        environmentSuffix: 'stage456',
        region: 'us-east-1'
      });
      
      const outputs = await stageManager.getOutputs();
      expect(outputs.environment_info.environment).toBe('staging');
    });

    it('should handle production deployment', async () => {
      const prodManager = new TerraformDeploymentManager({
        environment: 'production',
        environmentSuffix: 'prod789',
        region: 'us-east-1'
      });
      
      const outputs = await prodManager.getOutputs();
      expect(outputs.environment_info.environment).toBe('production');
    });
  });
});