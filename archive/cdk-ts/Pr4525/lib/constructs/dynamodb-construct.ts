import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { KmsConstruct } from './kms-construct';

export interface DynamoDBConstructProps {
  environmentSuffix: string;
  readCapacity: number;
  writeCapacity: number;
  removalPolicy: cdk.RemovalPolicy;
  kmsKey: KmsConstruct;
}

export class DynamoDBConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'UserTable', {
      tableName: `users-${props.environmentSuffix}`,
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      removalPolicy: props.removalPolicy,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: props.kmsKey.key,
    });

    // Add tags using CDK Tags utility
    cdk.Tags.of(this.table).add('Project', 'ServerlessInfra');

    // Configure auto-scaling
    const readScaling = this.table.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    const writeScaling = this.table.autoScaleWriteCapacity({
      minCapacity: 1,
      maxCapacity: 10,
    });

    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }
}
