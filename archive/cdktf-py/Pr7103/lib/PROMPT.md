# Observability Platform for Microservices Architecture

Hey team,

We've got an urgent requirement from one of our financial services clients. They're running a payment processing platform with multiple microservices, and they need comprehensive real-time monitoring to maintain their strict SLA commitments. The business is concerned about quickly identifying performance bottlenecks and getting ahead of issues before they impact customers.

The payment processing team has reported several incidents where they couldn't quickly pinpoint the root cause of slowdowns. They need better visibility into their distributed system - detailed metrics, distributed tracing across services, and smart alerting that cuts through the noise. This isn't just about collecting logs; they need a complete observability solution that helps them understand what's happening across their entire microservices architecture.

I've been asked to build this using **CDKTF with Python** to integrate with their existing infrastructure-as-code workflows. The solution needs to cover everything from log aggregation and metric extraction to automated anomaly detection and intelligent alerting.

## What we need to build

Create a comprehensive observability platform using **CDKTF with Python** for monitoring microservices in production.

### Core Requirements

1. **Centralized Logging Infrastructure**
   - Deploy CloudWatch Log Groups with KMS encryption for ECS tasks and Lambda functions
   - Configure 30-day log retention with automatic archival
   - Implement log aggregation across all services

2. **Distributed Tracing**
   - Configure X-Ray service map with tracing for all Lambda functions and ECS services
   - Enable tracing with sampling rate of 0.1 for Lambda functions
   - Provide visibility into request flow across microservices

3. **Metrics and Monitoring**
   - Create metric filters to extract error rates and latency metrics from logs
   - Track error rates, latency p99, and concurrent executions
   - Enable Container Insights for ECS cluster monitoring
   - Enable Lambda Insights with enhanced monitoring for all functions

4. **Alerting and Notifications**
   - Set up CloudWatch alarms for CPU, memory, error rate, and latency thresholds
   - Configure SNS topics for alarm notifications with email and webhook endpoints
   - Configure dead letter queues for SNS with maxReceiveCount of 3
   - Implement composite alarms to reduce noise from transient failures

5. **Visualization and Dashboards**
   - Build CloudWatch dashboard displaying service health, latency percentiles, and error trends
   - Organize dashboards by service boundary with cross-service view
   - Provide real-time visibility into system health

### Optional Enhancements

- Add EventBridge rules for automated remediation workflows (enables self-healing)
- Implement CloudWatch Synthetics for endpoint monitoring (proactive issue detection)
- Configure Systems Manager Parameter Store for centralized configuration management

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **CloudWatch** for logs, metrics, alarms, and dashboards
- Use **X-Ray** for distributed tracing
- Use **KMS** for encryption keys
- Use **SNS** for notifications
- Use **Lambda** and **ECS** as monitored services
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- All resources must be destroyable (no Retain policies)

### Constraints

- All Lambda functions must have tracing enabled with sampling rate of 0.1
- CloudWatch Logs must use KMS encryption with customer-managed keys
- Metric filters must track error rates, latency p99, and concurrent executions
- SNS topics must have dead letter queues configured with maxReceiveCount of 3
- All alarms must use composite alarms for reducing false positives
- CloudWatch dashboards must be organized by service boundary with cross-service view
- Log retention must be 30 days for compliance with automatic transition to Glacier
- Lambda insights must be enabled with enhanced monitoring for all functions
- All resources must include proper error handling and logging
- VPC flow logs should be enabled where applicable

### Deployment Requirements (CRITICAL)

- All resource names must include **environmentSuffix** parameter for uniqueness across deployments
- Use **RemovalPolicy.DESTROY** for all resources (no Retain policies) to ensure resources can be cleaned up
- Lambda functions using Node.js 18+ must explicitly include AWS SDK v3 as Node.js 18+ removed aws-sdk from the runtime
- Include proper IAM roles and policies for all services
- Ensure cross-service integrations are properly configured

## Success Criteria

- **Functionality**: Complete observability solution with logging, tracing, metrics, alerting, and dashboards
- **Performance**: Low-latency log ingestion and real-time metric updates
- **Reliability**: Composite alarms reduce false positives, DLQs prevent message loss
- **Security**: KMS encryption for all logs, proper IAM policies
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: Clean Python code, well-tested, comprehensive documentation

## What to deliver

- Complete CDKTF Python implementation
- CloudWatch Log Groups with KMS encryption
- X-Ray tracing configuration
- Metric filters for error rates and latency
- CloudWatch alarms (standard and composite)
- SNS topics with DLQ configuration
- CloudWatch dashboards
- Container Insights and Lambda Insights configuration
- Unit tests for all components
- Documentation and deployment instructions
