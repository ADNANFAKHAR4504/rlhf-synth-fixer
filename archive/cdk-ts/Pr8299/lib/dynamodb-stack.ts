import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface DynamoDbStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoDbStack extends cdk.Stack {
  public readonly usersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
    super(scope, id, props);

    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `Users-${props.environmentSuffix}`,
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Always destroy for testing
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: props.environmentSuffix === 'prod',
      },
    });

    // Resource-based policy for enhanced access control is configured below
    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    // Apply resource-based policy (CDK abstraction for resource policies)
    // For LocalStack, skip the condition as it's not fully supported
    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:DeleteItem'],
      resources: [this.usersTable.tableArn],
    });

    // Only add conditions for real AWS (not LocalStack)
    if (!isLocalStack) {
      policyStatement.addCondition('StringEquals', {
        'aws:SourceAccount': cdk.Stack.of(this).account,
      });
    }

    this.usersTable.addToResourcePolicy(policyStatement);

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      exportName: `UsersTableName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'UsersTableArn', {
      value: this.usersTable.tableArn,
      exportName: `UsersTableArn-${props.environmentSuffix}`,
    });
  }
}
