# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
> 
> Platform: **Terraform**  
> Language: **HCL**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A growing e-commerce company needs to deploy their product catalog API on AWS. The API serves millions of requests daily and requires automatic scaling, SSL termination, and integration with their existing RDS database. The deployment must support blue-green deployments for zero-downtime updates.

## Problem Statement
Create a Terraform configuration to deploy a high-availability web application infrastructure. The configuration must:

1. Define a VPC with CIDR 10.0.0.0/16 with public and private subnets across 2 AZs
2. Create an Internet Gateway and NAT Gateway for connectivity
3. Deploy an Application Load Balancer in public subnets with HTTPS listener on port 443
4. Configure Auto Scaling Group with launch template for t3.medium instances in private subnets
5. Set up CPU-based scaling policy with 70% target for scale-out and 30% for scale-in
6. Create security groups allowing HTTPS traffic to ALB and HTTP traffic from ALB to instances
7. Reference an existing RDS instance by subnet group name 'prod-db-subnet-group'
8. Request ACM certificate for domain 'api.example.com' with DNS validation
9. Configure ALB target group with health check on /health endpoint
10. Output the ALB DNS name and Auto Scaling Group name

Expected output: A complete Terraform configuration that creates a production-ready web application infrastructure with automatic scaling, SSL termination, and proper network isolation. The configuration should be modular with clear resource naming and comprehensive tagging.

## Environment Setup
Deploy web application infrastructure in us-east-1 region using Application Load Balancer, Auto Scaling Group with EC2 instances, and connection to existing RDS PostgreSQL database. Requires Terraform 1.5+ with AWS provider 5.x configured. VPC with public subnets for ALB and private subnets for EC2 instances across 2 availability zones. NAT Gateway required for outbound internet access from private subnets. Existing RDS instance in separate private subnets must be accessible from application tier.

## Constraints and Requirements
- Use Application Load Balancer with path-based routing for API versioning
- Auto Scaling Group must scale between 2-10 instances based on CPU utilization
- EC2 instances must use Amazon Linux 2023 AMI with instance type t3.medium
- Deploy across exactly 2 availability zones in the region
- RDS subnet group must be separate from application subnets
- Security groups must follow least privilege with specific port allowances
- Use AWS Certificate Manager for SSL certificate management
- Enable CloudWatch detailed monitoring on all EC2 instances
- Tag all resources with Environment, Project, and ManagedBy tags

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
