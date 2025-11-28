# ECS Microservices Observability Platform - Infrastructure Implementation

## Overview

This infrastructure deploys a production-grade observability platform for ECS Fargate microservices running on AWS. The platform provides comprehensive monitoring, logging, tracing, and alerting capabilities for three deployed microservices (auth-service, payment-service, order-service) with infrastructure prepared for two additional future services (inventory-service, notification-service). The implementation includes CloudWatch Logs with KMS encryption, X-Ray distributed tracing, metric filters for application metrics, CloudWatch dashboards, composite alarms, Lambda functions for custom business metrics, KMS-encrypted SNS topics for multi-level alerting, EventBridge rules for intelligent alarm routing, and anomaly detection for request patterns.

## Architecture

High-level architecture components:

- **Networking:** VPC with 6 subnets (3 public, 3 private) across 3 availability zones, 3 NAT Gateways for production-grade high availability, Internet Gateway, route tables with proper isolation, VPC Flow Logs to CloudWatch with KMS encryption
- **Compute:** ECS Fargate cluster with 3 microservices (nginx containers with X-Ray daemon sidecars), Application Load Balancer for traffic distribution, 3 Lambda functions for custom business metrics processing
- **Storage:** S3 bucket for ALB access logs with AES256 encryption, versioning, and lifecycle policies
- **Messaging:** 3 SNS topics (critical, warning, info) with KMS encryption, SQS dead letter queue for failed notifications
- **Security:** 3 KMS customer-managed keys (logs, SNS, application data), IAM roles with least privilege, security groups with restricted access, S3 bucket policies with lockout prevention
- **Monitoring:** 5 CloudWatch Log Groups with 30-day retention and KMS encryption, 15 metric filters extracting application metrics, CloudWatch dashboard with 4 widgets, 18+ individual alarms, 3 composite alarms, 3 anomaly detection alarms, 3 EventBridge rules for severity-based routing
- **Tracing:** X-Ray sampling rules (100% for errors, 10% for success), X-Ray daemon sidecars in all ECS tasks

## Implementation Files

### lib/provider.tf

Terraform and provider configuration with version constraints, default tags, and input variables.

```hcl
/*
 * Provider Configuration File
 * ============================
 * This file defines the Terraform version constraints, required providers,
 * provider configuration with default tags, and all input variables used
 * throughout the infrastructure deployment.
 * 
 * The configuration ensures consistent tagging across all resources for
 * cost allocation, compliance tracking, and resource management.
 */

# Terraform version constraint ensuring compatibility with modern features
terraform {
  required_version = ">= 1.5.0"

  # Provider version constraints using pessimistic operator for stability
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Allows 5.x updates but prevents major version changes
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4" # Required for Lambda function packaging
    }
  }
  backend "s3" {

  }
}

/*
 * AWS Provider Configuration
 * ==========================
 * Configures the AWS provider with the target region and default tags
 * that will be automatically applied to all resources supporting tagging.
 * This ensures consistent metadata for compliance and cost tracking.
 */
provider "aws" {
  region = "us-east-1" # Primary region for financial services infrastructure

  # Default tags applied to all taggable resources for governance
  default_tags {
    tags = {
      Environment = "dev"           # Environment designation for resource lifecycle
      CostCenter  = "devops"        # Cost allocation for financial tracking
      ManagedBy   = "terraform"     # Infrastructure as Code management indicator
      Compliance  = "pci-dss"       # Regulatory compliance framework
      Owner       = "platform-team" # Team ownership for support routing
    }
  }
}

/*
 * Input Variables
 * ===============
 * These variables allow customization of the infrastructure deployment
 * while maintaining sensible defaults for development environments.
 */

# Environment designation variable for resource naming and configuration
variable "environment" {
  description = "Environment name used in resource naming and tagging (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# CloudWatch Logs retention period in days for compliance requirements
variable "retention_days" {
  description = "Number of days to retain CloudWatch Logs for microservices (compliance: minimum 30 days)"
  type        = number
  default     = 30

  validation {
    condition     = var.retention_days >= 1 && var.retention_days <= 3653
    error_message = "Retention days must be between 1 and 3653 (10 years)."
  }
}

# List of all microservice names including future services for scalability
variable "service_names" {
  description = "List of microservice names for observability infrastructure (includes future services)"
  type        = list(string)
  default = [
    "auth-service",        # Authentication and authorization service
    "payment-service",     # Payment processing service
    "order-service",       # Order management service
    "inventory-service",   # Inventory tracking service (future)
    "notification-service" # Notification dispatch service (future)
  ]

  validation {
    condition     = length(var.service_names) >= 3
    error_message = "At least 3 service names must be defined."
  }
}

# Configurable alarm thresholds for flexible monitoring policies
variable "alarm_thresholds" {
  description = "Map of alarm threshold values for monitoring configuration"
  type        = map(number)
  default = {
    error_rate_percent        = 5    # Percentage of errors triggering alarm
    response_time_ms          = 1000 # Response time in milliseconds
    error_count_threshold     = 10   # Absolute error count in 5 minutes
    request_rate_drop_percent = 50   # Percentage drop indicating outage
    anomaly_std_deviations    = 2    # Standard deviations for anomaly detection
  }

  validation {
    condition = alltrue([
      var.alarm_thresholds["error_rate_percent"] > 0,
      var.alarm_thresholds["response_time_ms"] > 0,
      var.alarm_thresholds["error_count_threshold"] > 0
    ])
    error_message = "All alarm thresholds must be positive numbers."
  }
}

variable "critical_alert_email" {
  description = "Email address to receive critical alerts"
  type        = string
  default     = "kanakatla.k@turing.com"

}
```

### lib/main.tf

Complete infrastructure resource definitions including networking, compute, storage, monitoring, and outputs. Due to the file size (2750 lines), this represents the corrected production-ready implementation with all 20 fixes applied.

The main.tf file includes:
- Data sources (AWS account, region, availability zones, ELB service account, Lambda archives)
- 3 KMS encryption keys with policies (logs, SNS, application)
- VPC networking (VPC, 6 subnets, 3 NAT Gateways, Internet Gateway, route tables, VPC Flow Logs)
- Security groups (ALB, ECS tasks)
- S3 bucket for ALB logs with AES256 encryption and bucket policy
- SQS dead letter queue for SNS
- 8 CloudWatch Log Groups (5 services, VPC Flow Logs, 3 Lambda functions)
- ECS cluster with 3 task definitions and 3 services
- Application Load Balancer with 3 target groups and path-based routing
- 2 X-Ray sampling rules
- 17 CloudWatch metric filters
- CloudWatch dashboard with 4 widgets
- 18+ CloudWatch alarms (error count, response time, error rate, anomaly detection, DLQ monitoring)
- 3 composite alarms
- 3 SNS topics with subscriptions
- 3 EventBridge rules with targets
- 3 Lambda functions with IAM roles and subscription filters
- 77 outputs

Note: The complete main.tf file is deployed and functional in the lib/ directory.

### lib/payment_failure_analyzer.py

Lambda function for analyzing payment service logs and publishing custom CloudWatch metrics.

```python
"""
Payment Failure Analyzer Lambda Function
========================================
Processes payment service logs to calculate failure rates by payment method
and publish custom CloudWatch metrics for business intelligence.
"""

import json
import base64
import gzip
import os
import boto3
from datetime import datetime
from collections import defaultdict

# Initialize AWS clients
cloudwatch = boto3.client('cloudwatch')

def lambda_handler(event, context):
    """
    Main handler for processing CloudWatch Logs events.
    
    Args:
        event: CloudWatch Logs event containing compressed log data
        context: Lambda context object
    
    Returns:
        dict: Response with processing status
    """
    
    # Extract environment variables
    namespace = os.environ.get('METRIC_NAMESPACE', 'CustomMetrics/Business')
    service_name = os.environ.get('SERVICE_NAME', 'payment-service')
    environment = os.environ.get('ENVIRONMENT', 'dev')
    
    # Decode and decompress the log data
    log_data = json.loads(gzip.decompress(base64.b64decode(event['awslogs']['data'])))
    
    # Initialize counters for payment methods
    payment_stats = defaultdict(lambda: {'total': 0, 'failed': 0})
    total_amount = 0
    failed_amount = 0
    
    # Process each log event
    for log_event in log_data['logEvents']:
        try:
            # Parse the log message as JSON
            message = json.loads(log_event['message'])
            
            # Extract payment information
            payment_method = message.get('payment_method', 'unknown')
            status = message.get('status', 200)
            amount = float(message.get('payment_amount', 0))
            
            # Update statistics
            payment_stats[payment_method]['total'] += 1
            total_amount += amount
            
            # Check if payment failed (4xx or 5xx status)
            if status >= 400:
                payment_stats[payment_method]['failed'] += 1
                failed_amount += amount
                
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            # Log parsing errors for debugging
            print(f"Error parsing log event: {e}")
            continue
    
    # Prepare CloudWatch metrics
    metrics = []
    timestamp = datetime.utcnow()
    
    # Calculate failure rates for each payment method
    for payment_method, stats in payment_stats.items():
        if stats['total'] > 0:
            failure_rate = (stats['failed'] / stats['total']) * 100
            
            # Add failure rate metric
            metrics.append({
                'MetricName': 'PaymentFailureRate',
                'Value': failure_rate,
                'Unit': 'Percent',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'PaymentMethod', 'Value': payment_method},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
            
            # Add transaction count metrics
            metrics.append({
                'MetricName': 'PaymentTransactions',
                'Value': stats['total'],
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'PaymentMethod', 'Value': payment_method},
                    {'Name': 'ServiceName', 'Value': service_name},
                    {'Name': 'Environment', 'Value': environment}
                ]
            })
    
    # Add total payment amount metrics
    if total_amount > 0:
        metrics.append({
            'MetricName': 'PaymentVolume',
            'Value': total_amount,
            'Unit': 'None',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
        
        # Calculate overall failure rate
        overall_failure_rate = (failed_amount / total_amount) * 100
        metrics.append({
            'MetricName': 'PaymentVolumeFailureRate',
            'Value': overall_failure_rate,
            'Unit': 'Percent',
            'Timestamp': timestamp,
            'Dimensions': [
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'Environment', 'Value': environment}
            ]
        })
    
    # Publish metrics to CloudWatch
    if metrics:
        # CloudWatch PutMetricData accepts max 20 metrics per call
        for i in range(0, len(metrics), 20):
            batch = metrics[i:i+20]
            cloudwatch.put_metric_data(
                Namespace=namespace,
                MetricData=batch
            )
        
        print(f"Published {len(metrics)} metrics to CloudWatch")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment metrics processed successfully',
            'metricsPublished': len(metrics),
            'paymentMethods': list(payment_stats.keys())
        })
    }
```

Note: order_value_tracker.py and user_action_analytics.py follow similar patterns for processing order and authentication logs respectively.

## Deployment

Deploy this infrastructure using the following commands:

```bash
# Navigate to the lib directory
cd lib

# Initialize Terraform and download providers
terraform init

# Review planned infrastructure changes
terraform plan

# Apply the infrastructure (requires confirmation)
terraform apply

# View all outputs after deployment
terraform output
```

To destroy the infrastructure when no longer needed:

```bash
# Destroy all resources (requires confirmation)
terraform destroy
```

Deployment time: Approximately 22-25 minutes (ECS services and ALB take longest to provision).

Destroy time: Approximately 10-15 minutes (all resources configured for clean deletion).

## Infrastructure Outputs

The deployment provides 77 outputs for integration and operational use:

### CloudWatch Log Groups (18 outputs)
- **log_group_auth_service_name:** CloudWatch log group name for auth-service
- **log_group_auth_service_arn:** CloudWatch log group ARN for auth-service
- **log_group_payment_service_name:** CloudWatch log group name for payment-service
- **log_group_payment_service_arn:** CloudWatch log group ARN for payment-service
- **log_group_order_service_name:** CloudWatch log group name for order-service
- **log_group_order_service_arn:** CloudWatch log group ARN for order-service
- **log_group_inventory_service_name:** CloudWatch log group name for inventory-service (future)
- **log_group_inventory_service_arn:** CloudWatch log group ARN for inventory-service (future)
- **log_group_notification_service_name:** CloudWatch log group name for notification-service (future)
- **log_group_notification_service_arn:** CloudWatch log group ARN for notification-service (future)
- **log_group_vpc_flow_logs_name:** CloudWatch log group name for VPC Flow Logs
- **log_group_vpc_flow_logs_arn:** CloudWatch log group ARN for VPC Flow Logs
- **log_group_lambda_payment_name:** CloudWatch log group name for payment analyzer Lambda
- **log_group_lambda_payment_arn:** CloudWatch log group ARN for payment analyzer Lambda
- **log_group_lambda_order_name:** CloudWatch log group name for order tracker Lambda
- **log_group_lambda_order_arn:** CloudWatch log group ARN for order tracker Lambda
- **log_group_lambda_user_name:** CloudWatch log group name for user analytics Lambda
- **log_group_lambda_user_arn:** CloudWatch log group ARN for user analytics Lambda

### KMS Encryption Keys (6 outputs)
- **kms_logs_key_id:** KMS key ID for CloudWatch Logs encryption
- **kms_logs_key_arn:** KMS key ARN for CloudWatch Logs encryption
- **kms_sns_key_id:** KMS key ID for SNS topic encryption
- **kms_sns_key_arn:** KMS key ARN for SNS topic encryption
- **kms_app_key_id:** KMS key ID for application data encryption (S3, SQS)
- **kms_app_key_arn:** KMS key ARN for application data encryption

### SNS Topics (6 outputs)
- **sns_critical_topic_arn:** SNS topic ARN for critical alerts
- **sns_critical_topic_name:** SNS topic name for critical alerts
- **sns_warning_topic_arn:** SNS topic ARN for warning alerts
- **sns_warning_topic_name:** SNS topic name for warning alerts
- **sns_info_topic_arn:** SNS topic ARN for informational alerts
- **sns_info_topic_name:** SNS topic name for informational alerts

### Lambda Functions (9 outputs)
- **lambda_payment_analyzer_name:** Lambda function name for payment failure analysis
- **lambda_payment_analyzer_arn:** Lambda function ARN for payment analyzer
- **lambda_payment_analyzer_role_arn:** IAM role ARN for payment analyzer Lambda
- **lambda_order_tracker_name:** Lambda function name for order value tracking
- **lambda_order_tracker_arn:** Lambda function ARN for order tracker
- **lambda_order_tracker_role_arn:** IAM role ARN for order tracker Lambda
- **lambda_user_analytics_name:** Lambda function name for user action analytics
- **lambda_user_analytics_arn:** Lambda function ARN for user analytics
- **lambda_user_analytics_role_arn:** IAM role ARN for user analytics Lambda

### ECS Resources (7 outputs)
- **ecs_cluster_id:** ECS Fargate cluster ID
- **ecs_service_auth_name:** ECS service name for auth-service
- **ecs_service_payment_name:** ECS service name for payment-service
- **ecs_service_order_name:** ECS service name for order-service
- **ecs_task_def_auth_arn:** ECS task definition ARN for auth-service
- **ecs_task_def_payment_arn:** ECS task definition ARN for payment-service
- **ecs_task_def_order_arn:** ECS task definition ARN for order-service

### Application Load Balancer (5 outputs)
- **alb_dns_name:** ALB DNS name for accessing services (marked sensitive)
- **alb_arn:** Application Load Balancer ARN
- **alb_target_group_auth_arn:** Target group ARN for auth-service
- **alb_target_group_payment_arn:** Target group ARN for payment-service
- **alb_target_group_order_arn:** Target group ARN for order-service

### VPC Networking (10 outputs)
- **vpc_id:** VPC identifier
- **subnet_private_1_id:** Private subnet 1 ID (AZ 1)
- **subnet_private_2_id:** Private subnet 2 ID (AZ 2)
- **subnet_private_3_id:** Private subnet 3 ID (AZ 3)
- **subnet_public_1_id:** Public subnet 1 ID (AZ 1)
- **subnet_public_2_id:** Public subnet 2 ID (AZ 2)
- **subnet_public_3_id:** Public subnet 3 ID (AZ 3)
- **nat_gateway_1_id:** NAT Gateway 1 ID (AZ 1)
- **nat_gateway_2_id:** NAT Gateway 2 ID (AZ 2)
- **nat_gateway_3_id:** NAT Gateway 3 ID (AZ 3)

### S3 Storage (2 outputs)
- **s3_alb_logs_bucket_name:** S3 bucket name for ALB access logs
- **s3_alb_logs_bucket_arn:** S3 bucket ARN for ALB access logs

### SQS Queue (2 outputs)
- **sqs_dlq_url:** SQS dead letter queue URL for failed SNS messages
- **sqs_dlq_arn:** SQS dead letter queue ARN

### CloudWatch Dashboard (2 outputs)
- **dashboard_name:** CloudWatch dashboard name for microservices monitoring
- **dashboard_url:** Direct URL to CloudWatch dashboard in AWS Console

### Composite Alarms (3 outputs)
- **composite_alarm_auth_name:** Composite alarm name for auth-service critical conditions
- **composite_alarm_payment_name:** Composite alarm name for payment-service critical conditions
- **composite_alarm_order_name:** Composite alarm name for order-service critical conditions

### EventBridge Rules (6 outputs)
- **eventbridge_rule_critical_name:** EventBridge rule name for critical alarm routing
- **eventbridge_rule_critical_arn:** EventBridge rule ARN for critical alarms
- **eventbridge_rule_warning_name:** EventBridge rule name for warning alarm routing
- **eventbridge_rule_warning_arn:** EventBridge rule ARN for warning alarms
- **eventbridge_rule_info_name:** EventBridge rule name for info alarm routing
- **eventbridge_rule_info_arn:** EventBridge rule ARN for info alarms

### X-Ray Tracing (2 outputs)
- **xray_sampling_rule_errors_id:** X-Ray sampling rule ID for error tracing (100% sampling)
- **xray_sampling_rule_success_id:** X-Ray sampling rule ID for success tracing (10% sampling)

### CloudWatch Insights Queries (5 outputs)
- **insights_query_slowest_requests:** Query for finding slowest requests across services
- **insights_query_recent_errors:** Query for recent error messages
- **insights_query_request_distribution:** Query for request distribution by endpoint
- **insights_query_service_health:** Query for service health overview
- **insights_query_response_time_stats:** Query for response time statistics (avg, min, max, p95)

### AWS Account Information (2 outputs)
- **region:** AWS region where resources are deployed (us-east-1)
- **account_id:** AWS account ID where resources are deployed

## Features Implemented

**Networking:**
- VPC with 6 subnets across 3 availability zones (3 public, 3 private)
- 3 NAT Gateways for production-grade high availability (one per AZ)
- Private subnets for ECS tasks with no direct internet access
- Public subnets for ALB and NAT Gateways
- VPC Flow Logs to CloudWatch with KMS encryption
- Route tables with proper isolation (each private subnet routes through its own NAT Gateway)
- Internet Gateway for public subnet connectivity

**Security:**
- 3 KMS customer-managed keys for data at rest encryption (logs, SNS, application)
- KMS key policies with service principal permissions and encryption context conditions
- IAM roles with least privilege permissions for ECS tasks, Lambda functions, and VPC Flow Logs
- S3 bucket policy with root account access first to prevent lockouts
- S3 bucket policy granting ALB service account write permissions
- Security groups with restricted ingress rules (ALB from internet, ECS from ALB only)
- All S3 buckets block public access
- ECS tasks in private subnets with no public IP addresses
- KMS encryption for CloudWatch Logs (30-day retention)
- KMS encryption for SNS topics

**High Availability:**
- 3 NAT Gateways (one per availability zone) for production-grade HA
- Subnets distributed across 3 availability zones
- ECS services can scale across multiple AZs
- ALB distributes traffic across all AZs
- Each private subnet has dedicated NAT Gateway for AZ isolation

**Monitoring and Logging:**
- 8 CloudWatch Log Groups with KMS encryption (5 services, VPC Flow Logs, 3 Lambda functions)
- 30-day log retention for microservices (compliance requirement)
- 1-day retention for Lambda and VPC Flow Logs (cost optimization)
- 17 CloudWatch metric filters extracting application metrics from JSON logs
- CloudWatch dashboard with 4 widgets (text header, error count, response time, request count)
- 18+ CloudWatch alarms for critical metrics (error count, response time, error rate, anomaly detection, DLQ)
- 3 composite alarms triggering only when multiple conditions met simultaneously
- 3 anomaly detection alarms using ANOMALY_DETECTION_BAND for request rate patterns
- 3 SNS topics for severity-based alerting (critical, warning, info)
- 3 EventBridge rules routing alarms to appropriate SNS topics based on alarm name prefix
- SQS dead letter queue for failed SNS notifications
- 3 Lambda functions processing logs for custom business metrics
- CloudWatch Logs subscription filters streaming logs to Lambda functions

**Data Protection:**
- S3 versioning enabled on ALB logs bucket
- S3 lifecycle policy transitioning logs to Glacier after 7 days, expiring after 30 days
- Encryption at rest using KMS for CloudWatch Logs and SNS
- Encryption at rest using AES256 for S3 (ALB compatibility)
- VPC Flow Logs capturing all network traffic for security analysis

**Compliance:**
- Resource tagging (Environment, CostCenter, ManagedBy, Compliance, Owner via default tags)
- Comprehensive audit trail via CloudWatch Logs
- Network isolation with private subnets
- Encryption at rest for all sensitive data
- KMS key rotation enabled on all customer-managed keys
- 30-day log retention meeting compliance requirements

**Distributed Tracing:**
- X-Ray daemon sidecars in all ECS task definitions
- X-Ray sampling rule for 100% error tracing (4xx status codes)
- X-Ray sampling rule for 10% success tracing (2xx status codes)
- IAM permissions for ECS tasks to publish X-Ray segments

**Application Load Balancer:**
- Internet-facing ALB in public subnets
- Path-based routing (/auth, /payment, /order)
- Health checks on all target groups
- Access logs to S3 with AES256 encryption
- HTTP/2 enabled
- No deletion protection (testing environment)

**ECS Fargate Services:**
- 3 microservices (auth-service, payment-service, order-service)
- Public nginx:latest images for automated deployment
- X-Ray daemon sidecars for distributed tracing
- CloudWatch Logs integration with awslogs driver
- Security groups restricting traffic to ALB only
- IAM task roles with permissions for X-Ray and CloudWatch metrics
- Container Insights enabled on ECS cluster

## Security Controls

### Encryption

**At Rest:**
- CloudWatch Logs encrypted with customer-managed KMS key (logs_encryption)
- SNS topics encrypted with customer-managed KMS key (sns_encryption)
- SQS dead letter queue encrypted with customer-managed KMS key (app_encryption)
- S3 bucket encrypted with AES256 (AWS-managed keys for ALB compatibility)
- All KMS keys have automatic rotation enabled

**In Transit:**
- ALB uses HTTP (testing configuration, HTTPS recommended for production)
- ECS tasks communicate with AWS services over HTTPS
- X-Ray traces sent over HTTPS

### IAM Policies

**ECS Task Execution Role:**
- ECR image pull from public repositories (Docker Hub)
- CloudWatch Logs write to specific log group ARNs only
- Managed policy: AmazonECSTaskExecutionRolePolicy

**ECS Task Roles (per service):**
- X-Ray: PutTraceSegments, PutTelemetryRecords (wildcard resource required by X-Ray)
- CloudWatch: PutMetricData to specific namespace only (MicroserviceMetrics/dev)

**Lambda Execution Roles (per function):**
- CloudWatch Logs: CreateLogStream, PutLogEvents for specific log groups
- CloudWatch Logs: FilterLogEvents, GetLogEvents for specific service log groups
- CloudWatch Metrics: PutMetricData to specific namespace (CustomMetrics/Business/dev)
- X-Ray: PutTraceSegments, PutTelemetryRecords
- Managed policy: AWSLambdaBasicExecutionRolePolicy

**VPC Flow Logs Role:**
- CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents, DescribeLogGroups, DescribeLogStreams for VPC Flow Logs log group only

### Network Security

- **VPC Isolation:** All ECS tasks in private subnets with no public IP addresses
- **Security Groups:**
  - ALB: Inbound HTTP (port 80) from internet (0.0.0.0/0), outbound all traffic
  - ECS Tasks: Inbound HTTP (port 80) from ALB security group only, outbound HTTPS (port 443) and all traffic for AWS API calls and container pulls
- **Network ACLs:** Default allow (can be customized for additional security)
- **Flow Logs:** All VPC traffic logged to CloudWatch for analysis
- **NAT Gateways:** Provide outbound internet for private subnets (container pulls, AWS API calls)

### Access Control

- S3 bucket policy includes root account access first to prevent lockouts
- S3 bucket policy grants ALB service account (arn:aws:iam::127311923021:root for us-east-1) write permissions
- S3 bucket policy grants log delivery service (delivery.logs.amazonaws.com) write and ACL check permissions
- KMS key policies grant root account full access to prevent lockouts
- KMS key policies grant service principals minimum required permissions (GenerateDataKey, Decrypt, Encrypt)
- KMS logs key policy restricts CloudWatch Logs to account-specific resources via encryption context condition
- All S3 buckets block public access (block_public_acls, block_public_policy, ignore_public_acls, restrict_public_buckets)

## Cost Optimization

**Instance Sizing:**
- ECS Tasks: 512 MB memory, 0.5 vCPU (right-sized for nginx demonstration)
- Lambda Functions: 512 MB memory, 300-second timeout (sufficient for log processing)
- NAT Gateways: 3 instances (production HA requirement, approximately 96 USD per month)

**Storage Lifecycle:**
- S3 lifecycle rules transition ALB logs to Glacier after 7 days
- S3 lifecycle rules expire ALB logs after 30 days
- CloudWatch Logs retention set to 30 days for microservices (compliance)
- CloudWatch Logs retention set to 1 day for Lambda and VPC Flow Logs (cost optimization)

**Capacity Management:**
- ECS services: 1 task per service (can scale based on demand)
- Lambda: Auto-scales, pay per invocation
- CloudWatch: Pay per GB ingested and stored

**Resource Cleanup:**
- S3 force_destroy enabled for testing scenarios (allows deletion with objects)
- KMS deletion window set to 7 days (minimum allowed)
- ALB deletion protection disabled for testing workflows
- ECS services force_delete enabled for clean removal

**Estimated Monthly Cost (if resources not destroyed):**
- NAT Gateways: 96 USD (3 x 32 USD)
- ECS Fargate: 15-20 USD (3 tasks x 0.5 vCPU x 1 GB)
- ALB: 20-25 USD (base + LCU charges)
- CloudWatch Logs: 5-10 USD (depends on log volume)
- Lambda: <1 USD (minimal invocations)
- KMS: <1 USD (3 keys, minimal requests)
- S3: <1 USD (minimal storage)
- **Total: Approximately 120-130 USD per month**

## Monitoring and Alerting

### CloudWatch Alarms

**Error Count Alarms (3 alarms):**
- Alarm: Error count exceeds 10 in 5-minute period
- Evaluation: 1 period
- Action: Publish to warning SNS topic
- Metrics: error_count from MicroserviceMetrics/dev namespace

**Response Time Alarms (3 alarms):**
- Alarm: Average response time exceeds 1000ms
- Evaluation: 2 consecutive periods
- Action: Publish to warning SNS topic
- Metrics: response_time from MicroserviceMetrics/dev namespace

**Error Rate Alarms (3 alarms):**
- Alarm: Error rate exceeds 5 percent
- Evaluation: 2 consecutive periods
- Action: Publish to warning SNS topic
- Metrics: Calculated using metric math (error_count / request_count x 100)

**Composite Alarms (3 alarms):**
- Alarm: Both error rate AND response time alarms in ALARM state
- Action: Publish to critical SNS topic
- Logic: Triggers only when multiple conditions met simultaneously

**Anomaly Detection Alarms (3 alarms):**
- Alarm: Request count falls outside expected range (2 standard deviations)
- Evaluation: 3 consecutive periods
- Action: Publish to warning SNS topic
- Metrics: Uses ANOMALY_DETECTION_BAND expression

**DLQ Monitoring Alarm (1 alarm):**
- Alarm: Messages accumulate in SNS dead letter queue
- Threshold: More than 1 message visible
- Action: Publish to warning SNS topic

### Log Aggregation

- **ECS Services:** Application logs, nginx access logs, X-Ray daemon logs
- **Lambda Functions:** Execution logs, errors, custom application logs
- **VPC Flow Logs:** Network traffic analysis, security monitoring, accepted and rejected connections
- **ALB Access Logs:** HTTP request logs stored in S3

All CloudWatch Logs encrypted with KMS and retained according to policy (30 days for services, 1 day for Lambda/VPC).

### Metric Filters

**Request Count Filters (5 filters):**
- Pattern: { $.status = * }
- Extracts: Count of all log entries with status field
- Namespace: MicroserviceMetrics/dev

**Error Count Filters (5 filters):**
- Pattern: { $.status >= 400 }
- Extracts: Count of 4xx and 5xx responses
- Namespace: MicroserviceMetrics/dev

**Response Time Filters (5 filters):**
- Pattern: { $.request_time = * }
- Extracts: Response time values from JSON logs
- Namespace: MicroserviceMetrics/dev

**Payment Amount Filter (1 filter):**
- Pattern: { $.payment_amount = * }
- Extracts: Payment transaction amounts
- Namespace: MicroserviceMetrics/dev

**Order Value Filter (1 filter):**
- Pattern: { $.order_value = * }
- Extracts: Order values for revenue tracking
- Namespace: MicroserviceMetrics/dev

### Custom Business Metrics (Lambda Functions)

**Payment Failure Analyzer:**
- Processes payment-service logs
- Calculates failure rates by payment method
- Publishes PaymentFailureRate, PaymentTransactions, PaymentVolume metrics
- Namespace: CustomMetrics/Business/dev

**Order Value Tracker:**
- Processes order-service logs
- Tracks order values and revenue
- Publishes order-related business metrics
- Namespace: CustomMetrics/Business/dev

**User Action Analytics:**
- Processes auth-service logs
- Analyzes user authentication patterns
- Publishes user behavior metrics
- Namespace: CustomMetrics/Business/dev

## Additional Notes

**Deployment Time:** Approximately 22-25 minutes. ECS services and ALB take longest to provision (15-20 minutes). NAT Gateways deploy in parallel reducing overall time.

**Destroy Time:** Approximately 10-15 minutes. All resources configured for clean deletion (force_destroy on S3, no deletion protection on ALB, 7-day KMS deletion window).

**Region:** Deployed to us-east-1 with 3 availability zones (us-east-1a, us-east-1b, us-east-1c).

**Terraform Version:** Requires Terraform 1.5.0 or higher for modern features and provider compatibility.

**AWS Provider:** Version 5.x (uses pessimistic constraint ~> 5.0 allowing 5.x updates but preventing major version changes).

**Archive Provider:** Version 2.4.x required for Lambda function packaging.

**SNS Email Subscriptions:** Require manual confirmation via email. Check inbox for subscription confirmation emails after deployment.

**ALB DNS Name:** Use the alb_dns_name output to access the microservices. Example: http://alb-main-dev-123456789.us-east-1.elb.amazonaws.com

**Service Endpoints:**
- Auth Service: http://ALB_DNS/auth
- Payment Service: http://ALB_DNS/payment
- Order Service: http://ALB_DNS/order
- Default: http://ALB_DNS/ (routes to auth-service)

**CloudWatch Dashboard:** Access via dashboard_url output or navigate to CloudWatch console and search for "dashboard-microservices-dev".

**X-Ray Traces:** View in AWS X-Ray console after generating traffic to the microservices.

**Custom Metrics:** Lambda functions will publish metrics after log data is generated. Nginx containers generate basic access logs but not full business metrics (payment_amount, order_value) - these would require actual application code.

**Future Services:** Log groups created for inventory-service and notification-service. Deploy ECS tasks for these services when ready, and they will automatically integrate with the observability platform.
