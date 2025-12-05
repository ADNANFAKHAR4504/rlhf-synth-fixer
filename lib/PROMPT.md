# Infrastructure QA and Management

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDK with TypeScript**
> 
> Platform: **CDK**  
> Language: **TypeScript**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
Your organization has deployed multiple CDK stacks across different environments without proper drift detection. Recent incidents have shown that manual console changes are causing configuration drift, making it difficult to maintain infrastructure consistency. You need to build an automated analysis tool that can detect and report infrastructure drift across all CDK stacks.

## Problem Statement
Create a CDK TypeScript program to build an automated infrastructure drift detection system. The configuration must:

1. Define a Lambda function that uses AWS SDK to detect drift in all CloudFormation stacks
2. Create a DynamoDB table to store drift detection results with stack name and timestamp
3. Set up an EventBridge rule to trigger the Lambda function every 6 hours
4. Configure SNS topic for drift alert notifications with email subscription
5. Implement Lambda logic to call detectStackDrift and describeStackDriftDetectionStatus APIs
6. Store drift results in DynamoDB including drift status, drifted resources count, and detection timestamp
7. Send SNS notification containing stack name and drifted resource details when drift is found
8. Grant Lambda appropriate IAM permissions for CloudFormation read operations and DynamoDB write access

Expected output: A complete CDK application that deploys an automated drift detection system capable of analyzing all CloudFormation stacks in the account, storing historical drift data, and alerting operations teams when infrastructure configuration deviates from the defined state.

## Constraints and Requirements
- Analysis must exclude stacks with 'test' or 'sandbox' in their names
- DynamoDB table must use on-demand billing mode to handle variable workload
- Lambda timeout must be set to 15 minutes to handle large stack analysis
- Must use CDK's built-in drift detection capabilities without external tools
- Analysis must run as a Lambda function triggered by EventBridge on a schedule
- Results must be stored in DynamoDB with partition key as stack name and sort key as timestamp
- SNS notifications must be sent only when drift is detected, not for clean runs
- Lambda function must have read-only IAM permissions to CloudFormation stacks

## Environment Setup
AWS infrastructure analysis system deployed in us-east-1 using Lambda for scheduled drift detection, DynamoDB for storing analysis results, SNS for alerts, and EventBridge for scheduling. Requires CDK 2.x with TypeScript, Node.js 18.x runtime. The analysis tool operates across multiple AWS accounts using cross-account IAM roles. All resources deployed in a dedicated VPC with private subnets for Lambda execution. CloudFormation stacks across the organization range from simple S3 buckets to complex multi-service architectures.

---

## Implementation Guidelines

### Platform Requirements
- Use CDK as the IaC framework
- All code must be written in TypeScript
- Follow CDK best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}` or `{resource-name}-${props.environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**: 
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### Lambda Functions
- **Node.js 18.x+**: Do NOT use `require('aws-sdk')` - AWS SDK v2 not available
  - Use AWS SDK v3: `import { CloudFormationClient, DetectStackDriftCommand, DescribeStackDriftDetectionStatusCommand } from '@aws-sdk/client-cloudformation'`
  - Use `import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'`
  - Use `import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'`
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
- **Timeout**: Set to 15 minutes (900 seconds) as per constraints

#### DynamoDB
- **Billing Mode**: Must use ON_DEMAND (PAY_PER_REQUEST) as per constraints
- **Table Design**: 
  - Partition key: stack name (string)
  - Sort key: timestamp (string or number)
- **Deletion Protection**: Set to false for destroyability

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Cross-Resource References
- Ensure all resource references use proper ARNs or resource objects
- Verify dependencies are explicit (use `dependsOn` in CDK)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CDK TypeScript)
```typescript
const driftTable = new dynamodb.Table(this, 'DriftTable', {
  tableName: `drift-detection-${environmentSuffix}`,  // CORRECT
  partitionKey: { name: 'stackName', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,  // ON_DEMAND as required
  removalPolicy: RemovalPolicy.DESTROY,  // Destroyable
});

const driftFunction = new lambda.Function(this, 'DriftFunction', {
  functionName: `drift-detector-${environmentSuffix}`,  // CORRECT
  runtime: lambda.Runtime.NODEJS_18_X,
  timeout: Duration.minutes(15),  // 15 minutes as required
  // ...
});

const alertTopic = new sns.Topic(this, 'AlertTopic', {
  topicName: `drift-alerts-${environmentSuffix}`,  // CORRECT
});

// WRONG:
// tableName: 'drift-detection-prod'  // Hardcoded, will fail
```

### Correct Removal Policy (CDK TypeScript)
```typescript
const table = new dynamodb.Table(this, 'DriftTable', {
  removalPolicy: RemovalPolicy.DESTROY,  // CORRECT
  // ...
});

// WRONG:
// removalPolicy: RemovalPolicy.RETAIN  // Will block cleanup
```

### Correct Lambda Function with AWS SDK v3 (Node.js 18.x)
```typescript
// Lambda handler code (lib/drift-detector.ts)
import { CloudFormationClient, DetectStackDriftCommand, DescribeStackDriftDetectionStatusCommand } from '@aws-sdk/client-cloudformation';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// WRONG:
// const AWS = require('aws-sdk');  // AWS SDK v2 not available in Node.js 18.x
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- Lambda function can detect drift in CloudFormation stacks
- DynamoDB table stores drift detection results
- EventBridge rule triggers Lambda every 6 hours
- SNS sends alerts only when drift is detected
- All stacks with 'test' or 'sandbox' in names are excluded
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
