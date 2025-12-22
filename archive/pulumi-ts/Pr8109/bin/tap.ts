/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module imports and re-exports all infrastructure resources from lib/index.ts.
 * The actual infrastructure (VPC, EC2, RDS, S3, IAM) is defined in lib/index.ts.
 */

// Import and re-export all infrastructure resources and outputs from lib/index.ts
export * from '../lib/index';

