/**
 * manifest.ts
 *
 * Configuration manifest generation for drift detection
 */
import * as crypto from 'crypto';

export interface ConfigManifest {
  environment: string;
  timestamp: string;
  configuration: {
    lambda: {
      memory: number;
      cpu: number;
    };
    database: {
      instanceClass: string;
      engineVersion: string;
    };
    secrets: {
      rotationDays: number;
    };
    backup: {
      retentionDays: number;
    };
    logging: {
      retentionDays: number;
    };
    encryption: {
      kmsEnabled: boolean;
    };
    docker: {
      imageUri: string;
    };
  };
  configHash: string;
}

export interface ManifestInput {
  environment: string;
  lambdaMemory: number;
  lambdaCpu: number;
  databaseInstanceClass: string;
  databaseEngineVersion: string;
  secretRotationDays: number;
  backupRetentionDays: number;
  logRetentionDays: number;
  kmsKeyEnabled: boolean;
  dockerImageUri: string;
}

export function generateManifest(input: ManifestInput): ConfigManifest {
  const config = {
    lambda: {
      memory: input.lambdaMemory,
      cpu: input.lambdaCpu,
    },
    database: {
      instanceClass: input.databaseInstanceClass,
      engineVersion: input.databaseEngineVersion,
    },
    secrets: {
      rotationDays: input.secretRotationDays,
    },
    backup: {
      retentionDays: input.backupRetentionDays,
    },
    logging: {
      retentionDays: input.logRetentionDays,
    },
    encryption: {
      kmsEnabled: input.kmsKeyEnabled,
    },
    docker: {
      imageUri: input.dockerImageUri,
    },
  };

  const configString = JSON.stringify(config, null, 2);
  const configHash = crypto
    .createHash('sha256')
    .update(configString)
    .digest('hex');

  return {
    environment: input.environment,
    timestamp: new Date().toISOString(),
    configuration: config,
    configHash,
  };
}

export function compareManifests(
  manifest1: ConfigManifest,
  manifest2: ConfigManifest
): { identical: boolean; differences: string[] } {
  const differences: string[] = [];

  // Compare Lambda configuration
  if (
    manifest1.configuration.lambda.memory !==
    manifest2.configuration.lambda.memory
  ) {
    differences.push(
      `Lambda memory: ${manifest1.environment}=${manifest1.configuration.lambda.memory}MB, ${manifest2.environment}=${manifest2.configuration.lambda.memory}MB`
    );
  }

  if (
    manifest1.configuration.lambda.cpu !== manifest2.configuration.lambda.cpu
  ) {
    differences.push(
      `Lambda CPU: ${manifest1.environment}=${manifest1.configuration.lambda.cpu}vCPU, ${manifest2.environment}=${manifest2.configuration.lambda.cpu}vCPU`
    );
  }

  // Compare Database configuration
  if (
    manifest1.configuration.database.instanceClass !==
    manifest2.configuration.database.instanceClass
  ) {
    differences.push(
      `Database instance: ${manifest1.environment}=${manifest1.configuration.database.instanceClass}, ${manifest2.environment}=${manifest2.configuration.database.instanceClass}`
    );
  }

  if (
    manifest1.configuration.database.engineVersion !==
    manifest2.configuration.database.engineVersion
  ) {
    differences.push(
      `Database engine version: ${manifest1.environment}=${manifest1.configuration.database.engineVersion}, ${manifest2.environment}=${manifest2.configuration.database.engineVersion}`
    );
  }

  // Check for identical configurations (should be same except allowed differences)
  const allowedDifferences = [
    'Lambda memory',
    'Lambda CPU',
    'Database instance',
  ];
  const unexpectedDifferences = differences.filter(
    diff => !allowedDifferences.some(allowed => diff.startsWith(allowed))
  );

  return {
    identical: unexpectedDifferences.length === 0,
    differences,
  };
}
