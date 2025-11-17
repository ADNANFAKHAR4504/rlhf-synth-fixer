Hey team,

We need to build a serverless IoT data processing pipeline that can handle millions of sensor events daily. Our current monolithic application is struggling with variable traffic patterns and the maintenance overhead is becoming unmanageable. Management wants us to transition to a fully serverless architecture using AWS Lambda and DynamoDB for better scalability and cost efficiency.

The solution needs to handle real-time data ingestion from IoT sensors, transform and enrich that data, and provide query capabilities for the processed information. We're looking at handling variable traffic patterns efficiently with proper decoupling between components, alerting on errors, and comprehensive observability across the entire pipeline.

## What we need to build

Create a serverless IoT data processing pipeline using **CDKTF with Python** that processes sensor data in real-time with full observability and error handling.

### Core Requirements

1. **API Gateway REST API**
   - Define three endpoints: /ingest, /process, /query
   - Each endpoint triggers a separate Lambda function
   - Use AWS_IAM authorization for all endpoints
   - Configure request validation and throttling at 1000 requests per second

2. **Lambda Functions**
   - data-ingestion function that receives raw sensor data from the /ingest endpoint
   - data-processor function that transforms and enriches data
   - data-query function that retrieves processed data from the /query endpoint
   - All functions must use Python 3.11 runtime
   - Set reserved concurrent executions to 100 for each function
   - Enable AWS X-Ray tracing on all Lambda functions

3. **Data Storage**
   - DynamoDB table for raw-sensor-data with partition key device_id and sort key timestamp
   - DynamoDB table for processed-data with partition key device_id and sort key event_date
   - Use on-demand billing mode for both tables
   - Enable point-in-time recovery on both tables

4. **Message Queue and Notifications**
   - Implement SQS queue between ingestion and processing Lambda functions for decoupling
   - Configure dead letter queues for all asynchronous Lambda invocations
   - Create SNS topic for alerting when processing errors exceed threshold

5. **Shared Dependencies**
   - Implement Lambda layers for boto3 and requests libraries shared across functions
   - Use version pinning for the layers

6. **Configuration Management**
   - Set up Systems Manager parameters for API keys and configuration values
   - Lambda functions must use environment variables stored in AWS Systems Manager Parameter Store

7. **Monitoring and Observability**
   - Set up CloudWatch Log Groups with 30-day retention for each Lambda function
   - Create CloudWatch alarms for Lambda errors, throttles, and DynamoDB throttled requests
   - Enable AWS X-Ray tracing across all services for end-to-end visibility

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **API Gateway** for REST API endpoints
- Use **Lambda** for all compute workloads (Python 3.11 runtime)
- Use **DynamoDB** for data storage with on-demand billing
- Use **SQS** for message queuing between components
- Use **SNS** for error notifications
- Use **CloudWatch** for logging and monitoring
- Use **X-Ray** for distributed tracing
- Use **Systems Manager Parameter Store** for configuration
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- CloudWatch Logs retention must be set to 30 days for all Lambda function logs
- Lambda functions must use Python 3.11 runtime with reserved concurrent executions set to 100
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- Dead letter queues must be configured for all asynchronous Lambda invocations
- Lambda functions must use layers for shared dependencies with version pinning
- API Gateway must use AWS_IAM authorization for all endpoints
- All resources must be destroyable with no Retain policies or deletion protection
- Include proper error handling and security configurations with least-privilege IAM policies

## Success Criteria

- Functionality: All three API endpoints operational and triggering correct Lambda functions
- Performance: API Gateway throttling set to 1000 requests per second, Lambda concurrency at 100
- Reliability: Dead letter queues configured, SQS decoupling between ingestion and processing
- Security: IAM roles with least-privilege policies for each Lambda function, AWS_IAM authorization on API Gateway
- Observability: X-Ray tracing enabled across all services, CloudWatch alarms for errors and throttles
- Resource Naming: All resources include environment_suffix for uniqueness
- Configuration: Systems Manager parameters properly configured and referenced by Lambda functions
- Code Quality: Python, well-documented, follows AWS best practices

## What to deliver

- Complete CDKTF Python implementation for the serverless IoT pipeline
- API Gateway REST API with three endpoints and IAM authorization
- Three Lambda functions (data-ingestion, data-processor, data-query) with Python 3.11 runtime
- Two DynamoDB tables with on-demand billing and point-in-time recovery
- SQS queue with dead letter queue configuration
- SNS topic for error notifications
- Lambda layers for shared dependencies
- CloudWatch Log Groups with 30-day retention
- CloudWatch alarms for monitoring
- Systems Manager parameters for configuration
- X-Ray tracing configuration
- IAM roles with least-privilege policies
- Unit tests for all components
- Documentation and deployment instructions
