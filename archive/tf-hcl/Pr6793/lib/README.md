# Multi-Region Disaster Recovery Migration

This Terraform configuration implements a multi-region disaster recovery solution for migrating a transaction processing system from AWS us-west-1 to us-west-2.

## Overview

This infrastructure provides a complete migration framework that:
- Preserves logical resource identities across regions
- Uses Terraform import to avoid resource recreation
- Implements zero-downtime cutover using DNS routing
- Maintains security posture and compliance requirements
- Supports rapid rollback procedures

## Architecture

### Network Topology
- VPC with public and private subnets across 2 availability zones
- Internet Gateway for public subnet connectivity
- Route tables for network traffic management
- Security groups for multi-tier application (web, app, database)

### Compute Resources
- Application Load Balancer (ALB) for traffic distribution
- Auto Scaling Group with configurable capacity
- Launch Templates for consistent EC2 instance configuration
- Health checks and monitoring

### Database
- RDS MySQL instance with encryption
- Automated backups with configurable retention
- Multi-AZ deployment capability
- DB subnet group for network isolation

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Access to both us-west-1 and us-west-2 regions
- S3 bucket for Terraform state storage
- DynamoDB table for state locking

## Directory Structure

```
lib/
├── main.tf                  # Main infrastructure resources
├── variables.tf             # Variable definitions
├── backend.tf              # Backend configuration
├── outputs.tf              # Output values
├── provider.tf             # Provider configuration
├── state-migration.md      # State migration procedures
├── id-mapping.csv          # Resource ID mapping table
├── runbook.md              # Migration runbook
└── README.md               # This file
```

## Usage

### Initial Setup

1. Configure AWS credentials:
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-west-2"
```

2. Initialize Terraform:
```bash
cd lib/
terraform init
```

3. Create workspace for target region:
```bash
terraform workspace new myapp-us-west-2
terraform workspace select myapp-us-west-2
```

4. Review and customize variables:
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### Deployment

1. Plan the infrastructure:
```bash
terraform plan -out=migration.tfplan
```

2. Apply the configuration:
```bash
terraform apply migration.tfplan
```

3. Verify outputs:
```bash
terraform output
```

### State Migration

Follow the detailed procedures in `state-migration.md` to migrate Terraform state from us-west-1 to us-west-2.

Key steps:
1. Backup current state
2. Create new workspace
3. Import resources in dependency order
4. Verify state consistency

### DNS Cutover

Follow the procedures in `runbook.md` for the complete migration process including DNS cutover.

## Configuration

### Required Variables

- `environment_suffix`: Unique suffix for resource naming (required)
- `aws_region`: Target AWS region (default: us-west-2)
- `project_name`: Project name for resource prefixes

### Optional Variables

- `vpc_cidr`: VPC CIDR block (default: 10.0.0.0/16)
- `public_subnet_cidrs`: List of public subnet CIDRs
- `private_subnet_cidrs`: List of private subnet CIDRs
- `ami_id`: AMI ID for EC2 instances
- `instance_type`: EC2 instance type (default: t3.medium)
- `db_instance_class`: RDS instance class (default: db.t3.micro)
- `enable_deletion_protection`: Enable deletion protection (default: false)

See `variables.tf` for complete list of configurable parameters.

## Resource Naming Convention

All resources follow the naming pattern:
```
{project_name}-{resource-type}-{environment_suffix}
```

Example: `myapp-vpc-dev`, `myapp-alb-prod`

The `environment_suffix` variable ensures unique resource names and is included in all resource tags.

## Outputs

Key outputs after deployment:

- `alb_dns_name`: DNS name of the Application Load Balancer
- `vpc_id`: ID of the VPC
- `db_instance_endpoint`: RDS instance connection endpoint
- `asg_name`: Auto Scaling Group name

## Security Considerations

### Network Security
- Multi-tier security groups (web, app, database)
- Principle of least privilege for security group rules
- Private subnets for application and database tiers
- Public subnets only for load balancer

### Data Security
- RDS encryption at rest enabled
- Sensitive variables marked as sensitive
- Deletion protection configurable
- Automated backups enabled

### Access Control
- IAM roles for EC2 instances (to be configured)
- Security group rules restrict traffic between tiers
- Database not publicly accessible

## Monitoring and Logging

- CloudWatch metrics for ALB, EC2, and RDS
- Target health monitoring
- Auto Scaling Group metrics
- Application logs (configure log groups as needed)

## Backup and Recovery

### Automated Backups
- RDS automated backups with 7-day retention
- Backup window: 03:00-04:00 UTC
- Maintenance window: Sunday 04:00-05:00 UTC

### Manual Snapshots
Recommended before major changes:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier myapp-database \
  --db-snapshot-identifier manual-snapshot-$(date +%Y%m%d)
```

### Terraform State Backups
Always backup state before migrations:
```bash
terraform state pull > backup-$(date +%Y%m%d-%H%M%S).json
```

## Rollback Procedures

See `runbook.md` for detailed rollback procedures.

Quick rollback:
1. Revert DNS to old region
2. Verify old environment health
3. Restore Terraform state if needed
4. Communicate status to stakeholders

## Testing

### Smoke Tests
Basic functionality verification:
```bash
# Health check
curl -f http://$(terraform output -raw alb_dns_name)/health

# Application endpoint
curl http://$(terraform output -raw alb_dns_name)/
```

### Load Testing
Performance validation before cutover:
```bash
# Using Apache Bench
ab -n 1000 -c 10 http://$(terraform output -raw alb_dns_name)/

# Using hey
hey -n 1000 -c 10 http://$(terraform output -raw alb_dns_name)/
```

## Maintenance

### Scaling
Adjust Auto Scaling Group capacity:
```bash
terraform apply -var="asg_desired_capacity=4"
```

### Updates
Apply configuration changes:
```bash
terraform plan
terraform apply
```

### Cleanup
Destroy resources (use with caution):
```bash
terraform destroy
```

## Troubleshooting

### Common Issues

**Issue**: Terraform import fails
```bash
# Verify resource exists in target region
aws <service> describe-<resource> --region us-west-2

# Check resource ID format in Terraform documentation
```

**Issue**: Health checks failing
```bash
# Check security group rules
terraform state show aws_security_group.app

# Verify application is running on instances
aws ec2 describe-instances --filters "Name=tag:Name,Values=myapp-app-instance-*"
```

**Issue**: Database connection errors
```bash
# Verify security group allows traffic
terraform output database_security_group_id

# Test connectivity from application subnet
telnet $(terraform output -raw db_instance_endpoint) 3306
```

### Getting Help

1. Check CloudWatch logs for application errors
2. Review security group configurations
3. Verify network connectivity
4. Consult `runbook.md` for detailed troubleshooting steps

## Migration Checklist

Pre-Migration:
- [ ] Review all documentation
- [ ] Backup Terraform state
- [ ] Create database snapshot
- [ ] Reduce DNS TTL (48 hours before)
- [ ] Test rollback procedures
- [ ] Notify stakeholders

During Migration:
- [ ] Enable maintenance mode
- [ ] Deploy infrastructure in target region
- [ ] Migrate database
- [ ] Update DNS records
- [ ] Verify application health
- [ ] Monitor traffic

Post-Migration:
- [ ] Increase DNS TTL
- [ ] Update documentation
- [ ] Clean up old region resources
- [ ] Conduct post-mortem

## Documentation

- `state-migration.md`: Terraform state migration procedures
- `runbook.md`: Complete migration runbook with cutover procedures
- `id-mapping.csv`: Resource ID mapping between regions

## Support

For issues or questions:
- Review documentation in this repository
- Check AWS documentation for service-specific issues
- Consult Terraform documentation for provider issues

## License

Internal use only.

## Version History

- v1.0.0: Initial release with complete multi-region DR migration
