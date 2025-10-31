import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Optional configurations
const ecrImageUri = config.get('ecrImageUri') || 'nginx:latest';
const domainName = config.get('domainName');
const certificateArn = config.get('certificateArn');
const dbSecretArn = config.get('dbSecretArn');

const defaultTags = {
  Environment: 'production',
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'pulumi',
};

const stack = new TapStack('payment-platform', {
  environmentSuffix,
  tags: defaultTags,
  ecrImageUri,
  domainName,
  certificateArn,
  dbSecretArn,
});

// Export outputs
export const albDnsName = stack.albDnsName;
export const dbEndpoint = stack.dbEndpoint;
export const ecsClusterName = stack.ecsClusterName;
