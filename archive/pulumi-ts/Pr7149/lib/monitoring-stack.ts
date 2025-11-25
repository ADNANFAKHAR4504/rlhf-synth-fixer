import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  kmsKeyId: pulumi.Input<string>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly ecsLogGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, tags, kmsKeyId } = args;

    // CloudWatch Log Group for ECS tasks
    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      `payment-ecs-logs-${environmentSuffix}`,
      {
        name: `/ecs/payment-app-${environmentSuffix}`,
        retentionInDays: 365,
        kmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecs-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Log Group for RDS slow queries
    const rdsSlowQueryLogGroup = new aws.cloudwatch.LogGroup(
      `payment-rds-slow-query-logs-${environmentSuffix}`,
      {
        name: `/aws/rds/cluster/payment-cluster-${environmentSuffix}/postgresql`,
        retentionInDays: 365,
        kmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-rds-slow-query-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Log Group for audit logs
    const auditLogGroup = new aws.cloudwatch.LogGroup(
      `payment-audit-logs-${environmentSuffix}`,
      {
        name: `/audit/payment-app-${environmentSuffix}`,
        retentionInDays: 365,
        kmsKeyId: kmsKeyId,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-audit-logs-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.ecsLogGroupName = ecsLogGroup.name;

    this.registerOutputs({
      ecsLogGroupName: this.ecsLogGroupName,
      rdsSlowQueryLogGroupName: rdsSlowQueryLogGroup.name,
      auditLogGroupName: auditLogGroup.name,
    });
  }
}
