# PCI-DSS Compliant Payment Processing Environment

You are an expert AWS Infrastructure Engineer. Create infrastructure using **Pulumi with Python** for a PCI-DSS compliant payment processing environment in the **us-east-1** region.

## Requirements

### 1. Encrypted RDS Instance
- Create an encrypted RDS PostgreSQL instance for storing transaction data
- Use encryption at rest with AWS KMS
- Must be PCI-DSS compliant configuration
- Use Aurora Serverless v2 for faster provisioning and cost optimization
- Set minimum capacity to 0.5 ACU and maximum to 2 ACU
- Enable backup with 1-day retention
- Disable deletion protection for testing purposes
- Use db.t4g.micro equivalent capacity
- Place in private subnets

### 2. ECS Container Orchestration
- Create an ECS cluster for payment processing workloads
- Configure ECS task definitions with appropriate IAM roles
- Use Fargate launch type for serverless containers
- Configure task definitions with container specifications for payment processor
- Set appropriate CPU (256) and memory (512) limits
- Enable CloudWatch logging for containers

### 3. Network Architecture
- Create a VPC with CIDR 10.0.0.0/16
- Create 2 private subnets across 2 availability zones (10.0.1.0/24, 10.0.2.0/24)
- Create 2 public subnets across 2 availability zones (10.0.10.0/24, 10.0.11.0/24)
- Use VPC Endpoints for S3 and DynamoDB (avoid NAT Gateway costs)
- Configure route tables appropriately
- Enable VPC Flow Logs to S3 for audit logging

### 4. Security Configuration
- Create security groups with least privilege access
- RDS security group: Allow inbound on port 5432 only from ECS security group
- ECS security group: Allow outbound to RDS and AWS services
- All traffic must be encrypted in transit using TLS
- Enable encryption at rest for all data stores
- Implement network segmentation between public and private subnets

### 5. KMS Encryption
- Create a KMS key for RDS encryption
- Use separate KMS keys for different services where applicable
- Configure appropriate key policies
- Enable key rotation

### 6. Monitoring and Logging
- Enable CloudWatch logging for ECS tasks
- Create CloudWatch log groups with 7-day retention
- Enable RDS enhanced monitoring (if applicable)
- Configure VPC Flow Logs for network traffic audit
- Store logs in encrypted S3 bucket

### 7. IAM Roles and Policies
- Create ECS task execution role with permissions to pull images and write logs
- Create ECS task role with permissions to access RDS and other required services
- Follow least privilege principle
- Use managed policies where appropriate

### 8. S3 Bucket for Logs
- Create encrypted S3 bucket for storing VPC Flow Logs
- Enable versioning
- Set lifecycle policy to delete objects after 30 days
- Block public access
- Enable auto-delete objects for easy cleanup

## Technical Constraints

1. All resource names must include `environment_suffix` parameter (e.g., `payment-vpc-{environment_suffix}`)
2. Use the region specified in `lib/AWS_REGION` file (us-east-1)
3. All resources must be destroyable (no retention policies)
4. Follow Pulumi Python best practices
5. Update the TapStack class in `lib/tap_stack.py` to instantiate the required infrastructure
6. Create modular components for different resource groups (VPC, RDS, ECS, Security)

## Code Structure

Organize the code into the following files within the `lib/` directory:

1. `tap_stack.py` - Main stack orchestrator (update existing file)
2. `vpc_stack.py` - VPC, subnets, route tables, VPC endpoints, flow logs
3. `security_stack.py` - Security groups, KMS keys
4. `rds_stack.py` - RDS Aurora Serverless cluster
5. `ecs_stack.py` - ECS cluster, task definitions, IAM roles
6. `monitoring_stack.py` - CloudWatch log groups, S3 bucket for logs

Each file should be a Pulumi ComponentResource that accepts `environment_suffix` as a parameter.

## Output Requirements

Provide complete, production-ready code with:
- Comprehensive inline comments explaining PCI-DSS compliance aspects
- Proper error handling and validation
- Type hints for all function parameters
- One code block per file
- Clear imports and dependencies

Export key resource identifiers (VPC ID, security group IDs, RDS endpoint, ECS cluster name) as Pulumi outputs.