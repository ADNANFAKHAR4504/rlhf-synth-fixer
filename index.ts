import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const notificationEmail =
  config.get('notificationEmail') || 'devops@example.com';

// Create the main stack
const tapStack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  notificationEmail: notificationEmail,
});

// Export stack outputs
export const codeBuildProjectName = tapStack.codeBuildProjectName;
export const artifactBucketName = tapStack.artifactBucketName;
export const snsTopicArn = tapStack.snsTopicArn;
