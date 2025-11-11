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

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';

// Use nginx alpine as default - publicly available
const paymentApiImage = config.get('paymentApiImage') || 'nginx:1.25-alpine';
const fraudDetectorImage =
  config.get('fraudDetectorImage') || 'nginx:1.25-alpine';
const notificationServiceImage =
  config.get('notificationServiceImage') || 'nginx:1.25-alpine';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

const stack = new TapStack('TapStack', {
  environmentSuffix,
  paymentApiImage,
  fraudDetectorImage,
  notificationServiceImage,
  tags: defaultTags,
});

export const clusterName = stack.clusterName;
export const kubeconfig = stack.kubeconfig;
export const namespaceName = stack.namespaceName;
export const gatewayUrl = stack.gatewayUrl;
export const paymentApiEndpoint = stack.paymentApiEndpoint;
export const fraudDetectorEndpoint = stack.fraudDetectorEndpoint;
export const notificationServiceEndpoint = stack.notificationServiceEndpoint;
export const hpaStatus = stack.hpaStatus;
