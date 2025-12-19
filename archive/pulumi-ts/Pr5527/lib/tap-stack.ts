/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VPCStack } from './vpc-stack';
import { RDSStack } from './rds-stack';
import { BackupStack } from './backup-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly backupBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC with private subnets
    const vpcStack = new VPCStack(
      'rds-backup-vpc',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Note: KMS key creation should be implemented in a separate KMS stack
    // For now using default AWS encryption

    // Create RDS PostgreSQL instance
    const rdsStack = new RDSStack(
      'rds-postgresql',
      {
        environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        securityGroupId: vpcStack.rdsSecurityGroupId,
        tags,
      },
      { parent: this }
    );

    // Create backup infrastructure
    const backupStack = new BackupStack(
      'backup-infra',
      {
        environmentSuffix,
        rdsInstanceId: rdsStack.instanceId,
        rdsEndpoint: rdsStack.endpoint,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        lambdaSecurityGroupId: vpcStack.lambdaSecurityGroupId,
        tags,
      },
      { parent: this }
    );

    // Create monitoring and alerting
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        rdsInstanceId: rdsStack.instanceId,
        backupBucketName: backupStack.bucketName,
        lambdaFunctionName: backupStack.lambdaFunctionName,
        tags,
      },
      { parent: this }
    );

    this.rdsEndpoint = rdsStack.endpoint;
    this.backupBucketName = backupStack.bucketName;
    this.snsTopicArn = monitoringStack.snsTopicArn;

    this.registerOutputs({
      rdsEndpoint: this.rdsEndpoint,
      backupBucketName: this.backupBucketName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
