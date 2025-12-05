# CloudWatch Observability Stack - Ideal Implementation

This directory contains a comprehensive, production-ready Terraform configuration for monitoring ECS-based microservices with CloudWatch.

## Implementation Summary

The solution implements all mandatory and optional requirements:

### Mandatory Requirements (100% Implemented)
1. **CloudWatch Synthetics canaries** - Custom Node.js scripts monitoring endpoints every 5 minutes
2. **Dashboard metric math expressions** - Error rate %, availability %, p99 latency calculations
3. **30-day log retention with metric filters** - All log groups configured with error pattern extraction

### Optional Requirements (100% Implemented)
1. **Cross-account monitoring** - CloudWatch Observability Access Manager sink configuration
2. **Comprehensive resource tagging** - Environment, Team, CostCenter tags on all resources
3. **Two-tier alarm thresholds** - Separate warning (70%) and critical (90%) alarms
4. **Container Insights integration** - ECS cluster metrics and task failure detection
5. **Composite alarms** - Multi-metric conditions with AND/OR logic
6. **KMS encryption for SNS topics** - Customer-managed keys with rotation enabled

## Architecture Components

### Files Created

**Infrastructure Files:**
- `provider.tf` - Terraform and AWS provider configuration
- `variables.tf` - All input variables with descriptions
- `data.tf` - Data sources for existing ECS, VPC, and networking resources
- `kms.tf` - KMS key for SNS encryption with proper service policies
- `logs.tf` - CloudWatch Log Groups and metric filters (error rates, response times)
- `notifications.tf` - SNS topics for critical and warning alerts
- `alarms.tf` - Individual and composite alarms for CPU, memory, errors
- `canaries.tf` - Synthetics canaries with custom scripts and IAM roles
- `canary-script.js.tpl` - Custom canary script template with health validation
- `events.tf` - EventBridge rules for ECS task state changes
- `dashboard.tf` - CloudWatch dashboard with metric math expressions
- `cross_account.tf` - OAM sink for cross-account observability
- `outputs.tf` - Useful outputs (dashboard URL, SNS ARNs, canary info)

**Configuration Files:**
- `terraform.tfvars.example` - Example variable values

### Key Features

1. **Centralized Logging**
   - One log group per microservice with 30-day retention
   - Four metric filters per service: errors, response time, critical errors, request count
   - KMS encryption for log data

2. **Intelligent Alarming**
   - Individual alarms for CPU, memory, and error rates
   - Two-tier thresholds (70% warning, 90% critical)
   - Composite alarms combining multiple metrics with OR/AND logic
   - Container Insights alarms for ECS task failures

3. **Synthetic Monitoring**
   - Custom canaries for each microservice endpoint
   - 5-minute execution frequency
   - Health check validation with JSON response parsing
   - VPC-based execution for private endpoint access
   - S3 artifact storage with lifecycle policies

4. **Alert Routing**
   - Separate SNS topics for critical and warning alerts
   - Email subscriptions (mandatory)
   - Webhook subscriptions (optional)
   - KMS encryption with customer-managed keys

5. **Comprehensive Dashboard**
   - Infrastructure metrics: ECS cluster overview, CPU/memory by service
   - Application metrics with calculated values:
     - Error rate percentage: `(ErrorCount / RequestCount) * 100`
     - p99 response times
     - Service availability: `((RequestCount - ErrorCount) / RequestCount) * 100`
   - Synthetic monitoring: Canary success rates and duration
   - Real-time updates with 5-minute periods

6. **Event-Driven Monitoring**
   - EventBridge rules for ECS task stopped and failed to start
   - Automatic SNS notifications with task details
   - Integration with critical alerts topic

7. **Cross-Account Observability**
   - OAM sink for receiving metrics from dev/staging accounts
   - Configurable via dev_account_id and staging_account_id variables
   - Proper IAM policies for cross-account access

### Resource Naming Convention

All resources include `environment_suffix` for uniqueness:
- Log Groups: `/ecs/{service}-{environmentSuffix}`
- Alarms: `{type}-{service}-{environmentSuffix}`
- Canaries: `endpoint-{service}-{environmentSuffix}`
- SNS Topics: `monitoring-{severity}-alerts-{environmentSuffix}`
- KMS Key: `monitoring-sns-kms-{environmentSuffix}`
- Dashboard: `monitoring-dashboard-{environmentSuffix}`

### Destroyability

All resources are fully destroyable:
- Log groups: No retention policies preventing deletion
- S3 buckets: `force_destroy = true` enabled
- Canaries: Stop automatically before deletion
- KMS keys: 7-day deletion window

## Deployment Guide

See the generated files for complete deployment instructions. Key steps:

1. Configure variables in `terraform.tfvars`
2. Run `terraform init`
3. Run `terraform plan` to review changes
4. Run `terraform apply` to deploy
5. Confirm SNS email subscriptions

## Security Considerations

- KMS encryption for SNS topics and CloudWatch Logs
- KMS key rotation enabled
- S3 buckets with public access blocked
- IAM roles follow least privilege
- VPC security groups restrict canary egress to HTTP/HTTPS only

## Cost Optimization

- 30-day log retention (compliance requirement)
- Canary artifacts lifecycle: 30-day expiration
- Synthetics canaries: 8,640 runs/month per service (5-minute intervals)
- All serverless where possible (no EC2 instances)

## Testing

The configuration includes:
- Metric filter patterns tested against common log formats
- Canary scripts with JSON response validation
- Alarm thresholds tuned for production (70%/90%)
- Composite alarm logic for intelligent alerting

## Maintenance

- Update thresholds: Modify variables and reapply
- Add services: Update `microservices` and `alb_endpoints` variables
- Modify canary logic: Edit `canary-script.js.tpl`
- Cross-account setup: Set account ID variables

## References

- All code is in `lib/*.tf` files
- Canary template: `lib/canary-script.js.tpl`
- Example configuration: `lib/terraform.tfvars.example`
- Full documentation in MODEL_RESPONSE.md
