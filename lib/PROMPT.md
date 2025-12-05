Hey team,

We need to build a comprehensive monitoring and observability platform for a fintech startup's payment processing infrastructure. They're looking for real-time alerting on transaction anomalies, API performance issues, and infrastructure health. The system needs to integrate with their incident management workflow and provide visibility into both infrastructure metrics and business KPIs.

I've been asked to create this using **Pulumi with TypeScript**. The business wants a production-ready monitoring solution that can track payment transactions, alert on performance degradation, and provide dashboards for operations teams to monitor system health in real-time.

The monitoring needs to be comprehensive - from CloudWatch log aggregation and custom metrics tracking to synthetic monitoring of critical endpoints. They also want long-term metric storage for trend analysis and composite alarms that only trigger when multiple conditions are met to reduce alert fatigue.

## What we need to build

Create a CloudWatch-based observability platform using **Pulumi with TypeScript** for monitoring payment processing infrastructure.

### Core Requirements

1. **Log Management**:
   - CloudWatch Log Groups with 30-day retention for ECS application logs
   - Centralized logging for payment processing services
   - Log analysis using Lambda functions

2. **Custom Metrics and Monitoring**:
   - Custom CloudWatch metrics for payment transactions per minute
   - Custom metrics for payment failure rates
   - Lambda functions to analyze logs and calculate business metrics every 5 minutes

3. **Synthetic Monitoring**:
   - CloudWatch Synthetics canaries monitoring critical API endpoints
   - Execute health checks every 2 minutes
   - Track API availability and latency

4. **Alerting and Notifications**:
   - SNS topics with email and webhook subscriptions for different alert severities
   - CloudWatch alarms for CPU usage over 80%
   - CloudWatch alarms for memory usage over 85%
   - CloudWatch alarms for API latency over 500ms
   - Composite alarms that trigger only when multiple conditions are met

5. **Visualization and Dashboards**:
   - CloudWatch dashboard with widgets for infrastructure metrics
   - Dashboard widgets for custom business metrics
   - Alarm status visualization
   - Dashboard auto-refresh with 1-minute intervals

6. **Metric Analysis and Export**:
   - Metric math expressions to calculate error rates
   - Metric math expressions for availability percentages
   - CloudWatch metric streams to export metrics to S3 for long-term analysis
   - Cross-region metric aggregation using CloudWatch Streams

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **CloudWatch Logs** for centralized logging
- Use **CloudWatch Metrics** for custom and standard metrics
- Use **CloudWatch Synthetics** for API endpoint monitoring
- Use **CloudWatch Alarms** for threshold-based alerting
- Use **CloudWatch Dashboards** for visualization
- Use **SNS** for notification routing
- Use **Lambda** for custom metric processing and log analysis
- Use **S3** for long-term metric storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- Lambda runtime: Node.js 18+ (use SDK v3 bundled with runtime, no aws-sdk package needed)

### Constraints

- Configure metric math expressions for calculated metrics (MANDATORY)
- Use SNS topics with different subscriptions based on alarm severity (MANDATORY)
- Implement cross-region metric aggregation using CloudWatch Streams (MANDATORY)
- Configure alarms with multiple severity levels (warning, critical, emergency)
- All resources must be destroyable (no Retain policies, no deletion protection)
- Include proper error handling and logging in Lambda functions
- VPC endpoints for CloudWatch services to ensure private connectivity
- Support environment-specific configuration via parameters

## Deployment Requirements (CRITICAL)

### Resource Naming
- ALL named resources MUST include the **environmentSuffix** parameter
- Pattern: `{resourceName}-${environmentSuffix}`
- Example: `payment-logs-dev`, `cpu-alarm-prod`
- This is REQUIRED for parallel deployment testing

### Destroyability
- NO RemovalPolicy.RETAIN or DeletionPolicy: Retain
- NO deletionProtection: true on any resources
- All resources must be cleanly destroyable for testing
- This includes S3 buckets (use autoDeleteObjects or equivalent)

### Lambda Considerations
- Node.js 18+ runtime includes AWS SDK v3 by default
- DO NOT add aws-sdk or @aws-sdk packages to dependencies
- Use the SDK bundled with the Lambda runtime

## Success Criteria

- **Functionality**: All CloudWatch resources deployed and operational
- **Logging**: Log groups collecting application logs with proper retention
- **Metrics**: Custom metrics tracking business KPIs (transactions, failures)
- **Alerting**: SNS topics configured with email/webhook subscriptions
- **Alarms**: CloudWatch alarms monitoring CPU, memory, API latency thresholds
- **Composite Alarms**: Multi-condition alarms to reduce false positives
- **Monitoring**: Synthetics canaries checking API endpoints every 2 minutes
- **Visualization**: Dashboard displaying all key metrics and alarm statuses
- **Analysis**: Metric math expressions calculating error rates and availability
- **Export**: Metric streams exporting to S3 for long-term storage
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- CloudWatch Log Groups with retention policies
- Custom CloudWatch metrics for business KPIs
- Lambda functions for log analysis and metric calculation
- CloudWatch Synthetics canaries for endpoint monitoring
- SNS topics with subscriptions for alerting
- CloudWatch alarms (standard and composite)
- CloudWatch dashboard with comprehensive widgets
- CloudWatch metric streams with S3 export
- Metric math expressions for calculated metrics
- Unit tests for Lambda functions
- Documentation and deployment instructions
