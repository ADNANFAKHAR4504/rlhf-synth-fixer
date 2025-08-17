import { Construct } from 'constructs';
import { DynamodbTable } from '../.gen/providers/aws/dynamodb-table';
import { SecurityConstruct } from './security-construct';

interface DynamoDbConstructProps {
  prefix: string;
  security: SecurityConstruct;
}

export class DynamoDbConstruct extends Construct {
  constructor(scope: Construct, id: string, props: DynamoDbConstructProps) {
    super(scope, id);
    // For each region, create DynamoDB table encrypted with KMS
    Object.keys(props.security.kmsKeys).forEach(region => {
      const kmsKey = props.security.kmsKeys[region];
      // Import DynamoDBTable from @cdktf/provider-aws
      // Dynamically require to avoid import errors if not used elsewhere
  new DynamodbTable(this, `${props.prefix}-dynamodb-table-${region}`, {
        provider: kmsKey.provider,
        name: `${props.prefix}-table-${region}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        attribute: [
          { name: 'id', type: 'S' },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        tags: {
          Name: `${props.prefix}-dynamodb-table-${region}`,
          Environment: props.prefix,
        },
      });
    });
  }
}
