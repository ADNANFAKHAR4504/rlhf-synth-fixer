# CDK TypeScript Infrastructure Code


## dynamodb-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDBStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  readCapacity: number;
  writeCapacity: number;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';
    const region = this.region;

    // Create DynamoDB table with specified capacity settings
    this.table = new dynamodb.Table(this, 'MultiRegionTable', {
      tableName: `multi-region-table-${region}-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sortKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: props.readCapacity,
      writeCapacity: props.writeCapacity,
      // Enable point-in-time recovery for data protection
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      // Enable server-side encryption
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // Remove table on stack deletion (for non-production environments)
      removalPolicy:
        environmentSuffix === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    // Add a Global Secondary Index for enhanced querying
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'gsi1pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'gsi1sk',
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: Math.max(1, Math.floor(props.readCapacity / 2)),
      writeCapacity: Math.max(1, Math.floor(props.writeCapacity / 2)),
    });

    // Add tags for better resource management
    cdk.Tags.of(this.table).add('Region', region);
    cdk.Tags.of(this.table).add('Purpose', 'MultiRegionDeployment');

    // Output the table name and ARN
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: `DynamoDB table name in ${region}`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: `DynamoDB table ARN in ${region}`,
    });

    new cdk.CfnOutput(this, 'TableCapacities', {
      value: `Read: ${props.readCapacity}, Write: ${props.writeCapacity}`,
      description: `Configured capacities for ${region}`,
    });
  }
}
```


## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { DynamoDBStack } from './dynamodb-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  west1Stack?: DynamoDBStack;
  west2Stack?: DynamoDBStack;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create an IAM role that can access both DynamoDB tables
    const multiRegionAccessRole = new iam.Role(
      this,
      'MultiRegionDynamoDBRole',
      {
        roleName: `MultiRegionDynamoDBRole-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Role for accessing multi-region DynamoDB tables',
      }
    );

    // If we have stack references, add permissions for both tables
    if (props?.west1Stack && props?.west2Stack) {
      // Add permissions for west1 table
      props.west1Stack.table.grantReadWriteData(multiRegionAccessRole);

      // Add permissions for west2 table (cross-region permissions)
      multiRegionAccessRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:BatchGetItem',
            'dynamodb:BatchWriteItem',
          ],
          resources: [
            props.west2Stack.table.tableArn,
            `${props.west2Stack.table.tableArn}/*`,
          ],
        })
      );

      // Output cross-region access information
      new cdk.CfnOutput(this, 'MultiRegionRoleArn', {
        value: multiRegionAccessRole.roleArn,
        description: 'IAM role for multi-region DynamoDB access',
      });

      new cdk.CfnOutput(this, 'West1TableName', {
        value: props.west1Stack.table.tableName,
        description: 'DynamoDB table name in us-west-1',
      });

      new cdk.CfnOutput(this, 'West2TableName', {
        value: props.west2Stack.table.tableName,
        description: 'DynamoDB table name in us-west-2',
      });
    }

    // Add deployment instructions as an output
    new cdk.CfnOutput(this, 'DeploymentInstructions', {
      value:
        'Deploy with: cdk deploy --all --context west2ReadCapacity=15 --context west2WriteCapacity=15',
      description: 'Sample deployment command with configurable capacities',
    });
  }
}
```
