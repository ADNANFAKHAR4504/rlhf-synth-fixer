# Serverless Webhook Processing System

Hi team,

We need to build a serverless webhook processing system that can receive, validate, and process incoming webhooks at scale. The business wants to handle webhooks from multiple external partners and route them through different processing pipelines based on webhook type. This needs to be reliable, scalable, and cost-effective.

The architecture should follow event-driven patterns with proper error handling and dead-letter queues for failed processing attempts. We're targeting the ap-southeast-1 region for this deployment.

## What we need to build

Create a serverless webhook processing system using **Terraform with HCL** for infrastructure definition.

### Core Requirements

1. **API Gateway**
   - REST API to receive incoming webhooks
   - POST endpoint for webhook ingestion
   - Request validation enabled
   - Deploy to production stage

2. **Lambda Functions**
   - Webhook validator function (validates incoming webhook payload)
   - Webhook processor function (processes validated webhooks)
   - Webhook notifier function (sends notifications for completed processing)
   - Each function with 512MB memory, 30 second timeout
   - Reserved concurrent executions of 100 per function

3. **SQS Queues**
   - Validation queue (receives webhooks from API Gateway)
   - Processing queue (receives validated webhooks)
   - Notification queue (receives processed webhook results)
   - Each main queue with 300 second visibility timeout
   - Dead-letter queues for each main queue
   - DLQ max receive count of 3

4. **Integration Flow**
   - API Gateway → Validation Queue
   - Validation Queue → Validator Lambda → Processing Queue
   - Processing Queue → Processor Lambda → Notification Queue
   - Notification Queue → Notifier Lambda

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **API Gateway** for webhook endpoint
- Use **Lambda** for serverless compute
- Use **SQS** for queue-based messaging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-environment-suffix`
- Deploy to **ap-southeast-1** region

### Constraints

- All resources must be destroyable (no Retain policies)
- Include proper IAM permissions for service integrations
- Lambda functions must have CloudWatch Logs permissions
- API Gateway must have SQS send message permissions
- Lambda functions must have SQS receive/delete/send permissions
- Use appropriate encryption for queues (SSE-SQS)

## Success Criteria

- **Functionality**: Complete webhook ingestion and processing pipeline
- **Performance**: Sub-second API response, async processing
- **Reliability**: DLQs for failure handling, retry mechanisms
- **Security**: Proper IAM least-privilege access, encryption at rest
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: HCL, well-structured, modular

## What to deliver

- Complete Terraform HCL implementation
- API Gateway REST API
- 3 Lambda functions (validator, processor, notifier)
- 6 SQS queues (3 main + 3 DLQ)
- IAM roles and policies
- CloudWatch log groups
- Output values for API endpoint and queue URLs
