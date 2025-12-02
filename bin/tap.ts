import * as pulumi from '@pulumi/pulumi';
import { createInfrastructure } from '../lib/infrastructure';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

// Create infrastructure and export outputs
const outputs = createInfrastructure(environmentSuffix);

export const reportBucketName = outputs.reportBucketName;
export const reportBucketArn = outputs.reportBucketArn;
export const auditLambdaArn = outputs.auditLambdaArn;
export const auditLambdaName = outputs.auditLambdaName;
export const weeklyRuleName = outputs.weeklyRuleName;
export const logGroupName = outputs.logGroupName;
