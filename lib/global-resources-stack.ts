import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface GlobalResourcesStackProps extends cdk.StackProps {
  environment: string;
}

export class GlobalResourcesStack extends cdk.Stack {
  public readonly globalTableName: string;
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: GlobalResourcesStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'DRAlertTopic', {
      topicName: `dr-alerts-${props.environment}`,
      displayName: 'Disaster Recovery Alerts',
    });

    // Add email subscription (replace with your email)
    this.alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('alerts@example.com')
    );

    // DynamoDB Global Table
    const globalTable = new dynamodb.Table(this, 'TransactionGlobalTable', {
      tableName: `transactions-global-${props.environment}`,
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      replicationRegions: ['us-west-2'],
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    this.globalTableName = globalTable.tableName;

    // Tags for global resources
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('DR-Role', 'global');

    // Outputs
    new cdk.CfnOutput(this, 'GlobalTableName', {
      value: this.globalTableName,
      exportName: `GlobalTableName-${props.environment}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      exportName: `AlertTopicArn-${props.environment}`,
    });
  }
}
