/**
 * Pulumi application entry point for multi-environment data processing infrastructure.
 *
 * This module instantiates the TapStack with environment-specific configuration.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration
const config = new pulumi.Config();

// Get environment suffix
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata for tagging
const repository = config.get('repository') || 'iac-test-automations';
const commitAuthor = config.get('commitAuthor') || 'unknown';
const projectName = config.get('projectName') || 'dataprocessing';

// Define default tags
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: projectName,
};

// Instantiate the main stack
const stack = new TapStack('tap-dataprocessing-stack', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs with environment prefix
export const bucketName = stack.bucketName;
export const lambdaArn = stack.lambdaArn;
export const dynamoTableName = stack.dynamoTableName;
