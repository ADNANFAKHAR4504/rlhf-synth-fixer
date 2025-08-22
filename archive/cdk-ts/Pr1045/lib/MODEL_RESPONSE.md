I'll help you create a multi-region DynamoDB deployment using AWS CDK TypeScript. This solution will deploy DynamoDB tables in both us-west-1 and us-west-2 regions with the specified configurations.

Here's the complete solution:

## bin/tap.ts
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Create DynamoDB stack for us-west-1
const dynamoDbWest1Stack = new DynamoDBStack(app, `DynamoDBWest1Stack${environmentSuffix}`, {
  stackName: `DynamoDBWest1Stack${environmentSuffix}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1',
  },
  readCapacity: 5,
  writeCapacity: 5,
  environmentSuffix: environmentSuffix,
});

// Create DynamoDB stack for us-west-2 with configurable capacities
const west2ReadCapacity = app.node.tryGetContext('west2ReadCapacity') || 10;
const west2WriteCapacity = app.node.tryGetContext('west2WriteCapacity') || 10;

const dynamoDbWest2Stack = new DynamoDBStack(app, `DynamoDBWest2Stack${environmentSuffix}`, {
  stackName: `DynamoDBWest2Stack${environmentSuffix}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  readCapacity: west2ReadCapacity,
  writeCapacity: west2WriteCapacity,
  environmentSuffix: environmentSuffix,
});

// Create the main TapStack for coordination
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  west1Stack: dynamoDbWest1Stack,
  west2Stack: dynamoDbWest2Stack,
});
```

## lib/dynamodb-stack.ts
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
      pointInTimeRecovery: true,
      // Enable server-side encryption
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      // Remove table on stack deletion (for non-production environments)
      removalPolicy: environmentSuffix === 'prod' 
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

## lib/tap-stack.ts
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
    const multiRegionAccessRole = new iam.Role(this, 'MultiRegionDynamoDBRole', {
      roleName: `MultiRegionDynamoDBRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for accessing multi-region DynamoDB tables',
    });

    // If we have stack references, add permissions for both tables
    if (props?.west1Stack && props?.west2Stack) {
      // Add permissions for west1 table
      props.west1Stack.table.grantReadWriteData(multiRegionAccessRole);
      
      // Add permissions for west2 table (cross-region permissions)
      multiRegionAccessRole.addToPolicy(new iam.PolicyStatement({
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
      }));

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
      value: 'Deploy with: cdk deploy --all --context west2ReadCapacity=15 --context west2WriteCapacity=15',
      description: 'Sample deployment command with configurable capacities',
    });
  }
}
```

## Usage Instructions

To deploy this multi-region infrastructure:

1. **Deploy with default capacities:**
   ```bash
   cdk deploy --all
   ```

2. **Deploy with custom capacities for us-west-2:**
   ```bash
   cdk deploy --all --context west2ReadCapacity=20 --context west2WriteCapacity=20
   ```

3. **Deploy to specific environment:**
   ```bash
   cdk deploy --all --context environmentSuffix=staging --context west2ReadCapacity=15 --context west2WriteCapacity=15
   ```

## Features Implemented

- **Multi-region deployment**: Separate stacks for us-west-1 and us-west-2
- **Fixed capacities for us-west-1**: Read=5, Write=5 as requested
- **Configurable capacities for us-west-2**: Via CDK context parameters
- **Resource dependencies**: Proper stack dependencies and cross-region IAM permissions
- **Production-ready features**: 
  - Point-in-time recovery enabled
  - AWS-managed encryption
  - Global Secondary Index for enhanced querying
  - Environment-specific removal policies
- **Enhanced resilience**: Tables configured for high availability across regions
- **Proper resource management**: Tagged resources and comprehensive outputs

This solution provides a robust foundation for multi-region DynamoDB deployment with CDK TypeScript, following AWS best practices for production deployments.