/**
 * validation.ts
 *
 * Custom validation functions for configuration drift prevention
 */
import { EnvironmentConfig } from '../tap-stack';

const ALLOWED_MEMORY_VALUES = [1024, 2048, 4096];
const ALLOWED_CPU_VALUES = [0.5, 1, 2];
const ALLOWED_DB_INSTANCES = ['db.t4g.medium', 'db.r6g.large', 'db.r6g.xlarge'];

export function validateEnvironmentConfig(config: EnvironmentConfig): void {
  // Validate Lambda memory
  if (!ALLOWED_MEMORY_VALUES.includes(config.lambda.memory)) {
    throw new Error(
      `Invalid Lambda memory: ${config.lambda.memory}. Must be one of: ${ALLOWED_MEMORY_VALUES.join(', ')}`
    );
  }

  // Validate Lambda CPU
  if (!ALLOWED_CPU_VALUES.includes(config.lambda.cpu)) {
    throw new Error(
      `Invalid Lambda CPU: ${config.lambda.cpu}. Must be one of: ${ALLOWED_CPU_VALUES.join(', ')}`
    );
  }

  // Validate database instance class
  if (!ALLOWED_DB_INSTANCES.includes(config.database.instanceClass)) {
    throw new Error(
      `Invalid database instance class: ${config.database.instanceClass}. Must be one of: ${ALLOWED_DB_INSTANCES.join(', ')}`
    );
  }

  // Validate environment-specific combinations
  if (config.environment === 'dev') {
    if (config.lambda.memory !== 1024) {
      throw new Error(
        `Dev environment must use 1024MB Lambda memory, got ${config.lambda.memory}`
      );
    }
    if (config.lambda.cpu !== 0.5) {
      throw new Error(
        `Dev environment must use 0.5 vCPU, got ${config.lambda.cpu}`
      );
    }
    if (config.database.instanceClass !== 'db.t4g.medium') {
      throw new Error(
        `Dev environment must use db.t4g.medium, got ${config.database.instanceClass}`
      );
    }
  }

  if (config.environment === 'staging') {
    if (config.lambda.memory !== 2048) {
      throw new Error(
        `Staging environment must use 2048MB Lambda memory, got ${config.lambda.memory}`
      );
    }
    if (config.lambda.cpu !== 1) {
      throw new Error(
        `Staging environment must use 1 vCPU, got ${config.lambda.cpu}`
      );
    }
    if (config.database.instanceClass !== 'db.r6g.large') {
      throw new Error(
        `Staging environment must use db.r6g.large, got ${config.database.instanceClass}`
      );
    }
  }

  if (config.environment === 'prod') {
    if (config.lambda.memory !== 4096) {
      throw new Error(
        `Prod environment must use 4096MB Lambda memory, got ${config.lambda.memory}`
      );
    }
    if (config.lambda.cpu !== 2) {
      throw new Error(
        `Prod environment must use 2 vCPU, got ${config.lambda.cpu}`
      );
    }
    if (config.database.instanceClass !== 'db.r6g.large') {
      throw new Error(
        `Prod environment must use db.r6g.large, got ${config.database.instanceClass}`
      );
    }
  }

  // Validate monitoring thresholds are reasonable
  if (
    config.monitoring.errorThreshold < 0 ||
    config.monitoring.errorThreshold > 1000
  ) {
    throw new Error(
      `Error threshold must be between 0 and 1000, got ${config.monitoring.errorThreshold}`
    );
  }

  if (
    config.monitoring.latencyThreshold < 100 ||
    config.monitoring.latencyThreshold > 30000
  ) {
    throw new Error(
      `Latency threshold must be between 100ms and 30000ms, got ${config.monitoring.latencyThreshold}ms`
    );
  }
}

export function validateRegion(region: string, environment: string): void {
  const validRegions: Record<string, string> = {
    dev: 'us-east-2',
    staging: 'us-west-2',
    prod: 'us-east-1',
  };

  if (validRegions[environment] !== region) {
    throw new Error(
      `Invalid region for ${environment}: ${region}. Expected: ${validRegions[environment]}`
    );
  }
}
