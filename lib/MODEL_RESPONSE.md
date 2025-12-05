# CDK TypeScript Infrastructure - Drift Detection System

Complete implementation of automated infrastructure drift detection system using AWS CDK with TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  alertEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, alertEmail } = props;

    // DynamoDB table to store drift detection results
    const driftTable = new dynamodb.Table(this, 'DriftTable', {
      tableName: `drift-detection-${environmentSuffix}`,
      partitionKey: {
        name: 'stackName',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: false,
    });

    // SNS topic for drift alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `drift-alerts-${environmentSuffix}`,
      displayName: 'CloudFormation Drift Detection Alerts',
    });

    // Add email subscription if provided
    if (alertEmail) {
      alertTopic.addSubscription(
        new subscriptions.EmailSubscription(alertEmail)
      );
    }

    // Lambda function for drift detection
    const driftFunction = new lambda.Function(this, 'DriftFunction', {
      functionName: `drift-detector-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        DRIFT_TABLE_NAME: driftTable.tableName,
        ALERT_TOPIC_ARN: alertTopic.topicArn,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
    });

    // Grant Lambda permissions to read CloudFormation stacks
    driftFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:DescribeStacks',
          'cloudformation:ListStacks',
          'cloudformation:DetectStackDrift',
          'cloudformation:DescribeStackDriftDetectionStatus',
          'cloudformation:DescribeStackResourceDrifts',
        ],
        resources: ['*'],
      })
    );

    // Grant Lambda permissions to write to DynamoDB
    driftTable.grantWriteData(driftFunction);

    // Grant Lambda permissions to publish to SNS
    alertTopic.grantPublish(driftFunction);

    // EventBridge rule to trigger Lambda every 6 hours
    const driftSchedule = new events.Rule(this, 'DriftSchedule', {
      ruleName: `drift-detection-schedule-${environmentSuffix}`,
      description: 'Triggers drift detection every 6 hours',
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
    });

    driftSchedule.addTarget(new targets.LambdaFunction(driftFunction));

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DriftTableName', {
      value: driftTable.tableName,
      description: 'DynamoDB table for drift detection results',
      exportName: `DriftTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DriftFunctionName', {
      value: driftFunction.functionName,
      description: 'Lambda function for drift detection',
      exportName: `DriftFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS topic for drift alerts',
      exportName: `AlertTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ScheduleRuleName', {
      value: driftSchedule.ruleName,
      description: 'EventBridge rule for drift detection schedule',
      exportName: `ScheduleRuleName-${environmentSuffix}`,
    });
  }
}
```

## File: lib/lambda/index.ts

```typescript
import {
  CloudFormationClient,
  DetectStackDriftCommand,
  DescribeStackDriftDetectionStatusCommand,
  DescribeStackResourceDriftsCommand,
  ListStacksCommand,
  StackStatus,
  StackDriftDetectionStatus,
  StackDriftStatus,
} from '@aws-sdk/client-cloudformation';
import {
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  SNSClient,
  PublishCommand,
} from '@aws-sdk/client-sns';

const region = process.env.AWS_REGION || 'us-east-1';
const cfnClient = new CloudFormationClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const snsClient = new SNSClient({ region });

const DRIFT_TABLE_NAME = process.env.DRIFT_TABLE_NAME!;
const ALERT_TOPIC_ARN = process.env.ALERT_TOPIC_ARN!;

interface DriftResult {
  stackName: string;
  driftStatus: StackDriftStatus;
  driftedResourcesCount: number;
  detectionTimestamp: number;
  driftedResources: Array<{
    logicalResourceId: string;
    resourceType: string;
    driftStatus: string;
  }>;
}

export const handler = async (event: any): Promise<void> => {
  console.log('Starting drift detection process', JSON.stringify(event));

  try {
    // Get all CloudFormation stacks
    const stacks = await listAllStacks();
    console.log(`Found ${stacks.length} stacks to analyze`);

    // Filter out test and sandbox stacks
    const filteredStacks = stacks.filter(
      (stackName) =>
        !stackName.toLowerCase().includes('test') &&
        !stackName.toLowerCase().includes('sandbox')
    );
    console.log(`Analyzing ${filteredStacks.length} stacks after filtering`);

    // Detect drift for each stack
    const driftResults: DriftResult[] = [];
    for (const stackName of filteredStacks) {
      try {
        const result = await detectStackDrift(stackName);
        driftResults.push(result);
      } catch (error) {
        console.error(`Error detecting drift for stack ${stackName}:`, error);
      }
    }

    // Store results in DynamoDB
    await Promise.all(
      driftResults.map((result) => storeDriftResult(result))
    );

    // Send alerts for stacks with drift
    const driftedStacks = driftResults.filter(
      (result) =>
        result.driftStatus === StackDriftStatus.DRIFTED
    );

    if (driftedStacks.length > 0) {
      await sendDriftAlert(driftedStacks);
    }

    console.log(
      `Drift detection complete. ${driftedStacks.length} stack(s) with drift detected`
    );
  } catch (error) {
    console.error('Error in drift detection process:', error);
    throw error;
  }
};

async function listAllStacks(): Promise<string[]> {
  const stacks: string[] = [];
  let nextToken: string | undefined;

  do {
    const command = new ListStacksCommand({
      NextToken: nextToken,
      StackStatusFilter: [
        StackStatus.CREATE_COMPLETE,
        StackStatus.UPDATE_COMPLETE,
        StackStatus.UPDATE_ROLLBACK_COMPLETE,
        StackStatus.IMPORT_COMPLETE,
      ],
    });

    const response = await cfnClient.send(command);

    if (response.StackSummaries) {
      stacks.push(
        ...response.StackSummaries.map((s) => s.StackName!).filter(Boolean)
      );
    }

    nextToken = response.NextToken;
  } while (nextToken);

  return stacks;
}

async function detectStackDrift(stackName: string): Promise<DriftResult> {
  console.log(`Detecting drift for stack: ${stackName}`);

  // Initiate drift detection
  const detectCommand = new DetectStackDriftCommand({
    StackName: stackName,
  });
  const detectResponse = await cfnClient.send(detectCommand);
  const driftDetectionId = detectResponse.StackDriftDetectionId!;

  // Wait for drift detection to complete
  let detectionStatus = StackDriftDetectionStatus.DETECTION_IN_PROGRESS;
  let driftStatus: StackDriftStatus = StackDriftStatus.NOT_CHECKED;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5 seconds * 60)

  while (
    detectionStatus === StackDriftDetectionStatus.DETECTION_IN_PROGRESS &&
    attempts < maxAttempts
  ) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statusCommand = new DescribeStackDriftDetectionStatusCommand({
      StackDriftDetectionId: driftDetectionId,
    });
    const statusResponse = await cfnClient.send(statusCommand);

    detectionStatus = statusResponse.DetectionStatus!;
    driftStatus = statusResponse.StackDriftStatus!;
    attempts++;
  }

  if (detectionStatus !== StackDriftDetectionStatus.DETECTION_COMPLETE) {
    throw new Error(
      `Drift detection did not complete for stack ${stackName}. Status: ${detectionStatus}`
    );
  }

  // Get drifted resources if drift detected
  let driftedResources: Array<{
    logicalResourceId: string;
    resourceType: string;
    driftStatus: string;
  }> = [];
  let driftedResourcesCount = 0;

  if (driftStatus === StackDriftStatus.DRIFTED) {
    const driftsCommand = new DescribeStackResourceDriftsCommand({
      StackName: stackName,
      StackResourceDriftStatusFilters: ['MODIFIED', 'DELETED'],
    });

    try {
      const driftsResponse = await cfnClient.send(driftsCommand);
      if (driftsResponse.StackResourceDrifts) {
        driftedResourcesCount = driftsResponse.StackResourceDrifts.length;
        driftedResources = driftsResponse.StackResourceDrifts.map((drift) => ({
          logicalResourceId: drift.LogicalResourceId!,
          resourceType: drift.ResourceType!,
          driftStatus: drift.StackResourceDriftStatus!,
        }));
      }
    } catch (error) {
      console.error(`Error getting drifted resources for ${stackName}:`, error);
    }
  }

  return {
    stackName,
    driftStatus,
    driftedResourcesCount,
    detectionTimestamp: Date.now(),
    driftedResources,
  };
}

async function storeDriftResult(result: DriftResult): Promise<void> {
  const command = new PutItemCommand({
    TableName: DRIFT_TABLE_NAME,
    Item: {
      stackName: { S: result.stackName },
      timestamp: { N: result.detectionTimestamp.toString() },
      driftStatus: { S: result.driftStatus },
      driftedResourcesCount: { N: result.driftedResourcesCount.toString() },
      driftedResources: {
        S: JSON.stringify(result.driftedResources),
      },
    },
  });

  await dynamoClient.send(command);
  console.log(`Stored drift result for stack: ${result.stackName}`);
}

async function sendDriftAlert(driftedStacks: DriftResult[]): Promise<void> {
  const stackDetails = driftedStacks
    .map(
      (stack) =>
        `
Stack Name: ${stack.stackName}
Drift Status: ${stack.driftStatus}
Drifted Resources: ${stack.driftedResourcesCount}
Detection Time: ${new Date(stack.detectionTimestamp).toISOString()}

Drifted Resources Details:
${stack.driftedResources.map((r) => `  - ${r.logicalResourceId} (${r.resourceType}): ${r.driftStatus}`).join('\n')}
`
    )
    .join('\n---\n');

  const message = `
Infrastructure Drift Detected

${driftedStacks.length} CloudFormation stack(s) have configuration drift:

${stackDetails}

Please review and remediate the drifted resources to maintain infrastructure consistency.
  `.trim();

  const command = new PublishCommand({
    TopicArn: ALERT_TOPIC_ARN,
    Subject: `Infrastructure Drift Alert - ${driftedStacks.length} Stack(s) Affected`,
    Message: message,
  });

  await snsClient.send(command);
  console.log(`Sent drift alert for ${driftedStacks.length} stack(s)`);
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const alertEmail = app.node.tryGetContext('alertEmail');

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  alertEmail,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Automated CloudFormation drift detection system',
});

app.synth();
```

## File: lib/lambda/package.json

```json
{
  "name": "drift-detector-lambda",
  "version": "1.0.0",
  "description": "Lambda function for CloudFormation drift detection",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-cloudformation": "^3.400.0",
    "@aws-sdk/client-dynamodb": "^3.400.0",
    "@aws-sdk/client-sns": "^3.400.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## File: lib/lambda/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

## Deployment Instructions

### Prerequisites

1. Node.js 18.x or later
2. AWS CDK CLI installed: `npm install -g aws-cdk`
3. AWS credentials configured

### Installation

```bash
npm install
```

### Build Lambda Function

```bash
cd lib/lambda
npm install
npm run build
cd ../..
```

### Deploy

```bash
# Deploy with default environment suffix
cdk deploy --context environmentSuffix=dev

# Deploy with custom environment suffix and email alert
cdk deploy --context environmentSuffix=prod --context alertEmail=ops@example.com
```

### Testing the Drift Detection

After deployment, you can manually invoke the Lambda function to test:

```bash
aws lambda invoke \
  --function-name drift-detector-dev \
  --payload '{}' \
  response.json
```

Check the DynamoDB table for results:

```bash
aws dynamodb scan --table-name drift-detection-dev
```

### Cleanup

```bash
cdk destroy --context environmentSuffix=dev
```

## Architecture

- **Lambda Function**: Scans all CloudFormation stacks, initiates drift detection, and processes results
- **DynamoDB Table**: Stores drift detection history with stack name and timestamp
- **EventBridge Rule**: Triggers Lambda every 6 hours for automated drift monitoring
- **SNS Topic**: Sends email alerts when drift is detected
- **IAM Permissions**: Lambda has read-only access to CloudFormation and write access to DynamoDB/SNS

## Key Features

1. Excludes test and sandbox stacks from analysis
2. Uses on-demand DynamoDB billing for cost efficiency
3. 15-minute Lambda timeout for large stack analysis
4. AWS SDK v3 for Node.js 18.x compatibility
5. Detailed drift information including resource-level changes
6. Email notifications only when drift detected
7. Historical drift tracking in DynamoDB
8. Fully destroyable infrastructure for CI/CD
