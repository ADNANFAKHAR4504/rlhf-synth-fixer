import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface DynamodbTableConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
}

export class DynamodbTableConstruct extends Construct {
  public readonly table: DynamodbTable;
  public readonly tableArn: string;
  public readonly tableName: string;

  constructor(
    scope: Construct,
    id: string,
    props: DynamodbTableConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix, config } = props;

    // Create DynamoDB table with environment-specific capacity settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableConfig: any = {
      name: `data-table-${environmentSuffix}`,
      billingMode: config.dynamodbBillingMode,
      hashKey: 'id',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
        {
          name: 'status',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'StatusIndex',
          hashKey: 'status',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
        },
      ],
      tags: {
        Name: `data-table-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
      pointInTimeRecovery: {
        enabled: false, // Disabled for cost optimization
      },
    };

    // Add capacity settings for provisioned mode
    if (config.dynamodbBillingMode === 'PROVISIONED') {
      tableConfig.readCapacity = config.dynamodbReadCapacity;
      tableConfig.writeCapacity = config.dynamodbWriteCapacity;
      tableConfig.globalSecondaryIndex[0].readCapacity =
        config.dynamodbReadCapacity;
      tableConfig.globalSecondaryIndex[0].writeCapacity =
        config.dynamodbWriteCapacity;
    }

    this.table = new DynamodbTable(this, 'DataTable', tableConfig);

    this.tableArn = this.table.arn;
    this.tableName = this.table.name;
  }
}
