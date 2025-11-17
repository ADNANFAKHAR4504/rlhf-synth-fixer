import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DynamoDBConstructProps {
  environmentSuffix: string;
  region: string;
  replicaRegions: string[];
}

export class DynamoDBConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(
      this,
      `UserSessionsTable-${props.environmentSuffix}`,
      {
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        replicationRegions: props.replicaRegions,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        deletionProtection: false,
      }
    );

    cdk.Tags.of(this.table).add('Region', props.region);
  }
}
