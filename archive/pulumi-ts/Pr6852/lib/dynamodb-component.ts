import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, ResourceTags } from './types';

export interface DynamoDBComponentArgs {
  config: EnvironmentConfig;
  tags: ResourceTags;
  environmentSuffix: string;
}

/**
 * DynamoDB Component for transaction history
 */
export class DynamoDBComponent extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;

  constructor(
    name: string,
    args: DynamoDBComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:database:DynamoDBComponent', name, {}, opts);

    const { config, tags, environmentSuffix } = args;

    // Create DynamoDB table
    this.table = new aws.dynamodb.Table(
      `transactions-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PROVISIONED',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'S' },
          { name: 'userId', type: 'S' },
          { name: 'status', type: 'S' },
        ],
        readCapacity: config.dynamoReadCapacity,
        writeCapacity: config.dynamoWriteCapacity,
        globalSecondaryIndexes: [
          {
            name: 'UserIdIndex',
            hashKey: 'userId',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
            readCapacity: config.dynamoReadCapacity,
            writeCapacity: config.dynamoWriteCapacity,
          },
          {
            name: 'StatusIndex',
            hashKey: 'status',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
            readCapacity: config.dynamoReadCapacity,
            writeCapacity: config.dynamoWriteCapacity,
          },
        ],
        ttl: {
          attributeName: 'expiresAt',
          enabled: true,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: {
          ...tags,
          Name: `transactions-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      tableName: this.table.name,
      tableArn: this.table.arn,
    });
  }
}
