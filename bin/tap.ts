import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new TapStack(`tap-stack-${environmentSuffix}`);

export const vpcId = stack.vpcId;
export const rdsEndpoint = stack.rdsEndpoint;
export const bucketName = stack.bucketName;
export const lambdaArn = stack.lambdaArn;
export const apiUrl = stack.apiUrl;
