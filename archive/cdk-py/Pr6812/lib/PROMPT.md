Hey team,

We need to build a resilient payment processing API infrastructure that can handle failures gracefully and maintain transaction integrity. I've been asked to create this in Python using AWS CDK. The business wants strong disaster recovery capabilities without the complexity of multi-region deployments right now. This is for a financial services company processing thousands of payment transactions daily, where any downtime directly impacts revenue.

The core challenge here is building a system that not only processes payments reliably but also monitors itself and can recover automatically from common failure scenarios. We're talking about a production-ready system with proper error handling, automated monitoring, and self-healing capabilities.

## What we need to build

Create a payment processing API infrastructure using **AWS CDK with Python** for us-east-1. The system needs strong disaster recovery features through automated backups, health monitoring, and automated recovery actions.

### Core Requirements

1. **API Layer**
   - Deploy an API Gateway REST API with proper monitoring
   - Configure throttling to protect backend services
   - Include health check endpoints

2. **Processing Layer**
   - Create Lambda functions for payment validation and processing
   - Implement a separate Lambda function that monitors system health and triggers recovery actions
   - Configure appropriate timeout and memory settings
   - Set up CloudWatch Logs with proper retention for all functions

3. **Data Layer**
   - Set up a DynamoDB table for transaction storage
   - Use on-demand billing mode
   - Enable point-in-time recovery for disaster recovery
   - Configure CloudWatch alarms for throttles

4. **Queue Management**
   - Implement SQS queues for async processing of failed transactions
   - Configure dead letter queues for all SQS queues
   - Ensure proper message retention settings

5. **Monitoring and Alerts**
   - Configure CloudWatch alarms for API latency, Lambda errors, and DynamoDB throttles
   - Set up SNS topics for alarm notifications
   - Create a CloudWatch dashboard showing key metrics across all components

6. **Security and Access Control**
   - Create IAM roles with least privilege access for all services
   - Ensure Lambda functions have only the permissions they need
   - Proper security configurations for API Gateway

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **API Gateway** for REST API endpoints
- Use **Lambda** for payment processing logic and health monitoring
- Use **DynamoDB** for transaction storage with PITR enabled
- Use **SQS** with dead letter queues for failed transaction handling
- Use **SNS** for alarm notifications
- Use **CloudWatch** for monitoring, alarms, logs, and dashboards
- Use **IAM** for proper role-based access control
- Resource names must include **environment_suffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region only
- All resources must be tagged with Environment tag

### Deployment Requirements (CRITICAL)

- All resources MUST include **environment_suffix** parameter in their names to ensure uniqueness across deployments
- All resources must be fully destroyable - do NOT use RemovalPolicy.RETAIN
- Do NOT enable deletion protection on any resources
- DynamoDB table must use on-demand billing mode
- Lambda functions should NOT use reserved concurrency to prevent account limit issues
- All Lambda functions need CloudWatch Logs with appropriate retention periods

### Constraints

- Deploy to us-east-1 region only (single region deployment)
- DynamoDB must use on-demand billing mode with point-in-time recovery enabled
- Configure dead letter queues for all SQS queues
- CloudWatch alarms must trigger SNS notifications for critical events
- Lambda functions should have appropriate timeout and memory configurations without reserved concurrency
- API Gateway should have throttling configured
- All resources must have proper error handling and logging
- Follow AWS best practices for security, cost optimization, and reliability

## Success Criteria

- **Functionality**: Complete payment processing API with validation, processing, and monitoring capabilities
- **Performance**: API Gateway with proper throttling, Lambda functions with appropriate configurations
- **Reliability**: Automated backups via PITR, health monitoring, self-healing through recovery Lambda
- **Security**: Least privilege IAM roles, proper security configurations
- **Observability**: CloudWatch dashboard, alarms for critical metrics, SNS notifications
- **Resource Naming**: All resources include environment_suffix parameter for unique naming
- **Destroyability**: All resources can be destroyed without manual intervention (no RETAIN policies)
- **Code Quality**: Python code, well-structured CDK stacks, proper documentation

## What to deliver

- Complete AWS CDK Python implementation
- API Gateway REST API with monitoring and throttling
- Lambda functions for payment validation, processing, and health monitoring
- DynamoDB table with on-demand billing and point-in-time recovery
- SQS queues with dead letter queues configured
- SNS topics for alarm notifications
- CloudWatch alarms for API latency, Lambda errors, and DynamoDB throttles
- CloudWatch dashboard showing key metrics
- IAM roles and policies with least privilege access
- Comprehensive documentation with deployment instructions
- All resources properly tagged and named with environment_suffix
