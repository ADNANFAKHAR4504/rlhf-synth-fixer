# Cloud Environment Setup

> **CRITICAL REQUIREMENT: This task MUST be implemented using cfn with json**
>
> Platform: **cfn**
> Language: **json**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A fintech startup needs to establish a secure cloud foundation for their payment processing platform. They require strict network isolation between application tiers and must meet PCI DSS compliance requirements for network segmentation.

## Problem Statement

Create a CloudFormation template to deploy a production-ready VPC infrastructure for a three-tier web application. The configuration must:

1. Create a VPC with CIDR 10.0.0.0/16 with DNS support and DNS hostnames enabled.
2. Deploy 9 subnets across 3 AZs: 3 public (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24), 3 private (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24), and 3 database (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24).
3. Configure an Internet Gateway attached to the VPC with proper routes for public subnets.
4. Deploy 3 NAT Gateways (one per AZ) in public subnets with Elastic IPs.
5. Create separate route tables for each tier with appropriate routes and associations.
6. Implement Network ACLs that allow only HTTP/HTTPS from internet to public subnets, application traffic from public to private subnets, and database traffic from private to database subnets.
7. Enable VPC Flow Logs sending to a new CloudWatch Logs group with 7-day retention.
8. Apply consistent tagging with parameters for Environment (prod), Project (payment-platform), and CostCenter values.
9. Output the VPC ID, subnet IDs grouped by tier, and NAT Gateway IDs for use by other stacks.

Expected output: A complete CloudFormation JSON template that creates all networking components with proper dependencies and follows AWS best practices for production workloads. The template should be reusable across regions with minimal modifications.

## Constraints and Requirements

1. VPC CIDR must be 10.0.0.0/16 to align with corporate IP allocation standards
2. Subnets must span exactly 3 availability zones for high availability
3. Private subnets must not have direct internet access except through NAT
4. Each subnet must use a /24 CIDR block
5. NAT Gateways must be deployed in each AZ to avoid cross-AZ traffic charges
6. All route tables must have explicit names following the pattern {env}-{tier}-{az}-rtb
7. Network ACLs must deny all traffic by default and explicitly allow only required ports
8. VPC Flow Logs must be enabled and sent to CloudWatch Logs
9. All resources must be tagged with Environment, Project, and CostCenter tags

## Environment Setup

AWS us-east-1 region deployment for a three-tier architecture with public, private, and database subnets across 3 availability zones. Requires CloudFormation JSON template creation with VPC, subnets, internet gateway, NAT gateways, route tables, and security groups. The infrastructure supports EC2 instances in private subnets accessing internet through NAT, ALB in public subnets, and RDS instances in database subnets. Network segmentation enforced via security groups and NACLs for PCI compliance.

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **us-east-1**
