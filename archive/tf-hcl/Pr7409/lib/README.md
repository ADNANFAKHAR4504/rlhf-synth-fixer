# Payment Processing Observability Platform

This Terraform configuration deploys a comprehensive monitoring and observability solution for a payment processing system running on AWS ECS.

## Features

- CloudWatch Dashboards: Pre-configured widgets for ECS, RDS, and ALB metrics
- Multi-tier Alerting: SNS topics with email and SMS subscriptions for critical, warning, and info alerts
- CloudWatch Alarms: CPU, memory, error rate, and composite alarms
- Metric Filters: Automated extraction of error rates and latency from application logs
- Synthetic Monitoring: CloudWatch Synthetics canaries checking API endpoints every 5 minutes
- Log Management: Centralized logging with 30-day retention and cross-account sharing
- Saved Queries: Pre-built CloudWatch Logs Insights queries for troubleshooting
- Security: KMS encryption for SNS topics and CloudWatch Logs

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Existing ECS cluster, RDS cluster, and ALB to monitor
- Email addresses for alert notifications
- Optional: Security account ID for cross-account log sharing

## Usage

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit terraform.tfvars with your specific values:
   - environment_suffix: Unique identifier for your deployment
   - ecs_cluster_name: Your ECS cluster name
   - rds_cluster_identifier: Your RDS cluster identifier
   - alb_arn_suffix: Your ALB ARN suffix
   - log_group_names: List of CloudWatch Log Groups to monitor
   - critical_email_endpoints: Email addresses for critical alerts
   - api_endpoint_url: API endpoint to monitor with canaries

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Review the plan:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

6. Confirm SNS subscriptions:
   - Check email inboxes for SNS subscription confirmation emails
   - Click the confirmation links to activate subscriptions

## Outputs

After deployment, Terraform will output:
- dashboard_url: Direct link to CloudWatch dashboard
- critical_alerts_topic_arn: SNS topic ARN for critical alerts
- canary_name: Name of the synthetic monitoring canary
- alarm_names: All CloudWatch alarm names
- saved_queries: CloudWatch Logs Insights saved query names

## Monitoring

### CloudWatch Dashboard

Access the dashboard via the output URL or navigate to:
CloudWatch Console > Dashboards > payment-processing-{environment_suffix}

### Alarms

View all alarms in CloudWatch Console > Alarms. Alarms are configured for:
- ECS CPU utilization > 80%
- ECS memory utilization > 80%
- RDS CPU utilization > 75%
- Application error rate > 10 errors per 5 minutes
- Canary success rate < 100%
- Composite alarm when multiple conditions trigger

### Saved Queries

Access pre-built queries in CloudWatch Console > Logs Insights:
- error-analysis-{environment_suffix}: Error count trends
- latency-percentiles-{environment_suffix}: Latency p50, p95, p99
- request-volume-{environment_suffix}: Request counts per minute

## Customization

### Alarm Thresholds

Modify thresholds in terraform.tfvars:
```hcl
cpu_alarm_threshold    = 80
memory_alarm_threshold = 80
```

### Canary Frequency

Adjust check interval (in minutes):
```hcl
canary_check_interval = 5
```

### Log Retention

Change retention period (in days):
```hcl
log_retention_days = 30
```

## Clean Up

To destroy all resources:
```bash
terraform destroy
```

Note: Confirm all alarms are acknowledged before destroying to avoid missing critical alerts.

## Cost Considerations

- CloudWatch Synthetics canaries: ~$0.0012 per run
- CloudWatch custom metrics: First 10,000 free, then $0.30/metric/month
- CloudWatch alarms: First 10 free, then $0.10/alarm/month
- CloudWatch Logs: $0.50/GB ingested, $0.03/GB storage
- SNS: $0.50/million requests, SMS varies by region

Estimated monthly cost: $50-200 depending on log volume and canary frequency.

## Support

For issues or questions, contact the DevOps team.
