#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get configuration from Pulumi config
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Optional GitHub configuration - can be set via config or secrets
const githubOwner = config.get('githubOwner');
const githubRepo = config.get('githubRepo');
const githubBranch = config.get('githubBranch') || 'main';
const githubToken = config.getSecret('githubToken');

// Create the stack
const stack = new TapStack('tap-stack', {
  environmentSuffix,
  githubOwner,
  githubRepo,
  githubBranch,
  githubToken: githubToken,
  tags: {
    Environment: 'production',
    Project: 'nodejs-app',
  },
});

// Export stack outputs
export const pipelineArn = stack.pipelineArn;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
