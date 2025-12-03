import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';

export interface DynamodbStackProps {
  environmentSuffix: string;
}

export class DynamodbStack extends Construct {
  public readonly sessionsTable: DynamodbTable;
  public readonly apiKeysTable: DynamodbTable;

  constructor(scope: Construct, id: string, props: DynamodbStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Sessions table
    this.sessionsTable = new DynamodbTable(this, 'sessions-table', {
      name: `trading-sessions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'sessionId',
      attribute: [
        {
          name: 'sessionId',
          type: 'S',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      ttl: {
        enabled: true,
        attributeName: 'ttl',
      },
      tags: {
        Name: `trading-sessions-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // API keys table
    this.apiKeysTable = new DynamodbTable(this, 'api-keys-table', {
      name: `trading-api-keys-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'apiKeyId',
      attribute: [
        {
          name: 'apiKeyId',
          type: 'S',
        },
        {
          name: 'userId',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'UserIdIndex',
          hashKey: 'userId',
          projectionType: 'ALL',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `trading-api-keys-${environmentSuffix}`,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });
  }
}
