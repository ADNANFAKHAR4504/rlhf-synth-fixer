import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly licensesTableArn: pulumi.Output<string>;
  public readonly analyticsTableArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create DynamoDB table for license validation
    const licensesTable = new aws.dynamodb.Table(
      `licenses-${environmentSuffix}`,
      {
        attributes: [
          { name: 'licenseKey', type: 'S' },
          { name: 'customerId', type: 'S' },
        ],
        hashKey: 'licenseKey',
        rangeKey: 'customerId',
        billingMode: 'PAY_PER_REQUEST',
        pointInTimeRecovery: { enabled: true },
        serverSideEncryption: { enabled: true },
        tags,
      },
      { parent: this }
    );

    // Create DynamoDB table for download analytics
    const analyticsTable = new aws.dynamodb.Table(
      `download-analytics-${environmentSuffix}`,
      {
        attributes: [
          { name: 'downloadId', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'customerId', type: 'S' },
        ],
        hashKey: 'downloadId',
        rangeKey: 'timestamp',
        billingMode: 'PAY_PER_REQUEST',
        globalSecondaryIndexes: [
          {
            name: 'CustomerIndex',
            hashKey: 'customerId',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        serverSideEncryption: { enabled: true },
        tags,
      },
      { parent: this }
    );

    this.licensesTableArn = licensesTable.arn;
    this.analyticsTableArn = analyticsTable.arn;

    this.registerOutputs({
      licensesTableArn: this.licensesTableArn,
      analyticsTableArn: this.analyticsTableArn,
    });
  }
}
