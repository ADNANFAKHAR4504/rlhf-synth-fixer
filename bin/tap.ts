/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module serves as the entry point for the Pulumi program. It imports the
 * main stack definition which creates and configures all AWS resources.
 */
import '../lib/tap-stack';
// Import the main stack - this will trigger the creation of all Pulumi resource
