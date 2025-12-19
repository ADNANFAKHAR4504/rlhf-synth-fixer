/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module imports and exports the infrastructure defined in lib/tap-stack.ts.
 * It ensures all exports from lib/tap-stack.ts are available to Pulumi.
 */
export * from '../lib/tap-stack';
