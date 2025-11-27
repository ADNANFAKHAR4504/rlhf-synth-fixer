# CloudFormation Solution: Retail Inventory Management System

This solution provides a complete infrastructure for a containerized retail inventory management application using ECS Fargate, RDS Aurora MySQL, and Application Load Balancer.

## Architecture Overview

The infrastructure includes:
- VPC with 2 public and 2 private subnets across 2 availability zones
- Application Load Balancer in public subnets for internet-facing traffic
- ECS Fargate cluster running containerized application in private subnets
- RDS Aurora MySQL cluster in private subnets for data persistence
- Secrets Manager for secure database credential storage
- IAM roles for ECS task execution and application access
- CloudWatch Logs for application logging
- Path-based routing for /api/* and /health endpoints

## Key Features

1. **High Availability**: Infrastructure spans 2 availability zones with redundant NAT Gateways and ECS tasks
2. **Security**:
   - Private subnets for ECS and RDS
   - Database credentials stored in Secrets Manager
   - Security groups with least-privilege access
   - IAM roles following principle of least privilege
3. **Scalability**: ECS Fargate with configurable task count (minimum 2 for HA)
4. **Monitoring**: CloudWatch Logs integration and Container Insights enabled
5. **Destroyability**: DeletionProtection disabled on RDS cluster for easy cleanup
6. **Path-based Routing**: ALB configured with listener rules for /api/* and /health endpoints
7. **Resource Naming**: All resources use EnvironmentSuffix parameter for unique naming

## Deployment Instructions

1. Ensure you have AWS CLI configured with appropriate credentials
2. Deploy the stack:
   ```bash
   aws cloudformation create-stack \
     --stack-name retail-inventory-dev \
     --template-body file://lib/TapStack.json \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
                  ParameterKey=ContainerImage,ParameterValue=nginx:latest \
                  ParameterKey=DBUsername,ParameterValue=admin \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```
3. Wait for stack creation to complete (15-20 minutes due to RDS Aurora and NAT Gateways)
4. Retrieve the ALB DNS name from stack outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name retail-inventory-dev \
     --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" \
     --output text
   ```

## Testing

1. Test the health endpoint:
   ```bash
   curl http://<ALB-DNS-NAME>/health
   ```
2. Test the API endpoint:
   ```bash
   curl http://<ALB-DNS-NAME>/api/inventory
   ```

## Cleanup

To delete all resources:
```bash
aws cloudformation delete-stack --stack-name retail-inventory-dev
```

Note: Deletion will take 15-20 minutes due to NAT Gateway cleanup delay.
