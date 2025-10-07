Act as an expert AWS CDK engineer using TypeScript (v2). Your task is to create a complete CDK stack that deploys a production-ready DynamoDB table for an inventory management system.

The stack should be configured for the `us-west-2` region and all resources should have a `RemovalPolicy` of `DESTROY`.

The stack must contain the following components:

1. SNS Topic:

- Create a new `aws-sns.Topic` named `inventory-alerts`.

2. DynamoDB Table (`ProductInventory`):

- Create a new `aws-dynamodb.Table` with the following properties:
  - `tableName`: 'ProductInventory'
  - `partitionKey`: `{ name: 'productId', type: dynamodb.AttributeType.STRING }`
  - `sortKey`: `{ name: 'warehouseId', type: dynamodb.AttributeType.STRING }`
  - `billingMode`: `dynamodb.BillingMode.PAY_PER_REQUEST`
  - `pointInTimeRecovery`: `true`
  - `stream`: `dynamodb.StreamViewType.NEW_AND_OLD_IMAGES`
  - `contributorInsightsEnabled`: `true`
  - `timeToLiveAttribute`: 'expirationTime'
  - `encryption`: `dynamodb.TableEncryption.AWS_MANAGED`
  - `deletionProtection`: `true`

3. Local Secondary Index (LSI):

- During the table's creation, add a Local Secondary Index with these properties:
  - `indexName`: 'StatusIndex'
  - `sortKey`: `{ name: 'stockStatus', type: dynamodb.AttributeType.STRING }`
  - `projectionType`: `dynamodb.ProjectionType.ALL`

4. Global Secondary Index (GSI):

- After creating the table, use the `addGlobalSecondaryIndex` method to add a GSI with these properties:
  - `indexName`: 'WarehouseIndex'
  - `partitionKey`: `{ name: 'warehouseId', type: dynamodb.AttributeType.STRING }`
  - `sortKey`: `{ name: 'lastUpdated', type: dynamodb.AttributeType.STRING }`
  - `projectionType`: `dynamodb.ProjectionType.ALL`

5. CloudWatch Alarms:

- Create two `aws-cloudwatch.Alarm` resources that monitor the main table's metrics (`ConsumedReadCapacityUnits` and `ConsumedWriteCapacityUnits`).
- Set an appropriate evaluation period and threshold (e.g., trigger if capacity exceeds 10,000 units for 5 minutes).
- Both alarms must be configured to send notifications to the `inventory-alerts` SNS topic using an `aws-cloudwatch-actions.SnsAction`.

6. Stack Outputs:

- Create two `CfnOutput` constructs to export:
  - The Table ARN (`table.tableArn`).
  - The Table Stream ARN (`table.tableStreamArn`).

Ensure the final output is a single, complete, and well-structured CDK stack file in TypeScript.
