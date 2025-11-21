# Transaction Processing Infrastructure

This Pulumi Python program deploys a complete cloud environment for transaction processing on AWS.

## Architecture

- **VPC**: 10.0.0.0/16 with 2 public and 2 private subnets across 2 availability zones
- **ECS Fargate**: Container orchestration for transaction processing services
- **RDS Aurora PostgreSQL**: Managed database with writer and reader instances
- **Application Load Balancer**: Traffic distribution to ECS services
- **S3 Buckets**: Storage for application logs and processed transaction data
- **CloudWatch**: Centralized logging with 30-day retention
- **VPC Endpoints**: S3 and DynamoDB endpoints for cost optimization

## Prerequisites

- Python 3.9 or later
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create resources

## Configuration

Set the following Pulumi configuration values:

```bash
pulumi config set aws:region us-east-1
pulumi config set environment_suffix <your-suffix>
pulumi config set --secret db_password <your-db-password>
```

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

3. Configure environment:
```bash
pulumi config set environment_suffix $(date +%s)
pulumi config set --secret db_password "YourSecurePassword123!"
```

4. Preview changes:
```bash
pulumi preview
```

5. Deploy infrastructure:
```bash
pulumi up
```

## Outputs

After deployment, the following outputs are available:

- `alb_dns_name`: DNS name of the Application Load Balancer
- `rds_endpoint`: Writer endpoint for Aurora PostgreSQL cluster
- `rds_reader_endpoint`: Reader endpoint for Aurora PostgreSQL cluster
- `app_logs_bucket`: S3 bucket name for application logs
- `transaction_data_bucket`: S3 bucket name for transaction data
- `ecs_cluster_name`: Name of the ECS cluster
- `ecs_task_role_arn`: ARN of the ECS task role (for task definitions)

## Security

- ECS tasks run in private subnets with no direct internet access
- RDS Aurora cluster is in private subnets, not publicly accessible
- Security groups enforce least-privilege network access
- S3 buckets use server-side encryption
- IAM roles follow least-privilege principle

## Cost Optimization

- Single NAT Gateway for all private subnets
- VPC Endpoints for S3 and DynamoDB to reduce data transfer costs
- ARM-based (Graviton) instances for compute resources
- Aurora with minimal backup retention for synthetic testing

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be destroyable without manual intervention.
