# AWS Compliance Monitoring Infrastructure

This Terraform configuration deploys a comprehensive compliance monitoring system for AWS infrastructure.

## Architecture

- **AWS Config**: Monitors S3 encryption and RDS public access
- **Lambda Functions**: Analyze compliance and tag non-compliant resources
- **CloudWatch**: Metrics, dashboards, and event triggers
- **SNS**: Multi-level alerting (critical and warning)

## Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured
- Node.js 18.x (for Lambda functions)

## Deployment

1. Install Lambda dependencies and create deployment packages:
   ```bash
   cd lambda/compliance_analyzer
   npm install
   zip -r ../compliance_analyzer.zip .
   cd ../compliance_tagger
   npm install
   zip -r ../compliance_tagger.zip .
   cd ../..
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Plan deployment:
   ```bash
   terraform plan -var="environment_suffix=dev"
   ```

4. Apply configuration:
   ```bash
   terraform apply -var="environment_suffix=dev"
   ```

## Configuration

Update `variables.tf` or provide values via command line:

- `environment_suffix`: Unique identifier for resources
- `security_team_emails`: Email addresses for alerts
- `aws_region`: Deployment region (default: eu-central-1)
- `lambda_timeout`: Lambda execution timeout (default: 180 seconds)

## Outputs

- `config_bucket_name`: S3 bucket for Config data
- `critical_alerts_topic_arn`: SNS topic for critical alerts
- `warning_alerts_topic_arn`: SNS topic for warning alerts
- `dashboard_url`: CloudWatch dashboard URL
