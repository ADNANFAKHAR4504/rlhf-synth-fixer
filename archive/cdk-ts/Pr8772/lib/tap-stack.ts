import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { WebServerStack } from './web-server';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId?: string;
  region?: string;
  enableMonitoring?: boolean;
  enableBackups?: boolean;
  backupRetentionDays?: number;
  enableAlarms?: boolean;
  alarmEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Use parameterized region or default to us-east-1
    const region =
      props?.region ||
      this.node.tryGetContext('region') ||
      process.env.CDK_DEFAULT_REGION ||
      'us-east-1';

    new WebServerStack(this, 'WebServerStack', {
      environmentSuffix,
      vpcId: props?.vpcId, // Optional - VPC will be created if not provided
      region,
      enableMonitoring: props?.enableMonitoring ?? true,
      enableBackups: props?.enableBackups ?? true,
      backupRetentionDays: props?.backupRetentionDays || 7,
      enableAlarms: props?.enableAlarms ?? true,
      alarmEmail: props?.alarmEmail,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
      },
    });
  }
}
