import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX;
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';

if (!environmentSuffix) {
  throw new Error(
    'environmentSuffix is required. Set it via Pulumi config or ENVIRONMENT_SUFFIX environment variable'
  );
}

const stack = new TapStack('tap-stack', {
  environmentSuffix,
  region,
});

export const kmsKeyArn = stack.kmsKey.arn;
export const bucketName = stack.bucket.bucket;
export const lambdaArn = stack.lambdaFunction.arn;
export const vpcId = stack.vpc.id;
export const auditTableName = stack.auditTable.name;
