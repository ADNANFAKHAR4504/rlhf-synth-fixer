import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface AuditConstructProps {
  environmentSuffix: string;
}

export class AuditConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: AuditConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'AuditTable', {
      tableName: `${cdk.Stack.of(this).stackName}-Audit-${props.environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure destroyable for testing
    });

    // Add GSI for querying by type
    this.table.addGlobalSecondaryIndex({
      indexName: 'TypeIndex',
      partitionKey: {
        name: 'type',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for querying by alarm name
    this.table.addGlobalSecondaryIndex({
      indexName: 'AlarmIndex',
      partitionKey: {
        name: 'alarmName',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output the table name
    new cdk.CfnOutput(this, 'AuditTableName', {
      value: this.table.tableName,
      description: 'Name of the audit DynamoDB table',
      exportName: `${cdk.Stack.of(this).stackName}-AuditTableName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuditTableArn', {
      value: this.table.tableArn,
      description: 'ARN of the audit DynamoDB table',
      exportName: `${cdk.Stack.of(this).stackName}-AuditTableArn-${props.environmentSuffix}`,
    });
  }
}
