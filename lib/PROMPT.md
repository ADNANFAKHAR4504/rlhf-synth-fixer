# Financial Market Data Processing System

Hey team,

We need to build a real-time financial market data processing system for a financial services company. They are receiving market data events from multiple exchanges and need to process them quickly and reliably. I have been asked to create this infrastructure using Terraform with HCL.

The business challenge here is handling variable workloads that spike during market hours while maintaining strict SLA requirements for low latency processing. They also need a complete audit trail of all transactions for regulatory compliance, and they want to minimize operational overhead by going fully serverless.

Right now they are struggling with manual scaling and high operational costs. This event-driven architecture will automatically scale based on incoming event volume, ensure fast processing times, and provide the audit capabilities they need without managing any servers.

## What we need to build

Create a serverless event-driven architecture using Terraform with HCL for processing real-time financial market data from multiple exchanges.

### Core Requirements

1. **Event Ingestion and Routing**
   - Use Amazon EventBridge to receive events from multiple exchange sources
   - Configure event patterns to route different types of market data events to Lambda processors
   - Support multiple event sources and flexible routing rules

2. **Serverless Event Processing**
   - Deploy AWS Lambda functions that connect to EventBridge and process market data events
   - Auto-scale based on incoming event volume
   - Process events within strict SLA requirements with low latency
   - Handle variable workloads during market hours

3. **Data Storage and Audit Trail**
   - Lambda functions write processed market data to Amazon DynamoDB tables
   - Maintain a complete audit trail of all transactions
   - Use DynamoDB point-in-time recovery for data protection
   - Ensure fast read and write performance for real-time processing

4. **Monitoring and Observability**
   - Integrate CloudWatch Logs that capture all Lambda executions
   - Capture detailed logs for audit and troubleshooting
   - Monitor processing latency and error rates

### Technical Requirements

- All infrastructure defined using Terraform with HCL
- Use AWS Lambda for serverless event processing functions
- Use Amazon EventBridge as the central event bus for routing
- Use Amazon DynamoDB for storing processed data and audit records
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-purpose-environment-suffix
- Deploy to us-east-1 region
- Use least-privilege IAM roles and policies with specific resource ARNs
- Enable CloudWatch Logs for all Lambda functions

### Deployment Requirements - CRITICAL

- All resources must be destroyable with terraform destroy
- FORBIDDEN: Do not use prevent_destroy lifecycle rules
- FORBIDDEN: Do not use RETAIN deletion policies
- Use DESTROY or DELETE removal policies only
- Lambda runtime should be Python 3.11 or Node.js 18.x for best performance
- Include proper error handling and dead letter queues for failed events

### Constraints

- Must support multiple concurrent Lambda executions during peak market hours
- DynamoDB must provide single-digit millisecond latency
- All Lambda functions must have timeout and memory configurations appropriate for market data processing
- IAM policies must follow least-privilege principle with specific action permissions
- All logs must be retained for compliance with 30 days minimum
- No hardcoded values - use variables and parameters

## Success Criteria

- Functionality: Events flow from EventBridge through Lambda to DynamoDB successfully
- Performance: Lambda processes events with sub-second latency
- Reliability: Auto-scaling handles variable workloads without manual intervention
- Security: IAM roles grant only necessary permissions to specific resources
- Resource Naming: All resources include environmentSuffix for multi-environment support
- Audit Trail: Complete logging of all transactions in CloudWatch and DynamoDB
- Code Quality: Clean HCL code, well-tested, properly documented

## What to deliver

- Complete Terraform HCL implementation with proper module structure
- Lambda function code for processing market data events
- IAM roles and policies for Lambda execution
- EventBridge event bus and rules configuration
- DynamoDB table with appropriate indexes and settings
- CloudWatch log groups for monitoring
- Unit tests for all Terraform resources
- Integration tests for the complete workflow
- Documentation including architecture diagram and deployment instructions
