/**
 * Main TapStack component that orchestrates the database migration infrastructure.
 *
 * This stack coordinates all components needed for the phased PostgreSQL migration:
 * - VPC with private subnets
 * - RDS PostgreSQL with encryption
 * - DMS replication infrastructure
 * - Secrets Manager with rotation
 * - CloudWatch monitoring
 * - IAM roles for cross-account access
 */
import * as pulumi from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { RdsStack } from './rds-stack';
import { DmsStack } from './dms-stack';
import { SecretsStack } from './secrets-stack';
import { LambdaStack } from './lambda-stack';
import { MonitoringStack } from './monitoring-stack';
import { IamStack } from './iam-stack';
import { VpcEndpointsStack } from './vpc-endpoints-stack';

export interface TapStackArgs {
  environmentSuffix: string;
  migrationPhase: string;
  costCenter: string;
  complianceScope: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly dmsReplicationInstanceArn: pulumi.Output<string>;
  public readonly secretsManagerArn: pulumi.Output<string>;
  public readonly replicationLagAlarmArn: pulumi.Output<string>;
  public readonly directConnectVifId: pulumi.Output<string>;
  public readonly directConnectAttachmentId: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:TapStack', name, args, opts);

    const tags = args.tags || {};

    // 1. Create IAM roles for cross-account access
    const iamStack = new IamStack(
      'iam-stack',
      {
        environmentSuffix: args.environmentSuffix,
        migrationPhase: args.migrationPhase,
        tags,
      },
      { parent: this }
    );

    // 2. Create VPC infrastructure
    const vpcStack = new VpcStack(
      'vpc-stack',
      {
        environmentSuffix: args.environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 3. Create VPC endpoints for DMS and Secrets Manager
    // VPC endpoints are created for their side effects (networking)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vpcEndpointsStack = new VpcEndpointsStack(
      'vpc-endpoints-stack',
      {
        environmentSuffix: args.environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        securityGroupId: vpcStack.endpointSecurityGroupId,
        tags,
      },
      { parent: this }
    );

    // 4. Create Secrets Manager for database credentials
    const secretsStack = new SecretsStack(
      'secrets-stack',
      {
        environmentSuffix: args.environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 5. Create Lambda function for secret rotation
    const lambdaStack = new LambdaStack(
      'lambda-stack',
      {
        environmentSuffix: args.environmentSuffix,
        secretArn: secretsStack.secretArn,
        vpcId: vpcStack.vpcId,
        subnetIds: vpcStack.privateSubnetIds,
        securityGroupId: vpcStack.lambdaSecurityGroupId,
        tags,
      },
      { parent: this }
    );

    // 6. Configure secret rotation
    secretsStack.configureRotation(lambdaStack.rotationFunctionArn);

    // 7. Create RDS PostgreSQL instance
    const rdsStack = new RdsStack(
      'rds-stack',
      {
        environmentSuffix: args.environmentSuffix,
        vpcId: vpcStack.vpcId,
        subnetIds: vpcStack.privateSubnetIds,
        securityGroupId: vpcStack.databaseSecurityGroupId,
        secretArn: secretsStack.secretArn,
        kmsKeyId: secretsStack.kmsKeyId,
        tags,
      },
      { parent: this, dependsOn: [secretsStack] }
    );

    // 8. Create DMS replication infrastructure
    const dmsStack = new DmsStack(
      'dms-stack',
      {
        environmentSuffix: args.environmentSuffix,
        vpcId: vpcStack.vpcId,
        subnetIds: vpcStack.privateSubnetIds,
        securityGroupId: vpcStack.dmsSecurityGroupId,
        rdsEndpoint: rdsStack.endpoint,
        rdsPort: rdsStack.port,
        secretArn: secretsStack.secretArn,
        dmsRoleArn: iamStack.dmsVpcRoleArn,
        tags,
      },
      { parent: this, dependsOn: [rdsStack] }
    );

    // 9. Create CloudWatch monitoring and alarms
    const monitoringStack = new MonitoringStack(
      'monitoring-stack',
      {
        environmentSuffix: args.environmentSuffix,
        dmsReplicationTaskArn: dmsStack.replicationTaskArn,
        tags,
      },
      { parent: this, dependsOn: [dmsStack] }
    );

    // Export outputs
    this.vpcId = vpcStack.vpcId;
    this.rdsEndpoint = rdsStack.endpoint;
    this.dmsReplicationInstanceArn = dmsStack.replicationInstanceArn;
    this.secretsManagerArn = secretsStack.secretArn;
    this.replicationLagAlarmArn = monitoringStack.replicationLagAlarmArn;
    this.kmsKeyId = secretsStack.kmsKeyId;

    // Direct Connect outputs (placeholder values - would be configured separately)
    this.directConnectVifId = pulumi.output('vif-placeholder');
    this.directConnectAttachmentId = pulumi.output('attachment-placeholder');

    this.registerOutputs({
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      dmsReplicationInstanceArn: this.dmsReplicationInstanceArn,
      secretsManagerArn: this.secretsManagerArn,
      replicationLagAlarmArn: this.replicationLagAlarmArn,
      directConnectVifId: this.directConnectVifId,
      directConnectAttachmentId: this.directConnectAttachmentId,
      kmsKeyId: this.kmsKeyId,
    });
  }
}
