import * as pulumi from '@pulumi/pulumi';
import { createInfrastructure } from '../lib/infrastructure';

const config = new pulumi.Config();
// Get environmentSuffix from config or fall back to stack name suffix or environment variable
const environmentSuffix =
  config.get('environmentSuffix') ||
  pulumi.getStack().replace('TapStack', '') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Create infrastructure and export outputs
const outputs = createInfrastructure(environmentSuffix);

export const reportBucketName = outputs.reportBucketName;
export const reportBucketArn = outputs.reportBucketArn;
export const auditLambdaArn = outputs.auditLambdaArn;
export const auditLambdaName = outputs.auditLambdaName;
export const weeklyRuleName = outputs.weeklyRuleName;
export const logGroupName = outputs.logGroupName;
