/**
 * Pulumi application entry point for the CI/CD Build System.
 *
 * This module imports the infrastructure definition from tap-stack.ts,
 * which deploys AWS CodeBuild with artifact management, logging, and notifications.
 */

// Import and re-export the infrastructure stack outputs
export * from './lib/tap-stack';
