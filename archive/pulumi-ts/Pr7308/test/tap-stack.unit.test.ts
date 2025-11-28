/**
 * Unit tests for TapStack utilities and validation
 * Tests validation functions and manifest generation
 */
import { EnvironmentConfig } from '../lib/tap-stack';
import {
  validateEnvironmentConfig,
  validateRegion,
} from '../lib/utils/validation';
import {
  generateManifest,
  compareManifests,
  ManifestInput,
} from '../lib/utils/manifest';

// Helper to create valid dev environment config
function createDevConfig(): EnvironmentConfig {
  return {
    environment: 'dev',
    region: 'us-east-2',
    lambda: { memory: 1024, cpu: 0.5 },
    database: { instanceClass: 'db.t4g.medium' },
    monitoring: { errorThreshold: 10, latencyThreshold: 5000 },
  };
}

// Helper to create valid staging environment config
function createStagingConfig(): EnvironmentConfig {
  return {
    environment: 'staging',
    region: 'us-west-2',
    lambda: { memory: 2048, cpu: 1 },
    database: { instanceClass: 'db.r6g.large' },
    monitoring: { errorThreshold: 5, latencyThreshold: 3000 },
  };
}

// Helper to create valid prod environment config
function createProdConfig(): EnvironmentConfig {
  return {
    environment: 'prod',
    region: 'us-east-1',
    lambda: { memory: 4096, cpu: 2 },
    database: { instanceClass: 'db.r6g.large' },
    monitoring: { errorThreshold: 3, latencyThreshold: 2000 },
  };
}

// Helper to create ManifestInput
function createManifestInput(config: EnvironmentConfig): ManifestInput {
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
    dockerImageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest',
  };
}

describe('Validation Utilities', () => {
  describe('Environment Configuration Validation', () => {
    it('should validate correct dev environment config', () => {
      const config = createDevConfig();
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should validate correct staging environment config', () => {
      const config = createStagingConfig();
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should validate correct prod environment config', () => {
      const config = createProdConfig();
      expect(() => validateEnvironmentConfig(config)).not.toThrow();
    });

    it('should reject invalid Lambda memory value', () => {
      const config: any = {
        ...createDevConfig(),
        lambda: { memory: 512, cpu: 0.5 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Invalid Lambda memory/
      );
    });

    it('should reject invalid Lambda CPU value', () => {
      const config: any = {
        ...createDevConfig(),
        lambda: { memory: 1024, cpu: 0.25 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Invalid Lambda CPU/
      );
    });

    it('should reject invalid database instance class', () => {
      const config: any = {
        ...createDevConfig(),
        database: { instanceClass: 'db.invalid' },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Invalid database instance class/
      );
    });

    it('should reject invalid Lambda memory for dev', () => {
      const config: any = {
        ...createDevConfig(),
        lambda: { memory: 2048, cpu: 0.5 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Dev environment must use 1024MB/
      );
    });

    it('should reject invalid Lambda CPU for dev', () => {
      const config: any = {
        ...createDevConfig(),
        lambda: { memory: 1024, cpu: 1 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Dev environment must use 0.5 vCPU/
      );
    });

    it('should reject invalid database instance class for dev', () => {
      const config: any = {
        ...createDevConfig(),
        database: { instanceClass: 'db.r6g.large' },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Dev environment must use db.t4g.medium/
      );
    });

    it('should reject invalid Lambda memory for staging', () => {
      const config: any = {
        ...createStagingConfig(),
        lambda: { memory: 1024, cpu: 1 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Staging environment must use 2048MB/
      );
    });

    it('should reject invalid Lambda CPU for staging', () => {
      const config: any = {
        ...createStagingConfig(),
        lambda: { memory: 2048, cpu: 0.5 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Staging environment must use 1 vCPU/
      );
    });

    it('should reject invalid database instance class for staging', () => {
      const config: any = {
        ...createStagingConfig(),
        database: { instanceClass: 'db.t4g.medium' },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Staging environment must use db.r6g.large/
      );
    });

    it('should reject invalid Lambda memory for prod', () => {
      const config: any = {
        ...createProdConfig(),
        lambda: { memory: 1024, cpu: 2 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Prod environment must use 4096MB/
      );
    });

    it('should reject invalid Lambda CPU for prod', () => {
      const config: any = {
        ...createProdConfig(),
        lambda: { memory: 4096, cpu: 0.5 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Prod environment must use 2 vCPU/
      );
    });

    it('should reject invalid database instance class for prod', () => {
      const config: any = {
        ...createProdConfig(),
        database: { instanceClass: 'db.t4g.medium' },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Prod environment must use db.r6g.large/
      );
    });

    it('should reject negative error threshold', () => {
      const config: any = {
        ...createDevConfig(),
        monitoring: { errorThreshold: -1, latencyThreshold: 5000 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Error threshold must be between/
      );
    });

    it('should reject error threshold over 1000', () => {
      const config: any = {
        ...createDevConfig(),
        monitoring: { errorThreshold: 1001, latencyThreshold: 5000 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Error threshold must be between/
      );
    });

    it('should reject latency threshold too low', () => {
      const config: any = {
        ...createDevConfig(),
        monitoring: { errorThreshold: 10, latencyThreshold: 50 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Latency threshold must be between/
      );
    });

    it('should reject latency threshold too high', () => {
      const config: any = {
        ...createDevConfig(),
        monitoring: { errorThreshold: 10, latencyThreshold: 35000 },
      };
      expect(() => validateEnvironmentConfig(config)).toThrow(
        /Latency threshold must be between/
      );
    });
  });

  describe('Region Validation', () => {
    it('should validate correct dev region', () => {
      expect(() => validateRegion('us-east-2', 'dev')).not.toThrow();
    });

    it('should validate correct staging region', () => {
      expect(() => validateRegion('us-west-2', 'staging')).not.toThrow();
    });

    it('should validate correct prod region', () => {
      expect(() => validateRegion('us-east-1', 'prod')).not.toThrow();
    });

    it('should reject invalid region for dev', () => {
      expect(() => validateRegion('us-west-2', 'dev')).toThrow(/Invalid region/);
    });

    it('should reject invalid region for staging', () => {
      expect(() => validateRegion('us-east-1', 'staging')).toThrow(
        /Invalid region/
      );
    });

    it('should reject invalid region for prod', () => {
      expect(() => validateRegion('us-east-2', 'prod')).toThrow(/Invalid region/);
    });
  });
});

describe('Manifest Generation', () => {
  it('should generate manifest with correct structure', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest).toHaveProperty('environment', 'dev');
    expect(manifest).toHaveProperty('timestamp');
    expect(manifest).toHaveProperty('configHash');
    expect(manifest).toHaveProperty('configuration');
  });

  it('should include database configuration in manifest', () => {
    const input = createManifestInput(createProdConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.database).toEqual({
      instanceClass: 'db.r6g.large',
      engineVersion: '15.8',
    });
  });

  it('should include Lambda configuration in manifest', () => {
    const input = createManifestInput(createStagingConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.lambda).toEqual({
      memory: 2048,
      cpu: 1,
    });
  });

  it('should include secrets configuration in manifest', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.secrets).toEqual({
      rotationDays: 30,
    });
  });

  it('should include backup configuration in manifest', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.backup).toEqual({
      retentionDays: 7,
    });
  });

  it('should include logging configuration in manifest', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.logging).toEqual({
      retentionDays: 30,
    });
  });

  it('should include encryption configuration in manifest', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.encryption).toEqual({
      kmsEnabled: true,
    });
  });

  it('should include docker configuration in manifest', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configuration.docker).toEqual({
      imageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest',
    });
  });

  it('should generate SHA-256 hash for config', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.configHash).toBeDefined();
    expect(manifest.configHash.length).toBe(64);
  });

  it('should generate different hashes for different configs', () => {
    const devManifest = generateManifest(createManifestInput(createDevConfig()));
    const prodManifest = generateManifest(
      createManifestInput(createProdConfig())
    );

    expect(devManifest.configHash).not.toEqual(prodManifest.configHash);
  });

  it('should generate consistent hashes for same config', () => {
    const input1 = createManifestInput(createDevConfig());
    const input2 = createManifestInput(createDevConfig());
    const manifest1 = generateManifest(input1);
    const manifest2 = generateManifest(input2);

    expect(manifest1.configHash).toEqual(manifest2.configHash);
  });

  it('should generate timestamp in ISO format', () => {
    const input = createManifestInput(createDevConfig());
    const manifest = generateManifest(input);

    expect(manifest.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('Manifest Comparison', () => {
  it('should detect identical configurations', () => {
    const input1 = createManifestInput(createDevConfig());
    const input2 = createManifestInput(createDevConfig());
    const manifest1 = generateManifest(input1);
    const manifest2 = generateManifest(input2);

    const result = compareManifests(manifest1, manifest2);
    expect(result.identical).toBe(true);
    expect(result.differences).toHaveLength(0);
  });

  it('should detect Lambda memory differences', () => {
    const devInput = createManifestInput(createDevConfig());
    const prodInput = createManifestInput(createProdConfig());
    const devManifest = generateManifest(devInput);
    const prodManifest = generateManifest(prodInput);

    const result = compareManifests(devManifest, prodManifest);
    expect(result.differences.some((d) => d.includes('Lambda memory'))).toBe(
      true
    );
  });

  it('should detect Lambda CPU differences', () => {
    const devInput = createManifestInput(createDevConfig());
    const stagingInput = createManifestInput(createStagingConfig());
    const devManifest = generateManifest(devInput);
    const stagingManifest = generateManifest(stagingInput);

    const result = compareManifests(devManifest, stagingManifest);
    expect(result.differences.some((d) => d.includes('Lambda CPU'))).toBe(true);
  });

  it('should detect database instance differences', () => {
    const devInput = createManifestInput(createDevConfig());
    const prodInput = createManifestInput(createProdConfig());
    const devManifest = generateManifest(devInput);
    const prodManifest = generateManifest(prodInput);

    const result = compareManifests(devManifest, prodManifest);
    expect(result.differences.some((d) => d.includes('Database instance'))).toBe(
      true
    );
  });

  it('should return identical=true for allowed differences only', () => {
    const devInput = createManifestInput(createDevConfig());
    const prodInput = createManifestInput(createProdConfig());
    const devManifest = generateManifest(devInput);
    const prodManifest = generateManifest(prodInput);

    const result = compareManifests(devManifest, prodManifest);
    expect(result.identical).toBe(true);
    expect(result.differences.length).toBeGreaterThan(0);
  });

  it('should detect database engine version differences', () => {
    const input1 = createManifestInput(createDevConfig());
    const input2 = {
      ...createManifestInput(createDevConfig()),
      databaseEngineVersion: '15.5',
    };
    const manifest1 = generateManifest(input1);
    const manifest2 = generateManifest(input2);

    const result = compareManifests(manifest1, manifest2);
    expect(
      result.differences.some((d) => d.includes('Database engine version'))
    ).toBe(true);
    expect(result.identical).toBe(false);
  });
});

describe('Environment Config Helpers', () => {
  it('should create valid dev config', () => {
    const config = createDevConfig();
    expect(config.environment).toBe('dev');
    expect(config.region).toBe('us-east-2');
    expect(config.lambda.memory).toBe(1024);
    expect(config.lambda.cpu).toBe(0.5);
    expect(config.database.instanceClass).toBe('db.t4g.medium');
  });

  it('should create valid staging config', () => {
    const config = createStagingConfig();
    expect(config.environment).toBe('staging');
    expect(config.region).toBe('us-west-2');
    expect(config.lambda.memory).toBe(2048);
    expect(config.lambda.cpu).toBe(1);
    expect(config.database.instanceClass).toBe('db.r6g.large');
  });

  it('should create valid prod config', () => {
    const config = createProdConfig();
    expect(config.environment).toBe('prod');
    expect(config.region).toBe('us-east-1');
    expect(config.lambda.memory).toBe(4096);
    expect(config.lambda.cpu).toBe(2);
    expect(config.database.instanceClass).toBe('db.r6g.large');
  });

  it('should have stricter monitoring thresholds for prod', () => {
    const devConfig = createDevConfig();
    const prodConfig = createProdConfig();

    expect(prodConfig.monitoring.errorThreshold).toBeLessThan(
      devConfig.monitoring.errorThreshold
    );
    expect(prodConfig.monitoring.latencyThreshold).toBeLessThan(
      devConfig.monitoring.latencyThreshold
    );
  });
});
