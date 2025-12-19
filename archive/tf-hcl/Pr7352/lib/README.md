# Zero-Downtime Blue-Green Migration Infrastructure

This Terraform infrastructure orchestrates a zero-downtime blue-green deployment for migrating a legacy on-premises payment processing system to AWS. The infrastructure supports gradual traffic shifting, automatic health monitoring, and instant rollback capabilities.

## Architecture Overview

The infrastructure implements a comprehensive blue-green deployment strategy with the following key components:

### Core Components

1. **Network Infrastructure**
   - VPC with 3 availability zones in eu-central-1
   - Public subnets for ALB
   - Private subnets for compute resources
   - Database subnets for Aurora
   - Transit Gateway for on-premises connectivity

2. **Database Layer**
   - Aurora PostgreSQL 14.6 cluster with writer and reader endpoints
   - SSL/TLS encryption with certificate validation
   - 35-day point-in-time recovery
   - Multi-AZ deployment for high availability

3. **Data Migration**
   - DMS replication instances for continuous data synchronization
   - Lambda functions (1GB memory) for real-time data transformation
   - Reserved concurrency for guaranteed performance

4. **Traffic Management**
   - Application Load Balancer with weighted target groups
   - Route53 health checks with automatic failback
   - Gradual traffic shifting between blue and green environments

5. **Session Management**
   - DynamoDB tables with on-demand billing
   - Encryption at rest and in transit
   - Point-in-time recovery enabled

6. **Monitoring and Observability**
   - CloudWatch dashboards for migration metrics
   - CloudWatch alarms with SNS notifications
   - Comprehensive logging for all services

7. **Security and Compliance**
   - IAM roles with session tags for cross-account access
   - VPC endpoints for AWS service communications
   - Encryption for all data at rest and in transit
   - GDPR-compliant data residency in eu-central-1

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Go 1.21+ (for running tests)
- Access to two AWS accounts (blue and green environments)
- Existing Transit Gateway connected to on-premises datacenter
- Domain name with Route53 hosted zone

## File Structure

```
lib/
├── provider.tf              # Terraform and provider configuration
├── variables.tf             # Variable definitions
├── vpc.tf                   # VPC and network infrastructure
├── transit-gateway.tf       # Transit Gateway attachment
├── vpc-endpoints.tf         # VPC endpoints for AWS services
├── aurora.tf                # Aurora PostgreSQL cluster
├── dms.tf                   # DMS replication configuration
├── lambda.tf                # Lambda functions for data transformation
├── alb.tf                   # Application Load Balancer
├── dynamodb.tf              # DynamoDB tables for session state
├── s3.tf                    # S3 buckets for logs
├── route53.tf               # Route53 health checks and DNS
├── cloudwatch.tf            # CloudWatch dashboards and alarms
├── iam.tf                   # IAM roles and policies
├── outputs.tf               # Output values
├── terraform.tfvars.example # Example variables file
├── lambda/
│   └── data_transformation.py  # Lambda function code
└── README.md                # This file

test/
├── go.mod                   # Go module definition
└── terraform_validation_test.go  # Terratest validation tests
```

## Deployment Instructions

### Step 1: Prepare Configuration

1. Copy the example variables file:
   ```bash
   cd lib
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your specific values:
   - Update AWS account IDs for blue and green environments
   - Set domain name and alert email
   - Configure on-premises database connection details
   - Set strong passwords for Aurora database
   - Update Transit Gateway ID

### Step 2: Initialize Terraform

```bash
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=migration/blue/terraform.tfstate" \
  -backend-config="region=eu-central-1"
```

### Step 3: Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully to ensure all resources are configured correctly.

### Step 4: Apply Configuration

```bash
terraform apply tfplan
```

This will create all infrastructure resources. The initial deployment typically takes 20-30 minutes due to Aurora and DMS resource provisioning.

### Step 5: Start DMS Replication

After the infrastructure is deployed, start the DMS replication task:

```bash
aws dms start-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn) \
  --start-replication-task-type start-replication \
  --region eu-central-1
```

### Step 6: Monitor Migration

1. Access the CloudWatch dashboard:
   ```bash
   terraform output cloudwatch_dashboard_name
   ```

2. Monitor key metrics:
   - DMS replication lag
   - Transaction throughput
   - Error rates
   - Lambda function performance

### Step 7: Gradual Traffic Shift

Gradually shift traffic from on-premises to AWS:

1. **Phase 1 (10% to green):**
   ```hcl
   alb_target_weight_blue  = 90
   alb_target_weight_green = 10
   ```

2. **Phase 2 (25% to green):**
   ```hcl
   alb_target_weight_blue  = 75
   alb_target_weight_green = 25
   ```

3. **Phase 3 (50% to green):**
   ```hcl
   alb_target_weight_blue  = 50
   alb_target_weight_green = 50
   ```

4. **Phase 4 (75% to green):**
   ```hcl
   alb_target_weight_blue  = 25
   alb_target_weight_green = 75
   ```

5. **Phase 5 (100% to green):**
   ```hcl
   alb_target_weight_blue  = 0
   alb_target_weight_green = 100
   ```

After each phase, monitor for 1-2 hours before proceeding to the next phase.

### Step 8: Automatic Failback

If the error rate exceeds 5%, Route53 health checks will automatically trigger failback to on-premises. Monitor SNS notifications for any alerts.

## Testing

Run the validation tests:

```bash
cd test
go mod download
go test -v -timeout 30m
```

Tests include:
- Terraform configuration validation
- Format checking
- VPC configuration verification
- Aurora setup validation
- DMS configuration checks
- Lambda function validation
- ALB configuration verification
- Security group validation
- CloudWatch monitoring setup

## Important Constraints

1. **SSL/TLS Encryption**: Mandatory for all database connections with certificate validation
2. **Backup Retention**: Aurora configured with 35-day point-in-time recovery
3. **Reserved Concurrency**: All Lambda functions have reserved concurrency configured
4. **DynamoDB Billing**: Must use on-demand billing mode only
5. **S3 Versioning**: All buckets have versioning enabled with lifecycle policies
6. **VPC Endpoints**: Required for all AWS service communications to avoid internet gateway charges
7. **CloudWatch Alarms**: All alarms trigger SNS notifications for failures
8. **Data Residency**: All infrastructure remains within eu-central-1 region
9. **Cross-Account Access**: Separate AWS accounts for blue and green with IAM roles using session tags

## Outputs

After deployment, retrieve important values:

```bash
# Aurora database endpoint
terraform output aurora_cluster_endpoint

# ALB DNS name
terraform output alb_dns_name

# SNS topic for alerts
terraform output sns_topic_arn

# CloudWatch dashboard
terraform output cloudwatch_dashboard_name
```

## Rollback Procedure

If issues are detected:

1. **Immediate Rollback**: Update ALB weights to route 100% traffic back to blue:
   ```bash
   terraform apply -var="alb_target_weight_blue=100" -var="alb_target_weight_green=0"
   ```

2. **Automatic Rollback**: Route53 health checks automatically failback to on-premises if error rate exceeds 5%

3. **Manual Investigation**: Check CloudWatch logs and metrics:
   ```bash
   aws logs tail /aws/lambda/data-transformation-${environment_suffix} --follow
   ```

## Cost Optimization

This infrastructure uses serverless and on-demand resources where possible:
- DynamoDB on-demand billing
- Aurora Serverless (optional, modify aurora_instance_class)
- Lambda with reserved concurrency
- S3 lifecycle policies for log retention

## Security Considerations

1. **Encryption**: All data encrypted at rest and in transit
2. **Network Isolation**: Private subnets for compute and data tiers
3. **IAM Best Practices**: Least-privilege access with session tags
4. **Audit Trail**: CloudTrail and CloudWatch logs for compliance
5. **VPC Endpoints**: Avoid internet gateway charges and improve security

## Troubleshooting

### DMS Replication Issues

```bash
# Check replication task status
aws dms describe-replication-tasks \
  --filters "Name=replication-task-arn,Values=$(terraform output -raw dms_replication_task_arn)"

# View DMS logs
aws logs tail /aws/dms/${environment_suffix} --follow
```

### Lambda Errors

```bash
# View Lambda logs
aws logs tail /aws/lambda/data-transformation-${environment_suffix} --follow

# Check Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=data-transformation-${environment_suffix} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### Aurora Connection Issues

```bash
# Test Aurora connectivity
aws rds describe-db-clusters \
  --db-cluster-identifier aurora-cluster-${environment_suffix}

# Check Aurora metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=aurora-cluster-${environment_suffix} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Note: Ensure DMS replication task is stopped before destroying:

```bash
aws dms stop-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)
```

## Support

For issues or questions:
1. Check CloudWatch dashboard for migration metrics
2. Review CloudWatch Logs for detailed error messages
3. Monitor SNS alerts for critical failures
4. Contact the infrastructure team for assistance

## License

Internal use only - TuringGPT Payment Migration Project
