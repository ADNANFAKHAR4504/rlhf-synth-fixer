import * as cdk from 'aws-cdk-lib';

import { IamStack } from '../lib/stacks/iam-stack';
import { KmsStack } from '../lib/stacks/kms-stack';
import { MfaEnforcementScpStack } from '../lib/stacks/mfa-scp-stack';
import { RdsStack } from '../lib/stacks/rds-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';

export function main(app?: cdk.App) {
  const appInstance = app ?? new cdk.App();
  const dept = (appInstance.node.tryGetContext('dept') as string) ?? 'hr';
  const envSuffix =
    (appInstance.node.tryGetContext('environmentSuffix') as string) ?? 'dev';
  const purpose =
    (appInstance.node.tryGetContext('purpose') as string) ?? 'security';
  const enableOrgScp =
    (appInstance.node.tryGetContext('enableOrgScp') as boolean) ?? false;
  const orgTargetId = appInstance.node.tryGetContext('orgTargetId') as
    | string
    | undefined;

  ['us-east-2', 'us-west-2'].forEach(region => {
    new KmsStack(appInstance, `${dept}-${envSuffix}-${purpose}-kms-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
    });
    new S3Stack(appInstance, `${dept}-${envSuffix}-${purpose}-s3-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
    });
    const vpc = new VpcStack(
      appInstance,
      `${dept}-${envSuffix}-${purpose}-vpc-${region}`,
      {
        env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
        dept,
        envName: envSuffix,
        purpose,
      }
    );
    new RdsStack(appInstance, `${dept}-${envSuffix}-${purpose}-rds-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
      vpc: vpc.vpc,
    });
    new IamStack(appInstance, `${dept}-${envSuffix}-${purpose}-iam-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
    });
  });

  if (enableOrgScp && orgTargetId) {
    new MfaEnforcementScpStack(
      appInstance,
      `${dept}-${envSuffix}-${purpose}-mfa-scp`,
      {
        env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-2' },
        dept,
        envName: envSuffix,
        purpose,
        orgTargetId,
      }
    );
  }
}

if (require.main === module) {
  main();
}
