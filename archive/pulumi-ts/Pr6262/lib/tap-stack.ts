import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { DatabaseStack } from './database-stack';
import { EcsStack } from './ecs-stack';
import { AlbStack } from './alb-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupVerificationStack } from './backup-verification-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly apiGatewayUrl: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const region = pulumi.output(
      pulumi.runtime.getConfig('aws:region') || 'ap-southeast-1'
    );

    // VPC and Networking
    const vpcStack = new VpcStack(
      'payment-vpc',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Database Layer
    const databaseStack = new DatabaseStack(
      'payment-db',
      {
        environmentSuffix,
        vpcId: vpcStack.vpcId,
        databaseSubnetIds: vpcStack.databaseSubnetIds,
        privateSubnetCidrs: vpcStack.privateSubnetCidrs,
        tags,
      },
      { parent: this }
    );

    // ECS Cluster and Services
    const ecsStack = new EcsStack(
      'payment-ecs',
      {
        environmentSuffix,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        databaseEndpoint: databaseStack.clusterEndpoint,
        databaseSecretArn: databaseStack.databaseSecretArn,
        region,
        tags,
      },
      { parent: this }
    );

    // Application Load Balancer with WAF
    const albStack = new AlbStack(
      'payment-alb',
      {
        environmentSuffix,
        vpcId: vpcStack.vpcId,
        publicSubnetIds: vpcStack.publicSubnetIds,
        ecsServiceArn: ecsStack.serviceArn,
        targetGroupArn: ecsStack.targetGroupArn,
        blueTargetGroupArn: ecsStack.blueTargetGroupArn,
        greenTargetGroupArn: ecsStack.greenTargetGroupArn,
        tags,
      },
      { parent: this }
    );

    // API Gateway
    const apiGatewayStack = new ApiGatewayStack(
      'payment-api',
      {
        environmentSuffix,
        albDnsName: albStack.albDnsName,
        tags,
      },
      { parent: this }
    );

    // Monitoring and Logging
    const monitoringStack = new MonitoringStack(
      'payment-monitoring',
      {
        environmentSuffix,
        albArn: albStack.albArn,
        ecsClusterName: ecsStack.clusterName,
        ecsServiceName: ecsStack.serviceName,
        databaseClusterId: databaseStack.clusterId,
        region,
        tags,
      },
      { parent: this }
    );

    // Backup Verification
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _backupStack = new BackupVerificationStack(
      'payment-backup',
      {
        environmentSuffix,
        databaseClusterArn: databaseStack.clusterArn,
        tags,
      },
      { parent: this }
    );

    // Outputs
    this.albDnsName = albStack.albDnsName;
    this.apiGatewayUrl = apiGatewayStack.apiUrl;
    this.dashboardUrl = monitoringStack.dashboardUrl;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      apiGatewayUrl: this.apiGatewayUrl,
      dashboardUrl: this.dashboardUrl,
      vpcId: vpcStack.vpcId,
      databaseEndpoint: databaseStack.clusterEndpoint,
      ecsClusterArn: ecsStack.clusterArn,
    });
  }
}
