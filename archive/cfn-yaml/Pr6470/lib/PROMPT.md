# Payment Notification Processor Infrastructure

Hey team,

We need to build a serverless payment notification processing system for a financial services company that's dealing with large volumes of payment notifications from third-party providers. The business has asked me to create this using CloudFormation with YAML. They're seeing burst traffic during peak hours and need to ensure absolutely no messages get lost when processing failures occur.

The current challenge is that they're processing payment notifications manually and during high-volume periods, messages are getting dropped. They need a fully automated, fault-tolerant system that can handle the load and guarantee message processing. The architecture needs to be serverless to keep costs down and scale automatically.

I've been asked to implement this in the us-east-1 region using Lambda for the compute layer, SQS for message queuing, and DynamoDB for storing the transaction records. No VPC is needed since all the services are fully managed AWS services.

## What we need to build

Create a serverless payment notification processing system using **CloudFormation with YAML** for a financial services company handling third-party payment notifications.

### Core Requirements

1. **Message Queue Infrastructure**
   - Create SQS standard queue for incoming payment messages
   - Configure server-side encryption on the queue
   - Set up Dead Letter Queue (DLQ) for failed messages with maxReceiveCount of 3
   - DLQ must retain messages for exactly 14 days
   - Queue visibility timeout must be 6 times the Lambda timeout

2. **Lambda Processing Function**
   - Create Lambda function with Python 3.12 runtime to process payment notifications
   - Configure exactly 1024MB of memory
   - Set reserved concurrent executions to 100
   - Configure event source mapping to process SQS messages with batch size of 10
   - Add environment variables for DynamoDB table name and AWS region
   - Encrypt environment variables with default KMS key
   - Inline Lambda code that reads from SQS and writes to DynamoDB

3. **Data Storage**
   - Create DynamoDB table named 'PaymentTransactions'
   - Use 'transactionId' as partition key
   - Configure on-demand billing mode

4. **IAM and Security**
   - Create IAM execution role for Lambda
   - Grant least-privilege permissions: read SQS, write to DynamoDB, create CloudWatch logs
   - No wildcard actions allowed in IAM policies

5. **Logging and Monitoring**
   - Create CloudWatch Log Group for Lambda
   - Set log retention to exactly 30 days

6. **Tagging and Resource Management**
   - Configure all resources with Environment=Production tag
   - All resources must have deletion policy of Delete

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **Lambda** for processing payment notifications
- Use **SQS** for message queuing and fault tolerance
- Use **DynamoDB** for transaction storage
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain policies
- Include proper error handling in Lambda code

### Constraints

- Lambda function memory must be exactly 1024MB
- DynamoDB table must use on-demand billing mode
- SQS queue visibility timeout must be 6 times the Lambda timeout
- Dead letter queue must retain messages for exactly 14 days
- Lambda reserved concurrent executions must be set to 100
- All IAM policies must follow least privilege with no wildcard actions
- CloudWatch log retention must be 30 days for all log groups
- Lambda environment variables must be encrypted with default KMS key
- SQS queue must have server-side encryption enabled
- Stack must include deletion policy of Delete for all resources

## Success Criteria

- **Functionality**: System processes payment notifications from SQS queue and stores in DynamoDB
- **Fault Tolerance**: Failed messages route to DLQ after 3 retry attempts
- **Performance**: Lambda handles batch processing of 10 messages at a time
- **Security**: Least-privilege IAM policies with no wildcard actions
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Python 3.12, well-structured, includes error handling
- **Monitoring**: CloudWatch logs retained for 30 days
- **Scalability**: System handles burst traffic with reserved concurrency of 100

## What to deliver

- Complete CloudFormation YAML implementation in TapStack.yml
- Lambda function with Python 3.12 runtime (inline code)
- SQS standard queue with Dead Letter Queue
- DynamoDB PaymentTransactions table
- Lambda Event Source Mapping for SQS integration
- IAM execution role with least-privilege policies
- CloudWatch Log Group with 30-day retention
- CloudFormation Parameters for EnvironmentSuffix
- CloudFormation Outputs for Queue URL, Lambda ARN, and DynamoDB table name
- All resources properly tagged and configured for deletion
