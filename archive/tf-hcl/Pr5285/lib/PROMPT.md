Hey team,

We're building a serverless event processing pipeline for our fintech startup. The system needs to handle real-time transaction analysis - we're talking millions of events per day with sub-second latency requirements. Data consistency and audit trails are non-negotiable here.

Here's the situation:
We need this deployed in us-east-1, fully serverless (no VPC hassles). The stack includes API Gateway for our REST endpoints, Lambda functions running Node.js 18, DynamoDB for persistence, SQS for message queuing, and EventBridge to orchestrate everything. Oh, and X-Ray tracing across the board so we can actually debug things when stuff goes sideways.

What we're looking for:

**API Layer**
- REST API via API Gateway with proper request validation
- Throttling at 10,000 requests/sec (we expect high traffic)
- Request/response transformations using VTL templates
- Lambda authorizer with caching enabled

**Lambda Functions**
- Three main functions: event ingestion, processing, and storage
- ARM-based Graviton2 processors (cost savings, you know)
- Reserved concurrent executions configured
- Timeouts between 30-300 seconds (be explicit, please)
- Lambda destinations for success and failure paths
- Shared dependencies via Lambda layers (versioned with proper permissions)
- Async invocation config with max retries and event age settings

**Data & Messaging**
- DynamoDB tables with composite primary keys and GSI for flexible queries
- On-demand billing mode with point-in-time recovery enabled
- SQS queues for reliable delivery with DLQ setup
- Visibility timeout: 300 seconds

**Event Orchestration**
- EventBridge rules triggering Lambdas based on event patterns
- Content-based filtering with at least 3 different event patterns
- Support for multiple event sources

**Config & Monitoring**
- SSM Parameter Store for cross-function environment variables
- CloudWatch Log groups with 7-day retention for each Lambda
- Custom CloudWatch metrics
- X-Ray tracing enabled everywhere

**Tagging**
All resources need consistent tags: Environment, Team, and CostCenter. Finance will be on our case otherwise.

Deliverables:

Please organize this as modular Terraform files - one per service component. Makes it easier to maintain and understand. We need:

1) api-gateway.tf - REST API, resources, methods, deployment, stage, throttling, authorizers
2) lambda.tf - All Lambda functions with proper configs
3) layers.tf - Lambda layers for shared dependencies
4) dynamodb.tf - Tables with composite keys and GSI
5) sqs.tf - Queues with DLQ configuration
6) eventbridge.tf - Event rules and targets
7) ssm.tf - Parameter Store entries
8) cloudwatch.tf - Log groups and metrics
9) iam.tf - Roles and policies for everything
10) variables.tf - Input variables
11) outputs.tf - API endpoints, function ARNs, queue URLs for integration testing

Make sure the Terraform is version 1.5+ compatible and uses AWS provider 5.x. We already have provider.tf set up, so don't worry about that.

Also, keep state management in mind - we'll need those outputs for our CI/CD pipeline to run integration tests.

Thanks!