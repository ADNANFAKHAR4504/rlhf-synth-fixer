import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const complianceEmail = config.require('complianceEmail');

const stack = new TapStack('compliance-monitoring', {
  environmentSuffix: environmentSuffix,
  complianceEmail: complianceEmail,
});

export const configRecorderName = stack.configRecorderName;
export const complianceBucketName = stack.complianceBucketName;
export const snsTopicArn = stack.snsTopicArn;
export const dashboardName = stack.dashboardName;
