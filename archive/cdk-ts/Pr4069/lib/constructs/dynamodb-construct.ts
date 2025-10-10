import * as cdk from 'aws-cdk-lib';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { IDynamoDBConfig } from '../config/environment-config';

export interface DynamoDBConstructProps {
  environment: string;
  config: IDynamoDBConfig;
  budgetLimit: number;
}

export class DynamoDBConstruct extends Construct {
  public readonly tables: { [key: string]: dynamodb.Table } = {};

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);

    props.config.tables.forEach(tableConfig => {
      const table = new dynamodb.Table(this, tableConfig.name, {
        tableName: `${props.environment}-${tableConfig.name}`,
        partitionKey: {
          name: tableConfig.partitionKey,
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: tableConfig.sortKey
          ? {
              name: tableConfig.sortKey,
              type: dynamodb.AttributeType.STRING,
            }
          : undefined,
        billingMode: dynamodb.BillingMode.PROVISIONED,
        readCapacity: tableConfig.readCapacity,
        writeCapacity: tableConfig.writeCapacity,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: props.environment === 'production',
        },
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy:
          props.environment === 'production'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });

      if (tableConfig.enableAutoScaling) {
        const readScaling = table.autoScaleReadCapacity({
          minCapacity: tableConfig.readCapacity,
          maxCapacity:
            tableConfig.maxReadCapacity || tableConfig.readCapacity * 10,
        });

        readScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60),
        });

        const writeScaling = table.autoScaleWriteCapacity({
          minCapacity: tableConfig.writeCapacity,
          maxCapacity:
            tableConfig.maxWriteCapacity || tableConfig.writeCapacity * 10,
        });

        writeScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60),
        });
      }

      this.tables[tableConfig.name] = table;
      cdk.Tags.of(table).add(
        'Name',
        `${props.environment}-${tableConfig.name}`
      );
    });

    new budgets.CfnBudget(this, 'DynamoDBBudget', {
      budget: {
        budgetName: `${props.environment}-dynamodb-budget`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: props.budgetLimit,
          unit: 'USD',
        },
        costFilters: {
          Service: ['Amazon DynamoDB'],
          TagKeyValue: ['user:Department$Engineering'],
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'budget-alerts@example.com',
            },
          ],
        },
      ],
    });
  }
}
