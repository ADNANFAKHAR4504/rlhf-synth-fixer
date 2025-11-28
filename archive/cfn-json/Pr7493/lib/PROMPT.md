# Observability Platform for Microservices Monitoring

Hey team,

We need to build a comprehensive observability platform for our financial services microservices architecture. The compliance team is breathing down our necks about real-time alerting on performance anomalies, and they need the ability to trace transactions across multiple services for audit purposes. This is critical infrastructure that needs to be production-ready from day one.

I've been asked to create this using **CloudFormation with JSON**. The business wants a monitoring solution that can handle our distributed architecture with real-time alerting, distributed tracing, and automatic anomaly detection. We're dealing with financial transactions here, so any performance issues or errors need to be caught immediately.

The current pain point is that we don't have centralized monitoring across our microservices. When something goes wrong, we're flying blind trying to piece together what happened across different services. We need visibility into the entire system with the ability to drill down into specific transactions when auditors come knocking.

## What we need to build

Create an advanced observability platform using **CloudFormation with JSON** for comprehensive microservices monitoring and alerting in production.

### Core Requirements

1. **Custom Metrics Collection**
   - Configure CloudWatch with custom namespace for application metrics
   - Deploy Lambda function to process custom metrics from CloudWatch Logs
   - Implement metric filters to extract latency and error rates from JSON-formatted logs
   - Create EventBridge rule to trigger metric collection every 5 minutes

2. **Advanced Alerting System**
   - Create composite CloudWatch alarms that evaluate multiple metrics simultaneously
   - Set up SNS topic with email and SMS subscriptions for critical alerts
   - SNS topics must use KMS encryption with customer-managed keys
   - All alarms must use composite alarm structure for multi-metric evaluation

3. **Distributed Tracing**
   - Implement X-Ray service map with segment processing
   - X-Ray sampling rate must be configurable via parameters with default of 10%
   - Enable tracing for cross-service transaction tracking

4. **Monitoring Dashboard**
   - Configure CloudWatch dashboard with metric math widgets
   - Dashboard must include custom widgets using metric math expressions
   - Provide real-time visibility into system health

5. **Anomaly Detection**
   - Configure anomaly detector for automatic baseline learning
   - Enable automated detection of performance deviations

6. **Cross-Account Access**
   - Set up cross-account metric sharing with AssumeRole permissions
   - Enable multi-account monitoring capabilities

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **CloudWatch** for metrics, alarms, and dashboards
- Use **Lambda** for custom metric processing with reserved concurrent executions
- Use **SNS** for multi-channel alerting (email and SMS)
- Use **X-Ray** for distributed tracing
- Use **EventBridge** for scheduled metric collection (cron expressions)
- Use **KMS** for SNS encryption
- Use **IAM** roles following least-privilege principle with no wildcard actions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- CloudWatch Logs retention set to 30 days for compliance

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - use DeletionPolicy: Delete
- FORBIDDEN: Any Retain policies that would prevent stack deletion
- Lambda functions must use reserved concurrent executions to prevent throttling
- All IAM roles must use least-privilege with specific actions only
- All resources must have cost allocation tags for department-level billing

### Constraints

- All CloudWatch alarms must use composite alarms for multi-metric evaluation
- X-Ray sampling rate must be configurable via parameters (default: 10%)
- SNS topics must use KMS encryption with customer-managed keys
- CloudWatch Logs retention must be 30 days for compliance
- Metric filters must extract numeric values from JSON-formatted logs
- Dashboard must include metric math expressions for custom calculations
- IAM roles must follow least-privilege principle (no wildcard actions)
- Lambda functions must use reserved concurrent executions
- EventBridge rules must use cron expressions for scheduling
- All resources must have cost allocation tags
- VPC endpoints should be used for private traffic (CloudWatch and X-Ray)

## Success Criteria

- **Functionality**: All 10 mandatory requirements implemented and working
- **Performance**: Metric collection occurs every 5 minutes via EventBridge
- **Reliability**: Composite alarms provide multi-metric evaluation
- **Security**: KMS-encrypted SNS topics, least-privilege IAM roles
- **Compliance**: 30-day log retention, cross-account access configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template
- CloudWatch custom namespace and metric filters
- Lambda function for metric processing
- Composite CloudWatch alarms
- SNS topic with KMS encryption and multiple subscriptions
- X-Ray configuration with configurable sampling
- CloudWatch dashboard with metric math widgets
- EventBridge rule with cron schedule
- Anomaly detector configuration
- Cross-account IAM role for metric sharing
- All resources tagged for cost allocation
- Deployment instructions and parameter documentation
