import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config('TapStack');
const environmentSuffix = config.require('environmentSuffix');
const approvedAmiIds = config.getObject<string[]>('approvedAmiIds');

const stack = new TapStack('tap-stack', {
  environmentSuffix,
  approvedAmiIds,
});

export const violationsReport = stack.violationsReport;
export const snsTopicArn = stack.snsTopic.arn;
export const violationCount = stack.violationCount;
