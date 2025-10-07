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
export declare const albDnsName: pulumi.Output<string>;
export declare const staticBucketName: pulumi.Output<string>;
export declare const vpcId: pulumi.Output<string>;
export declare const instanceConnectEndpointId: pulumi.Output<string>;
