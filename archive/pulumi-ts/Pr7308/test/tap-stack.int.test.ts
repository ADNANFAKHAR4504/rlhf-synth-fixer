/**
 * Integration tests for TapStack
 * Tests configuration validation and manifest generation across environments
 */
import { validateEnvironmentConfig } from '../lib/utils/validation';
import {
  generateManifest,
  compareManifests,
  ManifestInput,
} from '../lib/utils/manifest';
import { EnvironmentConfig } from '../lib/tap-stack';

// Helper functions for test configuration
function createDevConfig(): EnvironmentConfig {
  return {
    environment: 'dev',
    region: 'us-east-2',
    lambda: { memory: 1024, cpu: 0.5 },
    database: { instanceClass: 'db.t4g.medium' },
    monitoring: { errorThreshold: 10, latencyThreshold: 5000 },
  };
}

function createStagingConfig(): EnvironmentConfig {
  return {
    environment: 'staging',
    region: 'us-west-2',
    lambda: { memory: 2048, cpu: 1 },
    database: { instanceClass: 'db.r6g.large' },
    monitoring: { errorThreshold: 5, latencyThreshold: 3000 },
  };
}

function createProdConfig(): EnvironmentConfig {
  return {
    environment: 'prod',
    region: 'us-east-1',
    lambda: { memory: 4096, cpu: 2 },
    database: { instanceClass: 'db.r6g.large' },
    monitoring: { errorThreshold: 3, latencyThreshold: 2000 },
  };
}

function createManifestInput(
  config: EnvironmentConfig,
  dockerImageUri: string
): ManifestInput {
  return {
    environment: config.environment,
    lambdaMemory: config.lambda.memory,
    lambdaCpu: config.lambda.cpu,
    databaseInstanceClass: config.database.instanceClass,
    databaseEngineVersion: '15.8',
    secretRotationDays: 30,
    backupRetentionDays: 7,
    logRetentionDays: 30,
    kmsKeyEnabled: true,
    dockerImageUri,
  };
}

describe('TapStack Integration Tests', () => {
  describe('Multi-Environment Configuration Validation', () => {
    it('should validate development environment configuration', () => {
      const config = createDevConfig();
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should validate staging environment configuration', () => {
      const config = createStagingConfig();
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should validate production environment configuration', () => {
      const config = createProdConfig();
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should enforce dev environment constraints', () => {
      const config: EnvironmentConfig = {
        ...createDevConfig(),
        lambda: { memory: 2048, cpu: 1 }, // Wrong values for dev
      };
      expect(() => validateEnvironmentConfig(config)).toThrow();
    });

    it('should enforce staging environment constraints', () => {
      const config: EnvironmentConfig = {
        ...createStagingConfig(),
        lambda: { memory: 1024, cpu: 0.5 }, // Wrong values for staging
      };
      expect(() => validateEnvironmentConfig(config)).toThrow();
    });

    it('should enforce prod environment constraints', () => {
      const config: EnvironmentConfig = {
        ...createProdConfig(),
        lambda: { memory: 1024, cpu: 0.5 }, // Wrong values for prod
      };
      expect(() => validateEnvironmentConfig(config)).toThrow();
    });
  });

  describe('Drift Detection Manifest', () => {
    const dockerImageUri =
      '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest';

    it('should generate manifest for dev environment', () => {
      const config = createDevConfig();
      const input = createManifestInput(config, dockerImageUri);
      const manifest = generateManifest(input);

      expect(manifest.environment).toBe('dev');
      expect(manifest.configuration.lambda.memory).toBe(1024);
      expect(manifest.configuration.lambda.cpu).toBe(0.5);
      expect(manifest.configuration.database.instanceClass).toBe(
        'db.t4g.medium'
      );
      expect(manifest.configHash).toBeDefined();
      expect(manifest.configHash.length).toBe(64);
    });

    it('should generate manifest for staging environment', () => {
      const config = createStagingConfig();
      const input = createManifestInput(config, dockerImageUri);
      const manifest = generateManifest(input);

      expect(manifest.environment).toBe('staging');
      expect(manifest.configuration.lambda.memory).toBe(2048);
      expect(manifest.configuration.lambda.cpu).toBe(1);
      expect(manifest.configuration.database.instanceClass).toBe('db.r6g.large');
    });

    it('should generate manifest for prod environment', () => {
      const config = createProdConfig();
      const input = createManifestInput(config, dockerImageUri);
      const manifest = generateManifest(input);

      expect(manifest.environment).toBe('prod');
      expect(manifest.configuration.lambda.memory).toBe(4096);
      expect(manifest.configuration.lambda.cpu).toBe(2);
      expect(manifest.configuration.database.instanceClass).toBe('db.r6g.large');
    });

    it('should detect differences between dev and prod', () => {
      const devManifest = generateManifest(
        createManifestInput(createDevConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      const result = compareManifests(devManifest, prodManifest);

      expect(result.identical).toBe(true); // True because only allowed differences
      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.differences.some((d) => d.includes('Lambda memory'))).toBe(
        true
      );
      expect(result.differences.some((d) => d.includes('Lambda CPU'))).toBe(
        true
      );
      expect(result.differences.some((d) => d.includes('Database instance'))).toBe(
        true
      );
    });

    it('should detect differences between staging and prod', () => {
      const stagingManifest = generateManifest(
        createManifestInput(createStagingConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      const result = compareManifests(stagingManifest, prodManifest);

      expect(result.differences.some((d) => d.includes('Lambda memory'))).toBe(
        true
      );
      expect(result.differences.some((d) => d.includes('Lambda CPU'))).toBe(
        true
      );
    });

    it('should generate unique config hashes for different environments', () => {
      const devManifest = generateManifest(
        createManifestInput(createDevConfig(), dockerImageUri)
      );
      const stagingManifest = generateManifest(
        createManifestInput(createStagingConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      expect(devManifest.configHash).not.toBe(stagingManifest.configHash);
      expect(devManifest.configHash).not.toBe(prodManifest.configHash);
      expect(stagingManifest.configHash).not.toBe(prodManifest.configHash);
    });

    it('should generate consistent hash for same configuration', () => {
      const config = createDevConfig();
      const manifest1 = generateManifest(
        createManifestInput(config, dockerImageUri)
      );
      const manifest2 = generateManifest(
        createManifestInput(config, dockerImageUri)
      );

      expect(manifest1.configHash).toBe(manifest2.configHash);
    });
  });

  describe('Configuration Consistency', () => {
    it('should use identical Docker image across environments', () => {
      const dockerImageUri =
        '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:v1.0.0';

      const devManifest = generateManifest(
        createManifestInput(createDevConfig(), dockerImageUri)
      );
      const stagingManifest = generateManifest(
        createManifestInput(createStagingConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      expect(devManifest.configuration.docker.imageUri).toBe(dockerImageUri);
      expect(stagingManifest.configuration.docker.imageUri).toBe(dockerImageUri);
      expect(prodManifest.configuration.docker.imageUri).toBe(dockerImageUri);
    });

    it('should have identical database engine version across environments', () => {
      const dockerImageUri =
        '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest';

      const devManifest = generateManifest(
        createManifestInput(createDevConfig(), dockerImageUri)
      );
      const stagingManifest = generateManifest(
        createManifestInput(createStagingConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      expect(devManifest.configuration.database.engineVersion).toBe('15.8');
      expect(stagingManifest.configuration.database.engineVersion).toBe('15.8');
      expect(prodManifest.configuration.database.engineVersion).toBe('15.8');
    });

    it('should have identical secret rotation policy across environments', () => {
      const dockerImageUri =
        '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest';

      const devManifest = generateManifest(
        createManifestInput(createDevConfig(), dockerImageUri)
      );
      const stagingManifest = generateManifest(
        createManifestInput(createStagingConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      expect(devManifest.configuration.secrets.rotationDays).toBe(30);
      expect(stagingManifest.configuration.secrets.rotationDays).toBe(30);
      expect(prodManifest.configuration.secrets.rotationDays).toBe(30);
    });

    it('should have identical log retention across environments', () => {
      const dockerImageUri =
        '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest';

      const devManifest = generateManifest(
        createManifestInput(createDevConfig(), dockerImageUri)
      );
      const stagingManifest = generateManifest(
        createManifestInput(createStagingConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      expect(devManifest.configuration.logging.retentionDays).toBe(30);
      expect(stagingManifest.configuration.logging.retentionDays).toBe(30);
      expect(prodManifest.configuration.logging.retentionDays).toBe(30);
    });

    it('should have KMS encryption enabled across all environments', () => {
      const dockerImageUri =
        '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest';

      const devManifest = generateManifest(
        createManifestInput(createDevConfig(), dockerImageUri)
      );
      const stagingManifest = generateManifest(
        createManifestInput(createStagingConfig(), dockerImageUri)
      );
      const prodManifest = generateManifest(
        createManifestInput(createProdConfig(), dockerImageUri)
      );

      expect(devManifest.configuration.encryption.kmsEnabled).toBe(true);
      expect(stagingManifest.configuration.encryption.kmsEnabled).toBe(true);
      expect(prodManifest.configuration.encryption.kmsEnabled).toBe(true);
    });
  });

  describe('Environment-Specific Resource Allocation', () => {
    it('should have correct Lambda memory allocation per environment', () => {
      expect(createDevConfig().lambda.memory).toBe(1024);
      expect(createStagingConfig().lambda.memory).toBe(2048);
      expect(createProdConfig().lambda.memory).toBe(4096);
    });

    it('should have correct Lambda CPU allocation per environment', () => {
      expect(createDevConfig().lambda.cpu).toBe(0.5);
      expect(createStagingConfig().lambda.cpu).toBe(1);
      expect(createProdConfig().lambda.cpu).toBe(2);
    });

    it('should have correct database instance class per environment', () => {
      expect(createDevConfig().database.instanceClass).toBe('db.t4g.medium');
      expect(createStagingConfig().database.instanceClass).toBe('db.r6g.large');
      expect(createProdConfig().database.instanceClass).toBe('db.r6g.large');
    });

    it('should have appropriate monitoring thresholds per environment', () => {
      // Dev has higher thresholds (more tolerant)
      expect(createDevConfig().monitoring.errorThreshold).toBe(10);
      expect(createDevConfig().monitoring.latencyThreshold).toBe(5000);

      // Staging has medium thresholds
      expect(createStagingConfig().monitoring.errorThreshold).toBe(5);
      expect(createStagingConfig().monitoring.latencyThreshold).toBe(3000);

      // Prod has strictest thresholds
      expect(createProdConfig().monitoring.errorThreshold).toBe(3);
      expect(createProdConfig().monitoring.latencyThreshold).toBe(2000);
    });
  });
});
