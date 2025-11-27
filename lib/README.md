# ECS Observability Infrastructure

Comprehensive monitoring and observability infrastructure for ECS-based microservices using CloudFormation.

## Architecture

This CloudFormation stack deploys:

1. **CloudWatch Logs** - Centralized logging with 90-day retention
   - Application logs: `/aws/ecs/financeapp-{environmentSuffix}`
   - Service logs: `/aws/ecs/services-{environmentSuffix}`
   - Container Insights: `/aws/ecs/containerinsights/{ClusterName}/performance-{environmentSuffix}`

2. **X-Ray Tracing** - Distributed tracing with 10% sampling rate
   - X-Ray Group: `FinanceApp-{environmentSuffix}`
   - Sampling Rule: 0.1 fixed rate (10% of requests)

3. **Custom Metrics** - Application metrics in namespace `FinanceApp/Production`

4. **CloudWatch Alarms** - 5 metric alarms plus 1 composite alarm
   - CPU Utilization > 80%
   - Memory Utilization > 85%
   - Error Rate > 5%
   - Latency > 1000ms
   - Availability < 99.9%
   - Composite: CPU > 80% AND Memory > 85%

5. **SNS Notifications** - Email alerts for all alarms

6. **Parameter Store** - Secure threshold storage
   - CPU threshold
   - Memory threshold
   - Error rate threshold
   - Latency threshold
   - Availability threshold

7. **CloudWatch Dashboard** - Visual monitoring with 4 widgets
   - CPU Utilization
   - Memory Utilization
   - Request Count
   - Error Rate

8. **CloudWatch Synthetics** - Endpoint monitoring
   - Health check canary running every 5 minutes
   - Results stored in S3 bucket

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Target ECS cluster already deployed
- Valid email address for alarm notifications
- Health check endpoint URL

### Deploy the Stack