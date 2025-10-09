import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDBStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly bugsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: DynamoDBStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // DynamoDB table for bug reports with streams enabled
    this.bugsTable = new dynamodb.Table(this, 'BugsTable', {
      tableName: `bug-reports-${environmentSuffix}`,
      partitionKey: { name: 'bugId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by priority
    this.bugsTable.addGlobalSecondaryIndex({
      indexName: 'PriorityIndex',
      partitionKey: { name: 'priority', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for querying by status
    this.bugsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
    });
  }
}
