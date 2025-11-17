import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: 'Production',
  Project: 'MarketAnalytics',
  Repository: repository,
  Author: commitAuthor,
};

const stack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

export const apiUrl = stack.apiUrl;
export const bucketName = stack.bucketName;
export const tableArn = stack.tableArn;
