/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and loads the infrastructure resources
 * from tap-stack.ts. The stack uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */

// Import the stack resources - this will execute the infrastructure code
import '../lib/tap-stack';
