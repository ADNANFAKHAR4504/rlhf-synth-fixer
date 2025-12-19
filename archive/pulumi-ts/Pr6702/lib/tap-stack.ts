import * as pulumi from '@pulumi/pulumi';
import { AccessStack } from './access-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly flowLogsBucketName: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const tags = args.tags || {};

    // Network Stack - Isolated VPC with private subnets and VPC endpoints
    const network = new NetworkStack(
      `network-stack-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Security Stack - KMS keys, Secrets Manager, IAM roles with ABAC
    const security = new SecurityStack(
      `security-stack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpcId: network.vpcId,
        privateSubnetIds: network.privateSubnetIds,
        tags,
      },
      { parent: this }
    );

    // Monitoring Stack - CloudWatch Logs, VPC Flow Logs, Metric Filters
    const monitoring = new MonitoringStack(
      `monitoring-stack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpcId: network.vpcId,
        kmsKeyArn: security.logsKmsKeyArn,
        tags,
      },
      { parent: this }
    );

    // Access Stack - SSM Session Manager configuration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const access = new AccessStack(
      `access-stack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpcId: network.vpcId,
        privateSubnetIds: network.privateSubnetIds,
        kmsKeyArn: security.logsKmsKeyArn,
        tags,
      },
      { parent: this }
    );

    // Export outputs
    this.vpcId = network.vpcId;
    this.privateSubnetIds = network.privateSubnetIds;
    this.flowLogsBucketName = monitoring.flowLogsBucketName;
    this.secretArn = security.secretArn;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      flowLogsBucketName: this.flowLogsBucketName,
      secretArn: this.secretArn,
    });
  }
}
