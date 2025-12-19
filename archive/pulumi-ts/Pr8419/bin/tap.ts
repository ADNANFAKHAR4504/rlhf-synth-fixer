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
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new TapStack('TapStack', {
  tags: defaultTags,
});

// Export stack outputs for CI/CD pipeline and external consumption
export const environment = tapStack.environmentSuffix;
export const regions = tapStack.regions;
export const primaryVpcId = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalNetworks[regions[0]]
    ? tapStack.regionalNetworks[regions[0]].vpcId
    : undefined
);
export const primarySecurityGroupId = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalSecurity[regions[0]]
    ? tapStack.regionalSecurity[regions[0]].webServerSgId
    : undefined
);
export const primaryInstanceIds = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalCompute[regions[0]]
    ? tapStack.regionalCompute[regions[0]].instanceIds
    : undefined
);
export const primaryDashboardName = tapStack.regions.apply(regions =>
  regions.length > 0 && tapStack.regionalMonitoring[regions[0]]
    ? tapStack.regionalMonitoring[regions[0]].dashboardName
    : undefined
);
