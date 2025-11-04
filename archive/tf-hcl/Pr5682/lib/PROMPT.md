# Cloud Environment Setup

> **CRITICAL REQUIREMENT: This task MUST be implemented using Terraform with HCL**
> 
> Platform: **tf**  
> Language: **hcl**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A fintech startup needs to establish a secure network foundation in AWS for their payment processing application. The infrastructure must comply with PCI DSS requirements for network segmentation and access control. The team requires a repeatable infrastructure template to deploy identical environments across multiple regions.

## Problem Statement

Create a Terraform configuration to deploy a multi-tier VPC architecture for a payment processing application. The configuration must:

1. Create a VPC with CIDR block 10.0.0.0/16 and enable DNS hostnames
2. Deploy 6 subnets across 3 availability zones:
   - 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
   - 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
3. Configure an Internet Gateway attached to the VPC with route tables for public subnets
4. Create 3 NAT Gateways (one per public subnet) with Elastic IPs for private subnet outbound traffic
5. Implement separate route tables for public and private subnets with appropriate routes
6. Define security groups for:
   - Web tier (allow HTTPS from 0.0.0.0/0)
   - Application tier (allow traffic only from web tier)
7. Configure Network ACLs that deny all inbound/outbound traffic by default, then explicitly allow HTTPS, ephemeral ports, and necessary protocols
8. Use Terraform variables for environment name and allowed SSH CIDR block
9. Output the VPC ID, subnet IDs, and security group IDs for use by other modules

Expected output: A complete Terraform HCL configuration that creates a production-ready VPC with proper network segmentation, high availability across 3 AZs, and security controls suitable for PCI compliance. The configuration should be parameterized for reusability and include helpful descriptions for each resource.

## Constraints and Requirements

- VPC CIDR block must be 10.0.0.0/16 with non-overlapping subnet allocations
- Public subnets must use only the first half of the VPC CIDR range
- All private subnets must have dedicated NAT gateways for high availability
- Security groups must follow least-privilege principle with explicit ingress rules only
- Network ACLs must deny all traffic by default except explicitly allowed ports
- Configuration must use Terraform variables for region-specific configurations

## Environment Setup

New AWS environment in us-east-1 region for payment processing infrastructure. Requires VPC with 10.0.0.0/16 CIDR spanning 3 availability zones. Each AZ needs one public subnet for load balancers and one private subnet for application servers. NAT Gateways in each public subnet provide outbound internet access for private resources. Security groups enforce strict ingress rules for HTTPS (443), SSH (22) from bastion only. Network ACLs provide additional layer of subnet-level security.

---

## Implementation Guidelines

### Platform Requirements
- Use Terraform as the IaC framework
- All code must be written in HCL
- Follow Terraform best practices for resource organization
- Ensure all resources use the `environment_suffix` variable for naming

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
- Avoid prevent_destroy lifecycle rules unless required

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environment_suffix
- Infrastructure can be cleanly destroyed
