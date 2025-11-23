import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Team: 'security',
};

const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

export const developerRoleArn = stack.developerRoleArn;
export const analystRoleArn = stack.analystRoleArn;
export const adminRoleArn = stack.adminRoleArn;
export const publicBucketName = stack.publicBucketName;
export const internalBucketName = stack.internalBucketName;
export const confidentialBucketName = stack.confidentialBucketName;
