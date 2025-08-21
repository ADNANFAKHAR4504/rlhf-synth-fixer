import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class DatabaseStack extends cdk.NestedStack {
  public readonly dynamoTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // CloudWatch Log Group for DynamoDB logs
    new logs.LogGroup(this, 'DynamoDBLogGroup', {
      logGroupName: `/aws/dynamodb/logs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table with point-in-time recovery
    this.dynamoTable = new dynamodb.Table(this, 'SecureTable', {
      tableName: `secure-table-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      contributorInsightsEnabled: true,
    });

    // DAX cluster removed due to VPC limitations in the environment
    // In production, DAX would provide microsecond latency for DynamoDB access

    // Apply tags
    cdk.Tags.of(this).add('Project', 'IaCChallenge');
  }
}
