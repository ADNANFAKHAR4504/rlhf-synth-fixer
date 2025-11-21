# ECS Fargate with RDS Aurora Infrastructure

This CloudFormation template deploys a production-ready containerized web application infrastructure using AWS ECS Fargate and RDS Aurora MySQL.

## Architecture

The infrastructure includes:

- **VPC**: Custom VPC (10.0.0.0/16) with 2 public and 2 private subnets across 2 availability zones
- **ECS Fargate**: Cluster running containerized application with minimum 2 tasks for high availability
- **RDS Aurora MySQL**: Database cluster with one writer instance for data persistence
- **Application Load Balancer**: Internet-facing ALB with path-based routing for `/api/*` and `/health` endpoints
- **Secrets Manager**: Secure storage for database credentials
- **NAT Gateways**: Two NAT gateways (one per AZ) for outbound internet access from private subnets
- **IAM Roles**: Task execution and task roles with proper permissions

## Prerequisites

1. AWS CLI installed and configured
2. AWS account with appropriate permissions
3. Docker image available in ECR or Docker Hub

## Parameters

- **EnvironmentSuffix**: Environment identifier for resource naming (default: "dev")
- **ContainerImage**: Docker image URI for the application (default: "nginx:latest")
- **DBUsername**: Database master username (default: "dbadmin")

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name inventory-app-dev \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=ContainerImage,ParameterValue=your-account.dkr.ecr.us-east-1.amazonaws.com/inventory-app:latest \
    ParameterKey=DBUsername,ParameterValue=dbadmin \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name inventory-app-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name inventory-app-dev \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Accessing the Application

After deployment, retrieve the ALB DNS name:

```bash
aws cloudformation describe-stacks \
  --stack-name inventory-app-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text \
  --region us-east-1
```

Access the application:
- Health check: `http://<ALB-DNS>/health`
- API endpoints: `http://<ALB-DNS>/api/*`

## Database Connection

The database credentials are stored in AWS Secrets Manager. The ECS tasks automatically retrieve these credentials at runtime.

To manually retrieve the database endpoint:

```bash
aws cloudformation describe-stacks \
  --stack-name inventory-app-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`RDSEndpoint`].OutputValue' \
  --output text \
  --region us-east-1
```

## Updating the Service

To update the application with a new Docker image:

1. Update the task definition with the new image
2. Update the ECS service to use the new task definition

```bash
aws ecs update-service \
  --cluster ecs-cluster-dev \
  --service inventory-service-dev \
  --force-new-deployment \
  --region us-east-1
```

## Scaling

To scale the ECS service:

```bash
aws ecs update-service \
  --cluster ecs-cluster-dev \
  --service inventory-service-dev \
  --desired-count 4 \
  --region us-east-1
```

## Cost Optimization

The infrastructure is designed with cost optimization in mind:
- Uses Fargate Spot capacity providers for cost savings
- RDS Aurora with single instance (can be upgraded to multi-AZ for production)
- CloudWatch Logs retention set to 7 days

## Security Features

- Database credentials stored in Secrets Manager
- Private subnets for ECS tasks and RDS instances
- Security groups with least privilege access
- Encrypted RDS storage
- IAM roles with minimal required permissions

## Resources Created

### Networking
- 1 VPC (10.0.0.0/16)
- 2 Public Subnets (10.0.1.0/24, 10.0.2.0/24)
- 2 Private Subnets (10.0.11.0/24, 10.0.12.0/24)
- 1 Internet Gateway
- 2 NAT Gateways
- 3 Route Tables (1 public, 2 private)

### Compute
- 1 ECS Cluster
- 1 ECS Service (2 tasks minimum)
- 1 ECS Task Definition (1 vCPU, 2GB memory)

### Database
- 1 RDS Aurora MySQL Cluster
- 1 RDS Aurora Instance (db.t3.small)
- 1 DB Subnet Group

### Load Balancing
- 1 Application Load Balancer
- 1 Target Group
- 1 ALB Listener (HTTP:80)
- 2 Listener Rules (path-based routing)

### Security
- 3 Security Groups (ALB, ECS Tasks, RDS)
- 2 IAM Roles (Task Execution, Task Runtime)
- 1 Secrets Manager Secret

### Monitoring
- 1 CloudWatch Log Group

## Stack Outputs

- **ALBDNSName**: DNS name of the Application Load Balancer
- **RDSEndpoint**: RDS Aurora cluster endpoint address
- **ECSClusterName**: Name of the ECS cluster
- **ECSServiceName**: Name of the ECS service
- **DBSecretArn**: ARN of the database credentials secret
- **VPCId**: VPC identifier

## Cleanup

To delete the stack:

```bash
aws cloudformation delete-stack \
  --stack-name inventory-app-dev \
  --region us-east-1
```

Note: The stack will take several minutes to delete as it includes NAT gateways and RDS instances.

## Troubleshooting

### ECS Tasks Not Starting

1. Check CloudWatch Logs:
```bash
aws logs tail /ecs/inventory-app-dev --follow
```

2. Verify task definition:
```bash
aws ecs describe-task-definition --task-definition inventory-app-dev
```

### ALB Health Checks Failing

1. Ensure the container exposes port 80
2. Verify `/health` endpoint returns HTTP 200
3. Check security group rules allow ALB to ECS traffic

### Database Connection Issues

1. Verify ECS task role has permissions to access Secrets Manager
2. Check security group rules allow ECS to RDS traffic on port 3306
3. Verify database credentials in Secrets Manager

## Monitoring

The infrastructure includes CloudWatch Logs for container logs. To view logs:

```bash
aws logs tail /ecs/inventory-app-dev --follow
```

## Tags

All resources are tagged with:
- `Name`: Resource-specific name with environment suffix
- `Environment`: Environment suffix value
- `CostCenter`: "inventory-management" (where applicable)

## Compliance

- **Deletion Protection**: Disabled on RDS cluster for destroyability
- **Encryption**: RDS storage encrypted at rest
- **Secrets Rotation**: Disabled (can be enabled if required)
- **Backup**: 7-day retention for RDS backups
