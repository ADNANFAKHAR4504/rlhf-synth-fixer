import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new TapStack('tap-stack', { environmentSuffix });

export const secretArn = stack.secretArn;
export const vpcId = stack.vpcId;
export const clusterEndpoint = stack.clusterEndpoint;
