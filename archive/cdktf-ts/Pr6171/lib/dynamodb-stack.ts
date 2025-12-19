import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';

export interface DynamodbStackProps {
  environmentSuffix: string;
  kmsKeyArn: string;
}

export class DynamodbStack extends Construct {
  public readonly transactionsTable: DynamodbTable;

  constructor(scope: Construct, id: string, props: DynamodbStackProps) {
    super(scope, id);

    const { environmentSuffix, kmsKeyArn } = props;

    // Create DynamoDB table for payment transactions
    this.transactionsTable = new DynamodbTable(this, 'transactions_table', {
      name: `payment-transactions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'transaction_id',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'transaction_id',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKeyArn,
      },
      tags: {
        Name: `payment-transactions-${environmentSuffix}`,
      },
    });
  }
}
