/**
 * monitoring-stack.ts
 *
 * Creates CloudWatch log groups for all services with 30-day retention.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly databaseLogGroupName: pulumi.Output<string>;
  public readonly containerLogGroupName: pulumi.Output<string>;
  public readonly applicationLogGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create log group for RDS
    const databaseLogGroup = new aws.cloudwatch.LogGroup(
      `financial-db-logs-${environmentSuffix}`,
      {
        name: `/aws/rds/cluster/financial-db-cluster-${environmentSuffix}/postgresql`,
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `financial-db-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create log group for container services
    const containerLogGroup = new aws.cloudwatch.LogGroup(
      `financial-container-logs-${environmentSuffix}`,
      {
        name: `/aws/ecs/financial-container-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `financial-container-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create log group for application
    const applicationLogGroup = new aws.cloudwatch.LogGroup(
      `financial-app-logs-${environmentSuffix}`,
      {
        name: `/aws/application/financial-app-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `financial-app-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.databaseLogGroupName = databaseLogGroup.name;
    this.containerLogGroupName = containerLogGroup.name;
    this.applicationLogGroupName = applicationLogGroup.name;

    this.registerOutputs({
      databaseLogGroupName: this.databaseLogGroupName,
      containerLogGroupName: this.containerLogGroupName,
      applicationLogGroupName: this.applicationLogGroupName,
    });
  }
}
