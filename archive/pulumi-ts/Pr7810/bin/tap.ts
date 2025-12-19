import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'ComplianceScanner',
  },
});

export const reportBucketName = stack.reportBucketName;
export const complianceFunctionArn = stack.complianceFunctionArn;
export const complianceFunctionName = stack.complianceFunctionName;
