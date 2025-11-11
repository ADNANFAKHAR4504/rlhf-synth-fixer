/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Create the trading platform stack with EU regions
const tradingPlatform = new TapStack('trading-platform', {
  environmentSuffix: environmentSuffix,
  primaryRegion: 'eu-central-1',  // Frankfurt
  drRegion: 'eu-west-2',          // London
  hostedZoneName: `trading-platform-${environmentSuffix}.com`,
  notificationEmail: 'ops@example.com',
  tags: {
    Project: 'TradingPlatform',
    Environment: environmentSuffix,
  },
});

// Export outputs
export const primaryVpcId = tradingPlatform.primaryVpc.id;
export const drVpcId = tradingPlatform.drVpc.id;
export const primaryAlbDns = tradingPlatform.primaryAlb.dnsName;
export const drAlbDns = tradingPlatform.drAlb.dnsName;
export const auroraGlobalClusterId = tradingPlatform.auroraGlobalCluster.id;
export const dynamodbTableName = tradingPlatform.dynamodbTable.name;
export const hostedZoneId = tradingPlatform.hostedZone.id;
export const primaryHealthCheckId = tradingPlatform.primaryHealthCheck.id;
