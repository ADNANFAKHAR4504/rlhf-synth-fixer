# Serverless Webhook Processing System

Hey team,

We need to build a high-performance webhook processing infrastructure for a fintech startup. They're dealing with payment webhooks from multiple providers and need something that can handle serious traffic spikes during peak hours without dropping events. The business wants this built using **Pulumi with TypeScript** so we can maintain type safety and have a good developer experience.

The challenge here is handling burst traffic. During peak hours, they might see 10,000+ requests per second, and every single webhook matters in fintech. We need a system that's resilient, scalable, and cost-effective. The architecture should be serverless to avoid paying for idle capacity, but it needs to scale instantly when traffic hits.

I've been asked to design a complete event processing pipeline: webhooks come in through API Gateway, get processed by Lambda functions, stored in DynamoDB for quick access, and archived to S3 for long-term retention. The system needs proper observability with CloudWatch alarms and X-Ray tracing so we can catch issues before they become problems.

## What we need to build

Create a serverless webhook processing system using **Pulumi with TypeScript** that can handle high-volume payment webhook events from multiple providers.

### Core Requirements

1. **API Gateway Setup**
   - Deploy a REST API with throttling configured for 10,000 requests per second
   - Implement API key authentication for webhook endpoints
   - Use AWS_IAM authorization for internal endpoints

2. **Lambda Functions**
   - Create three Lambda functions: webhook receiver, event processor, and dead letter handler
   - Configure each function with 512MB memory and 30 seconds timeout
   - Use Node.js 18 runtime for all functions
   - Deploy functions in private subnets for security
   - Enable X-Ray tracing on all Lambda functions
   - Configure environment variables for DynamoDB table name and S3 bucket

3. **Data Storage**
   - Set up a DynamoDB table for storing processed events with on-demand billing
   - Enable point-in-time recovery on the DynamoDB table
   - Configure an S3 bucket for archiving events older than 30 days
   - Enable versioning and server-side encryption on the S3 bucket
   - Implement lifecycle rules for automatic archival

4. **Monitoring and Observability**
   - Add CloudWatch alarms for Lambda errors exceeding 1 percent error rate
   - Set CloudWatch logs retention to 7 days to minimize costs
   - Implement X-Ray tracing across all Lambda functions

5. **Security and IAM**
   - Create IAM roles with least-privilege permissions for each Lambda function
   - Ensure all Lambda functions run in private subnets within a VPC
   - Enable encryption at rest for all data stores

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **API Gateway** for REST API endpoints
- Use **Lambda** for serverless compute (3 functions total)
- Use **DynamoDB** for event storage with on-demand capacity
- Use **S3** for long-term event archival
- Use **CloudWatch** for logging and alarms
- Use **X-Ray** for distributed tracing
- Use **VPC** with private subnets for Lambda deployment
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Use TypeScript strict mode and proper type definitions
- Use Pulumi Config for environment-specific values

### Constraints

- TypeScript strict mode must be enabled with proper type definitions for all resources
- Lambda functions must use Node.js 18 runtime
- DynamoDB table must have point-in-time recovery enabled
- S3 bucket must have versioning and server-side encryption enabled
- API Gateway must use AWS_IAM authorization for internal endpoints
- All Lambda functions must be deployed in private subnets
- Use Pulumi Config for environment-specific values
- Implement proper error handling and retry logic in Lambda functions
- CloudWatch logs retention must be set to 7 days to minimize costs
- All resources must be destroyable with no Retain policies
- System must handle 10,000+ requests per second with automatic scaling

## Success Criteria

- **Functionality**: Complete webhook processing pipeline from ingestion to archival
- **Performance**: Handle 10,000+ requests per second with automatic scaling
- **Reliability**: No event loss, proper dead letter handling, point-in-time recovery
- **Security**: Least-privilege IAM, private subnets, encryption at rest, API key auth
- **Observability**: CloudWatch alarms for errors, X-Ray tracing, structured logging
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: TypeScript with strict mode, well-typed, production-ready

## What to deliver

- Complete Pulumi TypeScript implementation with proper type definitions
- VPC with private subnets for Lambda deployment
- API Gateway REST API with throttling and API key authentication
- Three Lambda functions: webhook receiver, event processor, dead letter handler
- DynamoDB table with on-demand billing and point-in-time recovery
- S3 bucket with versioning, encryption, and lifecycle rules
- CloudWatch alarms for Lambda error rates
- X-Ray tracing configuration
- IAM roles with least-privilege permissions
- Lambda function code with proper error handling
- Documentation and deployment instructions
