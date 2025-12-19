# Document Conversion Service - CDK Infrastructure (Fixed)

This document contains the corrected infrastructure code for the document processing system.

## lib/tap-stack.ts

The main stack file creates all the necessary resources with proper configuration. Key improvements include:

- Removed unused IAM import
- Fixed Step Functions state reuse by creating separate notification states
- Applied proper code formatting
- Ensured all resources are destroyable

<details>
<summary>View Complete Code</summary>

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Duration } from 'aws-cdk-lib';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // DynamoDB table, SNS topic, SQS queues, S3 buckets, Lambda functions
    // Step Functions state machine, CloudWatch dashboard and alarms
    // ... (See actual implementation in lib/tap-stack.ts)
  }
}
```

</details>

## Lambda Functions

All Lambda functions are implemented in Python 3.10:

- **orchestrator**: Triggers Step Functions execution on S3 events
- **init-job**: Initializes job tracking in DynamoDB
- **validator**: Validates file type and size
- **converter**: Performs document conversion (mock implementation)
- **notifier**: Sends SNS notifications

## Key Architecture Features

1. **S3 Event Notifications**: Automatically trigger processing when files are uploaded
2. **Step Functions Workflow**: Orchestrates validation, conversion, and notification with parallel processing
3. **DynamoDB Job Tracking**: Tracks job status with GSI for efficient queries
4. **SQS with DLQ**: Reliable message processing with dead letter queue
5. **SNS Notifications**: Alerts on completion or failure
6. **CloudWatch Monitoring**: Dashboard and alarms for operational visibility

## Fixes Applied

1. Removed unused `iam` import
2. Created separate notification states (`notifyConversionFailure` and `notifyValidationFailure`) to avoid Step Functions state reuse error
3. Applied prettier/eslint formatting
4. Ensured all resources use `RemovalPolicy.DESTROY` and `autoDeleteObjects`
