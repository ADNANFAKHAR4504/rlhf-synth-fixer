# Task: Build Serverless Payment Event Processing Pipeline using CDK

## Background
I'm working on a fintech startup project that needs a serverless event processing system to handle real-time payment notifications. The system should process incoming webhook events, validate them, store transaction records, and trigger downstream notifications while maintaining high reliability and cost efficiency.

## What I Need
I need you to help me implement a CDK (AWS Cloud Development Kit) program in TypeScript that deploys a complete serverless payment event processing pipeline on AWS.

**IMPORTANT**: I already have an existing stack file at `lib/tap-stack.ts`. Please UPDATE this existing file - don't create any new stack files. The current file has the basic structure with `TapStack` class and `environmentSuffix` already set up.

## Existing Code Structure
Here's what I currently have in `lib/tap-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```

You need to update this file by adding all the necessary resources inside the constructor.

## Requirements

### 1. API Gateway Setup
- Deploy an API Gateway REST API with request validation
- Create a webhook endpoint that accepts POST requests at `/payments/webhook`
- Implement request throttling at **1000 requests per second**

### 2. Payment Validation Lambda
- Create a Lambda function using **Python 3.11**
- This function should validate incoming payment events against a JSON schema
- Enrich events with metadata (timestamp, request ID, etc.)
- Memory: **512MB**
- Timeout: **60 seconds**
- Enable **X-Ray tracing**
- Use **AWS Lambda Powertools** for structured logging and tracing
- Must be deployed within a **VPC with private subnets**

### 3. DynamoDB Storage
- Set up a DynamoDB table with **on-demand billing**
- Partition key: `payment_id`
- Sort key: `timestamp`
- Enable **point-in-time recovery** for data protection

### 4. Dead Letter Queue
- Implement a dead letter queue using **SQS**
- Retention period: **14 days**
- This should catch failed processing attempts

### 5. EventBridge Rule for High-Value Transactions
- Configure an EventBridge rule that triggers when payments exceed **$10,000**
- Include error handling with a **separate DLQ** for the EventBridge rule

### 6. Notification Lambda and SNS
- Create a second Lambda function to send notifications
- This Lambda should publish messages to an **SNS topic** for high-value transactions
- Same specs as first Lambda (512MB, 60s timeout, X-Ray, Powertools, VPC)

### 7. Configuration Management
- Set up Lambda environment variables for configuration
- **Don't hardcode values** - use variables and parameters
- Use **AWS Systems Manager Parameter Store** for storing API keys and configuration

### 8. IAM Roles
- Implement proper IAM roles with **least privilege access** for each component
- Each Lambda should have its own role with only the permissions it needs

### 9. Error Handling and Reliability
- Implement **exponential backoff retry logic** in Lambda functions for transient failures
- Ensure proper error handling throughout the pipeline

## Important Constraints and Requirements

1. **Update Existing Code Only**: Please modify the existing `lib/tap-stack.ts` file. Do not create new stack files or suggest a different file structure.

2. **Platform**: This is AWS CDK using `aws-cdk-lib` constructs.

3. **Language**: TypeScript for infrastructure code, Python 3.11 for Lambda functions.

4. **VPC Requirement**: All Lambda functions must be deployed within a VPC with private subnets. You'll need to create or reference a VPC.

5. **No Hardcoding**: Use environment variables, parameters, and the `environmentSuffix` variable that's already defined in the stack.

6. **Lambda Powertools**: Make sure to include Lambda Powertools for Python in your Lambda function code/layers.

7. **Naming Convention**: Use the `environmentSuffix` variable in resource names to support multiple environments.

8. **EventBridge DLQ**: EventBridge rules must include error handling with a separate DLQ.

9. **Retry Logic**: Implement exponential backoff retry logic in Lambda functions for transient failures.

10. **Point-in-Time Recovery**: DynamoDB table must enable point-in-time recovery.

## Expected Output

Please provide the complete updated `lib/tap-stack.ts` file with all resources properly configured. Also include any Lambda function code that needs to be created (the Python code for the two Lambda functions).

Make sure all the resources are connected properly:
- API Gateway → Validation Lambda → DynamoDB
- Validation Lambda failures → SQS DLQ
- Successful processing → EventBridge (for high-value transactions)
- EventBridge → Notification Lambda → SNS Topic
- EventBridge failures → Separate DLQ

The architecture should look like this:
1. Payment webhook hits API Gateway
2. API Gateway invokes the Validation Lambda
3. Validation Lambda validates the payment against JSON schema and enriches it
4. Valid payments are stored in DynamoDB
5. If payment amount > $10,000, an event is sent to EventBridge
6. EventBridge triggers the Notification Lambda
7. Notification Lambda publishes to SNS topic
8. Any failures along the way go to their respective DLQs

Let me know if you need any clarification on the requirements!
