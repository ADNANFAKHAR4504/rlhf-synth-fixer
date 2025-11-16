/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module imports and executes the main Pulumi program which creates all infrastructure
 * resources including VPC, ECS, RDS, ALB, and monitoring components.
 *
 * The program uses environment suffixes to distinguish between different deployment
 * environments (development, staging, production, etc.).
 */

// Import the main Pulumi program
import '../lib/tap-stack';
