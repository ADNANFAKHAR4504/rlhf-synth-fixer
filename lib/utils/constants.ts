export const PRIMARY_REGION = 'eu-west-1';
export const SECONDARY_REGIONS = ['eu-west-2', 'eu-west-3'];
export const REGIONS = [PRIMARY_REGION, ...SECONDARY_REGIONS];

export const AVAILABILITY_TARGET = 0.99999; // 99.999%
export const MAX_REPLICATION_LAG_MS = 50;
export const TARGET_TPS = 10000;

export const HEALTH_CHECK_INTERVALS = {
  INFRASTRUCTURE: 30, // seconds
  APPLICATION: 60, // seconds
  DATABASE: 60, // seconds
};

export const FAILOVER_THRESHOLDS = {
  API_ERROR_RATE: 0.01, // 1%
  API_LATENCY_MS: 1000,
  DB_CONNECTION_FAILURES: 3,
  REPLICATION_LAG_MS: 100,
};

