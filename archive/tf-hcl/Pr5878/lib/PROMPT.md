# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
>
> Platform: **terraform**
> Language: **hcl**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A growing e-commerce platform needs to deploy a highly available web application that can handle variable traffic loads while maintaining strict security requirements. The application requires both public-facing components and secure backend services with proper isolation.

## Problem Statement

Create a Terraform configuration to deploy a production-ready web application infrastructure. The configuration must:

1. Define a VPC with 3 public and 3 private subnets across different AZs.
2. Configure an Application Load Balancer in public subnets with HTTPS listener using an existing ACM certificate ARN provided via variable.
3. Set up an Auto Scaling Group in private subnets with launch template using Amazon Linux 2023 AMI and t3.medium instances.
4. Create an RDS MySQL instance in private subnets with Multi-AZ deployment and automated backups retained for 7 days.
5. Configure S3 bucket for static assets with CloudFront distribution for global content delivery.
6. Implement security groups allowing HTTPS traffic to ALB, HTTP from ALB to EC2, and MySQL from EC2 to RDS.
7. Set up CloudWatch alarms for ALB target health and RDS CPU utilization above 80%.
8. Create IAM roles with instance profiles for EC2 instances to access S3 bucket and CloudWatch.
9. Configure Auto Scaling policies to scale based on 70% CPU threshold.
10. Output the ALB DNS name, CloudFront distribution URL, and RDS endpoint.

**Expected output**: A modular Terraform configuration with separate files for networking, compute, database, and monitoring resources. Variables should be used for customizable parameters like instance types, database size, and certificate ARN. The configuration should be ready for terraform plan and apply commands.

## Environment Setup

Production web application infrastructure deployed in us-east-1 across 3 availability zones. Uses Application Load Balancer for traffic distribution, Auto Scaling Group with EC2 instances running Amazon Linux 2023, RDS MySQL 8.0 for database, and S3 for static assets. VPC configured with public subnets for ALB and private subnets for EC2 and RDS. NAT Gateways provide outbound internet access for private instances. Requires Terraform 1.5+ with AWS provider 5.x. ACM certificate must be pre-validated in us-east-1.

## Constraints and Requirements

- Use only AWS provider version ~> 5.0
- All resources must be tagged with Environment, Project, and ManagedBy tags
- Application Load Balancer must use HTTPS with ACM certificate
- Auto Scaling Group must scale between 2 and 10 instances based on CPU utilization
- RDS instance must be encrypted at rest using AWS KMS
- All EC2 instances must use IMDSv2 for metadata access
- Security groups must follow least privilege with explicit ingress/egress rules
- S3 buckets must have versioning enabled and block public access
- CloudWatch alarms must be created for ALB unhealthy hosts and RDS CPU
- IAM roles must use inline policies with specific resource ARNs

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environment_suffix` variable for naming (e.g., `resource-name-${var.environment_suffix}`)

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately (Environment, Project, ManagedBy)

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid using lifecycle prevent_destroy unless absolutely required
- Set `skip_final_snapshot = true` for RDS to allow clean destruction

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully using `terraform plan` and `terraform apply`
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environment_suffix
- Infrastructure can be cleanly destroyed with `terraform destroy`
- All outputs (ALB DNS, CloudFront URL, RDS endpoint) are properly exported
