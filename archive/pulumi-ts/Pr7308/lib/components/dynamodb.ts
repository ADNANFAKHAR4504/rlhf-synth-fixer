/**
 * DynamoDB Component for transaction logging and audit trails
 * Implements point-in-time recovery, encryption, and auto-scaling
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DynamoDBComponentArgs {
  environmentSuffix: string;
  environment: 'dev' | 'staging' | 'prod';
  kmsKeyId: pulumi.Input<string>;
  readCapacity?: number;
  writeCapacity?: number;
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

export class DynamoDBComponent extends pulumi.ComponentResource {
  public readonly transactionTableArn: pulumi.Output<string>;
  public readonly transactionTableName: pulumi.Output<string>;
  public readonly auditTableArn: pulumi.Output<string>;
  public readonly auditTableName: pulumi.Output<string>;

  constructor(
    name: string,
    args: DynamoDBComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:dynamodb:DynamoDBComponent', name, {}, opts);

    const { environmentSuffix, environment, kmsKeyId, tags } = args;

    // Read/write capacity based on environment
    const readCapacity = args.readCapacity || (environment === 'prod' ? 10 : 5);
    const writeCapacity =
      args.writeCapacity || (environment === 'prod' ? 10 : 5);

    // Transaction table for payment processing
    const transactionTable = new aws.dynamodb.Table(
      `transactions-${environmentSuffix}`,
      {
        name: `transactions-${environmentSuffix}`,
        billingMode: 'PROVISIONED',
        readCapacity,
        writeCapacity,
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'userId', type: 'S' },
          { name: 'status', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'UserIdIndex',
            hashKey: 'userId',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
            readCapacity,
            writeCapacity,
          },
          {
            name: 'StatusIndex',
            hashKey: 'status',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
            readCapacity,
            writeCapacity,
          },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKeyId,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        ttl: {
          enabled: true,
          attributeName: 'expirationTime',
        },
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `transactions-${environmentSuffix}`,
          Component: 'DynamoDB',
        })),
      },
      { parent: this }
    );

    // Audit table for compliance and regulatory requirements
    const auditTable = new aws.dynamodb.Table(
      `audit-${environmentSuffix}`,
      {
        name: `audit-${environmentSuffix}`,
        billingMode: 'PROVISIONED',
        readCapacity: environment === 'prod' ? 5 : 2,
        writeCapacity: environment === 'prod' ? 5 : 2,
        hashKey: 'auditId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'auditId', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'resourceId', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'ResourceIdIndex',
            hashKey: 'resourceId',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
            readCapacity: environment === 'prod' ? 5 : 2,
            writeCapacity: environment === 'prod' ? 5 : 2,
          },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKeyId,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        streamEnabled: false,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `audit-${environmentSuffix}`,
          Component: 'DynamoDB',
        })),
      },
      { parent: this }
    );

    // Auto-scaling for transaction table
    const transactionTableReadTarget = new aws.appautoscaling.Target(
      `transactions-read-target-${environmentSuffix}`,
      {
        maxCapacity: environment === 'prod' ? 100 : 50,
        minCapacity: readCapacity,
        resourceId: pulumi.interpolate`table/${transactionTable.name}`,
        scalableDimension: 'dynamodb:table:ReadCapacityUnits',
        serviceNamespace: 'dynamodb',
      },
      { parent: this }
    );

    const transactionTableWriteTarget = new aws.appautoscaling.Target(
      `transactions-write-target-${environmentSuffix}`,
      {
        maxCapacity: environment === 'prod' ? 100 : 50,
        minCapacity: writeCapacity,
        resourceId: pulumi.interpolate`table/${transactionTable.name}`,
        scalableDimension: 'dynamodb:table:WriteCapacityUnits',
        serviceNamespace: 'dynamodb',
      },
      { parent: this }
    );

    // Auto-scaling policies
    new aws.appautoscaling.Policy(
      `transactions-read-policy-${environmentSuffix}`,
      {
        name: pulumi.interpolate`DynamoDBReadCapacityUtilization-${transactionTable.name}`,
        policyType: 'TargetTrackingScaling',
        resourceId: transactionTableReadTarget.resourceId,
        scalableDimension: transactionTableReadTarget.scalableDimension,
        serviceNamespace: transactionTableReadTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'DynamoDBReadCapacityUtilization',
          },
          targetValue: 70,
        },
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `transactions-write-policy-${environmentSuffix}`,
      {
        name: pulumi.interpolate`DynamoDBWriteCapacityUtilization-${transactionTable.name}`,
        policyType: 'TargetTrackingScaling',
        resourceId: transactionTableWriteTarget.resourceId,
        scalableDimension: transactionTableWriteTarget.scalableDimension,
        serviceNamespace: transactionTableWriteTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'DynamoDBWriteCapacityUtilization',
          },
          targetValue: 70,
        },
      },
      { parent: this }
    );

    this.transactionTableArn = transactionTable.arn;
    this.transactionTableName = transactionTable.name;
    this.auditTableArn = auditTable.arn;
    this.auditTableName = auditTable.name;

    this.registerOutputs({
      transactionTableArn: this.transactionTableArn,
      transactionTableName: this.transactionTableName,
      auditTableArn: this.auditTableArn,
      auditTableName: this.auditTableName,
    });
  }
}
