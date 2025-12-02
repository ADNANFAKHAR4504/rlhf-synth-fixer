/**
 * Pulumi application entry point for the CI/CD Build System.
 *
 * This module imports the infrastructure definition from tap-stack.ts,
 * which deploys AWS CodeBuild with artifact management, logging, and notifications.
 */

// Import the infrastructure stack
import '../lib/tap-stack';
