/**
 * cloudwatch-stack.ts
 *
 * CloudWatch Log Groups for Lambda functions.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly webhookLogGroup: aws.cloudwatch.LogGroup;
  public readonly reportLogGroup: aws.cloudwatch.LogGroup;
  public readonly webhookLogGroupName: pulumi.Output<string>;
  public readonly reportLogGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    // Log group for webhook Lambda
    this.webhookLogGroup = new aws.cloudwatch.LogGroup(
      `webhook-logs-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/webhook-processor-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    // Log group for report Lambda
    this.reportLogGroup = new aws.cloudwatch.LogGroup(
      `report-logs-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/report-generator-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    this.webhookLogGroupName = this.webhookLogGroup.name;
    this.reportLogGroupName = this.reportLogGroup.name;

    this.registerOutputs({
      webhookLogGroupName: this.webhookLogGroupName,
      reportLogGroupName: this.reportLogGroupName,
    });
  }
}
