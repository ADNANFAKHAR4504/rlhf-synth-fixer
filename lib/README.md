# Payment Processing System Migration to AWS

This Terraform infrastructure code provides a comprehensive solution for migrating a payment processing system from on-premises to AWS with zero downtime capability.

## Overview

This infrastructure implements a blue-green deployment strategy for migrating payment processing workloads to AWS, featuring:
- Multi-AZ deployment across 3 availability zones
- AWS DMS for continuous database replication with CDC
- ECS Fargate for containerized application workloads
- Route 53 weighted routing for gradual traffic shifting
- Application Load Balancer with blue-green deployment support

## Architecture

### Network Infrastructure
- **VPC**: Multi-AZ VPC spanning 3 availability zones in us-east-1
- **Subnets**: Public, private application, and private database subnets across all AZs
- **NAT Gateways**: High-availability NAT gateways for private subnet internet access
- **VPC Endpoints**: Systems Manager endpoints for secure parameter access

### Database Layer
- **Aurora MySQL 8.0**: Multi-AZ cluster with read replicas
- **AWS DMS**: Replication instance with CDC-enabled tasks for continuous sync
- **Credentials**: Securely stored in AWS Systems Manager Parameter Store

### Compute Layer
- **ECS Cluster**: Fargate-based containerized application platform
- **Auto-scaling**: CPU and memory-based scaling for both blue and green services
- **Task Definition**: Configurable container specifications with environment variables

### Load Balancing
- **Application Load Balancer**: Multi-AZ deployment with health checks
- **Target Groups**: Blue and green groups for zero-downtime deployments
- **Access Logs**: S3-backed logging for compliance and monitoring

### DNS and Traffic Management
- **Route 53**: Private hosted zone with weighted routing
- **Health Checks**: Automated failover based on endpoint health
- **Gradual Migration**: Weighted records for controlled traffic shifting

### Monitoring and Logging
- **CloudWatch**: Log groups for application, database, and migration events
- **Kinesis Firehose**: Log forwarding to S3 for long-term retention
- **Alarms**: DMS replication lag monitoring

## Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured with appropriate credentials
- Access to AWS account with permissions for VPC, ECS, RDS, DMS, Route 53, etc.
- Docker image repository with payment application image

## Terraform Workspaces

This infrastructure uses Terraform workspaces to manage multiple environments:

- `staging-migration`: Staging environment for testing migration procedures
- `production-migration`: Production environment for actual migration

## Configuration

### Required Variables

Configure the following variables in `terraform.tfvars`:

```hcl
environment_suffix    = "dev"           # Environment identifier
aws_region           = "us-east-1"      # AWS region
vpc_cidr             = "10.0.0.0/16"    # VPC CIDR block
db_username          = "admin"          # Database admin username
db_password          = "SecurePass123"  # Database password (use secure method)
onprem_db_host       = "10.1.0.10"      # On-premises database host
onprem_db_port       = 3306             # On-premises database port
onprem_db_name       = "payments"       # Database name
docker_image         = "123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-app:latest"
```

## Deployment

### Initial Setup

1. **Initialize Terraform**:
   ```bash
   cd lib
   terraform init
   ```

2. **Create Workspace**:
   ```bash
   terraform workspace new staging-migration
   ```

3. **Plan Infrastructure**:
   ```bash
   terraform plan
   ```

4. **Deploy Infrastructure**:
   ```bash
   terraform apply
   ```

### Migration Process

1. **Deploy AWS Infrastructure**:
   ```bash
   terraform workspace select staging-migration
   terraform apply
   ```

2. **Start DMS Replication**:
   - DMS automatically starts continuous data replication
   - Monitor replication lag via CloudWatch alarms

3. **Validate Application**:
   - Test application connectivity to Aurora database
   - Verify ECS tasks are running and healthy

4. **Gradual Traffic Shift**:
   - Adjust Route 53 weighted routing (configured in `dns.tf`)
   - Start with 10% traffic to AWS, monitor metrics
   - Incrementally increase to 100%

5. **Production Cutover**:
   ```bash
   terraform workspace select production-migration
   terraform apply
   ```

### Rollback Procedure

If issues are detected during migration:

1. **Adjust Traffic Weights**:
   - Modify Route 53 weighted records to shift traffic back to on-premises

2. **Workspace Rollback**:
   ```bash
   terraform workspace select staging-migration
   ```

## Monitoring

### Key Metrics

- **DMS Replication Lag**: CloudWatch alarm for replication delay
- **ALB Health**: Target group health check status
- **ECS Tasks**: Task health and auto-scaling metrics
- **Database**: Aurora CPU, connections, and replication lag

### Log Access

- **Application Logs**: CloudWatch Log Group `/aws/ecs/payment-app-{env}`
- **ALB Logs**: S3 bucket `payment-alb-logs-{env}`
- **Database Logs**: CloudWatch Log Groups for error, audit, slowquery, general logs

## Outputs

After deployment, Terraform outputs include:

- VPC and subnet IDs
- Aurora cluster endpoints (writer and reader)
- ALB DNS name
- ECS cluster ARN
- DMS replication task ARN
- Route 53 hosted zone ID

Access outputs with:
```bash
terraform output
```

## Security Considerations

- Database credentials stored in Systems Manager Parameter Store
- All sensitive variables marked as sensitive in Terraform
- VPC security groups follow least-privilege principle
- Private subnets for application and database tiers
- Encryption at rest enabled for Aurora and S3
- ALB access logs enabled for audit trail

## Cost Optimization

For QA/testing environments:
- Deletion protection is disabled
- Skip final snapshots enabled
- Consider smaller instance types
- Use Fargate Spot for non-production workloads

## Cleanup

To destroy the infrastructure:

```bash
terraform workspace select staging-migration
terraform destroy
```

**Warning**: Ensure all data is backed up before destroying production infrastructure.

## Troubleshooting

### DMS Replication Issues
- Check DMS task logs in CloudWatch
- Verify network connectivity to on-premises database
- Confirm source database permissions

### ECS Task Failures
- Review ECS task logs in CloudWatch
- Check IAM role permissions
- Verify container image availability

### Aurora Connection Issues
- Verify security group rules
- Check parameter store for correct credentials
- Confirm VPC endpoint connectivity

## Support

For issues or questions:
- Review CloudWatch logs
- Check Terraform state: `terraform show`
- Validate configuration: `terraform validate`

## Additional Resources

- [AWS DMS Best Practices](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_BestPractices.html)
- [ECS Fargate Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Aurora MySQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraMySQL.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
