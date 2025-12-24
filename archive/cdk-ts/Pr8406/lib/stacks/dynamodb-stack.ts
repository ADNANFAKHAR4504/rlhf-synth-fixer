import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDBStackProps {
  environment: string;
  isPrimary: boolean;
  region: string;
}

export class DynamoDBStack extends Construct {
  public readonly processedDataTable: dynamodb.ITable;
  public readonly tableName: string;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id);

    const { environment, isPrimary, region } = props;

    // Create DynamoDB table for processed data
    this.tableName = `serverless-processed-data-${environment}`;

    // Detect LocalStack environment
    const isLocalStack = process.env.AWS_ENDPOINT_URL !== undefined;

    // Create DynamoDB Global Table for multi-region replication
    if (isPrimary) {
      if (isLocalStack) {
        // For LocalStack, create a regular Table instead of Global Table
        // LocalStack doesn't fully support Global Tables with multi-region replication
        const table = new dynamodb.Table(this, 'ProcessedDataTable', {
          tableName: this.tableName,
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
          partitionKey: {
            name: 'recordId',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'timestamp',
            type: dynamodb.AttributeType.STRING,
          },
          stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
          pointInTimeRecovery: true,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Add Global Secondary Indexes
        table.addGlobalSecondaryIndex({
          indexName: 'ProcessingStatusIndex',
          partitionKey: {
            name: 'processingStatus',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'timestamp',
            type: dynamodb.AttributeType.STRING,
          },
          projectionType: dynamodb.ProjectionType.ALL,
        });

        table.addGlobalSecondaryIndex({
          indexName: 'DataTypeIndex',
          partitionKey: {
            name: 'dataType',
            type: dynamodb.AttributeType.STRING,
          },
          sortKey: {
            name: 'timestamp',
            type: dynamodb.AttributeType.STRING,
          },
          projectionType: dynamodb.ProjectionType.ALL,
        });

        this.processedDataTable = table;

        // Add tags
        cdk.Tags.of(table).add('Environment', environment);
        cdk.Tags.of(table).add('Service', 'DataStorage');
        cdk.Tags.of(table).add('Region', region);
        cdk.Tags.of(table).add('IsPrimary', isPrimary.toString());
      } else {
        // For AWS, create the Global Table
        const globalTable = new dynamodb.CfnGlobalTable(
          this,
          'ProcessedDataGlobalTable',
          {
            tableName: this.tableName,
            billingMode: 'PAY_PER_REQUEST',
            streamSpecification: {
              streamViewType: 'NEW_AND_OLD_IMAGES',
            },
            attributeDefinitions: [
              {
                attributeName: 'recordId',
                attributeType: 'S',
              },
              {
                attributeName: 'timestamp',
                attributeType: 'S',
              },
              {
                attributeName: 'processingStatus',
                attributeType: 'S',
              },
              {
                attributeName: 'dataType',
                attributeType: 'S',
              },
            ],
            keySchema: [
              {
                attributeName: 'recordId',
                keyType: 'HASH',
              },
              {
                attributeName: 'timestamp',
                keyType: 'RANGE',
              },
            ],
            globalSecondaryIndexes: [
              {
                indexName: 'ProcessingStatusIndex',
                keySchema: [
                  {
                    attributeName: 'processingStatus',
                    keyType: 'HASH',
                  },
                  {
                    attributeName: 'timestamp',
                    keyType: 'RANGE',
                  },
                ],
                projection: {
                  projectionType: 'ALL',
                },
              },
              {
                indexName: 'DataTypeIndex',
                keySchema: [
                  {
                    attributeName: 'dataType',
                    keyType: 'HASH',
                  },
                  {
                    attributeName: 'timestamp',
                    keyType: 'RANGE',
                  },
                ],
                projection: {
                  projectionType: 'ALL',
                },
              },
            ],
            replicas: [
              {
                region: 'us-east-1',
                pointInTimeRecoverySpecification: {
                  pointInTimeRecoveryEnabled: true,
                },
              },
              {
                region: 'us-west-2',
                pointInTimeRecoverySpecification: {
                  pointInTimeRecoveryEnabled: true,
                },
              },
            ],
          }
        );

        // Create a reference to the global table for use in other stacks
        this.processedDataTable = dynamodb.Table.fromTableName(
          this,
          'ProcessedDataTableReference',
          this.tableName
        );

        // Add tags for cost allocation and governance
        cdk.Tags.of(globalTable).add('Environment', environment);
        cdk.Tags.of(globalTable).add('Service', 'DataStorage');
        cdk.Tags.of(globalTable).add('Region', region);
        cdk.Tags.of(globalTable).add('IsPrimary', isPrimary.toString());
        cdk.Tags.of(globalTable).add('GlobalTable', 'true');
      }

      // Output the table name and ARN
      new cdk.CfnOutput(this, 'ProcessedDataTableName', {
        value: this.tableName,
        description: 'Name of the processed data DynamoDB Global Table',
        exportName: `serverless-processed-data-table-name-${region}`,
      });

      new cdk.CfnOutput(this, 'ProcessedDataTableArn', {
        value: `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/${this.tableName}`,
        description: 'ARN of the processed data DynamoDB Global Table',
        exportName: `serverless-processed-data-table-arn-${region}`,
      });

      new cdk.CfnOutput(this, 'ProcessedDataTableStreamArn', {
        value: `arn:aws:dynamodb:${region}:${cdk.Stack.of(this).account}:table/${this.tableName}/stream/*`,
        description:
          'Stream ARN pattern of the processed data DynamoDB Global Table',
        exportName: `serverless-processed-data-table-stream-arn-${region}`,
      });
    } else {
      // In secondary region, create a reference to the global table
      this.processedDataTable = dynamodb.Table.fromTableName(
        this,
        'ProcessedDataTableReference',
        this.tableName
      );
    }
  }
}
