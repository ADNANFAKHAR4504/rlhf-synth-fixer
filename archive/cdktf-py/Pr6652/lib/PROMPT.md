Hey team,

We need to build a secure AWS compliance platform infrastructure for a financial services company that's establishing their cloud foundation for regulatory compliance work. They have strict security requirements around network isolation, data encryption, audit logging, and least-privilege access controls that we need to bake into the foundation.

The business wants a complete multi-tier architecture that can run containerized applications securely while meeting their compliance mandates. We're looking at a three-availability-zone setup with proper network segmentation, encrypted databases, and comprehensive logging. This is going into production to support their regulatory compliance platform, so everything needs to be enterprise-grade from day one.

We've been asked to use **CDKTF with Python** for this infrastructure. The compliance team has specific requirements around data encryption, backup retention, and audit trails that we need to implement correctly from the start.

## What we need to build

Create a secure AWS compliance platform infrastructure using **CDKTF with Python** for a financial services regulatory compliance system.

### Core Requirements

1. **VPC Networking - Multi-AZ Architecture**
   - VPC with CIDR 10.0.0.0/16
   - 3 public subnets across 3 availability zones
   - 3 private subnets across 3 availability zones
   - Internet Gateway for public subnet internet access
   - NAT Gateways in each public subnet for private subnet outbound traffic
   - Route tables configured appropriately

2. **Compute Infrastructure - ECS Fargate**
   - ECS Fargate cluster for containerized workloads
   - Nginx application running in containers
   - Tasks deployed in private subnets only
   - Task definitions with proper resource allocations
   - Service configuration with desired count

3. **Load Balancing**
   - Application Load Balancer in public subnets
   - HTTPS-only listener on port 443 from internet
   - Target group pointing to ECS services
   - Health checks configured for application availability

4. **Database - RDS Aurora MySQL**
   - Aurora MySQL cluster for high availability
   - 2 instances across availability zones
   - Encryption at rest enabled
   - 30-day automated backup retention
   - Deployed in private subnets
   - Security groups restricting access to ECS tasks only

5. **Storage - S3 Buckets**
   - S3 bucket for application logs
   - S3 bucket for application assets
   - AES256 server-side encryption on all buckets
   - Versioning enabled on all buckets
   - Block all public access enabled

6. **Logging - CloudWatch**
   - Log groups for all services (ALB, ECS, RDS)
   - 90-day retention period
   - KMS encryption for all log data

7. **Encryption - KMS**
   - Customer-managed KMS key
   - Automatic key rotation enabled
   - Used for encrypting CloudWatch logs, RDS data, and S3 buckets

8. **Security Groups - Least Privilege**
   - ALB security group: Allow HTTPS (443) from internet (0.0.0.0/0)
   - ECS security group: Allow traffic from ALB only
   - RDS security group: Allow traffic from ECS security group only
   - No overly permissive rules

9. **Compliance Tagging**
   - All resources tagged with: Environment, Project, CostCenter
   - Consistent tagging for cost allocation and compliance tracking

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **VPC** with public and private subnets across 3 availability zones
- Use **ECS Fargate** for compute (no EC2 instances)
- Use **Application Load Balancer** for load balancing
- Use **RDS Aurora MySQL** for database with encryption
- Use **S3** buckets with encryption and versioning
- Use **CloudWatch** for logging with 90-day retention
- Use **KMS** for customer-managed encryption keys
- Use **Security Groups** following least-privilege principle
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies, no DeletionProtection)
- For RDS: Set skip_final_snapshot = true
- For S3: Ensure buckets can be deleted (force_destroy may be needed for testing)
- All resource names MUST include environmentSuffix parameter

### Constraints

- VPC CIDR must be exactly 10.0.0.0/16
- Must create exactly 6 subnets (3 public, 3 private) across 3 AZs
- ECS tasks must run in private subnets only
- NAT Gateways required for ECS tasks to access internet
- ALB must accept HTTPS only (port 443)
- RDS must have encryption at rest enabled
- RDS backup retention must be 30 days
- CloudWatch logs must be encrypted with KMS
- CloudWatch retention must be 90 days
- S3 buckets must use AES256 encryption
- S3 buckets must have versioning enabled
- S3 buckets must block all public access
- All security groups must follow least-privilege principle
- All resources must include three tags: Environment, Project, CostCenter
- Include proper error handling and logging
- All resources must be destroyable for testing (no Retain policies)

## Success Criteria

- Functionality: All services deploy successfully and can communicate as designed
- Performance: Multi-AZ deployment provides high availability
- Reliability: Automated backups and proper health checks configured
- Security: All data encrypted at rest, network isolation enforced, least-privilege access
- Resource Naming: All resources include environmentSuffix for parallel deployments
- Code Quality: Python code follows best practices, well-structured, documented
- Compliance: All resources properly tagged for cost allocation and compliance tracking

## What to deliver

- Complete CDKTF Python implementation
- VPC with public and private subnets across 3 AZs
- Internet Gateway and NAT Gateways
- ECS Fargate cluster with nginx application
- Application Load Balancer with HTTPS listener
- RDS Aurora MySQL cluster with encryption and backups
- S3 buckets with encryption and versioning
- CloudWatch log groups with encryption and retention
- KMS customer-managed key with rotation
- Security groups implementing least-privilege access
- IAM roles and policies for ECS tasks
- Unit tests for all components
- Documentation and deployment instructions
