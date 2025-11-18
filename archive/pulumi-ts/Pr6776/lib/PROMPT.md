# Payment Processing Web Application Infrastructure

Hey team,

We're deploying infrastructure for a fintech startup's payment processing web application. The business is handling sensitive financial transactions and needs PCI DSS compliant infrastructure with complete audit trails and data isolation. I've been tasked with building this using **Pulumi with TypeScript** on AWS.

The challenge is creating a production-grade, highly available infrastructure that meets strict financial industry requirements. We need multi-AZ redundancy, encrypted data at rest, comprehensive logging, and complete infrastructure traceability for compliance audits.

The application processes real-time payment transactions through a containerized service running on ECS Fargate, with transaction data persisted in Aurora MySQL. All traffic flows through an Application Load Balancer with SSL termination, and we need detailed VPC flow logs stored in S3 with lifecycle management for cost optimization.

## What we need to build

Create a production-grade payment processing infrastructure using **Pulumi with TypeScript** that deploys a highly available web application with strict security and compliance requirements.

### Core Requirements

1. **VPC Network Architecture**
   - VPC with 3 public subnets and 3 private subnets across different availability zones
   - Internet Gateway for public subnet connectivity
   - NAT Gateways in each availability zone for private subnet outbound access
   - Route tables properly configured for public and private subnets
   - VPC flow logs enabled and routed to S3 bucket

2. **Container Infrastructure (ECS)**
   - ECS cluster using Fargate launch type
   - Task definition for payment service container with specific CPU and memory limits
   - ECS service running tasks in private subnets with no direct internet access
   - Security group allowing inbound connections from ALB only
   - CloudWatch log group for ECS task logs with 7-year retention

3. **Database Layer (RDS Aurora MySQL)**
   - Aurora MySQL cluster with multi-AZ deployment
   - Encrypted at rest using customer-managed KMS keys
   - DB subnet group spanning private subnets
   - Automated backups with minimum 35-day retention
   - Security group allowing connections from ECS tasks only
   - CloudWatch log group for slow query logs with 7-year retention

4. **Load Balancing (Application Load Balancer)**
   - ALB deployed across public subnets
   - HTTPS listener with ACM certificate for SSL termination
   - Target group configured for ECS Fargate tasks
   - Security group allowing HTTPS traffic only (port 443)
   - Health check configuration for target group

5. **Storage and Logging (S3)**
   - S3 bucket for VPC flow logs with proper access policies
   - Lifecycle rule to transition objects to Glacier after 90 days
   - Bucket encryption enabled
   - Versioning enabled for compliance

6. **IAM Roles and Permissions**
   - ECS task execution role with permissions for ECR, CloudWatch Logs
   - ECS task role with specific permissions for S3 and Secrets Manager (no wildcard permissions)
   - All IAM policies follow principle of least privilege
   - No wildcard (*) permissions allowed

7. **Monitoring and Compliance**
   - CloudWatch log groups with 7-year retention for audit requirements
   - VPC flow logs capturing all network traffic
   - KMS keys for encryption with proper key policies
   - Comprehensive tagging: Environment, Application, CostCenter on all resources

8. **Security Requirements**
   - All security groups explicitly deny traffic except required ports
   - RDS encryption at rest with KMS customer-managed keys
   - All sensitive data (passwords, secrets) stored in AWS Secrets Manager
   - No direct internet access for ECS tasks (private subnets only)
   - ALB terminates SSL with ACM certificates

9. **Resource Naming and Configuration**
   - All named resources must include **environmentSuffix** for uniqueness
   - Follow naming convention: {resource-type}-{environmentSuffix}
   - No deletion protection or Retain policies (all resources must be destroyable)

10. **Stack Outputs**
    - ALB DNS name for application access
    - RDS cluster endpoint for database connections
    - S3 bucket name for VPC flow logs
    - All critical resource identifiers for operations

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use VPC for network isolation with public and private subnets
- Use ECS Fargate for containerized application workloads
- Use RDS Aurora MySQL for transaction database with multi-AZ
- Use Application Load Balancer for traffic distribution with HTTPS
- Use S3 for VPC flow logs with Glacier lifecycle transitions
- Use KMS for encryption key management
- Use ACM for SSL certificate management
- Use CloudWatch for monitoring and log retention
- Use AWS Secrets Manager for sensitive data storage
- Deploy to **us-east-2** region
- Resource names must include **environmentSuffix** for environment isolation
- All resources must be fully destroyable (no deletion protection)

### Constraints

- VPC: 3 public + 3 private subnets across different AZs
- NAT Gateways: one per availability zone for high availability
- ECS: tasks must run in private subnets with no direct internet access
- ECS: specific CPU and memory limits required (e.g., 512 CPU, 1024 memory)
- RDS: multi-AZ deployment mandatory
- RDS: encrypted storage with customer-managed KMS keys required
- RDS: automated backups retained for minimum 35 days
- ALB: must terminate SSL with ACM certificates
- Security groups: explicitly deny all traffic except required ports
- IAM: no wildcard permissions, least privilege only
- CloudWatch Logs: 7-year retention (2555 days) for compliance
- S3: lifecycle policy transitions to Glacier after 90 days
- VPC flow logs: must be enabled and stored in S3
- Tags: Environment, Application, CostCenter required on all resources
- All passwords and secrets: use Pulumi secrets or AWS Secrets Manager
- All resources: no deletion protection (must be destroyable)

## Success Criteria

- **Functionality**: Complete multi-tier application infrastructure with networking, compute, database, and load balancing
- **High Availability**: Multi-AZ deployment with NAT Gateways in each AZ for redundancy
- **Security**: Encrypted data at rest, SSL termination, private subnet isolation, least privilege IAM
- **Compliance**: 7-year log retention, VPC flow logs, comprehensive tagging for audit trails
- **Resource Naming**: All resources include environmentSuffix for environment uniqueness
- **Cost Optimization**: S3 lifecycle policies reduce storage costs, Fargate enables right-sizing
- **Observability**: CloudWatch logs, VPC flow logs, proper monitoring configuration
- **Code Quality**: TypeScript implementation with proper typing, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/
- VPC with 3 public and 3 private subnets, Internet Gateway, NAT Gateways
- ECS cluster, task definition, and service (Fargate launch type)
- RDS Aurora MySQL cluster (multi-AZ, encrypted with KMS)
- Application Load Balancer with HTTPS listener and target group
- S3 bucket for VPC flow logs with Glacier lifecycle policy
- IAM roles and policies (ECS task execution, ECS task role)
- Security groups for ALB, ECS tasks, and RDS
- KMS keys for RDS encryption
- ACM certificate for ALB HTTPS (self-signed or request-certificate approach)
- CloudWatch log groups with 7-year retention
- VPC flow logs configuration
- Comprehensive resource tagging (Environment, Application, CostCenter)
- Unit tests for all Pulumi components
- Documentation with deployment instructions and architecture overview
