# Multi-Environment Terraform Infrastructure

This Terraform configuration creates a complete, production-ready multi-environment infrastructure setup using Terraform workspaces with all AWS best practices applied.

## Architecture

- **VPC**: 3 availability zones with public and private subnets
- **Load Balancing**: Application Load Balancer with health checks
- **Compute**: ECS Fargate cluster with auto-scaling
- **Database**: Aurora PostgreSQL Multi-AZ cluster with automated backups
- **Serverless**: Lambda function for background processing
- **State Management**: S3 backend with versioning and DynamoDB locking
- **Monitoring**: CloudWatch logs, alarms, and SNS notifications
- **Security**: IAM least privilege, security groups, encryption at rest

## Deployment

### Initialize Terraform

```bash
cd lib
terraform init
```

### Deploy Infrastructure

```bash
terraform apply -var="environment_suffix=<unique-id>"
```

### Outputs

After successful deployment, retrieve outputs:

```bash
terraform output
```

## Cleanup

```bash
terraform destroy -var="environment_suffix=<unique-id>"
```

## Important Notes

- All resources include environment_suffix for uniqueness
- Random password generation for Aurora (no hardcoded secrets)
- All resources are destroyable (skip_final_snapshot enabled)
- Multi-AZ deployment for high availability
