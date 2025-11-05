import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
// Read from environment variable set by CI/CD pipeline, fallback to Pulumi config, then 'dev'
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';
const notificationEmail = config.get('notificationEmail');

const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  notificationEmail: notificationEmail,
  tags: {
    ManagedBy: 'Pulumi',
  },
});

export const vpcId = stack.vpc.id;
export const rdsEndpoint = stack.rdsInstance.endpoint;
export const snsTopicArn = stack.snsTopic.arn;
