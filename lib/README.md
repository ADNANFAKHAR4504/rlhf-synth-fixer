# Blue-Green Deployment Infrastructure for Payment Processing System

This CloudFormation implementation provides a complete blue-green deployment infrastructure for migrating a payment processing system to AWS with zero downtime, PCI DSS compliance, and automated traffic management.

## Architecture Overview

The solution uses CloudFormation nested stacks to create a modular, maintainable infrastructure:

### Core Components

1. **VPC and Networking** (`network-stack.json`)
   - VPC spanning 3 availability zones
   - Public and private subnets in each AZ
   - NAT Gateways for outbound internet access
   - Security groups for ALB, ECS, databases, and DMS

2. **Security** (`security-stack.json`)
   - Customer-managed KMS keys for encryption
   - Automatic key rotation enabled
   - Service permissions for RDS, Backup, DMS, and Secrets Manager

3. **Database Clusters** (`database-stack.json`)
   - Separate Aurora MySQL clusters for blue and green environments
   - Multi-AZ deployment with read replicas
   - Encryption at rest using KMS
   - Credentials in Secrets Manager with 30-day rotation
   - 7-day backup retention period

4. **AWS DMS** (Database Migration Service)
   - Replication instance in private subnets
   - Continuous data synchronization between blue and green databases
   - Monitoring for replication lag

5. **ECS Fargate Services**
   - Containerized payment processing application
   - Separate services for blue and green environments
   - Private subnet deployment with security group restrictions

6. **Application Load Balancer**
   - Weighted target groups for blue and green
   - HTTP/HTTPS listeners
   - Health check configuration
   - Public subnet deployment

7. **Route 53**
   - Weighted routing policies for gradual traffic migration
   - Alias records pointing to ALB
   - Support for custom domain names

8. **CloudWatch Monitoring**
   - Database replication lag alarms
   - Application health alarms
   - Target group health metrics
   - Custom metrics for payment throughput

9. **Lambda Automation**
   - Automated traffic shifting based on health metrics
   - Rollback capability on health check failures
   - SNS notifications for deployment events

10. **AWS Backup**
    - Automated backup plans for both database clusters
    - 7-day retention with KMS encryption
    - Cross-region backup support

11. **Systems Manager Parameter Store**
    - Environment-specific configuration
    - Database endpoints
    - Application settings
    - Secure string parameters for sensitive data

## Prerequisites

- AWS CLI 2.x installed and configured
- AWS account with appropriate permissions
- Route 53 hosted zone (for domain management)
- S3 bucket for CloudFormation templates
- Docker images for payment processing application

## Deployment Instructions

### Step 1: Prepare Templates

Upload all nested stack templates to S3:

```bash
# Create S3 bucket for templates
aws s3 mb s3://your-cfn-templates-bucket

# Upload nested stacks
aws s3 cp lib/nested-stacks/ s3://your-cfn-templates-bucket/nested-stacks/ --recursive

# Update master-stack.json TemplateURL values to point to your bucket
```

### Step 2: Deploy Master Stack

```bash
# Create the master stack
aws cloudformation create-stack \
  --stack-name payment-migration-prod \
  --template-body file://lib/master-stack.json \
  --parameters file://lib/parameters.json \
  --capabilities CAPABILITY_IAM \
  --tags Key=Project,Value=PaymentMigration Key=CostCenter,Value=Finance

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name payment-migration-prod

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name payment-migration-prod \
  --query 'Stacks[0].Outputs'
```

### Step 3: Initial Data Setup

```bash
# Connect to blue database and load initial data
BLUE_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name payment-migration-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`BlueDBEndpoint`].OutputValue' \
  --output text)

# Load schema and initial data into blue environment
mysql -h $BLUE_ENDPOINT -u dbadmin -p < scripts/schema.sql
mysql -h $BLUE_ENDPOINT -u dbadmin -p < scripts/initial-data.sql
```

### Step 4: Start DMS Replication

```bash
# Start the DMS replication task
aws dms start-replication-task \
  --replication-task-arn <DMS_TASK_ARN> \
  --start-replication-task-type start-replication

# Monitor replication status
aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=<DMS_TASK_ARN>
```

### Step 5: Traffic Migration

The traffic migration follows a gradual approach:

1. **Initial State**: 100% traffic to blue, 0% to green
2. **Phase 1**: 90% blue, 10% green (test with small traffic)
3. **Phase 2**: 50% blue, 50% green (equal distribution)
4. **Phase 3**: 10% blue, 90% green (prepare for cutover)
5. **Final State**: 0% blue, 100% green (complete migration)

```bash
# Update Route 53 weights using Lambda function or AWS CLI
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch file://traffic-shift-config.json

# Monitor application health
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=<ALB_NAME> \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

### Step 6: Rollback (if needed)

If issues are detected during migration:

```bash
# Immediately shift all traffic back to blue
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch file://rollback-to-blue.json

# Investigate green environment issues
# Fix issues and retry migration
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-suffix`

Examples:
- `vpc-prod`
- `blue-db-cluster-prod`
- `green-ecs-service-prod`
- `alb-sg-prod`

## Security Features

1. **Encryption**
   - All data encrypted at rest using customer-managed KMS keys
   - Automatic key rotation enabled
   - SSL/TLS for data in transit

2. **Network Security**
   - Private subnets for compute and database tiers
   - Security groups with least privilege access
   - NAT Gateways for controlled outbound access
   - AWS PrivateLink for service-to-service communication

3. **Credential Management**
   - Secrets Manager for database credentials
   - Automatic 30-day password rotation
   - IAM roles for service authentication
   - No hardcoded credentials

4. **Compliance**
   - PCI DSS compliant infrastructure
   - CloudWatch logging enabled
   - AWS Backup for disaster recovery
   - Audit trails via CloudTrail

## Monitoring and Alerts

### CloudWatch Alarms

1. **Database Replication Lag**
   - Threshold: > 60 seconds
   - Action: SNS notification to operations team

2. **Application Health**
   - Unhealthy target count > 0
   - Action: Automatic rollback if sustained

3. **Target Response Time**
   - Threshold: > 500ms
   - Action: Alert and investigation

4. **DMS Replication Errors**
   - Any replication failure
   - Action: Immediate notification

### Dashboard

Create a CloudWatch dashboard to visualize:
- Database replication status
- Application health across blue/green
- Traffic distribution percentages
- Error rates and latency metrics

## Cost Optimization

1. **Serverless Where Possible**
   - ECS Fargate for containerized workloads
   - Aurora Serverless option (consider for non-prod)
   - Lambda for automation

2. **Right-Sizing**
   - Start with db.r5.large instances
   - Monitor and adjust based on load
   - Use RDS Performance Insights

3. **Backup Strategy**
   - 7-day retention (adjust based on requirements)
   - Automated lifecycle policies
   - Cross-region backup only if needed

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events for specific error
2. Common issues:
   - S3 bucket permissions for nested stacks
   - IAM permissions insufficient
   - Parameter validation errors
   - Resource limits exceeded

### Database Connection Issues

1. Verify security group rules
2. Check Secrets Manager for correct credentials
3. Ensure ECS tasks have proper IAM roles
4. Validate DB subnet group configuration

### DMS Replication Issues

1. Check replication instance status
2. Verify source and target endpoint connectivity
3. Review CloudWatch logs for DMS
4. Ensure sufficient storage on replication instance

### Traffic Not Shifting

1. Verify Route 53 records and weights
2. Check ALB target group health
3. Ensure Lambda automation function has correct permissions
4. Review CloudWatch logs for Lambda errors

## Cleanup

To delete the entire infrastructure:

```bash
# Delete the master stack (will delete all nested stacks)
aws cloudformation delete-stack \
  --stack-name payment-migration-prod

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name payment-migration-prod

# Verify all resources are deleted
aws cloudformation list-stacks \
  --stack-status-filter DELETE_COMPLETE
```

## File Structure

```
lib/
├── master-stack.json           # Orchestrates all nested stacks
├── parameters.json             # Stack parameters
├── README.md                   # This file
├── PROMPT.md                   # Original requirements
├── MODEL_RESPONSE.md           # Generated templates
└── nested-stacks/
    ├── security-stack.json     # KMS keys and security
    ├── network-stack.json      # VPC and networking
    ├── database-stack.json     # Aurora MySQL clusters
    ├── dms-stack.json          # Database migration service
    ├── ecs-stack.json          # Fargate services
    ├── alb-stack.json          # Application Load Balancer
    ├── route53-stack.json      # DNS management
    ├── monitoring-stack.json   # CloudWatch alarms
    ├── automation-stack.json   # Lambda functions
    ├── backup-stack.json       # AWS Backup plans
    └── ssm-parameter-stack.json # Parameter Store
```

## Best Practices

1. **Testing**
   - Deploy to dev environment first
   - Test failover and rollback procedures
   - Load test both blue and green environments

2. **Documentation**
   - Maintain runbooks for common operations
   - Document custom configurations
   - Keep architecture diagrams updated

3. **Monitoring**
   - Set up comprehensive alerting
   - Regular review of CloudWatch metrics
   - Monthly cost analysis

4. **Security**
   - Regular security audits
   - Keep components updated
   - Review IAM policies quarterly

## Support

For issues or questions:
1. Review CloudFormation events and outputs
2. Check CloudWatch logs
3. Consult AWS documentation
4. Contact AWS Support if needed

## License

This infrastructure code is provided as-is for the payment processing system migration project.
