/**
 * dynamodb-stack.ts
 *
 * This module defines the DynamoDBStack component for creating DynamoDB tables
 * with comprehensive production configuration including encryption, GSI, and PITR.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface DynamoDBStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  namePrefix: string;
  uniqueId: string;
}

export class DynamoDBStack extends pulumi.ComponentResource {
  public readonly tableName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(name: string, args: DynamoDBStackArgs, opts?: ResourceOptions) {
    super('tap:dynamodb:DynamoDBStack', name, args, opts);

    // DynamoDB Table with comprehensive production configuration
    const dynamoTableName = `${args.namePrefix}-dynamodb-main-${args.uniqueId}`;
    const dynamoTable = new aws.dynamodb.Table(
      dynamoTableName,
      {
        name: dynamoTableName,

        // Hash key (partition key)
        hashKey: 'id',

        // Attributes
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
          {
            name: 'gsi1pk',
            type: 'S',
          },
          {
            name: 'gsi1sk',
            type: 'S',
          },
        ],

        // Provisioned throughput mode for predictable workloads
        billingMode: 'PROVISIONED',
        readCapacity: 10,
        writeCapacity: 10,

        // Global Secondary Index for optimized querying
        globalSecondaryIndexes: [
          {
            name: 'GSI1',
            hashKey: 'gsi1pk',
            rangeKey: 'gsi1sk',
            projectionType: 'ALL',
            readCapacity: 5,
            writeCapacity: 5,
          },
        ],

        // Server-side encryption with AWS-managed KMS key (updated configuration)
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: 'alias/aws/dynamodb', // AWS-managed key for DynamoDB
        },

        // Point-in-time recovery for production resilience
        pointInTimeRecovery: {
          enabled: true,
        },

        // Deletion protection
        deletionProtectionEnabled: true,

        // TTL configuration (optional)
        ttl: {
          attributeName: 'expires_at',
          enabled: true,
        },

        // Stream configuration for change data capture
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',

        tags: {
          ...args.tags,
          ResourceType: 'DynamoDBTable',
          Purpose: 'MainApplicationData',
        },
      },
      { parent: this }
    );

    this.tableName = dynamoTable.name;
    this.tableArn = dynamoTable.arn;

    this.registerOutputs({
      tableName: this.tableName,
      tableArn: this.tableArn,
    });
  }
}
