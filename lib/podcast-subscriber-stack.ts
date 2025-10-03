import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface PodcastSubscriberStackProps {
  environmentSuffix: string;
}

export class PodcastSubscriberStack extends Construct {
  public readonly subscriberTable: dynamodb.Table;

  constructor(
    scope: Construct,
    id: string,
    props: PodcastSubscriberStackProps
  ) {
    super(scope, id);

    // DynamoDB table for subscriber information with Streams enabled
    this.subscriberTable = new dynamodb.Table(this, 'SubscriberTable', {
      tableName: `podcast-subscribers-${props.environmentSuffix}`,
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for subscription status queries
    this.subscriberTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'subscriptionStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'expirationDate',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    new cdk.CfnOutput(this, 'SubscriberTableName', {
      value: this.subscriberTable.tableName,
      description: 'DynamoDB table for subscriber data',
    });

    new cdk.CfnOutput(this, 'SubscriberTableStreamArn', {
      value: this.subscriberTable.tableStreamArn || '',
      description: 'DynamoDB table stream ARN',
    });
  }
}
