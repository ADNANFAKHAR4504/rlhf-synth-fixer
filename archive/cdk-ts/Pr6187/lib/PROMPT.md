# Serverless Transaction Processing Pipeline

Hey team,

We need to build a serverless transaction processing pipeline for our financial services application. I've been asked to create this in TypeScript using AWS CDK. The business wants a system that can process daily transaction batches through multiple validation steps - fraud detection, compliance checks, and risk assessment - before storing them for audit purposes.

The current manual process is too slow and error-prone. We need an automated pipeline that can handle thousands of transactions per day with proper error handling and retry logic. Each transaction needs to pass through three validation stages sequentially, and we need full audit trails of all processing steps.

The system should be cost-effective using serverless technologies, and everything needs to be tagged properly for our production environment tracking.

## What we need to build

Create a serverless transaction processing system using **AWS CDK with TypeScript** that orchestrates Lambda functions through Step Functions for automated transaction validation.

### Core Requirements

1. **Lambda Functions**
   - Create fraud-detector function with 512MB memory and 60 second timeout
   - Create compliance-checker function with 512MB memory and 60 second timeout
   - Create risk-assessor function with 512MB memory and 60 second timeout
   - All functions must use Node.js 18.x runtime
   - Each function needs environment variables for DynamoDB table names

2. **Step Functions State Machine**
   - Use Map state for parallel processing of transaction batches
   - Invoke Lambda functions in sequence: fraud-detector, then compliance-checker, then risk-assessor
   - Pass transaction IDs between functions using input/output processing
   - Store successful results in transactions-processed table with timestamp

3. **DynamoDB Tables**
   - Create transactions-raw table with on-demand billing mode
   - Create transactions-processed table with on-demand billing mode
   - Tables should be destroyable without retain policies

4. **CloudWatch Logs**
   - Enable logging for Step Functions execution history
   - Set 30-day retention period for logs

5. **Error Handling**
   - Implement 3 retry attempts with exponential backoff
   - Use backoff intervals: 2 seconds, 4 seconds, 8 seconds
   - Handle failures gracefully at each step

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS Lambda for transaction processing functions
- Use AWS Step Functions for orchestration
- Use Amazon DynamoDB for data storage
- Use Amazon CloudWatch for logging and monitoring
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- IAM roles automatically managed by CDK

### Constraints

- Lambda functions: exactly 512MB memory allocation
- Lambda functions: exactly 60 second timeout
- Lambda runtime: Node.js 18.x only
- DynamoDB billing: on-demand mode only
- All resources must be destroyable with no Retain policies
- Step Functions must use Map state for parallel processing
- Error handling must use exponential backoff strategy
- All resources tagged with Environment=production and Application=transaction-processor

## Success Criteria

- Functionality: Three Lambda functions process transactions sequentially
- Orchestration: Step Functions coordinates the workflow with Map state
- Storage: DynamoDB tables store raw and processed transactions
- Monitoring: CloudWatch captures Step Functions execution logs with 30-day retention
- Error Handling: Retry logic with exponential backoff on failures
- Resource Naming: All resources include environmentSuffix
- Code Quality: TypeScript with proper typing, well-documented
- Tagging: Environment and Application tags applied to all resources

## What to deliver

- Complete AWS CDK TypeScript implementation in lib/tap-stack.ts
- Lambda function code for fraud-detector, compliance-checker, and risk-assessor
- DynamoDB table definitions with on-demand billing
- Step Functions state machine with Map state and error handling
- CloudWatch Logs configuration with retention policy
- IAM roles and permissions managed by CDK
- README with deployment instructions and architecture overview
