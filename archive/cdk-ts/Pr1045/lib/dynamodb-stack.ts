import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDBStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  readCapacity: number;
  writeCapacity: number;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';
    const region = this.region;

    // Create DynamoDB table with specified capacity settings
    this.table = new dynamodb.Table(this, 'MultiRegionTable', {
      tableName: `multi-region-table-${region}-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sortKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      // Enable point-in-time recovery for data protection
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      // Enable server-side encryption
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // Remove table on stack deletion (for non-production environments)
      removalPolicy:
        environmentSuffix === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // Add a Global Secondary Index for enhanced querying
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'gsi1pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'gsi1sk',
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: Math.max(1, Math.floor(props.readCapacity / 2)),
      writeCapacity: Math.max(1, Math.floor(props.writeCapacity / 2)),
    });

    // Add tags for better resource management
    cdk.Tags.of(this.table).add('Region', region);
    cdk.Tags.of(this.table).add('Purpose', 'MultiRegionDeployment');

    // Output the table name and ARN
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: `DynamoDB table name in ${region}`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: `DynamoDB table ARN in ${region}`,
    });

    new cdk.CfnOutput(this, 'TableCapacities', {
      value: `Read: ${props.readCapacity}, Write: ${props.writeCapacity}`,
      description: `Configured capacities for ${region}`,
    });
  }
}
