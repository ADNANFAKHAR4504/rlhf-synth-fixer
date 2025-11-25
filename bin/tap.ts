import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = config.get('region') || 'us-east-1';

const stack = new TapStack('tap-stack', {
  environmentSuffix,
  region,
});

export const kmsKeyArn = stack.kmsKey.arn;
export const bucketName = stack.bucket.bucket;
export const lambdaArn = stack.lambdaFunction.arn;
export const vpcId = stack.vpc.id;
export const auditTableName = stack.auditTable.name;
